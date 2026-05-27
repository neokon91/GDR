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

  const BLOCKED_ROUTE_STATES = new Set(["chiusa", "interrotta", "maledetta", "bloccata"]);

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

  function pageKey(page) {
    return linkKey(page?.file?.link ?? page?.file?.path ?? page?.file?.name ?? "");
  }

  function routeState(page) {
    return String(page?.stato_rotta ?? page?.stato ?? "").trim();
  }

  function sortByPressure(rows) {
    return [...rows].sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function economyScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const inScope = page => realPage(page) && matchesWorld(page);
    const pages = (source, predicate = () => true) => dv.pages(source).where(page => inScope(page) && predicate(page)).array();
    return { pages, selectedWorld };
  }

  function controllerRows(dv, data) {
    return data.controllers
      .map(controller => {
        const key = pageKey(controller);
        const controlledResources = data.resources
          .filter(resource => dvItems(dv, resource.fazioni_controllanti ?? resource.fazioni).some(item => linkKey(item) === key))
          .map(pageLink);
        const controlledRoutes = data.routes
          .filter(route => dvItems(dv, route.fazioni_controllanti ?? route.fazioni).some(item => linkKey(item) === key))
          .map(pageLink);
        const controlledMarkets = data.markets
          .filter(market => dvItems(dv, market.fazioni_controllanti ?? market.fazioni).some(item => linkKey(item) === key))
          .map(pageLink);
        return { controller, controlledResources, controlledRoutes, controlledMarkets };
      })
      .filter(row => row.controlledResources.length || row.controlledRoutes.length || row.controlledMarkets.length);
  }

  function dependencyRows(dv, data) {
    return data.places
      .map(place => {
        const key = pageKey(place);
        const declaredResources = dvItems(dv, place.risorse ?? place.risorse_strategiche);
        const resourceDeps = data.resources
          .filter(resource => {
            const resourceKey = pageKey(resource);
            return dvItems(dv, resource.luoghi_dipendenti ?? resource.dipendenze).some(item => linkKey(item) === key)
              || declaredResources.some(item => linkKey(item) === resourceKey || String(item ?? "").includes(resource.file?.name ?? ""));
          })
          .map(pageLink);
        const routeDeps = data.routes
          .filter(route => dvItems(dv, route.luoghi).some(item => linkKey(item) === key)
            || linkKey(route.partenza) === key
            || linkKey(route.arrivo) === key)
          .map(pageLink);
        return { place, declaredResources, resourceDeps, routeDeps };
      })
      .filter(row => row.declaredResources.length || row.resourceDeps.length || row.routeDeps.length);
  }

  function unpropagatedRows(dv, data) {
    return [...data.routes, ...data.resources, ...data.markets]
      .filter(page => (hasValue(dv, page.conseguenze) || hasValue(dv, page.conseguenze_se_bloccata))
        && !hasValue(dv, page.propaga_a)
        && !hasValue(dv, page.entita_impattate))
      .sort((left, right) => pressure(right) - pressure(left) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function gapRows(dv, data) {
    return [
      ...data.routes.filter(page => !hasValue(dv, page.rischi)).map(page => ({ page, problem: "rotta senza rischio", state: routeState(page) })),
      ...data.routes.filter(page => !hasValue(dv, page.fazioni_controllanti) && !hasValue(dv, page.fazioni)).map(page => ({ page, problem: "rotta senza controllore", state: routeState(page) })),
      ...data.routes.filter(page => !hasValue(dv, page.risorse_trasportate) && !hasValue(dv, page.risorse)).map(page => ({ page, problem: "rotta senza risorse", state: routeState(page) })),
      ...data.resources.filter(page => !hasValue(dv, page.luoghi) && !hasValue(dv, page.regioni)).map(page => ({ page, problem: "risorsa senza luogo", state: page.stato ?? "" })),
      ...data.resources.filter(page => !hasValue(dv, page.fazioni_controllanti) && !hasValue(dv, page.fazioni)).map(page => ({ page, problem: "risorsa senza controllore", state: page.stato ?? "" })),
      ...data.resources.filter(page => !hasValue(dv, page.uso_narrativo) && !hasValue(dv, page.usi)).map(page => ({ page, problem: "risorsa senza uso narrativo", state: page.stato ?? "" })),
      ...data.markets.filter(page => !hasValue(dv, page.luogo) && !hasValue(dv, page.luoghi)).map(page => ({ page, problem: "mercato senza luogo", state: page.stato ?? "" })),
      ...data.markets.filter(page => !hasValue(dv, page.risorse)).map(page => ({ page, problem: "mercato senza risorse", state: page.stato ?? "" })),
      ...data.markets.filter(page => !hasValue(dv, page.rischi)).map(page => ({ page, problem: "mercato senza rischio", state: page.stato ?? "" }))
    ].sort((left, right) => pressure(right.page) - pressure(left.page) || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
  }

  function economyData(dv, worldLink = "") {
    const scope = economyScope(dv, worldLink);
    const routes = scope.pages('"Mondi/Rotte"', page => page.file?.name !== "Rotte");
    const resources = scope.pages('"Mondi/Risorse"', page => page.file?.name !== "Risorse");
    const markets = scope.pages('"Mondi/Mercati"', page => page.file?.name !== "Mercati");
    const controllers = scope.pages('"Mondi/Fazioni" OR "Mondi/Religioni"');
    const places = scope.pages('"Mondi/Luoghi"');
    const data = { scope, routes, resources, markets, controllers, places };
    data.controllerRows = controllerRows(dv, data);
    data.dependencyRows = dependencyRows(dv, data);
    data.unpropagated = unpropagatedRows(dv, data);
    data.gaps = gapRows(dv, data);
    data.pressureNodes = sortByPressure([...routes, ...resources, ...markets].filter(page => pressure(page) > 0 || hasValue(dv, page.prossima_mossa)));
    data.openRoutes = routes.filter(page => routeState(page) === "aperta");
    data.blockedRoutes = routes.filter(page => BLOCKED_ROUTE_STATES.has(routeState(page)));
    data.contestedRoutes = routes.filter(page => routeState(page) === "contesa");
    data.priority = [
      ...data.blockedRoutes.filter(page => !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Rotta bloccata", page, problem: "manca prossima mossa", action: "Decidi cosa succede se resta bloccata.", priority: 6 })),
      ...data.contestedRoutes.filter(page => !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Rotta contesa", page, problem: "manca esito della contesa", action: "Trasforma la contesa in scelta, costo o conflitto.", priority: 5 })),
      ...data.unpropagated.map(page => ({ group: "Conseguenza", page, problem: "conseguenza non propagata", action: "Collega propaga_a o entita_impattate.", priority: 4 })),
      ...data.pressureNodes.filter(page => pressure(page) > 0 && !hasValue(dv, page.prossima_mossa)).map(page => ({ group: "Pressione", page, problem: "pressione senza prossima mossa", action: "Scrivi cosa fa se il party non interviene.", priority: 3 })),
      ...data.gaps.map(row => ({ group: "Buco", page: row.page, problem: row.problem, action: "Completa il campo mancante o archivia la nota.", priority: 2 }))
    ].sort((left, right) => right.priority - left.priority || (right.page.file?.mtime ?? 0) - (left.page.file?.mtime ?? 0));
    return data;
  }

  function renderEconomyNow(dv, worldLink = "") {
    const data = economyData(dv, worldLink);
    const next = data.priority[0];
    const topRoute = data.blockedRoutes[0] ?? data.contestedRoutes[0] ?? data.openRoutes[0] ?? data.routes[0];
    const topResource = sortByPressure(data.resources)[0];
    const topMarket = sortByPressure(data.markets)[0];
    const cards = [
      {
        title: next ? `Muovi prima: ${next.group}` : "Muovi prima: rete stabile",
        meta: next ? pageTitle(next.page) : "Nessuna urgenza economica",
        body: next?.problem ?? "Nessun blocco, conseguenza o buco urgente con il filtro corrente.",
        importa: next?.action ?? "Puoi usare economia e rotte come supporto della prossima scena.",
        link: next?.page?.file?.path ?? "",
        cls: next ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Rotte",
        meta: `${data.openRoutes.length} aperte · ${data.blockedRoutes.length} bloccate · ${data.contestedRoutes.length} contese`,
        body: topRoute ? pageTitle(topRoute) : "Nessuna rotta nel filtro corrente.",
        importa: topRoute ? fieldText(topRoute.prossima_mossa ?? topRoute.rischi ?? topRoute.conseguenze_se_bloccata) || "Definisci costo, rischio o conseguenza." : "Crea una rotta solo quando serve un passaggio giocabile.",
        link: topRoute?.file?.path ?? "z.bases/Economia.base",
        cls: topRoute ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Risorse",
        meta: `${data.resources.length} leve strategiche`,
        body: topResource ? pageTitle(topResource) : "Nessuna risorsa nel filtro corrente.",
        importa: topResource ? fieldText(topResource.uso_narrativo ?? topResource.usi ?? topResource.luoghi_dipendenti) || "Chiarisci chi dipende da questa risorsa." : "Aggiungi risorse solo se muovono fazioni, luoghi o missioni.",
        link: topResource?.file?.path ?? "z.bases/Economia.base",
        cls: topResource ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Mercati",
        meta: `${data.markets.length} nodi o strozzature`,
        body: topMarket ? pageTitle(topMarket) : "Nessun mercato nel filtro corrente.",
        importa: topMarket ? fieldText(topMarket.rischi ?? topMarket.prossima_mossa) || "Definisci pedaggio, controllo o rischio." : "Un mercato serve quando concentrare scambio, potere o rischio.",
        link: topMarket?.file?.path ?? "z.bases/Economia.base",
        cls: topMarket ? "gdr-kind-ready" : "gdr-kind-missing"
      },
      {
        title: "Propagazioni",
        meta: `${data.unpropagated.length} conseguenze da collegare`,
        body: data.unpropagated[0] ? pageTitle(data.unpropagated[0]) : "Nessuna conseguenza economica sospesa.",
        importa: data.unpropagated[0] ? "Collega bersagli o entita impattate." : "Le conseguenze economiche hanno gia bersagli o non sono aperte.",
        link: data.unpropagated[0]?.file?.path ?? "Hub/Motore Mondo Vivo.md",
        cls: data.unpropagated.length ? "gdr-kind-missing" : "gdr-kind-ready"
      },
      {
        title: "Buchi",
        meta: `${data.gaps.length} campi da chiudere`,
        body: data.gaps[0] ? data.gaps[0].problem : "Nessun buco economico evidente.",
        importa: data.gaps[0] ? pageTitle(data.gaps[0].page) : "La rete e abbastanza leggibile per usarla al tavolo.",
        link: data.gaps[0]?.page?.file?.path ?? "Risorse/Controllo Vault.md",
        cls: data.gaps.length ? "gdr-kind-missing" : "gdr-kind-ready"
      }
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-economy-now" });
    grid.innerHTML = cards.map(card => cardHtml({
      title: card.title,
      meta: card.meta,
      body: card.body,
      importa: card.importa,
      link: card.link,
      cls: `gdr-info-card compact ${card.cls}`
    })).join("");
  }

  function renderEconomyReadiness(dv, worldLink = "") {
    const data = economyData(dv, worldLink);
    const stats = [
      ["Rotte aperte", data.openRoutes.length, "passaggi disponibili"],
      ["Rotte bloccate", data.blockedRoutes.length, "conseguenze da decidere"],
      ["Rotte contese", data.contestedRoutes.length, "pressione politica o militare"],
      ["Risorse", data.resources.length, "leve strategiche"],
      ["Mercati", data.markets.length, "nodi e strozzature"],
      ["Controllori", data.controllerRows.length, "poteri economici"],
      ["Dipendenze", data.dependencyRows.length, "luoghi legati a risorse"],
      ["Propagazioni", data.unpropagated.length, "effetti senza bersaglio"],
      ["Buchi", data.gaps.length, "campi mancanti"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-economy-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readEconomyCockpit() {
    return readJsonRel("z.automazioni/data/runtime/economy_cockpit.json", {
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

  async function renderEconomyQueues(dv, worldLink = "") {
    const cockpit = await readEconomyCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = economyData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "routes",
      ["Rotta", "Stato", "Da", "A", "Risorse", "Controllori", "Pressione", "Prossima mossa"],
      sortByPressure(data.routes).slice(0, 30).map(page => [pageLink(page), routeState(page), page.partenza ?? "", page.arrivo ?? "", page.risorse_trasportate ?? page.risorse ?? [], page.fazioni_controllanti ?? page.fazioni ?? [], pressure(page) || "", fieldText(page.prossima_mossa) || ""]),
      "Nessuna rotta economica con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "resources",
      ["Risorsa", "Luoghi", "Controllori", "Uso", "Dipendenze", "Rotte", "Mercati"],
      sortByPressure(data.resources).slice(0, 30).map(page => [pageLink(page), page.luoghi ?? page.regioni ?? [], page.fazioni_controllanti ?? page.fazioni ?? [], fieldText(page.uso_narrativo ?? page.usi) || "", page.luoghi_dipendenti ?? page.dipendenze ?? [], page.rotte ?? [], page.mercati ?? []]),
      "Nessuna risorsa strategica con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "markets",
      ["Nodo", "Luogo", "Risorse", "Rotte", "Controllori", "Rischi", "Prossima mossa"],
      sortByPressure(data.markets).slice(0, 30).map(page => [pageLink(page), page.luogo ?? page.luoghi ?? [], page.risorse ?? [], page.rotte ?? [], page.fazioni_controllanti ?? page.fazioni ?? [], page.rischi ?? [], fieldText(page.prossima_mossa) || ""]),
      "Nessun mercato o nodo commerciale con il filtro corrente."
    );
  }

  async function renderEconomyDependencyQueues(dv, worldLink = "") {
    const cockpit = await readEconomyCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = economyData(dv, worldLink);

    renderTable(
      dv,
      labels,
      "controllers",
      ["Fazione", "Risorse", "Rotte", "Mercati"],
      data.controllerRows.slice(0, 30).map(row => [pageLink(row.controller), row.controlledResources, row.controlledRoutes, row.controlledMarkets]),
      "Nessun controllore economico esplicito con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "dependencies",
      ["Luogo", "Risorse dichiarate", "Dipende da", "Rotte collegate"],
      data.dependencyRows.slice(0, 30).map(row => [pageLink(row.place), row.declaredResources, row.resourceDeps, row.routeDeps]),
      "Nessuna dipendenza luogo-risorsa esplicita con il filtro corrente."
    );
    renderTable(
      dv,
      labels,
      "unpropagated",
      ["Nota", "Conseguenze", "Propaga a", "Entita impattate", "Prossima mossa"],
      data.unpropagated.slice(0, 30).map(page => [pageLink(page), page.conseguenze ?? page.conseguenze_se_bloccata ?? [], page.propaga_a ?? [], page.entita_impattate ?? [], fieldText(page.prossima_mossa) || ""]),
      "Nessuna conseguenza economica non propagata."
    );
    renderTable(
      dv,
      labels,
      "gaps",
      ["Nota", "Problema", "Stato"],
      data.gaps.slice(0, 50).map(row => [pageLink(row.page), row.problem, row.state]),
      "Nessun buco economico evidente con il filtro corrente."
    );
  }

  async function renderEconomySurfaceLinks(dv) {
    const cockpit = await readEconomyCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici economia non configurate",
        action: "Rigenera il contratto Economia E Rotte dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-economy-surfaces" });
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
    renderEconomyDependencyQueues,
    renderEconomyNow,
    renderEconomyQueues,
    renderEconomyReadiness,
    renderEconomySurfaceLinks
  };
})
