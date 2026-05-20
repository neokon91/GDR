---
cssclasses:
  - tavolo
  - gdr-tavolo-dashboard
---

# Durante Il Gioco

> [!scena] Schermo del DM
> Vista rapida per sessione attiva, scena corrente, PNG, incontri, missioni, clock e appunti live.

## Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

if (!active) {
  dv.paragraph("Nessuna sessione attiva. Apri [[Risorse/Preparazione Sessione]] e rendi pronta una sessione.");
} else {
  dv.paragraph(`Sessione: ${active.file.link} · ${active.data ?? "data non indicata"} · ${active.stato ?? "senza stato"}`);
  gdr.renderTableCockpit(dv);
}
```

## Comandi Rapidi

`BUTTON[preparazione-sessione-risorse-preparazione-sessione]`

`BUTTON[nota-rapida-z-modelli-nota-rapida-md]`

`BUTTON[evento-lore-z-modelli-lore-capture-md]`

`BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`

`BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`

`BUTTON[nuova-dispensa-z-modelli-dispensa-md]`

`BUTTON[party-control-hub-party-control]`

`BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`

`BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`

> [!regia]- Strumenti avanzati
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
>
> `BUTTON[nuovo-luogo-z-modelli-luogo-router-md]`
>
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> `BUTTON[nuova-fazione-z-modelli-fazione-router-md]`
>
> `BUTTON[iniziativa-risorse-iniziativa-e-combattimenti]`
>
> `BUTTON[nuovo-oggetto-z-modelli-oggetto-md]`
>
> `BUTTON[evento-storico-z-modelli-evento-storico-md]`
>
> `BUTTON[stato-mondo-mondi-stato-del-mondo]`
>
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> `BUTTON[tabelle-rapide-risorse-tabelle-tabelle]`

## Scena Corrente

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

if (active) {
  dv.table(
    ["Obiettivo", "Scene", "Segreti rivelabili", "Domande", "Pressioni", "Tracciati"],
    [[active.obiettivo ?? "", active.scene ?? [], active.segreti_rivelabili ?? [], active.domande_al_tavolo ?? [], active.pressioni ?? [], active.tracciati ?? []]]
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
    ["Clock", count(active.tracciati), "Avanzamento visibile"],
    ["Dispense", count(active.dispense), "Materiale da consegnare"],
    ["Oggetti", count(active.oggetti), "Ricompense o leve"],
    ["Appunti", count(active.appunti_live), "Catture da risolvere"]
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
  dv.table(["Missione", "Stato", "Avanzamento", "Pressione", "Committente", "Prossima mossa"], pages.map(p => {
    const value = Number(p.progress_value ?? 0);
    const max = Number(p.progress_max ?? 6);
    return [p.file.link, p.stato ?? "", `${value}/${max}`, p.pressione ?? "", p.committente ?? "", p.prossima_mossa ?? ""];
  }));
}
```

### Clock Della Sessione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const linked = dv.array(active?.tracciati ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

let pages = linked;

if (!pages.length) {
  const sessionMissions = new Set(dv.array(active?.missioni ?? []).map(link => link.path ?? String(link)).array());
  const sessionFactions = new Set(dv.array(active?.fazioni ?? []).map(link => link.path ?? String(link)).array());
  pages = dv.pages('"Mondi/Tracciati"')
    .where(p => !String(p.file.name).startsWith("Prova -") && !["archiviata", "completato", "fallito"].includes(p.stato))
    .where(p => sessionMissions.size === 0 && sessionFactions.size === 0
      || dv.array(p.missioni ?? []).some(link => sessionMissions.has(link.path ?? String(link)))
      || dv.array(p.fazioni ?? []).some(link => sessionFactions.has(link.path ?? String(link))))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(8)
    .array();
}

if (!pages.length) {
  dv.paragraph("Nessun clock collegato alla sessione attiva.");
} else {
  const grid = dv.el("div", "", { cls: "gdr-card-grid compact" });
  grid.innerHTML = pages.map(p => {
    const value = Math.max(0, Number(p.progress_value ?? 0));
    const max = Math.max(1, Number(p.progress_max ?? 6));
    const pct = Math.round((Math.min(value, max) / max) * 100);
    return `
      <div class="gdr-info-card compact">
        <div class="gdr-card-title">${gdr.internalLink(p.file)}</div>
        <div class="gdr-card-meta">${gdr.escapeHtml(p.tipo ?? "clock")} · ${gdr.escapeHtml(p.stato ?? "senza stato")} · pressione ${gdr.escapeHtml(p.pressione ?? 0)}</div>
        <div class="gdr-track-bar"><span style="width: ${pct}%"></span></div>
        <div class="gdr-card-line">${value}/${max} · ${gdr.escapeHtml(p.innesco ?? "innesco non indicato")}</div>
        <div class="gdr-card-line">${gdr.escapeHtml(p.prossima_mossa ?? "prossima mossa non indicata")}</div>
      </div>
    `;
  }).join("");
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

`BUTTON[evento-live-z-modelli-live-evento-md]`

`BUTTON[png-improvvisato-z-modelli-live-png-md]`

`BUTTON[luogo-improvvisato-z-modelli-live-luogo-md]`

`BUTTON[nota-grezza-z-modelli-live-nota-grezza-md]`

`BUTTON[conseguenza-z-modelli-live-conseguenza-md]`

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

const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Fazioni" OR "Mondi/Tracciati"')
  .where(p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata" && Number(p.pressione ?? 0) > 0)
  .where(p => sessionFactions.size === 0 && sessionMissions.size === 0
    || sessionFactions.has(p.file.path)
    || sessionMissions.has(p.file.path)
    || dv.array(p.fazioni ?? []).some(link => sessionFactions.has(link.path ?? String(link)))
    || dv.array(p.missioni ?? []).some(link => sessionMissions.has(link.path ?? String(link)))
    || linkedMissionPages.some(enc => dv.array(enc.fazioni ?? []).some(link => (link.path ?? String(link)) === p.file.path)))
  .sort(p => Number(p.pressione ?? 0), "desc")
  .limit(8);

if (!pages.length) {
  dv.paragraph("Nessuna pressione collegata alla sessione attiva.");
} else {
  dv.table(["Fronte/Fazione/Clock", "Stato", "Avanzamento", "Pressione", "Prossima mossa"], pages.map(p => {
    const progress = p.categoria === "tracciato" ? `${Number(p.progress_value ?? 0)}/${Number(p.progress_max ?? 6)}` : "";
    return [p.file.link, p.stato ?? "", progress, p.pressione ?? "", p.prossima_mossa ?? ""];
  }));
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

dv.table(
  ["Incontro", "Tipo", "Luogo", "Pericolo", "Creature", "Iniziativa"],
  pages.map(p => [p.file.link, p.tipo ?? "", p.luogo ?? "", p.pericolo ?? "", p.creature ?? [], p.encounter_creatures ?? []])
);
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

![[Risorse/Mappe/Demo - Scena Ponte.excalidraw]]

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const active = gdr.activeSession(dv);

const linkKey = value => value?.path ?? String(value ?? "");
const hasAnyLink = (value, keys) => dv.array(value ?? []).array().some(link => keys.has(linkKey(link)));

const sessionMaps = dv.array(active?.mappe ?? []).array();
const places = dv.array(active?.luoghi ?? []);
const placePaths = new Set(places.map(linkKey).array());
const worldKey = linkKey(active?.mondo);
const encounterPages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

const encounterMaps = encounterPages.flatMap(p => dv.array(p.mappe ?? []).array());
const seen = new Set();
let pages = sessionMaps
  .concat(encounterMaps)
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .filter(p => {
    if (seen.has(p.file.path)) return false;
    seen.add(p.file.path);
    return true;
  })
  .array();

if (!pages.length && places.length) {
  pages = dv.pages('"Risorse/Mappe"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.file.name !== "Mappe" && p.stato !== "archiviata")
    .where(p => placePaths.has(linkKey(p.luogo)) || hasAnyLink(p.luoghi, placePaths))
    .sort(p => p.stato === "pronto" ? 0 : 1, "asc")
    .sort(p => p.uso ?? "", "asc")
    .array();
}

if (!pages.length) {
  pages = dv.pages('"Risorse/Mappe"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.file.name !== "Mappe" && p.stato === "pronto")
    .where(p => worldKey && linkKey(p.mondo) === worldKey)
    .sort(p => p.uso ?? "", "asc")
    .array();
}

if (!pages.length) {
  pages = dv.pages('"Risorse/Mappe"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.file.name !== "Mappe" && p.stato === "pronto" && ["zoom", "esagoni", "scena", "dungeon"].includes(p.uso))
    .sort(p => p.file.mtime, "desc")
    .limit(6)
    .array();
}

if (!pages.length) {
  dv.paragraph("Nessuna mappa pronta o collegata alla sessione attiva.");
} else {
  dv.table(["Mappa", "Uso", "Mondo", "Luogo/Luoghi", "Stato"], pages.map(p => [p.file.link, p.uso ?? "", p.mondo ?? "", p.luogo ?? p.luoghi ?? "", p.stato ?? ""]));
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

tab: Post

### Post-Sessione

`BUTTON[bacheca-post-sessione-z-bacheche-post-sessione]`

> [!missione] Conseguenze
> - [ ] Aggiornare missioni
> - [ ] Aggiornare PNG e relazioni
> - [ ] Aggiornare luoghi visitati
> - [ ] Aggiornare clock e progress track
> - [ ] Spostare appunti nelle note giuste

> [!tesoro] Ricompense e promesse
> 
````
