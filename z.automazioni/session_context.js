(() => {
  const ACTIVE_STATES = ["pronto", "preparazione"];
  const PLAY_STATES = ["in corso", ...ACTIVE_STATES];
  const LINK_FIELDS = [
    "campagne",
    "luoghi",
    "personaggi",
    "missioni",
    "creature",
    "incontri",
    "dispense",
    "mappe",
    "audio",
    "immagini",
    "video",
    "fazioni",
    "oggetti",
    "appunti_live"
  ];

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));

  const linkKey = link => link?.path ?? String(link ?? "");
  const isReal = page => Boolean(page) && !String(page.file?.name ?? "").startsWith("Prova -");
  const pageFromLink = (dv, link) => dv.page(link?.path ?? link);
  const pagesFromLinks = (dv, links) => dv.array(links ?? []).map(link => pageFromLink(dv, link)).where(Boolean);
  const internalLink = file => `<a class="internal-link" data-href="${escapeHtml(file.path)}" href="${escapeHtml(file.path)}">${escapeHtml(file.name)}</a>`;
  const asArray = value => Array.isArray(value) ? value : value ? [value] : [];
  const hasText = value => String(value ?? "").trim().length > 0;
  const hasLinks = value => asArray(value).length > 0;
  const pageTitle = page => page?.nome ?? page?.name ?? page?.file?.name ?? "";
  const fieldText = value => Array.isArray(value)
    ? value.map(item => item?.path ? item.path.split("/").pop().replace(/\.md$/, "") : String(item ?? "")).filter(Boolean).join(", ")
    : value?.path ? value.path.split("/").pop().replace(/\.md$/, "") : String(value ?? "");
  const safeText = value => escapeHtml(fieldText(value));

  function activeSession(dv) {
    const explicit = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.attiva === true)
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();

    if (explicit) {
      return explicit;
    }

    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && ACTIVE_STATES.includes(p.stato))
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();
  }

  function activeSessions(dv) {
    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.attiva === true)
      .sort(p => p.data ?? "0000-00-00", "desc");
  }

  function sessionCandidates(dv) {
    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && (p.attiva === true || PLAY_STATES.includes(p.stato)))
      .sort(p => (p.attiva === true ? "1" : "0") + "-" + (p.data ?? "0000-00-00"), "desc");
  }

  function currentCampaign(session) {
    return session?.campagna ?? session?.campagne?.[0] ?? "";
  }

  function linkedPages(dv, source, field) {
    return pagesFromLinks(dv, source?.[field] ?? []);
  }

  function linkedPageSet(dv, source, field) {
    return new Set(dv.array(source?.[field] ?? []).map(linkKey).array());
  }

  function sessionContext(dv) {
    const active = activeSession(dv);
    const linked = {};
    const linkedSets = {};

    for (const field of LINK_FIELDS) {
      linked[field] = linkedPages(dv, active, field);
      linkedSets[field] = linkedPageSet(dv, active, field);
    }

    return {
      active,
      campaign: currentCampaign(active),
      world: active?.mondo ?? "",
      linked,
      linkedSets
    };
  }

  function fallbackPages(dv, source, fallbackQuery, predicate = () => true, sortField = "file.name", direction = "asc", limit = 12) {
    const linked = dv.array(source ?? []).map(link => pageFromLink(dv, link)).where(Boolean);
    if (linked.length) {
      return linked;
    }

    return dv.pages(fallbackQuery)
      .where(p => isReal(p) && predicate(p))
      .sort(p => p?.[sortField] ?? "", direction)
      .limit(limit);
  }

  function pressure(page) {
    return Number(page?.pressione ?? page?.pericolo ?? 0) || 0;
  }

  function progressRatio(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || 0;
    return max > 0 ? value / max : 0;
  }

  function hasPrivateFields(page) {
    // La vista giocatori non deve linkare note che contengono segnali tipici da DM.
    return hasLinks(page?.segreti)
      || hasText(page?.segreto)
      || hasText(page?.verita_nascosta)
      || hasText(page?.prossima_mossa)
      || hasLinks(page?.segreti_rivelabili)
      || hasLinks(page?.pressioni);
  }

  function publicCandidate(page, category) {
    // Regola conservativa: mostra solo cio che e pubblico o gia emerso chiaramente in gioco.
    if (!isReal(page) || page?.stato === "archiviata") return false;
    if (page?.pubblico === true) return true;
    if (category === "missione") return ["accettata", "in corso", "completata"].includes(page?.stato);
    if (category === "personaggio" || category === "luogo") return page?.stato === "in gioco";
    if (category === "dispensa") return page?.stato === "consegnato";
    if (category === "mappa") return page?.pubblico === true;
    if (category === "sessione") return page?.pubblico === true || page?.stato === "giocata";
    if (category === "tracciato") return page?.pubblico === true;
    return false;
  }

  function readiness(page) {
    // Punteggio pratico: una nota e utile al tavolo se ha stato, collegamenti, pressione e prossima mossa.
    const category = page?.categoria ?? "";
    const missing = [];
    let score = 0;

    if (["pronto", "in gioco", "in corso", "accettata", "attivo"].includes(page?.stato)) score += 2;
    if (hasText(page?.prossima_mossa)) score += 2;
    if (hasLinks(page?.luoghi) || hasText(page?.luogo) || hasText(page?.luogo_padre)) score += 1;
    if (hasLinks(page?.personaggi) || hasLinks(page?.fazioni) || hasText(page?.committente)) score += 1;
    if (pressure(page) > 0) score += 1;
    if (hasText(page?.obiettivo) || hasText(page?.posta) || hasText(page?.innesco)) score += 1;

    if (["missione", "fazione", "tracciato", "conflitto"].includes(category) && !hasText(page?.prossima_mossa)) missing.push("prossima mossa");
    if (["missione", "sessione", "luogo", "fazione", "evento storico"].includes(category) && !hasLinks(page?.mondo) && !hasText(page?.mondo)) missing.push("mondo");
    if (category === "sessione" && !hasText(page?.obiettivo)) missing.push("obiettivo sessione");
    if (category === "tracciato" && !(Number(page?.progress_max ?? 0) > 0)) missing.push("progress max");
    if (category === "luogo" && !hasText(page?.pericolo) && !hasText(page?.stabilita) && pressure(page) === 0) missing.push("pressione/pericolo");

    return {
      score,
      missing,
      ready: score >= 4 && missing.length === 0,
      label: missing.length ? `Manca: ${missing.join(", ")}` : "Pronto al tavolo"
    };
  }

  function cardHtml({ title, meta = "", body = "", link = "", cls = "gdr-info-card" }) {
    const linkedTitle = link
      ? `<a class="internal-link" data-href="${escapeHtml(link)}" href="${escapeHtml(link)}">${escapeHtml(title)}</a>`
      : escapeHtml(title);
    return `
      <div class="${cls}">
        <div class="gdr-card-title">${linkedTitle}</div>
        ${meta ? `<div class="gdr-card-meta">${escapeHtml(meta)}</div>` : ""}
        ${body ? `<div class="gdr-card-line">${escapeHtml(body)}</div>` : ""}
      </div>
    `;
  }

  function renderActions(dv) {
    // Home e DM Dashboard usano questa funzione per dire al DM cosa fare adesso, non per mostrare un archivio.
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
      meta: `${p.categoria ?? "pressione"} · pressione ${pressure(p)}`,
      body: p.prossima_mossa ?? "Serve una prossima mossa chiara.",
      link: p.file.path
    }));

    const container = dv.el("div", "", { cls: "gdr-card-grid compact" });
    container.innerHTML = actions.slice(0, 6).map(cardHtml).join("");
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

  function renderHome(dv) {
    // Sintesi da app: stato sessione, inbox, pressioni e materiale pubblico in quattro numeri leggibili.
    const active = activeSession(dv);
    const publicCount = dv.pages('"Mondi/Missioni" OR "Mondi/Personaggi" OR "Mondi/Luoghi" OR "Mondi/Dispense"')
      .where(p => publicCandidate(p, p.categoria))
      .length;
    const stats = [
      ["Sessione", active ? "Attiva" : "Assente", active?.file.name ?? "Crea o prepara una sessione"],
      ["Inbox", dv.pages('"Inbox"').where(p => isReal(p) && p.file.name !== "Inbox" && !["smistata", "archiviata", "ignorata"].includes(p.stato)).length, "Da smistare"],
      ["Pressioni", dv.pages('"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni"').where(p => isReal(p) && p.stato !== "archiviata" && pressure(p) > 0).length, "Fronti vivi"],
      ["Pubblico", publicCount, "Elementi mostrabili"]
    ];

    const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");

    renderActions(dv);
  }

  function renderTableCockpit(dv) {
    // Prima schermata da tavolo: solo cio che serve nei prossimi minuti di gioco.
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

  function renderPostSessionFocus(dv) {
    const session = activeSession(dv)
      ?? dv.pages('"Mondi/Sessioni"')
        .where(p => isReal(p) && ["in corso", "pronto", "giocata"].includes(p.stato))
        .sort(p => p.file.mtime, "desc")
        .first();

    if (!session) {
      dv.paragraph("Nessuna sessione da chiudere. Apri Durante il Gioco o seleziona una sessione giocata.");
      return;
    }

    const liveNotes = dv.array(session.appunti_live ?? [])
      .map(link => pageFromLink(dv, link))
      .where(Boolean)
      .array();

    const cards = [
      ["Sessione da chiudere", session.file.name, "Porta questa nota a `giocata` quando il recap e pronto.", session.file.path],
      ["Appunti live", liveNotes.length || fieldText(session.appunti_live) || "0", "Decidi cosa diventa canonico, conseguenza o rumor.", ""],
      ["Decisioni", fieldText(session.decisioni_prese ?? session.decisioni_attese ?? session.scelta) || "Compila le decisioni prese al tavolo.", ""],
      ["Clock", fieldText(session.tracciati) || fieldText(session.pressioni) || "Aggiorna almeno una pressione se e avanzata.", ""],
      ["Materiale usato", fieldText(session.dispense ?? session.materiale_pronto) || "Segna handout consegnati, mappe usate e ricompense.", ""],
      ["Prossima apertura", fieldText(session.prossima_apertura ?? session.prossime_mosse_fuori_scena) || "Scrivi cosa apre la prossima sessione.", ""]
    ];

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.map(([title, body, meta, link]) => cardHtml({
      title,
      meta,
      body,
      link,
      cls: "gdr-info-card compact"
    })).join("");

    if (liveNotes.length) {
      dv.header(3, "Appunti Live Da Processare");
      dv.table(
        ["Nota", "Tipo", "Stato", "Canone", "Collegamenti"],
        liveNotes.map(p => [p.file.link, p.tipo ?? p.categoria ?? "", p.stato ?? "", p.stato_canonico ?? p.canonico ?? "", p.collegamenti ?? p.luoghi ?? p.fazioni ?? []])
      );
    }
  }

  function preparationTarget(dv) {
    const explicit = activeSession(dv);
    if (explicit) return explicit;

    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && ["preparazione", "bozza", "pronto"].includes(p.stato))
      .sort(p => p.data ?? "9999-99-99", "asc")
      .first();
  }

  function renderPreparationFocus(dv) {
    const session = preparationTarget(dv);
    if (!session) {
      dv.paragraph("Nessuna sessione da preparare. Crea una sessione, poi torna qui e riempi i cinque blocchi sotto.");
      return;
    }

    const checks = [
      ["Obiettivo", hasText(session.obiettivo), fieldText(session.obiettivo) || "Scrivi cosa devono ottenere o decidere i personaggi."],
      ["Prima scena", hasText(session.apertura) || hasLinks(session.scene) || hasLinks(session.scenes), fieldText(session.apertura ?? session.scene ?? session.scenes) || "Prepara dove si apre la sessione e cosa succede subito."],
      ["Scelta", hasText(session.scelta) || hasLinks(session.domande_al_tavolo), fieldText(session.scelta ?? session.domande_al_tavolo) || "Formula una scelta concreta, non una lista di lore."],
      ["Pressione", hasLinks(session.pressioni) || hasLinks(session.tracciati), fieldText(session.pressioni ?? session.tracciati) || "Collega un clock, una missione o una fazione che avanza se il party esita."],
      ["Materiale", hasLinks(session.materiale_pronto) || hasLinks(session.incontri) || hasLinks(session.dispense) || hasLinks(session.mappe), fieldText(session.materiale_pronto ?? [...(asArray(session.incontri)), ...(asArray(session.dispense)), ...(asArray(session.mappe))]) || "Collega almeno un incontro, handout o mappa pronta."]
    ];

    const ready = checks.filter(([, ok]) => ok).length;
    const title = `${session.file.name} · ${ready}/5 blocchi pronti`;
    dv.paragraph(`Sessione da preparare: ${internalLink(session.file)} · ${escapeHtml(session.stato ?? "senza stato")}`);

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = checks.map(([label, ok, body]) => cardHtml({
      title: `${ok ? "OK" : "Manca"} · ${label}`,
      meta: title,
      body,
      link: session.file.path,
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    if (ready >= 5) {
      dv.paragraph("Output concreto: la sessione ha i cinque blocchi minimi. Segna `stato: pronto`, poi apri Durante il Gioco.");
    } else {
      dv.paragraph("Output concreto richiesto: apri la sessione linkata e completa solo i blocchi segnati come Manca.");
    }
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
    // Le card pubbliche evitano link diretti quando la nota contiene campi privati.
    const title = pageTitle(page);
    const meta = [category, page.stato, page.tipo].filter(Boolean).join(" · ");
    const body = category === "missione"
      ? fieldText(page.obiettivo ?? page.posta ?? page.committente ?? page.luoghi)
      : category === "personaggio"
        ? fieldText(page.ruolo ?? page.luogo ?? page.atteggiamento)
        : category === "luogo"
          ? fieldText(page.impressione ?? page.bioma ?? page.tipo)
          : fieldText(page.tipo ?? page.luogo ?? page.personaggi);
    const safeLink = page.pubblico === true && !hasPrivateFields(page) ? page.file.path : "";
    return cardHtml({ title, meta, body, link: safeLink, cls: `gdr-info-card compact gdr-kind-${category}` });
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
    const latest = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && (p.pubblico === true || p.stato === "giocata"))
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();

    if (!latest) {
      dv.paragraph("Nessun recap pubblico ancora disponibile.");
      return;
    }

    const rows = [
      ["Ultima sessione", latest.file.name],
      ["Quando", latest.data ?? latest.data_mondo ?? "data non indicata"],
      ["Dove", fieldText(latest.luoghi) || fieldText(latest.mondo) || "luogo non indicato"],
      ["Cosa resta aperto", fieldText(latest.domande_al_tavolo) || fieldText(latest.missioni) || "nessun obiettivo pubblico collegato"]
    ];

    const panel = dv.el("div", "", { cls: "gdr-card-grid compact" });
    panel.innerHTML = rows.map(([title, body]) => cardHtml({ title, body, cls: "gdr-info-card compact" })).join("");
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

  function renderPlayerView(dv) {
    // Vista giocatori: portale safe-by-default, card semplici e link solo quando la nota e marcata pubblica.
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
      const body = `HP ${hp}${p.hp_temporanei ? ` · temp ${p.hp_temporanei}` : ""}${p.ispirazione ? " · ispirazione" : ""}`;
      return cardHtml({ title: pageTitle(p), meta, body, link: p.file.path, cls: "gdr-info-card compact gdr-kind-party" });
    });

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = cards.join("");
  }

  return {
    ACTIVE_STATES,
    PLAY_STATES,
    escapeHtml,
    internalLink,
    linkKey,
    isReal,
    pageFromLink,
    pagesFromLinks,
    activeSession,
    activeSessions,
    sessionCandidates,
    currentCampaign,
    linkedPages,
    linkedPageSet,
    sessionContext,
    fallbackPages,
    pressure,
    readiness,
    hasPrivateFields,
    publicCandidate,
    renderActions,
    renderActiveSessionBanner,
    renderHome,
    renderPreparationFocus,
    renderTableCockpit,
    renderPlayableOutline,
    renderPostSessionFocus,
    renderPartyControl,
    renderPlayerRecap,
    renderPublicSafety,
    renderPlayerView
  };
})()
