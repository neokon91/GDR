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

  function livingWorldScope(dv, worldLink = "", campaignLinks = []) {
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
    return { pages, selectedWorld, selectedCampaigns };
  }

  function progress(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || "";
    return max === "" ? String(value || "") : `${value}/${max}`;
  }

  function hasContinuitySignal(dv, page) {
    return continuityStatus(page)
      || hasLinks(page?.conseguenze)
      || hasLinks(page?.entita_impattate)
      || hasLinks(page?.propaga_a)
      || hasLinks(page?.applicata_a)
      || hasLinks(page?.propagato_da)
      || hasLinks(page?.aggiornamenti_richiesti)
      || hasText(page?.impatto)
      || hasText(page?.conseguenza_potenziale)
      || hasValue(dv, page?.prossima_mossa);
  }

  function continuityRows(dv, scope) {
    return scope.pages('"Mondi" OR "Inbox"', page => hasContinuitySignal(dv, page))
      .sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function targetRows(dv, scope) {
    return scope.pages('"Mondi"', page => hasLinks(page.propagato_da) || hasLinks(page.aggiornamenti_richiesti) || continuityStatus(page) === "da verificare")
      .sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function closableRows(dv, scope) {
    return scope.pages('"Mondi" OR "Inbox"', page => {
      const status = continuityStatus(page);
      const hasClosure = hasText(page.prossima_mossa)
        || hasText(page.recap_pubblico)
        || hasLinks(page.effetti)
        || hasText(page.effetti)
        || hasLinks(page.conseguenze);
      return ["propagata", "canonizzata"].includes(status)
        && !hasLinks(page.aggiornamenti_richiesti)
        && hasClosure;
    }).sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function gapRows(dv, scope) {
    return scope.pages('"Mondi" OR "Inbox"')
      .map(page => ({ page, issues: continuityIssues(page) }))
      .filter(row => row.issues.length > 0)
      .sort((left, right) => (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
  }

  function powerRows(dv, scope) {
    return scope.pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti" OR "Mondi/Tracciati"', page =>
      pressure(page) > 0 || Number(page.progress_value ?? 0) > 0 || hasValue(dv, page.prossima_mossa)
    ).sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function economyRows(dv, scope) {
    return scope.pages('"Mondi/Rotte" OR "Mondi/Risorse" OR "Mondi/Mercati"', page =>
      pressure(page) > 0 || hasValue(dv, page.prossima_mossa) || hasLinks(page.conseguenze) || hasLinks(page.conseguenze_se_bloccata)
    ).sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function historyRows(dv, scope) {
    return scope.pages('"Mondi/Timeline" OR "Mondi/Storia"', page =>
      hasValue(dv, page.data_mondo) || hasValue(dv, page.causa) || hasLinks(page.cause) || hasLinks(page.effetti) || hasLinks(page.conseguenze)
    ).sort((left, right) => String(left.data_mondo ?? left.file?.name ?? "").localeCompare(String(right.data_mondo ?? right.file?.name ?? "")));
  }

  function publicCanonRows(dv, scope) {
    return scope.pages('"Mondi/Timeline" OR "Mondi/Storia" OR "Inbox"', page => page.canonico === true || page.stato_canonico === "canonico")
      .map(page => {
        const missing = [
          !hasValue(dv, page.player_safe) ? "player-safe" : "",
          !hasValue(dv, page.memoria_pubblica) ? "memoria pubblica" : "",
          !hasLinks(page.effetti) && !hasText(page.effetti) && !hasLinks(page.conseguenze) ? "effetti" : "",
          !hasLinks(page.luoghi) && !hasLinks(page.fazioni) ? "luoghi o fazioni" : ""
        ].filter(Boolean);
        return { page, missing };
      })
      .filter(row => row.missing.length > 0)
      .sort((left, right) => (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
  }

  function livingBuckets(dv, worldLink = "", campaignLinks = []) {
    const scope = livingWorldScope(dv, worldLink, campaignLinks);
    const continuity = continuityRows(dv, scope);
    const targets = targetRows(dv, scope);
    const closable = closableRows(dv, scope);
    const gaps = gapRows(dv, scope);
    const powers = powerRows(dv, scope);
    const economy = economyRows(dv, scope);
    const history = historyRows(dv, scope);
    const publicCanon = publicCanonRows(dv, scope);
    const priority = [
      ...gaps.map(row => ({ group: "Buco", page: row.page, problem: row.issues.join(", "), action: continuityAction(row.page), priority: 6 })),
      ...targets.map(page => ({ group: "Bersaglio", page, problem: "bersaglio da verificare", action: continuityAction(page), priority: 5 })),
      ...continuity.map(page => ({ group: "Continuita", page, problem: continuityStatus(page) || "continuita aperta", action: continuityAction(page), priority: 4 })),
      ...powers.filter(page => !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Pressione", page, problem: "pressione senza prossima mossa", action: "Scrivi cosa fa se il party non interviene.", priority: 4 })),
      ...economy.filter(page => !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Economia", page, problem: "nodo economico senza prossima mossa", action: "Definisci conseguenza su risorsa, rotta o mercato.", priority: 3 })),
      ...publicCanon.map(row => ({ group: "Canone", page: row.page, problem: `manca ${row.missing.join(", ")}`, action: "Stabilizza materiale canonico prima di condividerlo.", priority: 3 }))
    ].sort((left, right) => right.priority - left.priority || (right.page?.file?.mtime ?? 0) - (left.page?.file?.mtime ?? 0));

    return { scope, continuity, targets, closable, gaps, powers, economy, history, publicCanon, priority };
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

  function renderLivingWorldNow(dv, worldLink = "", campaignLinks = []) {
    const buckets = livingBuckets(dv, worldLink, campaignLinks);
    const next = buckets.priority[0];
    const cards = [
      cardHtml({
        title: next ? `Cambia prima: ${next.group}` : "Cambia prima: niente di urgente",
        meta: next ? pageTitle(next.page) : "Mondo stabile",
        body: next?.problem ?? "Nessuna propagazione urgente con i filtri correnti.",
        importa: next?.action ?? "Puoi preparare nuove pressioni o portare materiale gia stabile al tavolo.",
        link: next?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${next ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      firstCard({
        title: "Continuita aperte",
        rows: buckets.continuity,
        empty: "Nessuna continuita aperta.",
        why: "Il mondo non ha cambiamenti da applicare.",
        mapper: page => ({ page, problem: continuityStatus(page) || "aperta", action: continuityAction(page) })
      }),
      firstCard({
        title: "Bersagli da verificare",
        rows: buckets.targets,
        empty: "Nessun bersaglio da aggiornare.",
        why: "Le conseguenze applicate non chiedono verifica.",
        mapper: page => ({ page, problem: "aggiornamento richiesto", action: continuityAction(page) })
      }),
      firstCard({
        title: "Pressioni",
        rows: buckets.powers,
        empty: "Nessuna pressione attiva.",
        why: "Crea o aggiorna fazioni, conflitti o clock quando serve movimento.",
        mapper: page => ({ page, problem: `pressione ${pressure(page) || progress(page)}`, action: fieldText(page.prossima_mossa) || "Scrivi la prossima mossa." })
      }),
      firstCard({
        title: "Economia",
        rows: buckets.economy,
        empty: "Nessuna pressione economica.",
        why: "Rotte, risorse e mercati sono stabili con il filtro corrente.",
        mapper: page => ({ page, problem: fieldText(page.stato_rotta ?? page.stato) || "nodo economico", action: fieldText(page.prossima_mossa ?? page.conseguenze ?? page.conseguenze_se_bloccata) || "Definisci conseguenza economica." })
      }),
      firstCard({
        title: "Canone da stabilizzare",
        rows: buckets.publicCanon,
        empty: "Nessun canone pubblicabile incompleto.",
        why: "Il materiale canonico ha memoria, effetti e versione sicura.",
        mapper: row => ({ page: row.page, problem: `manca ${row.missing.join(", ")}`, action: "Completa prima di mostrarlo ai giocatori." })
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-living-world-now" });
    grid.innerHTML = cards.join("");
  }

  function renderLivingWorldReadiness(dv, worldLink = "", campaignLinks = []) {
    const buckets = livingBuckets(dv, worldLink, campaignLinks);
    const canon = buckets.scope.pages('"Mondi" OR "Inbox"', page => page.canonico === true || page.stato_canonico === "canonico").length;
    const stats = [
      ["Canone vivo", canon, "verita vincolanti"],
      ["Pressioni", buckets.powers.length, "attori in movimento"],
      ["Economia", buckets.economy.length, "nodi economici"],
      ["Eventi", buckets.history.length, "causa o effetto"],
      ["Propagazioni", buckets.continuity.length, "aperte o applicate"],
      ["Bersagli", buckets.targets.length, "da verificare"],
      ["Buchi", buckets.gaps.length, "continuita incompleta"],
      ["Chiudibili", buckets.closable.length, "pronte da chiudere"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-living-world-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readLivingWorldCockpit() {
    return readJsonRel("z.automazioni/data/runtime/living_world_cockpit.json", {
      surfaces: [],
      queues: []
    });
  }

  async function renderLivingWorldQueues(dv, worldLink = "", campaignLinks = []) {
    const cockpit = await readLivingWorldCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = livingBuckets(dv, worldLink, campaignLinks);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "continuity",
      ["Origine", "Stato", "Bersagli", "Azione"],
      buckets.continuity.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, continuityStatus(page) || "aperta", fieldText(page.entita_impattate ?? page.propaga_a ?? page.applicata_a) || "", continuityAction(page)]),
      "Nessuna continuita aperta con i filtri correnti."
    );
    renderTable(
      "targets",
      ["Bersaglio", "Stato", "Aggiornamento", "Prossima mossa"],
      buckets.targets.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, continuityStatus(page) || "da verificare", fieldText(page.aggiornamenti_richiesti) || continuityAction(page), fieldText(page.prossima_mossa) || "da decidere"]),
      "Nessun bersaglio da verificare con i filtri correnti."
    );
    renderTable(
      "closable",
      ["Nota", "Stato", "Chiusura", "Azione"],
      buckets.closable.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, continuityStatus(page), fieldText(page.prossima_mossa ?? page.recap_pubblico ?? page.effetti ?? page.conseguenze), "Archivia, canonizza o lascia come riferimento chiuso."]),
      "Nessuna continuita chiudibile con i filtri correnti."
    );
    renderTable(
      "gaps",
      ["Nota", "Gap", "Stato", "Azione"],
      buckets.gaps.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.issues.join(", "), continuityStatus(row.page) || "aperta", continuityAction(row.page)]),
      "Nessun buco di continuita evidente con i filtri correnti."
    );
  }

  async function renderLivingWorldPressureQueues(dv, worldLink = "", campaignLinks = []) {
    const cockpit = await readLivingWorldCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = livingBuckets(dv, worldLink, campaignLinks);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "powers",
      ["Potere", "Pressione", "Clock", "Prossima mossa"],
      buckets.powers.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, pressure(page) || "", progress(page), fieldText(page.prossima_mossa ?? page.agenda ?? page.obiettivo) || "da decidere"]),
      "Nessuna faction dynamics attiva con i filtri correnti."
    );
    renderTable(
      "economy",
      ["Nodo", "Stato", "Pressione", "Conseguenze"],
      buckets.economy.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, fieldText(page.stato_rotta ?? page.stato) || "", pressure(page) || "", fieldText(page.conseguenze ?? page.conseguenze_se_bloccata ?? page.prossima_mossa) || "da decidere"]),
      "Nessuna pressione economica con i filtri correnti."
    );
    renderTable(
      "history",
      ["Evento", "Data", "Cause", "Effetti"],
      buckets.history.slice(0, 14).map(page => [page.file?.link ?? page.file?.path, page.data_mondo ?? "", fieldText(page.cause ?? page.causa) || "", fieldText(page.effetti ?? page.conseguenze) || ""]),
      "Nessuna causalita storica nel filtro corrente."
    );
    renderTable(
      "public_canon",
      ["Nota", "Canone", "Cosa manca", "Azione"],
      buckets.publicCanon.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, row.page.stato_canonico ?? row.page.canonico ?? "", row.missing.join(", "), "Completa prima di mostrarlo o usarlo come vincolo pubblico."]),
      "Nessun materiale canonico da stabilizzare per pubblicazione."
    );
  }

  async function renderLivingWorldSurfaceLinks(dv) {
    const cockpit = await readLivingWorldCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici mondo vivo non configurate",
        action: "Rigenera il contratto Motore Mondo Vivo dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-living-world-surfaces" });
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
    renderLivingWorldNow,
    renderLivingWorldPressureQueues,
    renderLivingWorldQueues,
    renderLivingWorldReadiness,
    renderLivingWorldSurfaceLinks
  };
})
