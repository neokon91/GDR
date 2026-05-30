(ctx => {
  const {
    asArray,
    cardClass,
    cardHtml,
    escapeHtml,
    fieldText,
    hasLinks,
    hasPrivateFields,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pluginStatus,
    pressure,
    publicCandidate,
    readJsonRel,
    renderCardGrid,
    renderEmptyState
  } = ctx;

  const ARTICLE_SOURCES = [
    '"Mondi/Luoghi"',
    '"Mondi/Fazioni"',
    '"Mondi/Personaggi"',
    '"Mondi/Culture"',
    '"Mondi/Religioni"',
    '"Mondi/Timeline"',
    '"Mondi/Storia"',
    '"Mondi/Segreti"',
    '"Mondi/Missioni"',
    '"Mondi/Oggetti"',
    '"Mondi/Risorse"',
    '"Mondi/Compendium"'
  ];

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function" ? data.array() : asArray(value);
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function folderIndex(page) {
    const stem = String(page?.file?.path ?? "").replace(/\.md$/, "");
    const parts = stem.split("/");
    return parts.length > 1 && parts[parts.length - 1] === parts[parts.length - 2];
  }

  function realPage(page) {
    return isReal(page)
      && !folderIndex(page)
      && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function selectedWorldPath(worldLink = "") {
    return linkKey(worldLink);
  }

  function matchesWorld(page, selectedWorld) {
    return !selectedWorld || linkKey(page?.mondo) === selectedWorld || page?.file?.path === selectedWorld;
  }

  function pages(dv, source, selectedWorld = "", predicate = () => true) {
    return dv.pages(source)
      .where(page => realPage(page) && matchesWorld(page, selectedWorld) && predicate(page))
      .array();
  }

  function uniqueByPath(rows) {
    const seen = new Set();
    return rows.filter(page => {
      const path = String(page?.file?.path ?? "");
      if (!path || seen.has(path)) return false;
      seen.add(path);
      return true;
    });
  }

  function hasCodexIdentity(dv, page) {
    return hasValue(dv, page?.gancio)
      || hasValue(dv, page?.premessa)
      || hasValue(dv, page?.impressione)
      || hasValue(dv, page?.identita)
      || hasValue(dv, page?.descrizione)
      || hasValue(dv, page?.vuole)
      || hasValue(dv, page?.agenda)
      || hasValue(dv, page?.tipo)
      || hasValue(dv, page?.categoria);
  }

  function hasCodexTableUse(dv, page) {
    return hasValue(dv, page?.uso_al_tavolo)
      || hasValue(dv, page?.promessa_al_tavolo)
      || hasValue(dv, page?.prossima_mossa)
      || hasValue(dv, page?.scene)
      || hasValue(dv, page?.innesco)
      || hasValue(dv, page?.posta)
      || hasValue(dv, page?.player_safe);
  }

  function hasCodexDmLayer(dv, page) {
    if (page?.pubblico === true) return true;
    return hasValue(dv, page?.segreto)
      || hasValue(dv, page?.segreti)
      || hasValue(dv, page?.verita_nascosta)
      || hasValue(dv, page?.prossima_mossa)
      || hasValue(dv, page?.propaga_a)
      || hasValue(dv, page?.entita_impattate);
  }

  function hasCodexConnections(dv, page) {
    return hasValue(dv, page?.connessioni)
      || hasValue(dv, page?.luoghi)
      || hasValue(dv, page?.fazioni)
      || hasValue(dv, page?.personaggi)
      || hasValue(dv, page?.missioni)
      || hasValue(dv, page?.tracciati)
      || hasValue(dv, page?.luogo)
      || hasValue(dv, page?.luogo_padre)
      || hasValue(dv, page?.mondo);
  }

  function codexArticleReadiness(dv, page) {
    const checks = [
      ["identita", hasCodexIdentity(dv, page)],
      ["al tavolo", hasCodexTableUse(dv, page)],
      ["player-safe", hasValue(dv, page?.player_safe) || page?.pubblico !== true],
      ["DM", hasCodexDmLayer(dv, page)],
      ["connessioni vive", hasCodexConnections(dv, page)]
    ];
    const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
    return { ready: missing.length === 0, missing };
  }

  function worldIdentityMissing(dv, world) {
    return [
      ["gancio", world?.gancio ?? world?.premessa, "Scrivi promessa o gancio leggibile in una frase."],
      ["tono", world?.tono, "Definisci tono e aspettativa al tavolo."],
      ["conflitto centrale", world?.conflitto_centrale, "Metti il conflitto che muove il mondo."],
      ["luoghi iconici", world?.luoghi_iconici, "Collega almeno un luogo fondativo."],
      ["fazioni principali", world?.fazioni_principali, "Collega poteri, culti o fazioni fondative."],
      ["misteri pubblici", world?.misteri_pubblici, "Aggiungi un mistero mostrabile ai giocatori."]
    ].filter(([, value]) => !hasValue(dv, value));
  }

  function worldIdentityComplete(dv, world) {
    return worldIdentityMissing(dv, world).length === 0;
  }

  function codexCard(dv, page, badge = "Codex") {
    const ready = codexArticleReadiness(dv, page);
    return cardHtml({
      title: pageTitle(page),
      meta: [page.categoria ?? page.tipo, page.stato, ready.ready ? "completo" : "parziale"].filter(Boolean).join(" - "),
      azione: fieldText(page.gancio ?? page.uso_al_tavolo ?? page.prossima_mossa ?? page.impressione ?? page.vuole) || "Compila gancio o uso al tavolo.",
      importa: ready.ready
        ? fieldText(page.player_safe ?? page.connessioni ?? page.luoghi ?? page.fazioni ?? page.missioni)
        : `Manca: ${ready.missing.join(", ")}`,
      link: page.file?.path ?? "",
      badge: page.pubblico === true ? "Player-safe" : badge,
      cls: cardClass(page, "gdr-info-card compact", [page.pubblico === true ? "gdr-card-player" : "", ready.ready ? "gdr-kind-ready" : "gdr-kind-missing"].filter(Boolean).join(" "))
    });
  }

  function sortByPressure(rows) {
    return [...rows].sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function sortByMtime(rows) {
    return [...rows].sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function worldBibleData(dv, worldLink = "") {
    const selectedWorld = selectedWorldPath(worldLink);
    const worlds = pages(dv, '"Mondi"', selectedWorld, page => page.categoria === "mondo")
      .sort((left, right) => String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
    const articles = uniqueByPath(ARTICLE_SOURCES.flatMap(source => pages(dv, source, selectedWorld)))
      .filter(page => page.categoria !== "mondo");
    const maps = pages(dv, '"Risorse/Mappe"', selectedWorld, page => page.file?.name !== "Mappe");
    const publicReady = sortByMtime([...articles, ...maps]
      .filter(page => page.pubblico === true && hasValue(dv, page.player_safe) && !hasPrivateFields(page)));
    const playable = sortByPressure(articles
      .filter(page => hasCodexIdentity(dv, page) && hasCodexTableUse(dv, page) && hasCodexConnections(dv, page)));
    const worldGaps = worlds.flatMap(world => worldIdentityMissing(dv, world).map(([field, , action]) => ({
      page: world,
      field,
      action
    })));
    const articleGaps = articles.flatMap(page => {
      const ready = codexArticleReadiness(dv, page);
      return ready.ready ? [] : [{
        page,
        missing: ready.missing.join(", "),
        action: "Completa il campo mancante o archivia se non serve al tavolo."
      }];
    });
    const publicSafety = [...articles, ...maps]
      .filter(page => page.pubblico === true && (!hasValue(dv, page.player_safe) || hasPrivateFields(page)))
      .map(page => ({
        page,
        problem: hasPrivateFields(page) ? "campi DM visibili" : "player_safe mancante",
        action: hasPrivateFields(page) ? "Rimuovi segreti dalla vista pubblica o togli pubblico true." : "Scrivi cosa possono sapere i giocatori."
      }));
    const playableGaps = articles
      .filter(page => !hasCodexTableUse(dv, page) || !hasCodexConnections(dv, page))
      .map(page => ({
        page,
        missing: [
          !hasCodexTableUse(dv, page) ? "uso al tavolo" : "",
          !hasCodexConnections(dv, page) ? "connessioni vive" : ""
        ].filter(Boolean).join(", "),
        action: "Aggiungi uso, prossima mossa, luogo, fazione, missione o collegamento operativo."
      }));
    const gaps = [...worldGaps, ...articleGaps, ...publicSafety];

    const sections = [
      {
        id: "places",
        title: "Luoghi iconici",
        rows: sortByPressure(articles.filter(page =>
          String(page.file?.path ?? "").startsWith("Mondi/Luoghi/")
          && (hasValue(dv, page.player_safe) || hasValue(dv, page.gancio) || hasValue(dv, page.impressione) || hasValue(dv, page.uso_al_tavolo))
        )).slice(0, 8)
      },
      {
        id: "powers",
        title: "Poteri in movimento",
        rows: sortByPressure(articles.filter(page =>
          (String(page.file?.path ?? "").startsWith("Mondi/Fazioni/") || String(page.file?.path ?? "").startsWith("Mondi/Religioni/"))
          && (pressure(page) > 0 || hasValue(dv, page.prossima_mossa))
        )).slice(0, 8)
      },
      {
        id: "faces",
        title: "Volti da ricordare",
        rows: sortByMtime(articles.filter(page =>
          String(page.file?.path ?? "").startsWith("Mondi/Personaggi/")
          && (page.tipo === "png" || page.categoria === "personaggio")
          && (page.stato === "in gioco" || hasValue(dv, page.player_safe) || hasValue(dv, page.vuole))
        )).slice(0, 8)
      },
      {
        id: "history",
        title: "Misteri e timeline",
        rows: sortByMtime(articles.filter(page =>
          String(page.file?.path ?? "").startsWith("Mondi/Timeline/")
          || String(page.file?.path ?? "").startsWith("Mondi/Storia/")
          || String(page.file?.path ?? "").startsWith("Mondi/Segreti/")
        )).slice(0, 8)
      }
    ];

    return {
      articles,
      gaps,
      maps,
      playable,
      playableGaps,
      publicReady,
      publicSafety,
      sections,
      selectedWorld,
      worldGaps,
      worlds,
      worldsComplete: worlds.filter(world => worldIdentityComplete(dv, world))
    };
  }

  function renderWorldBibleNow(dv, worldLink = "") {
    const data = worldBibleData(dv, worldLink);
    const world = data.worlds[0] ?? null;
    const firstGap = data.gaps[0];
    const cards = [
      cardHtml({
        title: world ? "Mondo prima" : "Mondo prima: da creare",
        meta: world ? pageTitle(world) : "nessun mondo nel filtro",
        body: world ? fieldText(world.gancio ?? world.premessa) || "Manca promessa leggibile." : "Crea o seleziona un mondo prima di espandere il Codex.",
        importa: world ? fieldText(world.conflitto_centrale) || "Senza conflitto centrale il Codex resta consultazione." : "La Bibbia del Mondo parte dal mondo base, non dagli articoli sparsi.",
        link: world?.file?.path ?? "",
        cls: `gdr-info-card compact ${world && worldIdentityComplete(dv, world) ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Leggibilita",
        meta: `${data.worldsComplete.length}/${data.worlds.length} mondi completi`,
        body: data.worldGaps[0] ? `${pageTitle(data.worldGaps[0].page)}: ${data.worldGaps[0].field}` : "Identita mondo essenziale completa.",
        importa: data.worldGaps[0]?.action ?? "Puoi passare ad articoli, vista giocatori o campagna.",
        link: data.worldGaps[0]?.page?.file?.path ?? "Hub/Worldbuilder Dashboard.md",
        cls: `gdr-info-card compact ${data.worldGaps.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Da mostrare",
        meta: `${data.publicReady.length} elementi player-safe`,
        body: data.publicReady[0] ? pageTitle(data.publicReady[0]) : "Nessun elemento pronto da mostrare.",
        importa: data.publicReady[0] ? fieldText(data.publicReady[0].player_safe) : "Marca pubblico true solo dopo aver scritto player_safe.",
        link: data.publicReady[0]?.file?.path ?? "Hub/Vista Giocatori.md",
        cls: `gdr-info-card compact ${data.publicReady.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Da giocare",
        meta: `${data.playable.length} articoli operativi`,
        body: data.playable[0] ? pageTitle(data.playable[0]) : "Nessun articolo ha ancora uso e connessioni sufficienti.",
        importa: data.playable[0] ? fieldText(data.playable[0].uso_al_tavolo ?? data.playable[0].prossima_mossa ?? data.playable[0].connessioni) : "Aggiungi uso al tavolo e legami vivi agli articoli chiave.",
        link: data.playable[0]?.file?.path ?? "Hub/Atlante del Mondo.md",
        cls: `gdr-info-card compact ${data.playable.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Buchi del Codex",
        meta: `${data.gaps.length} interventi`,
        body: firstGap ? pageTitle(firstGap.page) : "Nessun buco evidente nel filtro.",
        importa: firstGap?.action ?? "Il Codex puo essere usato come guida di gioco.",
        link: firstGap?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.gaps.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-world-bible-now" });
    grid.innerHTML = cards.join("");
  }

  function renderWorldBibleReadiness(dv, worldLink = "") {
    const data = worldBibleData(dv, worldLink);
    const stats = [
      ["Mondi", data.worlds.length, "base consultabile"],
      ["Identita complete", data.worldsComplete.length, "sei campi fondativi"],
      ["Articoli", data.articles.length, "luoghi, poteri, persone e lore"],
      ["Player-safe", data.publicReady.length, "mostrabili senza segreti"],
      ["Da giocare", data.playable.length, "con uso e connessioni"],
      ["Buchi", data.gaps.length, "da chiudere o archiviare"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-world-bible-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  function renderWorldBibleIdentity(dv, worldLink = "") {
    const data = worldBibleData(dv, worldLink);
    if (!data.worlds.length) {
      renderEmptyState(dv, {
        title: "Nessun mondo selezionato",
        action: "Crea un mondo guidato o seleziona mondo_attivo nel filtro.",
        button: "BUTTON[nuovo-mondo-homebrew]"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-world-bible-identity" });
    grid.innerHTML = data.worlds.map(world => {
      const missing = worldIdentityMissing(dv, world).map(([field]) => field);
      return cardHtml({
        title: pageTitle(world),
        meta: [world.tono, world.tema, world.stato].filter(Boolean).join(" - "),
        body: fieldText(world.gancio ?? world.premessa) || "Manca promessa leggibile.",
        importa: missing.length ? `Manca: ${missing.join(", ")}` : fieldText(world.conflitto_centrale) || "Identita pronta.",
        link: world.file?.path ?? "",
        badge: missing.length ? "Da completare" : "Mondo leggibile",
        cls: `gdr-info-card compact ${missing.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      });
    }).join("");
  }

  function renderWorldBibleArticles(dv, worldLink = "") {
    const data = worldBibleData(dv, worldLink);
    for (const section of data.sections) {
      dv.header(3, section.title);
      renderCardGrid(dv, section.rows, page => codexCard(dv, page), {
        title: `${section.title}: niente pronto`,
        action: "Compila gancio, uso al tavolo, pressione o testo player-safe negli articoli core.",
        link: "Hub/Worldbuilder Dashboard.md"
      });
    }

    dv.header(3, "Pronti da mostrare");
    renderCardGrid(dv, data.publicReady.slice(0, 8), page => codexCard(dv, page, "Da mostrare"), {
      title: "Nessun articolo pronto da mostrare",
      action: "Marca pubblico true e compila player_safe senza campi DM.",
      link: "Hub/Vista Giocatori.md"
    });

    dv.header(3, "Pronti da giocare");
    renderCardGrid(dv, data.playable.slice(0, 8), page => codexCard(dv, page, "Da giocare"), {
      title: "Nessun articolo pronto da giocare",
      action: "Compila identita, uso al tavolo e connessioni vive negli articoli chiave.",
      link: "Hub/Atlante del Mondo.md"
    });
  }

  async function readWorldBibleCockpit() {
    return readJsonRel("z.automazioni/data/runtime/world_bible_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  function labelsFor(cockpit) {
    return new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
  }

  function renderTable(dv, labels, id, headers, rows, empty) {
    dv.header(3, labels.get(id) ?? id);
    if (!rows.length) {
      dv.paragraph(empty);
      return;
    }
    dv.table(headers, rows);
  }

  async function renderWorldBibleGaps(dv, worldLink = "") {
    const cockpit = await readWorldBibleCockpit();
    const labels = labelsFor(cockpit);
    const data = worldBibleData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "world_identity",
      ["Mondo", "Campo", "Azione"],
      data.worldGaps.slice(0, 12).map(row => [pageLink(row.page), row.field, row.action]),
      "Identita mondo essenziale completa."
    );
    renderTable(
      dv,
      labels,
      "article_gaps",
      ["Nota", "Categoria", "Manca", "Azione"],
      data.gaps.filter(row => row.missing).slice(0, 16).map(row => [pageLink(row.page), row.page.categoria ?? row.page.tipo ?? "", row.missing, row.action]),
      "Nessun articolo incompleto evidente."
    );
    renderTable(
      dv,
      labels,
      "public_safety",
      ["Nota", "Problema", "Azione"],
      data.publicSafety.slice(0, 12).map(row => [pageLink(row.page), row.problem, row.action]),
      "Nessun rischio pubblico nel filtro."
    );
    renderTable(
      dv,
      labels,
      "playable_gaps",
      ["Nota", "Categoria", "Manca", "Azione"],
      data.playableGaps.slice(0, 16).map(row => [pageLink(row.page), row.page.categoria ?? row.page.tipo ?? "", row.missing, row.action]),
      "Gli articoli chiave hanno uso e collegamenti sufficienti."
    );
  }

  async function renderWorldBibleSurfaceLinks(dv) {
    const cockpit = await readWorldBibleCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici non configurate",
        action: "Rigenera il contratto Bibbia del Mondo dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-world-bible-surfaces" });
    grid.innerHTML = surfaces.map(surface => {
      const status = pluginStatus(surface.plugin);
      const state = status.ok === true
        ? "attiva"
        : surface.generated_release
          ? "generata in release"
          : "fallback Markdown";
      return cardHtml({
        title: surface.label,
        meta: `${surface.role} - ${state}`,
        body: surface.action,
        importa: surface.why,
        link: surface.target,
        badge: surface.badge,
        cls: `gdr-info-card compact ${status.ok === false ? "gdr-kind-missing" : "gdr-kind-ready"}`
      });
    }).join("");
  }

  function renderCodexEditorial(dv, worldLink = "") {
    return renderWorldBibleArticles(dv, worldLink);
  }

  function renderCodexReadyShowcase(dv, worldLink = "") {
    const data = worldBibleData(dv, worldLink);
    renderCardGrid(dv, data.publicReady.slice(0, 10), page => codexCard(dv, page, "Da mostrare"), {
      title: "Nessun articolo pronto da mostrare",
      action: "Marca pubblico true e compila player_safe su almeno una nota del Codex.",
      link: "Hub/Vista Giocatori.md"
    });
  }

  function renderCodexReadyToPlay(dv, worldLink = "") {
    const data = worldBibleData(dv, worldLink);
    renderCardGrid(dv, data.playable.slice(0, 10), page => codexCard(dv, page, "Da giocare"), {
      title: "Nessun articolo pronto da giocare",
      action: "Compila identita, uso al tavolo e connessioni vive negli articoli core.",
      link: "Hub/Atlante del Mondo.md"
    });
  }

  return {
    renderCodexEditorial,
    renderCodexReadyShowcase,
    renderCodexReadyToPlay,
    renderWorldBibleArticles,
    renderWorldBibleGaps,
    renderWorldBibleIdentity,
    renderWorldBibleNow,
    renderWorldBibleReadiness,
    renderWorldBibleSurfaceLinks
  };
})
