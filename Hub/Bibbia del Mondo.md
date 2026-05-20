---
cssclasses:
  - dashboard
  - gdr-world-bible
categoria: risorsa
tipo: codex mondo
stato: pronto
mondo_attivo: ""
---

# Codex Del Mondo

> [!scena] World Anvil locale
> Qui consulti il mondo come prodotto: gancio, tono, conflitto, luoghi, fazioni, misteri e articoli collegati. Se devi creare un mondo, compila prima i 6 campi del template.

Mondo:
`INPUT[mondo][:mondo_attivo]`

`BUTTON[nuovo-mondo-z-modelli-mondo-md]`

`BUTTON[atlante-del-mondo-atlante-del-mondo]`

## Identità

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const worldPath = gdr.linkKey(dv.current().mondo_attivo);
const worlds = dv.pages('"Mondi"')
  .where(p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
  .where(p => !worldPath || p.file.path === worldPath)
  .sort(p => p.file.name, "asc")
  .array();

if (!worlds.length) {
  dv.paragraph("Seleziona o crea un mondo.");
} else {
  const esc = gdr.escapeHtml;
  const fmt = value => Array.isArray(value)
    ? value.map(item => item?.path ? item.path.split("/").pop().replace(/\.md$/, "") : String(item ?? "")).filter(Boolean).join(", ")
    : value?.path ? value.path.split("/").pop().replace(/\.md$/, "") : String(value ?? "");
  const grid = dv.el("div", "", { cls: "gdr-card-grid" });
  grid.innerHTML = worlds.map(p => `
    <div class="gdr-info-card gdr-kind-mondo">
      <div class="gdr-card-title">${gdr.internalLink(p.file)}</div>
      <div class="gdr-card-meta">${esc([p.tono, p.tema, p.stato].filter(Boolean).join(" · "))}</div>
      <div class="gdr-card-line"><strong>Gancio:</strong> ${esc(p.gancio ?? p.premessa ?? "")}</div>
      <div class="gdr-card-line"><strong>Conflitto:</strong> ${esc(p.conflitto_centrale ?? "")}</div>
      <div class="gdr-card-line"><strong>Luoghi:</strong> ${esc(fmt(p.luoghi_iconici))}</div>
      <div class="gdr-card-line"><strong>Fazioni:</strong> ${esc(fmt(p.fazioni_principali))}</div>
      <div class="gdr-card-line"><strong>Misteri:</strong> ${esc(fmt(p.misteri_pubblici))}</div>
    </div>
  `).join("");
}
```

## Articoli Del Mondo

````tabs
tab: Luoghi

```dataview
TABLE tipo, luogo_padre, pericolo, fazioni, stato
FROM "Mondi/Luoghi"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 24
```

tab: Fazioni

```dataview
TABLE tipo, leader, luoghi, pressione, prossima_mossa, stato
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, nome ASC
LIMIT 24
```

tab: Personaggi

```dataview
TABLE tipo, ruolo, luogo, fazioni, atteggiamento, stato
FROM "Mondi/Personaggi"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 24
```

tab: Timeline

```dataview
TABLE tipo, data_mondo, causa, conseguenze, luoghi, fazioni
FROM "Mondi/Storia" OR "Mondi/Timeline"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, nome ASC
LIMIT 24
```

tab: Player Safe

```dataview
TABLE categoria, tipo, stato, mondo, luogo
FROM "Mondi" OR "Risorse/Mappe"
WHERE pubblico = true AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 30
```
````

## Buchi Del Codex

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const worldPath = gdr.linkKey(dv.current().mondo_attivo);
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const rows = [];
dv.pages('"Mondi"')
  .where(p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
  .where(p => !worldPath || p.file.path === worldPath)
  .forEach(p => {
    [
      ["gancio", p.gancio ?? p.premessa],
      ["tono", p.tono],
      ["conflitto centrale", p.conflitto_centrale],
      ["luoghi iconici", p.luoghi_iconici],
      ["fazioni principali", p.fazioni_principali],
      ["misteri pubblici", p.misteri_pubblici]
    ].forEach(([label, value]) => {
      if (!has(value)) rows.push([p.file.link, label]);
    });
  });

if (!rows.length) dv.paragraph("Codex essenziale completo.");
else dv.table(["Mondo", "Manca"], rows);
```
