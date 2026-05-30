(ctx => {
  const {
    activeSession,
    cardClass,
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
    renderEmptyState,
    sessionCandidates
  } = ctx;

  function items(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.array === "function") return value.array();
    return [value];
  }

  function flattenLinks(...values) {
    return values.flatMap(items);
  }

  function pageFromAny(dv, link) {
    if (!link) return null;
    if (link.file?.path) return link;
    const key = link?.path ?? String(link ?? "");
    if (!key || typeof dv.page !== "function") return null;
    return dv.page(key) ?? null;
  }

  function realPage(page) {
    const folderIndex = page?.file?.name === page?.file?.folder?.split("/").pop();
    return isReal(page) && !folderIndex && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
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

  function linkedPages(dv, values) {
    return uniquePages(items(values).map(link => pageFromAny(dv, link)).filter(realPage));
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function fallbackRows(dv, source, predicate, sorter, limit = 10, direction = "desc") {
    return dv.pages(source)
      .where(page => realPage(page) && predicate(page))
      .sort(sorter, direction)
      .limit(limit)
      .array();
  }

  function targetSession(dv) {
    const active = activeSession(dv);
    if (realPage(active)) return { session: active, mode: "attiva" };
    const candidate = sessionCandidates(dv)
      .where(page => realPage(page) && ["bozza", "preparazione", "pronto", "in corso"].includes(String(page.stato ?? "")))
      .first();
    return { session: candidate ?? null, mode: candidate ? "candidata" : "" };
  }

  function materialIssues(page, kind = "materiale") {
    const issues = [];
    if (!page) return ["manca nota"];

    if (kind === "incontro") {
      if (!hasLinks(page.luogo) && !hasLinks(page.luoghi)) issues.push("manca luogo");
      if (!hasLinks(page.missioni) && !hasLinks(page.fazioni) && !hasLinks(page.sessioni)) issues.push("non agganciato a missione/fazione/sessione");
      if (String(page.tipo ?? "") === "combattimento" && !hasLinks(page.creatures) && !hasLinks(page.creature)) issues.push("combattimento senza creature");
      if (String(page.tipo ?? "") === "combattimento" && !hasLinks(page.encounter_creatures) && !hasText(page.encounter_creatures)) issues.push("manca Initiative Tracker");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.gancio)) issues.push("manca uso al tavolo");
      if (!hasText(page.prossima_mossa)) issues.push("manca esito se ignorato");
    }

    if (kind === "creatura") {
      if (!hasLinks(page.luoghi) && !hasLinks(page.luogo) && !hasText(page.habitat)) issues.push("manca habitat/luogo");
      if (!hasLinks(page.missioni) && !hasLinks(page.fazioni) && !hasLinks(page.sessioni) && !hasLinks(page.connessioni)) issues.push("isolata dal mondo");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.gancio)) issues.push("manca uso al tavolo");
      if (!hasText(page.player_safe)) issues.push("manca versione player-safe");
    }

    if (kind === "oggetto") {
      if (!hasLinks(page.luogo) && !hasLinks(page.luoghi) && !hasLinks(page.proprietario)) issues.push("manca luogo/proprietario");
      if (!hasLinks(page.missioni) && !hasLinks(page.sessioni) && !hasLinks(page.connessioni)) issues.push("isolato da missione/sessione/mondo");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.gancio)) issues.push("manca uso al tavolo");
      if (!hasText(page.player_safe)) issues.push("manca versione player-safe");
    }

    if (kind === "dispensa") {
      if (!hasLinks(page.sessioni) && !hasLinks(page.luogo) && !hasLinks(page.luoghi) && !hasLinks(page.personaggi)) issues.push("manca scena o destinatario");
      if (page.pubblico === true && !hasText(page.player_safe)) issues.push("pubblica senza testo player-safe");
      if (!hasText(page.uso_al_tavolo) && !hasText(page.scena) && !hasText(page.gancio)) issues.push("manca quando consegnarla");
    }

    if (kind === "mappa") {
      if (!hasLinks(page.luogo) && !hasLinks(page.luoghi) && !hasText(page.coordinates)) issues.push("manca luogo o coordinate");
      if (page.pubblico === true && !hasText(page.player_safe)) issues.push("pubblica senza nota player-safe");
      if (!hasText(page.uso) && !hasText(page.uso_al_tavolo)) issues.push("manca uso in scena");
    }

    if (kind === "media") {
      if (!hasText(page.uso) && !hasText(page.scena)) issues.push("manca scena di apertura");
      if (!hasText(page.timestamp) && String(page.tipo ?? "").match(/audio|video/i)) issues.push("manca timestamp");
    }

    return issues;
  }

  function tableMaterialsData(dv) {
    const { session, mode } = targetSession(dv);
    if (!session) {
      return {
        creatures: [],
        dndRows: [],
        encounters: [],
        gaps: [],
        handouts: [],
        maps: [],
        media: [],
        mode,
        objects: [],
        priority: null,
        session: null,
        sessionMaterials: []
      };
    }

    const encounters = linkedPages(dv, session.incontri).length
      ? linkedPages(dv, session.incontri)
      : fallbackRows(dv, '"Mondi/Incontri"', page => ["pronto", "in gioco"].includes(String(page.stato ?? "")), page => Number(page.pericolo ?? pressure(page) ?? 0), 8);
    const encounterCreatures = encounters.flatMap(page => linkedPages(dv, flattenLinks(page.creatures, page.creature, page.encounter_creatures)));
    const directCreatures = linkedPages(dv, flattenLinks(session.creatures, session.creature));
    const creatures = uniquePages([...directCreatures, ...encounterCreatures]);
    const encounterObjects = encounters.flatMap(page => linkedPages(dv, flattenLinks(page.oggetti, page.ricompense)));
    const directObjects = linkedPages(dv, flattenLinks(session.oggetti, session.ricompense));
    const objects = uniquePages([...directObjects, ...encounterObjects]).length
      ? uniquePages([...directObjects, ...encounterObjects])
      : fallbackRows(dv, '"Mondi/Oggetti"', page => ["pronto", "in gioco"].includes(String(page.stato ?? "")), page => page.file?.mtime ?? 0, 8);
    const handouts = linkedPages(dv, session.dispense).length
      ? linkedPages(dv, session.dispense)
      : fallbackRows(dv, '"Mondi/Dispense"', page => page.stato === "pronto", page => page.file?.mtime ?? 0, 8);
    const encounterMaps = encounters.flatMap(page => linkedPages(dv, flattenLinks(page.mappe, page.mappa)));
    const sessionMaps = linkedPages(dv, flattenLinks(session.mappe, session.mappa));
    const maps = uniquePages([...sessionMaps, ...encounterMaps]).length
      ? uniquePages([...sessionMaps, ...encounterMaps])
      : fallbackRows(dv, '"Risorse/Mappe"', page => page.file?.name !== "Mappe" && (page.stato === "pronto" || page.pubblico === true), page => page.file?.mtime ?? 0, 8);
    const linkedMedia = linkedPages(dv, flattenLinks(
      session.media,
      session.audio,
      session.immagini,
      session.video,
      ...encounters.flatMap(page => flattenLinks(page.media, page.audio, page.immagini, page.video))
    ));
    const media = linkedMedia.length
      ? linkedMedia
      : fallbackRows(
        dv,
        '"Risorse/Audio" OR "Risorse/Video" OR "Risorse/Immagini" OR "Risorse/Dispense"',
        page => !["Audio", "Video", "Immagini", "Dispense"].includes(page.file?.name) && page.stato === "pronto",
        page => page.file?.mtime ?? 0,
        8
      );
    const dndRows = [
      ...encounters.map(page => ({ page, kind: "incontro", badge: "Incontro", priority: 7 })),
      ...creatures.map(page => ({ page, kind: "creatura", badge: "Creatura", priority: 5 })),
      ...objects.map(page => ({ page, kind: "oggetto", badge: "Oggetto", priority: 4 }))
    ].map(row => ({ ...row, issues: materialIssues(row.page, row.kind) }));
    const contentRows = [
      ...handouts.map(page => ({ page, kind: "dispensa", badge: "Dispensa", priority: 6, issues: materialIssues(page, "dispensa") })),
      ...maps.map(page => ({ page, kind: "mappa", badge: "Mappa", priority: 5, issues: materialIssues(page, "mappa") })),
      ...media.map(page => ({ page, kind: "media", badge: "Media", priority: 3, issues: materialIssues(page, "media") }))
    ];
    const gaps = [...dndRows, ...contentRows]
      .flatMap(row => row.issues.map(problem => ({ ...row, problem })))
      .sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
    const sessionMaterials = uniquePages([...encounters, ...handouts, ...objects, ...maps, ...media]);

    return {
      creatures,
      dndRows,
      encounters,
      gaps,
      handouts,
      maps,
      media,
      mode,
      objects,
      priority: gaps[0] ?? null,
      session,
      sessionMaterials
    };
  }

  function noSession(dv) {
    const candidates = sessionCandidates(dv).limit(4).array();
    if (!candidates.length) {
      renderEmptyState(dv, {
        title: "Nessuna sessione target",
        action: "Crea o prepara una sessione prima di scegliere materiali.",
        link: "Risorse/Preparazione Sessione.md",
        button: "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"
      });
      return;
    }
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = candidates.map(page => cardHtml({
      title: pageTitle(page),
      meta: page.stato ?? "sessione",
      body: "Scegli questa sessione come target e collega incontri, mappe, dispense o media.",
      link: page.file?.path ?? "",
      cls: "gdr-info-card compact gdr-kind-missing"
    })).join("");
  }

  function renderTableMaterialsNow(dv) {
    const data = tableMaterialsData(dv);
    if (!data.session) {
      noSession(dv);
      return;
    }

    const readyCount = data.sessionMaterials.length;
    const first = data.priority;
    const cards = [
      {
        title: first ? `Materiale prima: ${first.badge}` : "Materiale prima: pronto",
        meta: first ? pageTitle(first.page) : `${readyCount} materiali collegati`,
        body: first?.problem ?? "Il materiale minimo della sessione e leggibile.",
        importa: first ? "Apri la nota e completa il campo che decide uso al tavolo, sicurezza o aggancio." : "Puoi passare al tavolo senza leggere liste lunghe.",
        link: first?.page?.file?.path ?? data.session.file?.path,
        cls: first ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Sessione target",
        meta: [data.mode, data.session.stato, data.session.data].filter(Boolean).join(" · "),
        body: fieldText(data.session.scena_corrente ?? data.session.apertura ?? data.session.obiettivo) || "Obiettivo o apertura non compilati.",
        importa: "Tutti i materiali qui sotto devono servire questa sessione.",
        link: data.session.file?.path,
        cls: "gdr-kind-ready"
      },
      {
        title: "Consegne",
        meta: `${data.handouts.length} dispense · ${data.objects.length} oggetti`,
        body: data.handouts[0] ? pageTitle(data.handouts[0]) : data.objects[0] ? pageTitle(data.objects[0]) : "Nessuna consegna pronta.",
        importa: "Tieni solo cio che puoi consegnare, mostrare o mettere in mano al party.",
        link: data.handouts[0]?.file?.path ?? data.objects[0]?.file?.path ?? "Risorse/Dispense/Dispense.md",
        cls: data.handouts.length || data.objects.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Spazio e cue",
        meta: `${data.maps.length} mappe · ${data.media.length} media`,
        body: data.maps[0] ? pageTitle(data.maps[0]) : data.media[0] ? pageTitle(data.media[0]) : "Nessuna mappa o cue pronto.",
        importa: "Apri asset visuali e sonori solo se hanno una scena precisa.",
        link: data.maps[0]?.file?.path ?? data.media[0]?.file?.path ?? "Risorse/Mappe/Mappe.md",
        cls: data.maps.length || data.media.length ? "gdr-kind-ready" : ""
      },
      {
        title: "Incontri",
        meta: `${data.encounters.length} incontri · ${data.creatures.length} creature`,
        body: data.encounters[0] ? pageTitle(data.encounters[0]) : "Nessun incontro collegato.",
        importa: data.creatures.length ? "Creature collegate agli incontri della sessione." : "Collega creature solo se servono davvero alla scena.",
        link: data.encounters[0]?.file?.path ?? "Risorse/Iniziativa e Combattimenti.md",
        cls: data.encounters.length ? "gdr-kind-ready" : ""
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-table-materials-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderTableMaterialsReadiness(dv) {
    const data = tableMaterialsData(dv);
    const stats = [
      ["Sessione", data.session ? 1 : 0, data.session ? pageTitle(data.session) : "nessuna target"],
      ["Dispense", data.handouts.length, "handout o testi consegnabili"],
      ["Mappe", data.maps.length, "mappe pronte o pubbliche"],
      ["Media", data.media.length, "audio, immagini o video con uso"],
      ["Incontri", data.encounters.length, `${data.creatures.length} creature collegate`],
      ["Oggetti", data.objects.length, "leve, prove o ricompense"],
      ["Gap DnD", data.gaps.length, "campi da completare prima del tavolo"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-table-materials-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readTableMaterialsCockpit() {
    return readJsonRel("z.automazioni/data/runtime/table_materials_cockpit.json", {
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

  async function renderTableMaterialsSessionQueues(dv) {
    const cockpit = await readTableMaterialsCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = tableMaterialsData(dv);

    renderTable(
      dv,
      labels,
      "session_materials",
      ["Materiale", "Tipo", "Uso", "Stato", "Azione"],
      data.sessionMaterials.slice(0, 18).map(page => [
        pageLink(page),
        page.tipo ?? page.categoria ?? "",
        fieldText(page.uso_al_tavolo ?? page.uso ?? page.scena ?? page.luogo ?? page.luoghi) || "",
        page.stato ?? "",
        "Apri se entra nella prossima scena."
      ]),
      "Nessun materiale collegato alla sessione target."
    );
    renderTable(
      dv,
      labels,
      "handouts",
      ["Dispensa", "Tipo", "Luogo", "Pubblico", "Quando"],
      data.handouts.slice(0, 12).map(page => [
        pageLink(page),
        page.tipo ?? page.categoria ?? "",
        fieldText(page.luogo ?? page.luoghi ?? page.personaggi) || "",
        page.pubblico === true ? "si" : "no",
        fieldText(page.scena ?? page.uso_al_tavolo ?? page.gancio) || "decidi quando consegnarla"
      ]),
      "Nessuna dispensa pronta o collegata."
    );
    renderTable(
      dv,
      labels,
      "objects",
      ["Oggetto", "Tipo", "Luogo", "Uso", "Stato"],
      data.objects.slice(0, 12).map(page => [
        pageLink(page),
        page.tipo ?? page.categoria ?? "",
        fieldText(page.luogo ?? page.luoghi ?? page.proprietario) || "",
        fieldText(page.uso_al_tavolo ?? page.gancio ?? page.player_safe) || "",
        page.stato ?? ""
      ]),
      "Nessun oggetto o ricompensa collegata."
    );
  }

  async function renderTableMaterialsAssetQueues(dv) {
    const cockpit = await readTableMaterialsCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = tableMaterialsData(dv);

    renderTable(
      dv,
      labels,
      "encounters",
      ["Incontro", "Tipo", "Pericolo", "Luogo", "Creature"],
      data.encounters.slice(0, 12).map(page => [
        pageLink(page),
        page.tipo ?? "",
        page.pericolo ?? pressure(page) ?? "",
        fieldText(page.luogo ?? page.luoghi) || "",
        fieldText(page.creatures ?? page.creature ?? page.encounter_creatures) || ""
      ]),
      "Nessun incontro pronto o collegato."
    );
    renderTable(
      dv,
      labels,
      "creatures",
      ["Creatura", "Tipo", "Taglia", "GS", "Uso"],
      data.creatures.slice(0, 12).map(page => [
        pageLink(page),
        page.type ?? page.tipo ?? "",
        page.size ?? page.taglia ?? "",
        page.cr ?? page.gs ?? "",
        fieldText(page.uso_al_tavolo ?? page.gancio ?? page.habitat) || ""
      ]),
      "Nessuna creatura collegata agli incontri."
    );
    renderTable(
      dv,
      labels,
      "maps_media",
      ["Risorsa", "Tipo", "Uso", "Scena", "Stato"],
      [
        ...data.maps.slice(0, 10).map(page => [pageLink(page), page.tipo ?? "mappa", fieldText(page.uso ?? page.uso_al_tavolo) || "", fieldText(page.luogo ?? page.luoghi) || "", page.stato ?? ""]),
        ...data.media.slice(0, 10).map(page => [pageLink(page), page.tipo ?? page.categoria ?? "media", fieldText(page.uso) || "", fieldText(page.scena ?? page.timestamp) || "", page.stato ?? ""])
      ].slice(0, 16),
      "Nessuna mappa o media pronto per la scena."
    );
  }

  function renderTableMaterialsDndPipeline(dv) {
    const data = tableMaterialsData(dv);
    if (!data.session) {
      noSession(dv);
      return;
    }
    if (!data.dndRows.length) {
      renderEmptyState(dv, {
        title: "Materiale DnD non collegato",
        action: "Collega almeno un incontro, una creatura o un oggetto alla sessione.",
        button: "BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-table-materials-dnd" });
    grid.innerHTML = data.dndRows.map(row => {
      const body = row.kind === "incontro"
        ? fieldText(row.page.uso_al_tavolo ?? row.page.gancio ?? row.page.creatures ?? row.page.creature)
        : fieldText(row.page.uso_al_tavolo ?? row.page.gancio ?? row.page.player_safe);
      return cardHtml({
        title: pageTitle(row.page),
        meta: [row.page.categoria ?? row.kind, row.page.tipo, row.page.stato].filter(Boolean).join(" · "),
        azione: body || "Completa uso al tavolo, agganci e output.",
        importa: row.issues.length ? `Gap: ${row.issues.join(", ")}` : fieldText(row.page.missioni ?? row.page.fazioni ?? row.page.luoghi ?? row.page.luogo ?? row.page.sessioni ?? row.page.connessioni),
        link: row.page.file?.path ?? "",
        badge: row.badge,
        cls: cardClass(row.page, "gdr-info-card compact", row.issues.length ? "gdr-kind-missing" : "gdr-kind-ready")
      });
    }).join("");
  }

  async function renderTableMaterialsSurfaceLinks(dv) {
    const cockpit = await readTableMaterialsCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici materiali non configurate",
        action: "Rigenera il contratto Materiali al Tavolo dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-table-materials-surfaces" });
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
    renderTableMaterialsAssetQueues,
    renderTableMaterialsDndPipeline,
    renderTableMaterialsNow,
    renderTableMaterialsReadiness,
    renderTableMaterialsSessionQueues,
    renderTableMaterialsSurfaceLinks
  };
})
