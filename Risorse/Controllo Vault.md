---
cssclasses:
  - indice
---
# Controllo Vault

Questa pagina mostra cosa richiede attenzione. Non e un controllo tecnico: serve a capire cosa manca prima o dopo una sessione.

`BUTTON[quality-report-risorse-quality-report]`

`BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`

## Colpo D'Occhio

```dataviewjs
const isReal = p => Boolean(p);
const count = (source, predicate) => dv.pages(source).where(p => isReal(p) && predicate(p)).length;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const cards = [
  ["Idee da smistare", count('"Inbox"', p => p.file.name !== "Inbox" && !["smistata", "archiviata"].includes(p.stato)), "Decidi se diventano mondo"],
  ["Bozze generate", count('"Inbox/Generati"', p => p.plugin === "fantasy-content-generator" && p.stato === "bozza"), "Spunti da rivedere"],
  ["Sessioni da preparare", count('"Mondi/Sessioni"', p => p.stato === "preparazione"), "Da rifinire"],
  ["Materiale pronto", count('"Mondi/Incontri" OR "Mondi/Dispense" OR "Mondi/Oggetti"', p => p.stato === "pronto"), "Usabile subito"],
  ["Missioni aperte", count('"Mondi/Missioni"', p => ["proposta", "accettata", "in corso"].includes(p.stato)), "Scelte vive"],
  ["PNG in gioco", count('"Mondi/Personaggi"', p => p.tipo === "png" && p.stato === "in gioco"), "Presenze attive"],
  ["Bozze", count('"Mondi" OR "Campagne"', p => p.stato === "bozza"), "Da completare o archiviare"]
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

## Carte Da Guardare

```dataviewjs
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const internalLink = file => `<a class="internal-link" data-href="${escapeHtml(file.path)}" href="${escapeHtml(file.path)}">${escapeHtml(file.name)}</a>`;

const items = [
  ...dv.pages('"Inbox/Generati"').where(p => p.plugin === "fantasy-content-generator" && p.stato === "bozza").map(p => [p, "Bozza generata"]).array(),
  ...dv.pages('"Inbox"').where(p => p.file.name !== "Inbox" && !["smistata", "archiviata"].includes(p.stato)).map(p => [p, "Inbox"]).array(),
  ...dv.pages('"Mondi/Sessioni"').where(p => p.stato === "preparazione").map(p => [p, "Sessione"]).array(),
  ...dv.pages('"Mondi/Missioni"').where(p => ["proposta", "accettata", "in corso"].includes(p.stato)).map(p => [p, "Missione"]).array(),
  ...dv.pages('"Mondi/Incontri"').where(p => p.stato === "bozza").map(p => [p, "Incontro"]).array()
].slice(0, 10);

if (!items.length) {
  dv.paragraph("Niente di urgente da controllare.");
} else {
  const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
  grid.innerHTML = items.map(([p, kind]) => `
    <div class="gdr-info-card compact">
      <div class="gdr-card-title">${internalLink(p.file)}</div>
      <div class="gdr-card-meta">${escapeHtml(kind)} · ${escapeHtml(p.stato ?? "senza stato")}</div>
      <div class="gdr-card-line">${escapeHtml(p.tipo ?? p.categoria ?? "nota")}</div>
    </div>
  `).join("");
}
```

## Idee Da Smistare

```dataview
TABLE tipo, stato, collegamenti
FROM "Inbox"
WHERE file.name != "Inbox" AND stato != "smistata" AND stato != "archiviata"
SORT file.ctime DESC
```

## Bozze Generate

`BUTTON[smistamento-bozze-generate-risorse-smistamento-bozze-generate-2]`

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza"
SORT creato ASC, file.ctime ASC
```

## Mappe Da Rendere Giocabili

```dataview
TABLE uso, stato, mondo, luogo, luoghi
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND stato != "archiviata" AND (uso = "zoom" OR uso = "esagoni" OR uso = "dungeon" OR uso = "scena") AND (stato != "pronto" OR (!luogo AND !luoghi))
SORT uso ASC, file.mtime DESC
```

## Sessioni Da Preparare

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE stato = "preparazione"
SORT data ASC
```

## Materiale Pronto Per Il Tavolo

```dataview
TABLE categoria, tipo, stato, luogo
FROM "Mondi/Incontri" OR "Mondi/Dispense" OR "Mondi/Oggetti"
WHERE stato = "pronto"
SORT categoria ASC, nome ASC
```

## Missioni Aperte

```dataview
TABLE stato, committente, luoghi, personaggi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso")
SORT stato ASC, nome ASC
```

## PNG In Gioco

```dataview
TABLE ruolo, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato = "in gioco"
SORT nome ASC
```

## Da Completare

```dataview
TABLE categoria, tipo, stato
FROM "Mondi" OR "Campagne"
WHERE stato = "bozza"
SORT categoria ASC, nome ASC
```

## Controlli Coerenza

### Stati Fuori Standard

```dataviewjs
const statiValidi = new Set([
  "bozza",
  "preparazione",
  "pronto",
  "in gioco",
  "usato",
  "giocata",
  "consegnato",
  "proposta",
  "accettata",
  "in corso",
  "completata",
  "fallita",
  "da smistare",
  "smistata",
  "in pausa",
  "conclusa",
  "archiviata"
]);

const isFolderIndex = p => {
  const stem = p.file.path.replace(/\.md$/, "");
  const parts = stem.split("/");
  return parts.length > 1 && parts[parts.length - 1] === parts[parts.length - 2];
};

const isServicePage = p => isFolderIndex(p) || p.file.path === "Mondi/Calendario.md";

const pages = dv.pages('"Mondi" OR "Campagne" OR "Inbox"')
  .where(p => !isServicePage(p) && p.stato && !statiValidi.has(p.stato));

if (!pages.length) {
  dv.paragraph("Nessuno stato fuori standard.");
} else {
  dv.table(["Nota", "Categoria", "Stato"], pages.map(p => [p.file.link, p.categoria, p.stato]));
}
```

### Campi Base Mancanti

```dataviewjs
const isFolderIndex = p => {
  const stem = p.file.path.replace(/\.md$/, "");
  const parts = stem.split("/");
  return parts.length > 1 && parts[parts.length - 1] === parts[parts.length - 2];
};

const isServicePage = p => isFolderIndex(p) || p.file.path === "Mondi/Calendario.md";

const pages = dv.pages('"Mondi" OR "Campagne" OR "Inbox"')
  .where(p => !isServicePage(p) && (!p.categoria || !p.stato));

if (!pages.length) {
  dv.paragraph("Nessuna nota senza categoria o stato.");
} else {
  dv.table(["Nota", "Categoria", "Stato"], pages.map(p => [p.file.link, p.categoria ?? "manca", p.stato ?? "manca"]));
}
```

### Date Da Calendarizzare

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;

const rows = [
  ...dv.pages('"Mondi/Sessioni"')
    .where(p => p.stato !== "archiviata" && hasText(p.data_mondo) && !hasText(p["fc-date"]))
    .map(p => [p.file.link, "Sessione con data mondo ma senza fc-date", p.data_mondo]).array(),
  ...dv.pages('"Mondi/Missioni"')
    .where(p => p.stato !== "archiviata" && hasText(p.scadenza_mondo) && !hasText(p["fc-date"]))
    .map(p => [p.file.link, "Missione con scadenza ma senza fc-date", p.scadenza_mondo]).array(),
  ...dv.pages('"Mondi/Missioni" OR "Mondi/Sessioni"')
    .where(p => p.stato !== "archiviata" && hasText(p["fc-date"]) && !hasText(p["fc-category"]))
    .map(p => [p.file.link, "Evento Calendarium senza categoria", p["fc-date"]]).array()
];

if (!rows.length) {
  dv.paragraph("Nessuna data narrativa da calendarizzare.");
} else {
  dv.table(["Nota", "Problema", "Data"], rows);
}
```

### Configurazione Calendarium

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;
let data = null;
try {
  data = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/calendarium/data.json"));
} catch (error) {
  dv.paragraph("Configurazione Calendarium non leggibile.");
}

if (data) {
  const calendars = Array.isArray(data.calendars) ? data.calendars : Object.values(data.calendars ?? {});
  const names = new Set(calendars.flatMap(c => [c.name, c.id]).filter(Boolean).map(x => String(x).toLowerCase()));
  const dated = dv.pages('"Mondi" OR "Campagne" OR "Inbox"')
    .where(p => p.stato !== "archiviata" && hasText(p["fc-date"]));
  const issues = [];

  if (!calendars.length && dated.length) {
    issues.push(["Calendarium", "nessun calendario salvato nella configurazione plugin", `${dated.length} note hanno fc-date`]);
  }

  if (calendars.length) {
    dated
      .where(p => hasText(p["fc-calendar"]) && !names.has(String(p["fc-calendar"]).toLowerCase()))
      .forEach(p => issues.push([p.file.link, "fc-calendar non presente in Calendarium", p["fc-calendar"]]));
  }

  if (!issues.length) {
    dv.paragraph("Calendarium allineato con le note datate.");
  } else {
    dv.table(["Elemento", "Problema", "Dettaglio"], issues);
  }
}
```

### Pronti Ma Incompleti

```dataviewjs
const rows = [
  ...dv.pages('"Inbox/Generati"')
    .where(p => p.plugin === "fantasy-content-generator" && p.stato === "bozza" && (!p.mondo && !p.luogo))
    .map(p => [p.file.link, "Bozza generata senza mondo o luogo"]).array(),
  ...dv.pages('"Risorse/Mappe"')
    .where(p => p.file.name !== "Mappe" && ["zoom", "esagoni", "dungeon", "scena"].includes(p.uso) && p.stato === "pronto" && (!p.mondo || (!p.luogo && !dv.array(p.luoghi).length)))
    .map(p => [p.file.link, "Mappa pronta senza mondo o luogo/luoghi"]).array(),
  ...dv.pages('"Mondi/Incontri"')
    .where(p => p.stato === "pronto" && !dv.array(p.creature).length)
    .map(p => [p.file.link, "Incontro pronto senza creature"]).array(),
  ...dv.pages('"Mondi/Missioni"')
    .where(p => ["proposta", "accettata", "in corso"].includes(p.stato) && !p.committente)
    .map(p => [p.file.link, "Missione aperta senza committente"]).array(),
  ...dv.pages('"Mondi/Personaggi"')
    .where(p => p.tipo === "png" && p.stato === "in gioco" && !p.luogo)
    .map(p => [p.file.link, "PNG in gioco senza luogo"]).array(),
  ...dv.pages('"Mondi/Sessioni"')
    .where(p => p.stato === "pronto" && (!dv.array(p.luoghi).length || !dv.array(p.personaggi).length))
    .map(p => [p.file.link, "Sessione pronta senza luoghi o personaggi"]).array()
];

if (!rows.length) {
  dv.paragraph("Nessun materiale pronto incompleto.");
} else {
  dv.table(["Nota", "Problema"], rows);
}
```
