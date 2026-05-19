---
cssclasses:
  - tavolo
---

# Durante Il Gioco

## Sessione Attiva

```dataviewjs
const sessions = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc");

const active = sessions.first();

if (!active) {
  dv.paragraph("Nessuna sessione attiva. Segna una sessione come `preparazione` o `pronto`.");
} else {
  dv.table(
    ["Sessione", "Data", "Data mondo", "Stato", "Luoghi", "Incontri"],
    [[active.file.link, active.data ?? "", active.data_mondo ?? "", active.stato ?? "", active.luoghi ?? [], active.incontri ?? []]]
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
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

if (active) {
  dv.table(
    ["Obiettivo", "Scene", "Segreti rivelabili", "Domande", "Pressioni"],
    [[active.obiettivo ?? "", active.scene ?? [], active.segreti_rivelabili ?? [], active.domande_al_tavolo ?? [], active.pressioni ?? []]]
  );
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

## Appunti Rapidi

> [!indizio] Dettagli emersi
> 

> [!segreto]- Da ricordare
> 

## Pressioni Attive

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

## Improvvisazione Rapida

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

## Persone In Scena

### PNG Della Sessione

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### PG

```dataview
TABLE giocatore, classe, livello, hp_attuali, hp_massimi
FROM "Mondi/Personaggi"
WHERE tipo = "pg"
SORT nome ASC
```

## Materiale Pronto

### Incontri

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### Creature

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### Oggetti Da Assegnare

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### Dispense Di Scena

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### Mappe

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### Musica e Risorse

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && ["pronto", "preparazione"].includes(p.stato))
  .sort(p => p.data ?? "0000-00-00", "desc")
  .first();

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

### Regole e Riferimenti

- [[Risorse/Callout GDR]]
- [[Risorse/Plugin Attivi]]

## Post-Sessione

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
