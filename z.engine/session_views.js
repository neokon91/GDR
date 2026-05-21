// Runtime DataviewJS stabile per i template operativi.
// Le funzioni non ancora migrate vengono lette dal runtime legacy e sovrascritte qui una famiglia alla volta.
(async () => {
  const legacy = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));

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
    renderEmptyState
  };
  const mapViews = (await eval(await app.vault.adapter.read("z.engine/session_maps.js")))(sharedViewContext);
  const dndViews = (await eval(await app.vault.adapter.read("z.engine/session_dnd.js")))(sharedViewContext);
  const playerViews = (await eval(await app.vault.adapter.read("z.engine/session_player.js")))(sharedViewContext);
  const continuityViews = (await eval(await app.vault.adapter.read("z.engine/session_continuity.js")))(sharedViewContext);
  const { continuityIssues } = continuityViews;

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

  function renderSessionAnchorCards(dv, source = null) {
    const session = source ?? dv.current();
    const anchors = [
      ["Mondo", session.mondo, "Collega il mondo o la campagna di riferimento."],
      ["Luoghi", session.luoghi, "Scegli almeno un luogo che possa cambiare stato."],
      ["Fazioni", session.fazioni, "Collega chi vuole qualcosa durante o dopo la sessione."],
      ["Missioni", session.missioni, "Collega obiettivi che i giocatori possono avanzare o compromettere."],
      ["Clock", session.tracciati, "Collega pressione, timer o fronti che avanzano fuori scena."],
      ["PNG", session.personaggi, "Collega PNG che possono reagire alle scelte del tavolo."]
    ];
    const ready = anchors.filter(([, value]) => fieldText(value)).length;
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = anchors.map(([title, value, fallback]) => cardHtml({
      title,
      meta: `${ready}/${anchors.length} ancore collegate`,
      body: fieldText(value) || fallback,
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    dv.paragraph("Le ancore trasformano la sessione in continuita: ogni scelta dovrebbe poter toccare almeno una di queste note.");
  }

  function renderSessionMaterialCards(dv, source = null) {
    const session = source ?? dv.current();
    const groups = [
      ["Incontri", session.incontri, "Collega o crea incontri pronti da giocare.", "BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]"],
      ["Dispense", session.dispense, "Collega handout, indizi o testi da consegnare.", "BUTTON[nuova-dispensa-z-modelli-dispensa-md-default]"],
      ["Mappe", session.mappe, "Collega una mappa zoom, pubblica o DM.", "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"],
      ["Media", [...asArray(session.audio), ...asArray(session.immagini), ...asArray(session.video)], "Audio, immagini e video restano opzionali ma devono essere pronti prima del tavolo.", ""]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = groups.map(([title, value, fallback, button]) => cardHtml({
      title,
      body: fieldText(value) || fallback,
      importa: button || "Controlla i link media prima della sessione.",
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderSessionLiveCards(dv, source = null) {
    const session = source ?? dv.current();
    const cards = [
      ["Attiva", session.attiva === true ? "Sessione marcata attiva." : "Attiva la sessione solo quando e quella al tavolo.", session.attiva === true],
      ["Scena corrente", fieldText(session.scena_corrente) || "Scrivi dove si trovano ora i personaggi.", hasText(session.scena_corrente)],
      ["Decisioni", fieldText(session.decisioni_prese) || "Cattura le scelte che cambiano mondo, relazioni o missioni.", hasLinks(session.decisioni_prese) || hasText(session.decisioni_prese)],
      ["Output", fieldText(session.output_sessione) || "Segna appunti live, indizi rivelati e materiale da smistare.", hasLinks(session.output_sessione) || hasText(session.output_sessione)],
      ["Propagazione", fieldText(session.propaga_a) || "Collega subito dove la scelta dovra propagarsi.", hasLinks(session.propaga_a)]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = cards.map(([title, body, ok]) => cardHtml({
      title,
      body,
      link: session.file?.path ?? "",
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderSessionPostCards(dv, source = null) {
    const session = source ?? dv.current();
    const issues = continuityIssues(session);
    const cards = [
      ["Conseguenze", fieldText(session.conseguenze) || "Registra cio che e cambiato nel mondo.", hasLinks(session.conseguenze) || hasText(session.conseguenze)],
      ["Entita impattate", fieldText(session.entita_impattate ?? session.propaga_a) || "Collega bersagli reali: luoghi, fazioni, PNG, missioni o clock.", hasLinks(session.entita_impattate) || hasLinks(session.propaga_a)],
      ["Stato propagazione", fieldText(session.propagazione_stato) || "Imposta aperta, applicata, propagata o da verificare.", hasText(session.propagazione_stato)],
      ["Recap pubblico", fieldText(session.recap_pubblico) || "Scrivi un recap player-safe senza segreti.", hasText(session.recap_pubblico) || hasLinks(session.recap_pubblico)],
      ["Recap DM", fieldText(session.recap_dm) || "Annota segreti, retcon, prossime mosse e materiali da non mostrare.", hasText(session.recap_dm) || hasLinks(session.recap_dm)],
      ["Gap M6", issues.length ? issues.join(", ") : "Nessun gap evidente sulla sessione.", issues.length === 0]
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });

    grid.innerHTML = cards.map(([title, body, ok]) => cardHtml({
      title,
      body,
      link: session.file?.path ?? "",
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
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

  function renderActiveSessionBanner(dv) {
    const activeList = activeSessions(dv).array();
    const active = activeSession(dv);
    const candidates = sessionCandidates(dv).limit(4).array();

    if (activeList.length > 1) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = activeList.map(p => cardHtml({
        title: pageTitle(p),
        meta: p.data ?? p.stato ?? "sessione attiva",
        body: "Lascia `attiva: true` solo sulla sessione che stai per giocare.",
        link: p.file.path,
        cls: "gdr-info-card compact gdr-kind-missing"
      })).join("");
      dv.paragraph(`Attenzione: ci sono ${activeList.length} sessioni con \`attiva: true\`.`);
      return;
    }

    if (activeList.length === 1) {
      const p = activeList[0];
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = cardHtml({
        title: "Sessione attiva",
        meta: [p.file.name, p.data ?? "", p.stato ?? ""].filter(Boolean).join(" · "),
        body: "Questa e la sessione usata da Preparazione, Durante il Gioco e Post-Sessione.",
        link: p.file.path,
        cls: "gdr-info-card compact gdr-kind-ready"
      });
      return;
    }

    if (active) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = cardHtml({
        title: "Nessuna sessione marcata attiva",
        meta: active.file.name,
        body: "Fallback automatico. Apri questa sessione e imposta `attiva: true` se va al tavolo.",
        link: active.file.path,
        cls: "gdr-info-card compact gdr-kind-missing"
      });
      return;
    }

    if (candidates.length) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = candidates.map(p => cardHtml({
        title: pageTitle(p),
        meta: p.stato ?? "sessione",
        body: "Scegli una sola sessione e imposta `attiva: true`.",
        link: p.file.path,
        cls: "gdr-info-card compact"
      })).join("");
      return;
    }

    dv.paragraph("Nessuna sessione pronta. Crea una sessione da Preparazione Sessione.");
  }

  function renderTableCockpit(dv) {
    const active = activeSession(dv);
    if (!active) {
      dv.paragraph("Nessuna sessione attiva. Apri Preparazione Sessione e crea o prepara una sessione.");
      return;
    }

    const rows = [
      ["Scena corrente", fieldText(active.scena_corrente ?? active.apertura ?? active.scene) || "Apri la sessione e scrivi la prima scena."],
      ["Appunti live", fieldText(active.appunti_live) || "Usa Cattura live o scrivi negli appunti rapidi."],
      ["Decisione da ottenere", fieldText(active.scelta ?? active.decisioni_attese ?? active.domande_al_tavolo) || "Manca una scelta concreta."],
      ["Clock e pressione", fieldText(active.pressioni) || fieldText(active.tracciati) || "Nessuna pressione collegata."],
      ["Handout e materiali", fieldText(active.dispense) || fieldText(active.materiale_pronto) || "Nessun handout pronto."],
      ["PNG presenti", fieldText(active.personaggi) || "Nessun PNG collegato."]
    ];

    const panel = dv.el("div", "", { cls: "gdr-card-grid" });
    panel.innerHTML = rows.map(([title, body]) => cardHtml({ title, body, cls: "gdr-info-card compact" })).join("");
  }

  function renderLiveCommandCenter(dv) {
    const active = activeSession(dv);
    if (!active) {
      renderEmptyState(dv, {
        title: "Nessuna sessione live",
        action: "Apri Preparazione Sessione, scegli una sessione pronta e imposta attiva.",
        link: "Risorse/Preparazione Sessione.md",
        button: "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"
      });
      return;
    }

    const linkedCount = field => dv.array(active?.[field] ?? []).length;
    const liveNotes = pagesFromLinks(dv, active.appunti_live ?? [])
      .array()
      .filter(p => p.stato !== "archiviata" && p.stato !== "ignorata");
    const encounterPages = pagesFromLinks(dv, active.incontri ?? []).array();
    const mapPages = pagesFromLinks(dv, active.mappe ?? []).array();
    const mediaCount = linkedCount("audio") + linkedCount("immagini") + linkedCount("video");
    const party = dv.pages('"Mondi/Personaggi"')
      .where(p => isReal(p) && p.tipo === "pg" && p.stato !== "archiviata")
      .sort(p => p.giocatore ?? p.nome ?? p.file.name, "asc")
      .array();
    const partyStatus = party.length
      ? party.map(p => `${pageTitle(p)} ${p.hp_attuali ?? "?"}/${p.hp_massimi ?? "?"}${p.condizioni ? ` ${fieldText(p.condizioni)}` : ""}`).join(" · ")
      : "Nessun PG configurato in Party Control.";

    const cards = [
      {
        title: "Scena",
        meta: [active.file.name, active.stato].filter(Boolean).join(" · "),
        body: fieldText(active.scena_corrente ?? active.apertura) || "Aggiorna la scena corrente prima di iniziare.",
        link: active.file.path,
        cls: hasText(active.scena_corrente ?? active.apertura) ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Appunti live",
        meta: `${liveNotes.length} da risolvere`,
        body: liveNotes.map(pageTitle).join(", ") || "Cattura eventi, PNG, luoghi o conseguenze mentre emergono.",
        link: "Inbox",
        cls: liveNotes.length ? "gdr-kind-ready" : ""
      },
      {
        title: "Incontri e tiri",
        meta: `${encounterPages.length} incontri collegati`,
        body: encounterPages.map(pageTitle).join(", ") || "Apri un incontro o usa tabelle rapide quando serve una scena risolta subito.",
        link: encounterPages[0]?.file?.path ?? "Risorse/Iniziativa e Combattimenti.md",
        cls: encounterPages.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Mappe",
        meta: `${mapPages.length} mappe collegate`,
        body: mapPages.map(pageTitle).join(", ") || "Collega una mappa alla sessione, all'incontro o al luogo della scena.",
        link: mapPages[0]?.file?.path ?? "Risorse/Mappe/Mappe.md",
        cls: mapPages.length ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Media",
        meta: `${mediaCount} risorse collegate`,
        body: fieldText([...(active.audio ?? []), ...(active.immagini ?? []), ...(active.video ?? [])]) || "Audio, immagini e video restano opzionali ma devono essere pronti prima del tavolo.",
        link: "Risorse/Media Scene.md",
        cls: mediaCount ? "gdr-kind-ready" : ""
      },
      {
        title: "Party",
        meta: `${party.length} PG`,
        body: partyStatus,
        link: "Hub/Party Control.md",
        cls: party.length ? "gdr-kind-ready" : "gdr-kind-missing"
      }
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");

    dv.paragraph("Sequenza live: aggiorna scena -> cattura decisione o appunto -> usa incontro, tiro, mappa o media -> registra conseguenza.");
  }

  function renderPostSessionCommandCenter(dv) {
    const session = activeSession(dv)
      ?? dv.pages('"Mondi/Sessioni"')
        .where(p => isReal(p) && ["in corso", "pronto", "giocata"].includes(p.stato))
        .sort(p => p.file.mtime, "desc")
        .first();

    if (!session) {
      renderEmptyState(dv, {
        title: "Nessuna sessione da chiudere",
        action: "Apri Durante il Gioco o scegli una sessione giocata.",
        link: "Hub/Durante il Gioco.md"
      });
      return;
    }

    const liveNotes = pagesFromLinks(dv, session.appunti_live ?? [])
      .array()
      .filter(p => p.stato !== "archiviata" && p.stato !== "ignorata");
    const unresolved = liveNotes.filter(p => !p.canonico && !p.stato_canonico && !hasLinks(p.entita_impattate) && !hasLinks(p.propaga_a));
    const continuityGaps = [
      session,
      ...liveNotes
    ].flatMap(p => continuityIssues(p));
    const impacted = [
      ...pagesFromLinks(dv, session.missioni ?? []).array(),
      ...pagesFromLinks(dv, session.tracciati ?? []).array(),
      ...pagesFromLinks(dv, session.fazioni ?? []).array(),
      ...pagesFromLinks(dv, session.luoghi ?? []).array()
    ].filter(p => p.stato !== "archiviata");

    const cards = [
      {
        title: "Canone e rumor",
        body: unresolved.length
          ? `${unresolved.length} appunti senza decisione: ${unresolved.map(pageTitle).join(", ")}`
          : "Ogni appunto collegato ha una direzione o non ci sono appunti live.",
        cls: unresolved.length ? "gdr-kind-missing" : "gdr-kind-ready",
        link: session.file.path
      },
      {
        title: "Conseguenze",
        body: fieldText(session.conseguenze) || fieldText(liveNotes.flatMap(p => asArray(p.conseguenze ?? p.impatto))) || "Registra almeno una conseguenza se qualcosa e cambiato nel mondo.",
        cls: hasLinks(session.conseguenze) || hasText(session.conseguenze) ? "gdr-kind-ready" : "gdr-kind-missing",
        link: session.file.path
      },
      {
        title: "Continuita M6",
        body: continuityGaps.length
          ? `Gap da chiudere: ${[...new Set(continuityGaps)].join(", ")}`
          : "Ogni conseguenza ha bersaglio, stato o prossima mossa verificabile.",
        cls: continuityGaps.length ? "gdr-kind-missing" : "gdr-kind-ready",
        link: "Hub/Motore Mondo Vivo.md"
      },
      {
        title: "Missioni e clock",
        body: impacted.map(p => `${pageTitle(p)}${p.prossima_mossa ? `: ${fieldText(p.prossima_mossa)}` : ""}`).join(" · ") || "Collega o aggiorna missioni, clock, fazioni e luoghi toccati.",
        cls: impacted.length ? "gdr-kind-ready" : "gdr-kind-missing",
        link: "Hub/Cosa Succede Fuori Scena.md"
      },
      {
        title: "Recap pubblico",
        body: fieldText(session.recap_pubblico) || "Prepara un recap leggibile e senza segreti per i giocatori.",
        cls: hasText(session.recap_pubblico) || hasLinks(session.recap_pubblico) ? "gdr-kind-ready" : "gdr-kind-missing",
        link: session.file.path
      },
      {
        title: "Prossima apertura",
        body: fieldText(session.prossima_apertura ?? session.output_sessione) || "Scrivi l'apertura o l'output utile per la prossima preparazione.",
        cls: hasText(session.prossima_apertura) || hasLinks(session.output_sessione) || hasText(session.output_sessione) ? "gdr-kind-ready" : "gdr-kind-missing",
        link: session.file.path
      }
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: session.file.name,
      body: card.body,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderPlayableOutline(dv, source = null) {
    const session = source ?? dv.current();
    const rows = [
      ["Apertura", session.apertura, "Leggi o parafrasa la prima scena."],
      ["Obiettivo", session.obiettivo, "Ricorda cosa deve produrre la sessione."],
      ["Scelta", session.scelta, "Metti davanti ai giocatori una decisione che cambia qualcosa."],
      ["Pressione", session.pressioni ?? session.tracciati, "Fai avanzare questa cosa se il party esita."],
      ["Materiale pronto", session.materiale_pronto ?? [...asArray(session.incontri), ...asArray(session.dispense), ...asArray(session.mappe)], "Usa almeno un elemento preparato al tavolo."]
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = rows.map(([title, value, fallback]) => cardHtml({
      title,
      body: fieldText(value) || fallback,
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    dv.paragraph("Sequenza giocabile: apertura -> pressione -> scelta -> conseguenza -> appunto per il post-sessione.");
  }

  return {
    ...legacy,
    renderActiveSessionBanner,
    renderAtlasMapCards: mapViews.renderAtlasMapCards,
    renderCreationFeedback,
    renderConsequenceCards: continuityViews.renderConsequenceCards,
    renderEmptyState,
    renderImpactedNextMoveCards: continuityViews.renderImpactedNextMoveCards,
    renderLiveCommandCenter,
    renderPlaceMapCards: mapViews.renderPlaceMapCards,
    renderPlayableOutline,
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
    renderSessionAnchorCards,
    renderSessionLiveCards,
    renderSessionMaterialCards,
    renderPostSessionCommandCenter,
    renderSessionPostCards,
    renderContinuityGaps: continuityViews.renderContinuityGaps,
    renderContinuityQueue: continuityViews.renderContinuityQueue,
    renderClosableContinuity: continuityViews.renderClosableContinuity,
    renderPropagationTargets: continuityViews.renderPropagationTargets,
    renderWorldImpact: continuityViews.renderWorldImpact,
    renderWorldCreationStatus,
    renderSessionMapCards: mapViews.renderSessionMapCards,
    renderTableCockpit
  };
})()
