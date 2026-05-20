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
  const isReal = page => Boolean(page);
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

  function sessionWorldAnchors(session) {
    const anchors = [
      ["Mondo", hasText(session?.mondo) || hasLinks(session?.mondo), fieldText(session?.mondo) || "Collega il mondo di riferimento."],
      ["Luogo", hasLinks(session?.luoghi) || hasText(session?.luogo), fieldText(session?.luoghi ?? session?.luogo) || "Collega almeno un luogo concreto."],
      ["Potere o PNG", hasLinks(session?.fazioni) || hasLinks(session?.personaggi), fieldText(session?.fazioni ?? session?.personaggi) || "Collega una fazione, religione, PNG o potere attivo."],
      ["Missione", hasLinks(session?.missioni), fieldText(session?.missioni) || "Collega almeno una missione o arco aperto."],
      ["Pressione", hasLinks(session?.tracciati) || hasLinks(session?.pressioni), fieldText(session?.tracciati ?? session?.pressioni) || "Collega un clock, fronte, minaccia o pressione."],
      ["Mappa o scena", hasLinks(session?.mappe) || hasLinks(session?.incontri) || hasLinks(session?.materiale_pronto), fieldText(session?.mappe ?? session?.incontri ?? session?.materiale_pronto) || "Collega una mappa, scena o materiale pronto."]
    ];
    const ready = anchors.filter(([, ok]) => ok).length;
    return { anchors, ready, required: 3 };
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
    if (category === "missione") {
      return (page?.pubblico === true || ["accettata", "in corso", "completata"].includes(page?.stato))
        && (hasText(page?.player_safe) || hasText(page?.recap_pubblico));
    }
    if (category === "personaggio" || category === "luogo") {
      return (page?.pubblico === true || page?.stato === "in gioco") && hasText(page?.player_safe);
    }
    if (category === "dispensa") return page?.stato === "consegnato";
    if (category === "mappa") return page?.pubblico === true;
    if (category === "sessione") return page?.pubblico === true || page?.stato === "giocata";
    if (category === "tracciato") return page?.pubblico === true;
    if (page?.pubblico === true) return true;
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

  function operationalCard(page, options = {}) {
    const title = options.title ?? pageTitle(page);
    const action = options.azione
      ?? page.prossima_mossa
      ?? page.uso_al_tavolo
      ?? page.gancio
      ?? page.innesco
      ?? "Apri la nota e compila la prossima mossa.";
    const why = options.importa
      ?? fieldText(page.player_safe ?? page.posta ?? page.obiettivo ?? page.entita_impattate ?? page.propaga_a)
      ?? "Questa nota puo cambiare la scena o il mondo.";
    return cardHtml({
      title,
      meta: options.meta ?? [page.categoria ?? page.tipo, page.stato].filter(Boolean).join(" · "),
      stato: options.stato ?? "",
      pressione: options.pressione ?? (pressure(page) || ""),
      azione: action,
      importa: why,
      link: options.link ?? page.file?.path ?? "",
      badge: options.badge ?? (cardKind(page) === "archivio" ? "Archivio" : "Operativa"),
      cls: options.cls ?? cardClass(page)
    });
  }

  function postCard(page, options = {}) {
    const needsPropagation = !hasLinks(page.entita_impattate) || !hasLinks(page.propaga_a);
    const action = options.azione
      ?? (page.tipo === "conseguenza" ? "Applica conseguenza e propagazione." : "Decidi canone, rumor, conseguenza o archivio.");
    const why = options.importa
      ?? (fieldText(page.entita_impattate ?? page.propaga_a ?? page.collegamenti)
        || (needsPropagation ? "Manca entita impattata o propagazione." : "Ha bersagli da aggiornare."));
    return cardHtml({
      title: options.title ?? pageTitle(page),
      meta: options.meta ?? [page.tipo ?? page.categoria, page.stato ?? page.stato_canonico].filter(Boolean).join(" · "),
      azione: action,
      importa: why,
      link: options.link ?? page.file?.path ?? "",
      badge: "Post-sessione",
      cls: options.cls ?? cardClass(page, "gdr-info-card compact", needsPropagation ? "gdr-kind-missing" : "gdr-kind-ready")
    });
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

  function sessionLinkedOrFallback(dv, active, field, fallbackQuery, predicate = () => true, limit = 8) {
    const linked = dv.array(active?.[field] ?? [])
      .map(link => pageFromLink(dv, link))
      .where(Boolean)
      .array();

    if (linked.length) return linked;

    return dv.pages(fallbackQuery)
      .where(p => isReal(p) && predicate(p))
      .sort(p => Number(p.pressione ?? p.progress_value ?? 0), "desc")
      .limit(limit)
      .array();
  }

  function renderSessionLoreCards(dv) {
    const active = activeSession(dv);
    if (!active) {
      renderEmptyState(dv, {
        title: "Nessun contesto lore",
        action: "Rendi attiva una sessione prima di usare la lore al tavolo.",
        link: "Risorse/Preparazione Sessione.md"
      });
      return;
    }

    const world = linkKey(active.mondo);
    const places = new Set(dv.array(active.luoghi ?? []).map(linkKey).array());
    const factions = new Set(dv.array(active.fazioni ?? []).map(linkKey).array());
    const sessions = new Set([active.file.path]);
    const pages = dv.pages('"Mondi/Timeline" OR "Inbox"')
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => p.categoria === "evento storico" || p.categoria === "lore capture")
      .where(p => linkKey(p.mondo) === world
        || dv.array(p.luoghi ?? []).some(link => places.has(linkKey(link)))
        || dv.array(p.fazioni ?? []).some(link => factions.has(linkKey(link)))
        || dv.array(p.sessioni ?? []).some(link => sessions.has(linkKey(link))))
      .sort(p => p.data_mondo ?? p.file.mtime, "desc")
      .limit(8)
      .array();

    renderCardGrid(dv, pages, p => operationalCard(p, {
      badge: p.stato_canonico === "canonico" || p.canonico === true ? "Canone" : "Lore",
      azione: p.uso_al_tavolo ?? p.prossima_mossa ?? p.impatto ?? "Usa solo se entra in scena o diventa una conseguenza.",
      importa: fieldText(p.player_safe ?? p.collegamenti ?? p.entita_impattate) || "Collega la scena al mondo.",
      cls: cardClass(p, "gdr-info-card compact")
    }), {
      title: "Nessuna lore pronta per questa sessione",
      action: "Cattura un evento live o collega una timeline alla sessione.",
      button: "BUTTON[evento-live-z-modelli-live-evento-md]"
    });
  }

  function renderSessionMissionCards(dv) {
    const active = activeSession(dv);
    const activeFactions = new Set(dv.array(active?.fazioni ?? []).map(link => link.path ?? String(link)).array());
    const pages = sessionLinkedOrFallback(
      dv,
      active,
      "missioni",
      '"Mondi/Missioni"',
      p => ["proposta", "accettata", "in corso"].includes(p.stato)
        && (!activeFactions.size || dv.array(p.fazioni ?? []).some(link => activeFactions.has(link.path ?? String(link)))),
      8
    );

    renderCardGrid(dv, pages, p => operationalCard(p, {
      badge: "Missione",
      azione: p.prossima_mossa ?? p.scelta ?? "Metti davanti al party una scelta o un costo.",
      importa: fieldText(p.player_safe ?? p.posta ?? p.obiettivo ?? p.committente) || "Obiettivo della sessione o pressione laterale.",
      cls: cardClass(p, "gdr-info-card compact")
    }), {
      title: "Nessuna missione collegata",
      action: "Collega una missione alla sessione o crea una missione rapida.",
      button: "BUTTON[nuova-missione-z-modelli-dm-missione-md]"
    });
  }

  function renderSessionClockCards(dv) {
    const active = activeSession(dv);
    const sessionMissions = new Set(dv.array(active?.missioni ?? []).map(link => link.path ?? String(link)).array());
    const sessionFactions = new Set(dv.array(active?.fazioni ?? []).map(link => link.path ?? String(link)).array());
    const pages = sessionLinkedOrFallback(
      dv,
      active,
      "tracciati",
      '"Mondi/Tracciati"',
      p => !["archiviata", "completato", "fallito"].includes(p.stato)
        && (sessionMissions.size === 0 && sessionFactions.size === 0
          || dv.array(p.missioni ?? []).some(link => sessionMissions.has(link.path ?? String(link)))
          || dv.array(p.fazioni ?? []).some(link => sessionFactions.has(link.path ?? String(link)))),
      8
    );

    renderCardGrid(dv, pages, p => {
      const value = Math.max(0, Number(p.progress_value ?? 0));
      const max = Math.max(1, Number(p.progress_max ?? 6));
      const pct = Math.round((Math.min(value, max) / max) * 100);
      return `
        <div class="${cardClass(p, "gdr-info-card compact")}">
          <div class="gdr-card-badge">Clock</div>
          <div class="gdr-card-title">${internalLink(p.file)}</div>
          <div class="gdr-card-meta">${escapeHtml([p.tipo ?? "clock", p.stato ?? "senza stato", `pressione ${pressure(p)}`].join(" · "))}</div>
          <div class="gdr-track-bar"><span style="width: ${pct}%"></span></div>
          <div class="gdr-card-line"><strong>Azione:</strong> ${escapeHtml(p.prossima_mossa ?? "Avanza il clock se il party esita o fallisce.")}</div>
          <div class="gdr-card-line"><strong>Perche importa:</strong> ${escapeHtml(`${value}/${max} · ${fieldText(p.innesco ?? p.posta) || "innesco non indicato"}`)}</div>
        </div>
      `;
    }, {
      title: "Nessun clock pronto",
      action: "Crea o collega un tracciato per rendere visibile la pressione.",
      button: "BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]"
    });
  }

  function renderCanonDecisionCards(dv) {
    const pages = dv.pages('"Inbox" OR "Mondi/Timeline"')
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => p.categoria === "lore capture" || p.categoria === "evento storico" || p.stato_canonico || p.canonico !== undefined)
      .sort(p => p.file.mtime, "desc")
      .limit(12)
      .array();

    renderCardGrid(dv, pages, p => postCard(p, {
      azione: p.canonico === true || p.stato_canonico === "canonico"
        ? "Conferma canone e aggiorna timeline o entita collegate."
        : "Scegli: marca canonico, rumor, conseguenza o archivia.",
      importa: fieldText(p.impatto ?? p.collegamenti ?? p.sessioni) || "Decide cosa resta vero nel mondo."
    }), {
      title: "Niente da canonizzare",
      action: "Dopo il tavolo, crea un appunto live o una conseguenza da Post Sessione.",
      button: "BUTTON[wizard-conseguenza]"
    });
  }

  function renderConsequenceCards(dv) {
    const pages = dv.pages('"Mondi" OR "Inbox"')
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => hasLinks(p.conseguenze) || hasLinks(p.entita_impattate) || hasLinks(p.propaga_a) || hasText(p.prossima_mossa))
      .sort(p => p.file.mtime, "desc")
      .limit(16)
      .array();

    renderCardGrid(dv, pages, p => postCard(p, {
      azione: p.prossima_mossa ? `Aggiorna prossima mossa: ${fieldText(p.prossima_mossa)}` : "Applica conseguenza e scegli la prossima mossa.",
      importa: fieldText(p.entita_impattate ?? p.propaga_a ?? p.conseguenze) || "Manca propagazione esplicita."
    }), {
      title: "Nessuna conseguenza aperta",
      action: "Crea una conseguenza o collega entita impattate agli appunti live.",
      button: "BUTTON[wizard-conseguenza]"
    });
  }

  function renderNextMoveCards(dv) {
    const pages = dv.pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Personaggi" OR "Mondi/Tracciati" OR "Mondi/Missioni" OR "Mondi/Conflitti"')
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => pressure(p) >= 5 || Number(p.progress_value ?? 0) >= 3 || hasText(p.prossima_mossa) || hasText(p.innesco))
      .sort(p => pressure(p), "desc")
      .limit(12)
      .array();

    renderCardGrid(dv, pages, p => operationalCard(p, {
      badge: "Prossima mossa",
      azione: p.prossima_mossa ?? "Scrivi cosa fa questa entita fuori scena.",
      importa: fieldText(p.innesco ?? p.posta ?? p.entita_impattate ?? p.propaga_a) || "Determina cosa cambia prima della prossima sessione."
    }), {
      title: "Nessuna prossima mossa evidente",
      action: "Apri Cosa Succede Fuori Scena e scegli una pressione da muovere.",
      link: "Hub/Cosa Succede Fuori Scena.md"
    });
  }

  function renderImpactedNextMoveCards(dv) {
    const targetKeys = new Set();
    dv.pages('"Mondi" OR "Inbox"')
      .where(p => isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata")
      .where(p => hasLinks(p.conseguenze) || hasLinks(p.entita_impattate) || hasLinks(p.propaga_a))
      .forEach(p => {
        [...asArray(p.entita_impattate), ...asArray(p.propaga_a)].forEach(link => targetKeys.add(linkKey(link)));
      });

    const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Religioni"')
      .where(p => isReal(p) && p.stato !== "archiviata")
      .where(p => targetKeys.has(p.file.path) || targetKeys.has(p.file.name))
      .sort(p => pressure(p), "desc")
      .limit(12)
      .array();

    renderCardGrid(dv, pages, p => operationalCard(p, {
      badge: "Impattata",
      azione: p.prossima_mossa
        ? `Verifica o cambia: ${fieldText(p.prossima_mossa)}`
        : "Apri la nota e compila il campo Prossima mossa nella Scheda Viva.",
      importa: fieldText(p.conseguenze ?? p.propaga_a ?? p.entita_impattate ?? p.missioni) || "Questa entita e stata toccata da una conseguenza.",
      cls: cardClass(p, "gdr-info-card compact", hasText(p.prossima_mossa) ? "gdr-kind-ready" : "gdr-kind-missing")
    }), {
      title: "Nessuna entita impattata da aggiornare",
      action: "Applica una conseguenza scegliendo entita_impattate o propaga_a.",
      button: "BUTTON[applica-conseguenza]"
    });
  }

  function codexArticleCard(page, category) {
    const ready = codexArticleReadiness(page);
    const extra = ready.ready ? "gdr-kind-ready" : "gdr-kind-missing";
    return cardHtml({
      title: pageTitle(page),
      meta: [category, page.tipo, page.stato].filter(Boolean).join(" · "),
      azione: fieldText(page.gancio ?? page.uso_al_tavolo ?? page.prossima_mossa ?? page.impressione ?? page.vuole) || "Compila gancio o uso al tavolo.",
      importa: ready.ready
        ? fieldText(page.player_safe ?? page.connessioni ?? page.luoghi ?? page.fazioni ?? page.missioni)
        : `Manca: ${ready.missing.join(", ")}`,
      link: page.file.path,
      badge: page.pubblico === true ? "Player-safe" : "Codex",
      cls: cardClass(page, "gdr-info-card compact", [page.pubblico === true ? "gdr-card-player" : "", extra].filter(Boolean).join(" "))
    });
  }

  function hasCodexIdentity(page) {
    return hasText(page?.gancio)
      || hasText(page?.impressione)
      || hasText(page?.identita)
      || hasText(page?.descrizione)
      || hasText(page?.vuole)
      || hasText(page?.agenda)
      || hasText(page?.tipo);
  }

  function hasCodexTableUse(page) {
    return hasText(page?.uso_al_tavolo)
      || hasText(page?.promessa_al_tavolo)
      || hasText(page?.prossima_mossa)
      || hasText(page?.scene)
      || hasText(page?.innesco)
      || hasText(page?.posta);
  }

  function hasCodexDmLayer(page) {
    if (page?.pubblico === true) return true;
    return hasText(page?.segreto)
      || hasLinks(page?.segreti)
      || hasText(page?.verita_nascosta)
      || hasText(page?.prossima_mossa)
      || hasLinks(page?.propaga_a)
      || hasLinks(page?.entita_impattate);
  }

  function hasCodexConnections(page) {
    return hasLinks(page?.connessioni)
      || hasLinks(page?.luoghi)
      || hasLinks(page?.fazioni)
      || hasLinks(page?.personaggi)
      || hasLinks(page?.missioni)
      || hasLinks(page?.tracciati)
      || hasText(page?.luogo)
      || hasText(page?.luogo_padre)
      || hasText(page?.mondo);
  }

  function codexArticleReadiness(page) {
    const checks = [
      ["identita", hasCodexIdentity(page)],
      ["al tavolo", hasCodexTableUse(page)],
      ["player-safe", hasText(page?.player_safe)],
      ["DM", hasCodexDmLayer(page)],
      ["connessioni vive", hasCodexConnections(page)]
    ];
    const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
    return { ready: missing.length === 0, missing };
  }

  function renderCodexEditorial(dv, worldLink = "") {
    const worldPath = linkKey(worldLink);
    const inWorld = p => !worldPath || linkKey(p.mondo) === worldPath || p.file.path === worldPath;
    const sections = [
      ["Luoghi iconici", '"Mondi/Luoghi"', "luogo", p => hasText(p.player_safe) || hasText(p.gancio) || hasText(p.impressione)],
      ["Poteri in movimento", '"Mondi/Fazioni" OR "Mondi/Religioni"', "fazione", p => pressure(p) > 0 || hasText(p.prossima_mossa)],
      ["Volti da ricordare", '"Mondi/Personaggi"', "personaggio", p => p.tipo === "png" && (p.stato === "in gioco" || hasText(p.player_safe) || hasText(p.vuole))],
      ["Misteri e timeline causale", '"Mondi/Timeline" OR "Mondi/Storia" OR "Inbox"', "evento", p => p.categoria === "evento storico" || p.categoria === "lore capture"],
      ["Pronti da mostrare", '"Mondi" OR "Risorse/Mappe"', "pubblico", p => p.pubblico === true && hasText(p.player_safe)]
    ];

    for (const [title, source, category, predicate] of sections) {
      dv.header(3, title);
      const pages = dv.pages(source)
        .where(p => isReal(p) && p.stato !== "archiviata" && inWorld(p) && predicate(p))
        .sort(p => Number(p.pressione ?? 0), "desc")
        .limit(8)
        .array();

      renderCardGrid(dv, pages, p => codexArticleCard(p, category), {
        title: `${title}: niente pronto`,
        action: "Compila gancio, player_safe o connessioni vive negli articoli core.",
        link: "Hub/Atlante del Mondo.md"
      });
    }
  }

  function renderCodexReadyShowcase(dv, worldLink = "") {
    const worldPath = linkKey(worldLink);
    const inWorld = p => !worldPath || linkKey(p.mondo) === worldPath || p.file.path === worldPath;
    const pages = dv.pages('"Mondi" OR "Risorse/Mappe"')
      .where(p => isReal(p) && p.stato !== "archiviata" && inWorld(p))
      .where(p => p.pubblico === true && hasText(p.player_safe) && !hasPrivateFields(p))
      .sort(p => p.file.mtime, "desc")
      .limit(10)
      .array();

    renderCardGrid(dv, pages, p => cardHtml({
      title: pageTitle(p),
      meta: [p.categoria ?? p.tipo, "player-safe"].filter(Boolean).join(" · "),
      azione: fieldText(p.player_safe),
      importa: fieldText(p.luoghi ?? p.connessioni ?? p.mondo) || "Mostrabile senza aprire campi DM.",
      link: p.file.path,
      badge: "Da mostrare",
      cls: cardClass(p, "gdr-info-card compact", "gdr-card-player gdr-kind-ready")
    }), {
      title: "Nessun articolo pronto da mostrare",
      action: "Marca pubblico true e compila player_safe su almeno una nota del Codex.",
      link: "Hub/Vista Giocatori.md"
    });
  }

  function renderCodexReadyToPlay(dv, worldLink = "") {
    const worldPath = linkKey(worldLink);
    const inWorld = p => !worldPath || linkKey(p.mondo) === worldPath || p.file.path === worldPath;
    const playableCategories = new Set(["luogo", "personaggio", "fazione", "missione", "tracciato", "relazione", "evento storico", "oggetto", "cultura", "religione"]);
    const pages = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.stato !== "archiviata" && inWorld(p))
      .where(p => playableCategories.has(String(p.categoria ?? "")))
      .where(p => hasCodexIdentity(p) && hasCodexTableUse(p) && hasCodexConnections(p))
      .sort(p => pressure(p), "desc")
      .limit(10)
      .array();

    renderCardGrid(dv, pages, p => {
      const ready = codexArticleReadiness(p);
      return cardHtml({
        title: pageTitle(p),
        meta: [p.categoria ?? p.tipo, p.stato, ready.ready ? "completo" : "parziale"].filter(Boolean).join(" · "),
        azione: fieldText(p.uso_al_tavolo ?? p.gancio ?? p.prossima_mossa),
        importa: ready.ready ? fieldText(p.connessioni ?? p.luoghi ?? p.fazioni ?? p.missioni) : `Completa: ${ready.missing.join(", ")}`,
        link: p.file.path,
        badge: "Da giocare",
        cls: cardClass(p, "gdr-info-card compact", ready.ready ? "gdr-kind-ready" : "gdr-kind-missing")
      });
    }, {
      title: "Nessun articolo pronto da giocare",
      action: "Compila identita, uso al tavolo e connessioni vive negli articoli core.",
      link: "Hub/Atlante del Mondo.md"
    });
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
      dv.header(3, "Da Applicare Ora");
      const liveGrid = dv.el("div", "", { cls: "gdr-card-grid compact" });
      liveGrid.innerHTML = liveNotes.map(p => {
        const action = p.archivia_appunto === true
          ? "Archivia questo appunto."
          : p.canonizza_evento === true || p.canonico === true
            ? "Canonizza e aggiorna la timeline."
            : p.crea_conseguenza === true || p.tipo === "conseguenza"
              ? "Applica conseguenza e propagazione."
              : p.marca_rumor === true || p.stato_canonico === "rumor"
                ? "Mantieni come rumor collegato."
                : "Decidi: canonico, rumor, conseguenza o archivia.";
        const impact = fieldText(p.entita_impattate ?? p.propaga_a ?? p.collegamenti) || "Manca entita impattata o propagazione.";

        return cardHtml({
          title: pageTitle(p),
          meta: [p.tipo ?? p.categoria, p.stato ?? p.stato_canonico].filter(Boolean).join(" · "),
          azione: action,
          importa: impact,
          link: p.file.path,
          cls: `gdr-info-card compact ${impact.startsWith("Manca") ? "gdr-kind-missing" : "gdr-kind-ready"}`
        });
      }).join("");
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

    const worldAnchors = sessionWorldAnchors(session);
    const checks = [
      ["Ancore mondo", worldAnchors.ready >= worldAnchors.required, `${worldAnchors.ready}/${worldAnchors.required} minime · ${worldAnchors.anchors.filter(([, ok]) => ok).map(([label]) => label).join(", ") || "nessuna ancora"}`],
      ["Obiettivo", hasText(session.obiettivo), fieldText(session.obiettivo) || "Scrivi cosa devono ottenere o decidere i personaggi."],
      ["Prima scena", hasText(session.apertura) || hasLinks(session.scene) || hasLinks(session.scenes), fieldText(session.apertura ?? session.scene ?? session.scenes) || "Prepara dove si apre la sessione e cosa succede subito."],
      ["Scelta", hasText(session.scelta) || hasLinks(session.domande_al_tavolo), fieldText(session.scelta ?? session.domande_al_tavolo) || "Formula una scelta concreta, non una lista di lore."],
      ["Pressione", hasLinks(session.pressioni) || hasLinks(session.tracciati), fieldText(session.pressioni ?? session.tracciati) || "Collega un clock, una missione o una fazione che avanza se il party esita."],
      ["Materiale", hasLinks(session.materiale_pronto) || hasLinks(session.incontri) || hasLinks(session.dispense) || hasLinks(session.mappe), fieldText(session.materiale_pronto ?? [...(asArray(session.incontri)), ...(asArray(session.dispense)), ...(asArray(session.mappe))]) || "Collega almeno un incontro, handout o mappa pronta."]
    ];

    const ready = checks.filter(([, ok]) => ok).length;
    const title = `${session.file.name} · ${ready}/${checks.length} blocchi pronti`;
    dv.paragraph(`Sessione da preparare: ${internalLink(session.file)} · ${escapeHtml(session.stato ?? "senza stato")}`);

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
    grid.innerHTML = checks.map(([label, ok, body]) => cardHtml({
      title: `${ok ? "OK" : "Manca"} · ${label}`,
      meta: title,
      body,
      link: session.file.path,
      cls: `gdr-info-card compact ${ok ? "gdr-kind-ready" : "gdr-kind-missing"}`
    })).join("");

    if (ready >= checks.length) {
      dv.paragraph("Output concreto: la sessione e radicata nel mondo e ha i blocchi minimi. Segna `stato: pronto`, poi apri Durante il Gioco.");
    } else {
      dv.paragraph("Output concreto richiesto: prima collega almeno tre ancore mondo, poi completa i blocchi segnati come Manca.");
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
      const body = `HP ${hp}${p.hp_temporanei ? ` · temp ${p.hp_temporanei}` : ""}${p.condizioni ? ` · ${fieldText(p.condizioni)}` : ""}${p.spotlight ? ` · spotlight ${p.spotlight}` : ""}${p.ispirazione ? " · ispirazione" : ""}`;
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
    sessionWorldAnchors,
    readiness,
    hasPrivateFields,
    publicCandidate,
    renderActions,
    renderHome,
    renderPreparationFocus,
    renderPostSessionFocus,
    renderSessionLoreCards,
    renderSessionMissionCards,
    renderSessionClockCards,
    renderCanonDecisionCards,
    renderConsequenceCards,
    renderNextMoveCards,
    renderImpactedNextMoveCards,
    renderCodexEditorial,
    renderCodexReadyShowcase,
    renderCodexReadyToPlay,
    renderEmptyState,
    renderPartyControl
  };
})()
