---
cssclasses:
  - dashboard
---

# Worldbuilder Dashboard

## Mondo

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

## Crea Mondo

```dataviewjs
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
label: Dispense
style: primary
actions:
  - type: open
    link: "[[Mondi/Dispense/Dispense]]"
```

## Panoramica Del Mondo

```dataviewjs
const count = (source, predicate = () => true) => dv.pages(source).where(predicate).length;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const isReal = p => !String(p.file.name).startsWith("Prova -");
const notIndex = p => isReal(p) && p.file.name !== p.file.folder?.split("/").pop() && p.stato !== "archiviata";

const cards = [
  ["Mondi", count('"Mondi"', p => isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata"), "Ambientazioni"],
  ["Personaggi", count('"Mondi/Personaggi"', notIndex), "Volti e legami"],
  ["Luoghi", count('"Mondi/Luoghi"', notIndex), "Dove succedono le cose"],
  ["Fazioni", count('"Mondi/Fazioni"', notIndex), "Poteri in movimento"],
  ["Religioni", count('"Mondi/Religioni"', notIndex), "Culti e divinita"],
  ["Creature", count('"Mondi/Creature"', notIndex), "Minacce e presenze"],
  ["Bozze", count('"Mondi"', p => isReal(p) && p.stato === "bozza"), "Da completare"]
];

const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = cards.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${escapeHtml(value)}</div>
    <div class="gdr-stat-label">${escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${escapeHtml(hint)}</div>
  </div>
`).join("");
```

## Bozze Da Completare

```dataview
TABLE categoria, tipo, luogo, stato
FROM "Mondi"
WHERE stato = "bozza" AND !startswith(file.name, "Prova -")
SORT categoria ASC, nome ASC
LIMIT 12
```

## Mondi e Archivi

```dataview
TABLE categoria, tipo, stato
FROM "Mondi"
WHERE file.name != "Mondo" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT categoria ASC, nome ASC
LIMIT 16
```

### Personaggi

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE file.name != "Personaggi" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
LIMIT 12
```

### Luoghi

```dataview
TABLE tipo, bioma, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT nome ASC
LIMIT 12
```

### Fazioni e Religioni

```dataview
TABLE categoria, tipo, stato, leader, divinita
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE file.name != "Fazioni" AND file.name != "Religioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT categoria ASC, nome ASC
LIMIT 16
```

### Creature

```dataview
TABLE tipo, stato, size AS taglia, cr, luoghi
FROM "Mondi/Creature"
WHERE file.name != "Creature" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT cr ASC, nome ASC
LIMIT 16
```

### Oggetti e Dispense

```dataview
TABLE categoria, tipo, stato, luogo
FROM "Mondi/Oggetti" OR "Mondi/Dispense"
WHERE file.name != "Oggetti" AND file.name != "Dispense" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT categoria ASC, nome ASC
LIMIT 16
```

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
