// Runtime DataviewJS per viste sessione, live table e post-sessione.
context => {
  const {
    activeSession,
    activeSessions,
    asArray,
    cardHtml,
    continuityIssues,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    pageTitle,
    pagesFromLinks,
    renderEmptyState,
    sessionCandidates
  } = context;

  function renderSessionAnchorCards(dv, source = null) {
    const session = source ?? dv.current();
    const anchors = [
      ["Mondo", session.mondo, "Collega il mondo o la campagna di riferimento."],
      ["Luoghi", session.luoghi, "Scegli almeno un luogo che possa cambiare stato."],
      ["Fazioni", session.fazioni, "Collega chi vuole qualcosa durante o dopo la sessione."],
      ["Missioni", session.missioni, "Collega obiettivi che i giocatori possono avanzare o compromettere."],
      ["Clock", session.tracciati, "Collega pressione, timer o fronti che avanzano fuori scena."],
      ["PNG", session.personaggi, "Collega PNG che possono reagire alle scelte del tavolo."]
    ];
    const ready = anchors.filter(([, value]) => fieldText(value)).length;
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = anchors.map(([title, value, fallback]) => cardHtml({
      title,
      meta: `${ready}/${anchors.length} ancore collegate`,
      body: fieldText(value) || fallback,
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    dv.paragraph("Le ancore trasformano la sessione in continuita: ogni scelta dovrebbe poter toccare almeno una di queste note.");
  }

  function renderSessionMaterialCards(dv, source = null) {
    const session = source ?? dv.current();
    const groups = [
      ["Incontri", session.incontri, "Collega o crea incontri pronti da giocare.", "BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]"],
      ["Dispense", session.dispense, "Collega handout, indizi o testi da consegnare.", "BUTTON[nuova-dispensa-z-modelli-dispensa-md-default]"],
      ["Mappe", session.mappe, "Collega una mappa zoom, pubblica o DM.", "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"],
      ["Media", [...asArray(session.audio), ...asArray(session.immagini), ...asArray(session.video)], "Audio, immagini e video restano opzionali ma devono essere pronti prima del tavolo.", ""]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = groups.map(([title, value, fallback, button]) => cardHtml({
      title,
      body: fieldText(value) || fallback,
      importa: button || "Controlla i link media prima della sessione.",
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderSessionLiveCards(dv, source = null) {
    const session = source ?? dv.current();
    const cards = [
      ["Attiva", session.attiva === true ? "Sessione marcata attiva." : "Attiva la sessione solo quando e quella al tavolo.", session.attiva === true],
      ["Scena corrente", fieldText(session.scena_corrente) || "Scrivi dove si trovano ora i personaggi.", hasText(session.scena_corrente)],
      ["Decisioni", fieldText(session.decisioni_prese) || "Cattura le scelte che cambiano mondo, relazioni o missioni.", hasLinks(session.decisioni_prese) || hasText(session.decisioni_prese)],
      ["Output", fieldText(session.output_sessione) || "Segna appunti live, indizi rivelati e materiale da smistare.", hasLinks(session.output_sessione) || hasText(session.output_sessione)],
      ["Propagazione", fieldText(session.propaga_a) || "Collega subito dove la scelta dovra propagarsi.", hasLinks(session.propaga_a)]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = cards.map(([title, body, ok]) => cardHtml({
      title,
      body,
      link: session.file?.path ?? "",
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderSessionPostCards(dv, source = null) {
    const session = source ?? dv.current();
    const issues = continuityIssues(session);
    const cards = [
      ["Conseguenze", fieldText(session.conseguenze) || "Registra cio che e cambiato nel mondo.", hasLinks(session.conseguenze) || hasText(session.conseguenze)],
      ["Entita impattate", fieldText(session.entita_impattate ?? session.propaga_a) || "Collega bersagli reali: luoghi, fazioni, PNG, missioni o clock.", hasLinks(session.entita_impattate) || hasLinks(session.propaga_a)],
      ["Stato propagazione", fieldText(session.propagazione_stato) || "Imposta aperta, applicata, propagata o da verificare.", hasText(session.propagazione_stato)],
      ["Recap pubblico", fieldText(session.recap_pubblico) || "Scrivi un recap player-safe senza segreti.", hasText(session.recap_pubblico) || hasLinks(session.recap_pubblico)],
      ["Recap DM", fieldText(session.recap_dm) || "Annota segreti, retcon, prossime mosse e materiali da non mostrare.", hasText(session.recap_dm) || hasLinks(session.recap_dm)],
      ["Gap continuita", issues.length ? issues.join(", ") : "Nessun gap evidente sulla sessione.", issues.length === 0]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = cards.map(([title, body, ok]) => cardHtml({
      title,
      body,
      link: session.file?.path ?? "",
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderActiveSessionBanner(dv) {
    const activeList = activeSessions(dv).array();
    const active = activeSession(dv);
    const candidates = sessionCandidates(dv).limit(4).array();

    if (activeList.length > 1) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = activeList.map(p => cardHtml({
        title: pageTitle(p),
        meta: p.data ?? p.stato ?? "sessione attiva",
        body: "Lascia `attiva: true` solo sulla sessione che stai per giocare.",
        link: p.file.path,
        cls: "gdr-info-card compact gdr-kind-missing"
      })).join("");
      dv.paragraph(`Attenzione: ci sono ${activeList.length} sessioni con \`attiva: true\`.`);
      return;
    }

    if (activeList.length === 1) {
      const p = activeList[0];
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = cardHtml({
        title: "Sessione attiva",
        meta: [p.file.name, p.data ?? "", p.stato ?? ""].filter(Boolean).join(" · "),
        body: "Questa e la sessione usata da Preparazione, Durante il Gioco e Post-Sessione.",
        link: p.file.path,
        cls: "gdr-info-card compact gdr-kind-ready"
      });
      return;
    }

    if (active) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = cardHtml({
        title: "Nessuna sessione marcata attiva",
        meta: active.file.name,
        body: "Fallback automatico. Apri questa sessione e imposta `attiva: true` se va al tavolo.",
        link: active.file.path,
        cls: "gdr-info-card compact gdr-kind-missing"
      });
      return;
    }

    if (candidates.length) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = candidates.map(p => cardHtml({
        title: pageTitle(p),
        meta: p.stato ?? "sessione",
        body: "Scegli una sola sessione e imposta `attiva: true`.",
        link: p.file.path,
        cls: "gdr-info-card compact"
      })).join("");
      return;
    }

    dv.paragraph("Nessuna sessione pronta. Crea una sessione da Preparazione Sessione.");
  }

  function renderTableCockpit(dv) {
    const active = activeSession(dv);
    if (!active) {
      dv.paragraph("Nessuna sessione attiva. Apri Preparazione Sessione e crea o prepara una sessione.");
      return;
    }

    const rows = [
      ["Scena corrente", fieldText(active.scena_corrente ?? active.apertura ?? active.scene) || "Apri la sessione e scrivi la prima scena."],
      ["Appunti live", fieldText(active.appunti_live) || "Usa Cattura live o scrivi negli appunti rapidi."],
      ["Decisione da ottenere", fieldText(active.scelta ?? active.decisioni_attese ?? active.domande_al_tavolo) || "Manca una scelta concreta."],
      ["Clock e pressione", fieldText(active.pressioni) || fieldText(active.tracciati) || "Nessuna pressione collegata."],
      ["Handout e materiali", fieldText(active.dispense) || fieldText(active.materiale_pronto) || "Nessun handout pronto."],
      ["PNG presenti", fieldText(active.personaggi) || "Nessun PNG collegato."]
    ];

    const panel = dv.el("div", "", { cls: "gdr-card-grid" });
    panel.innerHTML = rows.map(([title, body]) => cardHtml({ title, body, cls: "gdr-info-card compact" })).join("");
  }

  function renderLiveCommandCenter(dv) {
    const active = activeSession(dv);
    if (!active) {
      renderEmptyState(dv, {
        title: "Nessuna sessione live",
        action: "Apri Preparazione Sessione, scegli una sessione pronta e imposta attiva.",
        link: "Risorse/Preparazione Sessione.md",
        button: "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"
      });
      return;
    }

    const linkedCount = field => dv.array(active?.[field] ?? []).length;
    const liveNotes = pagesFromLinks(dv, active.appunti_live ?? [])
      .array()
      .filter(p => p.stato !== "archiviata" && p.stato !== "ignorata");
    const encounterPages = pagesFromLinks(dv, active.incontri ?? []).array();
    const mapPages = pagesFromLinks(dv, active.mappe ?? []).array();
    const mediaCount = linkedCount("audio") + linkedCount("immagini") + linkedCount("video");
    const party = dv.pages('"Mondi/Personaggi"')
      .where(p => isReal(p) && p.tipo === "pg" && p.stato !== "archiviata")
      .sort(p => p.giocatore ?? p.nome ?? p.file.name, "asc")
      .array();
    const partyStatus = party.length
      ? party.map(p => `${pageTitle(p)} ${p.hp_attuali ?? "?"}/${p.hp_massimi ?? "?"}${p.condizioni ? ` ${fieldText(p.condizioni)}` : ""}`).join(" · ")
      : "Nessun PG configurato in Party Control.";

    const cards = [
      {
        title: "Scena",
        meta: [active.file.name, active.stato].filter(Boolean).join(" · "),
        body: fieldText(active.scena_corrente ?? active.apertura) || "Aggiorna la scena corrente prima di iniziare.",
        link: active.file.path,
        cls: hasText(active.scena_corrente ?? active.apertura) ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Appunti live",
        meta: `${liveNotes.length} da risolvere`,
        body: liveNotes.map(pageTitle).join(", ") || "Cattura eventi, PNG, luoghi o conseguenze mentre emergono.",
        link: "Inbox",
        cls: liveNotes.length ? "gdr-kind-ready" : ""
      },
      {
        title: "Incontri e tiri",
        meta: `${encounterPages.length} incontri collegati`,
        body: encounterPages.map(pageTitle).join(", ") || "Apri un incontro o usa tabelle rapide quando serve una scena risolta subito.",
        link: encounterPages[0]?.file?.path ?? "Risorse/Iniziativa e Combattimenti.md",
        cls: encounterPages.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Mappe",
        meta: `${mapPages.length} mappe collegate`,
        body: mapPages.map(pageTitle).join(", ") || "Collega una mappa alla sessione, all'incontro o al luogo della scena.",
        link: mapPages[0]?.file?.path ?? "Risorse/Mappe/Mappe.md",
        cls: mapPages.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Media",
        meta: `${mediaCount} risorse collegate`,
        body: fieldText([...(active.audio ?? []), ...(active.immagini ?? []), ...(active.video ?? [])]) || "Audio, immagini e video restano opzionali ma devono essere pronti prima del tavolo.",
        link: "Risorse/Media Scene.md",
        cls: mediaCount ? "gdr-kind-ready" : ""
      },
      {
        title: "Party",
        meta: `${party.length} PG`,
        body: partyStatus,
        link: "Hub/Party Control.md",
        cls: party.length ? "gdr-kind-ready" : "gdr-kind-missing"
      }
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");

    dv.paragraph("Sequenza live: aggiorna scena -> cattura decisione o appunto -> usa incontro, tiro, mappa o media -> registra conseguenza.");
  }

  function renderPostSessionCommandCenter(dv) {
    const session = activeSession(dv)
      ?? dv.pages('"Mondi/Sessioni"')
        .where(p => isReal(p) && ["in corso", "pronto", "giocata"].includes(p.stato))
        .sort(p => p.file.mtime, "desc")
        .first();

    if (!session) {
      renderEmptyState(dv, {
        title: "Nessuna sessione da chiudere",
        action: "Apri Durante il Gioco o scegli una sessione giocata.",
        link: "Hub/Durante il Gioco.md"
      });
      return;
    }

    const liveNotes = pagesFromLinks(dv, session.appunti_live ?? [])
      .array()
      .filter(p => p.stato !== "archiviata" && p.stato !== "ignorata");
    const unresolved = liveNotes.filter(p => !p.canonico && !p.stato_canonico && !hasLinks(p.entita_impattate) && !hasLinks(p.propaga_a));
    const continuityGaps = [session, ...liveNotes].flatMap(p => continuityIssues(p));
    const impacted = [
      ...pagesFromLinks(dv, session.missioni ?? []).array(),
      ...pagesFromLinks(dv, session.tracciati ?? []).array(),
      ...pagesFromLinks(dv, session.fazioni ?? []).array(),
      ...pagesFromLinks(dv, session.luoghi ?? []).array()
    ].filter(p => p.stato !== "archiviata");

    const cards = [
      {
        title: "Canone e rumor",
        body: unresolved.length
          ? `${unresolved.length} appunti senza decisione: ${unresolved.map(pageTitle).join(", ")}`
          : "Ogni appunto collegato ha una direzione o non ci sono appunti live.",
        cls: unresolved.length ? "gdr-kind-missing" : "gdr-kind-ready",
        link: session.file.path
      },
      {
        title: "Conseguenze",
        body: fieldText(session.conseguenze) || fieldText(liveNotes.flatMap(p => asArray(p.conseguenze ?? p.impatto))) || "Registra almeno una conseguenza se qualcosa e cambiato nel mondo.",
        cls: hasLinks(session.conseguenze) || hasText(session.conseguenze) ? "gdr-kind-ready" : "gdr-kind-missing",
        link: session.file.path
      },
      {
        title: "Continuita",
        body: continuityGaps.length
          ? `Gap da chiudere: ${[...new Set(continuityGaps)].join(", ")}`
          : "Ogni conseguenza ha bersaglio, stato o prossima mossa verificabile.",
        cls: continuityGaps.length ? "gdr-kind-missing" : "gdr-kind-ready",
        link: "Hub/Motore Mondo Vivo.md"
      },
      {
        title: "Missioni e clock",
        body: impacted.map(p => `${pageTitle(p)}${p.prossima_mossa ? `: ${fieldText(p.prossima_mossa)}` : ""}`).join(" · ") || "Collega o aggiorna missioni, clock, fazioni e luoghi toccati.",
        cls: impacted.length ? "gdr-kind-ready" : "gdr-kind-missing",
        link: "Hub/Cosa Succede Fuori Scena.md"
      },
      {
        title: "Recap pubblico",
        body: fieldText(session.recap_pubblico) || "Prepara un recap leggibile e senza segreti per i giocatori.",
        cls: hasText(session.recap_pubblico) || hasLinks(session.recap_pubblico) ? "gdr-kind-ready" : "gdr-kind-missing",
        link: session.file.path
      },
      {
        title: "Prossima apertura",
        body: fieldText(session.prossima_apertura ?? session.output_sessione) || "Scrivi l'apertura o l'output utile per la prossima preparazione.",
        cls: hasText(session.prossima_apertura) || hasLinks(session.output_sessione) || hasText(session.output_sessione) ? "gdr-kind-ready" : "gdr-kind-missing",
        link: session.file.path
      }
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: session.file.name,
      body: card.body,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderPlayableOutline(dv, source = null) {
    const session = source ?? dv.current();
    const rows = [
      ["Apertura", session.apertura, "Leggi o parafrasa la prima scena."],
      ["Obiettivo", session.obiettivo, "Ricorda cosa deve produrre la sessione."],
      ["Scelta", session.scelta, "Metti davanti ai giocatori una decisione che cambia qualcosa."],
      ["Pressione", session.pressioni ?? session.tracciati, "Fai avanzare questa cosa se il party esita."],
      ["Materiale pronto", session.materiale_pronto ?? [...asArray(session.incontri), ...asArray(session.dispense), ...asArray(session.mappe)], "Usa almeno un elemento preparato al tavolo."]
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = rows.map(([title, value, fallback]) => cardHtml({
      title,
      body: fieldText(value) || fallback,
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    dv.paragraph("Sequenza giocabile: apertura -> pressione -> scelta -> conseguenza -> appunto per il post-sessione.");
  }

  return {
    renderActiveSessionBanner,
    renderLiveCommandCenter,
    renderPlayableOutline,
    renderPostSessionCommandCenter,
    renderSessionAnchorCards,
    renderSessionLiveCards,
    renderSessionMaterialCards,
    renderSessionPostCards,
    renderTableCockpit
  };
}
