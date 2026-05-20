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

  function referencesPage(dv, page, target, fields) {
    const targetKeys = new Set([target?.file?.path, target?.file?.name, linkKey(target?.file?.link)].filter(Boolean));
    return fields.some(field => dv.array(page?.[field] ?? [])
      .some(link => targetKeys.has(linkKey(link)) || targetKeys.has(link?.path) || targetKeys.has(String(link ?? ""))));
  }

  function renderWorldImpact(dv, source = null) {
    const page = source ?? dv.current();
    const playerAction = fieldText(page.azione_giocatori ?? page.scelta ?? page.scelte ?? page.decisioni ?? page.output_sessione)
      || "Annota la scelta o azione dei giocatori che ha mosso il mondo.";
    const consequence = fieldText(page.conseguenza_potenziale ?? page.conseguenza ?? page.conseguenze ?? page.impatto)
      || "Definisci la conseguenza concreta prodotta dall'azione.";
    const propagation = fieldText(page.entita_impattate ?? page.propaga_a)
      || "Collega le entita impattate e dove si propaga l'effetto.";
    const nextMove = fieldText(page.prossima_mossa)
      || "Scrivi cosa accade se nessuno interviene.";
    const chainRows = [
      ["1. Azione giocatori", playerAction, page.azione_giocatori ?? page.scelta ?? page.scelte ?? page.decisioni ?? page.output_sessione],
      ["2. Conseguenza", consequence, page.conseguenza_potenziale ?? page.conseguenza ?? page.conseguenze ?? page.impatto],
      ["3. Propagazione", propagation, page.entita_impattate ?? page.propaga_a],
      ["4. Prossima mossa", nextMove, page.prossima_mossa]
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = chainRows.map(([title, body, value]) => cardHtml({
      title,
      body,
      cls: `gdr-info-card compact ${fieldText(value) ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    const incomingFields = ["connessioni", "entita_impattate", "propaga_a", "missioni", "tracciati", "luoghi", "fazioni", "personaggi"];
    const incoming = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.file.path !== page.file.path && referencesPage(dv, p, page, incomingFields))
      .sort(p => Number(p.pressione ?? p.pericolo ?? 0), "desc")
      .limit(8)
      .array();

    if (!incoming.length) {
      dv.paragraph("Nessuna nota sta ancora reagendo a questa. Collega entita impattate, propaga_a o connessioni vive.");
      return;
    }

    renderCardGrid(dv, incoming, p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo, p.stato].filter(Boolean).join(" · "),
      azione: fieldText(p.prossima_mossa ?? p.uso_al_tavolo ?? p.gancio) || "Apri la nota e definisci la reazione.",
      importa: fieldText(p.entita_impattate ?? p.propaga_a ?? p.connessioni) || "Questa nota punta alla nota corrente.",
      link: p.file.path,
      badge: "Reazione",
      cls: cardClass(p)
    }), {
      title: "Nessuna reazione collegata",
      action: "Collega questa nota da missioni, fazioni, luoghi o conseguenze."
    });
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

  function mapCard(page, options = {}) {
    const show = fieldText(page.player_safe ?? page.cosa_mostrare ?? page.luoghi ?? page.luogo) || "Mostra solo i luoghi e i riferimenti gia sicuri.";
    const hide = page.pubblico === true
      ? "Nessun segreto DM nella mappa pubblica."
      : fieldText(page.cosa_nascondere ?? page.prossima_mossa ?? page.segreti) || "Nascondi segreti, prossime mosse e layer non rivelati.";
    const playerVersion = fieldText(page.versione_giocatori);
    const action = options.azione ?? (fieldText(page.uso_al_tavolo ?? page.gancio) || "Apri la mappa quando orientamento o scelta spaziale contano.");
    const why = [
      `Mostra: ${show}`,
      `Nascondi: ${hide}`,
      playerVersion ? `Giocatori: ${playerVersion}` : ""
    ].filter(Boolean).join(" · ");

    return cardHtml({
      title: pageTitle(page),
      meta: [page.uso ?? page.tipo, page.pubblico === true ? "pubblica" : "DM", page.stato].filter(Boolean).join(" · "),
      azione: action,
      importa: why,
      link: page.file.path,
      badge: options.badge ?? "Mappa",
      cls: cardClass(page, "gdr-info-card compact", page.pubblico === true ? "gdr-card-player gdr-kind-ready" : "")
    });
  }

  function mapPagesForWorld(dv, worldLink = "", limit = 12) {
    const worldPath = linkKey(worldLink);
    return dv.pages('"Risorse/Mappe"')
      .where(p => isReal(p) && p.file.name !== "Mappe" && p.stato !== "archiviata")
      .where(p => !worldPath || linkKey(p.mondo) === worldPath)
      .sort(p => p.pubblico === true ? 0 : 1, "asc")
      .sort(p => p.uso ?? "", "asc")
      .limit(limit)
      .array();
  }

  function renderAtlasMapCards(dv, worldLink = "") {
    renderCardGrid(dv, mapPagesForWorld(dv, worldLink, 16), p => mapCard(p), {
      title: "Nessuna mappa pronta",
      action: "Crea una mappa zoom o collega almeno un luogo a una mappa esistente.",
      button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
    });
  }

  function renderPlaceMapCards(dv, place = dv.current()) {
    const placeKeys = new Set([place?.file?.path, place?.file?.name, linkKey(place?.file?.path)].filter(Boolean));
    const linked = pagesFromLinks(dv, place?.mappe ?? []).array();
    const matchesPlace = p => placeKeys.has(linkKey(p.luogo))
      || dv.array(p.luoghi ?? []).some(link => placeKeys.has(linkKey(link)) || placeKeys.has(link?.path));
    const pages = linked.length
      ? linked
      : dv.pages('"Risorse/Mappe"')
        .where(p => isReal(p) && p.file.name !== "Mappe" && p.stato !== "archiviata" && matchesPlace(p))
        .sort(p => p.pubblico === true ? 0 : 1, "asc")
        .sort(p => p.uso ?? "", "asc")
        .limit(8)
        .array();

    renderCardGrid(dv, pages, p => mapCard(p, {
      badge: "Mappa luogo",
      azione: fieldText(p.uso_al_tavolo) || "Apri questa mappa quando il luogo entra in scena."
    }), {
      title: "Nessuna mappa collegata al luogo",
      action: "Compila il campo mappe del luogo o crea una mappa zoom collegata a questa nota.",
      button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
    });
  }

  function renderSessionMapCards(dv) {
    const active = activeSession(dv);
    if (!active) {
      renderEmptyState(dv, {
        title: "Nessuna sessione attiva",
        action: "Rendi attiva una sessione prima di scegliere le mappe al tavolo.",
        link: "Risorse/Preparazione Sessione.md"
      });
      return;
    }

    const seen = new Set();
    const collect = links => pagesFromLinks(dv, links ?? [])
      .array()
      .filter(p => {
        if (!p?.file?.path || seen.has(p.file.path)) return false;
        seen.add(p.file.path);
        return true;
      });
    const pages = [
      ...collect(active.mappe),
      ...dv.array(active.incontri ?? [])
        .map(link => pageFromLink(dv, link))
        .where(Boolean)
        .array()
        .flatMap(p => collect(p.mappe))
    ];

    if (!pages.length) {
      const placeKeys = new Set(dv.array(active.luoghi ?? []).map(linkKey).array());
      dv.pages('"Risorse/Mappe"')
        .where(p => isReal(p) && p.file.name !== "Mappe" && p.stato !== "archiviata")
        .where(p => placeKeys.has(linkKey(p.luogo)) || dv.array(p.luoghi ?? []).some(link => placeKeys.has(linkKey(link))))
        .sort(p => p.uso ?? "", "asc")
        .limit(8)
        .forEach(p => {
          if (!seen.has(p.file.path)) {
            seen.add(p.file.path);
            pages.push(p);
          }
        });
    }

    renderCardGrid(dv, pages, p => mapCard(p, {
      badge: "Mappa sessione",
      azione: fieldText(p.uso_al_tavolo) || "Usa questa mappa nella scena corrente."
    }), {
      title: "Nessuna mappa collegata alla sessione",
      action: "Collega una mappa alla sessione, a un incontro o a un luogo della sessione.",
      button: "BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]"
    });
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

  function publicRows(dv, source, category, limit = 8) {
    return dv.pages(source)
      .where(p => publicCandidate(p, category))
      .sort(p => Number(p.pressione ?? 0), "desc")
      .limit(limit)
      .array();
  }

  function publicMapRows(dv, limit = 4) {
    return dv.pages('"Risorse/Mappe"')
      .where(p => publicCandidate(p, "mappa"))
      .sort(p => p.file.mtime, "desc")
      .limit(limit)
      .array();
  }

  function publicCard(page, category) {
    const title = pageTitle(page);
    const meta = category === "mappa"
      ? [page.uso, "mappa condivisa"].filter(Boolean).join(" · ")
      : category === "missione"
        ? "obiettivo conosciuto"
        : category === "personaggio"
          ? "volto noto"
          : category === "luogo"
            ? "luogo scoperto"
            : [category, page.tipo].filter(Boolean).join(" · ");
    const body = category === "missione"
      ? fieldText(page.player_safe ?? page.recap_pubblico)
      : category === "personaggio"
        ? fieldText(page.player_safe)
        : category === "luogo"
          ? fieldText(page.player_safe)
          : fieldText(page.player_safe ?? page.uso_al_tavolo ?? page.tipo ?? page.luogo ?? page.personaggi);
    const safeLink = page.pubblico === true && !hasPrivateFields(page) ? page.file.path : "";
    return cardHtml({
      title,
      meta,
      azione: body || "Informazione pubblica da completare.",
      importa: fieldText(page.luoghi ?? page.luogo ?? page.mondo ?? page.recap_pubblico) || "Elemento emerso al tavolo.",
      link: safeLink,
      badge: "Player",
      cls: `gdr-info-card compact gdr-card-player gdr-kind-${category}`
    });
  }

  function renderPublicStats(dv) {
    const stats = [
      ["Missioni", publicRows(dv, '"Mondi/Missioni"', "missione", 99).length, "obiettivi visibili"],
      ["PNG", publicRows(dv, '"Mondi/Personaggi"', "personaggio", 99).length, "volti noti"],
      ["Luoghi", publicRows(dv, '"Mondi/Luoghi"', "luogo", 99).length, "posti scoperti"],
      ["Handout", publicRows(dv, '"Mondi/Dispense"', "dispensa", 99).length, "materiali consegnati"],
      ["Mappe", publicMapRows(dv, 99).length, "atlante condiviso"]
    ];

    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-player-stats" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  function renderPlayerRecap(dv) {
    const recaps = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && (p.pubblico === true || p.stato === "giocata"))
      .sort(p => p.data ?? "0000-00-00", "desc")
      .limit(5)
      .array();

    if (!recaps.length) {
      dv.paragraph("Nessun recap pubblico ancora disponibile.");
      return;
    }

    const panel = dv.el("div", "", { cls: "gdr-card-grid compact" });
    panel.innerHTML = recaps.map(p => cardHtml({
      title: p.file.name,
      meta: p.data ?? p.data_mondo ?? "data non indicata",
      body: fieldText(p.recap_pubblico ?? p.luoghi ?? p.missioni) || "Recap pubblico da compilare.",
      link: p.pubblico === true && !hasPrivateFields(p) ? p.file.path : "",
      cls: "gdr-info-card compact gdr-kind-sessione"
    })).join("");
  }

  function renderPlayerMap(dv) {
    const map = publicMapRows(dv, 1)[0];
    if (!map) {
      dv.paragraph("Nessuna mappa pubblica disponibile.");
      return;
    }

    const panel = dv.el("div", "", { cls: "gdr-card-grid compact" });
    panel.innerHTML = cardHtml({
      title: pageTitle(map),
      meta: [map.uso, map.mondo?.path ? map.mondo.path.split("/").pop().replace(/\.md$/, "") : ""].filter(Boolean).join(" · "),
      body: fieldText(map.player_safe ?? map.luoghi ?? map.luogo) || "Mappa pubblica pronta.",
      link: map.file.path,
      badge: "Mappa condivisa",
      cls: "gdr-info-card compact gdr-card-player gdr-kind-mappa"
    });
  }

  function renderPublicSafety(dv) {
    const risky = dv.pages('"Mondi" OR "Risorse/Mappe"')
      .where(p => isReal(p) && p.pubblico === true && hasPrivateFields(p))
      .sort(p => p.file.path, "asc")
      .limit(12)
      .array();

    if (!risky.length) {
      dv.paragraph("Controllo pubblico pulito: nessuna nota marcata pubblica contiene campi DM evidenti.");
      return;
    }

    dv.table(["Nota", "Rischio"], risky.map(p => [p.file.link, "pubblico: true con campi segreti/prossima mossa/pressioni"]));
  }

  function renderPlayerPortalStatus(dv) {
    const risky = dv.pages('"Mondi" OR "Risorse/Mappe"')
      .where(p => isReal(p) && p.pubblico === true && hasPrivateFields(p))
      .array();
    const missingSafeText = dv.pages('"Mondi" OR "Risorse/Mappe"')
      .where(p => isReal(p) && p.pubblico === true && !hasText(p.player_safe) && !hasText(p.recap_pubblico) && p.categoria !== "sessione")
      .array();
    const sessionsWithoutRecap = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.stato === "giocata" && !hasText(p.recap_pubblico))
      .array();
    const publicMapsWithoutText = dv.pages('"Risorse/Mappe"')
      .where(p => isReal(p) && p.pubblico === true && !hasText(p.player_safe) && !hasLinks(p.luoghi) && !hasText(p.cosa_mostrare))
      .array();
    const deliveredHandouts = publicRows(dv, '"Mondi/Dispense"', "dispensa", 99);

    const checks = [
      ["Anti-segreti", !risky.length, risky.map(pageTitle).join(", ") || "Nessuna nota pubblica contiene campi DM evidenti."],
      ["Testo player-safe", !missingSafeText.length, missingSafeText.map(pageTitle).join(", ") || "Le note pubbliche hanno testo mostrabile o recap."],
      ["Recap", !sessionsWithoutRecap.length, sessionsWithoutRecap.map(pageTitle).join(", ") || "Le sessioni giocate hanno recap pubblico o non sono esposte."],
      ["Mappe", !publicMapsWithoutText.length, publicMapsWithoutText.map(pageTitle).join(", ") || "Le mappe pubbliche hanno descrizione, luoghi o cosa mostrare."],
      ["Dispense", deliveredHandouts.length > 0, deliveredHandouts.map(pageTitle).join(", ") || "Nessun handout consegnato ancora visibile."]
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = checks.map(([label, ok, body]) => cardHtml({
      title: `${ok ? "OK" : "Manca"} · ${label}`,
      body,
      cls: `gdr-info-card compact gdr-card-player ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");
  }

  function renderPlayerView(dv) {
    renderPublicStats(dv);

    const sections = [
      ["Obiettivi", publicRows(dv, '"Mondi/Missioni"', "missione"), "missione"],
      ["PNG conosciuti", publicRows(dv, '"Mondi/Personaggi"', "personaggio"), "personaggio"],
      ["Luoghi scoperti", publicRows(dv, '"Mondi/Luoghi"', "luogo"), "luogo"],
      ["Handout", publicRows(dv, '"Mondi/Dispense"', "dispensa"), "dispensa"],
      ["Mappe condivise", publicMapRows(dv), "mappa"]
    ];

    for (const [title, pages, category] of sections) {
      dv.header(2, title);
      if (!pages.length) {
        dv.paragraph("Niente da mostrare per ora.");
        continue;
      }
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      grid.innerHTML = pages.map(page => publicCard(page, category)).join("");
    }
  }

  return {
    ...legacy,
    renderActiveSessionBanner,
    renderAtlasMapCards,
    renderCreationFeedback,
    renderEmptyState,
    renderLiveCommandCenter,
    renderPlaceMapCards,
    renderPlayableOutline,
    renderPlayerMap,
    renderPlayerPortalStatus,
    renderPlayerRecap,
    renderPlayerView,
    renderPublicSafety,
    renderPublicStats,
    renderPostSessionCommandCenter,
    renderWorldImpact,
    renderWorldCreationStatus,
    renderSessionMapCards,
    renderTableCockpit
  };
})()
