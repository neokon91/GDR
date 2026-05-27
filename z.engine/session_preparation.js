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
    pagesFromLinks,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState,
    sessionCandidates
  } = ctx;

  const PREP_STATES = new Set(["bozza", "preparazione", "pronto", "in corso"]);
  const OPEN_MISSION_STATES = new Set(["proposta", "accettata", "in corso", "pronto"]);

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

  function hasReadyValue(value) {
    return hasLinks(value) || hasText(value);
  }

  function progressText(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || 0;
    return max > 0 ? `${value}/${max}` : "";
  }

  function sortByPressure(left, right) {
    return pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0);
  }

  function targetSession(dv) {
    const explicit = activeSession(dv);
    if (realPage(explicit) && PREP_STATES.has(String(explicit.stato ?? ""))) return explicit;
    const candidate = sessionCandidates(dv)
      .where(page => realPage(page) && PREP_STATES.has(String(page.stato ?? "")))
      .first();
    if (candidate) return candidate;
    return dv.pages('"Mondi/Sessioni"')
      .where(page => realPage(page) && PREP_STATES.has(String(page.stato ?? "")))
      .sort(page => page.data ?? "9999-99-99", "asc")
      .first();
  }

  function anchorRows(session) {
    if (!session) return [];
    return [
      {
        id: "world",
        label: "Mondo o campagna",
        value: session.mondo ?? session.campagna,
        action: "Collega il mondo o la campagna che rende leggibile la sessione."
      },
      {
        id: "place",
        label: "Luogo",
        value: session.luoghi ?? session.luogo,
        action: "Scegli dove puo cambiare qualcosa nella prima scena."
      },
      {
        id: "power",
        label: "Potere in scena",
        value: session.fazioni ?? session.personaggi ?? session.religioni,
        action: "Collega una fazione, PNG o potere che reagisce alle scelte."
      },
      {
        id: "mission",
        label: "Missione",
        value: session.missioni ?? session.avventure,
        action: "Collega un obiettivo che il party puo avanzare o compromettere."
      },
      {
        id: "pressure",
        label: "Pressione",
        value: session.pressioni ?? session.tracciati ?? session.fronti,
        action: "Collega un clock, relazione o minaccia che avanza se il party esita."
      },
      {
        id: "table",
        label: "Materiale al tavolo",
        value: session.materiale_pronto ?? session.incontri ?? session.dispense ?? session.mappe,
        action: "Collega almeno un incontro, handout, mappa o oggetto pronto."
      }
    ].map(row => ({
      ...row,
      ok: hasReadyValue(row.value),
      text: fieldText(row.value)
    }));
  }

  function blockRows(session) {
    if (!session) return [];
    const material = [
      ...(Array.isArray(session.materiale_pronto) ? session.materiale_pronto : session.materiale_pronto ? [session.materiale_pronto] : []),
      ...(Array.isArray(session.incontri) ? session.incontri : session.incontri ? [session.incontri] : []),
      ...(Array.isArray(session.dispense) ? session.dispense : session.dispense ? [session.dispense] : []),
      ...(Array.isArray(session.mappe) ? session.mappe : session.mappe ? [session.mappe] : [])
    ];
    return [
      {
        id: "goal",
        label: "Obiettivo",
        value: session.obiettivo,
        action: "Scrivi cosa devono ottenere, scoprire o decidere entro fine sessione."
      },
      {
        id: "opening",
        label: "Prima scena",
        value: session.apertura ?? session.scena_corrente ?? session.scene ?? session.scenes,
        action: "Definisci dove si apre, chi e presente e cosa sta gia succedendo."
      },
      {
        id: "choice",
        label: "Scelta",
        value: session.scelta ?? session.domande_al_tavolo ?? session.decisioni_attese,
        action: "Formula una decisione reale: se non cambia nulla, non e pronta."
      },
      {
        id: "pressure",
        label: "Pressione",
        value: session.pressioni ?? session.tracciati ?? session.missioni ?? session.fazioni,
        action: "Porta una pressione che avanza se il party perde tempo."
      },
      {
        id: "material",
        label: "Materiale",
        value: material,
        action: "Prepara almeno una cosa usabile subito: incontro, mappa, handout o oggetto."
      }
    ].map(row => ({
      ...row,
      ok: hasReadyValue(row.value),
      text: fieldText(row.value)
    }));
  }

  function fallbackRows(dv, source, predicate, sorter, limit = 10) {
    return dv.pages(source)
      .where(page => realPage(page) && predicate(page))
      .sort(sorter, "desc")
      .limit(limit)
      .array();
  }

  function preparationData(dv) {
    const session = targetSession(dv);
    const activeList = activeSessions(dv).where(realPage).array();
    const candidates = sessionCandidates(dv)
      .where(page => realPage(page) && PREP_STATES.has(String(page.stato ?? "")))
      .limit(8)
      .array();
    if (!session) {
      return {
        activeList,
        anchors: [],
        blocks: [],
        candidates,
        encounters: [],
        handouts: [],
        maps: [],
        missions: [],
        people: [],
        pressures: [],
        priority: [],
        session: null
      };
    }

    const anchors = anchorRows(session);
    const blocks = blockRows(session);
    const linkedMissions = linkedPages(dv, session.missioni);
    const missions = linkedMissions.length
      ? linkedMissions
      : fallbackRows(dv, '"Mondi/Missioni"', page => OPEN_MISSION_STATES.has(String(page.stato ?? "")), pressure, 8);
    const linkedPressures = uniquePages([
      ...linkedPages(dv, session.pressioni),
      ...linkedPages(dv, session.tracciati),
      ...linkedPages(dv, session.fazioni),
      ...linkedPages(dv, session.luoghi)
    ]).filter(page => pressure(page) > 0 || Number(page.progress_value ?? 0) > 0 || hasText(page.prossima_mossa));
    const pressures = linkedPressures.length
      ? linkedPressures.sort(sortByPressure)
      : fallbackRows(
        dv,
        '"Mondi/Relazioni" OR "Mondi/Luoghi" OR "Mondi/Fazioni" OR "Mondi/Tracciati"',
        page => pressure(page) >= 3 || Number(page.progress_value ?? 0) > 0 || hasText(page.prossima_mossa),
        pressure,
        10
      );
    const people = linkedPages(dv, session.personaggi).length
      ? linkedPages(dv, session.personaggi)
      : fallbackRows(dv, '"Mondi/Personaggi"', page => page.tipo === "png" || page.categoria === "png" || page.stato === "in gioco", page => page.file?.mtime ?? 0, 10);
    const encounters = linkedPages(dv, session.incontri).length
      ? linkedPages(dv, session.incontri)
      : fallbackRows(dv, '"Mondi/Incontri"', page => ["pronto", "in gioco"].includes(String(page.stato ?? "")), page => Number(page.pericolo ?? 0), 8);
    const handouts = linkedPages(dv, session.dispense).length
      ? linkedPages(dv, session.dispense)
      : fallbackRows(dv, '"Mondi/Dispense"', page => page.stato === "pronto", page => page.file?.mtime ?? 0, 8);
    const maps = linkedPages(dv, session.mappe).length
      ? linkedPages(dv, session.mappe)
      : fallbackRows(dv, '"Risorse/Mappe"', page => page.file?.name !== "Mappe" && (page.stato === "pronto" || page.pubblico === true), page => page.file?.mtime ?? 0, 8);
    const materialCount = encounters.length + handouts.length + maps.length;
    const missingAnchors = anchors.filter(row => !row.ok);
    const missingBlocks = blocks.filter(row => !row.ok);
    const priority = [
      ...(activeList.length > 1 ? [{ group: "Sessioni attive", page: session, problem: `${activeList.length} sessioni attive`, action: "Lascia attiva: true solo sulla prossima sessione.", priority: 7 }] : []),
      ...missingBlocks.map(row => ({ group: "Cinque blocchi", page: session, problem: `${row.label} mancante`, action: row.action, priority: 6 })),
      ...(anchors.filter(row => row.ok).length < 3 ? missingAnchors.map(row => ({ group: "Ancore mondo", page: session, problem: `${row.label} mancante`, action: row.action, priority: 5 })) : []),
      ...(!materialCount ? [{ group: "Materiali", page: session, problem: "nessun materiale pronto", action: "Collega un incontro, una mappa o una dispensa.", priority: 4 }] : []),
      ...(!missions.length ? [{ group: "Missioni", page: session, problem: "nessuna missione giocabile", action: "Crea o collega una missione con posta chiara.", priority: 3 }] : []),
      ...(!pressures.length ? [{ group: "Pressioni", page: session, problem: "nessuna pressione leggibile", action: "Collega un clock, una fazione o una relazione in movimento.", priority: 3 }] : [])
    ].sort((left, right) => right.priority - left.priority);

    return {
      activeList,
      anchors,
      blocks,
      candidates,
      encounters,
      handouts,
      maps,
      missions,
      people,
      pressures,
      priority,
      session
    };
  }

  function renderPreparationNow(dv) {
    const data = preparationData(dv);
    if (!data.session) {
      renderEmptyState(dv, {
        title: "Nessuna sessione da preparare",
        action: "Crea una sessione o scegli una bozza da rendere giocabile.",
        button: "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"
      });
      return;
    }

    const next = data.priority[0];
    const readyBlocks = data.blocks.filter(row => row.ok).length;
    const readyAnchors = data.anchors.filter(row => row.ok).length;
    const cards = [
      {
        title: next ? `Prepara prima: ${next.group}` : "Prepara prima: pronto",
        meta: pageTitle(data.session),
        body: next?.problem ?? "La sessione ha ancore, blocchi e materiali sufficienti.",
        importa: next?.action ?? "Segna stato: pronto e apri Durante il Gioco.",
        link: next?.page?.file?.path ?? data.session.file?.path,
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Sessione target",
        meta: [data.session.stato, data.session.data].filter(Boolean).join(" · ") || "sessione",
        body: fieldText(data.session.obiettivo) || "Obiettivo non ancora scritto.",
        importa: data.activeList.length > 1 ? "Risolvi le sessioni attive duplicate." : "Questa e la prossima sessione da rendere giocabile.",
        link: data.session.file?.path,
        cls: data.activeList.length > 1 ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Ancore mondo",
        meta: `${readyAnchors}/${data.anchors.length} collegate`,
        body: data.anchors.filter(row => row.ok).map(row => row.label).join(", ") || "Nessuna ancora collegata.",
        importa: readyAnchors >= 3 ? "Bastano per preparare senza inventare nel vuoto." : "Collega almeno tre ancore prima dei blocchi.",
        link: data.session.file?.path,
        cls: readyAnchors >= 3 ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Cinque blocchi",
        meta: `${readyBlocks}/${data.blocks.length} pronti`,
        body: data.blocks.find(row => !row.ok)?.label ?? "Obiettivo, apertura, scelta, pressione e materiale sono pronti.",
        importa: data.blocks.find(row => !row.ok)?.action ?? "La sessione puo passare al tavolo.",
        link: data.session.file?.path,
        cls: readyBlocks >= data.blocks.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Materiale pronto",
        meta: `${data.encounters.length} incontri · ${data.handouts.length} handout · ${data.maps.length} mappe`,
        body: data.encounters[0] ? pageTitle(data.encounters[0]) : data.handouts[0] ? pageTitle(data.handouts[0]) : data.maps[0] ? pageTitle(data.maps[0]) : "Nessun materiale pronto.",
        importa: "Porta al tavolo solo cio che serve alla prima scena o alla pressione.",
        link: data.encounters[0]?.file?.path ?? data.handouts[0]?.file?.path ?? data.maps[0]?.file?.path ?? "Risorse/Materiali Al Tavolo.md",
        cls: data.encounters.length || data.handouts.length || data.maps.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Apertura live",
        meta: data.session.attiva === true ? "attiva" : "da attivare",
        body: data.session.attiva === true ? "Questa sessione e gia marcata attiva." : "Quando e pronta, rendila l'unica sessione attiva.",
        importa: "Durante il Gioco usa una sola sessione attiva.",
        link: "Hub/Durante il Gioco.md",
        cls: data.session.attiva === true ? "gdr-kind-ready" : ""
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-preparation-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderPreparationReadiness(dv) {
    const data = preparationData(dv);
    const stats = [
      ["Sessioni attive", data.activeList.length, "deve restarne una sola"],
      ["Sessione", data.session ? 1 : 0, data.session ? pageTitle(data.session) : "nessuna"],
      ["Ancore", data.anchors.filter(row => row.ok).length, "mondo, luogo, potere, missione, pressione, materiale"],
      ["Cinque blocchi", data.blocks.filter(row => row.ok).length, "obiettivo, scena, scelta, pressione, materiale"],
      ["Missioni", data.missions.length, "obiettivi giocabili"],
      ["Pressioni", data.pressures.length, "clock, fazioni o relazioni in moto"],
      ["PNG", data.people.length, "persone pronte in scena"],
      ["Materiali", data.encounters.length + data.handouts.length + data.maps.length, "incontri, handout e mappe"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-preparation-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readPreparationCockpit() {
    return readJsonRel("z.automazioni/data/runtime/preparation_cockpit.json", {
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

  async function renderPreparationAnchorQueues(dv) {
    const cockpit = await readPreparationCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = preparationData(dv);

    renderTable(
      dv,
      labels,
      "candidate_sessions",
      ["Sessione", "Stato", "Data", "Obiettivo", "Azione"],
      data.candidates.map(page => [pageLink(page), page.stato ?? "", page.data ?? "", fieldText(page.obiettivo) || "", page.attiva === true ? "gia attiva" : "scegli o rendi attiva"]),
      "Nessuna sessione candidata: crea una nuova sessione."
    );
    renderTable(
      dv,
      labels,
      "anchors",
      ["Ancora", "Stato", "Valore", "Azione"],
      data.anchors.map(row => [row.label, row.ok ? "ok" : "manca", row.text || "", row.ok ? "Verifica che arrivi al tavolo." : row.action]),
      "Nessuna sessione da preparare."
    );
    renderTable(
      dv,
      labels,
      "missions",
      ["Missione", "Stato", "Pressione", "Prossima mossa", "Luoghi"],
      data.missions.slice(0, 12).map(page => [pageLink(page), page.stato ?? "", pressure(page) || "", fieldText(page.prossima_mossa) || "", fieldText(page.luoghi) || ""]),
      "Nessuna missione pronta o collegata."
    );
    renderTable(
      dv,
      labels,
      "pressures",
      ["Pressione", "Tipo", "Valore", "Prossima mossa"],
      data.pressures.slice(0, 12).map(page => [pageLink(page), page.categoria ?? page.tipo ?? "", progressText(page) || pressure(page) || "", fieldText(page.prossima_mossa ?? page.innesco) || ""]),
      "Nessuna pressione pronta: collega clock, fazione o relazione."
    );
  }

  async function renderPreparationMaterialQueues(dv) {
    const cockpit = await readPreparationCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = preparationData(dv);

    renderTable(
      dv,
      labels,
      "people",
      ["Persona", "Ruolo", "Luogo", "Atteggiamento"],
      data.people.slice(0, 12).map(page => [pageLink(page), fieldText(page.ruolo ?? page.tipo) || "", fieldText(page.luogo ?? page.luoghi) || "", fieldText(page.atteggiamento) || ""]),
      "Nessun PNG pronto: crea o collega una persona in scena."
    );
    renderTable(
      dv,
      labels,
      "encounters",
      ["Incontro", "Tipo", "Pericolo", "Luogo", "Creature"],
      data.encounters.slice(0, 12).map(page => [pageLink(page), page.tipo ?? "", page.pericolo ?? "", fieldText(page.luogo ?? page.luoghi) || "", fieldText(page.creature ?? page.encounter_creatures) || ""]),
      "Nessun incontro pronto o collegato."
    );
    renderTable(
      dv,
      labels,
      "handouts",
      ["Handout", "Tipo", "Luogo", "Pubblico"],
      data.handouts.slice(0, 12).map(page => [pageLink(page), page.tipo ?? page.categoria ?? "", fieldText(page.luogo ?? page.luoghi) || "", page.pubblico === true ? "si" : "no"]),
      "Nessuna dispensa pronta o collegata."
    );
    renderTable(
      dv,
      labels,
      "maps",
      ["Mappa", "Uso", "Luogo", "Stato"],
      data.maps.slice(0, 12).map(page => [pageLink(page), page.uso ?? page.tipo ?? "", fieldText(page.luogo ?? page.luoghi) || "", page.stato ?? ""]),
      "Nessuna mappa pronta o collegata."
    );
  }

  async function renderPreparationSurfaceLinks(dv) {
    const cockpit = await readPreparationCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici preparazione non configurate",
        action: "Rigenera il contratto Preparazione Sessione dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-preparation-surfaces" });
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
    renderPreparationAnchorQueues,
    renderPreparationMaterialQueues,
    renderPreparationNow,
    renderPreparationReadiness,
    renderPreparationSurfaceLinks
  };
})
