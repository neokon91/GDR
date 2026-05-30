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

  function typeOf(page, fallback = "") {
    return String(page?.tipo ?? page?.categoria ?? fallback).trim();
  }

  function progress(page) {
    const value = Number(page?.progress_value ?? 0) || 0;
    const max = Number(page?.progress_max ?? 0) || 0;
    return max ? `${value}/${max}` : "";
  }

  function sortOperational(rows) {
    return [...rows].sort((left, right) => {
      const leftPressure = Number(left.priority ?? pressure(left.page ?? left) ?? 0);
      const rightPressure = Number(right.priority ?? pressure(right.page ?? right) ?? 0);
      return rightPressure - leftPressure || ((right.page ?? right).file?.mtime ?? 0) - ((left.page ?? left).file?.mtime ?? 0);
    });
  }

  function campaignScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const inScope = page => realPage(page) && matchesWorld(page);
    const pages = (source, predicate = () => true) => dv.pages(source).where(page => inScope(page) && predicate(page)).array();
    return { pages, selectedWorld };
  }

  function opportunityRows(dv, data) {
    return sortOperational([
      ...data.places
        .filter(page => Number(page.pericolo ?? 0) > 0
          || pressure(page) > 0
          || hasValue(dv, page.segreti)
          || hasValue(dv, page.problemi)
          || hasValue(dv, page.tensione)
          || hasValue(dv, page.prossima_mossa))
        .map(page => ({
          page,
          kind: "Luogo",
          priority: Math.max(Number(page.pericolo ?? 0) || 0, pressure(page)),
          hook: fieldText(page.tensione ?? page.impressione ?? page.prossima_mossa ?? page.problemi ?? page.segreti),
          powers: page.fazioni ?? [],
          exit: "regione o missione"
        })),
      ...data.cultures
        .filter(page => hasValue(dv, page.tensioni) || hasValue(dv, page.segreti) || hasValue(dv, page.conflitti) || hasValue(dv, page.prossima_mossa))
        .map(page => ({
          page,
          kind: "Cultura",
          priority: pressure(page),
          hook: fieldText(page.tensioni ?? page.conflitti ?? page.segreti ?? page.prossima_mossa),
          powers: page.fazioni ?? [],
          exit: "arco sociale"
        })),
      ...data.conflicts
        .map(page => ({
          page,
          kind: "Conflitto",
          priority: Math.max(pressure(page), 1),
          hook: fieldText(page.prossima_mossa ?? page.posta ?? page.causa ?? page.tensione),
          powers: page.fazioni ?? page.soggetti ?? [],
          exit: "fronte o arco"
        })),
      ...data.factions
        .filter(page => pressure(page) > 0 || hasValue(dv, page.prossima_mossa))
        .map(page => ({
          page,
          kind: "Fazione",
          priority: pressure(page),
          hook: fieldText(page.prossima_mossa ?? page.obiettivo ?? page.tensione),
          powers: page.rivali ?? page.alleati ?? [],
          exit: "fronte"
        }))
    ]);
  }

  function frontRows(dv, data) {
    return sortOperational([
      ...data.conflicts,
      ...data.missions,
      ...data.factions,
      ...data.tracks
    ].filter(page => pressure(page) > 0
      || Number(page.progress_value ?? 0) > 0
      || hasValue(dv, page.prossima_mossa)
      || hasValue(dv, page.scadenza_mondo)
    ).map(page => ({ page, priority: Math.max(pressure(page), Number(page.progress_value ?? 0) || 0) })));
  }

  function campaignGaps(dv, data) {
    return [
      ...data.campaigns.filter(page => !hasValue(dv, page.promessa) && !hasValue(dv, page.pitch))
        .map(page => ({ page, problem: "campagna senza promessa", action: "Scrivi cosa rende giocabile la campagna.", priority: 5 })),
      ...data.campaigns.filter(page => !hasValue(dv, page.regione) && !hasValue(dv, page.luogo_iniziale))
        .map(page => ({ page, problem: "campagna senza regione o luogo iniziale", action: "Scegli dove parte il tavolo.", priority: 4 })),
      ...data.campaigns.filter(page => !hasValue(dv, page.conflitto_centrale) && !hasValue(dv, page.conflitti))
        .map(page => ({ page, problem: "campagna senza conflitto centrale", action: "Collega un conflitto o fronte.", priority: 4 })),
      ...data.campaigns.filter(page => !hasValue(dv, page.prossima_sessione) && !hasValue(dv, page.sessioni))
        .map(page => ({ page, problem: "campagna senza prossima sessione", action: "Materializza il ponte verso il tavolo.", priority: 3 })),
      ...data.fronts.filter(row => pressure(row.page) > 0 && !hasValue(dv, row.page.prossima_mossa))
        .map(row => ({ page: row.page, problem: "fronte sotto pressione senza prossima mossa", action: "Scrivi cosa accade se il party non interviene.", priority: 3 }))
    ].sort((left, right) => right.priority - left.priority || pressure(right.page) - pressure(left.page) || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
  }

  function campaignBuilderData(dv, worldLink = "") {
    const scope = campaignScope(dv, worldLink);
    const places = scope.pages('"Mondi/Luoghi"', page => page.file?.name !== "Luoghi");
    const conflicts = scope.pages('"Mondi/Conflitti"', page => page.file?.name !== "Conflitti");
    const cultures = scope.pages('"Mondi/Culture"', page => page.file?.name !== "Culture");
    const factions = scope.pages('"Mondi/Fazioni"', page => page.file?.name !== "Fazioni");
    const missions = scope.pages('"Mondi/Missioni"', page => page.file?.name !== "Missioni");
    const sessions = scope.pages('"Mondi/Sessioni"', page => page.file?.name !== "Sessioni");
    const tracks = scope.pages('"Mondi/Tracciati"', page => page.file?.name !== "Tracciati");
    const campaigns = scope.pages('"Campagne"', page => page.file?.name !== "Campagne");
    const data = { campaigns, conflicts, cultures, factions, missions, places, scope, sessions, tracks };
    data.opportunities = opportunityRows(dv, data);
    data.fronts = frontRows(dv, data);
    data.gaps = campaignGaps(dv, data);
    data.priority = [
      ...(!campaigns.length && data.opportunities.length ? [{
        group: "Campagna",
        page: data.opportunities[0].page,
        problem: "ambientazione pronta senza campagna",
        action: "Scegli promessa, regione iniziale e conflitto centrale.",
        priority: 6
      }] : []),
      ...data.gaps.map(row => ({ group: "Buco", ...row })),
      ...data.opportunities.filter(row => row.priority >= 4 && !hasValue(dv, row.page.prossima_mossa))
        .map(row => ({ group: row.kind, page: row.page, problem: "opportunita forte senza esito", action: "Trasformala in arco, missione o clock.", priority: 3 }))
    ].sort((left, right) => right.priority - left.priority || pressure(right.page) - pressure(left.page) || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
    return data;
  }

  function renderCampaignBuilderNow(dv, worldLink = "") {
    const data = campaignBuilderData(dv, worldLink);
    const next = data.priority[0];
    const topOpportunity = data.opportunities[0];
    const topFront = data.fronts[0]?.page;
    const topCampaign = data.campaigns[0];
    const topSession = data.sessions.find(page => ["bozza", "preparazione", "pronto"].includes(String(page.stato ?? ""))) ?? data.sessions[0];
    const cards = [
      {
        title: next ? `Trasforma prima: ${next.group}` : "Trasforma prima: ponte pronto",
        meta: next ? pageTitle(next.page) : "Nessun blocco campagna evidente",
        body: next?.problem ?? "L'ambientazione ha gia un ponte leggibile verso campagna e tavolo.",
        importa: next?.action ?? "Usa le code per scegliere cosa portare alla prossima sessione.",
        link: next?.page?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Opportunita",
        meta: `${data.opportunities.length} fonti giocabili`,
        body: topOpportunity ? pageTitle(topOpportunity.page) : "Nessun gancio evidente nel filtro corrente.",
        importa: topOpportunity ? topOpportunity.hook || "Dai un gancio concreto alla fonte." : "Cerca tensioni, pericoli, segreti o conflitti.",
        link: topOpportunity?.page?.file?.path ?? "Hub/Atlante del Mondo.md",
        cls: topOpportunity ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Campagne",
        meta: `${data.campaigns.length} create`,
        body: topCampaign ? pageTitle(topCampaign) : "Nessuna campagna collegata al mondo.",
        importa: topCampaign ? fieldText(topCampaign.promessa ?? topCampaign.pitch ?? topCampaign.conflitto_centrale) || "Completa promessa e conflitto." : "Crea una campagna solo dopo aver scelto il pezzo di mondo da giocare.",
        link: topCampaign?.file?.path ?? "Hub/Campagna da Ambientazione.md",
        cls: topCampaign ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Fronti",
        meta: `${data.fronts.length} pressioni ordinate`,
        body: topFront ? pageTitle(topFront) : "Nessun fronte operativo.",
        importa: topFront ? fieldText(topFront.prossima_mossa ?? topFront.scadenza_mondo ?? topFront.posta) || "Definisci prossima mossa o scadenza." : "Un fronte serve quando qualcosa avanza fuori scena.",
        link: topFront?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: topFront ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Tavolo",
        meta: `${data.missions.length} missioni · ${data.sessions.length} sessioni`,
        body: topSession ? pageTitle(topSession) : "Nessuna sessione collegata.",
        importa: topSession ? fieldText(topSession.obiettivo ?? topSession.scelta ?? topSession.scena_corrente) || "Completa obiettivo e scelta." : "Quando la campagna esiste, crea la prima sessione.",
        link: topSession?.file?.path ?? "Risorse/Preparazione Sessione.md",
        cls: topSession ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Buchi",
        meta: `${data.gaps.length} da chiudere`,
        body: data.gaps[0] ? data.gaps[0].problem : "Nessun buco evidente.",
        importa: data.gaps[0] ? data.gaps[0].action : "Il ponte ambientazione-campagna e abbastanza solido.",
        link: data.gaps[0]?.page?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: data.gaps.length ? "gdr-kind-missing" : "gdr-kind-ready"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-campaign-builder-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderCampaignBuilderReadiness(dv, worldLink = "") {
    const data = campaignBuilderData(dv, worldLink);
    const stats = [
      ["Regioni", data.places.length, "luoghi e territori da usare"],
      ["Conflitti", data.conflicts.length, "tensioni strutturate"],
      ["Culture", data.cultures.length, "spinte sociali"],
      ["Fazioni", data.factions.length, "poteri e avversari"],
      ["Campagne", data.campaigns.length, "cornici di gioco"],
      ["Missioni", data.missions.length, "obiettivi concreti"],
      ["Sessioni", data.sessions.length, "tavolo materializzato"],
      ["Fronti", data.fronts.length, "pressioni che avanzano"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-campaign-builder-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readCampaignBuilderCockpit() {
    return readJsonRel("z.automazioni/data/runtime/campaign_builder_cockpit.json", {
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

  async function renderCampaignBuilderOpportunityQueues(dv, worldLink = "") {
    const cockpit = await readCampaignBuilderCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = campaignBuilderData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "opportunities",
      ["Fonte", "Tipo", "Pressione", "Gancio", "Poteri", "Uscita"],
      data.opportunities.slice(0, 30).map(row => [pageLink(row.page), row.kind, row.priority || "", row.hook, row.powers, row.exit]),
      "Nessuna opportunita evidente. Cerca pericoli, segreti, tensioni o conflitti nell'Atlante."
    );
    renderTable(
      dv,
      labels,
      "fronts",
      ["Fronte", "Tipo", "Pressione", "Progresso", "Scadenza", "Poteri", "Prossima mossa"],
      data.fronts.slice(0, 30).map(row => [pageLink(row.page), typeOf(row.page), pressure(row.page) || "", progress(row.page), row.page.scadenza_mondo ?? "", row.page.fazioni ?? row.page.soggetti ?? [], fieldText(row.page.prossima_mossa) || ""]),
      "Nessun fronte di campagna sotto pressione con il filtro corrente."
    );
  }

  async function renderCampaignBuilderCampaignQueues(dv, worldLink = "") {
    const cockpit = await readCampaignBuilderCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = campaignBuilderData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "campaigns",
      ["Campagna", "Stato", "Profilo", "Regione", "Culture", "Fazioni", "Conflitti", "Prossima sessione"],
      data.campaigns.slice(0, 30).map(page => [pageLink(page), page.stato ?? "", page.profilo ?? page.tipo ?? "", page.regione ?? page.luogo_iniziale ?? "", page.culture ?? [], page.fazioni ?? [], page.conflitti ?? page.conflitto_centrale ?? [], page.prossima_sessione ?? ""]),
      "Nessuna campagna creata dall'ambientazione con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "sessions",
      ["Sessione", "Stato", "Data", "Campagna", "Mondo", "Obiettivo"],
      data.sessions.slice(0, 30).map(page => [pageLink(page), page.stato ?? "", page.data ?? "", page.campagna ?? page.campagne ?? "", page.mondo ?? "", fieldText(page.obiettivo ?? page.scelta ?? page.scena_corrente) || ""]),
      "Nessuna sessione collegata alla campagna con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "gaps",
      ["Nota", "Problema", "Azione", "Stato"],
      data.gaps.slice(0, 30).map(row => [pageLink(row.page), row.problem, row.action, row.page.stato ?? ""]),
      "Nessun buco campagna evidente con il filtro corrente."
    );
  }

  async function renderCampaignBuilderSurfaceLinks(dv) {
    const cockpit = await readCampaignBuilderCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici campagna non configurate",
        action: "Rigenera il contratto Campagna da Ambientazione dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-campaign-builder-surfaces" });
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
    renderCampaignBuilderCampaignQueues,
    renderCampaignBuilderNow,
    renderCampaignBuilderOpportunityQueues,
    renderCampaignBuilderReadiness,
    renderCampaignBuilderSurfaceLinks
  };
})
