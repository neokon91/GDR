---
cssclasses:
  - dashboard
  - gdr-worldbuilder-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
campagne_attive: []
---

# Worldbuilder Dashboard

> [!luogo] Scriptorium del Mondo
> Costruisci ambientazioni giocabili: luoghi, PNG, fazioni, storia e pressioni devono restare collegati a cio che puo arrivare al tavolo.

## Mondo

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`
>
> Campagne:
> `INPUT[campagne][:campagne_attive]`

`BUTTON[dm-dashboard-1-dm-dashboard]`

`BUTTON[indice-mondo-mondi-mondo]`

`BUTTON[atlante-del-mondo-atlante-del-mondo]`

`BUTTON[bibbia-del-mondo-bibbia-del-mondo-2]`

`BUTTON[motore-mondo-vivo-motore-mondo-vivo]`

`BUTTON[geopolitica-geopolitical-dashboard-2]`

`BUTTON[economia-e-rotte-economia-e-rotte-2]`

`BUTTON[lore-hub-lore-hub-2]`

`BUTTON[controllo-vault-risorse-controllo-vault]`

`BUTTON[mappe-risorse-mappe-mappe]`

`BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`

`BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md]`


`BUTTON[timeline-mondi-timeline-timeline]`

`BUTTON[revisione-lore-revisione-lore]`

`BUTTON[controllo-canone-controllo-canone]`

`BUTTON[stato-mondo-mondi-stato-del-mondo]`

## Crea Il Tuo Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const steps = [
  ["1", "Identità", "Tono, temi, promessa e verità canoniche"],
  ["2", "Struttura", "Geografia, culture, poteri, storia e cosmologia"],
  ["3", "Connessioni", "Relazioni, rotte, risorse, conflitti e misteri"],
  ["4", "Gioco", "Campagne, avventure, sessioni live e conseguenze"]
];
const grid = dv.el("div", "", { cls: "gdr-flow" });
grid.innerHTML = steps.map(([label, title, hint]) => `
  <div class="gdr-flow-step">
    <div class="gdr-flow-label">${label}</div>
    <div class="gdr-flow-title">${title}</div>
    <div class="gdr-flow-hint">${hint}</div>
  </div>
`).join("");
gdr.renderWorldCreationStatus(dv, dv.current().mondo_attivo);
```

`BUTTON[nuovo-mondo-homebrew]`

````tabs
tab: Fondamenta

`BUTTON[nuovo-luogo-z-modelli-luogo-router-md]`

`BUTTON[wizard-nuova-entita-viva]`

`BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`

`BUTTON[nuova-lingua-z-modelli-worldbuilding-lingua-md]`

`BUTTON[evento-storico-z-modelli-evento-storico-md]`

`BUTTON[nuova-era-z-modelli-worldbuilding-era-storica-md]`

tab: Poteri

`BUTTON[nuova-fazione-z-modelli-fazione-router-md]`

`BUTTON[nuovo-culto-z-modelli-fazione-culto-md]`

`BUTTON[nuovo-personaggio-z-modelli-personaggio-router-md]`

`BUTTON[nuova-relazione-z-modelli-worldbuilding-relazione-md]`

`BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`

tab: Mito E Mistero

`BUTTON[cosmologia-z-modelli-worldbuilding-cosmologia-md]`

`BUTTON[segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`

`BUTTON[nuova-creatura-z-modelli-creatura-md]`

`BUTTON[nuovo-oggetto-z-modelli-oggetto-md]`

`BUTTON[nuovo-oggetto-magico-z-modelli-oggetto-magico-md]`

tab: Economia

`BUTTON[nuova-rotta-z-modelli-worldbuilding-rotta-md]`

`BUTTON[nuova-risorsa-z-modelli-worldbuilding-risorsa-md]`

`BUTTON[nuovo-mercato-z-modelli-worldbuilding-mercato-o-nodo-commerciale-md]`

tab: Tavolo

`BUTTON[campagna-da-ambientazione-campagna-da-ambientazione]`

`BUTTON[nuova-missione-z-modelli-dm-missione-md]`

`BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`

`BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]`

`BUTTON[dispense-mondi-dispense-dispense]`

tab: Mappe

`BUTTON[atlante-del-mondo-atlante-del-mondo]`

`BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`

`BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md]`
````

## Panoramica Del Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const count = (source, predicate = () => true) => dv.pages(source).where(predicate).length;
const notIndex = p => gdr.isReal(p) && p.file.name !== p.file.folder?.split("/").pop() && p.stato !== "archiviata";

const cards = [
  ["Mondi", count('"Mondi"', p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata"), "Ambientazioni"],
  ["Personaggi", count('"Mondi/Personaggi"', notIndex), "Volti e legami"],
  ["Luoghi", count('"Mondi/Luoghi"', notIndex), "Dove succedono le cose"],
  ["Culture", count('"Mondi/Culture"', notIndex), "Popoli e usanze"],
  ["Lingue", count('"Mondi/Lingue"', notIndex), "Parlate e scritture"],
  ["Fazioni", count('"Mondi/Fazioni"', notIndex), "Poteri in movimento"],
  ["Relazioni", count('"Mondi/Relazioni"', notIndex), "Alleanze, rivalità e patti"],
  ["Rotte", count('"Mondi/Rotte"', notIndex), "Vie commerciali e blocchi"],
  ["Risorse", count('"Mondi/Risorse"', notIndex), "Merci e dipendenze"],
  ["Mercati", count('"Mondi/Mercati"', notIndex), "Nodi commerciali"],
  ["Religioni", count('"Mondi/Religioni"', notIndex), "Culti e divinita"],
  ["Conflitti", count('"Mondi/Conflitti"', notIndex), "Guerre e crisi"],
  ["Cosmologia", count('"Mondi/Cosmologia"', notIndex), "Piani e reami"],
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
WHERE stato = "bozza" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 12
```

tab: Campagna

### Campagna Filtrata

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
WHERE domande_aperte AND length(domande_aperte) > 0 AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 12
```

tab: Segreti

### Segreti E Indizi Da Spendere

```dataview
TABLE categoria, tipo, segreti, indizi
FROM "Mondi"
WHERE ((segreti AND length(segreti) > 0) OR (indizi AND length(indizi) > 0)) AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 12
```
````

## Worldbuilding Operativo

````tabs
tab: Atlante

### Atlante Del Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
WHERE file.name != "Mappe" AND (uso = "relazioni" OR uso = "fronte" OR uso = "indizi")
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
WHERE pressione > 0 AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, file.name ASC
LIMIT 12
```

tab: Timeline

### Timeline Narrativa

```dataview
TABLE data_mondo AS "Data", stato_canonico AS "Canone", mondo AS "Mondo", luoghi AS "Luoghi", fazioni AS "Fazioni", sessioni AS "Sessioni"
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, file.name ASC
LIMIT 16
```

tab: Cause

### Timeline Causale

```dataview
TABLE data_mondo, cause, causa, effetti, conseguenze, propaga_a, luoghi, fazioni, missioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, file.name ASC
LIMIT 16
```

tab: Propagazione

### Propagazione Eventi

```dataview
TABLE categoria, tipo, stato, propaga_a, entita_impattate, conseguenze, prossima_mossa
FROM "Mondi" OR "Inbox"
WHERE (propaga_a OR entita_impattate OR conseguenze OR prossima_mossa) AND stato != "archiviata" AND stato != "ignorata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 18
```

tab: Relazioni

### Grafo Relazionale

```dataview
TABLE categoria, tipo, relazioni, alleati, rivali, fazioni, luoghi, missioni
FROM "Mondi/Personaggi" OR "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Luoghi" OR "Mondi/Relazioni"
WHERE (relazioni OR alleati OR rivali OR fazioni OR luoghi OR missioni) AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 24
```

tab: Lore

### Lore Da Canonizzare

```dataview
TABLE tipo AS "Tipo", stato AS "Stato", stato_canonico AS "Canone", data_mondo AS "Data", sessioni AS "Sessioni", collegamenti AS "Collegamenti", impatto AS "Impatto"
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 12
```

tab: Buchi

### Buchi Di Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
TABLE categoria AS "Categoria", tipo AS "Tipo", stato_canonico AS "Canone", canonico AS "Confermato", mondo AS "Mondo"
FROM "Mondi" OR "Inbox"
WHERE stato_canonico AND stato != "archiviata" AND stato != "ignorata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
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
WHERE file.name != "Mondo" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo OR file.link = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 16
```

tab: Personaggi

### Personaggi

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE file.name != "Personaggi" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT stato ASC, nome ASC
LIMIT 12
```

tab: Luoghi

### Luoghi

```dataview
TABLE tipo, bioma, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT nome ASC
LIMIT 12
```

tab: Fazioni

### Fazioni e Religioni

```dataview
TABLE categoria, tipo, stato, leader, divinita
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE file.name != "Fazioni" AND file.name != "Religioni" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT categoria ASC, nome ASC
LIMIT 16
```

tab: Creature

### Creature

```dataview
TABLE tipo, stato, size AS taglia, cr, luoghi
FROM "Mondi/Creature"
WHERE file.name != "Creature" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT cr ASC, nome ASC
LIMIT 16
```

tab: Oggetti

### Oggetti e Dispense

```dataview
TABLE categoria, tipo, stato, luogo
FROM "Mondi/Oggetti" OR "Mondi/Dispense"
WHERE file.name != "Oggetti" AND file.name != "Dispense" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
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
WHERE file.name != "Mappe" AND (uso = "relazioni" OR uso = "fronte" OR uso = "regione" OR uso = "indizi")
SORT uso ASC, mondo ASC, file.name ASC
LIMIT 12
```

tab: Dungeon

```dataview
TABLE luogo, incontri, stato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND uso = "dungeon"
SORT luogo ASC, file.name ASC
LIMIT 12
```

tab: Archivio

```dataview
TABLE uso, mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe"
SORT uso ASC, file.name ASC
LIMIT 20
```
````
