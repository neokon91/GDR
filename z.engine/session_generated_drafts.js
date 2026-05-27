(ctx => {
  const {
    cardHtml,
    escapeHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    pageTitle,
    pluginStatus,
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

  function pathStarts(page, prefix) {
    return String(page?.file?.path ?? "").startsWith(prefix);
  }

  function asLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function createdValue(page) {
    return String(page?.creato ?? page?.created ?? page?.file?.ctime ?? page?.file?.mtime ?? "");
  }

  function hasOperationalAnchor(page) {
    return hasLinks(page.mondo) || hasText(page.mondo)
      || hasLinks(page.luogo) || hasText(page.luogo)
      || hasLinks(page.campagne) || hasText(page.campagne)
      || hasLinks(page.campagna) || hasText(page.campagna)
      || hasLinks(page.sessioni) || hasText(page.sessioni);
  }

  function destinationFor(page) {
    const category = String(page?.categoria ?? "");
    const type = String(page?.tipo ?? "");

    if (category === "luogo") return "Mondi/Luoghi";
    if (category === "fazione") return "Mondi/Fazioni";
    if (category === "personaggio" || type === "png") return "Mondi/Personaggi";
    if (category === "oggetto") return "Mondi/Oggetti";
    if (category === "religione") return "Mondi/Religioni";
    if (category === "creatura") return "Mondi/Creature";
    if (category === "incontro") return "Mondi/Incontri";
    if (category === "dispensa") return "Mondi/Dispense";
    if (category === "generazione" || category === "spunto") return "Inbox";
    return "Inbox/Generati";
  }

  function generatedDraftsData(dv) {
    const drafts = pages(dv, '"Inbox/Generati"', page => pathStarts(page, "Inbox/Generati/") && page.plugin === "fantasy-content-generator" && page.stato === "bozza")
      .sort((left, right) => {
        const leftAnchored = hasOperationalAnchor(left) ? 0 : 1;
        const rightAnchored = hasOperationalAnchor(right) ? 0 : 1;
        return leftAnchored - rightAnchored || createdValue(left).localeCompare(createdValue(right)) || String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? ""));
      });
    const ready = drafts.filter(hasOperationalAnchor);
    const unanchored = drafts.filter(page => !hasOperationalAnchor(page));
    const resolved = pages(dv, '"Mondi" OR "Inbox"', page => page.plugin === "fantasy-content-generator" && !pathStarts(page, "Inbox/Generati/"))
      .sort((left, right) => String(right.smistato_il ?? right.canonizzato_il ?? right.file?.mtime ?? "").localeCompare(String(left.smistato_il ?? left.canonizzato_il ?? left.file?.mtime ?? "")));
    const canonized = resolved.filter(page => page.canonico === true || hasText(page.canonizzato_il) || page.stato_canonico === "canonico");
    const destinations = drafts.map(page => ({
      page,
      destination: destinationFor(page),
      anchored: hasOperationalAnchor(page),
      action: hasOperationalAnchor(page)
        ? "Usa Smista bozza; canonizza solo se confermata al tavolo."
        : "Collega mondo, luogo, campagna o sessione prima di smistare."
    }));

    return {
      canonized,
      destinations,
      drafts,
      next: drafts[0] ?? null,
      ready,
      resolved,
      unanchored
    };
  }

  function renderGeneratedDraftsNow(dv) {
    const data = generatedDraftsData(dv);
    const status = pluginStatus("Fantasy Content Generator");
    if (!data.drafts.length) {
      const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-generated-drafts-now" });
      grid.innerHTML = [
        cardHtml({
          title: "Bozza prima: coda pulita",
          meta: status.ok === true ? "generatore attivo" : "nessuna bozza aperta",
          body: "Nessuna bozza del Fantasy Content Generator richiede decisione.",
          importa: "Apri il generatore solo se serve materiale da collegare a mondo o sessione.",
          link: "Risorse/Quality Report.md",
          cls: "gdr-info-card compact gdr-kind-ready"
        }),
        cardHtml({
          title: "Prossima azione",
          meta: "controllo",
          body: "Verifica Controllo Vault o torna alla preparazione.",
          importa: "La pagina resta vuota quando non c'e rumore generato da smistare.",
          link: "Risorse/Controllo Vault.md",
          cls: "gdr-info-card compact"
        })
      ].join("");
      return;
    }

    const next = data.next;
    const cards = [
      cardHtml({
        title: "Bozza prima",
        meta: [pageTitle(next), next?.categoria, next?.tipo].filter(Boolean).join(" - "),
        body: hasOperationalAnchor(next) ? "Ha gia un aggancio operativo." : "Manca aggancio a mondo, luogo, campagna o sessione.",
        importa: hasOperationalAnchor(next) ? "Smistala o canonizzala solo se confermata." : "Senza aggancio resta rumore e non deve entrare nel canone.",
        link: next?.file?.path ?? "",
        cls: `gdr-info-card compact ${hasOperationalAnchor(next) ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Pronte da collegare",
        meta: `${data.ready.length} bozze`,
        body: data.ready[0] ? pageTitle(data.ready[0]) : "Nessuna bozza ha agganci sufficienti.",
        importa: data.ready.length ? "Sono candidate a smistamento manuale." : "Collega prima un contesto operativo.",
        link: data.ready[0]?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: `gdr-info-card compact ${data.ready.length ? "gdr-kind-ready" : "gdr-kind-missing"}`
      }),
      cardHtml({
        title: "Senza aggancio",
        meta: `${data.unanchored.length} bozze`,
        body: data.unanchored[0] ? pageTitle(data.unanchored[0]) : "Nessuna bozza isolata.",
        importa: data.unanchored.length ? "Archivia o collega prima di spendere altro tempo." : "Il generato rimasto ha contesto.",
        link: data.unanchored[0]?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.unanchored.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Smistate",
        meta: `${data.resolved.length} note`,
        body: data.resolved[0] ? pageTitle(data.resolved[0]) : "Nessuna bozza smistata ancora visibile.",
        importa: `${data.canonized.length} canonizzate`,
        link: data.resolved[0]?.file?.path ?? "Risorse/Quality Report.md",
        cls: "gdr-info-card compact"
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-generated-drafts-now" });
    grid.innerHTML = cards.join("");
  }

  function renderGeneratedDraftsReadiness(dv) {
    const data = generatedDraftsData(dv);
    const stats = [
      ["Bozze", data.drafts.length, "aperte in Inbox/Generati"],
      ["Pronte", data.ready.length, "con aggancio operativo"],
      ["Senza aggancio", data.unanchored.length, "da collegare o archiviare"],
      ["Smistate", data.resolved.length, "uscite da Inbox/Generati"],
      ["Canonizzate", data.canonized.length, "confermate nel canone"],
      ["Rumore", data.unanchored.length ? data.unanchored.length : 0, "non spendere tempo senza contesto"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-generated-drafts-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readGeneratedDraftsCockpit() {
    return readJsonRel("z.automazioni/data/runtime/generated_drafts_cockpit.json", {
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

  async function renderGeneratedDraftsQueues(dv) {
    const cockpit = await readGeneratedDraftsCockpit();
    const labels = queueLabels(cockpit);
    const data = generatedDraftsData(dv);

    renderTable(
      dv,
      labels,
      "draft_queue",
      ["Bozza", "Categoria", "Tipo", "Generatore", "Aggancio", "Creata"],
      data.drafts.slice(0, 24).map(page => [
        asLink(page),
        page.categoria ?? "",
        page.tipo ?? "",
        page.generatore ?? "",
        fieldText(page.mondo ?? page.luogo ?? page.campagne ?? page.campagna ?? page.sessioni) || "manca",
        createdValue(page)
      ]),
      "Nessuna bozza generata da smistare."
    );
    renderTable(
      dv,
      labels,
      "ready_to_link",
      ["Bozza", "Aggancio", "Azione"],
      data.ready.slice(0, 16).map(page => [
        asLink(page),
        fieldText(page.mondo ?? page.luogo ?? page.campagne ?? page.campagna ?? page.sessioni),
        "Smista manualmente; canonizza solo dopo conferma."
      ]),
      "Nessuna bozza pronta da collegare."
    );
    renderTable(
      dv,
      labels,
      "unanchored",
      ["Bozza", "Categoria", "Tipo", "Azione"],
      data.unanchored.slice(0, 16).map(page => [
        asLink(page),
        page.categoria ?? "",
        page.tipo ?? "",
        "Collega un contesto o archivia."
      ]),
      "Nessuna bozza senza aggancio."
    );
  }

  async function renderGeneratedDraftsDestinations(dv) {
    const cockpit = await readGeneratedDraftsCockpit();
    const labels = queueLabels(cockpit);
    const data = generatedDraftsData(dv);

    renderTable(
      dv,
      labels,
      "destinations",
      ["Bozza", "Categoria", "Tipo", "Destinazione", "Azione"],
      data.destinations.slice(0, 24).map(row => [
        asLink(row.page),
        row.page.categoria ?? "",
        row.page.tipo ?? "",
        row.destination,
        row.action
      ]),
      "Nessuna destinazione da suggerire."
    );
  }

  async function renderGeneratedDraftsResolved(dv) {
    const cockpit = await readGeneratedDraftsCockpit();
    const labels = queueLabels(cockpit);
    const data = generatedDraftsData(dv);

    renderTable(
      dv,
      labels,
      "resolved",
      ["Nota", "Categoria", "Stato", "Canonico", "Origine"],
      data.resolved.slice(0, 24).map(page => [
        asLink(page),
        page.categoria ?? page.tipo ?? "",
        page.stato ?? "",
        page.canonico === true || page.stato_canonico === "canonico" ? "si" : "no",
        fieldText(page.origine_bozza) || page.generatore || ""
      ]),
      "Nessuna bozza smistata fuori da Inbox/Generati."
    );
  }

  async function renderGeneratedDraftsSurfaceLinks(dv) {
    const cockpit = await readGeneratedDraftsCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici bozze non configurate",
        action: "Rigenera il contratto Smistamento Bozze dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-generated-drafts-surfaces" });
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
    renderGeneratedDraftsDestinations,
    renderGeneratedDraftsNow,
    renderGeneratedDraftsQueues,
    renderGeneratedDraftsReadiness,
    renderGeneratedDraftsResolved,
    renderGeneratedDraftsSurfaceLinks
  };
})
