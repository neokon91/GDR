(ctx => {
  const {
    activeSession,
    cardHtml,
    continuityAction,
    continuityIssues,
    continuityStatus,
    escapeHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    pageTitle,
    pagesFromLinks,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState
  } = ctx;

  const TARGET_STATES = new Set(["in corso", "pronto", "giocata", "preparazione"]);
  const IMPACT_CATEGORIES = new Set(["missione", "tracciato", "fazione", "luogo", "conflitto", "relazione", "religione"]);

  function realPage(page) {
    return isReal(page) && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
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

  function linkedPages(dv, value) {
    return pagesFromLinks(dv, value ?? []).array().filter(realPage);
  }

  function targetSession(dv) {
    return activeSession(dv)
      ?? dv.pages('"Mondi/Sessioni"')
        .where(page => realPage(page) && TARGET_STATES.has(String(page.stato ?? "")))
        .sort(page => page.file.mtime, "desc")
        .first();
  }

  function hasCanonDecision(page) {
    return page?.canonico === true
      || hasText(page?.stato_canonico)
      || page?.archivia_appunto === true
      || page?.marca_rumor === true;
  }

  function hasImpact(page) {
    return hasLinks(page?.conseguenze)
      || hasLinks(page?.entita_impattate)
      || hasLinks(page?.propaga_a)
      || hasText(page?.impatto)
      || hasText(page?.conseguenza_potenziale)
      || hasText(page?.prossima_mossa);
  }

  function sessionRecapRows(session) {
    if (!session) return [];
    return [
      {
        id: "public",
        label: "Recap pubblico",
        status: hasText(session.recap_pubblico) || hasLinks(session.recap_pubblico) ? "pronto" : "manca",
        action: hasText(session.recap_pubblico) || hasLinks(session.recap_pubblico)
          ? "Verifica che sia player-safe prima di condividere."
          : "Scrivi un recap senza segreti, retcon o prossime mosse DM."
      },
      {
        id: "dm",
        label: "Recap DM",
        status: hasText(session.recap_dm) || hasLinks(session.recap_dm) ? "pronto" : "manca",
        action: hasText(session.recap_dm) || hasLinks(session.recap_dm)
          ? "Usalo per preparare reazioni e prossima apertura."
          : "Annota verita, conseguenze non viste e prossime mosse."
      },
      {
        id: "next",
        label: "Prossima apertura",
        status: hasText(session.prossima_apertura) || hasText(session.output_sessione) || hasLinks(session.output_sessione) ? "pronta" : "manca",
        action: hasText(session.prossima_apertura) || hasText(session.output_sessione) || hasLinks(session.output_sessione)
          ? "Portala in Preparazione Sessione."
          : "Scrivi cosa apre la prossima sessione o quale output va preparato."
      }
    ];
  }

  function postSessionData(dv) {
    const session = targetSession(dv);
    if (!session) {
      return {
        session: null,
        liveNotes: [],
        unresolvedNotes: [],
        consequences: [],
        continuityRows: [],
        continuityGaps: [],
        impacted: [],
        nextMoveRows: [],
        nextSessions: [],
        recapRows: [],
        priority: []
      };
    }

    const liveNotes = linkedPages(dv, session.appunti_live);
    const consequences = uniquePages([
      ...linkedPages(dv, session.conseguenze),
      ...liveNotes.filter(page => hasLinks(page.conseguenze) || hasText(page.impatto) || hasText(page.conseguenza_potenziale))
    ]);
    const impacted = uniquePages([
      ...linkedPages(dv, session.entita_impattate),
      ...linkedPages(dv, session.propaga_a),
      ...linkedPages(dv, session.missioni),
      ...linkedPages(dv, session.tracciati),
      ...linkedPages(dv, session.fazioni),
      ...linkedPages(dv, session.luoghi),
      ...consequences.flatMap(page => [...linkedPages(dv, page.entita_impattate), ...linkedPages(dv, page.propaga_a)])
    ]);
    const unresolvedNotes = liveNotes.filter(page => !hasCanonDecision(page) && !hasLinks(page.entita_impattate) && !hasLinks(page.propaga_a));
    const continuityRows = uniquePages([session, ...liveNotes, ...consequences]).filter(page => hasImpact(page) || continuityStatus?.(page));
    const continuityGaps = continuityRows.flatMap(page => (continuityIssues?.(page) ?? []).map(issue => ({ page, issue })));
    const nextMoveRows = impacted.filter(page => {
      const category = String(page.categoria ?? page.tipo ?? "").toLowerCase();
      return IMPACT_CATEGORIES.has(category) && (pressure(page) > 0 || !hasText(page.prossima_mossa));
    });
    const nextSessions = dv.pages('"Mondi/Sessioni"')
      .where(page => realPage(page) && page.file?.path !== session.file?.path && ["bozza", "preparazione", "pronto"].includes(String(page.stato ?? "")))
      .sort(page => page.data ?? "9999-99-99", "asc")
      .limit(8)
      .array();
    const recapRows = sessionRecapRows(session);
    const priority = [
      ...unresolvedNotes.map(page => ({ group: "Canone", page, problem: "appunto live senza decisione", action: "Decidi canonico, rumor, conseguenza o archivio.", priority: 6 })),
      ...(!consequences.length ? [{ group: "Conseguenze", page: session, problem: "sessione senza conseguenze registrate", action: "Registra almeno una conseguenza o conferma che non ci sono cambiamenti.", priority: 5 }] : []),
      ...continuityGaps.map(row => ({ group: "Continuita", page: row.page, problem: row.issue, action: continuityAction?.(row.page) ?? "Completa bersaglio, stato e prossima mossa.", priority: 5 })),
      ...recapRows.filter(row => row.status === "manca").map(row => ({ group: "Recap", page: session, problem: `${row.label} mancante`, action: row.action, priority: 4 })),
      ...nextMoveRows.filter(page => !hasText(page.prossima_mossa)).map(page => ({ group: "Prossima mossa", page, problem: "bersaglio impattato senza prossima mossa", action: "Scrivi cosa accade se nessuno interviene.", priority: 3 })),
      ...(!nextSessions.length ? [{ group: "Prossima sessione", page: session, problem: "nessuna prossima sessione pronta", action: "Crea o scegli la prossima sessione da output.", priority: 2 }] : [])
    ].sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));

    return {
      session,
      liveNotes,
      unresolvedNotes,
      consequences,
      continuityRows,
      continuityGaps,
      impacted,
      nextMoveRows,
      nextSessions,
      recapRows,
      priority
    };
  }

  function renderPostSessionNow(dv) {
    const data = postSessionData(dv);
    if (!data.session) {
      renderEmptyState(dv, {
        title: "Nessuna sessione da chiudere",
        action: "Apri Durante il Gioco o scegli una sessione giocata.",
        link: "Hub/Durante il Gioco.md"
      });
      return;
    }

    const next = data.priority[0];
    const cards = [
      {
        title: next ? `Chiudi prima: ${next.group}` : "Chiudi prima: pronto",
        meta: pageTitle(data.session),
        body: next?.problem ?? "La sessione ha decisioni, conseguenze e recap sufficienti.",
        importa: next?.action ?? "Puoi passare alla prossima preparazione.",
        link: next?.page?.file?.path ?? data.session.file?.path,
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Appunti live",
        meta: `${data.liveNotes.length} collegati`,
        body: data.unresolvedNotes[0] ? pageTitle(data.unresolvedNotes[0]) : "Nessun appunto live senza decisione.",
        importa: data.unresolvedNotes.length ? "Decidi canone, rumor, conseguenza o archivio." : "Gli appunti hanno direzione o non ci sono appunti.",
        link: data.unresolvedNotes[0]?.file?.path ?? data.session.file?.path,
        cls: data.unresolvedNotes.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Conseguenze",
        meta: `${data.consequences.length} da applicare`,
        body: data.consequences[0] ? pageTitle(data.consequences[0]) : "Nessuna conseguenza collegata.",
        importa: data.consequences[0] ? fieldText(data.consequences[0].impatto ?? data.consequences[0].conseguenza_potenziale ?? data.consequences[0].prossima_mossa) || "Verifica bersagli e propagazione." : "Se il mondo e cambiato, registra una conseguenza.",
        link: data.consequences[0]?.file?.path ?? data.session.file?.path,
        cls: data.consequences.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Continuita",
        meta: `${data.continuityGaps.length} gap`,
        body: data.continuityGaps[0] ? data.continuityGaps[0].issue : "Nessun gap evidente.",
        importa: data.continuityGaps[0] ? continuityAction?.(data.continuityGaps[0].page) ?? "Completa la propagazione." : "Le conseguenze hanno bersagli e stato leggibili.",
        link: data.continuityGaps[0]?.page?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: data.continuityGaps.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Recap",
        meta: `${data.recapRows.filter(row => row.status !== "manca").length}/${data.recapRows.length} pronti`,
        body: data.recapRows.find(row => row.status === "manca")?.label ?? "Recap e apertura pronti.",
        importa: data.recapRows.find(row => row.status === "manca")?.action ?? "Controlla Vista Giocatori prima di condividere.",
        link: data.session.file?.path,
        cls: data.recapRows.some(row => row.status === "manca") ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Prossima sessione",
        meta: `${data.nextSessions.length} candidate`,
        body: data.nextSessions[0] ? pageTitle(data.nextSessions[0]) : "Nessuna prossima sessione pronta.",
        importa: data.nextSessions[0] ? fieldText(data.nextSessions[0].obiettivo ?? data.nextSessions[0].apertura) || "Completa obiettivo e apertura." : "Crea una sessione da output.",
        link: data.nextSessions[0]?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: data.nextSessions.length ? "gdr-kind-ready" : "gdr-kind-missing"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-post-session-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderPostSessionReadiness(dv) {
    const data = postSessionData(dv);
    const stats = [
      ["Sessione", data.session ? 1 : 0, data.session ? pageTitle(data.session) : "nessuna"],
      ["Appunti live", data.liveNotes.length, "note da decidere"],
      ["Decisioni aperte", data.unresolvedNotes.length, "canone, rumor o archivio"],
      ["Conseguenze", data.consequences.length, "effetti da applicare"],
      ["Bersagli", data.impacted.length, "note impattate"],
      ["Gap continuita", data.continuityGaps.length, "propagazioni incomplete"],
      ["Recap", data.recapRows.filter(row => row.status !== "manca").length, "pubblico, DM e apertura"],
      ["Prossime sessioni", data.nextSessions.length, "candidate da preparare"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-post-session-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readPostSessionCockpit() {
    return readJsonRel("z.automazioni/data/runtime/post_session_cockpit.json", {
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

  async function renderPostSessionClosureQueues(dv) {
    const cockpit = await readPostSessionCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = postSessionData(dv);

    renderTable(
      dv,
      labels,
      "live_notes",
      ["Appunto", "Tipo", "Stato", "Decisione", "Impatto"],
      data.liveNotes.slice(0, 30).map(page => [pageLink(page), page.tipo ?? page.categoria ?? "", page.stato ?? page.stato_canonico ?? "", hasCanonDecision(page) ? "decisa" : "da decidere", fieldText(page.impatto ?? page.conseguenza_potenziale ?? page.entita_impattate ?? page.propaga_a) || ""]),
      "Nessun appunto live collegato alla sessione da chiudere."
    );
    renderTable(
      dv,
      labels,
      "canon_decisions",
      ["Nota", "Stato", "Decisione richiesta", "Bersagli"],
      data.unresolvedNotes.slice(0, 30).map(page => [pageLink(page), page.stato ?? "", "canonico, rumor, conseguenza o archivio", page.entita_impattate ?? page.propaga_a ?? []]),
      "Nessuna decisione canonica aperta sugli appunti live."
    );
    renderTable(
      dv,
      labels,
      "recaps",
      ["Blocco", "Stato", "Azione"],
      data.recapRows.map(row => [row.label, row.status, row.action]),
      "Nessuna sessione da chiudere."
    );
  }

  async function renderPostSessionPropagationQueues(dv) {
    const cockpit = await readPostSessionCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = postSessionData(dv);

    renderTable(
      dv,
      labels,
      "consequences",
      ["Conseguenza", "Stato", "Bersagli", "Azione", "Prossima mossa"],
      data.continuityRows.slice(0, 30).map(page => [pageLink(page), continuityStatus?.(page) || page.stato || "", page.entita_impattate ?? page.propaga_a ?? [], continuityAction?.(page) ?? "Definisci bersagli e stato.", fieldText(page.prossima_mossa) || ""]),
      "Nessuna conseguenza o continuita aperta."
    );
    renderTable(
      dv,
      labels,
      "impacted",
      ["Bersaglio", "Tipo", "Pressione", "Prossima mossa", "Gap"],
      data.nextMoveRows.slice(0, 30).map(page => [pageLink(page), page.categoria ?? page.tipo ?? "", pressure(page) || "", fieldText(page.prossima_mossa) || "", (continuityIssues?.(page) ?? []).join(", ")]),
      "Nessun bersaglio impattato da aggiornare."
    );
    renderTable(
      dv,
      labels,
      "next_session",
      ["Sessione", "Stato", "Data", "Obiettivo", "Apertura"],
      data.nextSessions.slice(0, 12).map(page => [pageLink(page), page.stato ?? "", page.data ?? "", fieldText(page.obiettivo) || "", fieldText(page.apertura ?? page.scena_corrente) || ""]),
      "Nessuna prossima sessione pronta: crea una sessione da output."
    );
  }

  async function renderPostSessionSurfaceLinks(dv) {
    const cockpit = await readPostSessionCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici post-sessione non configurate",
        action: "Rigenera il contratto Post Sessione dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-post-session-surfaces" });
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
    renderPostSessionClosureQueues,
    renderPostSessionNow,
    renderPostSessionPropagationQueues,
    renderPostSessionReadiness,
    renderPostSessionSurfaceLinks
  };
})
