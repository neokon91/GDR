---
cssclasses:
  - dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo:
---

# Campagna Da Ambientazione

Questa pagina serve a trasformare una regione, un conflitto o una cultura in gioco vero: campagne, archi narrativi, missioni e prime sessioni.

```meta-bind-button
label: Campagna Da Regione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Campagna Da Regione.md"
    folderPath: "Campagne"
    open: true
```

```meta-bind-button
label: Arco Da Conflitto
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Arco Da Conflitto.md"
    folderPath: "Mondi/Missioni"
    open: true
```

```meta-bind-button
label: Opportunità
style: default
actions:
  - type: open
    link: "[[Risorse/Opportunità Di Avventura]]"
```

```meta-bind-button
label: Fronti
style: default
actions:
  - type: open
    link: "[[Risorse/Fronti Di Campagna]]"
```

```meta-bind-button
label: Atlante
style: default
actions:
  - type: open
    link: "[[Atlante del Mondo]]"
```

## Filtro

> [!scena] Mondo
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`

## Da Ambientazione A Gioco

```dataviewjs
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const isReal = p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata";
const matchesWorld = p => !world || String(p.mondo?.path ?? p.mondo ?? "") === world || p.file.path === world;
const count = source => dv.pages(source).where(p => isReal(p) && matchesWorld(p)).length;
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const cards = [
  ["Regioni", count('"Mondi/Luoghi"'), "Da trasformare in sandbox"],
  ["Conflitti", count('"Mondi/Conflitti"'), "Da trasformare in archi"],
  ["Culture", count('"Mondi/Culture"'), "Spinte sociali"],
  ["Fazioni", count('"Mondi/Fazioni"'), "Fronti e avversari"],
  ["Missioni", count('"Mondi/Missioni"'), "Materiale giocabile"],
  ["Sessioni", count('"Mondi/Sessioni"'), "Tavolo pronto"]
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

## Opportunità Da Giocare

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;
const hasLinks = value => dv.array(value ?? []).length > 0;
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const real = p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata";
const matchesWorld = p => !world || String(p.mondo?.path ?? p.mondo ?? "") === world || p.file.path === world;

const rows = [
  ...dv.pages('"Mondi/Luoghi"')
    .where(p => real(p) && matchesWorld(p) && (Number(p.pericolo ?? 0) > 0 || hasLinks(p.segreti) || hasLinks(p.problemi)))
    .map(p => [p.file.link, "Luogo", p.pericolo ?? "", p.tensione ?? p.impressione ?? "", p.fazioni ?? []]).array(),
  ...dv.pages('"Mondi/Culture"')
    .where(p => real(p) && matchesWorld(p) && (hasLinks(p.tensioni) || hasLinks(p.segreti)))
    .map(p => [p.file.link, "Cultura", "", dv.array(p.tensioni ?? []).join(", "), p.fazioni ?? []]).array(),
  ...dv.pages('"Mondi/Conflitti"')
    .where(p => real(p) && matchesWorld(p))
    .map(p => [p.file.link, "Conflitto", p.pressione ?? "", p.prossima_mossa ?? p.posta ?? "", p.fazioni ?? []]).array()
].slice(0, 20);

if (!rows.length) {
  dv.paragraph("Nessuna opportunità evidente. Aggiungi pericoli, segreti, tensioni o conflitti nell'Atlante.");
} else {
  dv.table(["Fonte", "Tipo", "Pressione", "Gancio", "Poteri"], rows);
}
```

## Fronti Di Campagna

```dataview
TABLE tipo, pressione, prossima_mossa, scadenza_mondo, fazioni, luoghi
FROM "Mondi/Conflitti" OR "Mondi/Missioni" OR "Mondi/Fazioni"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND pressione > 0 AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, scadenza_mondo ASC, nome ASC
LIMIT 20
```

## Campagne Create Dall'Ambientazione

```dataview
TABLE stato, profilo, regione, culture, fazioni, conflitti
FROM "Campagne"
WHERE file.name != "Campagne" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```
