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
> `INPUT[mondo][:mondo_attivo]`

`BUTTON[atlante-atlante-del-mondo-2]`

`BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo-2]`

`BUTTON[bibbia-del-mondo-bibbia-del-mondo]`

`BUTTON[economia-e-rotte-economia-e-rotte]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
add('"Mondi/Rotte"', [
  { area: "Rotte", label: "rotta senza rischio", test: p => !hasLinks(p.rischi) },
  { area: "Rotte", label: "rotta senza controllore", test: p => !hasLinks(p.fazioni_controllanti) && !hasLinks(p.fazioni) },
  { area: "Rotte", label: "rotta senza risorse", test: p => !hasLinks(p.risorse_trasportate) && !hasLinks(p.risorse) },
  { area: "Rotte", label: "rotta bloccata senza conseguenze", test: p => ["chiusa", "interrotta", "maledetta", "contesa"].includes(String(p.stato_rotta ?? "")) && !hasLinks(p.conseguenze_se_bloccata) && !hasLinks(p.conseguenze) }
]);
add('"Mondi/Risorse"', [
  { area: "Risorse", label: "risorsa senza luogo", test: p => !hasLinks(p.luoghi) && !hasLinks(p.regioni) },
  { area: "Risorse", label: "risorsa senza controllore", test: p => !hasLinks(p.fazioni_controllanti) && !hasLinks(p.fazioni) },
  { area: "Risorse", label: "risorsa senza uso narrativo", test: p => !has(p.uso_narrativo) && !hasLinks(p.usi) }
]);
add('"Mondi/Mercati"', [
  { area: "Mercati", label: "mercato senza luogo", test: p => !has(p.luogo) && !hasLinks(p.luoghi) },
  { area: "Mercati", label: "mercato senza risorse", test: p => !hasLinks(p.risorse) },
  { area: "Mercati", label: "mercato senza rischio o pedaggio", test: p => !hasLinks(p.rischi) && !hasLinks(p.pedaggi) }
]);
add('"Mondi/Compendium"', [
  { area: "Compendium", label: "elemento senza cultura o regione", test: p => !hasLinks(p.culture) && !hasLinks(p.regioni) && !hasLinks(p.luoghi) },
  { area: "Compendium", label: "elemento senza uso narrativo", test: p => !has(p.uso_narrativo) && !hasLinks(p.usi) && !hasLinks(p.missioni) }
]);

const stats = ["Mondo", "Culture", "Lingue", "Luoghi", "Cosmologia", "Storia", "Conflitti", "Relazioni", "Segreti", "Rotte", "Risorse", "Mercati", "Compendium"]
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

## Controllo Strutturale Vault

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const asArray = value => dv.array(value ?? []).array();
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const real = p => gdr.isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const pages = dv.pages('"Mondi" OR "Inbox"').where(p => real(p) && matchesWorld(p));
const linkFields = ["mondo", "luogo", "luogo_padre", "partenza", "arrivo", "luoghi", "regioni", "culture", "lingue", "religioni", "fazioni", "fazioni_controllanti", "personaggi", "missioni", "conflitti", "sessioni", "relazioni", "risorse", "risorse_trasportate", "rotte", "mercati", "propaga_a", "entita_impattate", "indizi", "segreti"];
const linkCount = p => linkFields.reduce((total, key) => total + asArray(p[key]).length + (!Array.isArray(p[key]) && has(p[key]) ? 1 : 0), 0);
const unresolved = app.metadataCache.unresolvedLinks ?? {};
const unresolvedRows = Object.entries(unresolved)
  .flatMap(([source, targets]) => Object.keys(targets).map(target => [dv.fileLink(source), target, targets[target]]))
  .filter(row => !String(row[0]).includes("SRD/"))
  .slice(0, 40);
const table = (title, columns, rows, empty = "Nessun problema evidente.") => {
  dv.header(3, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
};

table(
  "Note Isolate O Poco Collegate",
  ["Nota", "Categoria", "Tipo", "Connessioni", "Stato"],
  pages
    .where(p => p.file.name !== "Mondo" && linkCount(p) < 2)
    .sort(p => linkCount(p), "asc")
    .limit(30)
    .map(p => [p.file.link, p.categoria ?? "", p.tipo ?? "", linkCount(p), p.stato ?? ""])
    .array()
);

table(
  "Link Non Creati",
  ["Origine", "Link mancante", "Occorrenze"],
  unresolvedRows,
  "Nessun link non creato rilevato dalla cache Dataview/Obsidian."
);

table(
  "Schede Senza Mondo",
  ["Nota", "Categoria", "Tipo", "Stato"],
  pages
    .where(p => !has(p.mondo) && !["risorsa", "srd"].includes(String(p.categoria ?? "")) && !["Mondo", "Stato del Mondo"].includes(p.file.name))
    .limit(30)
    .map(p => [p.file.link, p.categoria ?? "", p.tipo ?? "", p.stato ?? ""])
    .array()
);

table(
  "Elementi Pronti Ma Mai Usati",
  ["Nota", "Categoria", "Tipo", "Stato"],
  pages
    .where(p => p.stato === "pronto" && !has(p.sessioni) && !has(p.missioni) && !has(p.conflitti) && !has(p.propaga_a))
    .limit(30)
    .map(p => [p.file.link, p.categoria ?? "", p.tipo ?? "", p.stato ?? ""])
    .array()
);

table(
  "Segreti Senza Indizi",
  ["Segreto", "Verità", "Stato"],
  dv.pages('"Mondi/Segreti"')
    .where(p => real(p) && matchesWorld(p) && !has(p.indizi_deboli) && !has(p.indizi_forti) && !has(p.prove_decisive) && !has(p.indizi))
    .map(p => [p.file.link, p.verita_profonda ?? p.segreti ?? "", p.stato ?? ""])
    .array()
);

table(
  "Eventi Senza Conseguenze",
  ["Evento", "Data", "Cause", "Stato"],
  dv.pages('"Mondi/Timeline" OR "Mondi/Storia"')
    .where(p => real(p) && matchesWorld(p) && (p.categoria === "evento storico" || has(p.data_mondo)) && !has(p.conseguenze) && !has(p.effetti))
    .map(p => [p.file.link, p.data_mondo ?? "", p.cause ?? p.causa ?? "", p.stato ?? p.stato_canonico ?? ""])
    .array()
);

table(
  "Culture Senza Luoghi, Lingue O Religioni",
  ["Cultura", "Luoghi", "Lingue", "Religioni"],
  dv.pages('"Mondi/Culture"')
    .where(p => real(p) && matchesWorld(p) && (!has(p.luoghi) || !has(p.lingue) || !has(p.religioni)))
    .map(p => [p.file.link, p.luoghi ?? [], p.lingue ?? [], p.religioni ?? []])
    .array()
);
```
