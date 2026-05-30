(ctx => {
  const {
    activeSession,
    activeSessions,
    cardHtml,
    escapeHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    pageTitle,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState
  } = ctx;

  const OPEN_MISSION_STATES = new Set(["proposta", "accettata", "in corso", "pronto"]);
  const ACTIVE_TRACK_STATES = new Set(["attivo", "in corso", "pronto"]);
  const POST_STATES = new Set(["in corso", "giocata"]);

  function folderIndex(page) {
    const folder = String(page?.file?.folder ?? "");
    return page?.file?.name === folder.split("/").pop();
  }

  function realPage(page) {
    return isReal(page)
      && !folderIndex(page)
      && !["archiviata", "ignorata"].includes(String(page.stato ?? ""));
  }

  function pages(dv, source, predicate = () => true) {
    return dv.pages(source)
      .where(page => realPage(page) && predicate(page))
      .array();
  }

  function sortByDateThenMtime(rows) {
    return [...rows].sort((left, right) => {
      const leftDate = String(left.data ?? "9999-99-99");
      const rightDate = String(right.data ?? "9999-99-99");
      if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      return (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0);
    });
  }

  function sortByPressure(rows) {
    return [...rows].sort((left, right) => {
      const diff = pressure(right) - pressure(left);
      return diff || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0);
    });
  }

  function uniqPages(rows) {
    const seen = new Set();
    return rows.filter(page => {
      const key = page?.file?.path ?? page?.file?.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function progress(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || 0;
    return max ? `${value}/${max}` : "";
  }

  function needsPostSession(page) {
    return POST_STATES.has(String(page.stato ?? ""))
      && (!hasText(page.recap_pubblico)
        || hasLinks(page.appunti_live)
        || hasLinks(page.conseguenze)
        || hasText(page.conseguenze));
  }

  function dmDashboardData(dv) {
    const explicitActive = activeSessions(dv).array().filter(realPage);
    const fallbackActive = activeSession(dv);
    const active = explicitActive[0] ?? (fallbackActive && String(fallbackActive.stato ?? "") === "in corso" ? fallbackActive : null);
    const allSessions = pages(dv, '"Mondi/Sessioni"', page => page.file?.name !== "Sessioni");
    const prepSessions = sortByDateThenMtime(allSessions.filter(page => ["bozza", "preparazione"].includes(String(page.stato ?? ""))));
    const readySessions = sortByDateThenMtime(allSessions.filter(page => page.stato === "pronto"));
    const postSessions = [...allSessions]
      .filter(needsPostSession)
      .sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
    const sessionQueue = sortByDateThenMtime(uniqPages([
      ...explicitActive,
      ...allSessions.filter(page => page.stato === "in corso"),
      ...prepSessions,
      ...readySessions,
      ...postSessions
    ]));

    const campaigns = pages(dv, '"Campagne"', page => page.file?.name !== "Campagne" && !["conclusa", "archiviata"].includes(String(page.stato ?? "")));
    const missions = pages(dv, '"Mondi/Missioni"', page => OPEN_MISSION_STATES.has(String(page.stato ?? "")));
    const tracks = pages(dv, '"Mondi/Tracciati"', page => ACTIVE_TRACK_STATES.has(String(page.stato ?? "")));
    const pressureRows = sortByPressure(pages(dv, '"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Conflitti"', page =>
      pressure(page) > 0 || Number(page.progress_value ?? 0) > 0
    ));
    const readyMaterials = pages(dv, '"Mondi/Incontri" OR "Mondi/Dispense" OR "Mondi/Oggetti"', page => page.stato === "pronto")
      .sort((left, right) => String(left.categoria ?? left.tipo ?? "").localeCompare(String(right.categoria ?? right.tipo ?? "")) || String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
    const generatedDrafts = pages(dv, '"Inbox/Generati"', page => page.plugin === "fantasy-content-generator" && page.stato === "bozza");
    const inbox = pages(dv, '"Inbox"', page => page.file?.name !== "Inbox" && !["smistata", "archiviata", "ignorata"].includes(String(page.stato ?? "")));
    const draftRows = pages(dv, '"Mondi" OR "Campagne"', page => page.stato === "bozza");

    return {
      active,
      explicitActive,
      campaigns,
      draftRows,
      generatedDrafts,
      inbox,
      missions,
      postSessions,
      prepSessions,
      pressureRows,
      readyMaterials,
      readySessions,
      sessionQueue,
      tracks
    };
  }

  function nextAction(data) {
    const pressureWithoutMove = data.pressureRows.find(page => !hasText(page.prossima_mossa));
    if (data.explicitActive.length > 1) {
      return {
        title: "Fai adesso: scegli una sola sessione attiva",
        meta: `${data.explicitActive.length} sessioni attive`,
        body: "Lascia attiva solo la sessione che userai al tavolo.",
        importa: "Preparazione, live e post-sessione leggono la sessione attiva.",
        link: data.explicitActive[0]?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: "gdr-kind-missing"
      };
    }
    if (data.active) {
      return {
        title: "Fai adesso: gioca",
        meta: pageTitle(data.active),
        body: fieldText(data.active.scena_corrente ?? data.active.apertura) || "Apri il tavolo live e scegli scena, pressione e cattura.",
        importa: "Quando una sessione e attiva, la home deve portarti direttamente al tavolo.",
        link: "Hub/Durante il Gioco.md",
        cls: "gdr-kind-ready"
      };
    }
    if (data.postSessions.length) {
      return {
        title: "Fai adesso: chiudi la sessione",
        meta: pageTitle(data.postSessions[0]),
        body: "Consolida recap, conseguenze e prossima apertura.",
        importa: "Il mondo vivo resta coerente solo se il post-sessione non rimane sospeso.",
        link: "Risorse/Post Sessione Guidato.md",
        cls: "gdr-kind-missing"
      };
    }
    if (data.prepSessions.length) {
      return {
        title: "Fai adesso: prepara",
        meta: pageTitle(data.prepSessions[0]),
        body: "Completa obiettivo, scelta, pressione e materiale pronto.",
        importa: "Una sessione preparata evita di usare la dashboard come archivio.",
        link: "Risorse/Preparazione Sessione.md",
        cls: "gdr-kind-missing"
      };
    }
    if (data.readySessions.length) {
      return {
        title: "Fai adesso: scegli il tavolo",
        meta: pageTitle(data.readySessions[0]),
        body: "Verifica che sia la sessione giusta e apri Durante il Gioco.",
        importa: "Le sessioni pronte devono diventare gioco o post-sessione, non accumulo.",
        link: "Hub/Durante il Gioco.md",
        cls: "gdr-kind-ready"
      };
    }
    if (pressureWithoutMove) {
      return {
        title: "Fai adesso: dai una mossa alla pressione",
        meta: pageTitle(pressureWithoutMove),
        body: "Scrivi cosa accade se i personaggi non intervengono.",
        importa: "Le pressioni senza prossima mossa non producono scena.",
        link: pressureWithoutMove.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: "gdr-kind-missing"
      };
    }
    if (data.inbox.length || data.generatedDrafts.length) {
      return {
        title: "Fai adesso: smista",
        meta: `${data.inbox.length + data.generatedDrafts.length} elementi`,
        body: "Trasforma appunti e bozze in gioco, oppure archivia.",
        importa: "La dashboard resta utile solo se l'inbox non diventa canone implicito.",
        link: "Risorse/Smistamento Bozze Generate.md",
        cls: "gdr-kind-missing"
      };
    }
    return {
      title: "Fai adesso: crea una sessione",
      meta: "Nessun tavolo in corso",
      body: "Parti da una sessione concreta e collega luogo, scelta, pressione e materiale.",
      importa: "Il vault diventa giocabile quando il prossimo tavolo e identificato.",
      link: "Risorse/Preparazione Sessione.md",
      cls: "gdr-kind-missing"
    };
  }

  function renderDmDashboardNow(dv) {
    const data = dmDashboardData(dv);
    const next = nextAction(data);
    const cards = [
      next,
      {
        title: "Sessioni",
        meta: `${data.prepSessions.length} da preparare · ${data.readySessions.length} pronte`,
        body: data.sessionQueue[0] ? pageTitle(data.sessionQueue[0]) : "Nessuna sessione operativa.",
        importa: data.sessionQueue[0] ? sessionAction(data.sessionQueue[0]) : "Crea o prepara il prossimo tavolo.",
        link: data.sessionQueue[0]?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: data.sessionQueue.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Mondo vivo",
        meta: `${data.pressureRows.length} pressioni`,
        body: data.pressureRows[0] ? pageTitle(data.pressureRows[0]) : "Nessuna pressione ordinata per urgenza.",
        importa: data.pressureRows[0] ? fieldText(data.pressureRows[0].prossima_mossa) || "Serve una prossima mossa." : "Crea fronti solo quando servono alla prossima sessione.",
        link: data.pressureRows[0]?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: data.pressureRows.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Materiale pronto",
        meta: `${data.readyMaterials.length} elementi`,
        body: data.readyMaterials[0] ? pageTitle(data.readyMaterials[0]) : "Nessun incontro, dispensa o oggetto pronto.",
        importa: data.readyMaterials[0] ? fieldText(data.readyMaterials[0].luogo ?? data.readyMaterials[0].luoghi ?? data.readyMaterials[0].uso_al_tavolo) || "Collega il materiale alla sessione." : "Prepara solo materiale che andra al tavolo.",
        link: data.readyMaterials[0]?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: data.readyMaterials.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Pulizia",
        meta: `${data.inbox.length + data.generatedDrafts.length} da decidere`,
        body: data.inbox[0] ? pageTitle(data.inbox[0]) : data.generatedDrafts[0] ? pageTitle(data.generatedDrafts[0]) : "Nessuna coda urgente.",
        importa: data.inbox.length || data.generatedDrafts.length ? "Decidi se diventa mondo, sessione o archivio." : "Continua a giocare: non c'e rumore da smistare.",
        link: data.inbox[0]?.file?.path ?? data.generatedDrafts[0]?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: data.inbox.length || data.generatedDrafts.length ? "gdr-kind-missing" : "gdr-kind-ready"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-dm-dashboard-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderDmDashboardReadiness(dv) {
    const data = dmDashboardData(dv);
    const stats = [
      ["Campagne", data.campaigns.length, "attive"],
      ["Attive", data.explicitActive.length, "sessioni live"],
      ["Preparazione", data.prepSessions.length, "da rifinire"],
      ["Pronte", data.readySessions.length, "da giocare"],
      ["Post", data.postSessions.length, "da chiudere"],
      ["Missioni", data.missions.length, "aperte"],
      ["Clock", data.tracks.length, "attivi"],
      ["Materiali", data.readyMaterials.length, "pronti"],
      ["Inbox", data.inbox.length + data.generatedDrafts.length, "da smistare"],
      ["Bozze", data.draftRows.length, "da completare"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-dm-dashboard-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  function sessionAction(page) {
    if (page.attiva === true || page.stato === "in corso") return "Apri Durante il Gioco.";
    if (page.stato === "pronto") return "Verifica materiali e gioca.";
    if (["bozza", "preparazione"].includes(String(page.stato ?? ""))) return "Completa obiettivo, scelta e pressione.";
    if (needsPostSession(page)) return "Chiudi recap, conseguenze e prossima apertura.";
    return "Decidi se resta utile al prossimo tavolo.";
  }

  async function readDmDashboardCockpit() {
    return readJsonRel("z.automazioni/data/runtime/dm_dashboard_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  async function renderDmDashboardQueues(dv) {
    const cockpit = await readDmDashboardCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = dmDashboardData(dv);
    const inboxRows = uniqPages([...data.generatedDrafts, ...data.inbox]);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "sessions",
      ["Sessione", "Stato", "Data", "Azione"],
      data.sessionQueue.slice(0, 10).map(page => [page.file?.link ?? page.file?.path, page.stato ?? "", page.data ?? page.data_mondo ?? "", sessionAction(page)]),
      "Nessuna sessione operativa da mostrare."
    );
    renderTable(
      "pressures",
      ["Fronte", "Stato", "Pressione", "Prossima mossa"],
      data.pressureRows.slice(0, 12).map(page => [page.file?.link ?? page.file?.path, page.stato ?? "", pressure(page) || progress(page), fieldText(page.prossima_mossa ?? page.innesco ?? page.obiettivo) || "da decidere"]),
      "Nessuna pressione da portare al tavolo."
    );
    renderTable(
      "materials",
      ["Materiale", "Tipo", "Luogo", "Uso"],
      data.readyMaterials.slice(0, 10).map(page => [page.file?.link ?? page.file?.path, page.tipo ?? page.categoria ?? "", fieldText(page.luogo ?? page.luoghi) || "", fieldText(page.uso_al_tavolo ?? page.scena ?? page.personaggi) || "pronto"]),
      "Nessun materiale pronto da collegare alla prossima sessione."
    );
    renderTable(
      "inbox",
      ["Nota", "Origine", "Stato", "Azione"],
      inboxRows.slice(0, 12).map(page => [page.file?.link ?? page.file?.path, page.plugin === "fantasy-content-generator" ? "bozza generata" : page.tipo ?? page.categoria ?? "inbox", page.stato ?? "", "Smista, collega o archivia."]),
      "Inbox e bozze generate sono pulite."
    );
  }

  async function renderDmDashboardSurfaceLinks(dv) {
    const cockpit = await readDmDashboardCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici DM non configurate",
        action: "Rigenera il contratto dashboard DM dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-dm-dashboard-surfaces" });
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
    renderDmDashboardNow,
    renderDmDashboardQueues,
    renderDmDashboardReadiness,
    renderDmDashboardSurfaceLinks
  };
})
