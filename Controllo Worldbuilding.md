---
cssclasses:
  - dashboard
  - gdr-worldbuilding-control
categoria: risorsa
tipo: controllo worldbuilding
stato: pronto
mondo_attivo: ""
---

# Controllo Worldbuilding

> [!timeline] Coerenza dell'ambientazione
> Questa vista cerca schede che esistono ma non influenzano ancora il mondo: culture senza vita quotidiana, lingue senza parlanti, eventi senza memoria, conflitti senza cause profonde e segreti senza livelli di rivelazione.

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`

```meta-bind-button
label: Atlante
style: primary
actions:
  - type: open
    link: "[[Atlante del Mondo]]"
```

```meta-bind-button
label: Worldbuilding Profondo
style: primary
actions:
  - type: open
    link: "[[Risorse/Worldbuilding Profondo]]"
```

```meta-bind-button
label: Bibbia Del Mondo
style: default
actions:
  - type: open
    link: "[[Bibbia del Mondo]]"
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const asArray = value => dv.array(value ?? []).array();
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => asArray(value).length > 0;
const real = p => gdr.isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const pages = (source, predicate = () => true) => dv.pages(source).where(p => real(p) && matchesWorld(p) && predicate(p));
const issueRows = [];
const add = (source, checks) => {
  pages(source).forEach(p => checks.forEach(check => {
    if (check.test(p)) issueRows.push([p.file.link, check.area, check.label, p.stato ?? p.stato_canonico ?? ""]);
  }));
};
const countIssues = area => issueRows.filter(row => row[1] === area).length;

add('"Mondi"', [
  { area: "Mondo", label: "mondo senza principi di realtà", test: p => p.categoria === "mondo" && !hasLinks(p.principi_realta) },
  { area: "Mondo", label: "mondo senza contraddizioni centrali", test: p => p.categoria === "mondo" && !hasLinks(p.contraddizioni_centrali) },
  { area: "Mondo", label: "mondo senza vita quotidiana", test: p => p.categoria === "mondo" && !hasLinks(p.vita_quotidiana) }
]);
add('"Mondi/Culture"', [
  { area: "Culture", label: "cultura senza mito d'origine", test: p => !hasLinks(p.mito_origine) },
  { area: "Culture", label: "cultura senza sacro/proibito", test: p => !hasLinks(p.cose_sacre) && !hasLinks(p.cose_proibite) },
  { area: "Culture", label: "cultura senza vita quotidiana", test: p => !hasLinks(p.famiglia_casa_ruoli) && !hasLinks(p.cibo_vestiario_materiali) && !hasLinks(p.economia_mestieri) },
  { area: "Culture", label: "cultura senza lingua", test: p => !hasLinks(p.lingue) },
  { area: "Culture", label: "cultura senza luoghi", test: p => !hasLinks(p.luoghi) }
]);
add('"Mondi/Lingue"', [
  { area: "Lingue", label: "lingua senza culture parlanti", test: p => !hasLinks(p.culture) },
  { area: "Lingue", label: "lingua senza suono o registri", test: p => !hasLinks(p.suono_ritmo_gesti) && !hasLinks(p.registri) },
  { area: "Lingue", label: "lingua senza parole o modi di dire", test: p => !hasLinks(p.parole_note) && !hasLinks(p.modi_di_dire) }
]);
add('"Mondi/Luoghi"', [
  { area: "Luoghi", label: "luogo senza memoria o origine", test: p => !hasLinks(p.memoria_del_territorio) && !hasLinks(p.tracce_passato) && !hasLinks(p.origine_funzione) },
  { area: "Luoghi", label: "territorio senza economia o risorse", test: p => ["regione", "regno", "contea", "ducato", "impero", "repubblica"].includes(String(p.tipo ?? p.tipologia ?? "")) && !hasLinks(p.risorse_strategiche) && !hasLinks(p.economia_quotidiana) },
  { area: "Luoghi", label: "potere politico senza mito di legittimità", test: p => ["regno", "impero", "repubblica", "ducato", "contea", "baronia"].includes(String(p.tipo ?? p.tipologia ?? "")) && !hasLinks(p.mito_legittimita) && !has(p.legittimita) }
]);
add('"Mondi/Cosmologia"', [
  { area: "Cosmologia", label: "cosmologia senza leggi metafisiche", test: p => !hasLinks(p.leggi_metafisiche) && !has(p.regola) },
  { area: "Cosmologia", label: "cosmologia senza effetti sul mondo", test: p => !hasLinks(p.effetti_su_magia) && !hasLinks(p.effetti_su_culture) && !hasLinks(p.fenomeni_visibili) }
]);
add('"Mondi/Timeline" OR "Mondi/Storia"', [
  { area: "Storia", label: "evento senza memoria pubblica", test: p => (p.categoria === "evento storico" || has(p.data_mondo)) && !hasLinks(p.memoria_pubblica) },
  { area: "Storia", label: "evento senza conseguenze quotidiane", test: p => (p.categoria === "evento storico" || has(p.data_mondo)) && !hasLinks(p.cambiamenti_quotidiani) && !hasLinks(p.conseguenze) },
  { area: "Storia", label: "evento senza causa", test: p => (p.categoria === "evento storico" || has(p.data_mondo)) && !has(p.causa) && !hasLinks(p.cause) }
]);
add('"Mondi/Conflitti"', [
  { area: "Conflitti", label: "conflitto senza cause profonde", test: p => !hasLinks(p.cause_profonde) && !hasLinks(p.cause) },
  { area: "Conflitti", label: "conflitto senza risorse o ferite storiche", test: p => !hasLinks(p.risorse_contese) && !hasLinks(p.ferite_storiche) },
  { area: "Conflitti", label: "conflitto senza possibili paci", test: p => !hasLinks(p.possibili_paci) }
]);
add('"Mondi/Relazioni"', [
  { area: "Relazioni", label: "relazione senza origine storica", test: p => !hasLinks(p.origine_storica) && !has(p.origine) },
  { area: "Relazioni", label: "relazione senza versioni contrapposte", test: p => !hasLinks(p.versioni_contrapposte) },
  { area: "Relazioni", label: "relazione senza dipendenze o ferite", test: p => !hasLinks(p.dipendenze_materiali) && !hasLinks(p.ferite_aperte) }
]);
add('"Mondi/Segreti"', [
  { area: "Segreti", label: "segreto senza verità profonda", test: p => !hasLinks(p.verita_profonda) },
  { area: "Segreti", label: "segreto senza livelli di rivelazione", test: p => !hasLinks(p.indizi_deboli) && !hasLinks(p.indizi_forti) && !hasLinks(p.prove_decisive) }
]);

const stats = ["Mondo", "Culture", "Lingue", "Luoghi", "Cosmologia", "Storia", "Conflitti", "Relazioni", "Segreti"]
  .map(area => [area, countIssues(area), "Buchi di profondità"]);
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = stats.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
  </div>
`).join("");

if (!issueRows.length) {
  dv.paragraph("Nessun buco di worldbuilding evidente con i filtri correnti.");
} else {
  dv.table(["Nota", "Area", "Cosa manca", "Stato"], issueRows.slice(0, 80));
}
```
