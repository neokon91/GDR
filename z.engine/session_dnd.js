(ctx => {
  const {
    activeSession,
    cardClass,
    cardHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    pageTitle,
    pagesFromLinks,
    renderCardGrid,
    renderEmptyState
  } = ctx;

  function materialReadiness(page, kind = "materiale") {
    const issues = [];
    if (!page) return ["manca nota"];

    if (kind === "incontro") {
      if (!hasLinks(page.luogo)) issues.push("manca luogo");
      if (!hasLinks(page.missioni) && !hasLinks(page.fazioni) && !hasLinks(page.sessioni)) issues.push("non agganciato a missione/fazione/sessione");
      if (String(page.tipo ?? "") === "combattimento" && !hasLinks(page.creatures) && !hasLinks(page.creature)) issues.push("combattimento senza creature");
      if (String(page.tipo ?? "") === "combattimento" && !hasLinks(page.encounter_creatures) && !hasText(page.encounter_creatures)) issues.push("manca Initiative Tracker");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.gancio)) issues.push("manca uso al tavolo");
      if (!hasText(page.prossima_mossa)) issues.push("manca esito se ignorato");
    }

    if (kind === "creatura") {
      if (!hasLinks(page.luoghi) && !hasText(page.habitat)) issues.push("manca habitat/luogo");
      if (!hasLinks(page.missioni) && !hasLinks(page.fazioni) && !hasLinks(page.sessioni) && !hasLinks(page.connessioni)) issues.push("isolata dal mondo");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.gancio)) issues.push("manca uso al tavolo");
      if (!hasText(page.player_safe)) issues.push("manca versione player-safe");
    }

    if (kind === "oggetto") {
      if (!hasLinks(page.luogo) && !hasLinks(page.proprietario)) issues.push("manca luogo/proprietario");
      if (!hasLinks(page.missioni) && !hasLinks(page.sessioni) && !hasLinks(page.connessioni)) issues.push("isolato da missione/sessione/mondo");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.gancio)) issues.push("manca uso al tavolo");
      if (!hasText(page.player_safe)) issues.push("manca versione player-safe");
    }

    return issues;
  }

  function linkedUniquePages(dv, links) {
    const seen = new Set();
    return pagesFromLinks(dv, links ?? [])
      .array()
      .filter(page => {
        if (!page?.file?.path || seen.has(page.file.path)) return false;
        seen.add(page.file.path);
        return true;
      });
  }

  function renderDnd55MaterialPipeline(dv, source = null) {
    const session = source ?? activeSession(dv);
    if (!session) {
      renderEmptyState(dv, {
        title: "Nessuna sessione attiva",
        action: "Attiva o apri una sessione prima di controllare incontri, creature e ricompense.",
        link: "Risorse/Preparazione Sessione.md"
      });
      return;
    }

    const encounters = linkedUniquePages(dv, session.incontri);
    const directCreatures = linkedUniquePages(dv, session.creature);
    const encounterCreatures = encounters.flatMap(encounter => linkedUniquePages(dv, encounter.creatures ?? encounter.creature));
    const directObjects = linkedUniquePages(dv, session.oggetti ?? session.ricompense);
    const encounterObjects = encounters.flatMap(encounter => linkedUniquePages(dv, encounter.ricompense));
    const creatures = linkedUniquePages(dv, [...directCreatures.map(p => p.file.link), ...encounterCreatures.map(p => p.file.link)]);
    const objects = linkedUniquePages(dv, [...directObjects.map(p => p.file.link), ...encounterObjects.map(p => p.file.link)]);

    const rows = [
      ...encounters.map(page => ({ page, kind: "incontro", badge: "Incontro" })),
      ...creatures.map(page => ({ page, kind: "creatura", badge: "Creatura" })),
      ...objects.map(page => ({ page, kind: "oggetto", badge: "Oggetto" }))
    ];

    if (!rows.length) {
      renderEmptyState(dv, {
        title: "Materiale D&D non collegato",
        action: "Collega almeno un incontro, creatura o oggetto alla sessione o a un incontro della sessione.",
        button: "BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]"
      });
      return;
    }

    renderCardGrid(dv, rows, ({ page, kind, badge }) => {
      const issues = materialReadiness(page, kind);
      const body = kind === "incontro"
        ? fieldText(page.uso_al_tavolo ?? page.gancio ?? page.creatures ?? page.creature)
        : fieldText(page.uso_al_tavolo ?? page.gancio ?? page.player_safe);
      const why = issues.length
        ? `Gap: ${issues.join(", ")}`
        : fieldText(page.missioni ?? page.fazioni ?? page.luoghi ?? page.luogo ?? page.sessioni ?? page.connessioni);

      return cardHtml({
        title: pageTitle(page),
        meta: [page.categoria ?? kind, page.tipo, page.stato].filter(Boolean).join(" · "),
        azione: body || "Apri e completa uso al tavolo, agganci e conseguenze.",
        importa: why,
        link: page.file.path,
        badge,
        cls: cardClass(page, "gdr-info-card compact", issues.length ? "gdr-kind-missing" : "gdr-kind-ready")
      });
    }, {
      title: "Nessun materiale D&D pronto",
      action: "Crea o collega materiale D&D alla sessione."
    });
  }

  function renderCombatReadiness(dv, source = '"Mondi/Incontri"', limit = 24) {
    const rows = dv.pages(source)
      .where(p => isReal(p) && p.stato !== "archiviata" && String(p.tipo ?? "") === "combattimento")
      .sort(p => Number(p.pericolo ?? p.pressione ?? 0), "desc")
      .limit(limit)
      .array();

    renderCardGrid(dv, rows, page => {
      const issues = materialReadiness(page, "incontro");
      return cardHtml({
        title: pageTitle(page),
        meta: [page.stato, page.luogo ? fieldText(page.luogo) : "", `pericolo ${page.pericolo ?? 0}`].filter(Boolean).join(" · "),
        azione: fieldText(page.creatures ?? page.creature ?? page.encounter_creatures) || "Collega creature e Initiative Tracker.",
        importa: issues.length ? `Gap: ${issues.join(", ")}` : fieldText(page.missioni ?? page.fazioni ?? page.sessioni),
        link: page.file.path,
        badge: "Combattimento",
        cls: cardClass(page, "gdr-info-card compact", issues.length ? "gdr-kind-missing" : "gdr-kind-ready")
      });
    }, {
      title: "Nessun combattimento pronto",
      action: "Crea un incontro di combattimento solo quando serve round-by-round.",
      button: "BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]"
    });
  }

  return {
    renderCombatReadiness,
    renderDnd55MaterialPipeline
  };
})
