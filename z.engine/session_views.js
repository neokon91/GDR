// Runtime DataviewJS stabile per i template operativi.
// Le funzioni non ancora migrate vengono lette dal runtime legacy e sovrascritte qui una famiglia alla volta.
(async () => {
  const gdrCore = await eval(await app.vault.adapter.read("z.engine/gdr_views.js"));
  const escapeHtml = gdrCore.escapeHtml;
  const legacy = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));

  const asArray = value => Array.isArray(value) ? value : value ? [value] : [];
  const hasText = value => String(value ?? "").trim().length > 0;
  const hasLinks = value => asArray(value).length > 0;
  const linkKey = link => link?.path ?? String(link ?? "");
  const isReal = page => Boolean(page);
  const pageFromLink = (dv, link) => dv.page(link?.path ?? link);
  const pagesFromLinks = (dv, links) => dv.array(links ?? []).map(link => pageFromLink(dv, link)).where(Boolean);
  const activeSession = dv => legacy.activeSession(dv);
  const activeSessions = dv => legacy.activeSessions(dv);
  const sessionCandidates = dv => legacy.sessionCandidates(dv);
  const pressure = page => legacy.pressure(page);
  const hasPrivateFields = page => legacy.hasPrivateFields(page);
  const publicCandidate = (page, category) => legacy.publicCandidate(page, category);
  const internalLink = file => `<a class="internal-link" data-href="${escapeHtml(file.path)}" href="${escapeHtml(file.path)}">${escapeHtml(file.name)}</a>`;
  const pageTitle = page => page?.nome ?? page?.name ?? page?.file?.name ?? "";
  const fieldText = value => Array.isArray(value)
    ? value.map(item => item?.path ? item.path.split("/").pop().replace(/\.md$/, "") : String(item ?? "")).filter(Boolean).join(", ")
    : value?.path ? value.path.split("/").pop().replace(/\.md$/, "") : String(value ?? "");
  const pluginIds = {
    "Advanced Canvas": "advanced-canvas",
    "Bases": "bases",
    "Calendarium": "calendarium",
    "Callout Manager": "callout-manager",
    "Dataview": "dataview",
    "Dice Roller": "obsidian-dice-roller",
    "Excalidraw": "obsidian-excalidraw-plugin",
    "Fantasy Content Generator": "fantasy-content-generator",
    "Fantasy Statblocks": "obsidian-5e-statblocks",
    "Folder Notes": "folder-notes",
    "Initiative Tracker": "initiative-tracker",
    "JS Engine": "js-engine",
    "Kanban": "obsidian-kanban",
    "Linter": "obsidian-linter",
    "Maps": "maps",
    "Media Extended": "media-extended",
    "Meta Bind": "obsidian-meta-bind-plugin",
    "Metadata Menu": "metadata-menu",
    "Tasks": "obsidian-tasks-plugin",
    "Templater": "templater-obsidian"
  };
  const pluginSymptoms = {
    "Dataview": "Tabelle e dashboard restano vuote o mostrano codice.",
    "Meta Bind": "I pulsanti BUTTON o gli input non reagiscono.",
    "Templater": "Wizard e creazione note non partono o restano incompleti.",
    "Tasks": "Checklist operative e bacheche non filtrano i task.",
    "Dice Roller": "I tiri dice restano testo.",
    "Fantasy Statblocks": "Le creature non appaiono come schede.",
    "Initiative Tracker": "Gli incontri non entrano nel flusso a turni.",
    "Media Extended": "Audio, video o riferimenti media non si aprono come previsto.",
    "Calendarium": "Date e calendario non vengono mostrati.",
    "Bases": "Le viste tabellari native non sono disponibili.",
    "Maps": "Mappe e marker non vengono mostrati.",
    "Excalidraw": "Mappe fronti e canvas disegnati non si aprono.",
    "Advanced Canvas": "Canvas avanzati e collegamenti visuali non sono disponibili.",
    "Linter": "La pulizia automatica delle note non e disponibile.",
    "Fantasy Content Generator": "Il generatore fantasy non puo creare nuove bozze.",
    "JS Engine": "Alcuni runtime condivisi non vengono eseguiti."
  };
  const workflowPluginFallbacks = {
    dashboard_dm: ["Meta Bind", "Dataview", "Templater", "Tasks"],
    espandi_mondo: ["Templater", "Meta Bind", "Dataview", "Bases", "Maps", "Excalidraw", "Advanced Canvas"],
    prepara_sessione: ["Templater", "Dataview", "Tasks", "Meta Bind", "Dice Roller", "Initiative Tracker", "Fantasy Statblocks", "Media Extended"],
    gioca_live: ["Meta Bind", "Dataview", "Dice Roller", "Initiative Tracker", "Fantasy Statblocks", "Media Extended", "Callout Manager"],
    fuori_scena: ["Meta Bind", "Dataview", "Templater", "Tasks"],
    post_sessione: ["Templater", "Meta Bind", "Tasks", "Dataview", "Calendarium"],
    manutenzione: ["Meta Bind", "Dataview", "Tasks", "Bases", "Linter"],
    inbox_operativa: ["Meta Bind", "Dataview", "Templater", "Fantasy Content Generator"],
    smistamento_bozze: ["Meta Bind", "Dataview", "Templater", "Fantasy Content Generator"],
    quality_report: ["Meta Bind", "Dataview", "JS Engine"],
    stato_campagna: ["Meta Bind", "Dataview", "Templater"]
  };

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

  function pluginStatus(label) {
    const id = pluginIds[label];
    const ok = id ? app.plugins?.enabledPlugins?.has(id) === true : null;
    return { id: id ?? "plugin non mappato", ok };
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

  function emptyStateHtml({ title, action, link = "", button = "", cls = "gdr-info-card compact gdr-kind-missing gdr-empty-state" }) {
    const titleHtml = link
      ? `<a class="internal-link" data-href="${escapeHtml(link)}" href="${escapeHtml(link)}">${escapeHtml(title)}</a>`
      : escapeHtml(title);
    return `
      <div class="${cls}">
        <div class="gdr-card-badge">Azione richiesta</div>
        <div class="gdr-card-title">${titleHtml}</div>
        <div class="gdr-card-line"><strong>Prossimo passo:</strong> ${escapeHtml(action)}</div>
        ${button ? `<div class="gdr-card-line"><code>${escapeHtml(button)}</code></div>` : ""}
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

  const sharedViewContext = {
    activeSession,
    activeSessions,
    asArray,
    cardClass,
    cardHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    linkKey,
    pageFromLink,
    pageTitle,
    pagesFromLinks,
    pressure,
    renderCardGrid,
    renderEmptyState,
    sessionCandidates
  };
  const mapViews = (await eval(await app.vault.adapter.read("z.engine/session_maps.js")))(sharedViewContext);
  const dndViews = (await eval(await app.vault.adapter.read("z.engine/session_dnd.js")))(sharedViewContext);
  const playerViews = (await eval(await app.vault.adapter.read("z.engine/session_player.js")))(sharedViewContext);
  const continuityViews = (await eval(await app.vault.adapter.read("z.engine/session_continuity.js")))(sharedViewContext);
  const { continuityIssues } = continuityViews;
  const sessionViews = (await eval(await app.vault.adapter.read("z.engine/session_runtime.js")))({
    ...sharedViewContext,
    continuityIssues
  });

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

  async function renderWorkflowCommandDeck(dv, workflowId) {
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

        return cardHtml({
          title: action.label || button || (secondary ? "Azione secondaria" : "Azione"),
          meta: button ? `BUTTON[${button}] · ${ready ? "Pronto" : "Da controllare"}` : "Pulsante mancante",
          body: action.use_when || "Condizione d'uso non dichiarata.",
          importa: `${missingReason} Fallback: ${fallback}`,
          cls: `gdr-info-card compact ${ready ? "gdr-kind-ready" : "gdr-kind-missing"}`
        });
      };

      cards.push(cardHtml({
        title: "Flusso operativo",
        meta: workflowId,
        body: workflow.user_goal || "Obiettivo workflow non dichiarato.",
        importa: entryPoints.length
          ? missingEntries.length
            ? `Entry point mancanti: ${missingEntries.join(", ")}.`
            : `Entry point verificati: ${entryPoints.join(", ")}.`
          : "Manca una pagina operativa collegata.",
        cls: `gdr-info-card compact ${entryPoints.length && !missingEntries.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }));

      for (const plugin of plugins) {
        const status = pluginStatus(plugin);
        cards.push(cardHtml({
          title: plugin,
          meta: status.ok === true ? "Plugin attivo" : status.ok === false ? "Plugin da attivare" : "Verifica manuale",
          body: pluginSymptoms[plugin] ?? "Plugin dichiarato nel workflow YAML.",
          importa: status.ok === true
            ? `Plugin attivo: ${status.id}.`
            : `Se le azioni non partono, apri Impostazioni > Plugin community e verifica ${status.id}.`,
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

      cards.push(cardHtml({
        title: "Se un controllo non risponde",
        meta: "Fallback operativo",
        body: "Leggi la condizione d'uso dell'azione, apri manualmente la pagina o il template indicato e completa i campi richiesti nella nota.",
        importa: "Il deck ora distingue plugin mancanti, template Meta Bind assenti ed entry point non leggibili.",
        cls: "gdr-info-card compact"
      }));

      grid.innerHTML = cards.join("");
    } catch (error) {
      renderEmptyState(dv, {
        title: "Workflow runtime non disponibile",
        action: `Rigenera ${dataPath}; errore: ${error.message}`,
        button: "npm run generate:workflow-data"
      });
    }
  }

  function renderPluginTroubleshooting(dv, workflowId = "") {
    const labels = workflowPluginFallbacks[workflowId] ?? ["Dataview", "Meta Bind", "Templater", "Tasks", "Dice Roller", "Fantasy Statblocks"];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = labels.map(label => {
      const status = pluginStatus(label);
      return cardHtml({
        title: label,
        meta: status.ok === true ? "Pronto" : status.ok === false ? "Da controllare" : "Verifica manuale",
        body: pluginSymptoms[label] ?? "Controlla che il plugin sia installato, abilitato e aggiornato.",
        importa: status.ok === true ? `Plugin attivo: ${status.id}` : `Apri Impostazioni > Plugin community e verifica ${status.id}.`,
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

  function renderM7FamilyCards(dv, source = null, family = "generica") {
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

  return {
    ...legacy,
    escapeHtml: gdrCore.escapeHtml,
    renderActiveSessionBanner: sessionViews.renderActiveSessionBanner,
    renderAtlasMapCards: mapViews.renderAtlasMapCards,
    renderCreationFeedback,
    renderConsequenceCards: continuityViews.renderConsequenceCards,
    renderEmptyState,
    renderImpactedNextMoveCards: continuityViews.renderImpactedNextMoveCards,
    renderLiveCommandCenter: sessionViews.renderLiveCommandCenter,
    renderPlaceMapCards: mapViews.renderPlaceMapCards,
    renderPlayableOutline: sessionViews.renderPlayableOutline,
    renderPlayerMap: playerViews.renderPlayerMap,
    renderPlayerPortalStatus: playerViews.renderPlayerPortalStatus,
    renderPlayerRecap: playerViews.renderPlayerRecap,
    renderPlayerView: playerViews.renderPlayerView,
    renderPublicSafety: playerViews.renderPublicSafety,
    renderPublicStats: playerViews.renderPublicStats,
    renderM7FamilyCards,
    renderM11ContinuityChain: continuityViews.renderM11ContinuityChain,
    renderCombatReadiness: dndViews.renderCombatReadiness,
    renderDnd55MaterialPipeline: dndViews.renderDnd55MaterialPipeline,
    renderSessionAnchorCards: sessionViews.renderSessionAnchorCards,
    renderSessionLiveCards: sessionViews.renderSessionLiveCards,
    renderSessionMaterialCards: sessionViews.renderSessionMaterialCards,
    renderPostSessionCommandCenter: sessionViews.renderPostSessionCommandCenter,
    renderSessionPostCards: sessionViews.renderSessionPostCards,
    renderContinuityGaps: continuityViews.renderContinuityGaps,
    renderContinuityQueue: continuityViews.renderContinuityQueue,
    renderClosableContinuity: continuityViews.renderClosableContinuity,
    renderPropagationTargets: continuityViews.renderPropagationTargets,
    renderWorldImpact: continuityViews.renderWorldImpact,
    renderWorldCreationStatus,
    renderPluginTroubleshooting,
    renderWorkflowCommandDeck,
    renderSessionMapCards: mapViews.renderSessionMapCards,
    renderTableCockpit: sessionViews.renderTableCockpit
  };
})()
