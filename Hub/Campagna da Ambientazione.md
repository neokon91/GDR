---
cssclasses:
  - dashboard
  - gdr-campaign-builder
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
---

# Campagna Da Ambientazione

Questa pagina serve a trasformare una regione, un conflitto o una cultura in gioco vero: campagne, archi narrativi, missioni e prime sessioni.

`BUTTON[campagna-da-regione-z-modelli-dm-campagna-da-regione-md]`

`BUTTON[arco-da-conflitto-z-modelli-dm-arco-da-conflitto-md]`

`BUTTON[opportunita-risorse-opportunita-di-avventura]`

`BUTTON[fronti-risorse-fronti-di-campagna]`

`BUTTON[atlante-atlante-del-mondo]`

## Filtro

> [!scena] Mondo
> `INPUT[mondo][:mondo_attivo]`

## Da Ambientazione A Gioco

```dataviewjs
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const isReal = p => p.stato !== "archiviata";
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
const real = p => p.stato !== "archiviata";
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
WHERE stato != "archiviata" AND pressione > 0 AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, scadenza_mondo ASC, nome ASC
LIMIT 20
```

## Campagne Create Dall'Ambientazione

```dataview
TABLE stato, profilo, regione, culture, fazioni, conflitti
FROM "Campagne"
WHERE file.name != "Campagne" AND stato != "archiviata"
SORT stato ASC, nome ASC
```
