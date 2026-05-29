(ctx => {
  const {
    cardHtml,
    escapeHtml,
    fieldText,
    hasPrivateFields,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pluginStatus,
    readJsonRel,
    renderEmptyState
  } = ctx;

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function"
      ? data.array()
      : Array.isArray(value) ? value : value ? [value] : [];
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function anyValue(dv, page, fields) {
    return fields.some(field => hasValue(dv, page?.[field]));
  }

  function realPage(page) {
    const folderIndex = page?.file?.name === page?.file?.folder?.split("/").pop();
    return isReal(page) && !folderIndex && page.stato !== "archiviata" && page.stato !== "ignorata";
  }

  function worldbuildingControlScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const scoped = page => realPage(page) && matchesWorld(page);
    const pages = dv.pages('"Mondi" OR "Inbox"').where(scoped).array();
    const maps = dv.pages('"Risorse/Mappe"')
      .where(page => realPage(page) && page.file?.name !== "Mappe" && matchesWorld(page))
      .array();
    return { pages, maps, selectedWorld };
  }

  function controlCategory(page) {
    const folder = String(page?.file?.folder ?? "");
    if (folder.includes("Mondi/Culture")) return "cultura";
    if (folder.includes("Mondi/Lingue")) return "lingua";
    if (folder.includes("Mondi/Luoghi")) return "luogo";
    if (folder.includes("Mondi/Cosmologia")) return "cosmologia";
    if (folder.includes("Mondi/Timeline") || folder.includes("Mondi/Storia")) return "evento storico";
    if (folder.includes("Mondi/Conflitti")) return "conflitto";
    if (folder.includes("Mondi/Relazioni")) return "relazione";
    if (folder.includes("Mondi/Segreti")) return "segreto";
    if (folder.includes("Mondi/Rotte")) return "rotta";
    if (folder.includes("Mondi/Risorse")) return "risorsa";
    if (folder.includes("Mondi/Mercati")) return "mercato";
    if (folder.includes("Mondi/Compendium")) return "compendium";
    if (folder.includes("Mondi/Fazioni")) return "fazione";
    if (folder.includes("Mondi/Missioni")) return "missione";
    if (folder.includes("Mondi/Incontri")) return "incontro";
    if (folder.includes("Mondi/Dispense")) return "dispensa";
    if (folder.includes("Risorse/Mappe")) return "mappa";

    const category = String(page?.categoria ?? "").trim().toLowerCase();
    const type = String(page?.tipo ?? page?.tipologia ?? "").trim().toLowerCase();
    if (category === "risorsa" && type) return type;
    return category || type || "nota";
  }

  function linkCount(dv, page) {
    const fields = [
      "mondo", "campagna", "campagne", "luogo", "luogo_padre", "partenza", "arrivo",
      "luoghi", "regioni", "culture", "lingue", "religioni", "fazioni", "fazioni_controllanti",
      "personaggi", "missioni", "conflitti", "sessioni", "relazioni", "risorse",
      "risorse_trasportate", "rotte", "mercati", "mappe", "propaga_a", "entita_impattate",
      "connessioni", "collegamenti", "indizi", "segreti"
    ];

    return fields.reduce((total, key) => {
      const items = dvItems(dv, page?.[key]).filter(Boolean);
      return total + (items.length || (hasValue(dv, page?.[key]) ? 1 : 0));
    }, 0);
  }

  function addIssue(rows, group, page, problem, action, priority = 1, extra = {}) {
    rows.push({ group, page, problem, action, priority, ...extra });
  }

  function normalizedGateKind(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const PLAYABILITY_GATES = ["tavolo", "movimento", "conseguenza", "collegamento"];
  const PLAYABILITY_GATE_ACTIONS = {
    tavolo: "Manuale: compila uso_al_tavolo, scena o posta. Pulsante: Nuova missione o Nuovo incontro.",
    movimento: "Manuale: compila prossima_mossa o pressione. Pulsante: Motore mondo vivo o Nuovo clock.",
    conseguenza: "Manuale: compila conseguenze, propaga_a o entita_impattate. Workflow: Post Sessione Guidato o Controllo vault.",
    collegamento: "Manuale: collega mondo, luogo, fazione, missione o conseguenza. Superficie: Codex editabile o Nuova relazione."
  };
  const LIVE_ENTITY_CATEGORIES = new Set([
    "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
    "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "creatura",
    "cultura", "lingua", "evento storico", "cosmologia", "segreto", "mistero"
  ]);
  const MOVING_ENTITY_CATEGORIES = new Set([
    "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
    "relazione", "rotta", "mercato", "tracciato", "clock"
  ]);
  const CONSEQUENCE_ENTITY_CATEGORIES = new Set([
    "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
    "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "evento storico", "cosmologia"
  ]);

  function positiveNumber(page, fields) {
    return fields.some(field => Number(page?.[field] ?? 0) > 0);
  }

  function gateCategory(page) {
    return normalizedGateKind(controlCategory(page));
  }

  function isLiveEntity(page) {
    const category = gateCategory(page);
    if (["mondo", "dashboard", "sessione", "risorsa", "compendium", "dispensa", "mappa"].includes(category)) return false;
    return LIVE_ENTITY_CATEGORIES.has(category) || String(page?.file?.folder ?? "").startsWith("Mondi/");
  }

  function requiredGates(page) {
    const category = gateCategory(page);
    const gates = ["tavolo", "collegamento"];
    if (MOVING_ENTITY_CATEGORIES.has(category)) gates.splice(1, 0, "movimento");
    if (CONSEQUENCE_ENTITY_CATEGORIES.has(category)) gates.splice(gates.length - 1, 0, "conseguenza");
    return gates;
  }

  function gateCoverage(dv, page, links = linkCount(dv, page)) {
    return {
      tavolo: anyValue(dv, page, ["uso_al_tavolo", "promessa_al_tavolo", "scene", "scena", "gancio", "posta", "obiettivo", "obiettivo_giocabile", "indizi", "missioni"]),
      movimento: anyValue(dv, page, ["prossima_mossa", "mosse", "innesco", "avanza_se", "tracciati", "clock"]) || positiveNumber(page, ["pressione", "pericolo"]),
      conseguenza: anyValue(dv, page, ["conseguenza", "conseguenze", "conseguenze_se_bloccata", "effetti", "impatto", "propaga_a", "entita_impattate", "cambiamenti_quotidiani", "cosa_cambia"]),
      collegamento: links >= 2
    };
  }

  function liveGateIssue(dv, page, links = linkCount(dv, page)) {
    if (!isLiveEntity(page)) return null;
    const coverage = gateCoverage(dv, page, links);
    const missingGates = requiredGates(page).filter(gate => !coverage[gate]);
    if (!missingGates.length) return null;
    const missingLabel = missingGates.join(", ");
    return {
      group: "Giocabilita",
      page,
      problem: `mancano: ${missingLabel}`,
      missingLabel,
      missingGates,
      action: PLAYABILITY_GATE_ACTIONS[missingGates[0]],
      workflow: [...new Set(missingGates.map(gate => PLAYABILITY_GATE_ACTIONS[gate]))].join(" | "),
      priority: 6 + missingGates.length
    };
  }

  function gateCounts(rows) {
    return PLAYABILITY_GATES.reduce((counts, gate) => {
      counts[gate] = rows.filter(row => row.missingGates?.includes(gate)).length;
      return counts;
    }, {});
  }

  function sorted(rows) {
    return rows.sort((left, right) => right.priority - left.priority || (right.page?.file?.mtime ?? 0) - (left.page?.file?.mtime ?? 0));
  }

  function isTerritory(page) {
    return new Set(["regione", "regno", "contea", "ducato", "impero", "repubblica"]).has(String(page?.tipo ?? page?.tipologia ?? "").toLowerCase());
  }

  function isPoliticalPlace(page) {
    return new Set(["regno", "impero", "repubblica", "ducato", "contea", "baronia"]).has(String(page?.tipo ?? page?.tipologia ?? "").toLowerCase());
  }

  function isEvent(dv, page) {
    return controlCategory(page) === "evento storico" || hasValue(dv, page?.data_mondo);
  }

  function depthRows(dv, scope) {
    const rows = [];
    for (const page of scope.pages) {
      const category = controlCategory(page);
      if (category === "mondo") {
        if (!hasValue(dv, page.principi_realta)) addIssue(rows, "Profondita", page, "mondo senza principi di realta", "Definisci regole visibili che cambiano scene e scelte.", 5, { area: "Mondo" });
        if (!hasValue(dv, page.contraddizioni_centrali)) addIssue(rows, "Profondita", page, "mondo senza contraddizioni centrali", "Scrivi tensioni che generano conflitti ricorrenti.", 5, { area: "Mondo" });
        if (!hasValue(dv, page.vita_quotidiana)) addIssue(rows, "Profondita", page, "mondo senza vita quotidiana", "Aggiungi dettagli usabili da PNG, luoghi e scene.", 4, { area: "Mondo" });
      }
      if (category === "cultura") {
        if (!hasValue(dv, page.mito_origine)) addIssue(rows, "Profondita", page, "cultura senza mito d'origine", "Dai una memoria condivisa che possa creare orgoglio o attrito.", 4, { area: "Culture" });
        if (!anyValue(dv, page, ["cose_sacre", "cose_proibite"])) addIssue(rows, "Profondita", page, "cultura senza sacro o proibito", "Definisci tabu, rispetto o costo sociale.", 4, { area: "Culture" });
        if (!anyValue(dv, page, ["famiglia_casa_ruoli", "cibo_vestiario_materiali", "economia_mestieri", "vita_quotidiana"])) addIssue(rows, "Profondita", page, "cultura senza vita quotidiana", "Aggiungi cosa si vede in casa, lavoro, cibo o ruoli.", 4, { area: "Culture" });
        if (!hasValue(dv, page.lingue)) addIssue(rows, "Profondita", page, "cultura senza lingua", "Collega lingua, scrittura o parlanti riconoscibili.", 3, { area: "Culture" });
        if (!hasValue(dv, page.luoghi)) addIssue(rows, "Profondita", page, "cultura senza luoghi", "Collega dove vive, lascia tracce o esercita potere.", 3, { area: "Culture" });
      }
      if (category === "lingua") {
        if (!hasValue(dv, page.culture)) addIssue(rows, "Profondita", page, "lingua senza culture parlanti", "Collega chi la parla o chi la vieta.", 4, { area: "Lingue" });
        if (!anyValue(dv, page, ["suono_ritmo_gesti", "registri"])) addIssue(rows, "Profondita", page, "lingua senza suono o registri", "Aggiungi segnali riconoscibili al tavolo.", 3, { area: "Lingue" });
        if (!anyValue(dv, page, ["parole_note", "modi_di_dire"])) addIssue(rows, "Profondita", page, "lingua senza parole o modi di dire", "Scrivi parole utili come indizi, accesso o colore.", 3, { area: "Lingue" });
      }
      if (category === "luogo") {
        if (!anyValue(dv, page, ["memoria_del_territorio", "tracce_passato", "origine_funzione"])) addIssue(rows, "Profondita", page, "luogo senza memoria o origine", "Aggiungi tracce che rendono il luogo leggibile in scena.", 4, { area: "Luoghi" });
        if (isTerritory(page) && !anyValue(dv, page, ["risorse_strategiche", "economia_quotidiana"])) addIssue(rows, "Profondita", page, "territorio senza economia o risorse", "Collega risorse, mercati o dipendenze.", 3, { area: "Luoghi" });
        if (isPoliticalPlace(page) && !anyValue(dv, page, ["mito_legittimita", "legittimita"])) addIssue(rows, "Profondita", page, "potere politico senza mito di legittimita", "Scrivi perche qualcuno accetta o contesta quel potere.", 3, { area: "Luoghi" });
      }
      if (category === "cosmologia") {
        if (!anyValue(dv, page, ["leggi_metafisiche", "regola"])) addIssue(rows, "Profondita", page, "cosmologia senza leggi metafisiche", "Definisci cosa puo o non puo accadere nel mondo.", 4, { area: "Cosmologia" });
        if (!anyValue(dv, page, ["effetti_su_magia", "effetti_su_culture", "fenomeni_visibili"])) addIssue(rows, "Profondita", page, "cosmologia senza effetti visibili", "Collega effetti su magia, culture o fenomeni osservabili.", 4, { area: "Cosmologia" });
      }
      if (isEvent(dv, page)) {
        if (!hasValue(dv, page.memoria_pubblica)) addIssue(rows, "Profondita", page, "evento senza memoria pubblica", "Scrivi come viene ricordato, negato o distorto.", 4, { area: "Storia" });
        if (!anyValue(dv, page, ["cambiamenti_quotidiani", "conseguenze", "effetti"])) addIssue(rows, "Profondita", page, "evento senza conseguenze quotidiane", "Collega cosa cambia per luoghi, popoli o poteri.", 4, { area: "Storia" });
        if (!anyValue(dv, page, ["causa", "cause"])) addIssue(rows, "Profondita", page, "evento senza causa", "Collega cause o decisioni che lo hanno generato.", 3, { area: "Storia" });
      }
      if (category === "conflitto") {
        if (!anyValue(dv, page, ["cause_profonde", "cause"])) addIssue(rows, "Profondita", page, "conflitto senza cause profonde", "Scrivi cosa lo rende difficile da chiudere.", 5, { area: "Conflitti" });
        if (!anyValue(dv, page, ["risorse_contese", "ferite_storiche"])) addIssue(rows, "Profondita", page, "conflitto senza risorse o ferite", "Collega posta materiale o memoria dolorosa.", 4, { area: "Conflitti" });
        if (!hasValue(dv, page.possibili_paci)) addIssue(rows, "Profondita", page, "conflitto senza possibili paci", "Definisci cosa potrebbe abbassare la pressione.", 3, { area: "Conflitti" });
      }
      if (category === "relazione") {
        if (!anyValue(dv, page, ["origine_storica", "origine"])) addIssue(rows, "Profondita", page, "relazione senza origine storica", "Scrivi come e nata e cosa ha lasciato.", 4, { area: "Relazioni" });
        if (!hasValue(dv, page.versioni_contrapposte)) addIssue(rows, "Profondita", page, "relazione senza versioni contrapposte", "Dai almeno due letture incompatibili del legame.", 3, { area: "Relazioni" });
        if (!anyValue(dv, page, ["dipendenze_materiali", "ferite_aperte"])) addIssue(rows, "Profondita", page, "relazione senza dipendenze o ferite", "Collega costo, debito o bisogno reciproco.", 3, { area: "Relazioni" });
      }
      if (category === "segreto") {
        if (!hasValue(dv, page.verita_profonda)) addIssue(rows, "Profondita", page, "segreto senza verita profonda", "Scrivi cosa e vero dietro gli indizi.", 5, { area: "Segreti" });
        if (!anyValue(dv, page, ["indizi_deboli", "indizi_forti", "prove_decisive", "indizi"])) addIssue(rows, "Profondita", page, "segreto senza livelli di rivelazione", "Prepara indizi deboli, forti e prova decisiva.", 5, { area: "Segreti" });
      }
      if (category === "rotta") {
        if (!hasValue(dv, page.rischi)) addIssue(rows, "Profondita", page, "rotta senza rischio", "Aggiungi rischio, costo o ostacolo di viaggio.", 4, { area: "Rotte" });
        if (!anyValue(dv, page, ["fazioni_controllanti", "fazioni"])) addIssue(rows, "Profondita", page, "rotta senza controllore", "Collega chi controlla o minaccia il passaggio.", 4, { area: "Rotte" });
        if (!anyValue(dv, page, ["risorse_trasportate", "risorse"])) addIssue(rows, "Profondita", page, "rotta senza risorse", "Collega cosa muove e perche importa.", 3, { area: "Rotte" });
        if (["chiusa", "interrotta", "maledetta", "contesa"].includes(String(page.stato_rotta ?? "")) && !anyValue(dv, page, ["conseguenze_se_bloccata", "conseguenze"])) addIssue(rows, "Profondita", page, "rotta bloccata senza conseguenze", "Scrivi cosa cambia se resta chiusa.", 4, { area: "Rotte" });
      }
      if (category === "risorsa") {
        if (!anyValue(dv, page, ["luoghi", "regioni", "luogo"])) addIssue(rows, "Profondita", page, "risorsa senza luogo", "Collega dove si trova, si scambia o si estrae.", 4, { area: "Risorse" });
        if (!anyValue(dv, page, ["fazioni_controllanti", "fazioni"])) addIssue(rows, "Profondita", page, "risorsa senza controllore", "Collega chi decide prezzo, accesso o violenza.", 4, { area: "Risorse" });
        if (!anyValue(dv, page, ["uso_narrativo", "usi", "uso_al_tavolo"])) addIssue(rows, "Profondita", page, "risorsa senza uso narrativo", "Scrivi quale scelta o missione produce.", 3, { area: "Risorse" });
      }
      if (category === "mercato") {
        if (!anyValue(dv, page, ["luogo", "luoghi"])) addIssue(rows, "Profondita", page, "mercato senza luogo", "Collega il nodo fisico o sociale.", 4, { area: "Mercati" });
        if (!hasValue(dv, page.risorse)) addIssue(rows, "Profondita", page, "mercato senza risorse", "Collega merci, servizi o dipendenze.", 3, { area: "Mercati" });
        if (!anyValue(dv, page, ["rischi", "pedaggi"])) addIssue(rows, "Profondita", page, "mercato senza rischio o pedaggio", "Aggiungi attrito, tassa, controllo o pericolo.", 3, { area: "Mercati" });
      }
      if (category === "compendium") {
        if (!anyValue(dv, page, ["culture", "regioni", "luoghi"])) addIssue(rows, "Profondita", page, "elemento senza cultura o regione", "Collega dove vive nel mondo.", 3, { area: "Compendium" });
        if (!anyValue(dv, page, ["uso_narrativo", "usi", "missioni", "uso_al_tavolo"])) addIssue(rows, "Profondita", page, "elemento senza uso narrativo", "Dai un uso pratico: indizio, premio, rischio o scelta.", 3, { area: "Compendium" });
      }
    }
    return sorted(rows);
  }

  function connectionRows(dv, scope) {
    return sorted(scope.pages
      .filter(page => !["mondo", "dashboard", "sessione"].includes(controlCategory(page)))
      .map(page => ({ group: "Connessioni", page, count: linkCount(dv, page), priority: 3 }))
      .filter(row => row.count < 2)
      .map(row => ({
        ...row,
        problem: "scheda isolata o poco collegata",
        action: "Collega almeno mondo, luogo, fazione, missione, conseguenza o indizio."
      })));
  }

  function canonRows(dv, scope) {
    const rows = [];
    const loreCategories = new Set(["evento storico", "lore capture", "segreto", "cosmologia"]);
    for (const page of scope.pages) {
      const category = controlCategory(page);
      const state = String(page.stato_canonico ?? "").toLowerCase();
      const canonical = page.canonico === true || state === "canonico";
      const hasCanonDecision = page.canonico !== undefined || hasValue(dv, page.stato_canonico);

      if (loreCategories.has(category) && !hasCanonDecision) {
        addIssue(rows, "Canone", page, "materiale lore senza stato canonico", "Decidi se e canonico, rumor, leggenda, segreto, falso o retcon.", 3);
      }
      if (canonical && !hasValue(dv, page.fonte) && !hasValue(dv, page.sessioni)) {
        addIssue(rows, "Canone", page, "verita senza provenienza", "Aggiungi fonte o sessione in cui e stata confermata.", 5);
      }
      if (canonical && isEvent(dv, page) && !anyValue(dv, page, ["causa", "cause"])) {
        addIssue(rows, "Canone", page, "evento canonico senza causa", "Collega la causa prima di usarlo come vincolo storico.", 4);
      }
      if (canonical && isEvent(dv, page) && !anyValue(dv, page, ["conseguenze", "effetti", "cambiamenti_quotidiani"])) {
        addIssue(rows, "Canone", page, "evento canonico senza conseguenze", "Collega cosa cambia in luoghi, fazioni o culture.", 4);
      }
      if ((state === "retcon" || hasValue(dv, page.retcon_di)) && !anyValue(dv, page, ["retcon_motivo", "conseguenze", "prossima_mossa"])) {
        addIssue(rows, "Canone", page, "retcon senza motivo o conseguenze", "Scrivi cosa corregge, perche e cosa cambia.", 5);
      }
      if (["rumor", "leggenda", "falso"].includes(state) && !anyValue(dv, page, ["collegamenti", "luoghi", "prossima_mossa", "indizi"])) {
        addIssue(rows, "Canone", page, "voce senza aggancio giocabile", "Collega dove emerge o cosa puo far succedere.", 2);
      }
    }
    return sorted(rows);
  }

  function playabilityRows(dv, scope) {
    const rows = [];
    const ignored = new Set(["mondo", "dashboard", "sessione"]);
    const playFields = ["uso_al_tavolo", "promessa_al_tavolo", "prossima_mossa", "scene", "gancio", "missioni", "sessioni", "conflitti", "propaga_a", "entita_impattate"];
    for (const page of [...scope.pages, ...scope.maps]) {
      const category = controlCategory(page);
      if (ignored.has(category)) continue;
      const links = linkCount(dv, page);
      const gateIssue = liveGateIssue(dv, page, links);
      if (gateIssue) rows.push(gateIssue);
      if (!gateIssue && !anyValue(dv, page, playFields)) {
        addIssue(rows, "Giocabilita", page, "materiale senza uso al tavolo", "Scrivi scena, scelta, rischio, indizio, missione o prossima mossa.", 3);
      }
      if (category === "missione" && !anyValue(dv, page, ["luoghi", "luogo", "fazioni", "committente"])) {
        addIssue(rows, "Giocabilita", page, "missione senza appigli", "Collega luogo, fazione o committente.", 4);
      }
      if (category === "incontro" && !anyValue(dv, page, ["luogo", "luoghi", "missione", "missioni", "posta"])) {
        addIssue(rows, "Giocabilita", page, "incontro senza contesto", "Collega dove avviene e cosa decide.", 4);
      }
    }
    return sorted(rows);
  }

  function playerSafeRows(dv, scope) {
    const rows = [];
    const riskyFields = ["segreto", "segreti", "verita_profonda", "indizi_forti", "prove_decisive", "retroscena_dm", "note_dm"];
    for (const page of [...scope.pages, ...scope.maps]) {
      const category = controlCategory(page);
      const publicish = page.pubblico === true
        || hasValue(dv, page.player_safe)
        || hasValue(dv, page.versione_giocatori)
        || hasValue(dv, page.recap_pubblico)
        || (["dispensa", "mappa", "missione", "luogo"].includes(category) && ["pronto", "in gioco", "consegnato"].includes(String(page.stato ?? "")));

      if (!publicish) continue;
      if (page.pubblico === true && !anyValue(dv, page, ["player_safe", "cosa_mostrare", "recap_pubblico", "versione_giocatori"])) {
        addIssue(rows, "Player-safe", page, "pubblico senza testo sicuro", "Scrivi cosa possono leggere o vedere i giocatori.", 6);
      }
      if ((page.pubblico === true || hasValue(dv, page.player_safe)) && hasPrivateFields(page)) {
        addIssue(rows, "Player-safe", page, "materiale pubblico con campi DM", "Ripulisci segreti, retroscena o note private prima di condividerlo.", 6);
      }
      if (page.pubblico === true && anyValue(dv, page, riskyFields)) {
        addIssue(rows, "Player-safe", page, "segreti presenti in materiale pubblico", "Sposta verita e prove nella parte DM o crea versione giocatori.", 6);
      }
    }
    return sorted(rows);
  }

  function readyUnusedRows(dv, scope) {
    const readyStates = new Set(["pronto", "in gioco", "in corso", "attivo", "accettata"]);
    const tableUseFields = ["uso_al_tavolo", "promessa_al_tavolo", "prossima_mossa", "scene", "gancio"];
    return sorted(scope.pages
      .filter(page => readyStates.has(String(page.stato ?? "")))
      .filter(page => !["mondo", "dashboard", "sessione"].includes(controlCategory(page)))
      .filter(page => !anyValue(dv, page, tableUseFields))
      .map(page => ({
        group: "Uso",
        page,
        problem: "scheda pronta senza uso al tavolo",
        action: "Scrivi uso_al_tavolo, scena, scelta, rischio o prossima mossa.",
        priority: 2
      })));
  }

  function auditBuckets(dv, worldLink = "") {
    const scope = worldbuildingControlScope(dv, worldLink);
    const depth = depthRows(dv, scope);
    const connections = connectionRows(dv, scope);
    const canon = canonRows(dv, scope);
    const playability = playabilityRows(dv, scope);
    const playerSafe = playerSafeRows(dv, scope);
    const readyUnused = readyUnusedRows(dv, scope);
    const priority = sorted([
      ...playerSafe,
      ...depth,
      ...canon,
      ...connections,
      ...playability,
      ...readyUnused
    ]);
    return { scope, depth, connections, canon, playability, playerSafe, readyUnused, priority };
  }

  function firstCard({ title, rows, empty, why }) {
    const first = rows[0];
    return cardHtml({
      title,
      meta: `${rows.length} segnalazioni`,
      body: first?.problem ?? empty,
      importa: first?.action ?? why,
      link: first?.page?.file?.path ?? "",
      cls: `gdr-info-card compact ${rows.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
    });
  }

  function renderWorldbuildingControlNow(dv, worldLink = "") {
    const buckets = auditBuckets(dv, worldLink);
    const next = buckets.priority[0];
    const cards = [
      cardHtml({
        title: next ? `Ripara prima: ${next.group}` : "Ripara prima: niente di urgente",
        meta: next ? pageTitle(next.page) : "Audit pulito",
        body: next?.problem ?? "Nessun buco strutturale evidente con il filtro corrente.",
        importa: next?.action ?? "Puoi passare a nuove scene, pressioni o materiale player-safe.",
        link: next?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${next ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      firstCard({
        title: "Profondita mancante",
        rows: buckets.depth,
        empty: "Nessuna profondita critica mancante.",
        why: "Le schede hanno memoria, costo o conseguenza sufficienti."
      }),
      firstCard({
        title: "Connessioni deboli",
        rows: buckets.connections,
        empty: "Nessuna scheda isolata evidente.",
        why: "Le note hanno abbastanza appigli verso mondo, luoghi, poteri o gioco."
      }),
      firstCard({
        title: "Canone incompleto",
        rows: buckets.canon,
        empty: "Nessun blocco canonico incompleto.",
        why: "Verita, rumor e retcon hanno provenienza e conseguenze sufficienti."
      }),
      firstCard({
        title: "Materiale non giocabile",
        rows: buckets.playability,
        empty: "Il materiale ha un uso pratico.",
        why: "Ogni scheda rilevante puo diventare scena, scelta, rischio o indizio."
      }),
      firstCard({
        title: "Player-safe rischioso",
        rows: buckets.playerSafe,
        empty: "Nessun rischio pubblico evidente.",
        why: "Il materiale condivisibile non espone campi DM secondo i controlli correnti."
      }),
      firstCard({
        title: "Pronte senza uso",
        rows: buckets.readyUnused,
        empty: "Nessuna scheda pronta e inutilizzata evidente.",
        why: "Le schede pronte hanno agganci a sessioni, missioni o conseguenze."
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-worldbuilding-control-now" });
    grid.innerHTML = cards.join("");
  }

  function renderWorldbuildingControlReadiness(dv, worldLink = "") {
    const buckets = auditBuckets(dv, worldLink);
    const gates = gateCounts(buckets.playability);
    const stats = [
      ["Tavolo", gates.tavolo, "senza uso in scena"],
      ["Movimento", gates.movimento, "senza prossima mossa"],
      ["Conseguenze", gates.conseguenza, "senza cosa cambia"],
      ["Collegamenti", gates.collegamento, "senza agganci"],
      ["Profondita", buckets.depth.length, "buchi strutturali"],
      ["Connessioni", buckets.connections.length, "schede isolate"],
      ["Canone", buckets.canon.length, "decisioni incomplete"],
      ["Giocabilita", buckets.playability.length, "interventi totali"],
      ["Player-safe", buckets.playerSafe.length, "rischi pubblici"],
      ["Pronte ferme", buckets.readyUnused.length, "senza uso in gioco"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-worldbuilding-control-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readWorldbuildingControlCockpit() {
    return readJsonRel("z.automazioni/data/runtime/worldbuilding_control_cockpit.json", {
      surfaces: [],
      queues: []
    });
  }

  async function renderWorldbuildingControlQueues(dv, worldLink = "") {
    const cockpit = await readWorldbuildingControlCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = auditBuckets(dv, worldLink);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "depth",
      ["Nota", "Area", "Cosa manca", "Azione"],
      buckets.depth.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.area ?? row.group, row.problem, row.action]),
      "Nessuna profondita critica mancante con il filtro corrente."
    );
    renderTable(
      "connections",
      ["Nota", "Connessioni", "Azione"],
      buckets.connections.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.count, row.action]),
      "Nessuna scheda isolata evidente con il filtro corrente."
    );
    renderTable(
      "canon",
      ["Nota", "Problema", "Azione"],
      buckets.canon.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.problem, row.action]),
      "Nessun canone incompleto evidente con il filtro corrente."
    );
    renderTable(
      "playability",
      ["Nota", "Manca", "Azione", "Workflow esistente"],
      buckets.playability.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.missingLabel ?? row.problem, row.action, row.workflow ?? "Manuale: modifica i campi indicati nella nota."]),
      "Nessun materiale non giocabile evidente con il filtro corrente."
    );
    renderTable(
      "player_safe",
      ["Nota", "Rischio", "Azione"],
      buckets.playerSafe.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.problem, row.action]),
      "Nessun rischio player-safe evidente con il filtro corrente."
    );
    renderTable(
      "ready_unused",
      ["Nota", "Stato", "Uso mancato"],
      buckets.readyUnused.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.page.stato ?? "", row.action]),
      "Nessuna scheda pronta ma inutilizzata con il filtro corrente."
    );
  }

  async function renderWorldbuildingControlSurfaceLinks(dv) {
    const cockpit = await readWorldbuildingControlCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici controllo non configurate",
        action: "Rigenera il contratto Controllo Worldbuilding dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-worldbuilding-control-surfaces" });
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
    renderWorldbuildingControlNow,
    renderWorldbuildingControlQueues,
    renderWorldbuildingControlReadiness,
    renderWorldbuildingControlSurfaceLinks
  };
})
