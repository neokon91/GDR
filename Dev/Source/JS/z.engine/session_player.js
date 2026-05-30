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
    publicCandidate
  } = ctx;

  function publicRows(dv, source, category, limit = 8) {
    return dv.pages(source)
      .where(p => publicCandidate(p, category))
      .sort(p => Number(p.pressione ?? 0), "desc")
      .limit(limit)
      .array();
  }

  function publicCard(page, category) {
    const title = pageTitle(page);
    const meta = category === "missione"
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
      ["Handout", publicRows(dv, '"Mondi/Dispense"', "dispensa", 99).length, "materiali consegnati"]
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

  function renderPublicSafety(dv) {
    const risky = dv.pages('"Mondi"')
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
    const risky = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.pubblico === true && hasPrivateFields(p))
      .array();
    const missingSafeText = dv.pages('"Mondi"')
      .where(p => isReal(p) && p.pubblico === true && !hasText(p.player_safe) && !hasText(p.recap_pubblico) && p.categoria !== "sessione")
      .array();
    const sessionsWithoutRecap = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.stato === "giocata" && !hasText(p.recap_pubblico))
      .array();
    const deliveredHandouts = publicRows(dv, '"Mondi/Dispense"', "dispensa", 99);

    const checks = [
      ["Anti-segreti", !risky.length, risky.map(pageTitle).join(", ") || "Nessuna nota pubblica contiene campi DM evidenti."],
      ["Testo player-safe", !missingSafeText.length, missingSafeText.map(pageTitle).join(", ") || "Le note pubbliche hanno testo mostrabile o recap."],
      ["Recap", !sessionsWithoutRecap.length, sessionsWithoutRecap.map(pageTitle).join(", ") || "Le sessioni giocate hanno recap pubblico o non sono esposte."],
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
      ["Handout", publicRows(dv, '"Mondi/Dispense"', "dispensa"), "dispensa"]
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
    renderPlayerPortalStatus,
    renderPlayerRecap,
    renderPlayerView,
    renderPublicSafety,
    renderPublicStats
  };
})
