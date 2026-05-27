(ctx => {
  const {
    cardHtml,
    escapeHtml,
    fieldText,
    hasLinks,
    hasPrivateFields,
    hasText,
    isReal,
    pageTitle,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState
  } = ctx;

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

  function asLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function sortedByMtime(rows) {
    return [...rows].sort((left, right) => ((right.page ?? right).file?.mtime ?? 0) - ((left.page ?? left).file?.mtime ?? 0));
  }

  function pathStarts(page, prefix) {
    return String(page?.file?.path ?? "").startsWith(prefix);
  }

  function addGap(rows, source, problem, predicate, action, severity = 1) {
    for (const page of source.filter(predicate)) {
      rows.push({ page, problem, action, severity });
    }
  }

  function qualityData(dv) {
    const worlds = pages(dv, '"Mondi"', page => page.categoria === "mondo");
    const places = pages(dv, '"Mondi/Luoghi"');
    const png = pages(dv, '"Mondi/Personaggi"', page => page.tipo === "png" || page.categoria === "png");
    const missions = pages(dv, '"Mondi/Missioni"');
    const sessions = pages(dv, '"Mondi/Sessioni"');
    const maps = pages(dv, '"Risorse/Mappe"', page => page.file?.name !== "Mappe");
    const publicRows = pages(dv, '"Mondi" OR "Risorse/Mappe"', page => page.pubblico === true);
    const pressures = pages(dv, '"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Conflitti"', page => pressure(page) > 0);
    const generatedDrafts = pages(dv, '"Inbox/Generati"', page => pathStarts(page, "Inbox/Generati/") && page.plugin === "fantasy-content-generator" && page.stato === "bozza");

    const operationalGaps = [];
    addGap(
      operationalGaps,
      png,
      "PNG senza scena, luogo o ruolo",
      page => !hasText(page.luogo) && !hasLinks(page.luoghi) && !hasText(page.ruolo),
      "Collega luogo, scena o funzione al tavolo.",
      4
    );
    addGap(
      operationalGaps,
      places,
      "Luogo senza mappa o parent",
      page => !hasLinks(page.mappe) && !hasText(page.luogo_padre) && String(page.tipo ?? "") !== "continente",
      "Collega mappa, luogo padre o ruolo geografico.",
      3
    );
    addGap(
      operationalGaps,
      missions,
      "Missione senza conseguenze",
      page => !hasLinks(page.conseguenze) && !hasText(page.prossima_mossa),
      "Scrivi cosa cambia se il party agisce o ignora.",
      5
    );
    addGap(
      operationalGaps,
      sessions,
      "Sessione senza obiettivo",
      page => !hasText(page.obiettivo),
      "Scrivi cosa deve ottenere, scoprire o decidere il party.",
      5
    );
    addGap(
      operationalGaps,
      maps,
      "Mappa non collegata",
      page => !hasLinks(page.luoghi) && !hasText(page.luogo) && !hasText(page.mondo),
      "Collega luogo, mondo o uso al tavolo.",
      3
    );
    addGap(
      operationalGaps,
      pages(dv, '"Mondi/Fazioni"'),
      "Fazione senza pressione",
      page => !hasText(page.prossima_mossa) && pressure(page) === 0,
      "Definisci prossima mossa o pressione.",
      4
    );

    const publicRisks = publicRows
      .filter(page => hasPrivateFields(page))
      .map(page => ({ page, problem: "pubblico: true con campi segreti/prossima mossa/pressioni", action: "Rimuovi il flag pubblico o compila una versione player-safe." }));
    const publicMissingText = publicRows
      .filter(page => !hasPrivateFields(page) && !hasText(page.player_safe) && !hasText(page.recap_pubblico) && page.categoria !== "sessione")
      .map(page => ({ page, problem: "pubblico senza testo player-safe", action: "Scrivi cosa puo vedere il party." }));
    const showcaseReady = sortedByMtime([
      ...maps
        .filter(page => page.pubblico === true || page.stato === "pronto")
        .map(page => ({ page, kind: "Mappa", use: fieldText(page.uso ?? page.luogo ?? page.luoghi) || "asset visivo" })),
      ...pages(dv, '"Mondi/Dispense"', page => page.pubblico === true || ["pronto", "consegnato"].includes(String(page.stato ?? "")))
        .map(page => ({ page, kind: "Dispensa", use: fieldText(page.uso_al_tavolo ?? page.scena ?? page.luogo) || "handout" })),
      ...pages(dv, '"Campagne"', page => ["attiva", "pronto", "in corso"].includes(String(page.stato ?? "")))
        .map(page => ({ page, kind: "Campagna", use: fieldText(page.promessa ?? page.profilo ?? page.mondo) || "cornice di gioco" }))
    ].map(row => row.page ? row : null).filter(Boolean));

    const operational = operationalGaps
      .sort((left, right) => right.severity - left.severity || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
    const priority = publicRisks[0]
      ? { title: "Qualita prima: sicurezza pubblica", row: publicRisks[0], link: publicRisks[0].page?.file?.path, cls: "gdr-kind-missing" }
      : operational[0]
        ? { title: "Qualita prima: buco operativo", row: operational[0], link: operational[0].page?.file?.path, cls: "gdr-kind-missing" }
        : generatedDrafts[0]
          ? { title: "Qualita prima: bozza generata", row: { page: generatedDrafts[0], problem: "bozza da smistare", action: "Decidi se diventa canone, gioco o archivio." }, link: generatedDrafts[0].file?.path, cls: "gdr-kind-missing" }
          : { title: "Qualita prima: stabile", row: null, link: "Hub/1. DM Dashboard.md", cls: "gdr-kind-ready" };

    return {
      coverage: [
        ["Mondi", worlds.length, "ambientazioni"],
        ["Luoghi", places.length, "geografia giocabile"],
        ["PNG", png.length, "personaggi non giocanti"],
        ["Missioni", missions.length, "obiettivi e archi"],
        ["Sessioni", sessions.length, "preparazione e diario"],
        ["Mappe", maps.length, "asset e atlanti"],
        ["Pubblico", publicRows.length, "condivisibile"],
        ["Pressioni", pressures.length, "mondo vivo"]
      ],
      generatedDrafts,
      operational,
      priority,
      publicMissingText,
      publicRisks,
      publicRows,
      showcaseReady
    };
  }

  function renderQualityReportNow(dv) {
    const data = qualityData(dv);
    const priority = data.priority;
    const cards = [
      cardHtml({
        title: priority.title,
        meta: priority.row?.page ? pageTitle(priority.row.page) : "quadro generale",
        body: priority.row?.problem ?? "Nessun blocco evidente nel report.",
        importa: priority.row?.action ?? "Apri DM Dashboard o continua con il prossimo sviluppo.",
        link: priority.link,
        cls: `gdr-info-card compact ${priority.cls}`
      }),
      cardHtml({
        title: "Copertura",
        meta: `${data.coverage.find(row => row[0] === "Mondi")?.[1] ?? 0} mondi - ${data.coverage.find(row => row[0] === "Sessioni")?.[1] ?? 0} sessioni`,
        body: `${data.coverage.find(row => row[0] === "Missioni")?.[1] ?? 0} missioni - ${data.coverage.find(row => row[0] === "Pressioni")?.[1] ?? 0} pressioni`,
        importa: "Misura se il vault contiene materiale giocabile, non solo testo.",
        link: "Risorse/Controllo Vault.md",
        cls: "gdr-info-card compact gdr-kind-ready"
      }),
      cardHtml({
        title: "Buchi operativi",
        meta: `${data.operational.length} problemi`,
        body: data.operational[0]?.problem ?? "Nessun buco operativo evidente.",
        importa: data.operational[0]?.action ?? "Le note principali hanno agganci sufficienti.",
        link: data.operational[0]?.page?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: `gdr-info-card compact ${data.operational.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Pubblicazione",
        meta: `${data.publicRisks.length} rischi - ${data.publicMissingText.length} testi mancanti`,
        body: data.publicRisks[0]?.problem ?? data.publicMissingText[0]?.problem ?? "Materiale pubblico pulito.",
        importa: data.publicRisks[0]?.action ?? data.publicMissingText[0]?.action ?? "Puoi usare Vista Giocatori senza esporre segreti.",
        link: data.publicRisks[0]?.page?.file?.path ?? data.publicMissingText[0]?.page?.file?.path ?? "Hub/Vista Giocatori.md",
        cls: `gdr-info-card compact ${data.publicRisks.length || data.publicMissingText.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Screenshot-ready",
        meta: `${data.showcaseReady.length} superfici o materiali`,
        body: data.showcaseReady[0] ? pageTitle(data.showcaseReady[0].page) : "Nessun materiale pronto da mostrare.",
        importa: data.showcaseReady[0]?.use ?? "Prepara almeno una mappa pubblica, dispensa o campagna leggibile.",
        link: data.showcaseReady[0]?.page?.file?.path ?? "Hub/Atlante del Mondo.md",
        cls: `gdr-info-card compact ${data.showcaseReady.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-quality-report-now" });
    grid.innerHTML = cards.join("");
  }

  function renderQualityReportCoverage(dv) {
    const data = qualityData(dv);
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-quality-report-coverage" });
    grid.innerHTML = data.coverage.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readQualityReportCockpit() {
    return readJsonRel("z.automazioni/data/runtime/quality_report_cockpit.json", {
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

  async function renderQualityReportOperationalGaps(dv) {
    const cockpit = await readQualityReportCockpit();
    const labels = queueLabels(cockpit);
    const data = qualityData(dv);
    renderTable(
      dv,
      labels,
      "operational_gaps",
      ["Nota", "Problema", "Stato", "Azione"],
      data.operational.slice(0, 40).map(row => [asLink(row.page), row.problem, row.page?.stato ?? "", row.action]),
      "Nessun buco operativo evidente."
    );
  }

  async function renderQualityReportPublicSafety(dv) {
    const cockpit = await readQualityReportCockpit();
    const labels = queueLabels(cockpit);
    const data = qualityData(dv);
    renderTable(
      dv,
      labels,
      "public_risks",
      ["Nota", "Rischio", "Azione"],
      data.publicRisks.map(row => [asLink(row.page), row.problem, row.action]),
      "Nessuna nota pubblica contiene campi DM evidenti."
    );
    renderTable(
      dv,
      labels,
      "public_missing_text",
      ["Nota", "Problema", "Azione"],
      data.publicMissingText.map(row => [asLink(row.page), row.problem, row.action]),
      "Le note pubbliche hanno testo mostrabile o recap."
    );
  }

  async function renderQualityReportShowcase(dv) {
    const cockpit = await readQualityReportCockpit();
    const labels = queueLabels(cockpit);
    const data = qualityData(dv);
    renderTable(
      dv,
      labels,
      "screenshot_ready",
      ["Materiale", "Tipo", "Uso", "Pubblico", "Stato"],
      data.showcaseReady.slice(0, 30).map(row => [asLink(row.page), row.kind, row.use, row.page.pubblico === true ? "si" : "no", row.page.stato ?? ""]),
      "Nessun materiale screenshot-ready trovato."
    );
  }

  async function renderQualityReportSurfaceLinks(dv) {
    const cockpit = await readQualityReportCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici quality report non configurate",
        action: "Rigenera il contratto Quality Report dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-quality-report-surfaces" });
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
    renderQualityReportCoverage,
    renderQualityReportNow,
    renderQualityReportOperationalGaps,
    renderQualityReportPublicSafety,
    renderQualityReportShowcase,
    renderQualityReportSurfaceLinks
  };
})
