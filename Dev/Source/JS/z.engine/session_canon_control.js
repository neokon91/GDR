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

  function anyValue(dv, page, fields) {
    return fields.some(field => hasValue(dv, page?.[field]));
  }

  function realPage(page) {
    const folderIndex = page?.file?.name === page?.file?.folder?.split("/").pop();
    return isReal(page) && !folderIndex && page.stato !== "archiviata" && page.stato !== "ignorata";
  }

  function canonCategory(page) {
    const folder = String(page?.file?.folder ?? "");
    if (folder.includes("Mondi/Timeline") || folder.includes("Mondi/Storia")) return "evento storico";
    if (folder.includes("Mondi/Segreti")) return "segreto";
    if (folder.includes("Mondi/Cosmologia")) return "cosmologia";
    if (folder.includes("Mondi/Culture")) return "cultura";
    if (folder.includes("Mondi/Luoghi")) return "luogo";
    if (folder.includes("Mondi/Fazioni")) return "fazione";
    if (folder.includes("Inbox")) return String(page?.categoria ?? "appunto").toLowerCase();
    return String(page?.categoria ?? page?.tipo ?? "nota").trim().toLowerCase() || "nota";
  }

  function canonState(page) {
    if (page?.stato_canonico) return String(page.stato_canonico).toLowerCase();
    if (page?.canonico === true) return "canonico";
    if (page?.canonico === false) return "non canonico";
    return "";
  }

  function isCanonical(page) {
    return page?.canonico === true || canonState(page) === "canonico";
  }

  function isEvent(dv, page) {
    return canonCategory(page) === "evento storico" || hasValue(dv, page?.data_mondo);
  }

  function canonScope(dv, worldLink = "") {
    const selectedWorld = linkKey(worldLink);
    const matchesWorld = page => !selectedWorld || linkKey(page.mondo) === selectedWorld || page.file?.path === selectedWorld;
    const pages = dv.pages('"Mondi" OR "Inbox"')
      .where(page => realPage(page) && matchesWorld(page))
      .array();
    return { pages, selectedWorld };
  }

  function canonRelevant(dv, page) {
    const category = canonCategory(page);
    return hasValue(dv, page.stato_canonico)
      || page.canonico !== undefined
      || ["lore capture", "evento storico", "segreto", "cosmologia"].includes(category)
      || hasValue(dv, page.contraddice)
      || hasValue(dv, page.retcon_di);
  }

  function sorted(rows) {
    return rows.sort((left, right) => right.priority - left.priority || (right.page?.file?.mtime ?? 0) - (left.page?.file?.mtime ?? 0));
  }

  function truthRows(dv, scope) {
    return scope.pages
      .filter(page => canonRelevant(dv, page))
      .filter(page => hasValue(dv, page.stato_canonico) || page.canonico !== undefined)
      .sort((left, right) => String(canonState(left)).localeCompare(String(canonState(right))) || (right.file?.mtime ?? 0) - (left.file?.mtime ?? 0))
      .map(page => ({
        group: "Canone",
        page,
        problem: isCanonical(page) ? "verita confermata" : canonState(page) || "decisione segnata",
        action: isCanonical(page) ? "Verifica fonte, conseguenze e collegamenti." : "Decidi se stabilizzarla, trasformarla in rumor o archiviarla.",
        priority: isCanonical(page) ? 2 : 1
      }));
  }

  function rumorRows(dv, scope) {
    return sorted(scope.pages
      .filter(page => ["rumor", "leggenda", "falso", "segreto"].includes(canonState(page)))
      .map(page => ({
        group: "Rumor",
        page,
        problem: `${canonState(page)} da tenere sotto controllo`,
        action: anyValue(dv, page, ["collegamenti", "luoghi", "prossima_mossa", "indizi"])
          ? "Mantieni agganci e segnali finche serve al tavolo."
          : "Collega dove emerge, chi lo ripete o cosa puo far succedere.",
        priority: anyValue(dv, page, ["collegamenti", "luoghi", "prossima_mossa", "indizi"]) ? 1 : 3
      })));
  }

  function contradictionRows(dv, scope) {
    return sorted(scope.pages
      .filter(page => hasValue(dv, page.contraddice) || hasValue(dv, page.retcon_di) || canonState(page) === "retcon")
      .map(page => ({
        group: "Contraddizione",
        page,
        problem: hasValue(dv, page.contraddice) ? "contraddice materiale esistente" : "correzione o retcon aperta",
        action: hasValue(dv, page.retcon_motivo) ? "Propaga cosa cambia nelle note collegate." : "Scrivi motivo, fonte e conseguenze della correzione.",
        priority: hasValue(dv, page.retcon_motivo) ? 4 : 6
      })));
  }

  function provenanceRows(dv, scope) {
    const rows = [];
    for (const page of scope.pages) {
      if (!isCanonical(page)) continue;
      const missingSource = !hasValue(dv, page.fonte) && !hasValue(dv, page.sessioni);
      const sessionSourceWithoutSession = String(page.fonte ?? "").toLowerCase() === "sessione" && !hasValue(dv, page.sessioni);
      if (missingSource || sessionSourceWithoutSession) {
        rows.push({
          group: "Provenienza",
          page,
          problem: missingSource ? "verita senza fonte o sessione" : "fonte sessione senza sessione collegata",
          action: "Aggiungi fonte, sessione o appunto da cui nasce la verita.",
          priority: 6
        });
      }
      if (isEvent(dv, page) && !anyValue(dv, page, ["causa", "cause"])) {
        rows.push({
          group: "Provenienza",
          page,
          problem: "evento canonico senza causa",
          action: "Collega causa o decisione che ha prodotto l'evento.",
          priority: 5
        });
      }
      if (isEvent(dv, page) && !anyValue(dv, page, ["conseguenze", "effetti", "cambiamenti_quotidiani"])) {
        rows.push({
          group: "Provenienza",
          page,
          problem: "evento canonico senza conseguenze",
          action: "Collega cosa cambia per luoghi, fazioni, culture o timeline.",
          priority: 5
        });
      }
    }
    return sorted(rows);
  }

  function retconRows(dv, scope) {
    return sorted(scope.pages
      .filter(page => canonState(page) === "retcon" || hasValue(dv, page.retcon_di))
      .map(page => {
        const missing = [
          !hasValue(dv, page.retcon_motivo) ? "motivo" : "",
          !hasValue(dv, page.conseguenze) ? "conseguenze" : "",
          !hasValue(dv, page.prossima_mossa) ? "prossima mossa" : ""
        ].filter(Boolean);
        return {
          group: "Retcon",
          page,
          problem: missing.length ? `manca ${missing.join(", ")}` : "retcon pronta da propagare",
          action: missing.length ? "Completa motivo, conseguenze e prossima mossa." : "Propaga la correzione alle note collegate.",
          missing,
          priority: missing.length ? 6 : 3
        };
      }));
  }

  function decisionRows(dv, scope) {
    return sorted(scope.pages
      .filter(page => canonRelevant(dv, page))
      .filter(page => !hasValue(dv, page.stato_canonico) && page.canonico === undefined)
      .map(page => ({
        group: "Decisione",
        page,
        problem: "materiale lore senza decisione canonica",
        action: "Scegli canonico, rumor, leggenda, segreto, falso, retcon o archiviazione.",
        priority: canonCategory(page) === "lore capture" ? 5 : 3
      })));
  }

  function canonBuckets(dv, worldLink = "") {
    const scope = canonScope(dv, worldLink);
    const truth = truthRows(dv, scope);
    const rumors = rumorRows(dv, scope);
    const contradictions = contradictionRows(dv, scope);
    const provenance = provenanceRows(dv, scope);
    const retcons = retconRows(dv, scope);
    const decisions = decisionRows(dv, scope);
    const priority = sorted([
      ...contradictions,
      ...provenance,
      ...retcons,
      ...decisions,
      ...rumors
    ]);
    return { scope, truth, rumors, contradictions, provenance, retcons, decisions, priority };
  }

  function firstCard({ title, rows, empty, why }) {
    const first = rows[0];
    return cardHtml({
      title,
      meta: `${rows.length} elementi`,
      body: first?.problem ?? empty,
      importa: first?.action ?? why,
      link: first?.page?.file?.path ?? "",
      cls: `gdr-info-card compact ${rows.length ? "gdr-kind-missing" : "gdr-kind-ready"}`
    });
  }

  function renderCanonControlNow(dv, worldLink = "") {
    const buckets = canonBuckets(dv, worldLink);
    const next = buckets.priority[0];
    const cards = [
      cardHtml({
        title: next ? `Sistema prima: ${next.group}` : "Sistema prima: niente di urgente",
        meta: next ? pageTitle(next.page) : "Canone stabile",
        body: next?.problem ?? "Nessuna decisione canonica urgente con il filtro corrente.",
        importa: next?.action ?? "Puoi usare Lore Hub o Motore Mondo Vivo per avanzare materiale gia stabile.",
        link: next?.page?.file?.path ?? "",
        cls: `gdr-info-card compact ${next ? "gdr-kind-missing" : "gdr-kind-ready"}`
      }),
      firstCard({
        title: "Verita senza provenienza",
        rows: buckets.provenance,
        empty: "Le verita canoniche hanno fonte sufficiente.",
        why: "Fonte e sessione rendono il canone verificabile."
      }),
      firstCard({
        title: "Voci e leggende",
        rows: buckets.rumors,
        empty: "Nessuna voce critica da seguire.",
        why: "Rumor e leggende restano utili solo se hanno agganci giocabili."
      }),
      firstCard({
        title: "Contraddizioni",
        rows: buckets.contradictions,
        empty: "Nessuna contraddizione aperta.",
        why: "Il tavolo non dovrebbe ricevere verita incompatibili senza scelta deliberata."
      }),
      firstCard({
        title: "Retcon",
        rows: buckets.retcons,
        empty: "Nessuna retcon da sistemare.",
        why: "Ogni correzione deve indicare motivo, conseguenze e prossima mossa."
      }),
      firstCard({
        title: "Da decidere",
        rows: buckets.decisions,
        empty: "Nessun appunto lore senza decisione.",
        why: "Ogni scoperta deve diventare fatto, rumor, mistero o archivio."
      })
    ];
    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-canon-control-now" });
    grid.innerHTML = cards.join("");
  }

  function renderCanonControlReadiness(dv, worldLink = "") {
    const buckets = canonBuckets(dv, worldLink);
    const canonical = buckets.truth.filter(row => isCanonical(row.page)).length;
    const stats = [
      ["Canonico", canonical, "verita confermate"],
      ["Rumor", buckets.rumors.length, "voci o leggende"],
      ["Contraddizioni", buckets.contradictions.length, "da risolvere"],
      ["Senza fonte", buckets.provenance.length, "provenienza debole"],
      ["Retcon", buckets.retcons.length, "correzioni aperte"],
      ["Da decidere", buckets.decisions.length, "appunti lore"]
    ];
    const grid = dv.el("div", "", { cls: "gdr-stat-grid gdr-canon-control-readiness" });
    grid.innerHTML = stats.map(([label, value, hint]) => `
      <div class="gdr-stat-card">
        <div class="gdr-stat-value">${escapeHtml(value)}</div>
        <div class="gdr-stat-label">${escapeHtml(label)}</div>
        <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
      </div>
    `).join("");
  }

  async function readCanonControlCockpit() {
    return readJsonRel("z.automazioni/data/runtime/canon_control_cockpit.json", {
      surfaces: [],
      queues: []
    });
  }

  async function renderCanonControlQueues(dv, worldLink = "") {
    const cockpit = await readCanonControlCockpit();
    const labels = new Map((cockpit.queues ?? []).map(queue => [queue.id, queue.label]));
    const buckets = canonBuckets(dv, worldLink);
    const renderTable = (id, headers, rows, empty) => {
      dv.header(3, labels.get(id) ?? id);
      if (!rows.length) {
        dv.paragraph(empty);
        return;
      }
      dv.table(headers, rows);
    };

    renderTable(
      "truth",
      ["Nota", "Tipo", "Canone", "Fonte", "Sessioni"],
      buckets.truth.slice(0, 16).map(row => [row.page.file?.link ?? row.page.file?.path, canonCategory(row.page), canonState(row.page) || String(row.page.canonico ?? ""), fieldText(row.page.fonte) || "", fieldText(row.page.sessioni) || ""]),
      "Nessuna informazione canonica o dubbia nel filtro corrente."
    );
    renderTable(
      "rumors",
      ["Nota", "Stato", "Solidita", "Aggancio"],
      buckets.rumors.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, canonState(row.page), fieldText(row.page.grado_certezza) || "da chiarire", fieldText(row.page.collegamenti ?? row.page.luoghi ?? row.page.prossima_mossa) || "da collegare"]),
      "Nessuna voce, leggenda o bugia nel filtro corrente."
    );
    renderTable(
      "contradictions",
      ["Nota", "Cosa smentisce", "Cosa corregge", "Motivo"],
      buckets.contradictions.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, fieldText(row.page.contraddice) || "", fieldText(row.page.retcon_di) || "", fieldText(row.page.retcon_motivo) || "da scrivere"]),
      "Nessuna contraddizione aperta nel filtro corrente."
    );
    renderTable(
      "provenance",
      ["Nota", "Tipo", "Cosa manca", "Azione"],
      buckets.provenance.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, canonCategory(row.page), row.problem, row.action]),
      "Nessuna verita senza provenienza nel filtro corrente."
    );
    renderTable(
      "retcons",
      ["Nota", "Cosa corregge", "Cosa manca", "Prossimo passo"],
      buckets.retcons.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, fieldText(row.page.retcon_di) || "da indicare", row.missing?.join(", ") || "propagazione", fieldText(row.page.prossima_mossa) || row.action]),
      "Nessuna retcon da sistemare nel filtro corrente."
    );
    renderTable(
      "decisions",
      ["Nota", "Tipo", "Decisione", "Azione"],
      buckets.decisions.slice(0, 14).map(row => [row.page.file?.link ?? row.page.file?.path, canonCategory(row.page), "da decidere", row.action]),
      "Nessuna decisione canonica aperta nel filtro corrente."
    );
  }

  async function renderCanonControlSurfaceLinks(dv) {
    const cockpit = await readCanonControlCockpit();
    const surfaces = cockpit.surfaces ?? [];
    if (!surfaces.length) {
      renderEmptyState(dv, {
        title: "Superfici canone non configurate",
        action: "Rigenera il contratto Controllo Canone dalla pipeline sorgenti.",
        button: "npm run sync:sources"
      });
      return;
    }

    const grid = dv.el("div", "", { cls: "gdr-card-grid compact gdr-canon-control-surfaces" });
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
    renderCanonControlNow,
    renderCanonControlQueues,
    renderCanonControlReadiness,
    renderCanonControlSurfaceLinks
  };
})
