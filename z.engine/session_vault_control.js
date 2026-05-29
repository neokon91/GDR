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

  const VALID_STATES = new Set([
    "bozza",
    "preparazione",
    "pronto",
    "in gioco",
    "usato",
    "giocata",
    "consegnato",
    "proposta",
    "accettata",
    "in corso",
    "completata",
    "fallita",
    "da smistare",
    "smistata",
    "in pausa",
    "conclusa",
    "archiviata"
  ]);
  const OPEN_MISSION_STATES = new Set(["proposta", "accettata", "in corso"]);
  const MAP_USES = new Set(["zoom", "esagoni", "dungeon", "scena"]);

  function folderIndex(page) {
    const stem = String(page?.file?.path ?? "").replace(/\.md$/, "");
    const parts = stem.split("/");
    return parts.length > 1 && parts[parts.length - 1] === parts[parts.length - 2];
  }

  function servicePage(page) {
    return folderIndex(page) || page?.file?.path === "Mondi/Calendario.md";
  }

  function realPage(page) {
    return isReal(page) && !servicePage(page);
  }

  function pages(dv, source, predicate = () => true) {
    return dv.pages(source)
      .where(page => realPage(page) && predicate(page))
      .array();
  }

  function pathStarts(page, prefix) {
    return String(page?.file?.path ?? "").startsWith(prefix);
  }

  function sortedByMtime(rows) {
    return [...rows].sort((left, right) => (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0));
  }

  function asLink(page) {
    return page?.file?.link ?? page?.file?.path ?? pageTitle(page);
  }

  function dateRows(dv) {
    return [
      ...pages(dv, '"Mondi/Sessioni"', page => page.stato !== "archiviata" && hasText(page.data_mondo) && !hasText(page["fc-date"]))
        .map(page => ({ page, problem: "Sessione con data mondo ma senza fc-date", detail: page.data_mondo })),
      ...pages(dv, '"Mondi/Missioni"', page => page.stato !== "archiviata" && hasText(page.scadenza_mondo) && !hasText(page["fc-date"]))
        .map(page => ({ page, problem: "Missione con scadenza ma senza fc-date", detail: page.scadenza_mondo })),
      ...pages(dv, '"Mondi/Missioni" OR "Mondi/Sessioni"', page => page.stato !== "archiviata" && hasText(page["fc-date"]) && !hasText(page["fc-category"]))
        .map(page => ({ page, problem: "Evento Calendarium senza categoria", detail: page["fc-date"] }))
    ];
  }

  function invalidStateRows(dv) {
    return pages(dv, '"Mondi" OR "Campagne" OR "Inbox"', page => hasText(page.stato) && !VALID_STATES.has(String(page.stato)))
      .map(page => ({ page, problem: "stato fuori standard", detail: page.stato ?? "" }));
  }

  function missingBaseRows(dv) {
    return pages(dv, '"Mondi" OR "Campagne" OR "Inbox"', page => !hasText(page.categoria) || !hasText(page.stato))
      .map(page => ({ page, problem: "categoria o stato mancante", detail: [page.categoria ?? "manca categoria", page.stato ?? "manca stato"].join(" · ") }));
  }

  function incompleteRows(dv) {
    return [
      ...pages(dv, '"Inbox/Generati"', page => pathStarts(page, "Inbox/Generati/") && page.plugin === "fantasy-content-generator" && page.stato === "bozza" && !hasText(page.mondo) && !hasText(page.luogo))
        .map(page => ({ page, problem: "Bozza generata senza mondo o luogo", detail: page.tipo ?? page.categoria ?? "" })),
      ...pages(dv, '"Risorse/Mappe"', page => pathStarts(page, "Risorse/Mappe/") && page.file?.name !== "Mappe" && MAP_USES.has(String(page.uso ?? "")) && page.stato === "pronto" && (!hasText(page.mondo) || (!hasText(page.luogo) && !hasLinks(page.luoghi))))
        .map(page => ({ page, problem: "Mappa pronta senza mondo o luogo/luoghi", detail: page.uso ?? "" })),
      ...pages(dv, '"Mondi/Incontri"', page => pathStarts(page, "Mondi/Incontri/") && page.stato === "pronto" && !hasLinks(page.creature))
        .map(page => ({ page, problem: "Incontro pronto senza creature", detail: page.tipo ?? "" })),
      ...pages(dv, '"Mondi/Missioni"', page => pathStarts(page, "Mondi/Missioni/") && OPEN_MISSION_STATES.has(String(page.stato ?? "")) && !hasText(page.committente))
        .map(page => ({ page, problem: "Missione aperta senza committente", detail: page.stato ?? "" })),
      ...pages(dv, '"Mondi/Personaggi"', page => pathStarts(page, "Mondi/Personaggi/") && page.tipo === "png" && page.stato === "in gioco" && !hasText(page.luogo))
        .map(page => ({ page, problem: "PNG in gioco senza luogo", detail: page.ruolo ?? "" })),
      ...pages(dv, '"Mondi/Sessioni"', page => pathStarts(page, "Mondi/Sessioni/") && page.stato === "pronto" && (!hasLinks(page.luoghi) || !hasLinks(page.personaggi)))
        .map(page => ({ page, problem: "Sessione pronta senza luoghi o personaggi", detail: page.data ?? page.data_mondo ?? "" }))
    ];
  }

  const PLAYABILITY_GATES = ["tavolo", "movimento", "conseguenza", "collegamento"];
  const PLAYABILITY_GATE_ACTIONS = {
    tavolo: "Manuale: compila uso_al_tavolo, scena o posta. Workflow: Worldbuilder, Preparazione sessione o Materiali al tavolo.",
    movimento: "Manuale: compila prossima_mossa o pressione. Workflow: Motore mondo vivo o Task DM.",
    conseguenza: "Manuale: compila conseguenze, propaga_a o entita_impattate. Workflow: Post Sessione Guidato.",
    collegamento: "Manuale: collega mondo, luogo, fazione, missione o conseguenza. Workflow: Worldbuilder o Codex tabellare."
  };
  const MOVING_ENTITY_KINDS = new Set(["fazione", "culto", "religione", "png", "personaggio", "missione", "conflitto", "relazione", "rotta", "tracciato", "clock"]);
  const CONSEQUENCE_ENTITY_KINDS = new Set(["luogo", "fazione", "culto", "religione", "png", "personaggio", "missione", "conflitto", "relazione", "rotta", "tracciato", "clock", "incontro"]);

  function items(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  function anyValue(page, fields) {
    return fields.some(field => hasLinks(page?.[field]) || hasText(page?.[field]));
  }

  function positiveNumber(page, fields) {
    return fields.some(field => Number(page?.[field] ?? 0) > 0);
  }

  function normalizedKind(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function vaultEntityKind(page) {
    const explicitType = normalizedKind(page.tipo);
    if (pathStarts(page, "Mondi/Luoghi/")) return "luogo";
    if (pathStarts(page, "Mondi/Fazioni/")) return ["fazione", "culto", "religione"].includes(explicitType) ? explicitType : "fazione";
    if (pathStarts(page, "Mondi/Personaggi/")) return explicitType === "png" ? "png" : "personaggio";
    if (pathStarts(page, "Mondi/Missioni/")) return "missione";
    if (pathStarts(page, "Mondi/Conflitti/")) return "conflitto";
    if (pathStarts(page, "Mondi/Relazioni/")) return "relazione";
    if (pathStarts(page, "Mondi/Rotte/")) return "rotta";
    if (pathStarts(page, "Mondi/Incontri/")) return "incontro";
    if (pathStarts(page, "Risorse/Mappe/")) return "mappa";
    return normalizedKind(page.categoria ?? page.tipo);
  }

  function vaultEntityLinkCount(page) {
    const fields = [
      "mondo", "campagna", "campagne", "luogo", "luogo_padre", "partenza", "arrivo",
      "luoghi", "regioni", "culture", "lingue", "religioni", "fazioni", "fazioni_controllanti",
      "personaggi", "missioni", "conflitti", "sessioni", "relazioni", "risorse", "rotte",
      "mercati", "mappe", "propaga_a", "entita_impattate", "connessioni", "collegamenti",
      "indizi", "segreti", "committente", "creature"
    ];
    return fields.reduce((total, field) => {
      const value = page?.[field];
      const linked = items(value).filter(Boolean).length;
      return total + (linked || (hasText(value) ? 1 : 0));
    }, 0);
  }

  function liveEntityCandidate(page) {
    const kind = vaultEntityKind(page);
    const state = String(page.stato ?? "");
    const operationalState = ["preparazione", "pronto", "in gioco", "in corso", "attivo", "proposta", "accettata"].includes(state);
    const operationalKind = ["luogo", "fazione", "culto", "religione", "png", "personaggio", "missione", "conflitto", "relazione", "rotta", "tracciato", "clock", "incontro", "mappa"].includes(kind);
    return operationalKind && operationalState;
  }

  function requiredEntityGates(page) {
    const kind = vaultEntityKind(page);
    const gates = ["tavolo", "collegamento"];
    if (MOVING_ENTITY_KINDS.has(kind)) gates.splice(1, 0, "movimento");
    if (CONSEQUENCE_ENTITY_KINDS.has(kind)) gates.splice(gates.length - 1, 0, "conseguenza");
    return gates;
  }

  function entityGateCoverage(page) {
    const links = vaultEntityLinkCount(page);
    return {
      tavolo: anyValue(page, ["uso_al_tavolo", "promessa_al_tavolo", "scene", "scena", "gancio", "posta", "obiettivo", "obiettivo_giocabile", "indizi", "missioni"]),
      movimento: anyValue(page, ["prossima_mossa", "mosse", "innesco", "avanza_se", "tracciati", "clock"]) || positiveNumber(page, ["pressione", "pericolo"]),
      conseguenza: anyValue(page, ["conseguenza", "conseguenze", "conseguenze_se_bloccata", "effetti", "impatto", "propaga_a", "entita_impattate", "cambiamenti_quotidiani", "cosa_cambia"]),
      collegamento: links >= 2
    };
  }

  function liveEntityGateRows(dv) {
    return pages(dv, '"Mondi" OR "Risorse/Mappe"', page => liveEntityCandidate(page))
      .map(page => {
        const coverage = entityGateCoverage(page);
        const missingGates = requiredEntityGates(page).filter(gate => !coverage[gate]);
        const missingLabel = missingGates.join(", ");
        return {
          page,
          problem: missingGates.length ? `mancano: ${missingLabel}` : "gate completi",
          missingLabel,
          missingGates,
          action: missingGates[0] ? PLAYABILITY_GATE_ACTIONS[missingGates[0]] : "Nessuna azione richiesta.",
          workflow: [...new Set(missingGates.map(gate => PLAYABILITY_GATE_ACTIONS[gate]))].join(" | "),
          priority: missingGates.length
        };
      })
      .filter(row => row.missingGates.length)
      .sort((left, right) => right.priority - left.priority || (right.page?.file?.mtime ?? 0) - (left.page?.file?.mtime ?? 0));
  }

  function gateCounts(rows) {
    return PLAYABILITY_GATES.reduce((counts, gate) => {
      counts[gate] = rows.filter(row => row.missingGates.includes(gate)).length;
      return counts;
    }, {});
  }

  function vaultControlData(dv) {
    const inbox = sortedByMtime(pages(dv, '"Inbox"', page => pathStarts(page, "Inbox/") && !pathStarts(page, "Inbox/Generati/") && page.file?.name !== "Inbox" && !["smistata", "archiviata", "ignorata"].includes(String(page.stato ?? ""))));
    const generatedDrafts = sortedByMtime(pages(dv, '"Inbox/Generati"', page => pathStarts(page, "Inbox/Generati/") && page.plugin === "fantasy-content-generator" && page.stato === "bozza"));
    const prepSessions = pages(dv, '"Mondi/Sessioni"', page => pathStarts(page, "Mondi/Sessioni/") && page.stato === "preparazione")
      .sort((left, right) => String(left.data ?? "9999-99-99").localeCompare(String(right.data ?? "9999-99-99")));
    const mapsToPlay = sortedByMtime(pages(dv, '"Risorse/Mappe"', page => pathStarts(page, "Risorse/Mappe/") && page.file?.name !== "Mappe" && MAP_USES.has(String(page.uso ?? "")) && (page.stato !== "pronto" || (!hasText(page.luogo) && !hasLinks(page.luoghi)))));
    const readyMaterials = pages(dv, '"Mondi/Incontri" OR "Mondi/Dispense" OR "Mondi/Oggetti"', page => ["Mondi/Incontri/", "Mondi/Dispense/", "Mondi/Oggetti/"].some(prefix => pathStarts(page, prefix)) && page.stato === "pronto")
      .sort((left, right) => String(left.categoria ?? left.tipo ?? "").localeCompare(String(right.categoria ?? right.tipo ?? "")) || String(left.file?.name ?? "").localeCompare(String(right.file?.name ?? "")));
    const missions = pages(dv, '"Mondi/Missioni"', page => pathStarts(page, "Mondi/Missioni/") && OPEN_MISSION_STATES.has(String(page.stato ?? "")));
    const png = pages(dv, '"Mondi/Personaggi"', page => pathStarts(page, "Mondi/Personaggi/") && page.tipo === "png" && page.stato === "in gioco");
    const drafts = pages(dv, '"Mondi" OR "Campagne"', page => (pathStarts(page, "Mondi/") || pathStarts(page, "Campagne/")) && page.stato === "bozza");
    const invalidStates = invalidStateRows(dv);
    const missingBase = missingBaseRows(dv);
    const dates = dateRows(dv);
    const incomplete = incompleteRows(dv);
    const liveGaps = liveEntityGateRows(dv);
    const liveGateCounts = gateCounts(liveGaps);
    const attention = [
      ...generatedDrafts.map(page => ({ page, kind: "Bozza generata", action: "Smista o archivia." })),
      ...inbox.map(page => ({ page, kind: "Inbox", action: "Decidi se diventa gioco." })),
      ...prepSessions.map(page => ({ page, kind: "Sessione", action: "Completa preparazione." })),
      ...missions.map(page => ({ page, kind: "Missione", action: "Collega committente, luogo o prossima mossa." })),
      ...pages(dv, '"Mondi/Incontri"', page => pathStarts(page, "Mondi/Incontri/") && page.stato === "bozza").map(page => ({ page, kind: "Incontro", action: "Completa o archivia." }))
    ];

    return {
      attention,
      dates,
      drafts,
      generatedDrafts,
      inbox,
      incomplete,
      invalidStates,
      liveGateCounts,
      liveGaps,
      mapsToPlay,
      missingBase,
      missions,
      png,
      prepSessions,
      readyMaterials
    };
  }

  async function calendariumIssues(dv) {
    const data = await readJsonRel(".obsidian/plugins/calendarium/data.json", null);
    if (!data) {
      return [{ subject: "Calendarium", problem: "configurazione non leggibile", detail: "verifica plugin o fallback data_mondo" }];
    }
    const calendars = Array.isArray(data.calendars) ? data.calendars : Object.values(data.calendars ?? {});
    const names = new Set(calendars.flatMap(calendar => [calendar.name, calendar.id]).filter(Boolean).map(value => String(value).toLowerCase()));
    const dated = pages(dv, '"Mondi" OR "Campagne" OR "Inbox"', page => page.stato !== "archiviata" && hasText(page["fc-date"]));
    const issues = [];

    if (!calendars.length && dated.length) {
      issues.push({ subject: "Calendarium", problem: "nessun calendario salvato nella configurazione plugin", detail: `${dated.length} note hanno fc-date` });
    }
    if (calendars.length) {
      for (const page of dated) {
        if (hasText(page["fc-calendar"]) && !names.has(String(page["fc-calendar"]).toLowerCase())) {
          issues.push({ page, subject: asLink(page), problem: "fc-calendar non presente in Calendarium", detail: page["fc-calendar"] });
        }
      }
    }

    return issues;
  }

  function firstIssue(data, calendarIssues) {
    const groups = [
      ["Ripara prima: stato fuori standard", data.invalidStates[0], "Correggi lo stato o archivia la nota.", "Risorse/Controllo Vault.md"],
      ["Ripara prima: campi base mancanti", data.missingBase[0], "Compila categoria e stato.", "Risorse/Controllo Vault.md"],
      ["Ripara prima: pronto incompleto", data.incomplete[0], "Completa il collegamento mancante prima del tavolo.", "Risorse/Controllo Vault.md"],
      ["Ripara prima: entita viva incompleta", data.liveGaps[0], "Completa tavolo, movimento, conseguenza o collegamento.", "Risorse/Controllo Vault.md"],
      ["Ripara prima: data da calendarizzare", data.dates[0], "Allinea data_mondo, fc-date e categoria Calendarium.", "Risorse/Controllo Vault.md"],
      ["Ripara prima: Calendarium", calendarIssues[0], "Controlla calendario o fallback manuale.", "Risorse/Controllo Vault.md"],
      ["Ripara prima: inbox", data.attention[0], "Smista, collega o archivia.", data.attention[0]?.page?.file?.path ?? "Inbox/Inbox.md"]
    ];
    return groups.find(([, row]) => row) ?? ["Vault pronto", null, "Nessun blocco evidente prima del tavolo.", "Hub/1. DM Dashboard.md"];
  }

  async function renderVaultControlNow(dv) {
    const data = vaultControlData(dv);
    const calendarIssues = await calendariumIssues(dv);
    const [title, row, action, link] = firstIssue(data, calendarIssues);
    const cards = [
      cardHtml({
        title,
        meta: row?.page ? pageTitle(row.page) : row?.subject ?? "Controllo operativo",
        body: row?.problem ?? row?.kind ?? "Nessuna coda bloccante.",
        importa: row?.detail ?? row?.action ?? action,
        link: row?.page?.file?.path ?? link,
        cls: `gdr-info-card compact ${row ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Coerenza",
        meta: `${data.invalidStates.length + data.missingBase.length} problemi base`,
        body: data.invalidStates[0]?.problem ?? data.missingBase[0]?.problem ?? "Stati e campi base allineati.",
        importa: data.invalidStates[0]?.detail ?? data.missingBase[0]?.detail ?? "Puoi passare a sessioni, materiali o worldbuilding.",
        link: data.invalidStates[0]?.page?.file?.path ?? data.missingBase[0]?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.invalidStates.length || data.missingBase.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Tavolo",
        meta: `${data.prepSessions.length} sessioni · ${data.readyMaterials.length} materiali`,
        body: data.prepSessions[0] ? pageTitle(data.prepSessions[0]) : data.readyMaterials[0] ? pageTitle(data.readyMaterials[0]) : "Nessun materiale bloccante.",
        importa: data.prepSessions[0] ? "Completa la preparazione." : data.readyMaterials[0] ? "Verifica che sia collegato alla prossima sessione." : "Apri DM Dashboard per scegliere il prossimo passo.",
        link: data.prepSessions[0]?.file?.path ?? data.readyMaterials[0]?.file?.path ?? "Hub/1. DM Dashboard.md",
        cls: "gdr-info-card compact gdr-kind-ready"
      }),
      cardHtml({
        title: "Entita vive",
        meta: `${data.liveGaps.length} da completare`,
        body: data.liveGaps[0] ? `${pageTitle(data.liveGaps[0].page)}: ${data.liveGaps[0].problem}` : "Tavolo, movimento, conseguenze e collegamenti sono coperti.",
        importa: data.liveGaps[0]?.action ?? "Le entita operative hanno abbastanza appigli per arrivare al gioco.",
        link: data.liveGaps[0]?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.liveGaps.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Da smistare",
        meta: `${data.inbox.length + data.generatedDrafts.length} note`,
        body: data.attention[0] ? pageTitle(data.attention[0].page) : "Inbox pulita.",
        importa: data.attention[0]?.action ?? "Nessuna bozza richiede decisione immediata.",
        link: data.attention[0]?.page?.file?.path ?? "Risorse/Smistamento Bozze Generate.md",
        cls: `gdr-info-card compact ${data.attention.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      cardHtml({
        title: "Calendario",
        meta: `${data.dates.length + calendarIssues.length} avvisi`,
        body: data.dates[0]?.problem ?? calendarIssues[0]?.problem ?? "Date allineate.",
        importa: data.dates[0]?.detail ?? calendarIssues[0]?.detail ?? "Le scadenze narrative possono restare leggibili.",
        link: data.dates[0]?.page?.file?.path ?? calendarIssues[0]?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${data.dates.length || calendarIssues.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-vault-control-now" });
    grid.innerHTML = cards.join("");
  }

  async function renderVaultControlReadiness(dv) {
    const data = vaultControlData(dv);
    const calendarIssues = await calendariumIssues(dv);
    const stats = [
      ["Idee", data.inbox.length, "da smistare"],
      ["Bozze generate", data.generatedDrafts.length, "da rivedere"],
      ["Sessioni", data.prepSessions.length, "in preparazione"],
      ["Materiali", data.readyMaterials.length, "pronti"],
      ["Missioni", data.missions.length, "aperte"],
      ["PNG", data.png.length, "in gioco"],
      ["Tavolo", data.liveGateCounts.tavolo, "entita senza scena"],
      ["Movimento", data.liveGateCounts.movimento, "senza prossima mossa"],
      ["Conseguenze", data.liveGateCounts.conseguenza, "senza cosa cambia"],
      ["Collegamenti", data.liveGateCounts.collegamento, "senza agganci"],
      ["Bozze", data.drafts.length, "da completare"],
      ["Stati", data.invalidStates.length, "fuori standard"],
      ["Base", data.missingBase.length, "campi mancanti"],
      ["Calendario", data.dates.length + calendarIssues.length, "avvisi"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-vault-control-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readVaultControlCockpit() {
    return readJsonRel("z.automazioni/data/runtime/vault_control_cockpit.json", {
      queues: [],
      surfaces: []
    });
  }

  async function renderVaultControlQueues(dv) {
    const cockpit = await readVaultControlCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const data = vaultControlData(dv);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "attention",
      ["Nota", "Tipo", "Stato", "Azione"],
      data.attention.slice(0, 12).map(row => [asLink(row.page), row.kind, row.page?.stato ?? "", row.action]),
      "Niente di urgente da controllare."
    );
    renderTable(
      "maps",
      ["Mappa", "Uso", "Stato", "Collegamento"],
      data.mapsToPlay.slice(0, 12).map(page => [asLink(page), page.uso ?? "", page.stato ?? "", fieldText(page.luogo ?? page.luoghi ?? page.mondo) || "da collegare"]),
      "Nessuna mappa da rendere giocabile."
    );
    renderTable(
      "table_ready",
      ["Nota", "Categoria", "Stato", "Luogo"],
      data.readyMaterials.slice(0, 12).map(page => [asLink(page), page.categoria ?? page.tipo ?? "", page.stato ?? "", fieldText(page.luogo ?? page.luoghi) || "non indicato"]),
      "Nessun materiale pronto marcato."
    );
    renderTable(
      "campaign_open",
      ["Nota", "Tipo", "Stato", "Collegamenti"],
      [...data.missions, ...data.png, ...data.drafts].slice(0, 12).map(page => [asLink(page), page.tipo ?? page.categoria ?? "", page.stato ?? "", fieldText(page.luoghi ?? page.personaggi ?? page.collegamenti) || "da collegare"]),
      "Nessuna missione, PNG o bozza operativa da mostrare."
    );
    renderTable(
      "live_entities",
      ["Nota", "Manca", "Azione", "Workflow esistente"],
      data.liveGaps.slice(0, 12).map(row => [asLink(row.page), row.missingLabel, row.action, row.workflow]),
      "Nessuna entita viva incompleta tra tavolo, movimento, conseguenza e collegamento."
    );
  }

  async function renderVaultControlCoherence(dv) {
    const data = vaultControlData(dv);
    const calendarIssues = await calendariumIssues(dv);
    const renderTable = (title, headers, rows, empty) => {
      dv.header(3, title);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "Stati Fuori Standard",
      ["Nota", "Categoria", "Stato"],
      data.invalidStates.map(row => [asLink(row.page), row.page?.categoria ?? "", row.detail]),
      "Nessuno stato fuori standard."
    );
    renderTable(
      "Campi Base Mancanti",
      ["Nota", "Categoria", "Stato"],
      data.missingBase.map(row => [asLink(row.page), row.page?.categoria ?? "manca", row.page?.stato ?? "manca"]),
      "Nessuna nota senza categoria o stato."
    );
    renderTable(
      "Date Da Calendarizzare",
      ["Nota", "Problema", "Data"],
      data.dates.map(row => [asLink(row.page), row.problem, row.detail]),
      "Nessuna data narrativa da calendarizzare."
    );
    renderTable(
      "Configurazione Calendarium",
      ["Elemento", "Problema", "Dettaglio"],
      calendarIssues.map(row => [row.subject ?? asLink(row.page), row.problem, row.detail]),
      "Calendarium allineato con le note datate."
    );
    renderTable(
      "Pronti Ma Incompleti",
      ["Nota", "Problema", "Dettaglio"],
      data.incomplete.map(row => [asLink(row.page), row.problem, row.detail]),
      "Nessun materiale pronto incompleto."
    );
    renderTable(
      "Entita Vive Incomplete",
      ["Nota", "Manca", "Azione"],
      data.liveGaps.map(row => [asLink(row.page), row.missingLabel, row.action]),
      "Nessuna entita viva incompleta."
    );
  }

  async function renderVaultControlSurfaceLinks(dv) {
    const cockpit = await readVaultControlCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici controllo vault non configurate",
        action: "Rigenera il contratto Controllo Vault dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-vault-control-surfaces" });
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
    renderVaultControlCoherence,
    renderVaultControlNow,
    renderVaultControlQueues,
    renderVaultControlReadiness,
    renderVaultControlSurfaceLinks
  };
})
