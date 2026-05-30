(ctx => {
  const {
    cardHtml,
    escapeHtml,
    fieldText,
    hasPrivateFields,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pluginStatus,
    readJsonRel,
    renderEmptyState
  } = ctx;

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function"
      ? data.array()
      : Array.isArray(value) ? value : value ? [value] : [];
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function realPage(page) {
    const folderIndex = page?.file?.name === page?.file?.folder?.split("/").pop();
    return isReal(page) && !folderIndex && page.stato !== "archiviata" && page.stato !== "ignorata";
  }

  function atlasScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const scoped = page => realPage(page) && matchesWorld(page);
    const places = dv.pages('"Mondi/Luoghi"').where(scoped).array();
    const maps = dv.pages('"Risorse/Mappe"')
      .where(page => realPage(page) && page.file?.name !== "Mappe" && matchesWorld(page))
      .array();
    const routes = dv.pages('"Mondi/Rotte"').where(scoped).array();
    const powers = dv.pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti"').where(scoped).array();
    const cultures = dv.pages('"Mondi/Culture" OR "Mondi/Lingue"').where(scoped).array();
    const history = dv.pages('"Mondi/Storia" OR "Mondi/Timeline"').where(scoped).array();
    return { places, maps, routes, powers, cultures, history, selectedWorld };
  }

  function pressure(page) {
    return Number(page?.pressione ?? page?.pericolo ?? 0) || 0;
  }

  function atlasGapRows(dv, scope) {
    const rows = [];
    const add = (page, problem, action, priority = 1) => rows.push({ page, problem, action, priority });

    for (const place of scope.places) {
      if (!hasValue(dv, place.mappe) && !hasValue(dv, place.mappa) && !hasValue(dv, place.coordinates)) {
        add(place, "luogo senza mappa o coordinate", "Collega una mappa o compila coordinates per il marker.", 5);
      }
      if (!hasValue(dv, place.luogo_padre) && !["continente", "mondo", "regione"].includes(String(place.tipo ?? ""))) {
        add(place, "luogo senza gerarchia", "Collega regione, luogo superiore o territorio.", 3);
      }
      if (!hasValue(dv, place.fazioni) && !hasValue(dv, place.governante)) {
        add(place, "luogo senza potere", "Collega chi controlla, minaccia o usa questo luogo.", 4);
      }
      if (place.stato === "pronto" && !hasValue(dv, place.pericolo) && !hasValue(dv, place.tensione)) {
        add(place, "luogo pronto senza rischio", "Scrivi pericolo, tensione o pressione spendibile.", 3);
      }
    }

    for (const map of scope.maps) {
      if (!hasValue(dv, map.luogo) && !hasValue(dv, map.luoghi)) {
        add(map, "mappa senza luoghi collegati", "Collega almeno un luogo o territorio.", 5);
      }
      if (map.pubblico === true && !hasValue(dv, map.player_safe) && !hasValue(dv, map.cosa_mostrare)) {
        add(map, "mappa pubblica senza testo sicuro", "Scrivi cosa possono vedere i giocatori.", 5);
      }
      if (map.pubblico !== true && !hasValue(dv, map.versione_giocatori)) {
        add(map, "mappa DM senza versione giocatori", "Crea o collega una versione condivisibile.", 2);
      }
    }

    for (const route of scope.routes) {
      if (!hasValue(dv, route.partenza) || !hasValue(dv, route.arrivo)) {
        add(route, "rotta senza estremi", "Compila partenza e arrivo.", 4);
      }
      if (pressure(route) > 0 && !hasValue(dv, route.prossima_mossa)) {
        add(route, "rotta sotto pressione senza mossa", "Decidi cosa succede se resta bloccata o contesa.", 4);
      }
    }

    for (const culture of scope.cultures) {
      if (!hasValue(dv, culture.luoghi) && !hasValue(dv, culture.regioni)) {
        add(culture, "cultura o lingua senza luoghi", "Collega dove si parla, vive o lascia tracce.", 2);
      }
    }

    for (const event of scope.history) {
      if (hasValue(dv, event.data_mondo) && !hasValue(dv, event.luoghi)) {
        add(event, "evento storico senza luogo", "Collega il territorio dove si vede ancora l'effetto.", 2);
      }
    }

    return rows.sort((left, right) => right.priority - left.priority || (right.page?.file?.mtime ?? 0) - (left.page?.file?.mtime ?? 0));
  }

  function atlasMarkerRows(dv, scope) {
    return scope.places
      .filter(place => hasValue(dv, place.coordinates) || hasValue(dv, place.layer_mappa) || hasValue(dv, place.tipo_mappa))
      .sort((left, right) => String(left.layer_mappa ?? "").localeCompare(String(right.layer_mappa ?? "")) || pageTitle(left).localeCompare(pageTitle(right)));
  }

  function atlasRouteRows(dv, scope) {
    return [...scope.routes, ...scope.powers, ...scope.places]
      .filter(page => pressure(page) > 0 || hasValue(dv, page.prossima_mossa) || hasValue(dv, page.stato_rotta))
      .sort((left, right) => pressure(right) - pressure(left) || pageTitle(left).localeCompare(pageTitle(right)));
  }

  function atlasPublicMapRows(dv, scope) {
    return [...scope.maps, ...scope.places]
      .filter(page => page.pubblico === true || hasValue(dv, page.player_safe) || hasValue(dv, page.versione_giocatori) || hasValue(dv, page.cosa_mostrare))
      .sort((left, right) => (hasPrivateFields(left) === hasPrivateFields(right) ? 0 : hasPrivateFields(left) ? 1 : -1));
  }

  function renderAtlasNow(dv, worldLink = "") {
    const scope = atlasScope(dv, worldLink);
    const gaps = atlasGapRows(dv, scope);
    const markers = atlasMarkerRows(dv, scope);
    const routes = atlasRouteRows(dv, scope);
    const publicMaps = atlasPublicMapRows(dv, scope);
    const next = gaps.length
      ? ["Fai adesso: chiudi un buco cartografico", gaps[0].problem, gaps[0].action, gaps[0].page?.file?.path ?? ""]
      : routes.length
        ? ["Fai adesso: scegli una rotta o pressione", pageTitle(routes[0]), fieldText(routes[0].prossima_mossa) || "Decidi il prossimo cambio nello spazio.", routes[0].file?.path ?? ""]
        : markers.length
          ? ["Fai adesso: usa un marker pronto", pageTitle(markers[0]), "Apri Atlante Mappe o porta il luogo in una scena.", markers[0].file?.path ?? ""]
          : ["Fai adesso: crea un luogo mappabile", "Nessun marker pronto.", "Crea o collega un luogo con coordinate, mappa o layer.", ""];
    const cards = [
      cardHtml({
        title: next[0],
        meta: next[1],
        body: next[2],
        importa: "L'Atlante decide cosa e utilizzabile nello spazio, non cosa e solo descritto.",
        link: next[3],
        cls: `gdr-info-card compact ${gaps.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Marker pronti",
        meta: `${markers.length} luoghi`,
        body: markers[0] ? pageTitle(markers[0]) : "Nessun luogo con coordinate o layer.",
        importa: markers[0] ? fieldText(markers[0].coordinates ?? markers[0].layer_mappa) : "Compila coordinates, icon, color o layer_mappa.",
        link: markers[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${markers.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Rotte e territori",
        meta: `${routes.length} pressioni`,
        body: routes[0] ? pageTitle(routes[0]) : "Nessuna rotta o pressione territoriale.",
        importa: routes[0] ? fieldText(routes[0].prossima_mossa ?? routes[0].stato_rotta) || "Aggiungi prossima_mossa." : "Crea rotta, territorio conteso o fazione con pressione.",
        link: routes[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${routes.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Mappe player-safe",
        meta: `${publicMaps.length} candidate`,
        body: publicMaps[0] ? pageTitle(publicMaps[0]) : "Nessuna mappa condivisibile.",
        importa: publicMaps[0] ? fieldText(publicMaps[0].player_safe ?? publicMaps[0].cosa_mostrare ?? publicMaps[0].versione_giocatori) || "Verifica campi DM." : "Compila versione_giocatori o player_safe.",
        link: publicMaps[0]?.pubblico === true && !hasPrivateFields(publicMaps[0]) ? publicMaps[0].file?.path ?? "" : "",
        cls: `gdr-info-card compact ${publicMaps.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-atlas-now" });
    grid.innerHTML = cards.join("");
  }

  function renderAtlasReadiness(dv, worldLink = "") {
    const scope = atlasScope(dv, worldLink);
    const gaps = atlasGapRows(dv, scope);
    const markers = atlasMarkerRows(dv, scope);
    const routes = atlasRouteRows(dv, scope);
    const publicMaps = atlasPublicMapRows(dv, scope);
    const stats = [
      ["Luoghi", scope.places.length, "spazio giocabile"],
      ["Marker", markers.length, "coordinate o layer"],
      ["Mappe", scope.maps.length, "supporti collegati"],
      ["Rotte", scope.routes.length, "viaggi e strozzature"],
      ["Pressioni", routes.length, "territori in movimento"],
      ["Buchi", gaps.length, "interventi cartografici"],
      ["Player-safe", publicMaps.length, "condivisibili o quasi"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-atlas-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function renderAtlasQueues(dv, worldLink = "") {
    const cockpit = await readJsonRel("z.automazioni/data/runtime/atlas_cockpit.json", { queues: [] });
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const scope = atlasScope(dv, worldLink);
    const gaps = atlasGapRows(dv, scope).slice(0, 14);
    const markers = atlasMarkerRows(dv, scope).slice(0, 14);
    const routes = atlasRouteRows(dv, scope).slice(0, 14);
    const publicMaps = atlasPublicMapRows(dv, scope).slice(0, 14);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "gaps",
      ["Nota", "Problema", "Azione"],
      gaps.map(row => [row.page.file?.link ?? row.page.file?.path, row.problem, row.action]),
      "Nessun buco cartografico evidente con il filtro corrente."
    );
    renderTable(
      "markers",
      ["Nota", "Coordinate", "Layer"],
      markers.map(page => [page.file?.link ?? page.file?.path, fieldText(page.coordinates) || "da controllare", fieldText(page.layer_mappa ?? page.tipo_mappa)]),
      "Nessun marker pronto nel filtro corrente."
    );
    renderTable(
      "routes",
      ["Nota", "Pressione", "Prossima mossa"],
      routes.map(page => [page.file?.link ?? page.file?.path, pressure(page) || "", fieldText(page.prossima_mossa ?? page.stato_rotta) || "da decidere"]),
      "Nessuna rotta o pressione territoriale nel filtro corrente."
    );
    renderTable(
      "public_maps",
      ["Nota", "Stato", "Mostrare"],
      publicMaps.map(page => [page.file?.link ?? page.file?.path, hasPrivateFields(page) ? "da ripulire" : page.pubblico === true ? "pubblica" : page.stato ?? "", fieldText(page.player_safe ?? page.cosa_mostrare ?? page.versione_giocatori) || "da compilare"]),
      "Nessuna mappa o luogo player-safe nel filtro corrente."
    );
  }

  async function renderAtlasSurfaceLinks(dv) {
    const cockpit = await readJsonRel("z.automazioni/data/runtime/atlas_cockpit.json", { surfaces: [] });
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici atlante non configurate",
        action: "Rigenera il contratto Atlante dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-atlas-surfaces" });
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
    renderAtlasNow,
    renderAtlasQueues,
    renderAtlasReadiness,
    renderAtlasSurfaceLinks
  };
})
