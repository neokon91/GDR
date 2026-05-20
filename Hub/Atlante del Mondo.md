---
cssclasses:
  - dashboard
  - gdr-atlante-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
---

# Atlante Del Mondo

Questa e la vista per usare il mondo nello spazio: mappa DM, mappa giocatori, luoghi, rotte, territori e buchi cartografici.

> [!timeline] Atlante operativo
> Usa questa pagina per vedere struttura, storia e buchi dell'ambientazione senza aprire archivi separati.

`BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`

`BUTTON[nuova-lingua-z-modelli-worldbuilding-lingua-md]`

`BUTTON[nuova-era-z-modelli-worldbuilding-era-storica-md]`

`BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`

`BUTTON[cosmologia-z-modelli-worldbuilding-cosmologia-md]`

> [!regia]- Strumenti mondo avanzati
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> `BUTTON[controllo-worldbuilding-controllo-worldbuilding]`
>
> `BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo]`
>
> `BUTTON[geopolitica-geopolitical-dashboard]`
>
> `BUTTON[economia-e-rotte-economia-e-rotte]`
>
> `BUTTON[lore-hub-lore-hub]`

## Filtro

> [!scena] Mondo
> `INPUT[mondo][:mondo_attivo]`

## Colpo D'Occhio

```dataviewjs
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const isReal = p => p.stato !== "archiviata";
const matchesWorld = p => !world || String(p.mondo?.path ?? p.mondo ?? "") === world || p.file.path === world;
const count = source => dv.pages(source).where(p => isReal(p) && matchesWorld(p)).length;
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const cards = [
  ["Luoghi", count('"Mondi/Luoghi"'), "Regioni, città, rovine"],
  ["Culture", count('"Mondi/Culture"'), "Popoli e usanze"],
  ["Lingue", count('"Mondi/Lingue"'), "Parlate e scritture"],
  ["Poteri", count('"Mondi/Fazioni" OR "Mondi/Religioni"'), "Regni, chiese, gilde"],
  ["Relazioni", count('"Mondi/Relazioni"'), "Alleanze e rivalità"],
  ["Storia", count('"Mondi/Storia" OR "Mondi/Timeline"'), "Ere ed eventi"],
  ["Conflitti", count('"Mondi/Conflitti"'), "Guerre e tensioni"],
  ["Rotte", count('"Mondi/Rotte"'), "Vie e strozzature"],
  ["Risorse", count('"Mondi/Risorse" OR "Mondi/Mercati"'), "Merci, nodi e dipendenze"],
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
tab: Mappa

### Mappa Principale


```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderAtlasMapCards(dv, dv.current().mondo_attivo);
```

### Controllo Atlante

```dataviewjs
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const real = p => p.stato !== "archiviata";
const key = value => value?.path ?? String(value ?? "");
const matchesWorld = p => !world || key(p.mondo) === world || p.file.path === world;
const rows = [];
dv.pages('"Mondi/Luoghi"')
  .where(p => real(p) && matchesWorld(p))
  .where(p => !p.mappe && !p.mappa && !p.coordinates)
  .limit(20)
  .forEach(p => rows.push([p.file.link, "luogo senza mappa o coordinate"]));
dv.pages('"Risorse/Mappe"')
  .where(p => real(p) && p.file.name !== "Mappe" && matchesWorld(p))
  .where(p => !p.luogo && (!Array.isArray(p.luoghi) || !p.luoghi.length))
  .limit(20)
  .forEach(p => rows.push([p.file.link, "mappa senza luoghi collegati"]));
dv.pages('"Risorse/Mappe"')
  .where(p => real(p) && p.file.name !== "Mappe" && matchesWorld(p))
  .where(p => p.pubblico !== true && !p.versione_giocatori)
  .limit(20)
  .forEach(p => rows.push([p.file.link, "mappa DM senza versione giocatori"]));

if (!rows.length) dv.paragraph("Atlante coerente: mappe e luoghi hanno collegamenti minimi.");
else dv.table(["Nota", "Problema"], rows);
```

### Luoghi Con Coordinate O Layer

```dataview
TABLE tipo, luogo_padre, coordinates, layer_mappa, tipo_mappa, color, icon
FROM "Mondi/Luoghi"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo) AND (coordinates OR layer_mappa OR tipo_mappa)
SORT layer_mappa ASC, tipo ASC, nome ASC
LIMIT 24
```

### Rotte E Territori

```dataview
TABLE stato_rotta, partenza, arrivo, regioni, fazioni_controllanti, risorse_trasportate, pressione
FROM "Mondi/Rotte" OR "Mondi/Luoghi" OR "Mondi/Fazioni"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, nome ASC
LIMIT 20
```

tab: Profondità

### Culture Da Approfondire

```dataview
TABLE mito_origine, cose_sacre, cose_proibite, famiglia_casa_ruoli, economia_mestieri
FROM "Mondi/Culture"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 16
```

### Eventi Che Devono Pesare Sul Mondo

```dataview
TABLE data_mondo, memoria_pubblica, cambiamenti_quotidiani, conseguenze, propaga_a
FROM "Mondi/Storia" OR "Mondi/Timeline"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, file.name ASC
LIMIT 16
```

### Conflitti E Relazioni Con Radici

```dataview
TABLE cause_profonde, ferite_storiche, risorse_contese, origine_storica, versioni_contrapposte, ferite_aperte
FROM "Mondi/Conflitti" OR "Mondi/Relazioni"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, intensita DESC, file.name ASC
LIMIT 16
```

tab: Geografia

```dataview
TABLE tipo, luogo_padre, governante, fazioni, pericolo
FROM "Mondi/Luoghi"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 20
```

tab: Popoli

```dataview
TABLE luoghi, lingue, religioni, fazioni, tensioni
FROM "Mondi/Culture"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT nome ASC
LIMIT 20
```

tab: Lingue

```dataview
TABLE culture, luoghi, origine, usi
FROM "Mondi/Lingue"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT nome ASC
LIMIT 20
```

tab: Poteri

```dataview
TABLE tipo, pressione, prossima_mossa, leader, luoghi, rivali
FROM "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, nome ASC
LIMIT 20
```

tab: Relazioni

```dataview
TABLE tipo, stato, soggetti, intensita, pressione, prossima_mossa, conseguenze
FROM "Mondi/Relazioni"
WHERE file.name != "Relazioni" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, intensita DESC, nome ASC
LIMIT 20
```

tab: Storia

```dataview
TABLE tipo, data_mondo, causa, conseguenze, luoghi, fazioni, culture
FROM "Mondi/Storia" OR "Mondi/Timeline"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT data_mondo ASC, nome ASC
LIMIT 20
```

tab: Cosmologia

```dataview
TABLE tipo, regola, pericolo, divinita, creature, luoghi_collegati
FROM "Mondi/Cosmologia"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 20
```

tab: Rotte

```dataview
TABLE stato_rotta, partenza, arrivo, regioni, fazioni_controllanti, risorse_trasportate, pressione, prossima_mossa
FROM "Mondi/Rotte"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, nome ASC
LIMIT 20
```

tab: Risorse

```dataview
TABLE tipo, luoghi, fazioni_controllanti, uso_narrativo, rotte, mercati, pressione
FROM "Mondi/Risorse" OR "Mondi/Mercati" OR "Mondi/Compendium"
WHERE stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, nome ASC
LIMIT 24
```
````

## Buchi Dell'Ambientazione

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;
const hasLinks = value => dv.array(value ?? []).length > 0;
const world = dv.current().mondo_attivo?.path ?? String(dv.current().mondo_attivo ?? "");
const real = p => p.stato !== "archiviata";
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
