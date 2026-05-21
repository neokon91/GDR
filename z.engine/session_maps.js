(ctx => {
  const {
    activeSession,
    cardClass,
    cardHtml,
    fieldText,
    isReal,
    linkKey,
    pageFromLink,
    pageTitle,
    pagesFromLinks,
    renderCardGrid,
    renderEmptyState
  } = ctx;

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
    ].filter(Boolean).join(" · ");

    return cardHtml({
      title: pageTitle(page),
      meta: [page.uso ?? page.tipo, page.pubblico === true ? "pubblica" : "DM", page.stato].filter(Boolean).join(" · "),
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

  return {
    renderAtlasMapCards,
    renderPlaceMapCards,
    renderSessionMapCards
  };
})
