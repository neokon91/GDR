(ctx => {
  const {
    cardHtml,
    escapeHtml,
    fieldText,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState
  } = ctx;

  const REGION_TYPES = new Set(["regione", "continente", "isola", "regno", "impero", "repubblica", "ducato", "contea", "baronia"]);
  const LORE_CATEGORIES = new Set(["lore capture", "evento storico", "segreto", "mistero", "cosmologia"]);

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function"
      ? data.array()
      : Array.isArray(value) ? value : value ? [value] : [];
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function folderIndex(page) {
    const folder = String(page?.file?.folder ?? "");
    return page?.file?.name === folder.split("/").pop();
  }

  function realPage(page) {
    return isReal(page)
      && !folderIndex(page)
      && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function sortByPressure(rows) {
    return [...rows].sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function sortByMtime(rows) {
    return [...rows].sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function loreScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const inScope = page => realPage(page) && matchesWorld(page);
    const pages = (source, predicate = () => true) => dv.pages(source).where(page => inScope(page) && predicate(page)).array();
    return { pages, selectedWorld };
  }

  function isLorePage(page) {
    const category = String(page?.categoria ?? "").toLowerCase();
    const type = String(page?.tipo ?? "").toLowerCase();
    return LORE_CATEGORIES.has(category)
      || LORE_CATEGORIES.has(type)
      || hasText(page?.stato_canonico)
      || page?.canonico !== undefined;
  }

  function hasCanonDecision(dv, page) {
    return hasValue(dv, page?.stato_canonico) || page?.canonico !== undefined;
  }

  function hasMysteryClues(dv, page) {
    return hasValue(dv, page?.indizi)
      || hasValue(dv, page?.indizi_deboli)
      || hasValue(dv, page?.indizi_forti)
      || hasValue(dv, page?.prove_decisive)
      || hasValue(dv, page?.rivelazioni);
  }

  function isPlayable(dv, page) {
    return hasValue(dv, page?.scelte)
      || hasValue(dv, page?.rischi)
      || hasMysteryClues(dv, page)
      || hasValue(dv, page?.prossima_mossa)
      || hasValue(dv, page?.uso_al_tavolo);
  }

  function loreData(dv, worldLink = "") {
    const scope = loreScope(dv, worldLink);
    const worlds = scope.pages('"Mondi"', page => page.categoria === "mondo");
    const regions = scope.pages('"Mondi/Luoghi"', page => REGION_TYPES.has(String(page.tipo ?? page.tipologia ?? "")));
    const cultures = scope.pages('"Mondi/Culture"');
    const languages = scope.pages('"Mondi/Lingue"');
    const religions = scope.pages('"Mondi/Religioni"');
    const factions = scope.pages('"Mondi/Fazioni"');
    const history = scope.pages('"Mondi/Timeline" OR "Mondi/Storia"');
    const mysteries = scope.pages('"Mondi/Segreti"', page => true);
    const maps = scope.pages('"Risorse/Mappe"', page => page.file?.name !== "Mappe");
    const people = scope.pages('"Mondi/Personaggi"', page => page.tipo === "png" || page.categoria === "personaggio");
    const objects = scope.pages('"Mondi/Oggetti"');
    const resources = scope.pages('"Mondi/Risorse"');
    const compendium = scope.pages('"Mondi/Compendium"');
    const powers = sortByPressure([...factions, ...religions]);
    const lorePages = sortByMtime(scope.pages('"Mondi" OR "Inbox"', page => isLorePage(page)));
    const signals = sortByPressure(scope.pages('"Mondi" OR "Inbox"', page =>
      pressure(page) > 0
        || hasValue(dv, page.prossima_mossa)
        || isLorePage(page)
        || hasValue(dv, page.segnali)
    ));
    const decisions = lorePages.filter(page => !hasCanonDecision(dv, page));
    const unplayable = lorePages.filter(page => !isPlayable(dv, page));
    const mysteriesWithoutClues = mysteries.filter(page => !hasMysteryClues(dv, page));
    const historyGaps = history.filter(page => !hasValue(dv, page.causa) || !hasValue(dv, page.conseguenze) || !hasValue(dv, page.prossima_mossa));
    const cultureRows = [...cultures].sort((left, right) => String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
    const materialRows = [...objects, ...resources, ...compendium]
      .sort((left, right) => String(left.tipo ?? left.categoria ?? "").localeCompare(String(right.tipo ?? right.categoria ?? "")) || String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));

    const priority = [
      ...decisions.map(page => ({ group: "Canone", page, problem: "decisione canonica mancante", action: "Decidi se e canonico, rumor, leggenda, falso, segreto o retcon.", priority: 6 })),
      ...mysteriesWithoutClues.map(page => ({ group: "Mistero", page, problem: "mistero senza indizi", action: "Scrivi indizi deboli, forti o prova decisiva.", priority: 5 })),
      ...historyGaps.map(page => ({ group: "Storia", page, problem: "evento senza causa, effetto o prossima mossa", action: "Collega causa, conseguenze e cosa cambia al tavolo.", priority: 4 })),
      ...signals.filter(page => pressure(page) > 0 && !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Segnale", page, problem: "pressione senza prossima mossa", action: "Scrivi cosa accade se nessuno interviene.", priority: 4 })),
      ...unplayable.map(page => ({ group: "Giocabilita", page, problem: "lore senza uso al tavolo", action: "Aggiungi scelta, rischio, indizio o prossima mossa.", priority: 3 }))
    ].sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));

    return {
      compendium,
      cultures,
      cultureRows,
      decisions,
      factions,
      history,
      historyGaps,
      languages,
      lorePages,
      maps,
      materialRows,
      mysteries,
      mysteriesWithoutClues,
      objects,
      people,
      powers,
      priority,
      regions,
      religions,
      resources,
      scope,
      signals,
      unplayable,
      worlds
    };
  }

  function renderLoreNow(dv, worldLink = "") {
    const data = loreData(dv, worldLink);
    const next = data.priority[0];
    const topSignal = data.signals[0];
    const topMystery = data.mysteriesWithoutClues[0] ?? data.mysteries[0];
    const topCulture = data.cultureRows[0];
    const topMaterial = data.materialRows[0];
    const cards = [
      {
        title: next ? `Segnale prima: ${next.group}` : "Segnale prima: niente di urgente",
        meta: next ? pageTitle(next.page) : "Lore stabile",
        body: next?.problem ?? "Nessun segnale da correggere con il filtro corrente.",
        importa: next?.action ?? "Puoi usare il Lore Hub per navigare materiale gia pronto.",
        link: next?.page?.file?.path ?? "",
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Canone",
        meta: `${data.decisions.length} decisioni aperte`,
        body: data.decisions[0] ? pageTitle(data.decisions[0]) : "Nessuna decisione canonica sospesa.",
        importa: data.decisions[0] ? "Stabilisci stato canonico prima di usarlo come vincolo." : "Il materiale lore ha una posizione canonica sufficiente.",
        link: data.decisions[0]?.file?.path ?? "Hub/Controllo Canone.md",
        cls: data.decisions.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Misteri",
        meta: `${data.mysteries.length} misteri · ${data.mysteriesWithoutClues.length} senza indizi`,
        body: topMystery ? pageTitle(topMystery) : "Nessun mistero nel filtro corrente.",
        importa: topMystery ? fieldText(topMystery.indizi ?? topMystery.indizi_deboli ?? topMystery.prove_decisive) || "Aggiungi indizi rivelabili." : "Crea un mistero solo se produrra scelte o scoperte.",
        link: topMystery?.file?.path ?? "Hub/Controllo Canone.md",
        cls: data.mysteriesWithoutClues.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Segnali",
        meta: `${data.signals.length} attivi`,
        body: topSignal ? pageTitle(topSignal) : "Nessun segnale operativo.",
        importa: topSignal ? fieldText(topSignal.prossima_mossa ?? topSignal.segnali ?? topSignal.conseguenze) || "Chiarisci cosa cambia in scena." : "Nessun appunto chiede azione immediata.",
        link: topSignal?.file?.path ?? "Hub/Revisione Lore.md",
        cls: data.signals.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Culture",
        meta: `${data.cultures.length} culture · ${data.languages.length} lingue`,
        body: topCulture ? pageTitle(topCulture) : "Nessuna cultura nel filtro corrente.",
        importa: topCulture ? fieldText(topCulture.tensioni ?? topCulture.feste ?? topCulture.lingue) || "Collega tabù, feste o tensioni." : "Aggiungi culture solo se generano scene, segnali o conflitti.",
        link: topCulture?.file?.path ?? "Hub/Worldbuilder Dashboard.md",
        cls: data.cultures.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Materiali",
        meta: `${data.objects.length + data.resources.length + data.compendium.length} oggetti, risorse o compendium`,
        body: topMaterial ? pageTitle(topMaterial) : "Nessun materiale originale nel filtro corrente.",
        importa: topMaterial ? fieldText(topMaterial.uso_narrativo ?? topMaterial.luoghi ?? topMaterial.fazioni) || "Collega uso narrativo e agganci." : "Il materiale originale deve avere uso o pressione.",
        link: topMaterial?.file?.path ?? "Hub/Compendium Del Mondo.md",
        cls: topMaterial ? "gdr-kind-ready" : "gdr-kind-missing"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-lore-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderLoreReadiness(dv, worldLink = "") {
    const data = loreData(dv, worldLink);
    const stats = [
      ["Mondo attivo", data.scope.selectedWorld ? 1 : data.worlds.length, data.scope.selectedWorld || "tutti i mondi"],
      ["Regioni", data.regions.length, "geografia e poteri"],
      ["Culture", data.cultures.length, "popoli, tabu, feste"],
      ["Lingue", data.languages.length, "parlate e scritture"],
      ["Religioni", data.religions.length, "culti e divinita"],
      ["Fazioni", data.factions.length, "poteri in movimento"],
      ["Storia", data.history.length, "eventi e conseguenze"],
      ["Misteri", data.mysteries.length, "verita nascoste"],
      ["Mappe", data.maps.length, "relazioni, hex, zoom"],
      ["PNG chiave", data.people.length, "volti del mondo"],
      ["Materiali", data.objects.length + data.resources.length + data.compendium.length, "oggetti, risorse, compendium"],
      ["Buchi", data.priority.length, "lore da rendere giocabile"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-lore-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readLoreCockpit() {
    return readJsonRel("z.automazioni/data/runtime/lore_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  function renderTable(dv, labels, id, headers, rows, empty) {
    dv.header(3, labels.get(id) ?? id);
    if (!rows.length) {
      dv.paragraph(empty);
      return;
    }
    dv.table(headers, rows);
  }

  async function renderLoreSignalQueues(dv, worldLink = "") {
    const cockpit = await readLoreCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = loreData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "signals",
      ["Nota", "Categoria", "Stato", "Pressione", "Prossima mossa"],
      data.signals.slice(0, 20).map(page => [pageLink(page), page.categoria ?? page.tipo ?? "", page.stato ?? page.stato_canonico ?? "", pressure(page) || "", fieldText(page.prossima_mossa ?? page.segnali ?? page.conseguenze) || ""]),
      "Nessun segnale lore operativo con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "canon_decisions",
      ["Nota", "Categoria", "Stato", "Decisione richiesta"],
      data.decisions.slice(0, 20).map(page => [pageLink(page), page.categoria ?? page.tipo ?? "", page.stato ?? "", "decidi stato canonico"]),
      "Nessuna decisione canonica sospesa."
    );
    renderTable(
      dv,
      labels,
      "mysteries",
      ["Mistero", "Verita", "Indizi", "Propaga a"],
      data.mysteries.slice(0, 20).map(page => [pageLink(page), fieldText(page.verita_profonda) || "", fieldText(page.indizi ?? page.indizi_deboli ?? page.indizi_forti ?? page.prove_decisive) || "", page.propaga_a ?? []]),
      "Nessun mistero nel filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "history",
      ["Evento", "Data", "Cause", "Conseguenze", "Prossima mossa"],
      data.history.slice(0, 20).map(page => [pageLink(page), page.data_mondo ?? "", fieldText(page.cause ?? page.causa) || "", page.conseguenze ?? page.effetti ?? [], fieldText(page.prossima_mossa) || ""]),
      "Nessun evento storico nel filtro corrente."
    );
  }

  async function renderLoreWorldQueues(dv, worldLink = "") {
    const cockpit = await readLoreCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = loreData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "cultures",
      ["Cultura", "Luoghi", "Lingue", "Religioni", "Tensioni", "Feste"],
      data.cultureRows.slice(0, 20).map(page => [pageLink(page), page.luoghi ?? [], page.lingue ?? [], page.religioni ?? [], page.tensioni ?? [], page.feste ?? []]),
      "Nessuna cultura nel filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "powers",
      ["Potere", "Tipo", "Luoghi", "Pressione", "Agenda", "Prossima mossa"],
      data.powers.slice(0, 20).map(page => [pageLink(page), page.tipo ?? page.categoria ?? "", page.luoghi ?? [], pressure(page) || "", fieldText(page.agenda) || "", fieldText(page.prossima_mossa) || ""]),
      "Nessun potere religioso o politico nel filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "maps",
      ["Mappa", "Uso", "Mondo", "Luogo", "Stato"],
      data.maps.slice(0, 20).map(page => [pageLink(page), page.uso ?? "", page.mondo ?? "", page.luogo ?? page.luoghi ?? [], page.stato ?? ""]),
      "Nessuna mappa collegata al filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "materials",
      ["Nota", "Tipo", "Luoghi", "Risorse", "Fazioni", "Uso"],
      data.materialRows.slice(0, 24).map(page => [pageLink(page), page.tipo ?? page.categoria ?? "", page.luoghi ?? page.regioni ?? [], page.risorse ?? [], page.fazioni ?? page.fazioni_controllanti ?? [], fieldText(page.uso_narrativo ?? page.uso_al_tavolo) || ""]),
      "Nessun oggetto, risorsa o compendium con il filtro corrente."
    );
  }

  async function renderLoreSurfaceLinks(dv) {
    const cockpit = await readLoreCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici lore non configurate",
        action: "Rigenera il contratto Lore Hub dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-lore-surfaces" });
    grid.innerHTML = surfaces.map(surface => {
      const status = pluginStatus(surface.plugin);
      const state = status.ok === true
        ? "attiva"
        : surface.generated_release
          ? "generata in release"
          : "fallback Markdown";
      return cardHtml({
        title: surface.label,
        meta: `${surface.role} · ${state}`,
        body: surface.action,
        importa: surface.why,
        link: surface.target,
        badge: surface.badge,
        cls: `gdr-info-card compact ${status.ok === false ? "gdr-kind-missing" : "gdr-kind-ready"}`
      });
    }).join("");
  }

  return {
    renderLoreNow,
    renderLoreReadiness,
    renderLoreSignalQueues,
    renderLoreSurfaceLinks,
    renderLoreWorldQueues
  };
})
