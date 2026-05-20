---
cssclasses:
  - dashboard
  - gdr-lore-hub
categoria: risorsa
tipo: lore hub
stato: pronto
mondo_attivo: ""
---

# Lore Hub

> [!timeline] Hub visuale
> Questa pagina e una porta d'ingresso navigabile al lore vivo. L'Atlante resta la vista enciclopedica; qui contano segnali, card e accessi rapidi.

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

`BUTTON[atlante-atlante-del-mondo-2]`

`BUTTON[economia-e-rotte-economia-e-rotte-2]`

`BUTTON[calendario-mondi-calendario]`

`BUTTON[compendium-hub-compendium-del-mondo-compendium-del-mondo]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const asArray = value => dv.array(value ?? []).array();
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const count = (source, predicate = () => true) => dv.pages(source).where(p => real(p) && matchesWorld(p) && predicate(p)).length;
const card = (label, value, hint, link) => `
  <a class="gdr-stat-card internal-link" data-href="${gdr.escapeHtml(link)}" href="${gdr.escapeHtml(link)}">
    <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
  </a>`;
const cards = [
  ["Mondo attivo", world ? "1" : count('"Mondi"', p => p.categoria === "mondo"), world || "Tutti i mondi", "Mondi/Mondo"],
  ["Regioni", count('"Mondi/Luoghi"', p => ["regione", "continente", "isola", "regno", "impero", "repubblica", "ducato", "contea", "baronia"].includes(String(p.tipo ?? p.tipologia ?? ""))), "Geografia e poteri", "Mondi/Luoghi/Luoghi"],
  ["Culture", count('"Mondi/Culture"'), "Popoli, tabù, feste", "Mondi/Culture/Culture"],
  ["Lingue", count('"Mondi/Lingue"'), "Parlate e scritture", "Mondi/Lingue/Lingue"],
  ["Religioni", count('"Mondi/Religioni"'), "Culti e divinità", "Mondi/Religioni/Religioni"],
  ["Fazioni", count('"Mondi/Fazioni"'), "Poteri in movimento", "Mondi/Fazioni/Fazioni"],
  ["Storia", count('"Mondi/Timeline" OR "Mondi/Storia"'), "Eventi e conseguenze", "Mondi/Timeline/Timeline"],
  ["Misteri", count('"Mondi/Segreti"'), "Verità nascoste", "Mondi/Segreti/Segreti"],
  ["Mappe", count('"Risorse/Mappe"'), "Relazioni, hex, zoom", "Risorse/Mappe/Mappe"],
  ["PNG chiave", count('"Mondi/Personaggi"', p => p.tipo === "png" || p.categoria === "personaggio"), "Volti del mondo", "Mondi/Personaggi/Personaggi"],
  ["Oggetti", count('"Mondi/Oggetti"'), "Reliquie e strumenti", "Mondi/Oggetti/Oggetti"],
  ["Risorse", count('"Mondi/Risorse" OR "Mondi/Compendium"'), "Materiali, merci, elementi originali", "Hub/Compendium Del Mondo"]
];
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = cards.map(([label, value, hint, link]) => card(label, value, hint, link)).join("");
```

````tabs
tab: Segnali

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE stato != "archiviata" AND (pressione > 0 OR prossima_mossa) AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT pressione DESC, file.mtime DESC
LIMIT 20
```

tab: Culture

```dataview
TABLE luoghi, lingue, religioni, tensioni, feste
FROM "Mondi/Culture"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.name ASC
LIMIT 20
```

tab: Potere

```dataview
TABLE tipo, luoghi, pressione, agenda, prossima_mossa
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, file.name ASC
LIMIT 20
```

tab: Misteri

```dataview
TABLE verita_profonda, indizi_deboli, indizi_forti, prove_decisive, propaga_a
FROM "Mondi/Segreti"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 20
```

tab: Mappe

```dataview
TABLE uso, mondo, luogo, luoghi, stato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT uso ASC, file.name ASC
```

tab: Oggetti E Risorse

```dataview
TABLE tipo, luoghi, regioni, risorse, fazioni, uso_narrativo
FROM "Mondi/Oggetti" OR "Mondi/Risorse" OR "Mondi/Compendium"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, file.name ASC
LIMIT 24
```

tab: Operativo

- [[Worldbuilder Dashboard]]
- [[Atlante del Mondo]]
- [[Economia E Rotte]]
- [[Geopolitical Dashboard]]
- [[Motore Mondo Vivo]]
- [[Controllo Worldbuilding]]
- [[Mondi/Calendario]]
- [[Hub/Compendium Del Mondo|Compendium Del Mondo]]
````
