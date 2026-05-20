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
    if (category === "missione") return ["accettata", "in corso", "completato"].includes(page?.stato);
    if (category === "personaggio" || category === "luogo") return page?.stato === "in gioco";
    if (category === "dispensa") return page?.stato === "consegnato";
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
      actions.push({ title: "Gioca la sessione attiva", meta: active.file.name, body: "Apri il cockpit del tavolo.", link: "Durante il Gioco.md" });
    } else if (prep) {
      actions.push({ title: "Finisci la preparazione", meta: prep.file.name, body: "C'e una sessione in preparazione.", link: "Risorse/Preparazione Sessione.md" });
    } else {
      actions.push({ title: "Crea una sessione", meta: "Nessuna sessione attiva", body: "Parti dalla DM Dashboard.", link: "1. DM Dashboard.md" });
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
      dv.paragraph("Nessuna sessione attiva. Apri la DM Dashboard e crea o prepara una sessione.");
      return;
    }

    const rows = [
      ["Obiettivo", active.obiettivo ?? "Non indicato"],
      ["Scena", fieldText(active.scene) || "Nessuna scena pronta"],
      ["Domande", fieldText(active.domande_al_tavolo) || "Nessuna domanda"],
      ["Segreti rivelabili", fieldText(active.segreti_rivelabili) || "Nessuno"],
      ["Pressioni", fieldText(active.pressioni) || fieldText(active.tracciati) || "Nessuna pressione collegata"],
      ["Appunti live", fieldText(active.appunti_live) || "Nessun appunto collegato"]
    ];

    const panel = dv.el("div", "", { cls: "gdr-card-grid" });
    panel.innerHTML = rows.map(([title, body]) => cardHtml({ title, body, cls: "gdr-info-card compact" })).join("");
  }

  function publicRows(dv, source, category, limit = 8) {
    return dv.pages(source)
      .where(p => publicCandidate(p, category))
      .sort(p => Number(p.pressione ?? 0), "desc")
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

  function renderPlayerView(dv) {
    // Vista giocatori: card semplici, sezioni fisse e nessuna tabella gestionale.
    const sections = [
      ["Obiettivi", publicRows(dv, '"Mondi/Missioni"', "missione"), "missione"],
      ["PNG conosciuti", publicRows(dv, '"Mondi/Personaggi"', "personaggio"), "personaggio"],
      ["Luoghi scoperti", publicRows(dv, '"Mondi/Luoghi"', "luogo"), "luogo"],
      ["Dispense", publicRows(dv, '"Mondi/Dispense"', "dispensa"), "dispensa"]
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
    ACTIVE_STATES,
    PLAY_STATES,
    escapeHtml,
    internalLink,
    linkKey,
    isReal,
    pageFromLink,
    pagesFromLinks,
    activeSession,
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
    renderHome,
    renderTableCockpit,
    renderPlayerView
  };
})()
