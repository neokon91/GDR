// Runtime DataviewJS per continuita, propagazione e catena live.
context => {
  const {
    activeSession,
    asArray,
    cardClass,
    cardHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pressure,
    renderCardGrid,
    renderEmptyState
  } = context;

  function referencesPage(dv, page, target, fields) {
    const targetKeys = new Set([target?.file?.path, target?.file?.name, linkKey(target?.file?.link)].filter(Boolean));
    return fields.some(field => dv.array(page?.[field] ?? [])
      .some(link => targetKeys.has(linkKey(link)) || targetKeys.has(link?.path) || targetKeys.has(String(link ?? ""))));
  }

  function renderWorldImpact(dv, source = null) {
    const page = source ?? dv.current();
    const playerAction = fieldText(page.azione_giocatori ?? page.scelta ?? page.scelte ?? page.decisioni ?? page.output_sessione)
      || "Annota la scelta o azione dei giocatori che ha mosso il mondo.";
    const consequence = fieldText(page.conseguenza_potenziale ?? page.conseguenza ?? page.conseguenze ?? page.impatto)
      || "Definisci la conseguenza concreta prodotta dall'azione.";
    const propagation = fieldText(page.entita_impattate ?? page.propaga_a)
      || "Collega le entita impattate e dove si propaga l'effetto.";
    const nextMove = fieldText(page.prossima_mossa)
      || "Scrivi cosa accade se nessuno interviene.";
    const chainRows = [
      ["1. Azione giocatori", playerAction, page.azione_giocatori ?? page.scelta ?? page.scelte ?? page.decisioni ?? page.output_sessione],
      ["2. Conseguenza", consequence, page.conseguenza_potenziale ?? page.conseguenza ?? page.conseguenze ?? page.impatto],
      ["3. Propagazione", propagation, page.entita_impattate ?? page.propaga_a],
      ["4. Prossima mossa", nextMove, page.prossima_mossa]
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = chainRows.map(([title, body, value]) => cardHtml({
      title,
      body,
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    const incomingFields = ["connessioni", "entita_impattate", "propaga_a", "missioni", "tracciati", "luoghi", "fazioni", "personaggi"];
    const incoming = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.file.path !== page.file.path && referencesPage(dv, p, page, incomingFields))
      .sort(p => Number(p.pressione ?? p.pericolo ?? 0), "desc")
      .limit(8)
      .array();

    if (!incoming.length) {
      dv.paragraph("Nessuna nota sta ancora reagendo a questa. Collega entita impattate, propaga_a o connessioni vive.");
      return;
    }

    renderCardGrid(dv, incoming, p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo, p.stato].filter(Boolean).join(" · "),
      azione: fieldText(p.prossima_mossa ?? p.uso_al_tavolo ?? p.gancio) || "Apri la nota e definisci la reazione.",
      importa: fieldText(p.entita_impattate ?? p.propaga_a ?? p.connessioni) || "Questa nota punta alla nota corrente.",
      link: p.file.path,
      badge: "Reazione",
      cls: cardClass(p)
    }), {
      title: "Nessuna reazione collegata",
      action: "Collega questa nota da missioni, fazioni, luoghi o conseguenze."
    });
  }

  function continuityStatus(page) {
    return String(page?.propagazione_stato ?? "").trim()
      || (page?.applicata_il ? "applicata" : "")
      || (page?.propagato_il ? "propagata" : "")
      || (hasLinks(page?.entita_impattate) || hasLinks(page?.propaga_a) || hasLinks(page?.conseguenze) ? "aperta" : "");
  }

  function continuityAction(page) {
    const status = continuityStatus(page);
    if (status === "da verificare") {
      return "Apri il bersaglio, applica aggiornamenti_richiesti e poi marca propagazione_stato: propagata.";
    }
    if (hasLinks(page?.entita_impattate) || hasLinks(page?.propaga_a)) {
      if (!["applicata", "propagata", "canonizzata"].includes(status)) {
        return "Usa BUTTON[applica-conseguenza] o BUTTON[propaga-a-entita], poi controlla i bersagli.";
      }
    }
    if (!hasText(page?.prossima_mossa) && ["missione", "tracciato", "fazione", "religione", "relazione", "conflitto"].includes(String(page?.categoria ?? ""))) {
      return "Scrivi la prossima_mossa prima di chiudere la continuita.";
    }
    if (hasLinks(page?.aggiornamenti_richiesti)) {
      return "Converti gli aggiornamenti richiesti in campi aggiornati sulla scheda.";
    }
    if (status === "applicata") return "Verifica che ogni bersaglio abbia reagito; poi propaga o chiudi.";
    if (status === "propagata") return "Controlla recap pubblico e prossima apertura, poi archivia se non serve piu.";
    return "Definisci bersagli, conseguenza concreta e prossima mossa.";
  }

  function continuityIssues(page) {
    const issues = [];
    const hasImpact = hasLinks(page.conseguenze)
      || hasLinks(page.entita_impattate)
      || hasLinks(page.propaga_a)
      || hasText(page.impatto)
      || hasText(page.conseguenza_potenziale)
      || hasText(page.prossima_mossa);
    const hasTarget = hasLinks(page.entita_impattate) || hasLinks(page.propaga_a) || hasLinks(page.applicata_a);
    const status = continuityStatus(page);

    if (hasImpact && !hasTarget) issues.push("manca bersaglio");
    if (hasTarget && !hasText(page.prossima_mossa) && ["missione", "tracciato", "fazione", "religione", "relazione", "conflitto"].includes(String(page.categoria ?? ""))) {
      issues.push("manca prossima mossa");
    }
    if (hasImpact && !["applicata", "propagata", "canonizzata", "archiviata"].includes(status)) issues.push("non applicata");
    if ((page.canonico === true || page.stato_canonico === "canonico") && String(page.categoria ?? "") === "evento storico" && !hasText(page.causa) && !hasLinks(page.cause)) {
      issues.push("manca causa");
    }
    if ((page.canonico === true || page.stato_canonico === "canonico") && String(page.categoria ?? "") === "evento storico" && !hasLinks(page.conseguenze) && !hasLinks(page.effetti) && !hasText(page.effetti)) {
      issues.push("manca effetto");
    }

    return issues;
  }

  function continuityRows(dv, source = '"Mondi" OR "Inbox"', limit = 24) {
    return dv.pages(source)
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => continuityStatus(p)
        || hasLinks(p.conseguenze)
        || hasLinks(p.entita_impattate)
        || hasLinks(p.propaga_a)
        || hasLinks(p.applicata_a)
        || hasLinks(p.propagato_da)
        || hasLinks(p.aggiornamenti_richiesti)
        || hasText(p.impatto)
        || hasText(p.conseguenza_potenziale))
      .sort(p => p.ultima_propagazione ?? p.applicata_il ?? p.propagato_il ?? p.file.mtime, "desc")
      .limit(limit)
      .array();
  }

  function renderContinuityQueue(dv, source = '"Mondi" OR "Inbox"', limit = 24) {
    const pages = continuityRows(dv, source, limit);
    const rows = pages.map(p => [
      p.file.link,
      p.categoria ?? p.tipo ?? "",
      continuityStatus(p) || "aperta",
      p.causa ?? p.cause ?? p.sessioni ?? [],
      p.entita_impattate ?? [],
      p.propaga_a ?? p.applicata_a ?? [],
      p.aggiornamenti_richiesti ?? p.impatto ?? p.conseguenza_potenziale ?? "",
      continuityAction(p),
      p.prossima_mossa ?? ""
    ]);

    if (!rows.length) {
      dv.paragraph("Nessuna continuita aperta.");
      return;
    }

    renderCardGrid(dv, pages.slice(0, 8), p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo ?? "", continuityStatus(p) || "aperta"].filter(Boolean).join(" · "),
      azione: continuityAction(p),
      importa: fieldText(p.aggiornamenti_richiesti ?? p.impatto ?? p.conseguenza_potenziale ?? p.entita_impattate ?? p.propaga_a) || "La nota e nella coda perche contiene continuita o bersagli.",
      link: p.file.path,
      badge: continuityStatus(p) === "da verificare" ? "Da verificare" : "Continuita",
      cls: cardClass(p, "gdr-info-card compact", continuityStatus(p) === "propagata" ? "gdr-kind-ready" : "gdr-kind-missing")
    }), {
      title: "Nessuna continuita aperta",
      action: "Registra una scelta o applica una conseguenza quando il mondo cambia."
    });

    dv.table(["Origine", "Tipo", "Stato", "Causa", "Impattate", "Da aggiornare", "Cambio richiesto", "Azione", "Prossima mossa"], rows);
  }

  function renderPropagationTargets(dv, source = '"Mondi"', limit = 24) {
    const pages = dv.pages(source)
      .where(p => isReal(p) && p.stato !== "archiviata" && (hasLinks(p.propagato_da) || hasLinks(p.aggiornamenti_richiesti) || continuityStatus(p) === "da verificare"))
      .sort(p => p.ultima_propagazione ?? p.file.mtime, "desc")
      .limit(limit)
      .array();
    const rows = pages.map(p => [
      p.file.link,
      p.categoria ?? p.tipo ?? "",
      continuityStatus(p) || "da verificare",
      p.propagato_da ?? [],
      p.aggiornamenti_richiesti ?? [],
      continuityAction(p),
      p.prossima_mossa ?? "",
      p.pressione ?? ""
    ]);

    if (!rows.length) {
      dv.paragraph("Nessun bersaglio di propagazione da verificare.");
      return;
    }

    renderCardGrid(dv, pages.slice(0, 8), p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo ?? "", continuityStatus(p) || "da verificare", p.pressione !== undefined ? `pressione ${p.pressione}` : ""].filter(Boolean).join(" · "),
      azione: fieldText(p.aggiornamenti_richiesti) || continuityAction(p),
      importa: continuityAction(p),
      link: p.file.path,
      badge: "Bersaglio",
      cls: cardClass(p, "gdr-info-card compact", continuityStatus(p) === "da verificare" ? "gdr-kind-missing" : "gdr-kind-ready")
    }), {
      title: "Nessun bersaglio da aggiornare",
      action: "Le propagazioni applicate compariranno qui quando richiedono verifica."
    });

    dv.table(["Bersaglio", "Tipo", "Stato", "Da", "Aggiornamento richiesto", "Azione", "Prossima mossa", "Pressione"], rows);
  }

  function isClosableContinuity(page) {
    const status = continuityStatus(page);
    const hasClosureSignal = hasText(page.prossima_mossa)
      || hasText(page.recap_pubblico)
      || hasLinks(page.effetti)
      || hasText(page.effetti)
      || hasLinks(page.conseguenze);
    return ["propagata", "canonizzata"].includes(status)
      && !hasLinks(page.aggiornamenti_richiesti)
      && hasClosureSignal;
  }

  function renderClosableContinuity(dv, source = '"Mondi" OR "Inbox"', limit = 16) {
    const pages = dv.pages(source)
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => isClosableContinuity(p))
      .sort(p => p.ultima_propagazione ?? p.propagato_il ?? p.file.mtime, "desc")
      .limit(limit)
      .array();

    if (!pages.length) {
      dv.paragraph("Nessuna continuita pronta da chiudere.");
      return;
    }

    renderCardGrid(dv, pages.slice(0, 8), p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo ?? "", continuityStatus(p), p.ultima_propagazione ?? p.propagato_il ?? ""].filter(Boolean).join(" · "),
      azione: "Controlla recap pubblico/prossima apertura, poi archivia o lascia canonizzata.",
      importa: fieldText(p.prossima_mossa ?? p.recap_pubblico ?? p.effetti ?? p.conseguenze) || "La continuita ha segnali di chiusura e non richiede aggiornamenti.",
      link: p.file.path,
      badge: "Chiudibile",
      cls: cardClass(p, "gdr-info-card compact", "gdr-kind-ready")
    }), {
      title: "Nessuna continuita chiudibile",
      action: "Completa aggiornamenti richiesti e marca propagazione_stato: propagata."
    });

    dv.table(
      ["Nota", "Tipo", "Stato", "Chiusura", "Ultima propagazione", "Azione"],
      pages.map(p => [
        p.file.link,
        p.categoria ?? p.tipo ?? "",
        continuityStatus(p),
        p.prossima_mossa ?? p.recap_pubblico ?? p.effetti ?? p.conseguenze ?? "",
        p.ultima_propagazione ?? p.propagato_il ?? "",
        "Archivia, canonizza o lascia come riferimento chiuso."
      ])
    );
  }

  function renderContinuityGaps(dv, source = '"Mondi" OR "Inbox"', limit = 24) {
    const rows = dv.pages(source)
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .map(p => ({ page: p, issues: continuityIssues(p) }))
      .where(entry => entry.issues.length > 0)
      .sort(entry => entry.page.file.mtime, "desc")
      .limit(limit)
      .map(entry => [
        entry.page.file.link,
        entry.issues.join(", "),
        entry.page.categoria ?? entry.page.tipo ?? "",
        continuityStatus(entry.page) || "aperta",
        entry.page.entita_impattate ?? entry.page.propaga_a ?? entry.page.applicata_a ?? [],
        continuityAction(entry.page),
        entry.page.prossima_mossa ?? ""
      ])
      .array();

    if (!rows.length) {
      dv.paragraph("Nessun buco di continuita evidente.");
      return;
    }

    dv.table(["Nota", "Gap", "Tipo", "Stato", "Bersagli", "Azione", "Prossima mossa"], rows);
  }

  function renderConsequenceCards(dv) {
    const pages = continuityRows(dv, '"Mondi" OR "Inbox"', 16);

    renderCardGrid(dv, pages, p => {
      const issues = continuityIssues(p);
      return cardHtml({
        title: pageTitle(p),
        meta: [p.tipo ?? p.categoria, continuityStatus(p) || (p.stato ?? p.stato_canonico)].filter(Boolean).join(" · "),
        azione: issues.length
          ? `Chiudi: ${issues.join(", ")}`
          : (p.prossima_mossa ? `Verifica prossima mossa: ${fieldText(p.prossima_mossa)}` : "Applica conseguenza e scegli la prossima mossa."),
        importa: fieldText(p.aggiornamenti_richiesti ?? p.entita_impattate ?? p.propaga_a ?? p.conseguenze) || "Manca propagazione esplicita.",
        link: p.file.path,
        badge: "Post-sessione",
        cls: cardClass(p, "gdr-info-card compact", issues.length ? "gdr-kind-missing" : "gdr-kind-ready")
      });
    }, {
      title: "Nessuna conseguenza aperta",
      action: "Crea una conseguenza o collega entita impattate agli appunti live.",
      button: "BUTTON[wizard-conseguenza]"
    });
  }

  function renderImpactedNextMoveCards(dv) {
    const targetKeys = new Set();
    dv.pages('"Mondi" OR "Inbox"')
      .where(p => isReal(p) && p.stato !== "archiviata" && (hasLinks(p.conseguenze) || hasLinks(p.entita_impattate) || hasLinks(p.propaga_a) || hasLinks(p.applicata_a)))
      .forEach(p => {
        [...asArray(p.entita_impattate), ...asArray(p.propaga_a), ...asArray(p.applicata_a)].forEach(link => targetKeys.add(linkKey(link)));
      });

    const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Relazioni"')
      .where(p => isReal(p) && p.stato !== "archiviata")
      .where(p => targetKeys.has(p.file.path) || targetKeys.has(p.file.name) || hasLinks(p.propagato_da) || hasLinks(p.aggiornamenti_richiesti))
      .sort(p => pressure(p), "desc")
      .limit(12)
      .array();

    renderCardGrid(dv, pages, p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo, continuityStatus(p) || p.stato].filter(Boolean).join(" · "),
      azione: p.prossima_mossa
        ? `Verifica o cambia: ${fieldText(p.prossima_mossa)}`
        : "Apri la nota e compila il campo Prossima mossa nella Scheda Viva.",
      importa: fieldText(p.aggiornamenti_richiesti ?? p.propagato_da ?? p.conseguenze ?? p.propaga_a ?? p.entita_impattate ?? p.missioni) || "Questa entita e stata toccata da una conseguenza.",
      link: p.file.path,
      badge: "Impattata",
      cls: cardClass(p, "gdr-info-card compact", hasText(p.prossima_mossa) ? "gdr-kind-ready" : "gdr-kind-missing")
    }), {
      title: "Nessuna entita impattata da aggiornare",
      action: "Applica una conseguenza scegliendo entita_impattate o propaga_a.",
      button: "BUTTON[applica-conseguenza]"
    });
  }

  function renderContinuityChain(dv, source = null) {
    const session = source ?? activeSession(dv) ?? dv.current();
    const targetLinks = [
      ...asArray(session?.missioni),
      ...asArray(session?.tracciati),
      ...asArray(session?.fazioni),
      ...asArray(session?.luoghi),
      ...asArray(session?.entita_impattate),
      ...asArray(session?.propaga_a),
      ...asArray(session?.applicata_a)
    ];
    const targetKeys = new Set(targetLinks.map(linkKey).filter(Boolean));
    const pages = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.stato !== "archiviata")
      .where(p => targetKeys.has(p.file.path) || targetKeys.has(p.file.name))
      .sort(p => {
        const order = { missione: 0, tracciato: 1, fazione: 2, luogo: 3, religione: 4, relazione: 5 };
        return order[p.categoria] ?? 9;
      }, "asc")
      .limit(16)
      .array();
    const sourceCards = [
      ["Scelta", session?.scelta ?? session?.decisioni_prese, "Registra una scelta che cambia missione, luogo, fazione o clock."],
      ["Conseguenza", session?.conseguenze ?? session?.output_sessione, "Scrivi cosa cambia nel mondo."],
      ["Bersagli", session?.entita_impattate ?? session?.propaga_a ?? session?.applicata_a, "Collega le entita che devono reagire."],
      ["Stato", session?.propagazione_stato, "Usa aperta, applicata, propagata o da verificare."],
      ["Prossima apertura", session?.prossima_apertura ?? session?.prossima_mossa, "Trasforma la continuita nella prossima scena."]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = sourceCards.map(([title, value, fallback]) => cardHtml({
      title,
      body: fieldText(value) || fallback,
      link: session?.file?.path ?? "",
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    if (!pages.length) {
      renderEmptyState(dv, {
        title: "Catena continuita non collegata",
        action: "Collega missione, tracciato, fazione e luogo alla sessione o alla conseguenza.",
        button: "BUTTON[registra-scelta-mondo]"
      });
      return;
    }

    renderCardGrid(dv, pages, p => {
      const issues = continuityIssues(p);
      const progress = p.categoria === "tracciato"
        ? `${Number(p.progress_value ?? 0)}/${Math.max(1, Number(p.progress_max ?? 6))}`
        : "";
      return cardHtml({
        title: pageTitle(p),
        meta: [p.categoria ?? p.tipo, continuityStatus(p) || p.stato, progress].filter(Boolean).join(" · "),
        azione: fieldText(p.prossima_mossa ?? p.innesco ?? p.uso_al_tavolo) || "Definisci la reazione concreta.",
        importa: issues.length
          ? `Gap: ${issues.join(", ")}`
          : fieldText(p.aggiornamenti_richiesti ?? p.conseguenze ?? p.entita_impattate ?? p.propaga_a ?? p.connessioni),
        link: p.file.path,
        badge: "Continuita",
        cls: cardClass(p, "gdr-info-card compact", issues.length ? "gdr-kind-missing" : "gdr-kind-ready")
      });
    }, {
      title: "Nessun bersaglio di continuita",
      action: "Registra una scelta mondo e scegli bersagli reali.",
      button: "BUTTON[registra-scelta-mondo]"
    });
  }

  return {
    continuityAction,
    continuityIssues,
    continuityRows,
    continuityStatus,
    renderClosableContinuity,
    renderConsequenceCards,
    renderContinuityGaps,
    renderContinuityQueue,
    renderContinuityChain,
    renderImpactedNextMoveCards,
    renderPropagationTargets,
    renderWorldImpact
  };
}
