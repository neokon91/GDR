(ctx => {
  const {
    asArray,
    cardHtml,
    escapeHtml,
    fieldText,
    hasText,
    isReal,
    pageTitle,
    pluginStatus,
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

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function" ? data.array() : asArray(value);
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function pathStarts(page, prefix) {
    return String(page?.file?.path ?? "").startsWith(prefix);
  }

  function sourceText(page) {
    const values = [
      page?.fonte,
      page?.origine,
      page?.generatore,
      page?.plugin,
      page?.tipo,
      page?.sottotipo,
      page?.source
    ];
    return values.flatMap(value => asArray(value)).map(value => String(value ?? "").toLowerCase()).join(" ");
  }

  function importedSourceKey(page) {
    const text = sourceText(page);
    if (text.includes("watabou-dungeon")) return "watabou-dungeon";
    if (text.includes("watabou-city")) return "watabou-city";
    if (text.includes("azgaar")) return "azgaar";
    return "";
  }

  function importedPage(page) {
    return Boolean(importedSourceKey(page));
  }

  function sourceLabel(page) {
    const key = importedSourceKey(page);
    if (key === "watabou-dungeon") return "Watabou Dungeon";
    if (key === "watabou-city") return "Watabou City";
    if (key === "azgaar") return "Azgaar";
    return fieldText(page?.fonte ?? page?.source) || "import";
  }

  function pages(dv, source, predicate = () => true) {
    return dv.pages(source)
      .where(page => realPage(page) && predicate(page))
      .array();
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

  function hasOperationalAnchor(dv, page) {
    return hasValue(dv, page?.mondo)
      || hasValue(dv, page?.luogo)
      || hasValue(dv, page?.luoghi)
      || hasValue(dv, page?.coordinates)
      || hasValue(dv, page?.mappa)
      || hasValue(dv, page?.mappe)
      || hasValue(dv, page?.sessioni)
      || hasValue(dv, page?.sessione);
  }

  function importIssues(dv, page) {
    const issues = [];
    const add = (problem, action, priority) => issues.push({ page, problem, action, priority });
    const isDraft = pathStarts(page, "Inbox/Generati/");
    const isMap = pathStarts(page, "Risorse/Mappe/");
    const isLocation = pathStarts(page, "Mondi/Luoghi/");

    if (isDraft && !hasOperationalAnchor(dv, page)) {
      add("bozza senza aggancio", "Collega mondo, luogo, sessione o mappa prima di smistare.", 5);
    }
    if ((isLocation || isMap) && !hasValue(dv, page.mondo)) {
      add("mondo mancante", "Collega il mondo prima di usare l'import in Atlante o in sessione.", 4);
    }
    if (isMap && !hasValue(dv, page.luogo) && !hasValue(dv, page.luoghi) && !hasValue(dv, page.coordinates)) {
      add("mappa senza luogo", "Collega luogo, luoghi o coordinate prima di considerarla pronta.", 4);
    }
    if (isMap && page.pubblico === true && !hasValue(dv, page.player_safe) && !hasValue(dv, page.versione_giocatori)) {
      add("player-safe assente", "Scrivi cosa puo vedere il party o collega una versione giocatori.", 3);
    }
    if (!isDraft && !hasValue(dv, page.uso_al_tavolo) && !hasValue(dv, page.prossima_mossa) && !hasValue(dv, page.gancio)) {
      add("uso al tavolo assente", "Scrivi quando aprirla e quale scelta, rotta o scena risolve.", 2);
    }

    return issues.sort((left, right) => right.priority - left.priority || left.problem.localeCompare(right.problem));
  }

  function importData(dv) {
    const drafts = pages(dv, '"Inbox/Generati"', page => pathStarts(page, "Inbox/Generati/") && importedPage(page))
      .sort((left, right) => String(right.file?.mtime ?? "").localeCompare(String(left.file?.mtime ?? "")));
    const locations = pages(dv, '"Mondi/Luoghi"', importedPage)
      .sort((left, right) => String(right.file?.mtime ?? "").localeCompare(String(left.file?.mtime ?? "")));
    const maps = pages(dv, '"Risorse/Mappe"', page => page.file?.name !== "Mappe" && importedPage(page))
      .sort((left, right) => String(right.file?.mtime ?? "").localeCompare(String(left.file?.mtime ?? "")));
    const all = uniquePages([...drafts, ...locations, ...maps]);
    const gaps = all.flatMap(page => importIssues(dv, page)).sort((left, right) => right.priority - left.priority || String(left.page.file?.name ?? "").localeCompare(String(right.page.file?.name ?? "")));
    const gapKeys = new Set(gaps.map(row => row.page?.file?.path));
    const ready = all.filter(page => !gapKeys.has(page.file?.path) || page.stato === "pronto" || page.stato_canonico === "canonico");

    return {
      all,
      drafts,
      gaps,
      locations,
      maps,
      ready
    };
  }

  async function readMapImportCockpit() {
    return readJsonRel("z.automazioni/data/runtime/map_import_cockpit.json", {
      sources: [],
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

  async function renderMapImportNow(dv) {
    const cockpit = await readMapImportCockpit();
    const data = importData(dv);
    const firstGap = data.gaps[0];
    const firstDraft = data.drafts[0];
    const firstMap = data.maps[0];
    const firstSource = cockpit.sources?.[0];
    const next = firstGap
      ? ["Import prima: correggi", pageTitle(firstGap.page), `${firstGap.problem}: ${firstGap.action}`, firstGap.page.file?.path, "gdr-kind-missing"]
      : firstDraft
        ? ["Import prima: smista", pageTitle(firstDraft), "Decidi destinazione e canonizza solo se confermata.", firstDraft.file?.path, "gdr-kind-ready"]
        : firstMap
          ? ["Import prima: controlla mappa", pageTitle(firstMap), fieldText(firstMap.uso_al_tavolo ?? firstMap.luogo ?? firstMap.coordinates) || "Verifica uso, luogo e versione giocatori.", firstMap.file?.path, "gdr-kind-ready"]
          : ["Import prima: dry-run", firstSource?.label ?? "Dispatch import mappe", firstSource?.dry_run_command ?? "Esegui un import con --dry-run prima di scrivere note.", "Risorse/Mappe/Mappe.md", "gdr-kind-ready"];
    const cards = [
      cardHtml({
        title: next[0],
        meta: next[1],
        body: next[2],
        importa: "La pagina deve decidere il prossimo gesto, non spiegare tutta la procedura.",
        link: next[3],
        cls: `gdr-info-card compact ${next[4]}`
      }),
      cardHtml({
        title: "Dry-run",
        meta: `${cockpit.sources?.length ?? 0} sorgenti`,
        body: firstSource?.dry_run_command ?? "Nessuna sorgente configurata.",
        importa: "Ogni import deve essere simulato prima di creare bozze.",
        cls: "gdr-info-card compact gdr-kind-ready"
      }),
      cardHtml({
        title: "Bozze importate",
        meta: `${data.drafts.length} aperte`,
        body: firstDraft ? pageTitle(firstDraft) : "Nessuna bozza importata in attesa.",
        importa: firstDraft ? "Passa da Smistamento bozze prima di renderla canone." : "La coda resta pulita.",
        link: firstDraft?.file?.path ?? "Risorse/Smistamento Bozze Generate.md",
        cls: `gdr-info-card compact ${data.drafts.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Mappe create",
        meta: `${data.maps.length} importate`,
        body: firstMap ? pageTitle(firstMap) : "Nessuna mappa importata da controllare.",
        importa: firstMap ? "Verifica uso, aggancio e versione giocatori." : "Importa solo quando una mappa serve il tavolo.",
        link: firstMap?.file?.path ?? "Risorse/Mappe/Mappe.md",
        cls: `gdr-info-card compact ${data.maps.length ? "gdr-kind-ready" : ""}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-map-import-now" });
    grid.innerHTML = cards.join("");
  }

  async function renderMapImportReadiness(dv) {
    const cockpit = await readMapImportCockpit();
    const data = importData(dv);
    const stats = [
      ["Sorgenti", cockpit.sources?.length ?? 0, "importatori dichiarati"],
      ["Dry-run", (cockpit.sources ?? []).filter(source => String(source.dry_run_command ?? "").includes("--dry-run")).length, "comandi simulabili"],
      ["Bozze", data.drafts.length, "in Inbox/Generati"],
      ["Mappe", data.maps.length, "in Risorse/Mappe"],
      ["Buchi", data.gaps.length, "agganci da correggere"],
      ["Pronte", data.ready.length, "output usabili o gia sistemati"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-map-import-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function renderMapImportSources(dv) {
    const cockpit = await readMapImportCockpit();
    const sources = cockpit.sources ?? [];
    if (!sources.length) {
      renderEmptyState(dv, {
        title: "Sorgenti import non configurate",
        action: "Rigenera il contratto Importare Mappe dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    dv.table(
      ["Sorgente", "Dry-run", "Import reale", "Destinazione"],
      sources.map(source => [
        source.label,
        source.dry_run_command,
        source.import_command,
        source.writes_to
      ])
    );
  }

  async function renderMapImportQueues(dv) {
    const cockpit = await readMapImportCockpit();
    const labels = queueLabels(cockpit);
    const data = importData(dv);

    renderTable(
      dv,
      labels,
      "imported_drafts",
      ["Bozza", "Fonte", "Aggancio", "Azione"],
      data.drafts.slice(0, 18).map(page => [
        pageLink(page),
        sourceLabel(page),
        fieldText(page.mondo ?? page.luogo ?? page.luoghi ?? page.coordinates) || "manca",
        hasOperationalAnchor(dv, page) ? "Smista e canonizza solo se confermata." : "Collega un contesto prima di smistare."
      ]),
      "Nessuna bozza importata da smistare."
    );
    renderTable(
      dv,
      labels,
      "imported_maps",
      ["Mappa", "Fonte", "Luogo/coordinate", "Stato"],
      data.maps.slice(0, 18).map(page => [
        pageLink(page),
        sourceLabel(page),
        fieldText(page.luogo ?? page.luoghi ?? page.coordinates) || "manca",
        page.stato ?? ""
      ]),
      "Nessuna mappa importata da controllare."
    );
    renderTable(
      dv,
      labels,
      "import_gaps",
      ["Nota", "Problema", "Azione"],
      data.gaps.slice(0, 24).map(row => [
        pageLink(row.page),
        row.problem,
        row.action
      ]),
      "Nessun buco import evidente."
    );
  }

  async function renderMapImportSurfaceLinks(dv) {
    const cockpit = await readMapImportCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici import non configurate",
        action: "Rigenera il contratto Importare Mappe dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-map-import-surfaces" });
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
    renderMapImportNow,
    renderMapImportQueues,
    renderMapImportReadiness,
    renderMapImportSources,
    renderMapImportSurfaceLinks
  };
})
