---
cssclasses:
  - dashboard
mondo_attivo:
campagne_attive: []
---

# Worldbuilder Dashboard

## Mondo

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`
>
> Campagne:
> `INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial)):campagne_attive]`

```meta-bind-button
label: DM Dashboard
style: primary
actions:
  - type: open
    link: "[[1. DM Dashboard]]"
```

```meta-bind-button
label: Indice Mondo
style: primary
actions:
  - type: open
    link: "[[Mondi/Mondo]]"
```

```meta-bind-button
label: Controllo Vault
style: primary
actions:
  - type: open
    link: "[[Risorse/Controllo Vault]]"
```

```meta-bind-button
label: Callout GDR
style: primary
actions:
  - type: open
    link: "[[Risorse/Callout GDR]]"
```

```meta-bind-button
label: Mappe
style: primary
actions:
  - type: open
    link: "[[Risorse/Mappe/Mappe]]"
```

```meta-bind-button
label: Timeline
style: primary
actions:
  - type: open
    link: "[[Mondi/Timeline/Timeline]]"
```

```meta-bind-button
label: Stato Mondo
style: primary
actions:
  - type: open
    link: "[[Mondi/Stato del Mondo]]"
```

## Crea Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const steps = [
  ["1", "Mondo", "Tono, temi e verità canoniche"],
  ["2", "Struttura", "Luoghi, regioni e poteri"],
  ["3", "Tavolo", "PNG, missioni e conseguenze"]
];
const grid = dv.el("div", "", { cls: "gdr-flow" });
grid.innerHTML = steps.map(([label, title, hint]) => `
  <div class="gdr-flow-step">
    <div class="gdr-flow-label">${label}</div>
    <div class="gdr-flow-title">${title}</div>
    <div class="gdr-flow-hint">${hint}</div>
  </div>
`).join("");
```

```meta-bind-button
label: Nuovo Mondo
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Mondo.md"
    folderPath: "Mondi"
    open: true
```

```meta-bind-button
label: Nuovo Personaggio
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Personaggio Router.md"
    folderPath: "Mondi/Personaggi"
    open: true
```

```meta-bind-button
label: Nuovo Luogo
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Luogo Router.md"
    folderPath: "Mondi/Luoghi"
    open: true
```

```meta-bind-button
label: Nuova Fazione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Fazione Router.md"
    folderPath: "Mondi/Fazioni"
    open: true
```

```meta-bind-button
label: Nuovo Culto
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/fazione/Culto.md"
    folderPath: "Mondi/Religioni"
    open: true
```

```meta-bind-button
label: Nuova Creatura
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Creatura.md"
    folderPath: "Mondi/Creature"
    open: true
```

```meta-bind-button
label: Nuovo Oggetto
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Oggetto.md"
    folderPath: "Mondi/Oggetti"
    open: true
```

```meta-bind-button
label: Nuovo Oggetto Magico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Oggetto Magico.md"
    folderPath: "Mondi/Oggetti"
    open: true
```

```meta-bind-button
label: Evento Storico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Evento Storico.md"
    folderPath: "Mondi/Timeline"
    open: true
```

```meta-bind-button
label: Dispense
style: primary
actions:
  - type: open
    link: "[[Mondi/Dispense/Dispense]]"
```

## Panoramica Del Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const count = (source, predicate = () => true) => dv.pages(source).where(predicate).length;
const notIndex = p => gdr.isReal(p) && p.file.name !== p.file.folder?.split("/").pop() && p.stato !== "archiviata";

const cards = [
  ["Mondi", count('"Mondi"', p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata"), "Ambientazioni"],
  ["Personaggi", count('"Mondi/Personaggi"', notIndex), "Volti e legami"],
  ["Luoghi", count('"Mondi/Luoghi"', notIndex), "Dove succedono le cose"],
  ["Fazioni", count('"Mondi/Fazioni"', notIndex), "Poteri in movimento"],
  ["Religioni", count('"Mondi/Religioni"', notIndex), "Culti e divinita"],
  ["Creature", count('"Mondi/Creature"', notIndex), "Minacce e presenze"],
  ["Timeline", count('"Mondi/Timeline"', notIndex), "Eventi canonici"],
  ["Bozze", count('"Mondi"', p => gdr.isReal(p) && p.stato === "bozza"), "Da completare"]
];

const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = cards.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
  </div>
`).join("");
```

## Focus Operativo

````tabs
tab: Bozze

### Bozze Da Completare

```dataview
TABLE categoria, tipo, luogo, stato
FROM "Mondi"
WHERE stato = "bozza" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 12
```

tab: Campagna

### Campagna Filtrata

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const campaigns = new Set(dv.array(current.campagne_attive ?? []).map(link => link.path ?? String(link)).array());
const world = current.mondo_attivo?.path ?? String(current.mondo_attivo ?? "");
const matchesCampaign = p => !campaigns.size || dv.array(p.campagne ?? p.campagne_attive ?? []).some(link => campaigns.has(gdr.linkKey(link)));
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;

const pages = dv.pages('"Campagne" OR "Mondi/Sessioni" OR "Mondi/Missioni"')
  .where(p => gdr.isReal(p) && p.stato !== "archiviata")
  .where(p => matchesWorld(p) && matchesCampaign(p))
  .sort(p => p.data ?? p.file.mtime, "desc")
  .limit(16);

if (!campaigns.size && !world) {
  dv.paragraph("Imposta un mondo o una campagna nel filtro per isolare il lavoro corrente.");
} else if (!pages.length) {
  dv.paragraph("Nessun contenuto trovato per il filtro corrente.");
} else {
  dv.table(["Nota", "Categoria", "Stato", "Mondo", "Campagne"], pages.map(p => [p.file.link, p.categoria ?? "", p.stato ?? "", p.mondo ?? "", p.campagne ?? []]));
}
```

tab: Connessioni

### Densità E Connessioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const isReal = p => gdr.isReal(p) && p.stato !== "archiviata";
const asArray = value => dv.array(value ?? []).array();
const linkCount = p => [
  "mondo", "luogo", "luogo_padre", "governante", "committente",
  "fazioni", "religioni", "personaggi", "luoghi", "leader", "risorse",
  "problemi", "indizi", "segreti", "missioni", "ricompense"
].reduce((total, key) => {
  const value = p[key];
  if (Array.isArray(value)) return total + asArray(value).filter(Boolean).length;
  return total + (value ? 1 : 0);
}, 0);

const pages = dv.pages('"Mondi"')
  .where(p => isReal(p) && p.file.name !== "Mondo" && p.categoria !== "srd")
  .map(p => [p.file.link, p.categoria ?? "", p.tipo ?? "", p.stato ?? "", linkCount(p)])
  .where(row => row[4] < 3)
  .sort(row => row[4], "asc")
  .limit(12);

if (!pages.length) {
  dv.paragraph("Nessun contenuto sottoconnesso evidente.");
} else {
  dv.table(["Nota", "Categoria", "Tipo", "Stato", "Connessioni"], pages);
}
```

tab: Domande

### Domande Aperte

```dataview
TABLE categoria, tipo, domande_aperte
FROM "Mondi"
WHERE domande_aperte AND length(domande_aperte) > 0 AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 12
```

tab: Segreti

### Segreti E Indizi Da Spendere

```dataview
TABLE categoria, tipo, segreti, indizi
FROM "Mondi"
WHERE ((segreti AND length(segreti) > 0) OR (indizi AND length(indizi) > 0)) AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 12
```
````

## Worldbuilding Operativo

````tabs
tab: Atlante

### Atlante Del Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const campaigns = new Set(dv.array(current.campagne_attive ?? []).map(gdr.linkKey).array());
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const matchesCampaign = p => {
  if (!campaigns.size) return true;
  const links = dv.array(p.campagne ?? p.campagna ?? p.campagne_attive ?? []).array();
  return !links.length || links.some(link => campaigns.has(gdr.linkKey(link)));
};
const pages = dv.pages('"Mondi/Luoghi"')
  .where(p => real(p) && p.file.name !== "Luoghi" && matchesWorld(p) && matchesCampaign(p))
  .sort(p => `${p.tipo ?? ""}-${p.file.name}`, "asc")
  .limit(18);

dv.table(
  ["Luogo", "Tipo", "Mondo", "Padre", "Fazioni", "Pericolo", "Stabilita", "Pressione"],
  pages.map(p => [p.file.link, p.tipo ?? "", p.mondo ?? "", p.luogo_padre ?? "", p.fazioni ?? [], p.pericolo ?? "", p.stabilita ?? "", p.pressione ?? ""])
);
```

tab: Poteri

### Poteri In Movimento

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const pages = dv.pages('"Mondi/Fazioni" OR "Mondi/Religioni"')
  .where(p => real(p) && p.file.name !== "Fazioni" && p.file.name !== "Religioni" && matchesWorld(p))
  .sort(p => Number(p.pressione ?? 0), "desc")
  .limit(18);

dv.table(
  ["Potere", "Pressione", "Prossima mossa", "Leader", "Rivali", "Luoghi", "Missioni"],
  pages.map(p => [p.file.link, p.pressione ?? "", p.prossima_mossa ?? "", p.leader ?? p.divinita ?? [], p.rivali ?? [], p.luoghi ?? [], p.missioni ?? []])
);
```

tab: PNG

### Relazioni PNG

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const pages = dv.pages('"Mondi/Personaggi"')
  .where(p => real(p) && p.tipo === "png" && matchesWorld(p))
  .sort(p => p.stato ?? "", "asc")
  .limit(18);

dv.table(
  ["PNG", "Luogo", "Fazione", "Atteggiamento", "Relazioni", "Segreti", "Prossima mossa"],
  pages.map(p => [p.file.link, p.luogo ?? "", p.fazioni ?? [], p.atteggiamento ?? "", p.relazioni ?? [], p.segreto ?? p.segreti ?? "", p.prossima_mossa ?? ""])
);
```

tab: Mappa

### Mappa Relazionale

![[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]

```dataview
TABLE uso, mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -") AND (uso = "relazioni" OR uso = "fronte")
SORT uso ASC, mondo ASC, file.name ASC
LIMIT 12
```
````

## Canone E Pressioni

````tabs
tab: Pressioni

### Pressioni Del Mondo

```dataview
TABLE categoria, tipo, pressione, prossima_mossa, scadenza_mondo
FROM "Mondi/Fazioni" OR "Mondi/Missioni"
WHERE pressione > 0 AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, file.name ASC
LIMIT 12
```

tab: Timeline

### Timeline Narrativa

```dataview
TABLE data_mondo, stato_canonico, mondo, luoghi, fazioni, sessioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, file.name ASC
LIMIT 16
```

tab: Cause

### Timeline Causale

```dataview
TABLE data_mondo, causa, conseguenze, luoghi, fazioni, missioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, file.name ASC
LIMIT 16
```

tab: Lore

### Lore Da Canonizzare

```dataview
TABLE tipo, stato, stato_canonico, data_mondo, sessioni, collegamenti, impatto
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 12
```

tab: Buchi

### Buchi Di Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => dv.array(value ?? []).length > 0;
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const issueRows = (source, checks) => dv.pages(source)
  .where(p => real(p) && matchesWorld(p))
  .array()
  .flatMap(p => checks.filter(check => check.test(p)).map(check => [p.file.link, check.label, p.stato ?? ""]));

const rows = [
  ...issueRows('"Mondi"', [
    { label: "mondo senza tono/tema/fazioni", test: p => p.categoria === "mondo" && (!has(p.tono) || !has(p.tema) || !hasLinks(p.fazioni)) }
  ]),
  ...issueRows('"Mondi/Luoghi"', [
    { label: "luogo pronto senza pericolo", test: p => p.stato === "pronto" && !has(p.pericolo) },
    { label: "luogo senza fazioni", test: p => !hasLinks(p.fazioni) }
  ]),
  ...issueRows('"Mondi/Fazioni" OR "Mondi/Religioni"', [
    { label: "fazione senza prossima_mossa", test: p => Number(p.pressione ?? 0) > 0 && !has(p.prossima_mossa) },
    { label: "fazione senza leader o luoghi", test: p => !hasLinks(p.leader) || !hasLinks(p.luoghi) }
  ]),
  ...issueRows('"Mondi/Missioni"', [
    { label: "missione senza fazioni", test: p => !hasLinks(p.fazioni) }
  ]),
  ...issueRows('"Mondi/Timeline"', [
    { label: "evento canonico senza conseguenze", test: p => (p.canonico === true || p.stato_canonico === "canonico") && !hasLinks(p.conseguenze) }
  ]),
  ...issueRows('"Mondi/Personaggi"', [
    { label: "PNG in gioco senza luogo/fazione", test: p => p.tipo === "png" && p.stato === "in gioco" && (!has(p.luogo) || !hasLinks(p.fazioni)) }
  ]),
  ...issueRows('"Inbox"', [
    { label: "lore da smistare o non collegata", test: p => p.categoria === "lore capture" && (p.stato === "da smistare" || !hasLinks(p.collegamenti)) }
  ])
].slice(0, 20);

if (!rows.length) {
  dv.paragraph("Nessun buco pratico evidente con i filtri correnti.");
} else {
  dv.table(["Nota", "Problema", "Stato"], rows);
}
```

tab: Stato

### Stato Canonico

```dataview
TABLE categoria, tipo, stato_canonico, canonico, mondo
FROM "Mondi" OR "Inbox"
WHERE stato_canonico AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND stato != "ignorata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT stato_canonico ASC, file.mtime DESC
LIMIT 16
```
````

## Archivi

````tabs
tab: Mondi

### Mondi e Archivi

```dataview
TABLE categoria, tipo, stato
FROM "Mondi"
WHERE file.name != "Mondo" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 16
```

tab: Personaggi

### Personaggi

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE file.name != "Personaggi" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT stato ASC, nome ASC
LIMIT 12
```

tab: Luoghi

### Luoghi

```dataview
TABLE tipo, bioma, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT nome ASC
LIMIT 12
```

tab: Fazioni

### Fazioni e Religioni

```dataview
TABLE categoria, tipo, stato, leader, divinita
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE file.name != "Fazioni" AND file.name != "Religioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 16
```

tab: Creature

### Creature

```dataview
TABLE tipo, stato, size AS taglia, cr, luoghi
FROM "Mondi/Creature"
WHERE file.name != "Creature" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT cr ASC, nome ASC
LIMIT 16
```

tab: Oggetti

### Oggetti e Dispense

```dataview
TABLE categoria, tipo, stato, luogo
FROM "Mondi/Oggetti" OR "Mondi/Dispense"
WHERE file.name != "Oggetti" AND file.name != "Dispense" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 16
```
````

## Mappe

````tabs
tab: Principali

![[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]

tab: Mondo

```dataview
TABLE uso, mondo, luogo, stato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -") AND (uso = "relazioni" OR uso = "fronte" OR uso = "regione")
SORT uso ASC, mondo ASC, file.name ASC
LIMIT 12
```

tab: Dungeon

```dataview
TABLE luogo, incontri, stato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -") AND uso = "dungeon"
SORT luogo ASC, file.name ASC
LIMIT 12
```

tab: Archivio

```dataview
TABLE uso, mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -")
SORT uso ASC, file.name ASC
LIMIT 20
```
````
