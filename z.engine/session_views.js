// Runtime DataviewJS stabile per i template operativi.
(async () => {
  const gdrCore = await eval(await app.vault.adapter.read("z.engine/gdr_views.js"));
  const escapeHtml = gdrCore.escapeHtml;
  const sessionCore = await eval(await app.vault.adapter.read("z.engine/session_core.js"));

  const asArray = value => Array.isArray(value) ? value : value ? [value] : [];
  const hasText = value => String(value ?? "").trim().length > 0;
  const hasLinks = value => asArray(value).length > 0;
  const linkKey = link => link?.path ?? String(link ?? "");
  const isReal = page => Boolean(page);
  const pageFromLink = (dv, link) => dv.page(link?.path ?? link);
  const pagesFromLinks = (dv, links) => dv.array(links ?? []).map(link => pageFromLink(dv, link)).where(Boolean);
  const activeSession = dv => sessionCore.activeSession(dv);
  const activeSessions = dv => sessionCore.activeSessions(dv);
  const sessionCandidates = dv => sessionCore.sessionCandidates(dv);
  const pressure = page => sessionCore.pressure(page);
  const hasPrivateFields = page => sessionCore.hasPrivateFields(page);
  const publicCandidate = (page, category) => sessionCore.publicCandidate(page, category);
  const internalLink = file => `<a class="internal-link" data-href="${escapeHtml(file.path)}" href="${escapeHtml(file.path)}">${escapeHtml(file.name)}</a>`;
  const pageTitle = page => page?.nome ?? page?.name ?? page?.file?.name ?? "";
  const fieldText = value => Array.isArray(value)
    ? value.map(item => item?.path ? item.path.split("/").pop().replace(/\.md$/, "") : String(item ?? "")).filter(Boolean).join(", ")
    : value?.path ? value.path.split("/").pop().replace(/\.md$/, "") : String(value ?? "");
  async function readJsonRel(path, fallback = null) {
    try {
      return JSON.parse(await app.vault.adapter.read(path));
    } catch (error) {
      return fallback;
    }
  }

  async function canReadRel(path) {
    try {
      await app.vault.adapter.read(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  const pluginProfile = await readJsonRel("z.automazioni/data/runtime/plugin_profile.json", {
    default_workflow_plugins: ["Dataview", "Meta Bind", "Templater", "Tasks", "Dice Roller", "Fantasy Statblocks"],
    default_manual_action: "Abilita il plugin dai plugin community e usa il fallback Markdown della pagina.",
    plugins_by_label: {},
    workflow_plugins: {}
  });
  const pluginByLabel = pluginProfile.plugins_by_label ?? {};
  const workflowPluginFallbacks = pluginProfile.workflow_plugins ?? {};
  const defaultWorkflowPlugins = asArray(pluginProfile.default_workflow_plugins).length
    ? asArray(pluginProfile.default_workflow_plugins)
    : ["Dataview", "Meta Bind", "Templater", "Tasks", "Dice Roller", "Fantasy Statblocks"];

  function pluginInfo(label) {
    return pluginByLabel[label] ?? {};
  }

  function pluginStatus(label) {
    const info = pluginInfo(label);
    const id = info.id;
    if (!id) return { id: "plugin non mappato", ok: null, info };

    const communityOk = app.plugins?.enabledPlugins?.has(id) === true;
    const internalPlugin = app.internalPlugins?.plugins?.[id] ?? app.internalPlugins?.getPluginById?.(id);
    const coreOk = internalPlugin?.enabled === true;
    const ok = info.source === "core" ? coreOk || communityOk : communityOk;
    return { id, ok, info };
  }

  function pluginSymptom(label) {
    return pluginInfo(label).symptom ?? "Controlla che il plugin sia installato, abilitato e aggiornato.";
  }

  function pluginManualAction(label) {
    return pluginInfo(label).manual_action
      ?? pluginProfile.default_manual_action
      ?? "Abilita il plugin dai plugin community e usa il fallback Markdown della pagina.";
  }

  function describeButtonTemplate(template) {
    const actions = asArray(template?.actions);
    if (!actions.length) return "Template Meta Bind senza azioni configurate.";
    return actions.map(action => {
      if (action.type === "templaterCreateNote") {
        return `crea nota da ${action.templateFile ?? "template non indicato"}${action.folderPath ? ` in ${action.folderPath}` : ""}`;
      }
      if (action.type === "runTemplaterFile") return `esegue ${action.templateFile ?? "file Templater non indicato"}`;
      if (action.type === "open") return `apre ${action.link ?? action.path ?? "destinazione non indicata"}`;
      return action.type ?? "azione Meta Bind";
    }).join("; ");
  }

  function cardHtml({ title, meta = "", body = "", link = "", cls = "gdr-info-card", stato = "", pressione = "", azione = "", importa = "", badge = "" }) {
    const linkedTitle = link
      ? `<a class="internal-link" data-href="${escapeHtml(link)}" href="${escapeHtml(link)}">${escapeHtml(title)}</a>`
      : escapeHtml(title);
    const statusLine = [stato, pressione !== "" ? `pressione ${pressione}` : ""].filter(Boolean).join(" · ");
    const actionText = azione || body;
    return `
      <div class="${cls}">
        ${badge ? `<div class="gdr-card-badge">${escapeHtml(badge)}</div>` : ""}
        <div class="gdr-card-title">${linkedTitle}</div>
        ${meta || statusLine ? `<div class="gdr-card-meta">${escapeHtml([meta, statusLine].filter(Boolean).join(" · "))}</div>` : ""}
        ${actionText ? `<div class="gdr-card-line"><strong>Azione:</strong> ${escapeHtml(actionText)}</div>` : ""}
        ${importa ? `<div class="gdr-card-line"><strong>Perche importa:</strong> ${escapeHtml(importa)}</div>` : ""}
      </div>
    `;
  }

  function cardKind(page, fallback = "operativa") {
    if (!page) return fallback;
    if (page.stato === "archiviata" || page.stato === "ignorata") return "archivio";
    if (page.pubblico === true) return "player";
    if (["lore capture", "evento storico"].includes(page.categoria) || hasLinks(page.entita_impattate) || hasLinks(page.propaga_a)) return "post";
    if (["missione", "tracciato", "fazione", "relazione", "conflitto"].includes(page.categoria)) return "operativa";
    return fallback;
  }

  function cardClass(page, base = "gdr-info-card compact", extra = "") {
    const kind = cardKind(page);
    const category = String(page?.categoria ?? page?.tipo ?? "nota")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const stateClass = page?.stato === "archiviata" ? "gdr-card-archive" : "gdr-card-operative";
    return [base, `gdr-card-${kind}`, `gdr-kind-${category}`, stateClass, extra].filter(Boolean).join(" ");
  }

  function commandHint(command) {
    const text = String(command ?? "").trim();
    if (!text) return "";
    if (/^BUTTON\[[^\]]+\]$/.test(text)) return "Usa il pulsante dedicato nella pagina.";
    if (/^(npm run|node |python3 |z\.)/.test(text)) return "Apri Controllo Vault e rigenera le sorgenti.";
    return text;
  }

  function emptyStateHtml({ title, action, link = "", button = "", cls = "gdr-info-card compact gdr-kind-missing gdr-empty-state" }) {
    const titleHtml = link
      ? `<a class="internal-link" data-href="${escapeHtml(link)}" href="${escapeHtml(link)}">${escapeHtml(title)}</a>`
      : escapeHtml(title);
    const command = commandHint(button);
    return `
      <div class="${cls}">
        <div class="gdr-card-badge">Azione richiesta</div>
        <div class="gdr-card-title">${titleHtml}</div>
        <div class="gdr-card-line"><strong>Prossimo passo:</strong> ${escapeHtml(action)}</div>
        ${command ? `<div class="gdr-card-line">${escapeHtml(command)}</div>` : ""}
      </div>
    `;
  }

  function renderEmptyState(dv, options) {
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = emptyStateHtml(options);
  }

  function renderCardGrid(dv, pages, mapper, empty) {
    const list = Array.isArray(pages) ? pages : pages?.array?.() ?? [];
    if (!list.length) {
      renderEmptyState(dv, empty);
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = list.map(mapper).join("");
  }

  function renderActions(dv) {
    const active = activeSession(dv);
    const prep = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.stato === "preparazione")
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();
    const inbox = dv.pages('"Inbox"')
      .where(p => isReal(p) && p.file.name !== "Inbox" && !["smistata", "archiviata", "ignorata"].includes(p.stato))
      .sort(p => p.file.mtime, "desc");
    const pressureItems = dv.pages('"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Conflitti"')
      .where(p => isReal(p) && p.stato !== "archiviata" && pressure(p) > 0)
      .sort(p => pressure(p), "desc")
      .limit(4);

    const actions = [];
    if (active) {
      actions.push({ title: "Gioca la sessione attiva", meta: active.file.name, body: "Apri il cockpit del tavolo.", link: "Hub/Durante il Gioco.md" });
    } else if (prep) {
      actions.push({ title: "Finisci la preparazione", meta: prep.file.name, body: "C'e una sessione in preparazione.", link: "Risorse/Preparazione Sessione.md" });
    } else {
      actions.push({ title: "Crea una sessione", meta: "Nessuna sessione attiva", body: "Parti da Preparazione Sessione.", link: "Risorse/Preparazione Sessione.md" });
    }

    if (inbox.length) {
      actions.push({ title: "Svuota Inbox", meta: `${inbox.length} appunti da decidere`, body: "Trasforma appunti in gioco o archiviali.", link: "Inbox/Inbox.md" });
    }

    pressureItems.forEach(p => actions.push({
      title: pageTitle(p),
      meta: p.categoria ?? "pressione",
      stato: p.stato ?? "",
      pressione: pressure(p),
      azione: p.prossima_mossa ?? "Serve una prossima mossa chiara.",
      importa: fieldText(p.gancio ?? p.posta ?? p.obiettivo ?? p.innesco) || "Questa pressione puo cambiare la prossima scena.",
      link: p.file.path
    }));

    const container = dv.el("div", "", { cls: "gdr-card-grid compact" });
    container.innerHTML = actions.slice(0, 6).map(cardHtml).join("");
  }

  function renderPartyControl(dv) {
    const party = dv.pages('"Mondi/Personaggi"')
      .where(p => isReal(p) && p.tipo === "pg" && p.stato !== "archiviata")
      .sort(p => p.giocatore ?? p.nome ?? p.file.name, "asc")
      .array();

    if (!party.length) {
      dv.paragraph("Nessun PG in gioco. Crea un PG da Personaggi o collega il party alla campagna.");
      return;
    }

    const cards = party.map(p => {
      const hp = `${p.hp_attuali ?? "?"}/${p.hp_massimi ?? "?"}`;
      const meta = [p.giocatore, p.classe, p.livello ? `livello ${p.livello}` : ""].filter(Boolean).join(" · ");
      const body = `HP ${hp}${p.hp_temporanei ? ` · temp ${p.hp_temporanei}` : ""}${p.condizioni ? ` · ${fieldText(p.condizioni)}` : ""}${p.spotlight ? ` · spotlight ${p.spotlight}` : ""}${p.ispirazione ? " · ispirazione" : ""}`;
      return cardHtml({ title: pageTitle(p), meta, body, link: p.file.path, cls: "gdr-info-card compact gdr-kind-party" });
    });

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.join("");
  }

  const sharedViewContext = {
    activeSession,
    activeSessions,
    asArray,
    cardClass,
    cardHtml,
    escapeHtml,
    fieldText,
    hasLinks,
    hasPrivateFields,
    hasText,
    isReal,
    linkKey,
    pageFromLink,
    pageTitle,
    pagesFromLinks,
    pluginStatus,
    pressure,
    publicCandidate,
    readJsonRel,
    renderCardGrid,
    renderEmptyState,
    sessionCandidates
  };
  async function loadRuntimeModule(file, context) {
    return (await eval(await app.vault.adapter.read(file)))(context);
  }

  async function loadRuntimeModules(specs, context) {
    const loaded = {};
    for (const [key, file] of specs) loaded[key] = await loadRuntimeModule(file, context);
    return loaded;
  }

  function moduleSpecs(group) {
    return asArray(group).map(item => [item.key, item.path]).filter(([key, file]) => key && file);
  }

  const runtimeManifest = await readJsonRel("z.automazioni/data/runtime/runtime_exports.json", null);
  if (!runtimeManifest?.runtime_modules) throw new Error("Runtime exports non generato: esegui npm run sync:sources.");

  const runtimeModuleGroups = runtimeManifest.runtime_modules;
  const runtimeViews = await loadRuntimeModules(moduleSpecs(runtimeModuleGroups.shared_context), sharedViewContext);
  const continuityViews = runtimeViews.continuity;
  const continuityContext = {
    ...sharedViewContext,
    continuityAction: continuityViews.continuityAction,
    continuityIssues: continuityViews.continuityIssues,
    continuityStatus: continuityViews.continuityStatus
  };
  Object.assign(runtimeViews, await loadRuntimeModules(moduleSpecs(runtimeModuleGroups.continuity_context), continuityContext));
  Object.assign(runtimeViews, await loadRuntimeModules(moduleSpecs(runtimeModuleGroups.session_context), {
    ...sharedViewContext,
    continuityIssues: continuityViews.continuityIssues
  }));

  function renderCreationFeedback(dv, source = null) {
    const page = source ?? dv.current();
    const checks = [
      ["Sessione", hasLinks(page.sessioni), fieldText(page.sessioni) || "Non collegata a una sessione."],
      ["Connessioni", hasLinks(page.connessioni) || hasLinks(page.collegamenti), fieldText(page.connessioni ?? page.collegamenti) || "Manca una connessione viva."],
      ["Gancio", hasText(page.gancio), fieldText(page.gancio) || "Manca un gancio giocabile."],
      ["Tavolo", hasText(page.uso_al_tavolo) || hasText(page.prossima_mossa), fieldText(page.uso_al_tavolo ?? page.prossima_mossa) || "Manca cosa fare al tavolo."],
      ["Player-safe", hasText(page.player_safe) || page.pubblico !== true, fieldText(page.player_safe) || "Se e pubblica, compila player_safe."]
    ];
    const ready = checks.filter(([, ok]) => ok).length;
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = checks.map(([label, ok, body]) => cardHtml({
      title: `${ok ? "OK" : "Manca"} · ${label}`,
      meta: page.feedback_creazione ?? `${ready}/${checks.length} controlli pronti`,
      azione: body,
      importa: ok ? "La nota puo comparire nelle viste operative." : "Questo campo decide se la nota resta isolata o diventa giocabile.",
      link: page.file?.path ?? "",
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderWorldCreationStatus(dv, worldLink = "") {
    const selectedPath = linkKey(worldLink);
    const worlds = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
      .where(p => !selectedPath || p.file.path === selectedPath)
      .sort(p => p.file.mtime, "desc")
      .limit(selectedPath ? 1 : 4)
      .array();

    if (!worlds.length) {
      renderEmptyState(dv, {
        title: "Nessun mondo attivo",
        action: "Crea un mondo homebrew dal wizard e poi selezionalo nel filtro.",
        button: "BUTTON[nuovo-mondo-homebrew]"
      });
      return;
    }

    const required = [
      ["Identita", p => hasText(p.tono) && hasText(p.tema) && hasText(p.premessa), "Tono, tema e promessa sono compilati."],
      ["Conflitto", p => hasText(p.conflitto_centrale), "Il mondo ha un conflitto centrale giocabile."],
      ["Luoghi", p => hasLinks(p.luoghi_iconici), "Almeno un luogo fondativo e collegato."],
      ["Poteri", p => hasLinks(p.fazioni_principali), "Almeno una fazione o potere e collegato."],
      ["Culture", p => hasLinks(p.culture_fondative), "Almeno una cultura fondativa e collegata."],
      ["Mistero", p => hasText(p.misteri_pubblici) || hasLinks(p.misteri_pubblici), "C'e un mistero pubblico da usare al tavolo."]
    ];

    const cards = worlds.flatMap(world => required.map(([label, test, readyText]) => {
      const ok = test(world);
      return cardHtml({
        title: `${ok ? "OK" : "Manca"} · ${label}`,
        meta: pageTitle(world),
        body: ok ? readyText : "Completa questo punto prima di usare il mondo come base per una campagna.",
        importa: fieldText(world.prossime_entita_consigliate) || "Quando i sei blocchi sono verdi, passa a mappe, relazioni e prima sessione.",
        link: world.file.path,
        cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
      });
    }));

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.join("");
  }

  async function readWorldbuildingCockpit() {
    return readJsonRel("z.automazioni/data/runtime/worldbuilding_cockpit.json", {
      surfaces: [],
      queues: []
    });
  }

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function" ? data.array() : asArray(value);
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function worldbuilderCategory(page) {
    const category = String(page?.categoria ?? page?.tipo ?? "").trim();
    if (category) return category;
    const folder = String(page?.file?.folder ?? "");
    if (folder.includes("Risorse/Mappe")) return "mappa";
    if (folder.includes("Mondi/Luoghi")) return "luogo";
    if (folder.includes("Mondi/Fazioni")) return "fazione";
    if (folder.includes("Mondi/Missioni")) return "missione";
    if (folder.includes("Mondi/Personaggi")) return "personaggio";
    return "nota";
  }

  function worldbuilderLinkCount(dv, page) {
    const fields = [
      "mondo", "campagna", "campagne", "luogo", "luogo_padre", "partenza", "arrivo",
      "luoghi", "regioni", "culture", "lingue", "religioni", "fazioni", "fazioni_controllanti",
      "personaggi", "missioni", "conflitti", "sessioni", "relazioni", "risorse",
      "risorse_trasportate", "rotte", "mercati", "mappe", "propaga_a", "entita_impattate",
      "connessioni", "collegamenti", "indizi", "segreti"
    ];

    return fields.reduce((total, key) => total + (hasValue(dv, page?.[key]) ? dvItems(dv, page?.[key]).filter(Boolean).length || 1 : 0), 0);
  }

  function normalizedGateKind(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const PLAYABILITY_GATES = ["tavolo", "movimento", "conseguenza", "collegamento"];
  const PLAYABILITY_GATE_LABELS = {
    tavolo: "tavolo",
    movimento: "movimento",
    conseguenza: "conseguenza",
    collegamento: "collegamento"
  };
  const PLAYABILITY_GATE_ACTIONS = {
    tavolo: "Manuale: compila uso_al_tavolo, scena o posta. Pulsante: Nuova missione o Nuovo incontro.",
    movimento: "Manuale: compila prossima_mossa o pressione. Pulsante: Motore mondo vivo o Nuovo clock.",
    conseguenza: "Manuale: compila conseguenze, propaga_a o entita_impattate. Workflow: Post Sessione Guidato o Controllo vault.",
    collegamento: "Manuale: collega mondo, luogo, fazione, missione o conseguenza. Superficie: Codex editabile o Nuova relazione."
  };
  const LIVE_WORLD_CATEGORIES = new Set([
    "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
    "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "creatura", "risorsa",
    "cultura", "lingua", "evento storico", "cosmologia", "segreto", "mistero"
  ]);
  const MOVING_WORLD_CATEGORIES = new Set([
    "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
    "relazione", "rotta", "mercato", "tracciato", "clock"
  ]);
  const CONSEQUENCE_WORLD_CATEGORIES = new Set([
    "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
    "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "evento storico", "cosmologia"
  ]);

  function worldbuilderGateCategory(page) {
    return normalizedGateKind(worldbuilderCategory(page));
  }

  function worldbuilderIsLiveEntity(page) {
    const category = worldbuilderGateCategory(page);
    if (["mondo", "dashboard", "sessione", "risorsa"].includes(category)) return false;
    if (LIVE_WORLD_CATEGORIES.has(category)) return true;
    return String(page?.file?.folder ?? "").startsWith("Mondi/");
  }

  function anyWorldbuilderField(dv, page, fields) {
    return fields.some(field => hasValue(dv, page?.[field]));
  }

  function positiveWorldbuilderNumber(page, fields) {
    return fields.some(field => Number(page?.[field] ?? 0) > 0);
  }

  function worldbuilderRequiredGates(page) {
    const category = worldbuilderGateCategory(page);
    const gates = ["tavolo", "collegamento"];
    if (MOVING_WORLD_CATEGORIES.has(category)) gates.splice(1, 0, "movimento");
    if (CONSEQUENCE_WORLD_CATEGORIES.has(category)) gates.splice(gates.length - 1, 0, "conseguenza");
    return gates;
  }

  function worldbuilderGateCoverage(dv, page, links = worldbuilderLinkCount(dv, page)) {
    return {
      tavolo: anyWorldbuilderField(dv, page, ["uso_al_tavolo", "promessa_al_tavolo", "scene", "scena", "gancio", "posta", "obiettivo", "obiettivo_giocabile", "indizi", "missioni"]),
      movimento: anyWorldbuilderField(dv, page, ["prossima_mossa", "mosse", "innesco", "avanza_se", "tracciati", "clock"]) || positiveWorldbuilderNumber(page, ["pressione", "pericolo"]),
      conseguenza: anyWorldbuilderField(dv, page, ["conseguenza", "conseguenze", "conseguenze_se_bloccata", "effetti", "impatto", "propaga_a", "entita_impattate", "cambiamenti_quotidiani", "cosa_cambia"]),
      collegamento: links >= 2
    };
  }

  function worldbuilderLiveGateRow(dv, page, links = worldbuilderLinkCount(dv, page)) {
    if (!worldbuilderIsLiveEntity(page)) return null;
    const coverage = worldbuilderGateCoverage(dv, page, links);
    const missingGates = worldbuilderRequiredGates(page).filter(gate => !coverage[gate]);
    if (!missingGates.length) return null;
    const missingLabel = missingGates.map(gate => PLAYABILITY_GATE_LABELS[gate]).join(", ");
    const workflows = [...new Set(missingGates.map(gate => PLAYABILITY_GATE_ACTIONS[gate]))].join(" | ");
    return {
      page,
      problem: `mancano: ${missingLabel}`,
      missingLabel,
      missingGates,
      action: PLAYABILITY_GATE_ACTIONS[missingGates[0]],
      workflow: workflows,
      priority: 6 + missingGates.length
    };
  }

  function worldbuilderGateCounts(rows) {
    return PLAYABILITY_GATES.reduce((counts, gate) => {
      counts[gate] = rows.filter(row => row.missingGates?.includes(gate)).length;
      return counts;
    }, {});
  }

  function worldbuilderScope(dv, worldLink = "", campaignLinks = []) {
    const selectedWorld = linkKey(worldLink);
    const selectedCampaigns = new Set(dvItems(dv, campaignLinks).map(linkKey).filter(Boolean));
    const isFolderIndex = page => page?.file?.name === page?.file?.folder?.split("/").pop();
    const real = page => isReal(page) && !isFolderIndex(page) && page.stato !== "archiviata" && page.stato !== "ignorata";
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const matchesCampaign = page => {
      if (!selectedCampaigns.size) return true;
      const links = dvItems(dv, page.campagne ?? page.campagna ?? page.campagne_attive);
      return !links.length || links.some(link => selectedCampaigns.has(linkKey(link)));
    };
    const inScope = page => real(page) && matchesWorld(page) && matchesCampaign(page);
    const pages = dv.pages('"Mondi" OR "Campagne" OR "Inbox"')
      .where(inScope)
      .array();
    const maps = dv.pages('"Risorse/Mappe"')
      .where(page => real(page) && matchesWorld(page))
      .array();

    return { pages, maps, inScope, selectedWorld, selectedCampaigns };
  }

  function worldbuilderMissingRows(dv, context) {
    const rows = [];
    const add = (page, problem, action, priority = 1) => rows.push({ page, problem, action, priority });

    for (const page of context.pages) {
      const category = worldbuilderCategory(page);
      const links = worldbuilderLinkCount(dv, page);
      const gateRow = worldbuilderLiveGateRow(dv, page, links);
      if (gateRow) rows.push(gateRow);
      if (category === "mondo" && (!hasValue(dv, page.premessa) || !hasValue(dv, page.conflitto_centrale))) {
        add(page, "mondo senza promessa o conflitto centrale", "Definisci promessa giocabile e tensione principale.", 5);
      }
      if (!hasValue(dv, page.mondo) && !["mondo", "risorsa", "lore capture", "dashboard"].includes(category)) {
        add(page, "scheda senza mondo", "Collega il mondo o archiviala se non serve.", 4);
      }
      if (links < 2 && !["mondo", "dashboard"].includes(category) && !gateRow?.missingGates?.includes("collegamento")) {
        add(page, "poche connessioni", "Collega almeno mondo, luogo, fazione, missione o conseguenza.", 3);
      }
      if (page.stato === "pronto" && !hasValue(dv, page.uso_al_tavolo) && !hasValue(dv, page.prossima_mossa) && !hasValue(dv, page.player_safe) && !gateRow?.missingGates?.includes("tavolo")) {
        add(page, "pronta ma senza uso", "Scrivi uso_al_tavolo, prossima_mossa o testo player-safe.", 4);
      }
      if (category === "luogo" && !hasValue(dv, page.fazioni) && !hasValue(dv, page.governante)) {
        add(page, "luogo senza potere", "Collega chi controlla, minaccia o usa questo luogo.", 4);
      }
      if (category === "luogo" && !hasValue(dv, page.mappa) && !hasValue(dv, page.mappe) && !hasValue(dv, page.coordinates)) {
        add(page, "luogo senza mappa o coordinate", "Collega una mappa o compila coordinate per l'atlante.", 2);
      }
      if (["fazione", "religione", "conflitto", "relazione"].includes(category) && Number(page.pressione ?? 0) > 0 && !hasValue(dv, page.prossima_mossa)) {
        add(page, "pressione senza prossima mossa", "Decidi cosa fa se i PG non intervengono.", 5);
      }
      if (category === "missione" && !hasValue(dv, page.fazioni) && !hasValue(dv, page.luoghi)) {
        add(page, "missione senza appigli", "Collega luogo, fazione o committente.", 4);
      }
    }

    for (const map of context.maps) {
      if (!hasValue(dv, map.luogo) && !hasValue(dv, map.luoghi)) {
        add(map, "mappa senza luoghi", "Collega almeno un luogo alla mappa.", 3);
      }
      if (map.pubblico === true && !hasValue(dv, map.player_safe) && !hasValue(dv, map.cosa_mostrare)) {
        add(map, "mappa pubblica senza testo sicuro", "Scrivi cosa possono vedere i giocatori.", 4);
      }
    }

    return rows
      .sort((left, right) => right.priority - left.priority || (right.page?.file?.mtime ?? 0) - (left.page?.file?.mtime ?? 0));
  }

  function worldbuilderReadyRows(dv, context) {
    const readyStates = new Set(["pronto", "in gioco", "in corso", "attivo", "accettata"]);
    return context.pages
      .filter(page => readyStates.has(String(page.stato ?? "")) || hasValue(dv, page.uso_al_tavolo) || hasValue(dv, page.prossima_mossa))
      .filter(page => worldbuilderLinkCount(dv, page) >= 2 || hasValue(dv, page.uso_al_tavolo) || hasValue(dv, page.prossima_mossa) || hasValue(dv, page.player_safe))
      .sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function worldbuilderPressureRows(dv, context) {
    return context.pages
      .filter(page => Number(page.pressione ?? page.pericolo ?? 0) > 0 || hasValue(dv, page.prossima_mossa))
      .sort((left, right) => Number(right.pressione ?? right.pericolo ?? 0) - Number(left.pressione ?? left.pericolo ?? 0));
  }

  function worldbuilderPublicRows(dv, context) {
    const candidates = [...context.pages, ...context.maps];
    return candidates
      .filter(page => {
        const category = worldbuilderCategory(page);
        return publicCandidate(page, category)
          || page.pubblico === true
          || hasValue(dv, page.player_safe)
          || hasValue(dv, page.versione_giocatori)
          || (["missione", "luogo", "dispensa", "mappa", "sessione"].includes(category) && ["pronto", "in gioco", "giocata", "consegnato"].includes(String(page.stato ?? "")));
      })
      .sort((left, right) => (hasPrivateFields(left) === hasPrivateFields(right) ? 0 : hasPrivateFields(left) ? 1 : -1));
  }

  function renderWorldbuilderNow(dv, worldLink = "", campaignLinks = []) {
    const context = worldbuilderScope(dv, worldLink, campaignLinks);
    const worlds = context.pages.filter(page => worldbuilderCategory(page) === "mondo");
    const missing = worldbuilderMissingRows(dv, context);
    const ready = worldbuilderReadyRows(dv, context);
    const pressureRows = worldbuilderPressureRows(dv, context);
    const publicRows = worldbuilderPublicRows(dv, context);
    const mapRows = context.maps.filter(page => hasValue(dv, page.coordinates) || hasValue(dv, page.luogo) || hasValue(dv, page.luoghi));
    const next = !worlds.length
      ? ["Fai adesso: crea mondo", "Nessun mondo operativo nel filtro.", "Usa Nuovo mondo guidato e torna qui."]
      : missing.length
        ? ["Fai adesso: chiudi un buco", missing[0].problem, missing[0].action]
        : pressureRows.length
          ? ["Fai adesso: scegli una pressione", pageTitle(pressureRows[0]), fieldText(pressureRows[0].prossima_mossa) || "Decidi come avanza fuori scena."]
          : ready.length
            ? ["Fai adesso: porta al tavolo", pageTitle(ready[0]), fieldText(ready[0].uso_al_tavolo ?? ready[0].prossima_mossa) || "Trasformala in scena, missione o conseguenza."]
            : ["Fai adesso: crea un appiglio", "Manca materiale giocabile filtrato.", "Crea luogo, fazione o missione con almeno due collegamenti."];

    const cards = [
      cardHtml({
        title: next[0],
        meta: next[1],
        body: next[2],
        importa: "Il cockpit privilegia il prossimo passo, non la completezza enciclopedica.",
        cls: `gdr-info-card compact ${missing.length || !worlds.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Cosa manca",
        meta: `${missing.length} interventi`,
        body: missing[0]?.problem ?? "Nessun buco pratico evidente.",
        importa: missing[0]?.action ?? "Passa a pressioni, mappe o materiale player-safe.",
        link: missing[0]?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${missing.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Cosa e pronto",
        meta: `${ready.length} schede`,
        body: ready[0] ? pageTitle(ready[0]) : "Nessuna scheda pronta nel filtro.",
        importa: ready[0] ? fieldText(ready[0].uso_al_tavolo ?? ready[0].prossima_mossa ?? ready[0].player_safe) : "Rendi pronto almeno un luogo, potere o obiettivo.",
        link: ready[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${ready.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Sotto pressione",
        meta: `${pressureRows.length} fronti`,
        body: pressureRows[0] ? pageTitle(pressureRows[0]) : "Nessuna pressione attiva.",
        importa: pressureRows[0] ? fieldText(pressureRows[0].prossima_mossa) || "Dai una prossima mossa alla pressione piu alta." : "Crea un conflitto, clock o fazione con pressione.",
        link: pressureRows[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${pressureRows.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Player-safe",
        meta: `${publicRows.length} candidati`,
        body: publicRows[0] ? pageTitle(publicRows[0]) : "Niente da consegnare per ora.",
        importa: publicRows[0] ? fieldText(publicRows[0].player_safe ?? publicRows[0].recap_pubblico ?? publicRows[0].versione_giocatori) || "Verifica che non contenga campi DM." : "Compila player_safe su dispense, luoghi, mappe o missioni.",
        link: publicRows[0]?.pubblico === true && !hasPrivateFields(publicRows[0]) ? publicRows[0].file?.path ?? "" : "",
        cls: `gdr-info-card compact ${publicRows.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Mappe",
        meta: `${mapRows.length} supporti`,
        body: mapRows[0] ? pageTitle(mapRows[0]) : "Nessuna mappa o coordinata trovata.",
        importa: mapRows[0] ? fieldText(mapRows[0].uso_al_tavolo ?? mapRows[0].luogo ?? mapRows[0].luoghi) : "Collega coordinate, mappa o layer a un luogo giocabile.",
        link: mapRows[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${mapRows.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-worldbuilder-now" });
    grid.innerHTML = cards.join("");
  }

  function renderWorldbuilderReadiness(dv, worldLink = "", campaignLinks = []) {
    const context = worldbuilderScope(dv, worldLink, campaignLinks);
    const missing = worldbuilderMissingRows(dv, context);
    const ready = worldbuilderReadyRows(dv, context);
    const publicRows = worldbuilderPublicRows(dv, context);
    const weakLinks = context.pages.filter(page => !["mondo", "dashboard"].includes(worldbuilderCategory(page)) && worldbuilderLinkCount(dv, page) < 2);
    const gateRows = missing.filter(row => row.missingGates?.length);
    const gateCounts = worldbuilderGateCounts(gateRows);
    const stats = [
      ["Tavolo", gateCounts.tavolo, "senza uso in scena"],
      ["Movimento", gateCounts.movimento, "senza prossima mossa"],
      ["Conseguenze", gateCounts.conseguenza, "senza cosa cambia"],
      ["Collegamenti", gateCounts.collegamento, "senza agganci"],
      ["Pronte", ready.length, "schede usabili"],
      ["Player-safe", publicRows.length, "condivisibili o quasi"],
      ["Buchi", missing.length, "interventi totali"],
      ["Da collegare", weakLinks.length, "note isolate"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-worldbuilder-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function renderWorldbuilderQueues(dv, worldLink = "", campaignLinks = []) {
    const cockpit = await readWorldbuildingCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const context = worldbuilderScope(dv, worldLink, campaignLinks);
    const missing = worldbuilderMissingRows(dv, context).slice(0, 12);
    const ready = worldbuilderReadyRows(dv, context).slice(0, 12);
    const pressureRows = worldbuilderPressureRows(dv, context).slice(0, 12);
    const publicRows = worldbuilderPublicRows(dv, context).slice(0, 12);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "missing",
      ["Nota", "Manca", "Azione", "Workflow esistente"],
      missing.map(row => [row.page.file?.link ?? row.page.file?.path, row.missingLabel ?? row.problem, row.action, row.workflow ?? "Manuale: modifica i campi indicati nella nota."]),
      "Nessun buco pratico evidente con i filtri correnti."
    );
    renderTable(
      "ready",
      ["Nota", "Uso", "Collegamenti"],
      ready.map(page => [page.file?.link ?? page.file?.path, fieldText(page.uso_al_tavolo ?? page.prossima_mossa ?? page.player_safe) || page.stato || "", worldbuilderLinkCount(dv, page)]),
      "Nessuna scheda pronta nel filtro corrente."
    );
    renderTable(
      "pressure",
      ["Nota", "Pressione", "Prossima mossa"],
      pressureRows.map(page => [page.file?.link ?? page.file?.path, page.pressione ?? page.pericolo ?? "", fieldText(page.prossima_mossa) || "da decidere"]),
      "Nessuna pressione attiva nel filtro corrente."
    );
    renderTable(
      "public",
      ["Nota", "Stato", "Testo sicuro"],
      publicRows.map(page => [page.file?.link ?? page.file?.path, hasPrivateFields(page) ? "da ripulire" : page.pubblico === true ? "pubblica" : page.stato ?? "", fieldText(page.player_safe ?? page.recap_pubblico ?? page.versione_giocatori) || "da compilare"]),
      "Nessun materiale player-safe nel filtro corrente."
    );
  }

  async function renderWorldbuilderSurfaceLinks(dv) {
    const cockpit = await readWorldbuildingCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici non configurate",
        action: "Rigenera il contratto worldbuilding cockpit dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-worldbuilder-surfaces" });
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

  async function renderWorkflowCommandDeck(dv, workflowId, options = {}) {
    const dataPath = "z.automazioni/data/workflows/quick_actions.json";

    try {
      const raw = await app.vault.adapter.read(dataPath);
      const data = JSON.parse(raw);
      const workflow = data.workflows?.[workflowId];
      const metaBind = await readJsonRel(".obsidian/plugins/obsidian-meta-bind-plugin/data.json", {});
      const buttonTemplates = new Map(asArray(metaBind?.buttonTemplates).map(button => [String(button.id ?? ""), button]));

      if (!workflow) {
        renderEmptyState(dv, {
          title: "Flusso non trovato",
          action: `Aggiungi ${workflowId} a Dev/TemplateFactory/modules/workflows.yaml e rigenera i dati workflow.`,
          button: "npm run generate:workflow-data"
        });
        return;
      }

      const plugins = asArray(workflow.required_plugins);
      const entryPoints = asArray(workflow.entry_points);
      const actions = asArray(workflow.quick_actions);
      const actionGroups = Object.values(workflow.action_groups ?? {});
      const diagnostic = options.mode === "diagnostic";
      const simple = !diagnostic && (options.mode === "simple" || workflow.audience === "user");
      const entryStates = await Promise.all(entryPoints.map(async entry => [entry, await canReadRel(entry)]));
      const missingEntries = entryStates.filter(([, ok]) => !ok).map(([entry]) => entry);
      const metaBindStatus = pluginStatus("Meta Bind");
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      const cards = [];
      const renderActionCard = (action, secondary = false) => {
        const button = String(action.button ?? "");
        const template = buttonTemplates.get(button);
        const metaBindReady = metaBindStatus.ok === true;
        const configured = Boolean(template);
        const ready = Boolean(button && configured && metaBindReady);
        const missingReason = !button
          ? "Pulsante mancante nel workflow YAML."
          : !configured
            ? "Template Meta Bind non configurato."
            : !metaBindReady
              ? "Plugin Meta Bind non attivo."
              : "Azione pronta.";
        const fallback = !button
          ? "Correggi Dev/TemplateFactory/modules/workflows.yaml."
          : !configured
            ? `Aggiungi ${button} in .obsidian/plugins/obsidian-meta-bind-plugin/data.json.`
            : !metaBindReady
              ? `Abilita Meta Bind (${metaBindStatus.id}) nei plugin community.`
              : describeButtonTemplate(template);

        if (simple) {
          return cardHtml({
            title: action.label || button || (secondary ? "Azione secondaria" : "Azione"),
            meta: ready ? (secondary ? "Opzione utile" : "Azione principale") : "Azione da controllare",
            body: action.use_when || "Usala quando serve.",
            importa: ready
              ? "Se non risponde, usa la tabella di fallback in fondo alla pagina."
              : "Se il comando non compare come pulsante, apri Setup Guidato o Controllo Vault.",
            cls: `gdr-info-card compact ${ready ? "gdr-kind-ready" : "gdr-kind-missing"}`
          });
        }

        return cardHtml({
          title: action.label || button || (secondary ? "Azione secondaria" : "Azione"),
          meta: button ? `BUTTON[${button}] · ${ready ? "Pronto" : "Da controllare"}` : "Pulsante mancante",
          body: action.use_when || "Condizione d'uso non dichiarata.",
          importa: `${missingReason} Fallback: ${fallback}`,
          cls: `gdr-info-card compact ${ready ? "gdr-kind-ready" : "gdr-kind-missing"}`
        });
      };

      cards.push(cardHtml({
        title: simple ? "Percorso" : "Flusso operativo",
        meta: simple ? "Pronto da usare" : workflowId,
        body: workflow.user_goal || "Obiettivo workflow non dichiarato.",
        importa: entryPoints.length
          ? missingEntries.length
            ? simple ? "Una pagina del percorso non e leggibile: apri Setup Guidato." : `Entry point mancanti: ${missingEntries.join(", ")}.`
            : simple ? "Segui le azioni nell'ordine in cui compaiono." : `Entry point verificati: ${entryPoints.join(", ")}.`
          : "Manca una pagina operativa collegata.",
        cls: `gdr-info-card compact ${entryPoints.length && !missingEntries.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }));

      for (const plugin of simple ? [] : plugins) {
        const status = pluginStatus(plugin);
        cards.push(cardHtml({
          title: plugin,
          meta: status.ok === true ? "Plugin attivo" : status.ok === false ? "Plugin da attivare" : "Verifica manuale",
          body: pluginSymptom(plugin),
          importa: status.ok === true
            ? `Plugin attivo: ${status.id}.`
            : `${pluginManualAction(plugin)} ID plugin: ${status.id}.`,
          cls: `gdr-info-card compact ${status.ok === true ? "gdr-kind-ready" : "gdr-kind-missing"}`
        }));
      }

      for (const action of actions) {
        cards.push(renderActionCard(action));
      }

      for (const group of actionGroups) {
        cards.push(cardHtml({
          title: group.label || "Gruppo azioni",
          meta: `${asArray(group.actions).length} azioni secondarie`,
          body: group.purpose || "Gruppo operativo dichiarato nel workflow YAML.",
          importa: "Usalo solo quando il flusso principale non basta.",
          cls: "gdr-info-card compact gdr-kind-ready"
        }));

        for (const action of asArray(group.actions)) {
          cards.push(renderActionCard(action, true));
        }
      }

      if (!simple) {
        cards.push(cardHtml({
          title: "Se un controllo non risponde",
          meta: "Fallback operativo",
          body: "Leggi la condizione d'uso dell'azione, apri manualmente la pagina o il template indicato e completa i campi richiesti nella nota.",
          importa: "Il deck ora distingue plugin mancanti, template Meta Bind assenti ed entry point non leggibili.",
          cls: "gdr-info-card compact"
        }));
      }

      grid.innerHTML = cards.join("");
    } catch (error) {
      renderEmptyState(dv, {
        title: "Workflow runtime non disponibile",
        action: `Rigenera ${dataPath}; errore: ${error.message}`,
        button: "npm run generate:workflow-data"
      });
    }
  }

  function renderOnboardingReadiness(dv) {
    const worlds = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
      .array();
    const active = activeSession(dv);
    const sessions = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.stato !== "archiviata")
      .array();
    const played = sessions.filter(p => ["giocata", "usata", "chiusa"].includes(String(p.stato ?? "")) || hasText(p.resoconto) || hasText(p.output_sessione));
    const openConsequences = dv.pages('"Mondi" OR "Inbox"')
      .where(p => isReal(p) && p.stato !== "archiviata")
      .where(p => hasLinks(p.conseguenze) || hasLinks(p.entita_impattate) || hasLinks(p.propaga_a) || hasText(p.prossima_mossa))
      .where(p => !["applicata", "propagata", "canonizzata"].includes(String(p.propagazione_stato ?? "")))
      .array();

    let card;
    if (!worlds.length) {
      card = {
        title: "Fai questo adesso: crea il mondo",
        meta: "Primo passo",
        body: "Crea un mondo anche minimale. Bastano nome, tono e una promessa giocabile.",
        importa: "Dopo il mondo potrai preparare la prima sessione.",
        button: "BUTTON[nuovo-mondo-homebrew]",
        cls: "gdr-info-card compact gdr-kind-missing"
      };
    } else if (!sessions.length) {
      card = {
        title: "Fai questo adesso: prepara una sessione",
        meta: `${worlds.length} mondo/i trovati`,
        body: "Crea o apri una sessione e collegala al mondo.",
        importa: "Ti serve solo una prima scena pronta da giocare.",
        button: "BUTTON[preparazione-sessione-risorse-preparazione-sessione]",
        cls: "gdr-info-card compact gdr-kind-ready"
      };
    } else if (active) {
      card = {
        title: "Fai questo adesso: gioca",
        meta: pageTitle(active) || "Sessione attiva",
        body: "Apri il tavolo operativo e cattura quello che succede senza riordinare tutto subito.",
        importa: "Il riordino arriva dopo la sessione.",
        button: "BUTTON[gioca-hub-durante-il-gioco-durante-il-gioco]",
        cls: "gdr-info-card compact gdr-kind-ready"
      };
    } else if (played.length && openConsequences.length) {
      card = {
        title: "Fai questo adesso: aggiorna il mondo",
        meta: `${openConsequences.length} conseguenze o mosse aperte`,
        body: "Scegli cosa cambia davvero e prepara la prossima mossa.",
        importa: "Questo evita che gli appunti restino scollegati.",
        button: "BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]",
        cls: "gdr-info-card compact gdr-kind-ready"
      };
    } else {
      card = {
        title: "Fai questo adesso: scegli la prossima sessione",
        meta: `${sessions.length} sessione/i nel vault`,
        body: "Apri Preparazione Sessione e rendi attiva quella che vuoi giocare.",
        importa: "Una sola sessione attiva rende chiaro il tavolo operativo.",
        button: "BUTTON[preparazione-sessione-risorse-preparazione-sessione]",
        cls: "gdr-info-card compact gdr-kind-ready"
      };
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cardHtml(card);
  }

  function renderPluginTroubleshooting(dv, workflowId = "") {
    const labels = workflowPluginFallbacks[workflowId] ?? defaultWorkflowPlugins;
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = labels.map(label => {
      const status = pluginStatus(label);
      return cardHtml({
        title: label,
        meta: status.ok === true ? "Pronto" : status.ok === false ? "Da controllare" : "Verifica manuale",
        body: pluginSymptom(label),
        importa: status.ok === true ? `Plugin attivo: ${status.id}` : `${pluginManualAction(label)} ID plugin: ${status.id}.`,
        cls: `gdr-info-card compact ${status.ok === true ? "gdr-kind-ready" : "gdr-kind-missing"}`
      });
    }).join("") + cardHtml({
      title: "Fallback manuale",
      meta: workflowId || "generale",
      body: "Se un pulsante non esegue l'azione, usa il testo del workflow come procedura manuale e aggiorna i campi YAML dalla nota.",
      importa: "Il vault deve restare usabile anche senza automazione perfetta.",
      cls: "gdr-info-card compact"
    });
  }

  async function renderVaultReadiness(dv, mode = "start") {
    const essential = [
      ["Pulsanti e creazione note", ["Meta Bind", "Templater"], "Se non sono pronti, abilita gli strumenti inclusi e riavvia Obsidian."],
      ["Dashboard e tabelle", ["Dataview"], "Se non e pronto, le dashboard restano vuote o mostrano codice."],
      ["Aspetto", [], "Rende leggibili le dashboard.", ".obsidian/snippets/gdr-vault.css"]
    ];
    const setupOnly = [
      ["Campi guidati", ["Metadata Menu"], "Aiuta a compilare le note, ma puoi iniziare anche senza."],
      ["Pagina iniziale", ["Homepage"], "Apre automaticamente Inizia Qui."],
      ["Prima sessione", [], "Percorso pratico per giocare subito.", "Risorse/Prima Sessione In 15 Minuti.md"],
      ["Fuori scena", [], "Serve dopo la sessione.", "Hub/Cosa Succede Fuori Scena.md"]
    ];
    const rows = mode === "setup" ? [...essential, ...setupOnly] : [
      ["Stato", ["Meta Bind", "Templater", "Dataview"], "Puoi iniziare da Crea mondo o Prepara sessione.", ".obsidian/snippets/gdr-vault.css"],
      ["Percorso rapido", [], "Disponibile se vuoi giocare subito.", "Risorse/Prima Sessione In 15 Minuti.md"]
    ];
    const checks = [];

    for (const [label, plugins, message, file] of rows) {
      const pluginReady = plugins.every(plugin => pluginStatus(plugin).ok === true);
      const fileReady = file ? await canReadRel(file) : true;
      const ok = pluginReady && fileReady;
      checks.push([
        label,
        ok ? "Pronto" : "Da controllare",
        mode === "start" && label === "Stato" && !ok
          ? "Apri Setup Guidato solo per recuperare strumenti disabilitati."
          : message
      ]);
    }

    dv.table(mode === "setup" ? ["Area", "Stato", "Cosa fare"] : ["Area", "Stato", "Prossimo passo"], checks);
  }

  function renderPlayabilityFamilyCards(dv, source = null, family = "generica") {
    const page = source ?? dv.current();
    const definitions = {
      mondo: [
        ["Premessa", page.premessa ?? page.gancio, "Scrivi la promessa centrale del mondo."],
        ["Luoghi", page.luoghi_iconici ?? page.luoghi, "Collega luoghi che possono diventare sessioni."],
        ["Poteri", page.fazioni_principali ?? page.fazioni, "Collega fazioni o poteri che muovono il mondo."],
        ["Misteri", page.misteri_pubblici ?? page.segreti, "Rendi visibile cosa il tavolo puo scoprire."],
        ["Fronti", page.fronti ?? page.missioni, "Collega missioni, conflitti o pressioni attive."]
      ],
      campagna: [
        ["Mondo", page.mondo, "Collega il mondo da cui nasce la campagna."],
        ["Regione", page.regione ?? page.luoghi, "Definisci dove parte la campagna."],
        ["Poteri", page.fazioni ?? page.conflitti, "Collega chi spinge gli eventi."],
        ["Missioni", page.missioni, "Collega obiettivi giocabili."],
        ["Sessioni", page.sessioni, "Collega le sessioni gia pronte o giocate."]
      ],
      cultura: [
        ["Identita", page.tratto_distintivo ?? page.valori, "Definisci cosa si vede subito al tavolo."],
        ["Luoghi", page.luoghi, "Collega dove questa cultura vive o lascia tracce."],
        ["Riti", page.feste ?? page.usi, "Collega pratiche giocabili, feste o tabu."],
        ["Tensioni", page.tensioni ?? page.rischi, "Scrivi quale scelta o costo produce."],
        ["Prossima mossa", page.prossima_mossa, "Definisci come reagisce quando viene coinvolta."]
      ],
      risorsa: [
        ["Luogo", page.luogo ?? page.luoghi, "Collega dove la risorsa o il mercato si manifesta."],
        ["Controllo", page.fazioni_controllanti ?? page.fazioni, "Collega chi controlla prezzo, accesso o rischio."],
        ["Pressione", page.pressione, "Misura quanto il nodo economico sta cambiando."],
        ["Missioni", page.missioni, "Collega obiettivi che possono alterare il nodo."],
        ["Mappa", page.mappa ?? page.mappe, "Collega marker, mappa o layer cartografico."]
      ],
      dispensa: [
        ["Pubblico", page.pubblico === true ? "Consegnabile ai giocatori." : "", "Decidi se questa dispensa e player-safe."],
        ["Player-safe", page.player_safe, "Scrivi cosa puo leggere il party senza segreti."],
        ["Sessioni", page.sessioni, "Collega quando consegnarla."],
        ["Luogo", page.luogo ?? page.luoghi, "Collega dove appare o chi la emette."],
        ["Mondo", page.mondo, "Collega il contesto narrativo."]
      ],
      luogo: [
        ["Coordinate", page.coordinates, "Compila coordinate se il luogo deve apparire in Atlante Mappe."],
        ["Mappe", page.mappe ?? page.mappa, "Collega una mappa zoom, pubblica o DM."],
        ["Controllo", page.fazioni ?? page.fazioni_controllanti, "Collega chi controlla, minaccia o usa questo luogo."],
        ["Missioni", page.missioni, "Collega missioni che possono cambiare lo stato del luogo."],
        ["Prossima mossa", page.prossima_mossa, "Definisci cosa succede qui se nessuno interviene."]
      ],
      fazione: [
        ["Obiettivo", page.obiettivo ?? page.agenda, "Scrivi cosa vuole ottenere la fazione."],
        ["Pressione", page.pressione, "Dai un peso operativo alla prossima mossa."],
        ["Luoghi controllati", page.luoghi_controllati ?? page.luoghi, "Collega territori, basi o luoghi contesi."],
        ["Rivali", page.rivali ?? page.connessioni, "Collega alleati, nemici o concorrenti."],
        ["Prossima mossa", page.prossima_mossa, "Definisci cosa fa la fazione fuori scena."]
      ],
      png: [
        ["Motivazione", page.motivazione ?? page.obiettivo, "Scrivi cosa vuole ora questo PNG."],
        ["Atteggiamento", page.atteggiamento, "Segna come tratta il party o le fazioni coinvolte."],
        ["Luogo", page.luoghi ?? page.luogo, "Collega dove puo essere trovato o dove agisce."],
        ["Fazioni", page.fazioni, "Collega appartenenze, debiti o patroni."],
        ["Segreti", page.segreti_rivelati ?? page.segreto, "Distingui cio che e stato rivelato da cio che resta DM."]
      ],
      relazione: [
        ["Parti", page.parti ?? page.connessioni, "Collega le note che questa relazione tiene insieme."],
        ["Stato", page.stato_relazione ?? page.stato, "Definisci se il legame e stabile, teso, rotto o segreto."],
        ["Tensione", page.pressione, "Misura quanto il legame e vicino a cambiare."],
        ["Rottura", page.rottura, "Scrivi cosa spezza o peggiora la relazione."],
        ["Rinforzo", page.rinforzo, "Scrivi cosa puo stabilizzarla o renderla utile."]
      ],
      tracciato: [
        ["Pressione", page.pressione, "Misura quanto il fronte e vicino a muoversi."],
        ["Soglia", page.soglia, "Definisci quando il clock produce un cambio di stato."],
        ["Progresso", page.progress_value ?? page.progresso, "Segna il punto attuale del tracciato."],
        ["Innesco", page.innesco, "Scrivi cosa lo fa avanzare."],
        ["Prossima mossa", page.prossima_mossa, "Definisci cosa accade al prossimo avanzamento."]
      ],
      continuita: [
        ["Causa", page.causa ?? page.cause, "Collega o descrivi cosa ha generato l'evento."],
        ["Effetti", page.effetti ?? page.conseguenze, "Scrivi cosa cambia in modo persistente."],
        ["Bersagli", page.entita_impattate ?? page.propaga_a, "Collega le note che devono reagire."],
        ["Aggiornamenti", page.aggiornamenti_richiesti, "Specifica quali campi o stati vanno aggiornati."],
        ["Stato propagazione", page.propagazione_stato, "Imposta aperta, applicata, propagata o da verificare."]
      ]
    };
    const rows = definitions[family] ?? definitions.continuita;
    const ready = rows.filter(([, value]) => fieldText(value)).length;
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = rows.map(([title, value, fallback]) => cardHtml({
      title,
      meta: `${ready}/${rows.length} controlli pronti`,
      body: fieldText(value) || fallback,
      link: page.file?.path ?? "",
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    if (family === "luogo") {
      dv.paragraph("Usa Atlante Mappe per controllare marker e coordinate; usa Excalidraw o Canvas quando il luogo diventa rete di fronti o scene.");
    } else if (family === "tracciato") {
      dv.paragraph("Un tracciato e utile quando pressione, innesco e prossima mossa trasformano tempo in conseguenze.");
    } else {
      dv.paragraph("Questa vista misura se la scheda produce gioco, connessioni e continuita invece di restare descrizione isolata.");
    }
  }

  function renderExports(...modules) {
    return Object.assign({}, ...modules.map(module => Object.fromEntries(
      Object.entries(module ?? {}).filter(([name, value]) => name.startsWith("render") && typeof value === "function")
    )));
  }

  return {
    ...sessionCore,
    escapeHtml: gdrCore.escapeHtml,
    ...renderExports(...Object.values(runtimeViews)),
    renderCreationFeedback,
    renderActions,
    renderEmptyState,
    renderPlayabilityFamilyCards,
    renderOnboardingReadiness,
    renderPartyControl,
    renderPluginTroubleshooting,
    renderVaultReadiness,
    renderWorkflowCommandDeck,
    renderWorldCreationStatus,
    renderWorldbuilderNow,
    renderWorldbuilderQueues,
    renderWorldbuilderReadiness,
    renderWorldbuilderSurfaceLinks
  };
})()
