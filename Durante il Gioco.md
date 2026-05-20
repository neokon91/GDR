---
cssclasses:
  - tavolo
---

# Durante Il Gioco

## Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const sessions = gdr.sessionCandidates(dv);
const active = gdr.activeSession(dv);

if (!active) {
  dv.paragraph("Nessuna sessione attiva. Attiva una sessione con il toggle `attiva`, oppure usa il fallback `pronto` o `preparazione`.");
} else {
  dv.table(
    ["Sessione", "Data", "Data mondo", "Stato", "Campagne", "Luoghi", "Missioni", "Incontri"],
    [[active.file.link, active.data ?? "", active.data_mondo ?? "", active.stato ?? "", active.campagne ?? [], active.luoghi ?? [], active.missioni ?? [], active.incontri ?? []]]
  );
  dv.paragraph(`Apri: ${active.file.link}`);
}
```

## Comandi Rapidi

```meta-bind-button
label: Preparazione Sessione
style: primary
actions:
  - type: open
    link: "[[Risorse/Preparazione Sessione]]"
```

```meta-bind-button
label: Nota Rapida
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Nota Rapida.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Evento / Lore
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Lore Capture.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Nuovo PNG
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/personaggio/PNG.md"
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
label: Nuova Missione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Missione.md"
    folderPath: "Mondi/Missioni"
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
label: Nuovo Incontro
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Incontro.md"
    folderPath: "Mondi/Incontri"
    open: true
```

```meta-bind-button
label: Nuova Dispensa
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Dispensa.md"
    folderPath: "Mondi/Dispense"
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
label: Evento Storico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Evento Storico.md"
    folderPath: "Mondi/Timeline"
    open: true
```

```meta-bind-button
label: Stato Mondo
style: primary
actions:
  - type: open
    link: "[[Mondi/Stato del Mondo]]"
```

```meta-bind-button
label: Controllo Vault
style: primary
actions:
  - type: open
    link: "[[Risorse/Controllo Vault]]"
```

```meta-bind-button
label: Tabelle Rapide
style: primary
actions:
  - type: open
    link: "[[Risorse/Tabelle/Tabelle]]"
```

## Scena Corrente

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

if (active) {
  dv.table(
    ["Obiettivo", "Scene", "Segreti rivelabili", "Domande", "Pressioni"],
    [[active.obiettivo ?? "", active.scene ?? [], active.segreti_rivelabili ?? [], active.domande_al_tavolo ?? [], active.pressioni ?? []]]
  );
}
```

## Quadro Di Regia

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const count = value => dv.array(value ?? []).length;

if (!active) {
  dv.paragraph("Nessuna sessione attiva da riassumere.");
} else {
  const cards = [
    ["Luoghi", count(active.luoghi), "Dove puo andare la scena"],
    ["PNG/PG", count(active.personaggi), "Persone da tenere vive"],
    ["Incontri", count(active.incontri), "Scene pronte"],
    ["Missioni", count(active.missioni), "Obiettivi e pressioni"],
    ["Dispense", count(active.dispense), "Materiale da consegnare"],
    ["Oggetti", count(active.oggetti), "Ricompense o leve"]
  ];

  const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
  grid.innerHTML = cards.map(([label, value, hint]) => `
    <div class="gdr-stat-card">
      <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
      <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
      <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
    </div>
  `).join("");
}
```

## Tavolo Operativo

````tabs
tab: Scena

### Contesto Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

if (!active) {
  dv.paragraph("Nessun contesto mondo disponibile senza sessione attiva.");
} else {
  dv.table(
    ["Mondo", "Campagne", "Fazioni", "Luoghi chiave"],
    [[active.mondo ?? "", active.campagne ?? [], active.fazioni ?? [], active.luoghi ?? []]]
  );
}
```

### Lore Collegata

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const world = gdr.linkKey(active?.mondo);
const places = new Set(dv.array(active?.luoghi ?? []).map(gdr.linkKey).array());
const factions = new Set(dv.array(active?.fazioni ?? []).map(gdr.linkKey).array());
const sessions = new Set(active ? [active.file.path] : []);

const pages = dv.pages('"Mondi/Timeline" OR "Inbox"')
  .where(p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata" && p.stato !== "ignorata")
  .where(p => p.categoria === "evento storico" || p.categoria === "lore capture")
  .where(p => !active
    || gdr.linkKey(p.mondo) === world
    || dv.array(p.luoghi ?? []).some(link => places.has(gdr.linkKey(link)))
    || dv.array(p.fazioni ?? []).some(link => factions.has(gdr.linkKey(link)))
    || dv.array(p.sessioni ?? []).some(link => sessions.has(gdr.linkKey(link))))
  .sort(p => p.data_mondo ?? p.file.mtime, "desc")
  .limit(8);

if (!pages.length) {
  dv.paragraph("Nessuna lore collegata alla sessione attiva.");
} else {
  dv.table(["Lore", "Stato", "Canon", "Data mondo", "Collegamenti"], pages.map(p => [p.file.link, p.stato ?? "", p.stato_canonico ?? "", p.data_mondo ?? "", p.collegamenti ?? p.luoghi ?? []]));
}
```

### Missioni Della Sessione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

let pages = dv.array(active?.missioni ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  const activeFactions = new Set(dv.array(active?.fazioni ?? []).map(link => link.path ?? String(link)).array());
  pages = dv.pages('"Mondi/Missioni"')
    .where(p => !String(p.file.name).startsWith("Prova -") && ["proposta", "accettata", "in corso"].includes(p.stato))
    .where(p => !activeFactions.size || dv.array(p.fazioni ?? []).some(link => activeFactions.has(link.path ?? String(link))))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(8)
    .array();
}

if (!pages.length) {
  dv.paragraph("Nessuna missione collegata alla sessione attiva.");
} else {
  dv.table(["Missione", "Stato", "Pressione", "Committente", "Prossima mossa"], pages.map(p => [p.file.link, p.stato ?? "", p.pressione ?? "", p.committente ?? "", p.prossima_mossa ?? ""]));
}
```

> [!lettura] Riassunto da leggere
> 

> [!scena] Situazione al tavolo
> 

> [!timer] Orologi e pressioni
> - [ ] 
> - [ ] 
> - [ ] 
> - [ ] 

tab: Cattura

### Inbox Live

```meta-bind-button
label: Evento Live
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Evento.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: PNG Improvvisato
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live PNG.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Luogo Improvvisato
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Luogo.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Nota Grezza
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Nota Grezza.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Conseguenza
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Conseguenza.md"
    folderPath: "Inbox"
    open: true
```

```dataview
TABLE tipo, stato, stato_canonico, sessioni, collegamenti
FROM "Inbox"
WHERE stato != "archiviata" AND stato != "ignorata"
SORT file.mtime DESC
LIMIT 12
```

> [!indizio] Cattura live
> Scrivi qui solo se non vale ancora una nota. Se diventa importante, crea un evento/lore e collegalo alla sessione attiva.
> - 

### Lore Capture

```dataview
TABLE stato, stato_canonico, data_mondo, sessioni, collegamenti
FROM "Inbox" OR "Mondi/Timeline"
WHERE categoria = "lore capture" OR categoria = "evento storico"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
LIMIT 12
```

> [!missione] Trasformazione
> - `canonico`: resta nel mondo e va collegato a timeline, luoghi, PNG, fazioni o missioni.
> - `rumor`, `leggenda`, `segreto`: esiste nel mondo ma non e verita pubblica.
> - `archiviata` o `ignorata`: non deve piu occupare la schermata da tavolo.

### Appunti Rapidi

> [!indizio] Dettagli emersi
> 

> [!segreto]- Da ricordare
> 

tab: Pressioni

### Pressioni Attive

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const sessionFactions = new Set(dv.array(active?.fazioni ?? []).map(link => link.path ?? String(link)).array());
const sessionMissions = new Set(dv.array(active?.missioni ?? []).map(link => link.path ?? String(link)).array());
const linkedMissionPages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Fazioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata" && Number(p.pressione ?? 0) > 0)
  .where(p => sessionFactions.size === 0 && sessionMissions.size === 0
    || sessionFactions.has(p.file.path)
    || sessionMissions.has(p.file.path)
    || dv.array(p.fazioni ?? []).some(link => sessionFactions.has(link.path ?? String(link)))
    || linkedMissionPages.some(enc => dv.array(enc.fazioni ?? []).some(link => (link.path ?? String(link)) === p.file.path)))
  .sort(p => Number(p.pressione ?? 0), "desc")
  .limit(8);

if (!pages.length) {
  dv.paragraph("Nessuna pressione collegata alla sessione attiva.");
} else {
  dv.table(["Fronte/Fazione", "Stato", "Pressione", "Prossima mossa"], pages.map(p => [p.file.link, p.stato ?? "", p.pressione ?? "", p.prossima_mossa ?? ""]));
}
```

### Improvvisazione Rapida

> [!png] Nome o volto al volo
> - Nome:
> - Voce:
> - Vuole:
> - Sa:

> [!luogo] Dettaglio sensoriale
> - Suono:
> - Odore:
> - Traccia:
> - Cosa stona:

> [!pericolo] Complicazione
> - [ ] Una minaccia avanza
> - [ ] Qualcuno arriva
> - [ ] Qualcosa costa piu del previsto

tab: Persone

### Persone In Scena

#### PNG Della Sessione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const linked = dv.array(active?.personaggi ?? []);
let pages = linked
  .map(link => dv.page(link.path ?? link))
  .where(p => p && p.tipo === "png")
  .array();

if (!pages.length) {
  pages = dv.pages('"Mondi/Personaggi"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.tipo === "png" && p.stato === "in gioco")
    .array();
}

dv.table(["PNG", "Ruolo", "Luogo", "Atteggiamento"], pages.map(p => [p.file.link, p.ruolo ?? "", p.luogo ?? "", p.atteggiamento ?? ""]));
```

#### PG

```dataview
TABLE giocatore, classe, livello, hp_attuali, hp_massimi
FROM "Mondi/Personaggi"
WHERE tipo = "pg"
SORT nome ASC
```

tab: Materiali

### Materiale Pronto

#### Incontri

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

let pages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  pages = dv.pages('"Mondi/Incontri"')
    .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "in gioco"].includes(p.stato))
    .sort(p => p.pericolo ?? 0, "desc")
    .array();
}

dv.table(["Incontro", "Luogo", "Pericolo", "Creature"], pages.map(p => [p.file.link, p.luogo ?? "", p.pericolo ?? "", p.creature ?? []]));
```

#### Creature

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const pages = dv.array(active?.creature ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  dv.paragraph("Nessuna creatura collegata alla sessione attiva.");
} else {
  dv.table(["Creatura", "Tipo", "Taglia", "GS"], pages.map(p => [p.file.link, p.type ?? p.tipo ?? "", p.size ?? "", p.cr ?? ""]));
}
```

#### Oggetti Da Assegnare

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

let pages = dv.array(active?.oggetti ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  pages = dv.pages('"Mondi/Oggetti"')
    .where(p => !String(p.file.name).startsWith("Prova -") && !p.proprietario && p.stato !== "archiviata")
    .sort(p => p.rarita ?? "", "asc")
    .array();
}

dv.table(["Oggetto", "Tipo", "Rarita", "Luogo", "Proprietario"], pages.map(p => [p.file.link, p.tipo ?? "", p.rarita ?? "", p.luogo ?? "", p.proprietario ?? ""]));
```

#### Dispense Di Scena

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

let pages = dv.array(active?.dispense ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  pages = dv.pages('"Mondi/Dispense"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.stato === "pronto")
    .sort(p => p.nome ?? p.file.name, "asc")
    .array();
}

dv.table(["Dispensa", "Tipo", "Luogo", "Personaggi"], pages.map(p => [p.file.link, p.tipo ?? "", p.luogo ?? "", p.personaggi ?? []]));
```

#### Mappe

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const sessionMaps = dv.array(active?.mappe ?? []).array();
const places = dv.array(active?.luoghi ?? []);
const encounterPages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

const encounterMaps = encounterPages.flatMap(p => dv.array(p.mappe ?? []).array());
let pages = sessionMaps
  .concat(encounterMaps)
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length && places.length) {
  const placePaths = new Set(places.map(link => link.path ?? String(link)).array());
  pages = dv.pages('"Risorse/Mappe"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.file.name !== "Mappe" && p.luogo && placePaths.has(p.luogo.path ?? String(p.luogo)))
    .array();
}

if (!pages.length) {
  dv.paragraph("Nessuna mappa collegata alla sessione attiva.");
} else {
  dv.table(["Mappa", "Uso", "Mondo", "Luogo", "Stato"], pages.map(p => [p.file.link, p.uso ?? "", p.mondo ?? "", p.luogo ?? "", p.stato ?? ""]));
}
```

#### Musica e Risorse

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const encounterPages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

const mediaLinks = [
  ...dv.array(active?.audio ?? []).array(),
  ...dv.array(active?.immagini ?? []).array(),
  ...dv.array(active?.video ?? []).array(),
  ...encounterPages.flatMap(p => dv.array(p.audio ?? []).array()),
  ...encounterPages.flatMap(p => dv.array(p.immagini ?? []).array()),
  ...encounterPages.flatMap(p => dv.array(p.video ?? []).array())
];

let pages = dv.array(mediaLinks)
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  pages = dv.pages('"Risorse/Audio" OR "Risorse/Video" OR "Risorse/Immagini" OR "Risorse/Dispense"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.file.name !== "Audio" && p.file.name !== "Video" && p.file.name !== "Immagini" && p.file.name !== "Dispense" && p.stato === "pronto")
    .sort(p => p.uso ?? "", "asc")
    .array();
}

if (!pages.length) {
  dv.paragraph("Nessun media pronto o collegato alla sessione attiva.");
} else {
  dv.table(["Risorsa", "Uso", "Tono", "Campagna", "Stato"], pages.map(p => [p.file.link, p.uso ?? "", p.tono ?? "", p.campagna ?? "", p.stato ?? ""]));
}
```

#### Regole e Riferimenti

- [[Risorse/Callout GDR]]
- [[Risorse/Plugin Attivi]]

tab: Post

### Post-Sessione

```meta-bind-button
label: Bacheca Post Sessione
style: primary
actions:
  - type: open
    link: "[[z.bacheche/Post Sessione]]"
```

> [!missione] Conseguenze
> - [ ] Aggiornare missioni
> - [ ] Aggiornare PNG e relazioni
> - [ ] Aggiornare luoghi visitati
> - [ ] Spostare appunti nelle note giuste

> [!tesoro] Ricompense e promesse
> 
````
