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

  function listValue(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && value.path) return [value];
    return hasText(value) ? [value] : [];
  }

  function valuePresent(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    if (typeof value === "boolean") return value === true;
    return hasText(value);
  }

  function basename(value) {
    const parts = String(value ?? "").replace(/\\/g, "/").replace(/\.md$/, "").split("/");
    return parts[parts.length - 1] ?? "";
  }

  function normalizedRef(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function referenceTokens(value) {
    const raw = value?.path ? value.path : String(value ?? "").trim();
    if (!raw) return [];

    const wikilink = raw.match(/^\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]$/);
    const target = (wikilink ? wikilink[1] : raw)
      .replace(/\\/g, "/")
      .replace(/\.md$/, "")
      .trim();
    if (!target) return [];
    return [target, basename(target)].map(normalizedRef).filter(Boolean);
  }

  function pageReferenceTokens(page) {
    return new Set([
      page?.file?.path,
      page?.file?.name,
      page?.nome,
      page?.id
    ].flatMap(referenceTokens));
  }

  function fieldReferencesPage(value, pageTokens) {
    return listValue(value).flatMap(referenceTokens).some(token => pageTokens.has(token));
  }

  function contractStrings(value, fallback = []) {
    return Array.isArray(value)
      ? value.map(item => String(item)).filter(Boolean)
      : fallback;
  }

  function regionContractPayload(cockpit) {
    const contract = cockpit?.region_playability_contract ?? null;
    return contract?.region_playability?.minimum_viable_region ? contract : null;
  }

  function regionMinimums(contract) {
    return contract?.region_playability?.minimum_viable_region ?? {};
  }

  function regionTypeCandidate(page, contract) {
    const candidate = contract?.validation_model?.region_candidates ?? {};
    const pathPrefix = String(candidate.path_prefix ?? "Mondi/Luoghi/");
    const category = String(candidate.categoria ?? "luogo");
    const typeFields = contractStrings(candidate.type_fields, ["tipo"]);
    const typeValues = new Set(contractStrings(candidate.type_values, ["regione"]).map(normalizedRef));

    if (!String(page?.file?.path ?? "").startsWith(pathPrefix)) return false;
    if (String(page?.categoria ?? "") !== category) return false;
    return typeFields.some(field => listValue(page?.[field]).some(value => {
      const normalized = normalizedRef(value);
      return typeValues.has(normalized) || normalized.split(/\s+/).some(part => typeValues.has(part));
    }));
  }

  function regionCandidate(page, contract) {
    const candidate = contract?.validation_model?.region_candidates ?? {};
    const states = new Set(contractStrings(candidate.validated_states, ["pronto"]));

    if (!regionTypeCandidate(page, contract)) return false;
    return states.has(String(page?.stato ?? ""));
  }

  function relatedRegionPages(allPages, region, contract) {
    const folders = contractStrings(contract?.validation_model?.source_folders, []);
    const fields = contractStrings(contract?.validation_model?.linkage_fields, []);
    const regionTokens = pageReferenceTokens(region);
    return allPages.filter(page => {
      const pagePath = String(page?.file?.path ?? "");
      if (pagePath === String(region?.file?.path ?? "")) return false;
      if (!folders.some(folder => pagePath.startsWith(`${String(folder).replace(/\/$/, "")}/`))) return false;
      return fields.some(field => fieldReferencesPage(page?.[field], regionTokens));
    });
  }

  function hasAcceptedField(page, fields) {
    return fields.some(field => valuePresent(page?.[field]));
  }

  function regionCounts(region, related, contract) {
    const minimums = regionMinimums(contract);
    const scoped = [region, ...related];
    return {
      luoghi: related.filter(page => String(page?.file?.path ?? "").startsWith("Mondi/Luoghi/") && page.categoria === "luogo").length,
      fazioni: related.filter(page => String(page?.file?.path ?? "").startsWith("Mondi/Fazioni/") && page.categoria === "fazione").length,
      conflitti: related.filter(page => String(page?.file?.path ?? "").startsWith("Mondi/Conflitti/") && page.categoria === "conflitto").length,
      missioni: related.filter(page => String(page?.file?.path ?? "").startsWith("Mondi/Missioni/") && page.categoria === "missione").length,
      pressioni: scoped.filter(page => String(page?.file?.path ?? "").startsWith("Mondi/Tracciati/") || hasAcceptedField(page, contractStrings(minimums.pressioni?.accepted_fields, []))).length,
      uscita_verso_sessione: scoped.filter(page => String(page?.file?.path ?? "").startsWith("Mondi/Sessioni/") || hasAcceptedField(page, contractStrings(minimums.uscita_verso_sessione?.accepted_fields, []))).length,
      superficie_player_safe: scoped.filter(page => hasAcceptedField(page, contractStrings(minimums.superficie_player_safe?.accepted_fields, []))).length
    };
  }

  function regionPlayabilityGaps(collections, cockpit) {
    const contract = regionContractPayload(cockpit);
    if (!contract) return [];
    if (contract?.validation_model?.pass_when_all_minimums_are_met !== true) return [];

    const allPages = [
      ...collections.places,
      ...collections.factions,
      ...collections.conflicts,
      ...collections.missions,
      ...collections.tracks,
      ...collections.sessions
    ];
    const minimums = regionMinimums(contract);

    return collections.places
      .filter(page => regionCandidate(page, contract))
      .map(region => {
        const related = relatedRegionPages(allPages, region, contract);
        const counts = regionCounts(region, related, contract);
        const missing = Object.entries(minimums)
          .filter(([, requirement]) => requirement?.required === true)
          .map(([id, requirement]) => ({ id, count: counts[id] ?? 0, min: Number(requirement.min_count ?? 1) }))
          .filter(item => item.count < item.min);

        if (!missing.length) return null;
        const missingText = missing.map(item => `${item.id} ${item.count}/${item.min}`).join(", ");
        const missingNames = missing.map(item => item.id.replace(/_/g, " ")).join(", ");
        return {
          page: region,
          problem: `Regione Giocabile incompleta: ${missingText}`,
          action: `Completa ${missingNames} prima di usarla come base di campagna o sessione.`,
          severity: 6
        };
      })
      .filter(Boolean);
  }

  function regionToSessionContractPayload(cockpit) {
    const contract = cockpit?.region_to_session_contract ?? null;
    return contract?.region_to_session?.minimum_session_exit ? contract : null;
  }

  function regionToSessionMinimums(contract) {
    return contract?.region_to_session?.minimum_session_exit ?? {};
  }

  function regionToSessionTrigger(page, contract) {
    return (contract?.validation_model?.trigger_entities ?? []).some(trigger => {
        const pathPrefix = String(trigger?.path_prefix ?? "");
        const category = String(trigger?.categoria ?? "");
        const states = new Set(contractStrings(trigger?.active_states, []));
        return String(page?.file?.path ?? "").startsWith(pathPrefix)
          && String(page?.categoria ?? "") === category
          && states.has(String(page?.stato ?? ""));
      });
  }

  function pageHasAnyField(page, fields) {
    return fields.some(field => valuePresent(page?.[field]));
  }

  function pageInFolders(page, folders) {
    const path = String(page?.file?.path ?? "");
    return folders.some(folder => path.startsWith(`${String(folder).replace(/\/$/, "")}/`));
  }

  function referencedRegionsForTrigger(regions, trigger, contract) {
    const fields = contractStrings(contract?.validation_model?.region_link_fields, []);
    return regions.filter(region => {
      const tokens = pageReferenceTokens(region);
      return fields.some(field => fieldReferencesPage(trigger?.[field], tokens));
    });
  }

  function relatedRegionToSessionPages(allPages, region, contract) {
    const folders = contractStrings(contract?.validation_model?.source_folders, []);
    const fields = contractStrings(contract?.validation_model?.region_scope_linkage_fields, []);
    const regionTokens = pageReferenceTokens(region);
    return allPages.filter(page => {
      const pagePath = String(page?.file?.path ?? "");
      if (pagePath === String(region?.file?.path ?? "")) return false;
      if (!folders.some(folder => pagePath.startsWith(`${String(folder).replace(/\/$/, "")}/`))) return false;
      return fields.some(field => fieldReferencesPage(page?.[field], regionTokens));
    });
  }

  function uniquePagesByPath(rows) {
    const seen = new Set();
    return rows.filter(page => {
      const key = String(page?.file?.path ?? "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function countPagesInFolders(rows, folders, predicate = () => true) {
    return rows.filter(page => pageInFolders(page, folders) && predicate(page)).length;
  }

  function regionIsPlayable(region, allPages, regionContract) {
    if (!regionCandidate(region, regionContract)) return false;
    const related = relatedRegionPages(allPages, region, regionContract);
    const counts = regionCounts(region, related, regionContract);
    return !Object.entries(regionMinimums(regionContract))
      .filter(([, requirement]) => requirement?.required === true)
      .map(([id, requirement]) => ({ id, count: counts[id] ?? 0, min: Number(requirement.min_count ?? 1) }))
      .some(item => item.count < item.min);
  }

  function regionToSessionCounts(trigger, region, allPages, regionContract, contract) {
    const related = relatedRegionToSessionPages(allPages, region, contract);
    const scoped = uniquePagesByPath([trigger, region, ...related]);
    const minimums = regionToSessionMinimums(contract);
    const activeFactionStates = new Set(contractStrings(minimums.fazione_attiva?.active_states, []));

    return {
      regione_giocabile: regionIsPlayable(region, allPages, regionContract) ? 1 : 0,
      missione_selezionabile: Math.max(
        countPagesInFolders(related, contractStrings(minimums.missione_selezionabile?.source_folders, []), page => page.categoria === "missione"),
        scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.missione_selezionabile?.accepted_fields, []))).length
      ),
      apertura_sessione: scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.apertura_sessione?.accepted_fields, []))).length,
      luogo_iniziale: Math.max(
        countPagesInFolders(related, ["Mondi/Luoghi"], page => page.file?.path !== region.file?.path && page.categoria === "luogo"),
        scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.luogo_iniziale?.accepted_fields, []))).length
      ),
      fazione_attiva: Math.max(
        countPagesInFolders(related, contractStrings(minimums.fazione_attiva?.source_folders, []), page => page.categoria === "fazione" && activeFactionStates.has(String(page.stato ?? ""))),
        scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.fazione_attiva?.accepted_fields, []))).length
      ),
      pressione_attiva: scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.pressione_attiva?.accepted_fields, []))).length,
      scelta_pg: scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.scelta_pg?.accepted_fields, []))).length,
      materiale_player_safe: scoped.filter(page => pageHasAnyField(page, contractStrings(minimums.materiale_player_safe?.accepted_fields, []))).length
    };
  }

  function regionToSessionGaps(collections, cockpit) {
    const regionContract = regionContractPayload(cockpit);
    const contract = regionToSessionContractPayload(cockpit);
    if (!regionContract || !contract) return [];
    if (contract?.validation_model?.pass_when_all_minimums_are_met !== true) return [];

    const allPages = [
      ...collections.places,
      ...collections.factions,
      ...collections.conflicts,
      ...collections.missions,
      ...collections.tracks,
      ...collections.sessions
    ];
    const regions = collections.places.filter(page => regionTypeCandidate(page, regionContract));
    const triggers = [...collections.campaigns, ...collections.sessions]
      .filter(page => regionToSessionTrigger(page, contract))
      .filter(page => contractStrings(contract?.validation_model?.region_link_fields, []).some(field => valuePresent(page?.[field])));
    const minimums = regionToSessionMinimums(contract);

    return triggers.flatMap(trigger => {
      const referenced = referencedRegionsForTrigger(regions, trigger, contract);
      if (!referenced.length) {
        return [{
          page: trigger,
          problem: "Region to Session incompleto: regione_giocabile 0/1",
          action: "Collega una Regione Giocabile valida prima di preparare la sessione.",
          severity: 7
        }];
      }

      return referenced.map(region => {
        const counts = regionToSessionCounts(trigger, region, allPages, regionContract, contract);
        const missing = Object.entries(minimums)
          .filter(([, requirement]) => requirement?.required === true)
          .map(([id, requirement]) => ({ id, count: counts[id] ?? 0, min: Number(requirement.min_count ?? 1) }))
          .filter(item => item.count < item.min);

        if (!missing.length) return null;
        const missingText = missing.map(item => `${item.id} ${item.count}/${item.min}`).join(", ");
        const missingNames = missing.map(item => item.id.replace(/_/g, " ")).join(", ");
        return {
          page: trigger,
          problem: `Region to Session incompleto: ${missingText}`,
          action: `Completa ${missingNames} nella regione o nella sessione collegata.`,
          severity: 7
        };
      }).filter(Boolean);
    });
  }

  function qualityData(dv, cockpit = null) {
    const worlds = pages(dv, '"Mondi"', page => page.categoria === "mondo");
    const places = pages(dv, '"Mondi/Luoghi"');
    const png = pages(dv, '"Mondi/Personaggi"', page => page.tipo === "png" || page.categoria === "png");
    const factions = pages(dv, '"Mondi/Fazioni"');
    const conflicts = pages(dv, '"Mondi/Conflitti"');
    const missions = pages(dv, '"Mondi/Missioni"');
    const tracks = pages(dv, '"Mondi/Tracciati"');
    const sessions = pages(dv, '"Mondi/Sessioni"');
    const campaigns = pages(dv, '"Campagne"');
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
      factions,
      "Fazione senza pressione",
      page => !hasText(page.prossima_mossa) && pressure(page) === 0,
      "Definisci prossima mossa o pressione.",
      4
    );
    operationalGaps.push(...regionPlayabilityGaps({ places, factions, conflicts, missions, tracks, sessions }, cockpit));
    operationalGaps.push(...regionToSessionGaps({ campaigns, places, factions, conflicts, missions, tracks, sessions }, cockpit));

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

  async function renderQualityReportNow(dv) {
    const cockpit = await readQualityReportCockpit();
    const data = qualityData(dv, cockpit);
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
    const data = qualityData(dv, cockpit);
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
      "Nessun materiale pronto da condividere trovato."
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
