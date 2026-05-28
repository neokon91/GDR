(ctx => {
  const {
    activeSession,
    cardHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    pageTitle,
    pluginStatus,
    readJsonRel,
    renderEmptyState,
    sessionCandidates
  } = ctx;

  const CLOSED_CONSEQUENCE_STATES = new Set(["applicata", "propagata", "canonizzata", "chiusa", "archiviata", "ignorata"]);

  function folderIndex(page) {
    const stem = String(page?.file?.path ?? "").replace(/\.md$/, "");
    const parts = stem.split("/");
    return parts.length > 1 && parts[parts.length - 1] === parts[parts.length - 2];
  }

  function realPage(page) {
    return isReal(page) && !folderIndex(page) && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
  }

  function pages(dv, source, predicate = () => true) {
    return dv.pages(source)
      .where(page => realPage(page) && predicate(page))
      .array();
  }

  function sortedByMtime(rows) {
    return [...rows].sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function openConsequence(page) {
    const state = String(page?.propagazione_stato ?? page?.stato ?? "");
    return !CLOSED_CONSEQUENCE_STATES.has(state)
      && (hasLinks(page?.conseguenze)
        || hasLinks(page?.entita_impattate)
        || hasLinks(page?.propaga_a)
        || hasText(page?.prossima_mossa));
  }

  function dmGuideData(dv) {
    const worlds = pages(dv, '"Mondi"', page => page.categoria === "mondo");
    const sessions = pages(dv, '"Mondi/Sessioni"', page => page.categoria === "sessione" || String(page.file?.path ?? "").startsWith("Mondi/Sessioni/"));
    const currentActive = activeSession(dv);
    const active = realPage(currentActive) ? currentActive : null;
    const candidate = sessionCandidates(dv)
      .where(page => realPage(page) && ["bozza", "preparazione", "pronto", "in corso"].includes(String(page.stato ?? "")))
      .first();
    const openConsequences = sortedByMtime(pages(dv, '"Mondi" OR "Inbox"', openConsequence));
    const drafts = sortedByMtime(pages(dv, '"Inbox"', page =>
      ["bozza", "da smistare"].includes(String(page.stato ?? "")) || String(page.file?.path ?? "").startsWith("Inbox/Generati/")
    ));

    return {
      active,
      candidate: realPage(candidate) ? candidate : null,
      drafts,
      openConsequences,
      sessions,
      worlds
    };
  }

  async function readDmGuideCockpit() {
    return readJsonRel("z.automazioni/data/runtime/dm_guide_cockpit.json", {
      phases: [],
      rules: [],
      surfaces: []
    });
  }

  function nextAction(data) {
    if (!data.worlds.length) {
      return {
        title: "Fai adesso: crea il mondo",
        meta: "Nessun mondo operativo",
        body: "Apri il percorso iniziale e crea un mondo minimale con tono, promessa e conflitto.",
        importa: "Tutto il resto deve nascere da un mondo, non da note sparse.",
        link: "Inizia Qui.md",
        cls: "gdr-kind-missing"
      };
    }
    if (data.active) {
      return {
        title: "Fai adesso: gioca",
        meta: pageTitle(data.active),
        body: fieldText(data.active.scena_corrente ?? data.active.apertura) || "Apri il tavolo live e cattura solo cio che succede.",
        importa: "Con una sessione attiva, la guida deve portarti al cockpit live.",
        link: "Hub/Durante il Gioco.md",
        cls: "gdr-kind-ready"
      };
    }
    if (data.openConsequences.length) {
      return {
        title: "Fai adesso: chiudi conseguenze",
        meta: pageTitle(data.openConsequences[0]),
        body: fieldText(data.openConsequences[0].prossima_mossa) || "Decidi cosa cambia davvero nel mondo.",
        importa: "Le conseguenze aperte devono diventare stato del mondo o essere archiviate.",
        link: "Risorse/Post Sessione Guidato.md",
        cls: "gdr-kind-missing"
      };
    }
    if (!data.sessions.length || data.candidate) {
      return {
        title: "Fai adesso: prepara",
        meta: data.candidate ? pageTitle(data.candidate) : "Nessuna sessione pronta",
        body: "Scegli una sessione e collega obiettivo, scena, pressione e tre ancore mondo.",
        importa: "La preparazione taglia tutto cio che non arriva alla prossima sessione.",
        link: "Risorse/Preparazione Sessione.md",
        cls: "gdr-kind-missing"
      };
    }
    if (data.drafts.length) {
      return {
        title: "Fai adesso: pulisci bozze",
        meta: `${data.drafts.length} elementi in inbox`,
        body: "Smista, collega o archivia prima di creare altro materiale.",
        importa: "La inbox non deve diventare canone implicito.",
        link: "Risorse/Controllo Vault.md",
        cls: "gdr-kind-missing"
      };
    }
    return {
      title: "Fai adesso: scegli il prossimo tavolo",
      meta: `${data.sessions.length} sessioni nel vault`,
      body: "Apri la DM Dashboard o prepara la prossima sessione concreta.",
      importa: "La guida resta utile se porta subito a una superficie operativa.",
      link: "Hub/1. DM Dashboard.md",
      cls: "gdr-kind-ready"
    };
  }

  function renderDmGuideNow(dv) {
    const data = dmGuideData(dv);
    const next = nextAction(data);
    const cards = [
      next,
      {
        title: "Mondo",
        meta: `${data.worlds.length} mondi`,
        body: data.worlds[0] ? pageTitle(data.worlds[0]) : "Manca un mondo giocabile.",
        importa: data.worlds[0] ? "Espandi solo quando serve a sessioni, pressioni o conseguenze." : "Parti da tono, promessa e conflitto.",
        link: data.worlds[0]?.file?.path ?? "Inizia Qui.md",
        cls: data.worlds.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Sessione",
        meta: data.active ? "attiva" : data.candidate ? data.candidate.stato ?? "candidata" : `${data.sessions.length} note`,
        body: data.active ? pageTitle(data.active) : data.candidate ? pageTitle(data.candidate) : "Nessuna sessione candidata.",
        importa: "Tieni una sola sessione come prossimo tavolo leggibile.",
        link: data.active?.file?.path ?? data.candidate?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: data.active || data.candidate ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Pulizia",
        meta: `${data.openConsequences.length} conseguenze · ${data.drafts.length} bozze`,
        body: data.openConsequences[0] ? pageTitle(data.openConsequences[0]) : data.drafts[0] ? pageTitle(data.drafts[0]) : "Nessuna coda evidente.",
        importa: data.openConsequences.length ? "Propaga o chiudi prima di aggiungere altro." : "Quando non ci sono code, prepara il prossimo tavolo.",
        link: data.openConsequences[0]?.file?.path ?? data.drafts[0]?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: data.openConsequences.length || data.drafts.length ? "gdr-kind-missing" : "gdr-kind-ready"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-dm-guide-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      ...card,
      cls: `gdr-info-card compact ${card.cls ?? ""}`
    })).join("");
  }

  async function renderDmGuideLoop(dv) {
    const cockpit = await readDmGuideCockpit();
    const phases = cockpit.phases ?? [];
    if (!phases.length) {
      renderEmptyState(dv, {
        title: "Ciclo non configurato",
        action: "Rigenera il contratto Guida DM dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }
    dv.table(
      ["Fase", "Apri", "Azione", "Fatto quando"],
      phases.map(phase => [phase.label, phase.surface, phase.action, phase.done_when])
    );
  }

  async function renderDmGuideRules(dv) {
    const cockpit = await readDmGuideCockpit();
    const rules = cockpit.rules ?? [];
    if (!rules.length) {
      renderEmptyState(dv, {
        title: "Regole non configurate",
        action: "Rigenera il contratto Guida DM dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-dm-guide-rules" });
    grid.innerHTML = rules.map(rule => cardHtml({
      title: rule.label,
      meta: "Regola di taglio",
      body: rule.action,
      importa: rule.why,
      cls: "gdr-info-card compact gdr-kind-ready"
    })).join("");
  }

  async function renderDmGuideSurfaceLinks(dv) {
    const cockpit = await readDmGuideCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici non configurate",
        action: "Rigenera il contratto Guida DM dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-dm-guide-surfaces" });
    grid.innerHTML = surfaces.map(surface => {
      const status = pluginStatus(surface.plugin);
      const state = status.ok === true ? "attiva" : "fallback Markdown";
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
    renderDmGuideLoop,
    renderDmGuideNow,
    renderDmGuideRules,
    renderDmGuideSurfaceLinks
  };
})
