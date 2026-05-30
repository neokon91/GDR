(ctx => {
  const {
    cardHtml,
    escapeHtml,
    fieldText,
    hasText,
    isReal,
    linkKey,
    pageTitle,
    pluginStatus,
    pressure,
    readJsonRel,
    renderEmptyState
  } = ctx;

  const REVIEW_CATEGORIES = new Set(["lore capture", "evento storico", "segreto", "cultura", "fazione", "religione", "conflitto", "luogo", "mistero"]);
  const SECRET_TYPES = new Set(["segreto", "mistero", "verita nascosta", "verità nascosta"]);

  function dvItems(dv, value) {
    const data = dv.array(value ?? []);
    return typeof data.array === "function"
      ? data.array()
      : Array.isArray(value) ? value : value ? [value] : [];
  }

  function hasValue(dv, value) {
    return dvItems(dv, value).filter(Boolean).length > 0 || hasText(value);
  }

  function folderIndex(page) {
    const folder = String(page?.file?.folder ?? "");
    return page?.file?.name === folder.split("/").pop();
  }

  function realPage(page) {
    return isReal(page)
      && !folderIndex(page)
      && !["archiviata", "ignorata"].includes(String(page?.stato ?? ""));
  }

  function pageLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function progress(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || 0;
    return max ? `${value}/${max}` : "";
  }

  function sortByMtime(rows) {
    return [...rows].sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function sortByPressure(rows) {
    return [...rows].sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function loreReviewScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const inScope = page => realPage(page) && matchesWorld(page);
    const pages = (source, predicate = () => true) => dv.pages(source).where(page => inScope(page) && predicate(page)).array();
    return { pages, selectedWorld };
  }

  function isReviewLore(page) {
    const category = String(page?.categoria ?? "").toLowerCase();
    const type = String(page?.tipo ?? "").toLowerCase();
    return REVIEW_CATEGORIES.has(category)
      || REVIEW_CATEGORIES.has(type)
      || hasText(page?.stato_canonico)
      || page?.canonico !== undefined;
  }

  function hasAnchor(dv, page) {
    return hasValue(dv, page.collegamenti)
      || hasValue(dv, page.luoghi)
      || hasValue(dv, page.fazioni)
      || hasValue(dv, page.personaggi)
      || hasValue(dv, page.missioni)
      || hasValue(dv, page.sessioni);
  }

  function hasClues(dv, page) {
    return hasValue(dv, page.indizi)
      || hasValue(dv, page.indizi_deboli)
      || hasValue(dv, page.indizi_forti)
      || hasValue(dv, page.prove_decisive)
      || hasValue(dv, page.rivelazioni);
  }

  function isPlayable(dv, page) {
    return page.giocabile === true
      || hasValue(dv, page.scelte)
      || hasValue(dv, page.rischi)
      || hasClues(dv, page)
      || hasValue(dv, page.prossima_mossa)
      || hasValue(dv, page.uso_al_tavolo);
  }

  function missingCompletion(dv, page) {
    return [
      !hasValue(dv, page.mondo) ? "mondo" : "",
      !hasValue(dv, page.stato_canonico) && page.canonico === undefined ? "verita, rumor o segreto" : "",
      !hasAnchor(dv, page) ? "collegamenti" : ""
    ].filter(Boolean);
  }

  function loreReviewData(dv, worldLink = "") {
    const scope = loreReviewScope(dv, worldLink);
    const reviewPages = sortByMtime(scope.pages('"Mondi" OR "Inbox"', page => isReviewLore(page)));
    const timeline = scope.pages('"Mondi/Timeline" OR "Mondi/Storia"', page => page.file?.name !== "Timeline" && page.file?.name !== "Storia");
    const pressures = sortByPressure(scope.pages('"Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Conflitti"', page =>
      Number(page.progress_max ?? 0) > 0 || pressure(page) > 0
    ));
    const completion = reviewPages
      .map(page => ({ page, missing: missingCompletion(dv, page) }))
      .filter(row => row.missing.length);
    const playability = reviewPages.filter(page => !isPlayable(dv, page));
    const anchors = reviewPages.filter(page => !hasAnchor(dv, page));
    const mysteries = reviewPages.filter(page =>
      SECRET_TYPES.has(String(page.tipo ?? "").toLowerCase())
      || SECRET_TYPES.has(String(page.categoria ?? "").toLowerCase())
      || String(page.stato_canonico ?? "").toLowerCase() === "segreto"
    );
    const mysteriesWithoutClues = mysteries.filter(page => !hasClues(dv, page));
    const historyGaps = timeline.filter(page =>
      !hasValue(dv, page.causa)
      || !hasValue(dv, page.conseguenze)
      || !hasValue(dv, page.prossima_mossa)
    );
    const pressureGaps = pressures.filter(page =>
      !hasValue(dv, page.innesco)
      || !hasValue(dv, page.prossima_mossa)
      || !hasValue(dv, page.conseguenze)
    );
    const priority = [
      ...completion.map(row => ({ group: "Completa", page: row.page, problem: `manca ${row.missing.join(", ")}`, action: "Completa i campi minimi o archivia la nota.", priority: 6 })),
      ...mysteriesWithoutClues.map(page => ({ group: "Mistero", page, problem: "segreto senza indizi", action: "Scrivi indizi rivelabili prima di usarlo al tavolo.", priority: 5 })),
      ...playability.map(page => ({ group: "Giocabilita", page, problem: "lore senza scelta, rischio, indizio o mossa", action: "Aggiungi uso al tavolo oppure spostalo fuori dalla coda.", priority: 4 })),
      ...historyGaps.map(page => ({ group: "Storia", page, problem: "evento senza causa, conseguenza o prossima mossa", action: "Collega cosa cambia nel mondo.", priority: 3 })),
      ...pressureGaps.map(page => ({ group: "Pressione", page, problem: "pressione senza innesco, conseguenza o mossa", action: "Rendi la pressione giocabile.", priority: 3 }))
    ].sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));

    return {
      anchors,
      completion,
      historyGaps,
      mysteries,
      mysteriesWithoutClues,
      playability,
      pressureGaps,
      pressures,
      priority,
      reviewPages,
      scope,
      timeline
    };
  }

  function renderLoreReviewNow(dv, worldLink = "") {
    const data = loreReviewData(dv, worldLink);
    const next = data.priority[0];
    const cards = [
      {
        title: next ? `Rivedi prima: ${next.group}` : "Rivedi prima: lore stabile",
        meta: next ? pageTitle(next.page) : "Nessuna revisione urgente",
        body: next?.problem ?? "Le note lore filtrate hanno canone, appigli e uso sufficienti.",
        importa: next?.action ?? "Puoi passare a canone, lore hub o mondo vivo.",
        link: next?.page?.file?.path ?? "Hub/Lore Hub.md",
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Da completare",
        meta: `${data.completion.length} note`,
        body: data.completion[0] ? pageTitle(data.completion[0].page) : "Nessuna nota incompleta.",
        importa: data.completion[0] ? `Manca ${data.completion[0].missing.join(", ")}.` : "I segnali principali hanno campi minimi.",
        link: data.completion[0]?.page?.file?.path ?? "Hub/Controllo Canone.md",
        cls: data.completion.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Non giocabile",
        meta: `${data.playability.length} note`,
        body: data.playability[0] ? pageTitle(data.playability[0]) : "Nessun lore decorativo in coda.",
        importa: data.playability[0] ? "Aggiungi scelta, rischio, indizio o prossima mossa." : "Le note hanno un uso leggibile al tavolo.",
        link: data.playability[0]?.file?.path ?? "Hub/Lore Hub.md",
        cls: data.playability.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Isolate",
        meta: `${data.anchors.length} senza appigli`,
        body: data.anchors[0] ? pageTitle(data.anchors[0]) : "Nessuna nota isolata.",
        importa: data.anchors[0] ? "Collega mondo, luogo, fazione, PNG, missione o sessione." : "Il lore ha appigli nel mondo.",
        link: data.anchors[0]?.file?.path ?? "Hub/Worldbuilder Dashboard.md",
        cls: data.anchors.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Segreti",
        meta: `${data.mysteriesWithoutClues.length} senza indizi`,
        body: data.mysteriesWithoutClues[0] ? pageTitle(data.mysteriesWithoutClues[0]) : "Misteri con indizi sufficienti.",
        importa: data.mysteriesWithoutClues[0] ? "Scrivi indizi prima di proteggerlo come segreto." : "Le verita nascoste hanno piste rivelabili.",
        link: data.mysteriesWithoutClues[0]?.file?.path ?? "Hub/Controllo Canone.md",
        cls: data.mysteriesWithoutClues.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Pressioni",
        meta: `${data.pressureGaps.length} senza uso chiaro`,
        body: data.pressureGaps[0] ? pageTitle(data.pressureGaps[0]) : "Nessuna pressione lore bloccata.",
        importa: data.pressureGaps[0] ? "Completa innesco, conseguenza e prossima mossa." : "Le pressioni hanno abbastanza materiale per il mondo vivo.",
        link: data.pressureGaps[0]?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: data.pressureGaps.length ? "gdr-kind-missing" : "gdr-kind-ready"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-lore-review-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderLoreReviewReadiness(dv, worldLink = "") {
    const data = loreReviewData(dv, worldLink);
    const stats = [
      ["Lore in revisione", data.reviewPages.length, "note da valutare"],
      ["Da completare", data.completion.length, "campi minimi mancanti"],
      ["Non giocabile", data.playability.length, "senza scelta o rischio"],
      ["Isolate", data.anchors.length, "senza appigli nel mondo"],
      ["Segreti", data.mysteriesWithoutClues.length, "senza indizi"],
      ["Storia", data.historyGaps.length, "senza effetto chiaro"],
      ["Pressioni", data.pressureGaps.length, "senza innesco o mossa"],
      ["Priorita", data.priority.length, "interventi ordinati"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-lore-review-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readLoreReviewCockpit() {
    return readJsonRel("z.automazioni/data/runtime/lore_review_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  function renderTable(dv, labels, id, headers, rows, empty) {
    dv.header(3, labels.get(id) ?? id);
    if (!rows.length) {
      dv.paragraph(empty);
      return;
    }
    dv.table(headers, rows);
  }

  async function renderLoreReviewCompletionQueues(dv, worldLink = "") {
    const cockpit = await readLoreReviewCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = loreReviewData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "completion",
      ["Nota", "Tipo", "Stato", "Serve ancora"],
      data.completion.slice(0, 30).map(row => [pageLink(row.page), row.page.categoria ?? row.page.tipo ?? "", row.page.stato ?? "", row.missing.join(", ")]),
      "Nessuna nota lore incompleta con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "playability",
      ["Nota", "Tipo", "Stato", "Scelte", "Rischi", "Indizi", "Prossima mossa"],
      data.playability.slice(0, 30).map(page => [pageLink(page), page.categoria ?? page.tipo ?? "", page.stato ?? "", page.scelte ?? [], page.rischi ?? [], page.indizi ?? [], fieldText(page.prossima_mossa) || ""]),
      "Nessun lore decorativo non giocabile con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "anchors",
      ["Nota", "Tipo", "Mondo", "Canone", "Sessioni"],
      data.anchors.slice(0, 30).map(page => [pageLink(page), page.categoria ?? page.tipo ?? "", page.mondo ?? "", page.stato_canonico ?? "", page.sessioni ?? []]),
      "Nessuna nota lore isolata con il filtro corrente."
    );
  }

  async function renderLoreReviewTableQueues(dv, worldLink = "") {
    const cockpit = await readLoreReviewCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = loreReviewData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "mysteries",
      ["Nota", "Tipo", "Stato", "Collegamenti"],
      data.mysteriesWithoutClues.slice(0, 30).map(page => [pageLink(page), page.tipo ?? page.categoria ?? "", page.stato ?? "", page.collegamenti ?? []]),
      "Nessun segreto senza indizi con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "history",
      ["Evento", "Data", "Perche", "Cosa cambia", "Prossima mossa"],
      data.historyGaps.slice(0, 30).map(page => [pageLink(page), page.data_mondo ?? "", fieldText(page.causa ?? page.cause) || "", page.conseguenze ?? page.effetti ?? [], fieldText(page.prossima_mossa) || ""]),
      "Nessun evento storico senza effetto chiaro con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "pressures",
      ["Pressione", "Avanzamento", "Quando avanza", "Fazioni", "Missioni", "Cosa cambia"],
      data.pressureGaps.slice(0, 30).map(page => [pageLink(page), progress(page), fieldText(page.innesco) || "", page.fazioni ?? [], page.missioni ?? [], page.conseguenze ?? []]),
      "Nessuna pressione lore senza uso al tavolo con il filtro corrente."
    );
  }

  async function renderLoreReviewSurfaceLinks(dv) {
    const cockpit = await readLoreReviewCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici revisione lore non configurate",
        action: "Rigenera il contratto Revisione Lore dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-lore-review-surfaces" });
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
    renderLoreReviewCompletionQueues,
    renderLoreReviewNow,
    renderLoreReviewReadiness,
    renderLoreReviewSurfaceLinks,
    renderLoreReviewTableQueues
  };
})
