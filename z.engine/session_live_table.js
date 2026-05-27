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
    linkKey,
    pageTitle,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState,
    sessionCandidates
  } = ctx;

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function"
      ? data.array()
      : Array.isArray(value) ? value : value ? [value] : [];
  }

  function pageFromAny(dv, link) {
    if (!link) return null;
    if (link.file?.path) return link;
    const key = link?.path ?? String(link ?? "");
    if (!key || typeof dv.page !== "function") return null;
    return dv.page(key) ?? null;
  }

  function linkedPages(dv, links) {
    return dvItems(dv, links).map(link => pageFromAny(dv, link)).filter(Boolean);
  }

  function realPage(page) {
    const folderIndex = page?.file?.name === page?.file?.folder?.split("/").pop();
    return isReal(page) && !folderIndex && page.stato !== "archiviata" && page.stato !== "ignorata";
  }

  function progressText(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || 0;
    return max > 0 ? `${value}/${max}` : "";
  }

  function linkSet(dv, values) {
    return new Set(dvItems(dv, values).map(linkKey).filter(Boolean));
  }

  function hasSessionLink(dv, page, session, fields) {
    const keys = new Set([
      ...linkSet(dv, session?.fazioni),
      ...linkSet(dv, session?.missioni),
      ...linkSet(dv, session?.tracciati),
      ...linkSet(dv, session?.luoghi),
      ...linkSet(dv, session?.personaggi)
    ]);
    if (!keys.size) return true;
    if (keys.has(page?.file?.path) || keys.has(page?.file?.name)) return true;
    return fields.some(field => dvItems(dv, page?.[field]).some(link => keys.has(linkKey(link))));
  }

  function activeOrFallback(dv) {
    return activeSession(dv);
  }

  function liveNotes(dv, session) {
    const linked = linkedPages(dv, session?.appunti_live);
    if (linked.length) return linked.filter(realPage);
    return dv.pages('"Inbox"')
      .where(page => realPage(page))
      .sort(page => page.file?.mtime ?? 0, "desc")
      .limit(10)
      .array();
  }

  function pressureRows(dv, session) {
    const linked = [
      ...linkedPages(dv, session?.missioni),
      ...linkedPages(dv, session?.fazioni),
      ...linkedPages(dv, session?.tracciati)
    ].filter(realPage);
    const rows = linked.length
      ? linked
      : dv.pages('"Mondi/Missioni" OR "Mondi/Fazioni" OR "Mondi/Tracciati"')
        .where(page => realPage(page) && hasSessionLink(dv, page, session, ["fazioni", "missioni", "luoghi", "personaggi"]))
        .array();
    return rows
      .filter(page => pressure(page) > 0 || Number(page.progress_value ?? 0) > 0 || hasText(page.prossima_mossa))
      .sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function peopleRows(dv, session) {
    const linked = linkedPages(dv, session?.personaggi).filter(realPage);
    if (linked.length) return linked;
    return dv.pages('"Mondi/Personaggi"')
      .where(page => realPage(page) && (page.tipo === "png" || page.categoria === "png" || page.stato === "in gioco"))
      .sort(page => page.file?.mtime ?? 0, "desc")
      .limit(12)
      .array();
  }

  function encounterRows(dv, session) {
    const linked = linkedPages(dv, session?.incontri).filter(realPage);
    if (linked.length) return linked;
    return dv.pages('"Mondi/Incontri"')
      .where(page => realPage(page) && ["pronto", "in gioco"].includes(String(page.stato ?? "")))
      .sort(page => pressure(page), "desc")
      .limit(10)
      .array();
  }

  function creatureRows(dv, session, encounters = []) {
    const direct = linkedPages(dv, session?.creature).filter(realPage);
    const fromEncounters = encounters.flatMap(encounter => linkedPages(dv, encounter.creature ?? encounter.creatures ?? encounter.encounter_creatures));
    const seen = new Set();
    return [...direct, ...fromEncounters].filter(page => {
      const key = page.file?.path;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function objectRows(dv, session) {
    const linked = linkedPages(dv, session?.oggetti).filter(realPage);
    if (linked.length) return linked;
    return dv.pages('"Mondi/Oggetti"')
      .where(page => realPage(page) && !hasText(page.proprietario))
      .sort(page => page.rarita ?? "", "asc")
      .limit(10)
      .array();
  }

  function handoutRows(dv, session) {
    const linked = linkedPages(dv, session?.dispense).filter(realPage);
    if (linked.length) return linked;
    return dv.pages('"Mondi/Dispense"')
      .where(page => realPage(page) && page.stato === "pronto")
      .sort(page => page.nome ?? page.file?.name ?? "", "asc")
      .limit(10)
      .array();
  }

  function mapRows(dv, session) {
    const linked = linkedPages(dv, session?.mappe).filter(realPage);
    if (linked.length) return linked;
    return dv.pages('"Risorse/Mappe"')
      .where(page => realPage(page) && page.file?.name !== "Mappe" && (page.stato === "pronto" || page.pubblico === true))
      .sort(page => page.file?.mtime ?? 0, "desc")
      .limit(8)
      .array();
  }

  function mediaRows(dv, session, encounters = []) {
    const links = [
      ...dvItems(dv, session?.audio),
      ...dvItems(dv, session?.immagini),
      ...dvItems(dv, session?.video),
      ...encounters.flatMap(page => dvItems(dv, page.audio)),
      ...encounters.flatMap(page => dvItems(dv, page.immagini)),
      ...encounters.flatMap(page => dvItems(dv, page.video))
    ];
    const linked = linkedPages(dv, links).filter(realPage);
    if (linked.length) return linked;
    return dv.pages('"Risorse/Audio" OR "Risorse/Video" OR "Risorse/Immagini" OR "Risorse/Dispense"')
      .where(page => realPage(page) && !["Audio", "Video", "Immagini", "Dispense"].includes(page.file?.name) && page.stato === "pronto")
      .sort(page => page.uso ?? "", "asc")
      .limit(8)
      .array();
  }

  function liveBuckets(dv) {
    const session = activeOrFallback(dv);
    const notes = session ? liveNotes(dv, session) : [];
    const pressures = session ? pressureRows(dv, session) : [];
    const people = session ? peopleRows(dv, session) : [];
    const encounters = session ? encounterRows(dv, session) : [];
    const creatures = session ? creatureRows(dv, session, encounters) : [];
    const objects = session ? objectRows(dv, session) : [];
    const handouts = session ? handoutRows(dv, session) : [];
    const maps = session ? mapRows(dv, session) : [];
    const media = session ? mediaRows(dv, session, encounters) : [];
    const postBridge = session
      ? [session, ...notes].filter(page => {
        const issues = continuityIssues(page);
        return issues.length
          || hasLinks(page.conseguenze)
          || hasLinks(page.entita_impattate)
          || hasLinks(page.propaga_a)
          || hasText(page.output_sessione)
          || hasText(page.recap_pubblico);
      })
      : [];

    return { creatures, encounters, handouts, maps, media, notes, objects, people, postBridge, pressures, session };
  }

  function noActiveSession(dv) {
    const candidates = sessionCandidates(dv).limit(4).array();
    if (!candidates.length) {
      renderEmptyState(dv, {
        title: "Nessuna sessione live",
        action: "Apri Preparazione Sessione e crea o prepara una sessione.",
        link: "Risorse/Preparazione Sessione.md",
        button: "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"
      });
      return;
    }
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = candidates.map(page => cardHtml({
      title: pageTitle(page),
      meta: page.stato ?? "sessione",
      body: "Imposta attiva: true quando questa e la sessione al tavolo.",
      link: page.file?.path ?? "",
      cls: "gdr-info-card compact gdr-kind-missing"
    })).join("");
  }

  function renderLiveTableNow(dv) {
    const buckets = liveBuckets(dv);
    const session = buckets.session;
    if (!session) {
      noActiveSession(dv);
      return;
    }

    const nextPressure = buckets.pressures[0];
    const nextNote = buckets.notes[0];
    const cards = [
      cardHtml({
        title: "Gioca adesso",
        meta: [session.file?.name, session.stato].filter(Boolean).join(" · "),
        body: fieldText(session.scena_corrente ?? session.apertura) || "Aggiorna la scena corrente.",
        importa: fieldText(session.scelta ?? session.decisioni_attese ?? session.domande_al_tavolo) || "Metti davanti al party una scelta concreta.",
        link: session.file?.path ?? "",
        cls: `gdr-info-card compact ${hasText(session.scena_corrente ?? session.apertura) ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: nextPressure ? "Pressione da muovere" : "Pressione da muovere",
        meta: nextPressure ? pageTitle(nextPressure) : "nessuna pressione collegata",
        body: nextPressure ? `pressione ${pressure(nextPressure) || 0}${progressText(nextPressure) ? ` · ${progressText(nextPressure)}` : ""}` : "Collega un clock, una missione o una fazione.",
        importa: nextPressure ? fieldText(nextPressure.prossima_mossa ?? nextPressure.innesco) || "Decidi cosa accade se nessuno interviene." : "La sessione funziona meglio se qualcosa puo avanzare.",
        link: nextPressure?.file?.path ?? "",
        cls: `gdr-info-card compact ${nextPressure ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Cattura live",
        meta: `${buckets.notes.length} appunti`,
        body: nextNote ? pageTitle(nextNote) : "Cattura eventi, PNG, luoghi o conseguenze mentre emergono.",
        importa: nextNote ? continuityAction(nextNote) : "Non ordinare tutto durante il tavolo: cattura e risolvi dopo.",
        link: nextNote?.file?.path ?? "Inbox",
        cls: `gdr-info-card compact ${buckets.notes.length ? "gdr-kind-ready" : ""}`
      }),
      cardHtml({
        title: "Materiale pronto",
        meta: `${buckets.encounters.length} incontri · ${buckets.handouts.length} dispense · ${buckets.maps.length} mappe`,
        body: buckets.encounters.map(pageTitle).slice(0, 3).join(", ") || buckets.handouts.map(pageTitle).slice(0, 3).join(", ") || "Apri o collega il materiale che userai ora.",
        importa: "Usa solo cio che serve alla scena corrente.",
        link: buckets.encounters[0]?.file?.path ?? buckets.handouts[0]?.file?.path ?? "Risorse/Materiali Al Tavolo.md",
        cls: `gdr-info-card compact ${buckets.encounters.length || buckets.handouts.length || buckets.maps.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-live-table-now" });
    grid.innerHTML = cards.join("");
  }

  function renderLiveTableReadiness(dv) {
    const buckets = liveBuckets(dv);
    const session = buckets.session;
    if (!session) {
      noActiveSession(dv);
      return;
    }

    const stats = [
      ["Luoghi", dvItems(dv, session.luoghi).length, "dove puo andare la scena"],
      ["Persone", buckets.people.length, "PNG o PG rilevanti"],
      ["Missioni", dvItems(dv, session.missioni).length, "obiettivi vivi"],
      ["Clock", dvItems(dv, session.tracciati).length + buckets.pressures.filter(page => page.categoria === "tracciato").length, "pressione visibile"],
      ["Materiali", buckets.encounters.length + buckets.handouts.length + buckets.objects.length, "usabili subito"],
      ["Mappe e media", buckets.maps.length + buckets.media.length, "supporti al tavolo"],
      ["Appunti", buckets.notes.length, "da risolvere dopo"],
      ["Post", buckets.postBridge.length, "continuita o recap"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-live-table-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readLiveTableCockpit() {
    return readJsonRel("z.automazioni/data/runtime/live_table_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  async function renderLiveTableQueues(dv) {
    const cockpit = await readLiveTableCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = liveBuckets(dv);
    if (!buckets.session) {
      noActiveSession(dv);
      return;
    }
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "live_notes",
      ["Nota", "Tipo", "Stato", "Azione"],
      buckets.notes.slice(0, 12).map(page => [page.file?.link ?? page.file?.path, page.tipo ?? page.categoria ?? "", page.stato ?? page.stato_canonico ?? "", continuityAction(page)]),
      "Nessun appunto live collegato o recente."
    );
    renderTable(
      "pressures",
      ["Fronte", "Stato", "Pressione", "Prossima mossa"],
      buckets.pressures.slice(0, 12).map(page => [page.file?.link ?? page.file?.path, page.stato ?? "", pressure(page) || progressText(page), fieldText(page.prossima_mossa ?? page.innesco) || "da decidere"]),
      "Nessuna pressione collegata alla sessione attiva."
    );
    renderTable(
      "people",
      ["Persona", "Ruolo", "Luogo", "Atteggiamento"],
      buckets.people.slice(0, 12).map(page => [page.file?.link ?? page.file?.path, page.ruolo ?? page.tipo ?? "", fieldText(page.luogo ?? page.luoghi) || "", fieldText(page.atteggiamento ?? page.prossima_mossa) || ""]),
      "Nessuna persona in scena o PNG in gioco."
    );
    renderTable(
      "post_bridge",
      ["Output", "Stato", "Bersagli", "Azione"],
      buckets.postBridge.slice(0, 12).map(page => [page.file?.link ?? page.file?.path, continuityStatus(page) || page.stato || "", fieldText(page.entita_impattate ?? page.propaga_a ?? page.collegamenti) || "", continuityIssues(page).join(", ") || continuityAction(page)]),
      "Nessun output live da portare al post-sessione."
    );
  }

  async function renderLiveTableMaterials(dv) {
    const cockpit = await readLiveTableCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = liveBuckets(dv);
    if (!buckets.session) {
      noActiveSession(dv);
      return;
    }
    const renderTable = (title, headers, rows, empty) => {
      dv.header(3, title);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      labels.get("materials") ?? "Materiali pronti",
      ["Materiale", "Tipo", "Uso", "Stato"],
      [
        ...buckets.encounters.slice(0, 8).map(page => [page.file?.link ?? page.file?.path, page.tipo ?? "incontro", fieldText(page.luogo ?? page.creature) || "scena", page.stato ?? ""]),
        ...buckets.handouts.slice(0, 8).map(page => [page.file?.link ?? page.file?.path, page.tipo ?? "dispensa", fieldText(page.luogo ?? page.personaggi) || "handout", page.stato ?? ""]),
        ...buckets.objects.slice(0, 8).map(page => [page.file?.link ?? page.file?.path, page.tipo ?? "oggetto", fieldText(page.luogo ?? page.proprietario) || "ricompensa o leva", page.stato ?? ""])
      ].slice(0, 18),
      "Nessun materiale pronto o collegato alla sessione."
    );
    renderTable(
      "Creature",
      ["Creatura", "Tipo", "Taglia", "GS"],
      buckets.creatures.slice(0, 10).map(page => [page.file?.link ?? page.file?.path, page.type ?? page.tipo ?? "", page.size ?? page.taglia ?? "", page.cr ?? page.gs ?? ""]),
      "Nessuna creatura collegata agli incontri della sessione."
    );
    renderTable(
      "Mappe e media",
      ["Risorsa", "Uso", "Tono", "Stato"],
      [
        ...buckets.maps.slice(0, 8).map(page => [page.file?.link ?? page.file?.path, page.uso ?? "mappa", fieldText(page.luogo ?? page.luoghi) || "", page.stato ?? ""]),
        ...buckets.media.slice(0, 8).map(page => [page.file?.link ?? page.file?.path, page.uso ?? page.tipo ?? "media", page.tono ?? "", page.stato ?? ""])
      ].slice(0, 16),
      "Nessuna mappa o media pronto per la scena."
    );
  }

  async function renderLiveTableSurfaceLinks(dv) {
    const cockpit = await readLiveTableCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici live non configurate",
        action: "Rigenera il contratto Durante il Gioco dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-live-table-surfaces" });
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
    renderLiveTableMaterials,
    renderLiveTableNow,
    renderLiveTableQueues,
    renderLiveTableReadiness,
    renderLiveTableSurfaceLinks
  };
})
