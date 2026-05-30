(ctx => {
  const {
    activeSession,
    asArray,
    cardHtml,
    escapeHtml,
    fieldText,
    hasText,
    isReal,
    pageTitle,
    pluginStatus,
    readJsonRel,
    renderEmptyState,
    sessionCandidates
  } = ctx;

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function" ? data.array() : asArray(value);
  }

  function pageFromAny(dv, link) {
    if (!link) return null;
    if (link.file?.path) return link;
    const key = link?.path ?? String(link ?? "");
    if (!key || typeof dv.page !== "function") return null;
    return dv.page(key) ?? null;
  }

  function folderIndex(page) {
    const stem = String(page?.file?.path ?? "").replace(/\.md$/, "");
    const parts = stem.split("/");
    return parts.length > 1 && parts[parts.length - 1] === parts[parts.length - 2];
  }

  function realPage(page) {
    return isReal(page) && !folderIndex(page) && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
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

  function linkedPages(dv, values) {
    return uniquePages(dvItems(dv, values).map(link => pageFromAny(dv, link)).filter(realPage));
  }

  function mediaType(page) {
    const folder = String(page?.file?.folder ?? page?.file?.path ?? "");
    if (folder.includes("Risorse/Audio")) return "audio";
    if (folder.includes("Risorse/Video")) return "video";
    if (folder.includes("Risorse/Immagini")) return "immagine";
    if (folder.includes("Risorse/Dispense")) return "dispensa";
    return String(page?.tipo ?? page?.categoria ?? "media").trim() || "media";
  }

  function isTimedMedia(page) {
    const type = mediaType(page);
    return type === "audio" || type === "video" || String(page?.tipo ?? "").match(/audio|video/i);
  }

  function mediaIssues(page) {
    const issues = [];
    if (!hasText(page?.uso) && !hasText(page?.scena) && !hasText(page?.uso_al_tavolo)) {
      issues.push({
        problem: "scena mancante",
        action: "Scrivi quando aprirlo e quale effetto deve sostenere."
      });
    }
    if (isTimedMedia(page) && !hasText(page?.timestamp)) {
      issues.push({
        problem: "timestamp mancante",
        action: "Aggiungi un punto di ingresso o una clip breve."
      });
    }
    if (page?.pubblico === true && !hasText(page?.player_safe) && !hasText(page?.cosa_mostrare)) {
      issues.push({
        problem: "player-safe assente",
        action: "Dichiara cosa puo vedere il party senza segreti DM."
      });
    }
    if (!hasText(page?.stato)) {
      issues.push({
        problem: "stato mancante",
        action: "Imposta pronto, bozza o reference."
      });
    }
    return issues;
  }

  function archiveCues(dv) {
    return dv.pages('"Risorse/Audio" OR "Risorse/Video" OR "Risorse/Immagini" OR "Risorse/Dispense"')
      .where(page => realPage(page) && !["Audio", "Video", "Immagini", "Dispense"].includes(page.file?.name))
      .sort(page => `${page.campagna ?? ""}${page.uso ?? ""}${page.scena ?? ""}${page.file?.name ?? ""}`, "asc")
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

  function sessionCues(dv, session) {
    if (!session) return [];
    const direct = [
      ...dvItems(dv, session.media),
      ...dvItems(dv, session.audio),
      ...dvItems(dv, session.immagini),
      ...dvItems(dv, session.video)
    ];
    const encounters = linkedPages(dv, session.incontri);
    const encounterMedia = encounters.flatMap(page => [
      ...dvItems(dv, page.media),
      ...dvItems(dv, page.audio),
      ...dvItems(dv, page.immagini),
      ...dvItems(dv, page.video)
    ]);
    return uniquePages([...linkedPages(dv, direct), ...linkedPages(dv, encounterMedia)]);
  }

  function mediaSceneData(dv) {
    const { session, mode } = targetSession(dv);
    const linked = sessionCues(dv, session);
    const archive = archiveCues(dv);
    const cues = linked.length ? linked : archive.filter(page => page.stato === "pronto").slice(0, 8);
    const all = uniquePages([...linked, ...archive]);
    const gaps = all
      .flatMap(page => mediaIssues(page).map(issue => ({ page, ...issue })))
      .sort((left, right) => String(left.problem).localeCompare(String(right.problem)) || String(left.page.file?.name ?? "").localeCompare(String(right.page.file?.name ?? "")));
    const ready = all.filter(page => ["pronto", "in gioco", "consegnato"].includes(String(page.stato ?? "")) && !mediaIssues(page).length);
    const timed = all.filter(page => hasText(page.timestamp));

    return {
      archive,
      cues,
      gaps,
      linked,
      mode,
      ready,
      session,
      timed
    };
  }

  async function readMediaSceneCockpit() {
    return readJsonRel("z.automazioni/data/runtime/media_scene_cockpit.json", {
      patterns: [],
      queues: [],
      surfaces: []
    });
  }

  function queueLabels(cockpit) {
    return new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
  }

  function renderTable(dv, labels, id, headers, rows, empty) {
    dv.header(3, labels.get(id) ?? id);
    if (!rows.length) {
      dv.paragraph(empty);
      return;
    }
    dv.table(headers, rows);
  }

  function noSession(dv) {
    const candidates = sessionCandidates(dv).limit(4).array();
    if (!candidates.length) {
      renderEmptyState(dv, {
        title: "Nessuna sessione attiva",
        action: "Prepara o attiva una sessione prima di collegare cue.",
        link: "Risorse/Preparazione Sessione.md",
        button: "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"
      });
      return;
    }
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = candidates.map(page => cardHtml({
      title: pageTitle(page),
      meta: page.stato ?? "sessione",
      body: "Imposta attiva: true quando questa sessione arriva al tavolo.",
      link: page.file?.path ?? "",
      cls: "gdr-info-card compact gdr-kind-missing"
    })).join("");
  }

  function renderMediaSceneNow(dv) {
    const data = mediaSceneData(dv);
    if (!data.session) {
      noSession(dv);
      return;
    }

    const gap = data.gaps[0];
    const cue = data.linked[0] ?? data.ready[0] ?? data.archive[0];
    const cards = [
      cardHtml({
        title: gap ? "Cue adesso: correggi" : cue ? "Cue adesso" : "Cue adesso: nessuno",
        meta: gap ? pageTitle(gap.page) : cue ? pageTitle(cue) : "sessione senza cue",
        body: gap ? `${gap.problem}: ${gap.action}` : cue ? fieldText(cue.scena ?? cue.uso ?? cue.uso_al_tavolo) || "Aprilo solo quando la scena lo richiede." : "Aggiungi un cue solo se sostiene una scena reale.",
        importa: "Un media e pronto solo se sai quando aprirlo.",
        link: gap?.page?.file?.path ?? cue?.file?.path ?? data.session.file?.path,
        cls: `gdr-info-card compact ${gap ? "gdr-kind-missing" : cue ? "gdr-kind-ready" : ""}`
      }),
      cardHtml({
        title: "Sessione",
        meta: [data.mode, data.session.stato, data.session.data].filter(Boolean).join(" · "),
        body: fieldText(data.session.scena_corrente ?? data.session.apertura ?? data.session.obiettivo) || "Scena corrente non compilata.",
        importa: `${data.linked.length} cue collegati`,
        link: data.session.file?.path ?? "",
        cls: `gdr-info-card compact ${data.linked.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Timestamp",
        meta: `${data.timed.length} cue`,
        body: data.timed[0] ? pageTitle(data.timed[0]) : "Nessun punto di ingresso pronto.",
        importa: "Audio e video devono aprirsi nel punto giusto, non all'inizio per caso.",
        link: data.timed[0]?.file?.path ?? "Risorse/Materiali Al Tavolo.md",
        cls: `gdr-info-card compact ${data.timed.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Archivio pronto",
        meta: `${data.ready.length} cue`,
        body: data.ready[0] ? pageTitle(data.ready[0]) : "Nessun cue archivio e pronto.",
        importa: "L'archivio serve solo se produce materiale apribile in scena.",
        link: data.ready[0]?.file?.path ?? "Risorse/Materiali Al Tavolo.md",
        cls: `gdr-info-card compact ${data.ready.length ? "gdr-kind-ready" : ""}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-media-scene-now" });
    grid.innerHTML = cards.join("");
  }

  function renderMediaSceneReadiness(dv) {
    const data = mediaSceneData(dv);
    const stats = [
      ["Sessione", data.session ? 1 : 0, data.session ? pageTitle(data.session) : "nessuna attiva"],
      ["Cue collegati", data.linked.length, "audio, video o immagini sulla sessione"],
      ["Pronti", data.ready.length, "con scena e stato utilizzabile"],
      ["Timestamp", data.timed.length, "con punto di ingresso"],
      ["Buchi", data.gaps.length, "campi che bloccano uso al tavolo"],
      ["Archivio", data.archive.length, "media disponibili fuori sessione"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-media-scene-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function renderMediaSceneSessionCues(dv) {
    const cockpit = await readMediaSceneCockpit();
    const labels = queueLabels(cockpit);
    const data = mediaSceneData(dv);

    renderTable(
      dv,
      labels,
      "session_cues",
      ["Media", "Uso", "Scena", "Timestamp", "Stato"],
      data.linked.slice(0, 18).map(page => [
        pageLink(page),
        fieldText(page.uso ?? page.uso_al_tavolo) || mediaType(page),
        fieldText(page.scena ?? page.campagna) || "",
        page.timestamp ?? "",
        page.stato ?? ""
      ]),
      data.session ? "Sessione attiva senza cue collegati. Va bene: aggiungili solo se servono davvero al tavolo." : "Nessuna sessione attiva."
    );
  }

  async function renderMediaSceneCueQueues(dv) {
    const cockpit = await readMediaSceneCockpit();
    const labels = queueLabels(cockpit);
    const data = mediaSceneData(dv);

    renderTable(
      dv,
      labels,
      "ready_cues",
      ["Media", "Tipo", "Campagna", "Scena", "Timestamp"],
      data.archive.slice(0, 24).map(page => [
        pageLink(page),
        mediaType(page),
        fieldText(page.campagna ?? page.sessioni ?? page.sessione) || "",
        fieldText(page.scena ?? page.uso ?? page.uso_al_tavolo) || "",
        page.timestamp ?? ""
      ]),
      "Nessun cue in archivio."
    );
    renderTable(
      dv,
      labels,
      "cue_gaps",
      ["Media", "Problema", "Azione"],
      data.gaps.slice(0, 24).map(row => [
        pageLink(row.page),
        row.problem,
        row.action
      ]),
      "Nessun buco cue evidente."
    );

    dv.header(3, "Sintassi cue");
    dv.table(
      ["Pattern", "Esempio", "Quando"],
      (cockpit.patterns ?? []).map(pattern => [
        pattern.label,
        pattern.example,
        pattern.use_when
      ])
    );
  }

  async function renderMediaSceneSurfaceLinks(dv) {
    const cockpit = await readMediaSceneCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici media non configurate",
        action: "Rigenera il contratto Media Scene dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-media-scene-surfaces" });
    grid.innerHTML = surfaces.map(surface => {
      const status = pluginStatus(surface.plugin);
      const state = status.ok === true
        ? "attiva"
        : surface.generated_release
          ? "generata in release"
          : "fallback Markdown";
      return cardHtml({
        title: surface.label,
        meta: `${surface.role} - ${state}`,
        body: surface.action,
        importa: surface.why,
        link: surface.target,
        badge: surface.badge,
        cls: `gdr-info-card compact ${status.ok === false ? "gdr-kind-missing" : "gdr-kind-ready"}`
      });
    }).join("");
  }

  return {
    renderMediaSceneCueQueues,
    renderMediaSceneNow,
    renderMediaSceneReadiness,
    renderMediaSceneSessionCues,
    renderMediaSceneSurfaceLinks
  };
})
