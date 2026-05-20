---
cssclasses:
  - dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo:
---

# Atlante Del Mondo

Questa e la vista per costruire ambientazioni grandi: luoghi, popoli, lingue, regni, religioni, storia, conflitti e cosmologia.

```meta-bind-button
label: Nuova Cultura
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Cultura.md"
    folderPath: "Mondi/Culture"
    open: true
```

```meta-bind-button
label: Nuova Lingua
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Lingua.md"
    folderPath: "Mondi/Lingue"
    open: true
```

```meta-bind-button
label: Nuova Era
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Era Storica.md"
    folderPath: "Mondi/Storia"
    open: true
```

```meta-bind-button
label: Nuovo Conflitto
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Conflitto.md"
    folderPath: "Mondi/Conflitti"
    open: true
```

```meta-bind-button
label: Cosmologia
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Cosmologia.md"
    folderPath: "Mondi/Cosmologia"
    open: true
```

```meta-bind-button
label: Worldbuilder
style: default
actions:
  - type: open
    link: "[[Worldbuilder Dashboard]]"
```

## Filtro

> [!scena] Mondo
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`

## Colpo D'Occhio

```dataviewjs
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const isReal = p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata";
const matchesWorld = p => !world || String(p.mondo?.path ?? p.mondo ?? "") === world || p.file.path === world;
const count = source => dv.pages(source).where(p => isReal(p) && matchesWorld(p)).length;
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const cards = [
  ["Luoghi", count('"Mondi/Luoghi"'), "Regioni, città, rovine"],
  ["Culture", count('"Mondi/Culture"'), "Popoli e usanze"],
  ["Lingue", count('"Mondi/Lingue"'), "Parlate e scritture"],
  ["Poteri", count('"Mondi/Fazioni" OR "Mondi/Religioni"'), "Regni, chiese, gilde"],
  ["Storia", count('"Mondi/Storia" OR "Mondi/Timeline"'), "Ere ed eventi"],
  ["Conflitti", count('"Mondi/Conflitti"'), "Guerre e tensioni"],
  ["Cosmologia", count('"Mondi/Cosmologia"'), "Piani e reami"],
  ["Missioni", count('"Mondi/Missioni"'), "Uso al tavolo"]
];

const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = cards.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${esc(value)}</div>
    <div class="gdr-stat-label">${esc(label)}</div>
    <div class="gdr-stat-hint">${esc(hint)}</div>
  </div>
`).join("");
```

## Costruzione

````tabs
tab: Geografia

```dataview
TABLE tipo, luogo_padre, governante, fazioni, pericolo
FROM "Mondi/Luoghi"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 20
```

tab: Popoli

```dataview
TABLE luoghi, lingue, religioni, fazioni, tensioni
FROM "Mondi/Culture"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT nome ASC
LIMIT 20
```

tab: Lingue

```dataview
TABLE culture, luoghi, origine, usi
FROM "Mondi/Lingue"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT nome ASC
LIMIT 20
```

tab: Poteri

```dataview
TABLE tipo, pressione, prossima_mossa, leader, luoghi, rivali
FROM "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, nome ASC
LIMIT 20
```

tab: Storia

```dataview
TABLE tipo, data_mondo, causa, conseguenze, luoghi, fazioni, culture
FROM "Mondi/Storia" OR "Mondi/Timeline"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, nome ASC
LIMIT 20
```

tab: Cosmologia

```dataview
TABLE tipo, regola, pericolo, divinita, creature, luoghi_collegati
FROM "Mondi/Cosmologia"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 20
```
````

## Buchi Dell'Ambientazione

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;
const hasLinks = value => dv.array(value ?? []).length > 0;
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const real = p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata";
const matchesWorld = p => !world || String(p.mondo?.path ?? p.mondo ?? "") === world || p.file.path === world;
const rows = [];
const add = (source, checks) => {
  dv.pages(source).where(p => real(p) && matchesWorld(p)).forEach(p => {
    checks.forEach(check => {
      if (check.test(p)) rows.push([p.file.link, check.label, p.stato ?? ""]);
    });
  });
};

add('"Mondi/Luoghi"', [
  { label: "luogo senza regione o luogo superiore", test: p => !hasText(p.luogo_padre) && p.tipo !== "continente" },
  { label: "luogo senza potere collegato", test: p => !hasLinks(p.fazioni) && !hasText(p.governante) },
  { label: "luogo pronto senza pericolo o tensione", test: p => p.stato === "pronto" && !hasText(p.pericolo) && !hasText(p.tensione) }
]);
add('"Mondi/Culture"', [
  { label: "cultura senza lingua", test: p => !hasLinks(p.lingue) },
  { label: "cultura senza luogo", test: p => !hasLinks(p.luoghi) },
  { label: "cultura senza tensione", test: p => !hasLinks(p.tensioni) }
]);
add('"Mondi/Lingue"', [
  { label: "lingua senza cultura", test: p => !hasLinks(p.culture) },
  { label: "lingua senza parole note", test: p => !hasLinks(p.parole_note) }
]);
add('"Mondi/Fazioni" OR "Mondi/Conflitti"', [
  { label: "potere senza prossima mossa", test: p => Number(p.pressione ?? 0) > 0 && !hasText(p.prossima_mossa) },
  { label: "potere senza luoghi", test: p => !hasLinks(p.luoghi) }
]);
add('"Mondi/Storia" OR "Mondi/Timeline"', [
  { label: "evento storico senza conseguenze", test: p => !hasLinks(p.conseguenze) },
  { label: "evento storico senza data del mondo", test: p => !hasText(p.data_mondo) }
]);
add('"Mondi/Cosmologia"', [
  { label: "reame senza regola distintiva", test: p => !hasText(p.regola) },
  { label: "reame senza collegamenti al mondo", test: p => !hasLinks(p.divinita) && !hasLinks(p.luoghi_collegati) && !hasLinks(p.creature) }
]);

if (!rows.length) {
  dv.paragraph("Nessun buco evidente: l'ambientazione ha collegamenti minimi solidi.");
} else {
  dv.table(["Nota", "Cosa manca", "Stato"], rows.slice(0, 30));
}
```
