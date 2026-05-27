(ctx => {
  const {
    asArray,
    cardClass,
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

  const TYPES = [
    "materiale",
    "pianta",
    "malattia",
    "moneta",
    "tecnologia",
    "cibo",
    "superstizione",
    "professione",
    "creatura regionale"
  ];

  const ECONOMY_TYPES = new Set(["materiale", "moneta", "tecnologia", "cibo"]);

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

  function matchesWorld(page, selectedWorld) {
    return !selectedWorld || linkKey(page?.mondo) === selectedWorld || page?.file?.path === selectedWorld;
  }

  function compendiumPages(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    return dv.pages('"Mondi/Compendium"')
      .where(page => realPage(page) && String(page?.file?.name ?? "") !== "Compendium" && matchesWorld(page, selectedWorld))
      .array()
      .sort((left, right) => String(left.tipo ?? "").localeCompare(String(right.tipo ?? "")) || String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
  }

  function hasWorldAnchor(dv, page) {
    return hasValue(dv, page?.mondo);
  }

  function hasCulturalAnchor(dv, page) {
    return hasValue(dv, page?.culture)
      || hasValue(dv, page?.regioni)
      || hasValue(dv, page?.luoghi);
  }

  function hasEconomicAnchor(dv, page) {
    return hasValue(dv, page?.risorse)
      || hasValue(dv, page?.fazioni);
  }

  function hasOperationalUse(dv, page) {
    return hasValue(dv, page?.uso_narrativo)
      || hasValue(dv, page?.usi)
      || hasValue(dv, page?.missioni)
      || hasValue(dv, page?.rischi)
      || hasValue(dv, page?.conseguenze)
      || hasValue(dv, page?.prossima_mossa)
      || Number(page?.pressione ?? 0) > 0;
  }

  function hasHistoryLink(dv, page) {
    return hasValue(dv, page?.eventi_storici)
      || hasValue(dv, page?.eventi)
      || hasValue(dv, page?.conseguenze)
      || hasValue(dv, page?.segreti)
      || hasValue(dv, page?.propaga_a)
      || hasValue(dv, page?.entita_impattate);
  }

  function hasMapLink(dv, page) {
    return hasValue(dv, page?.mappe)
      || hasValue(dv, page?.mappa)
      || hasValue(dv, page?.coordinate);
  }

  function compendiumCard(dv, page, badge = "Elemento") {
    const missing = compendiumGapsFor(dv, page);
    return cardHtml({
      title: pageTitle(page),
      meta: [page.tipo, page.stato, missing.length ? "da collegare" : "pronto"].filter(Boolean).join(" - "),
      azione: fieldText(page.uso_narrativo ?? page.usi ?? page.prossima_mossa) || "Scrivi uso narrativo o prossima mossa.",
      importa: missing.length ? `Manca: ${missing.map(item => item.problem).join(", ")}` : fieldText(page.culture ?? page.regioni ?? page.risorse ?? page.fazioni ?? page.missioni),
      link: page.file?.path ?? "",
      badge,
      cls: cardClass(page, "gdr-info-card compact", missing.length ? "gdr-kind-missing" : "gdr-kind-ready")
    });
  }

  function compendiumGapsFor(dv, page) {
    const gaps = [];
    const type = String(page?.tipo ?? "");
    if (!hasWorldAnchor(dv, page)) {
      gaps.push({ problem: "mondo", action: "Collega il mondo di riferimento.", priority: 5 });
    }
    if (!type) {
      gaps.push({ problem: "tipo", action: "Scegli materiale, pianta, moneta, tecnologia o altra categoria.", priority: 4 });
    }
    if (!hasCulturalAnchor(dv, page)) {
      gaps.push({ problem: "cultura o regione", action: "Collega cultura, regione o luogo dove esiste.", priority: 4 });
    }
    if (!hasOperationalUse(dv, page)) {
      gaps.push({ problem: "uso narrativo", action: "Scrivi indizio, premio, rischio, scelta o prossima mossa.", priority: 5 });
    }
    if (ECONOMY_TYPES.has(type) && !hasEconomicAnchor(dv, page)) {
      gaps.push({ problem: "leva economica", action: "Collega risorsa, fazione, mercato o dipendenza.", priority: 3 });
    }
    if (Number(page?.pressione ?? 0) > 0 && !hasValue(dv, page?.prossima_mossa)) {
      gaps.push({ problem: "pressione senza prossima mossa", action: "Scrivi cosa accade se nessuno interviene.", priority: 4 });
    }
    return gaps.sort((left, right) => right.priority - left.priority || left.problem.localeCompare(right.problem));
  }

  function compendiumRows(dv, worldLink = "") {
    const pages = compendiumPages(dv, worldLink);
    const withUse = pages.filter(page => hasOperationalUse(dv, page));
    const withoutUse = pages.filter(page => !hasOperationalUse(dv, page));
    const cultural = pages.filter(page => hasCulturalAnchor(dv, page));
    const economic = pages.filter(page => hasEconomicAnchor(dv, page));
    const historic = pages.filter(page => hasHistoryLink(dv, page));
    const mapped = pages.filter(page => hasMapLink(dv, page));
    const pressureRows = pages
      .filter(page => Number(page.pressione ?? 0) > 0 || hasValue(dv, page.prossima_mossa))
      .sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
    const gaps = pages.flatMap(page => compendiumGapsFor(dv, page).map(gap => ({
      page,
      problem: gap.problem,
      action: gap.action,
      priority: gap.priority
    }))).sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
    const typeCounts = TYPES.map(type => ({
      type,
      count: pages.filter(page => String(page.tipo ?? "") === type).length
    }));

    return {
      cultural,
      economic,
      gaps,
      historic,
      mapped,
      pages,
      pressureRows,
      typeCounts,
      withUse,
      withoutUse
    };
  }

  function renderCompendiumNow(dv, worldLink = "") {
    const data = compendiumRows(dv, worldLink);
    const nextGap = data.gaps[0];
    const topReady = data.withUse[0];
    const topHistoric = data.historic[0];
    const topPressure = data.pressureRows[0];
    const cards = [
      cardHtml({
        title: nextGap ? "Elemento prima: collega" : "Elemento prima: pronto",
        meta: nextGap ? pageTitle(nextGap.page) : `${data.pages.length} elementi nel filtro`,
        body: nextGap?.problem ?? "Nessun elemento originale richiede intervento immediato.",
        importa: nextGap?.action ?? "Puoi usare il Compendium come materiale al tavolo.",
        link: nextGap?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${nextGap ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Con uso",
        meta: `${data.withUse.length} elementi`,
        body: topReady ? pageTitle(topReady) : "Nessun elemento ha ancora uso narrativo.",
        importa: topReady ? fieldText(topReady.uso_narrativo ?? topReady.usi ?? topReady.missioni) : "Scrivi cosa produce in scena.",
        link: topReady?.file?.path ?? "Hub/Lore Hub.md",
        cls: `gdr-info-card compact ${data.withUse.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Decorativi",
        meta: `${data.withoutUse.length} senza uso`,
        body: data.withoutUse[0] ? pageTitle(data.withoutUse[0]) : "Nessun elemento decorativo isolato.",
        importa: data.withoutUse.length ? "Collega a missione, rischio, cultura o conseguenza." : "Gli elementi hanno impatto sufficiente.",
        link: data.withoutUse[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.withoutUse.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Storia e segreti",
        meta: `${data.historic.length} collegati`,
        body: topHistoric ? pageTitle(topHistoric) : "Nessun legame storico o segreto.",
        importa: topHistoric ? fieldText(topHistoric.eventi_storici ?? topHistoric.eventi ?? topHistoric.segreti ?? topHistoric.conseguenze) : "Aggiungi legame storico solo se produce scoperta o conseguenza.",
        link: topHistoric?.file?.path ?? "Hub/Lore Hub.md",
        cls: `gdr-info-card compact ${data.historic.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Pressione",
        meta: `${data.pressureRows.length} elementi attivi`,
        body: topPressure ? pageTitle(topPressure) : "Nessun elemento muove il mondo.",
        importa: topPressure ? fieldText(topPressure.prossima_mossa) || "Aggiungi prossima mossa." : "Usa pressione solo per elementi che cambiano fuori scena.",
        link: topPressure?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: `gdr-info-card compact ${data.pressureRows.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-compendium-now" });
    grid.innerHTML = cards.join("");
  }

  function renderCompendiumReadiness(dv, worldLink = "") {
    const data = compendiumRows(dv, worldLink);
    const stats = [
      ["Elementi", data.pages.length, "originali non-SRD"],
      ["Con uso", data.withUse.length, "narrativo o al tavolo"],
      ["Culture e regioni", data.cultural.length, "collocati nel mondo"],
      ["Risorse e fazioni", data.economic.length, "con leva economica"],
      ["Storia e segreti", data.historic.length, "con conseguenze o misteri"],
      ["Buchi", data.gaps.length, "da collegare o archiviare"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-compendium-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  function renderCompendiumTypeMix(dv, worldLink = "") {
    const data = compendiumRows(dv, worldLink);
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-compendium-types" });
    grid.innerHTML = data.typeCounts.map(row => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(row.count)}</div>
        <div class="gdr-stat-label">${escapeHtml(row.type)}</div>
        <div class="gdr-stat-hint">Elementi originali</div>
      </div>
    `).join("");
  }

  async function readCompendiumCockpit() {
    return readJsonRel("z.automazioni/data/runtime/compendium_cockpit.json", {
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

  async function renderCompendiumOperationalQueues(dv, worldLink = "") {
    const cockpit = await readCompendiumCockpit();
    const labels = labelsFor(cockpit);
    const data = compendiumRows(dv, worldLink);

    renderTable(
      dv,
      labels,
      "archive",
      ["Elemento", "Tipo", "Culture/regioni", "Risorse/fazioni", "Uso"],
      data.pages.slice(0, 24).map(page => [
        pageLink(page),
        page.tipo ?? "",
        fieldText(page.culture ?? page.regioni ?? page.luoghi),
        fieldText(page.risorse ?? page.fazioni),
        fieldText(page.uso_narrativo ?? page.usi)
      ]),
      "Nessun elemento originale nel filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "without_use",
      ["Elemento", "Tipo", "Mondo", "Azione"],
      data.withoutUse.slice(0, 16).map(page => [
        pageLink(page),
        page.tipo ?? "",
        fieldText(page.mondo),
        "Aggiungi uso narrativo, missione, rischio o prossima mossa."
      ]),
      "Nessun elemento decorativo senza uso."
    );
    renderTable(
      dv,
      labels,
      "open_gaps",
      ["Elemento", "Problema", "Azione"],
      data.gaps.slice(0, 18).map(row => [pageLink(row.page), row.problem, row.action]),
      "Nessun buco operativo evidente."
    );
  }

  async function renderCompendiumHistoryQueues(dv, worldLink = "") {
    const cockpit = await readCompendiumCockpit();
    const labels = labelsFor(cockpit);
    const data = compendiumRows(dv, worldLink);

    renderTable(
      dv,
      labels,
      "history_links",
      ["Elemento", "Tipo", "Eventi", "Conseguenze", "Segreti"],
      data.historic.slice(0, 16).map(page => [
        pageLink(page),
        page.tipo ?? "",
        fieldText(page.eventi_storici ?? page.eventi),
        fieldText(page.conseguenze),
        fieldText(page.segreti)
      ]),
      "Nessun elemento collegato a storia, conseguenze o segreti."
    );
    renderTable(
      dv,
      labels,
      "pressure",
      ["Elemento", "Pressione", "Prossima mossa", "Propaga a"],
      data.pressureRows.slice(0, 16).map(page => [
        pageLink(page),
        page.pressione ?? "",
        fieldText(page.prossima_mossa) || "da decidere",
        fieldText(page.propaga_a ?? page.entita_impattate)
      ]),
      "Nessun elemento del compendium sta muovendo il mondo."
    );
    renderTable(
      dv,
      labels,
      "map_links",
      ["Elemento", "Tipo", "Mappa", "Coordinate"],
      data.mapped.slice(0, 16).map(page => [
        pageLink(page),
        page.tipo ?? "",
        fieldText(page.mappe ?? page.mappa),
        fieldText(page.coordinate)
      ]),
      "Nessun elemento ha ancora mappa o coordinate."
    );
  }

  async function renderCompendiumSurfaceLinks(dv) {
    const cockpit = await readCompendiumCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici non configurate",
        action: "Rigenera il contratto Compendium dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-compendium-surfaces" });
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

  return {
    renderCompendiumHistoryQueues,
    renderCompendiumNow,
    renderCompendiumOperationalQueues,
    renderCompendiumReadiness,
    renderCompendiumSurfaceLinks,
    renderCompendiumTypeMix
  };
})
