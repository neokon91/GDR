(ctx => {
  const {
    activeSession,
    asArray,
    cardClass,
    cardHtml,
    escapeHtml,
    fieldText,
    hasText,
    isReal,
    linkKey,
    pageFromLink,
    pageTitle,
    pagesFromLinks,
    pluginStatus,
    readJsonRel,
    renderCardGrid,
    renderEmptyState
  } = ctx;

  const USE_LABELS = {
    canvas: "Canvas",
    dungeon: "Dungeon",
    esagoni: "Esagoni",
    fronte: "Fronte",
    indizi: "Indizi",
    mappa: "Mappa",
    regione: "Regione",
    relazioni: "Relazioni",
    scena: "Scena",
    tavolo: "Tavolo",
    zoom: "Zoom"
  };

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
    return isReal(page) && !folderIndex(page) && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
  }

  function realMap(page) {
    return realPage(page) && page?.file?.name !== "Mappe";
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function mapUse(page) {
    return String(page?.uso ?? page?.tipo ?? "mappa").trim().toLowerCase() || "mappa";
  }

  function mapUseLabel(page) {
    const use = mapUse(page);
    return USE_LABELS[use] ?? use;
  }

  function matchesWorld(page, selectedWorld) {
    return !selectedWorld || linkKey(page?.mondo) === selectedWorld || page?.file?.path === selectedWorld;
  }

  function uniquePages(rows) {
    const seen = new Set();
    return rows.filter(page => {
      const key = page?.file?.path ?? page?.file?.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function mapPages(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    return dv.pages('"Risorse/Mappe"')
      .where(page => realMap(page) && matchesWorld(page, selectedWorld))
      .array()
      .sort((left, right) => String(mapUse(left)).localeCompare(String(mapUse(right))) || String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
  }

  function sessionMapPages(dv) {
    const active = activeSession(dv);
    if (!active) return [];

    const seen = new Set();
    const collect = links => pagesFromLinks(dv, links ?? [])
      .array()
      .filter(realMap)
      .filter(page => {
        const key = page?.file?.path;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const direct = collect(active.mappe ?? active.mappa);
    const fromEncounters = dvItems(dv, active.incontri)
      .map(link => pageFromLink(dv, link))
      .filter(realPage)
      .flatMap(page => collect(page.mappe ?? page.mappa));
    const pages = uniquePages([...direct, ...fromEncounters]);

    if (pages.length) return pages;

    const placeKeys = new Set(dvItems(dv, active.luoghi ?? active.luogo).map(linkKey).filter(Boolean));
    if (!placeKeys.size) return [];

    return dv.pages('"Risorse/Mappe"')
      .where(realMap)
      .where(page => placeKeys.has(linkKey(page.luogo)) || dvItems(dv, page.luoghi).some(link => placeKeys.has(linkKey(link))))
      .sort(page => page.file?.mtime ?? 0, "desc")
      .limit(8)
      .array();
  }

  function mapIssues(dv, page) {
    const issues = [];
    const use = mapUse(page);
    const add = (problem, action, priority) => issues.push({ problem, action, priority });
    const hasWorldOrPlace = hasValue(dv, page.mondo) || hasValue(dv, page.luogo) || hasValue(dv, page.luoghi) || hasValue(dv, page.coordinates);

    if (!hasValue(dv, page.uso)) {
      add("uso mancante", "Compila uso con zoom, fronte, regione, esagoni, dungeon, scena, indizi o tavolo.", 5);
    }
    if (!hasWorldOrPlace) {
      add("senza aggancio", "Collega mondo, luogo, luoghi o coordinate.", 5);
    }
    if (page.pubblico === true && !hasValue(dv, page.player_safe) && !hasValue(dv, page.cosa_mostrare) && !hasValue(dv, page.versione_giocatori)) {
      add("player-safe assente", "Scrivi cosa possono vedere i giocatori o collega una versione giocatori.", 5);
    }
    if (!hasValue(dv, page.uso_al_tavolo) && !hasValue(dv, page.cosa_mostrare) && !hasValue(dv, page.player_safe) && !hasValue(dv, page.prossima_mossa)) {
      add("uso al tavolo assente", "Scrivi quando aprirla e quale scelta, rotta, indizio o scena risolve.", 4);
    }
    if (["relazioni", "fronte", "indizi"].includes(use) && !hasValue(dv, page.fazioni) && !hasValue(dv, page.personaggi) && !hasValue(dv, page.missioni) && !hasValue(dv, page.soggetti) && !hasValue(dv, page.connessioni)) {
      add("nodi non collegati", "Collega fazioni, PNG, missioni, soggetti o connessioni.", 3);
    }
    if (["zoom", "dungeon", "scena", "tavolo"].includes(use) && !hasValue(dv, page.luogo) && !hasValue(dv, page.luoghi) && !hasValue(dv, page.incontri)) {
      add("scena senza luogo", "Collega luogo, luoghi o incontri che useranno la mappa.", 3);
    }
    if (["regione", "esagoni"].includes(use) && !hasValue(dv, page.luoghi) && !hasValue(dv, page.regioni) && !hasValue(dv, page.coordinates)) {
      add("territorio non tracciato", "Collega luoghi, regioni o coordinate prima di usarla per viaggi.", 3);
    }

    return issues.sort((left, right) => right.priority - left.priority || left.problem.localeCompare(right.problem));
  }

  function integratedLayerRows(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const sources = [
      ["Mondi/Luoghi", "Luogo"],
      ["Mondi/Rotte", "Rotta"],
      ["Mondi/Risorse", "Risorsa"],
      ["Mondi/Mercati", "Mercato"],
      ["Mondi/Compendium", "Compendium"],
      ["Mondi/Religioni", "Religione"],
      ["Mondi/Conflitti", "Conflitto"],
      ["Mondi/Missioni", "Missione"]
    ];

    return sources.flatMap(([source, badge]) => dv.pages(`"${source}"`)
      .where(page => realPage(page) && matchesWorld(page, selectedWorld))
      .where(page => hasValue(dv, page.mappa) || hasValue(dv, page.mappe) || hasValue(dv, page.coordinates) || hasValue(dv, page.layer_mappa) || hasValue(dv, page.tipo_mappa))
      .array()
      .map(page => ({ page, badge })))
      .sort((left, right) => String(left.page.layer_mappa ?? left.page.tipo_mappa ?? "").localeCompare(String(right.page.layer_mappa ?? right.page.tipo_mappa ?? "")) || String(left.page.file?.name ?? "").localeCompare(String(right.page.file?.name ?? "")));
  }

  function mapData(dv, worldLink = "") {
    const pages = mapPages(dv, worldLink);
    const gaps = pages.flatMap(page => mapIssues(dv, page).map(issue => ({
      page,
      ...issue
    }))).sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
    const ready = pages
      .filter(page => !mapIssues(dv, page).length || page.stato === "pronto" || hasValue(dv, page.player_safe) || hasValue(dv, page.uso_al_tavolo))
      .sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
    const publicMaps = pages
      .filter(page => page.pubblico === true || hasValue(dv, page.player_safe) || hasValue(dv, page.versione_giocatori))
      .sort((left, right) => (left.pubblico === true ? 0 : 1) - (right.pubblico === true ? 0 : 1) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
    const sessionMaps = sessionMapPages(dv);
    const layers = integratedLayerRows(dv, worldLink);

    return {
      gaps,
      layers,
      pages,
      publicMaps,
      ready,
      sessionMaps
    };
  }

  function mapCard(page, options = {}) {
    const show = fieldText(page.player_safe ?? page.cosa_mostrare ?? page.luoghi ?? page.luogo) || "Mostra solo i luoghi e i riferimenti gia sicuri.";
    const hide = page.pubblico === true
      ? "Nessun segreto DM nella mappa pubblica."
      : fieldText(page.cosa_nascondere ?? page.prossima_mossa ?? page.segreti) || "Nascondi segreti, prossime mosse e layer non rivelati.";
    const playerVersion = fieldText(page.versione_giocatori);
    const action = options.azione ?? (fieldText(page.uso_al_tavolo ?? page.gancio) || "Apri la mappa quando orientamento o scelta spaziale contano.");
    const why = [
      `Mostra: ${show}`,
      `Nascondi: ${hide}`,
      playerVersion ? `Giocatori: ${playerVersion}` : ""
    ].filter(Boolean).join(" - ");

    return cardHtml({
      title: pageTitle(page),
      meta: [page.uso ?? page.tipo, page.pubblico === true ? "pubblica" : "DM", page.stato].filter(Boolean).join(" - "),
      azione: action,
      importa: why,
      link: page.file.path,
      badge: options.badge ?? "Mappa",
      cls: cardClass(page, "gdr-info-card compact", page.pubblico === true ? "gdr-card-player gdr-kind-ready" : "")
    });
  }

  function mapPagesForWorld(dv, worldLink = "", limit = 12) {
    const worldPath = linkKey(worldLink);
    return dv.pages('"Risorse/Mappe"')
      .where(p => isReal(p) && p.file.name !== "Mappe" && p.stato !== "archiviata")
      .where(p => !worldPath || linkKey(p.mondo) === worldPath)
      .sort(p => p.pubblico === true ? 0 : 1, "asc")
      .sort(p => p.uso ?? "", "asc")
      .limit(limit)
      .array();
  }

  function renderAtlasMapCards(dv, worldLink = "") {
    renderCardGrid(dv, mapPagesForWorld(dv, worldLink, 16), p => mapCard(p), {
      title: "Nessuna mappa pronta",
      action: "Crea una mappa zoom o collega almeno un luogo a una mappa esistente.",
      button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
    });
  }

  function renderPlaceMapCards(dv, place = dv.current()) {
    const placeKeys = new Set([place?.file?.path, place?.file?.name, linkKey(place?.file?.path)].filter(Boolean));
    const linked = pagesFromLinks(dv, place?.mappe ?? []).array();
    const matchesPlace = p => placeKeys.has(linkKey(p.luogo))
      || dv.array(p.luoghi ?? []).some(link => placeKeys.has(linkKey(link)) || placeKeys.has(link?.path));
    const pages = linked.length
      ? linked
      : dv.pages('"Risorse/Mappe"')
        .where(p => isReal(p) && p.file.name !== "Mappe" && p.stato !== "archiviata" && matchesPlace(p))
        .sort(p => p.pubblico === true ? 0 : 1, "asc")
        .sort(p => p.uso ?? "", "asc")
        .limit(8)
        .array();

    renderCardGrid(dv, pages, p => mapCard(p, {
      badge: "Mappa luogo",
      azione: fieldText(p.uso_al_tavolo) || "Apri questa mappa quando il luogo entra in scena."
    }), {
      title: "Nessuna mappa collegata al luogo",
      action: "Compila il campo mappe del luogo o crea una mappa zoom collegata a questa nota.",
      button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
    });
  }

  function renderSessionMapCards(dv, source = null) {
    const active = source ?? activeSession(dv);
    if (!active) {
      renderEmptyState(dv, {
        title: "Nessuna sessione disponibile",
        action: "Apri o crea una sessione prima di scegliere le mappe al tavolo.",
        link: "Risorse/Preparazione Sessione.md"
      });
      return;
    }

    const seen = new Set();
    const collect = links => pagesFromLinks(dv, links ?? [])
      .array()
      .filter(p => {
        if (!p?.file?.path || seen.has(p.file.path)) return false;
        seen.add(p.file.path);
        return true;
      });
    const pages = [
      ...collect(active.mappe),
      ...dv.array(active.incontri ?? [])
        .map(link => pageFromLink(dv, link))
        .where(Boolean)
        .array()
        .flatMap(p => collect(p.mappe))
    ];

    if (!pages.length) {
      const placeKeys = new Set(dv.array(active.luoghi ?? []).map(linkKey).array());
      dv.pages('"Risorse/Mappe"')
        .where(p => isReal(p) && p.file.name !== "Mappe" && p.stato !== "archiviata")
        .where(p => placeKeys.has(linkKey(p.luogo)) || dv.array(p.luoghi ?? []).some(link => placeKeys.has(linkKey(link))))
        .sort(p => p.uso ?? "", "asc")
        .limit(8)
        .forEach(p => {
          if (!seen.has(p.file.path)) {
            seen.add(p.file.path);
            pages.push(p);
          }
        });
    }

    renderCardGrid(dv, pages, p => mapCard(p, {
      badge: "Mappa sessione",
      azione: fieldText(p.uso_al_tavolo) || "Usa questa mappa nella scena corrente."
    }), {
      title: "Nessuna mappa collegata alla sessione",
      action: "Collega una mappa alla sessione, a un incontro o a un luogo della sessione.",
      button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
    });
  }

  async function readMapsCockpit() {
    return readJsonRel("z.automazioni/data/runtime/maps_cockpit.json", {
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

  function renderMapsNow(dv, worldLink = "") {
    const data = mapData(dv, worldLink);
    if (!data.pages.length) {
      renderEmptyState(dv, {
        title: "Nessuna mappa operativa",
        action: "Crea una mappa zoom o una mappa fronti solo quando serve una scelta, una scena o una rotta.",
        button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
      });
      return;
    }

    const gap = data.gaps[0];
    const sessionMap = data.sessionMaps[0];
    const publicMap = data.publicMaps[0];
    const readyMap = data.ready[0];
    const layer = data.layers[0];
    const next = gap
      ? ["Mappa prima: correggi", pageTitle(gap.page), `${gap.problem}: ${gap.action}`, gap.page.file?.path, "gdr-kind-missing"]
      : sessionMap
        ? ["Mappa prima: sessione", pageTitle(sessionMap), fieldText(sessionMap.uso_al_tavolo ?? sessionMap.player_safe) || "Usala nella sessione attiva.", sessionMap.file?.path, "gdr-kind-ready"]
        : publicMap
          ? ["Mappa prima: mostra", pageTitle(publicMap), fieldText(publicMap.player_safe ?? publicMap.cosa_mostrare) || "Controlla che resti senza segreti DM.", publicMap.file?.path, "gdr-kind-ready"]
          : ["Mappa prima: scegli uso", pageTitle(readyMap), fieldText(readyMap?.uso_al_tavolo) || "Apri la mappa piu recente e collegala al tavolo.", readyMap?.file?.path, "gdr-kind-ready"];
    const cards = [
      cardHtml({
        title: next[0],
        meta: next[1],
        body: next[2],
        importa: "La pagina deve portare a una decisione spaziale, non a un archivio da leggere.",
        link: next[3],
        cls: `gdr-info-card compact ${next[4]}`
      }),
      cardHtml({
        title: "Sessione",
        meta: `${data.sessionMaps.length} mappe collegate`,
        body: sessionMap ? pageTitle(sessionMap) : "Nessuna mappa collegata alla sessione attiva.",
        importa: sessionMap ? fieldText(sessionMap.uso_al_tavolo ?? sessionMap.luogo ?? sessionMap.luoghi) : "Collega una mappa solo se cambia orientamento, posizione o scelta.",
        link: sessionMap?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: `gdr-info-card compact ${data.sessionMaps.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Player-safe",
        meta: `${data.publicMaps.length} candidate`,
        body: publicMap ? pageTitle(publicMap) : "Nessuna mappa consegnabile.",
        importa: publicMap ? fieldText(publicMap.player_safe ?? publicMap.cosa_mostrare ?? publicMap.versione_giocatori) : "Compila cosa_mostrare o versione_giocatori prima di aprire al party.",
        link: publicMap?.file?.path ?? "Hub/Vista Giocatori.md",
        cls: `gdr-info-card compact ${data.publicMaps.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Da correggere",
        meta: `${data.gaps.length} buchi`,
        body: gap ? pageTitle(gap.page) : "Nessun buco bloccante.",
        importa: gap ? gap.action : "Passa a layer integrati, mappa pubblica o nuova mappa mirata.",
        link: gap?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.gaps.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Layer integrati",
        meta: `${data.layers.length} note con mappa`,
        body: layer ? pageTitle(layer.page) : "Nessun luogo, rotta o risorsa ha ancora mappa o coordinate.",
        importa: layer ? fieldText(layer.page.layer_mappa ?? layer.page.tipo_mappa ?? layer.page.coordinates ?? layer.page.mappa) : "Compila coordinate o layer_mappa su note che devono comparire nell'atlante.",
        link: layer?.page?.file?.path ?? "Hub/Atlante del Mondo.md",
        cls: `gdr-info-card compact ${data.layers.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-maps-now" });
    grid.innerHTML = cards.join("");
  }

  function renderMapsReadiness(dv, worldLink = "") {
    const data = mapData(dv, worldLink);
    const useCounts = data.pages.reduce((acc, page) => {
      const use = mapUse(page);
      acc.set(use, (acc.get(use) ?? 0) + 1);
      return acc;
    }, new Map());
    const dominantUse = [...useCounts.entries()].sort((left, right) => right[1] - left[1])[0];
    const stats = [
      ["Mappe", data.pages.length, "supporti non archiviati"],
      ["Pronte", data.ready.length, "usabili o quasi"],
      ["Buchi", data.gaps.length, "campi che bloccano uso o sicurezza"],
      ["Player-safe", data.publicMaps.length, "condivisibili o candidate"],
      ["Sessione", data.sessionMaps.length, "collegate al tavolo attivo"],
      ["Layer", data.layers.length, "note mondo con coordinate o mappa"],
      ["Uso prevalente", dominantUse ? `${USE_LABELS[dominantUse[0]] ?? dominantUse[0]} (${dominantUse[1]})` : "0", "profilo dell'archivio"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-maps-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function renderMapsUseQueues(dv, worldLink = "") {
    const cockpit = await readMapsCockpit();
    const labels = labelsFor(cockpit);
    const data = mapData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "open_gaps",
      ["Mappa", "Problema", "Azione"],
      data.gaps.slice(0, 18).map(row => [pageLink(row.page), row.problem, row.action]),
      "Nessun buco pratico evidente nelle mappe filtrate."
    );
    renderTable(
      dv,
      labels,
      "ready_maps",
      ["Mappa", "Uso", "Stato", "Mostrare"],
      data.ready.slice(0, 18).map(page => [
        pageLink(page),
        mapUseLabel(page),
        page.stato ?? "",
        fieldText(page.player_safe ?? page.cosa_mostrare ?? page.uso_al_tavolo)
      ]),
      "Nessuna mappa pronta o quasi pronta."
    );
    renderTable(
      dv,
      labels,
      "use_archive",
      ["Mappa", "Uso", "Aggancio", "Aggiornata"],
      data.pages.slice(0, 24).map(page => [
        pageLink(page),
        mapUseLabel(page),
        fieldText(page.luogo ?? page.luoghi ?? page.mondo ?? page.coordinates),
        page.file?.mtime ?? ""
      ]),
      "Nessuna mappa in archivio."
    );
  }

  async function renderMapsIntegratedLayers(dv, worldLink = "") {
    const cockpit = await readMapsCockpit();
    const labels = labelsFor(cockpit);
    const data = mapData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "integrated_layers",
      ["Nota", "Tipo", "Layer", "Mappa/coordinate"],
      data.layers.slice(0, 30).map(row => [
        pageLink(row.page),
        row.badge,
        fieldText(row.page.layer_mappa ?? row.page.tipo_mappa ?? row.page.tipo ?? row.page.categoria),
        fieldText(row.page.mappa ?? row.page.mappe ?? row.page.coordinates)
      ]),
      "Nessuna nota di mondo espone ancora mappa, coordinate o layer."
    );
    renderTable(
      dv,
      labels,
      "session_maps",
      ["Mappa", "Uso", "Luogo", "Sicurezza"],
      data.sessionMaps.slice(0, 12).map(page => [
        pageLink(page),
        mapUseLabel(page),
        fieldText(page.luogo ?? page.luoghi),
        page.pubblico === true ? "pubblica" : fieldText(page.versione_giocatori ?? page.player_safe) || "DM"
      ]),
      "Nessuna mappa e collegata alla sessione attiva."
    );
  }

  async function renderMapsSurfaceLinks(dv) {
    const cockpit = await readMapsCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici non configurate",
        action: "Rigenera il contratto Mappe dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-maps-surfaces" });
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
    renderAtlasMapCards,
    renderMapsIntegratedLayers,
    renderMapsNow,
    renderMapsReadiness,
    renderMapsSurfaceLinks,
    renderMapsUseQueues,
    renderPlaceMapCards,
    renderSessionMapCards
  };
})
