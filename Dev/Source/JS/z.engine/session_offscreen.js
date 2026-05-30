(ctx => {
  const {
    cardHtml,
    continuityAction,
    continuityIssues,
    continuityStatus,
    escapeHtml,
    fieldText,
    hasLinks,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pluginStatus,
    pressure,
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

  function realPage(page) {
    const folderIndex = page?.file?.name === page?.file?.folder?.split("/").pop();
    return isReal(page) && !folderIndex && page.stato !== "archiviata" && page.stato !== "ignorata";
  }

  function offscreenScope(dv, worldLink = "", campaignLinks = []) {
    const selectedWorld = linkKey(worldLink);
    const selectedCampaigns = new Set(dvItems(dv, campaignLinks).map(linkKey).filter(Boolean));
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const matchesCampaign = page => {
      if (!selectedCampaigns.size) return true;
      const direct = [
        ...dvItems(dv, page.campagne),
        ...dvItems(dv, page.campagna),
        ...dvItems(dv, page.campagne_attive)
      ];
      return !direct.length || direct.some(link => selectedCampaigns.has(linkKey(link)));
    };
    const inScope = page => realPage(page) && matchesWorld(page) && matchesCampaign(page);
    const pages = (source, predicate = () => true) => dv.pages(source).where(page => inScope(page) && predicate(page)).array();
    return { pages };
  }

  function progressText(page) {
    const value = Math.max(0, Number(page?.progress_value ?? 0));
    const max = Math.max(1, Number(page?.progress_max ?? 6));
    return `${Math.min(value, max)}/${max}`;
  }

  function urgency(page) {
    const value = Number(page?.progress_value ?? 0);
    const max = Math.max(1, Number(page?.progress_max ?? 6));
    const deadline = hasText(page?.scadenza_mondo) || hasText(page?.scadenza) ? 8 : 0;
    return pressure(page) * 10 + Math.round((value / max) * 10) + deadline;
  }

  function actorRows(dv, scope) {
    return scope.pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Personaggi" OR "Mondi/Conflitti"', page =>
      pressure(page) >= 5
      || hasValue(dv, page.prossima_mossa)
      || hasValue(dv, page.innesco)
      || hasLinks(page.conseguenze)
    ).sort((left, right) => urgency(right) - urgency(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function clockRows(dv, scope) {
    return scope.pages('"Mondi/Tracciati" OR "Mondi/Missioni" OR "Mondi/Conflitti"', page => {
      const value = Number(page.progress_value ?? 0);
      const max = Math.max(1, Number(page.progress_max ?? 6));
      const closed = ["completato", "fallito", "completata", "fallita"].includes(String(page.stato ?? ""));
      return !closed && (pressure(page) >= 5 || value / max >= 0.5 || hasValue(dv, page.scadenza_mondo ?? page.scadenza));
    }).sort((left, right) => urgency(right) - urgency(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function consequenceRows(dv, scope) {
    return scope.pages('"Mondi" OR "Inbox"', page => {
      const hasImpact = hasLinks(page.conseguenze)
        || hasLinks(page.entita_impattate)
        || hasLinks(page.propaga_a)
        || hasValue(dv, page.prossima_mossa)
        || hasValue(dv, page.impatto)
        || hasValue(dv, page.conseguenza_potenziale);
      const hasTarget = hasLinks(page.entita_impattate) || hasLinks(page.propaga_a) || hasLinks(page.applicata_a);
      const status = continuityStatus(page);
      return hasImpact && (!hasTarget || !hasValue(dv, page.prossima_mossa) || !["applicata", "propagata", "canonizzata"].includes(status));
    }).sort((left, right) => urgency(right) - urgency(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function secretRows(dv, scope) {
    return scope.pages('"Mondi" OR "Inbox"', page =>
      hasLinks(page.segreti_rivelabili)
      || hasLinks(page.segreti)
      || hasValue(dv, page.segreto)
      || ["segreto", "rumor"].includes(String(page.stato_canonico ?? ""))
    ).map(page => {
      const missing = [
        !hasLinks(page.missioni) ? "missione" : "",
        !hasLinks(page.indizi) && !hasLinks(page.collegamenti) && !hasLinks(page.entita_impattate) ? "indizio o bersaglio" : "",
        !hasValue(dv, page.player_safe) && page.pubblico === true ? "player-safe" : ""
      ].filter(Boolean);
      return { page, missing };
    }).filter(row => row.missing.length > 0)
      .sort((left, right) => (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
  }

  function bridgeRows(dv, scope) {
    const openStates = new Set(["proposta", "accettata", "in corso", "pronto", "preparazione"]);
    return scope.pages('"Mondi/Missioni" OR "Mondi/Sessioni" OR "Mondi/Incontri" OR "Mondi/Dispense"', page =>
      openStates.has(String(page.stato ?? ""))
      && (
        pressure(page) > 0
        || hasValue(dv, page.scadenza_mondo ?? page.scadenza)
        || hasLinks(page.conseguenze)
        || hasValue(dv, page.prossima_mossa)
        || hasValue(dv, page.uso_al_tavolo)
      )
    ).sort((left, right) => urgency(right) - urgency(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function offscreenBuckets(dv, worldLink = "", campaignLinks = []) {
    const scope = offscreenScope(dv, worldLink, campaignLinks);
    const actors = actorRows(dv, scope);
    const clocks = clockRows(dv, scope);
    const consequences = consequenceRows(dv, scope);
    const secrets = secretRows(dv, scope);
    const bridge = bridgeRows(dv, scope);
    const priority = [
      ...consequences.map(page => ({ group: "Conseguenza", page, problem: continuityIssues(page).join(", ") || continuityStatus(page) || "non propagata", action: continuityAction(page), priority: 6 })),
      ...clocks.map(page => ({ group: "Clock", page, problem: `${progressText(page)} · pressione ${pressure(page) || 0}`, action: fieldText(page.prossima_mossa ?? page.innesco) || "Decidi cosa accade se nessuno interviene.", priority: 5 })),
      ...actors.map(page => ({ group: "Attore", page, problem: fieldText(page.innesco ?? page.agenda ?? page.obiettivo) || `pressione ${pressure(page) || 0}`, action: fieldText(page.prossima_mossa) || "Scrivi la prossima mossa fuori scena.", priority: 4 })),
      ...secrets.map(row => ({ group: "Segreto", page: row.page, problem: `manca ${row.missing.join(", ")}`, action: "Collega indizio, missione o scena prima di rivelarlo.", priority: 3 })),
      ...bridge.map(page => ({ group: "Tavolo", page, problem: fieldText(page.uso_al_tavolo ?? page.scadenza_mondo ?? page.scadenza) || "materiale da giocare", action: fieldText(page.prossima_mossa) || "Portalo in Preparazione Sessione.", priority: 2 }))
    ].sort((left, right) => right.priority - left.priority || urgency(right.page) - urgency(left.page));

    return { actors, bridge, clocks, consequences, priority, secrets };
  }

  function firstCard({ title, rows, empty, why, mapper }) {
    const first = rows[0];
    const mapped = first && mapper ? mapper(first) : first;
    return cardHtml({
      title,
      meta: `${rows.length} elementi`,
      body: mapped?.problem ?? empty,
      importa: mapped?.action ?? why,
      link: mapped?.page?.file?.path ?? first?.file?.path ?? "",
      cls: `gdr-info-card compact ${rows.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
    });
  }

  function renderOffscreenNow(dv, worldLink = "", campaignLinks = []) {
    const buckets = offscreenBuckets(dv, worldLink, campaignLinks);
    const next = buckets.priority[0];
    const cards = [
      cardHtml({
        title: next ? `Reagisce prima: ${next.group}` : "Reagisce prima: niente di urgente",
        meta: next ? pageTitle(next.page) : "Fuori scena stabile",
        body: next?.problem ?? "Nessuna reazione urgente con i filtri correnti.",
        importa: next?.action ?? "Puoi passare alla preparazione o creare una nuova pressione.",
        link: next?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${next ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      firstCard({
        title: "Attore in moto",
        rows: buckets.actors,
        empty: "Nessun attore sta premendo.",
        why: "Aggiungi pressione solo quando serve una reazione visibile.",
        mapper: page => ({ page, problem: `pressione ${pressure(page) || 0}`, action: fieldText(page.prossima_mossa) || "Scrivi la prossima mossa." })
      }),
      firstCard({
        title: "Clock urgente",
        rows: buckets.clocks,
        empty: "Nessun clock urgente.",
        why: "Missioni e tracciati non chiedono avanzamento immediato.",
        mapper: page => ({ page, problem: progressText(page), action: fieldText(page.prossima_mossa ?? page.innesco) || "Decidi avanzamento e conseguenza." })
      }),
      firstCard({
        title: "Segreto rivelabile",
        rows: buckets.secrets,
        empty: "Nessun segreto scollegato.",
        why: "I segreti rivelabili hanno gia ponte o indizio.",
        mapper: row => ({ page: row.page, problem: `manca ${row.missing.join(", ")}`, action: "Collega a scena, indizio o missione." })
      }),
      firstCard({
        title: "Ponte al tavolo",
        rows: buckets.bridge,
        empty: "Nessun materiale da portare subito al tavolo.",
        why: "Quando scegli una reazione, trasformala in scena o missione.",
        mapper: page => ({ page, problem: fieldText(page.stato) || "preparabile", action: fieldText(page.prossima_mossa ?? page.uso_al_tavolo) || "Apri Preparazione Sessione." })
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-offscreen-now" });
    grid.innerHTML = cards.join("");
  }

  function renderOffscreenReadiness(dv, worldLink = "", campaignLinks = []) {
    const buckets = offscreenBuckets(dv, worldLink, campaignLinks);
    const stats = [
      ["Attori in moto", buckets.actors.length, "pressione o prossima mossa"],
      ["Clock urgenti", buckets.clocks.length, "scadenza o avanzamento"],
      ["Conseguenze aperte", buckets.consequences.length, "da propagare"],
      ["Segreti rivelabili", buckets.secrets.length, "da collegare"],
      ["Ponte al tavolo", buckets.bridge.length, "materiale giocabile"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-offscreen-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readOffscreenCockpit() {
    return readJsonRel("z.automazioni/data/runtime/offscreen_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  async function renderOffscreenReactionQueues(dv, worldLink = "", campaignLinks = []) {
    const cockpit = await readOffscreenCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = offscreenBuckets(dv, worldLink, campaignLinks);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "actors",
      ["Nota", "Tipo", "Pressione", "Prossima mossa"],
      buckets.actors.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, page.categoria ?? page.tipo ?? "", pressure(page) || "", fieldText(page.prossima_mossa ?? page.innesco) || "da decidere"]),
      "Nessuna prossima mossa fuori scena con i filtri correnti."
    );
    renderTable(
      "clocks",
      ["Nota", "Stato", "Avanzamento", "Scadenza"],
      buckets.clocks.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, page.stato ?? "", progressText(page), fieldText(page.scadenza_mondo ?? page.scadenza) || ""]),
      "Nessun clock o missione urgente con i filtri correnti."
    );
    renderTable(
      "consequences",
      ["Origine", "Stato", "Bersagli", "Azione"],
      buckets.consequences.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, continuityStatus(page) || "aperta", fieldText(page.entita_impattate ?? page.propaga_a ?? page.applicata_a) || "", continuityAction(page)]),
      "Nessuna conseguenza non propagata evidente."
    );
    renderTable(
      "secrets",
      ["Nota", "Canone", "Collegamento", "Prossima mossa"],
      buckets.secrets.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.page.stato_canonico ?? row.page.canonico ?? "", `manca ${row.missing.join(", ")}`, fieldText(row.page.prossima_mossa) || "collega a scena o indizio"]),
      "Nessun segreto rivelabile scollegato."
    );
  }

  async function renderOffscreenTableBridge(dv, worldLink = "", campaignLinks = []) {
    const cockpit = await readOffscreenCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = offscreenBuckets(dv, worldLink, campaignLinks);
    dv.header(3, labels.get("bridge") ?? "Ponte al prossimo tavolo");
    if (!buckets.bridge.length) {
      dv.paragraph("Nessun ponte al tavolo con i filtri correnti.");
      return;
    }
    dv.table(
      ["Materiale", "Stato", "Uso", "Prossima mossa"],
      buckets.bridge.slice(0, 16).map(page => [
        page.file?.link ?? page.file?.path,
        page.stato ?? "",
        fieldText(page.uso_al_tavolo ?? page.scadenza_mondo ?? page.scadenza ?? page.conseguenze) || "da portare in scena",
        fieldText(page.prossima_mossa) || "prepara scena, scelta o recap"
      ])
    );
  }

  async function renderOffscreenSurfaceLinks(dv) {
    const cockpit = await readOffscreenCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici fuori scena non configurate",
        action: "Rigenera il contratto Cosa Succede Fuori Scena dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-offscreen-surfaces" });
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
    renderOffscreenNow,
    renderOffscreenReactionQueues,
    renderOffscreenReadiness,
    renderOffscreenSurfaceLinks,
    renderOffscreenTableBridge
  };
})
