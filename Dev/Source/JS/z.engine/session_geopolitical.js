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

  const POLITICAL_TYPES = new Set(["regno", "impero", "repubblica", "oligarchia", "ducato", "contea", "baronia", "protettorato", "marca"]);
  const MAJOR_TYPES = new Set(["regno", "impero", "repubblica", "oligarchia"]);

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

  function typeOf(page) {
    return String(page?.tipo ?? page?.tipologia ?? page?.sottotipo ?? "").trim();
  }

  function sortByPressure(rows) {
    return [...rows].sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function geopoliticalScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const inScope = page => realPage(page) && matchesWorld(page);
    const pages = (source, predicate = () => true) => dv.pages(source).where(page => inScope(page) && predicate(page)).array();
    return { pages, selectedWorld };
  }

  function isPoliticalTerritory(dv, page) {
    return POLITICAL_TYPES.has(typeOf(page))
      || hasValue(dv, page?.legittimita)
      || hasValue(dv, page?.vassalli)
      || hasValue(dv, page?.confini)
      || hasValue(dv, page?.crisi_interne);
  }

  function politicalIssues(dv, data) {
    return [
      ...data.territories.filter(page => MAJOR_TYPES.has(typeOf(page)) && !hasValue(dv, page.capitale))
        .map(page => ({ page, problem: "territorio maggiore senza capitale", type: typeOf(page), state: page.stato ?? "", priority: 5 })),
      ...data.territories.filter(page => !hasValue(dv, page.governante) && !hasValue(dv, page.fazioni))
        .map(page => ({ page, problem: "territorio senza governante o fazioni di potere", type: typeOf(page), state: page.stato ?? "", priority: 4 })),
      ...data.territories.filter(page => !hasValue(dv, page.confini) && !hasValue(dv, page.luogo_padre))
        .map(page => ({ page, problem: "territorio senza confini o contesto superiore", type: typeOf(page), state: page.stato ?? "", priority: 3 })),
      ...data.territories.filter(page => !hasValue(dv, page.risorse_strategiche) && !hasValue(dv, page.risorse))
        .map(page => ({ page, problem: "territorio senza risorse strategiche", type: typeOf(page), state: page.stato ?? "", priority: 3 })),
      ...data.relations.filter(page => pressure(page) >= 6 && !hasValue(dv, page.prossima_mossa))
        .map(page => ({ page, problem: "relazione ad alta pressione senza prossima mossa", type: page.tipo ?? "", state: page.stato ?? "", priority: 4 }))
    ].sort((left, right) => right.priority - left.priority || pressure(right.page) - pressure(left.page) || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
  }

  function geopoliticalData(dv, worldLink = "") {
    const scope = geopoliticalScope(dv, worldLink);
    const territories = scope.pages('"Mondi/Luoghi"', page => isPoliticalTerritory(dv, page));
    const relations = scope.pages('"Mondi/Relazioni"', page => page.file?.name !== "Relazioni");
    const routes = scope.pages('"Mondi/Rotte"', page => page.file?.name !== "Rotte");
    const markets = scope.pages('"Mondi/Mercati"', page => page.file?.name !== "Mercati");
    const crisisTerritories = territories.filter(page => pressure(page) > 0 || hasValue(dv, page.crisi_interne));
    const crisisRelations = relations.filter(page => pressure(page) > 0 || hasValue(dv, page.conseguenze) || hasValue(dv, page.posta));
    const economicNodes = sortByPressure([...routes, ...markets]);
    const borderRows = territories.filter(page =>
      hasValue(dv, page.confini)
      || hasValue(dv, page.vassalli)
      || hasValue(dv, page.luogo_padre)
      || hasValue(dv, page.relazioni)
      || hasValue(dv, page.rivali)
    ).sort((left, right) => String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
    const resourceRows = sortByPressure(territories.filter(page =>
      hasValue(dv, page.risorse_strategiche)
      || hasValue(dv, page.risorse)
      || hasValue(dv, page.crisi_interne)
    ));
    const issues = politicalIssues(dv, { territories, relations });
    const pressureRows = sortByPressure([...territories, ...relations].filter(page => pressure(page) > 0 || hasValue(dv, page.prossima_mossa)));
    const priority = [
      ...issues.map(row => ({ group: "Buco", page: row.page, problem: row.problem, action: "Completa il campo politico mancante o archivia la nota.", priority: row.priority })),
      ...relations.filter(page => pressure(page) >= 6 && !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Relazione", page, problem: "alta pressione senza prossima mossa", action: "Definisci cosa accade se il trattato, patto o conflitto evolve.", priority: 5 })),
      ...territories.filter(page => pressure(page) > 0 && !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Territorio", page, problem: "territorio sotto pressione senza prossima mossa", action: "Scrivi la mossa politica se nessuno interviene.", priority: 4 })),
      ...economicNodes.filter(page => pressure(page) > 0 && !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Economia", page, problem: "nodo economico politico senza prossima mossa", action: "Collega pressione economica a territorio o fazione.", priority: 3 }))
    ].sort((left, right) => right.priority - left.priority || pressure(right.page) - pressure(left.page) || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));

    return {
      borderRows,
      crisisRelations,
      crisisTerritories,
      economicNodes,
      issues,
      markets,
      pressureRows,
      priority,
      relations,
      resourceRows,
      routes,
      scope,
      territories
    };
  }

  function renderGeopoliticalNow(dv, worldLink = "") {
    const data = geopoliticalData(dv, worldLink);
    const next = data.priority[0];
    const topTerritory = sortByPressure(data.territories)[0];
    const topRelation = sortByPressure(data.relations)[0];
    const topEconomy = data.economicNodes[0];
    const cards = [
      {
        title: next ? `Muovi prima: ${next.group}` : "Muovi prima: equilibrio stabile",
        meta: next ? pageTitle(next.page) : "Nessuna crisi politica urgente",
        body: next?.problem ?? "Nessun buco o fronte diplomatico urgente con il filtro corrente.",
        importa: next?.action ?? "Puoi usare la dashboard per leggere poteri e confini pronti.",
        link: next?.page?.file?.path ?? "",
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Territori",
        meta: `${data.territories.length} poteri o domini`,
        body: topTerritory ? pageTitle(topTerritory) : "Nessun territorio politico nel filtro corrente.",
        importa: topTerritory ? fieldText(topTerritory.prossima_mossa ?? topTerritory.crisi_interne ?? topTerritory.legittimita) || "Chiarisci posta, legittimita o crisi." : "Crea un territorio solo se produce confini, potere o scelta.",
        link: topTerritory?.file?.path ?? "z.bases/Luoghi.base",
        cls: topTerritory ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Relazioni",
        meta: `${data.relations.length} patti, rivalita o trattati`,
        body: topRelation ? pageTitle(topRelation) : "Nessuna relazione diplomatica nel filtro corrente.",
        importa: topRelation ? fieldText(topRelation.posta ?? topRelation.conseguenze ?? topRelation.prossima_mossa) || "Definisci posta e conseguenze." : "Le relazioni servono quando due poteri si influenzano davvero.",
        link: topRelation?.file?.path ?? "z.bases/Worldbuilding.base",
        cls: topRelation ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Crisi",
        meta: `${data.crisisTerritories.length + data.crisisRelations.length} pressioni politiche`,
        body: data.pressureRows[0] ? pageTitle(data.pressureRows[0]) : "Nessuna crisi attiva.",
        importa: data.pressureRows[0] ? fieldText(data.pressureRows[0].prossima_mossa ?? data.pressureRows[0].crisi_interne ?? data.pressureRows[0].posta) || "Scrivi cosa cambia." : "Le crisi devono puntare al tavolo o al mondo vivo.",
        link: data.pressureRows[0]?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: data.pressureRows.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Economia politica",
        meta: `${data.routes.length} rotte · ${data.markets.length} mercati`,
        body: topEconomy ? pageTitle(topEconomy) : "Nessun nodo economico collegato.",
        importa: topEconomy ? fieldText(topEconomy.prossima_mossa ?? topEconomy.rischi ?? topEconomy.risorse) || "Collega confine, pedaggio o controllore." : "Aggiungi rotte e mercati quando il potere passa da scambio e risorse.",
        link: topEconomy?.file?.path ?? "Hub/Economia E Rotte.md",
        cls: topEconomy ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Buchi",
        meta: `${data.issues.length} problemi strutturali`,
        body: data.issues[0] ? data.issues[0].problem : "Nessun buco geopolitico evidente.",
        importa: data.issues[0] ? pageTitle(data.issues[0].page) : "I domini principali hanno abbastanza contesto per essere usati.",
        link: data.issues[0]?.page?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: data.issues.length ? "gdr-kind-missing" : "gdr-kind-ready"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-geopolitical-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderGeopoliticalReadiness(dv, worldLink = "") {
    const data = geopoliticalData(dv, worldLink);
    const stats = [
      ["Territori", data.territories.length, "stati e domini politici"],
      ["Relazioni", data.relations.length, "patti, rivalita, trattati"],
      ["Crisi", data.crisisTerritories.length + data.crisisRelations.length, "pressioni politiche"],
      ["Risorse", data.resourceRows.length, "leve economiche o rituali"],
      ["Rotte", data.routes.length, "vie commerciali e confini"],
      ["Mercati", data.markets.length, "nodi di potere economico"],
      ["Confini", data.borderRows.length, "dipendenze e vassalli"],
      ["Buchi", data.issues.length, "campi politici mancanti"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-geopolitical-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readGeopoliticalCockpit() {
    return readJsonRel("z.automazioni/data/runtime/geopolitical_cockpit.json", {
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

  async function renderGeopoliticalQueues(dv, worldLink = "") {
    const cockpit = await readGeopoliticalCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = geopoliticalData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "territories",
      ["Territorio", "Tipo", "Stabilita", "Pressione", "Legittimita", "Capitale", "Governante", "Prossima mossa"],
      sortByPressure(data.territories).slice(0, 30).map(page => [pageLink(page), typeOf(page), page.stabilita ?? "", pressure(page) || "", fieldText(page.legittimita) || "", page.capitale ?? "", page.governante ?? "", fieldText(page.prossima_mossa) || ""]),
      "Nessun territorio politico con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "relations",
      ["Relazione", "Tipo", "Soggetti", "Intensita", "Pressione", "Posta", "Conseguenze", "Prossima mossa"],
      sortByPressure(data.relations).slice(0, 30).map(page => [pageLink(page), page.tipo ?? "", page.soggetti ?? [], page.intensita ?? "", pressure(page) || "", fieldText(page.posta) || "", page.conseguenze ?? [], fieldText(page.prossima_mossa) || ""]),
      "Nessuna relazione diplomatica con il filtro corrente."
    );
  }

  async function renderGeopoliticalPressureQueues(dv, worldLink = "") {
    const cockpit = await readGeopoliticalCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = geopoliticalData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "borders",
      ["Territorio", "Confini", "Vassalli", "Luogo padre", "Relazioni", "Rivali"],
      data.borderRows.slice(0, 30).map(page => [pageLink(page), page.confini ?? [], page.vassalli ?? [], page.luogo_padre ?? "", page.relazioni ?? [], page.rivali ?? []]),
      "Nessun confine, vassallo o legame territoriale con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "resources",
      ["Territorio", "Risorse", "Fazioni", "Culture", "Religioni", "Crisi"],
      data.resourceRows.slice(0, 30).map(page => [pageLink(page), page.risorse_strategiche ?? page.risorse ?? [], page.fazioni ?? [], page.culture ?? [], page.religioni ?? [], page.crisi_interne ?? []]),
      "Nessuna risorsa strategica territoriale con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "economic_nodes",
      ["Elemento", "Tipo", "Stato", "Luoghi", "Controllori", "Risorse", "Pressione"],
      data.economicNodes.slice(0, 30).map(page => [
        pageLink(page),
        page.file?.folder?.includes("/Rotte") ? "rotta" : "mercato",
        page.stato_rotta ?? page.stato ?? "",
        page.file?.folder?.includes("/Rotte")
          ? [page.partenza, page.arrivo, ...dvItems(dv, page.regioni)].filter(Boolean)
          : page.luogo ?? page.luoghi ?? [],
        page.fazioni_controllanti ?? page.fazioni ?? [],
        page.risorse_trasportate ?? page.risorse ?? [],
        pressure(page) || ""
      ]),
      "Nessuna rotta o mercato geopolitico con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "gaps",
      ["Nota", "Problema", "Tipo", "Stato"],
      data.issues.slice(0, 30).map(row => [pageLink(row.page), row.problem, row.type, row.state]),
      "Nessun buco geopolitico evidente con il filtro corrente."
    );
  }

  async function renderGeopoliticalSurfaceLinks(dv) {
    const cockpit = await readGeopoliticalCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici geopolitica non configurate",
        action: "Rigenera il contratto Geopolitical Dashboard dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-geopolitical-surfaces" });
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
    renderGeopoliticalNow,
    renderGeopoliticalPressureQueues,
    renderGeopoliticalQueues,
    renderGeopoliticalReadiness,
    renderGeopoliticalSurfaceLinks
  };
})
