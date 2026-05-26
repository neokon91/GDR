---
cssclasses:
  - dashboard
  - tavolo
  - gdr-tavolo-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Durante Il Gioco

> [!scena] Schermo del DM
> Risultato: appunti live, decisioni prese, clock aggiornati e materiale usato nella sessione attiva.

## Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const active = gdr.activeSession(dv);
gdr.renderActiveSessionBanner(dv);

if (!active) {
  dv.paragraph("Nessuna sessione attiva. Apri [[Risorse/Preparazione Sessione]] e rendi pronta una sessione.");
} else {
  gdr.renderTableCockpit(dv);
}
```

## Comandi Rapidi

<!-- workflow:quick_actions:start gioca_live -->
> [!regia] Azioni rapide
> Gestire sessione, tiri, incontri, media e appunti live da una schermata.
>
> **Aggiorna scena** - cambia la scena corrente e vuoi tenerla visibile alla sessione
> `BUTTON[aggiorna-scena-z-modelli-dm-aggiorna-scena-corrente-md]`
>
> **Appunto live** - emerge qualcosa ma non sai ancora che tipo di nota sia
> `BUTTON[wizard-appunto-live]`
>
> **Collega appunto** - hai gia scritto un appunto Inbox e va agganciato alla sessione attiva
> `BUTTON[collega-appunto-z-modelli-dm-collega-appunto-live-md]`
>
> **Aggiungi decisione live** - vuoi registrare una decisione senza ancora propagare tutto il mondo
> `BUTTON[aggiungi-decisione-z-modelli-dm-aggiungi-decisione-live-md]`
>
> **Conseguenza** - una scelta cambia missioni, PNG, luoghi, fazioni o clock
> `BUTTON[wizard-conseguenza]`
>
> **Registra scelta mondo** - vuoi trasformare una decisione in continuita tracciabile
> `BUTTON[registra-scelta-mondo]`
>
> **Avanza clock** - il tempo passa o una pressione peggiora
> `BUTTON[avanza-clock]`
>
> **Chiudi sessione** - il tavolo finisce
> `BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`
>
> [!regia]- Cattura live
> Creare note grezze durante il tavolo senza decidere subito la struttura definitiva.
>
> **Evento live** - succede qualcosa che potrebbe diventare canone
> `BUTTON[evento-live-z-modelli-live-evento-md]`
>
> **PNG improvvisato** - compare una persona non preparata
> `BUTTON[png-improvvisato-z-modelli-live-png-md]`
>
> **Luogo improvvisato** - il party entra in un posto non preparato
> `BUTTON[luogo-improvvisato-z-modelli-live-luogo-md]`
>
> **Nota grezza** - devi catturare velocemente senza tassonomia
> `BUTTON[nota-grezza-z-modelli-live-nota-grezza-md]`
>
> **Conseguenza live** - una scelta produce un effetto da risolvere dopo
> `BUTTON[conseguenza-z-modelli-live-conseguenza-md]`
>
> [!regia]- Supporto al tavolo
> Aprire strumenti che servono durante la sessione senza cercarli nel vault.
>
> **Preparazione** - devi tornare alle ancore della sessione
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Nuovo incontro** - serve una scena meccanica o un combattimento
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`
>
> **Party control** - devi controllare PG, risorse e stato del party
> `BUTTON[party-control-hub-party-control]`
>
> **Vista giocatori** - devi verificare cosa e mostrabile
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> [!regia]- Strumenti avanzati
> Creare o aprire materiale strutturato solo quando il tavolo lo richiede.
>
> **Nuovo PNG** - un PNG improvvisato diventa ricorrente
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
>
> **Nuovo luogo** - un luogo diventa rilevante per il mondo
> `BUTTON[nuovo-luogo-z-modelli-luogo-router-md]`
>
> **Nuova missione** - emerge un obiettivo giocabile
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuova fazione** - emerge un potere organizzato
> `BUTTON[nuova-fazione-z-modelli-fazione-router-md]`
>
> **Iniziativa** - inizia un combattimento o una scena a turni
> `BUTTON[iniziativa-risorse-iniziativa-e-combattimenti]`
>
> **Nuovo oggetto** - serve una ricompensa o leva concreta
> `BUTTON[nuovo-oggetto-z-modelli-oggetto-md]`
>
> **Evento storico** - la sessione cambia la timeline
> `BUTTON[evento-storico-z-modelli-evento-storico-md]`
>
> **Stato mondo** - vuoi vedere pressioni e conseguenze aperte
> `BUTTON[stato-mondo-mondi-stato-del-mondo]`
>
> **Controllo vault** - qualcosa non torna nei controlli o nelle viste
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> **Tabelle rapide** - ti serve improvvisazione controllata
> `BUTTON[tabelle-rapide-risorse-tabelle-tabelle]`
<!-- workflow:quick_actions:end gioca_live -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "gioca_live", { mode: "simple" });
```

## Cockpit Unico

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLiveCommandCenter(dv);
gdr.renderM11ContinuityChain(dv);
```

## Quadro Di Regia

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const active = gdr.activeSession(dv);

if (!active) {
  dv.paragraph("Nessun contesto mondo disponibile senza sessione attiva.");
} else {
  dv.table(
    ["Mondo", "Campagne", "Fazioni", "Luoghi chiave"],
    [[active.mondo ?? "", active.campagne ?? [], active.fazioni ?? [], active.luoghi ?? []]]
  );
}
gdr.renderSessionLoreCards(dv);
gdr.renderSessionMissionCards(dv);
gdr.renderSessionClockCards(dv);
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
WHERE stato != "archiviata" AND stato != "ignorata"
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const active = gdr.activeSession(dv);

const sessionFactions = new Set(dv.array(active?.fazioni ?? []).map(link => link.path ?? String(link)).array());
const sessionMissions = new Set(dv.array(active?.missioni ?? []).map(link => link.path ?? String(link)).array());
const linkedMissionPages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Fazioni" OR "Mondi/Tracciati"')
  .where(p => p.stato !== "archiviata" && Number(p.pressione ?? 0) > 0)
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const active = gdr.activeSession(dv);

const linked = dv.array(active?.personaggi ?? []);
let pages = linked
  .map(link => dv.page(link.path ?? link))
  .where(p => p && p.tipo === "png")
  .array();

if (!pages.length) {
  pages = dv.pages('"Mondi/Personaggi"')
    .where(p => p.tipo === "png" && p.stato === "in gioco")
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
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const active = gdr.activeSession(dv);

let pages = dv.array(active?.incontri ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!pages.length) {
  pages = dv.pages('"Mondi/Incontri"')
    .where(p => ["pronto", "in gioco"].includes(p.stato))
    .sort(p => p.pericolo ?? 0, "desc")
    .array();
}

dv.table(
  ["Incontro", "Tipo", "Luogo", "Pericolo", "Creature", "Iniziativa"],
  pages.map(p => [p.file.link, p.tipo ?? "", p.luogo ?? "", p.pericolo ?? "", p.creature ?? [], p.encounter_creatures ?? []])
);

dv.header(4, "Creature");

const creaturePages = dv.array(active?.creature ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!creaturePages.length) {
  dv.paragraph("Nessuna creatura collegata alla sessione attiva.");
} else {
  dv.table(["Creatura", "Tipo", "Taglia", "GS"], creaturePages.map(p => [p.file.link, p.type ?? p.tipo ?? "", p.size ?? "", p.cr ?? ""]));
}

dv.header(4, "Oggetti Da Assegnare");

let oggettiPages = dv.array(active?.oggetti ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!oggettiPages.length) {
  oggettiPages = dv.pages('"Mondi/Oggetti"')
    .where(p => !p.proprietario && p.stato !== "archiviata")
    .sort(p => p.rarita ?? "", "asc")
    .array();
}

dv.table(["Oggetto", "Tipo", "Rarita", "Luogo", "Proprietario"], oggettiPages.map(p => [p.file.link, p.tipo ?? "", p.rarita ?? "", p.luogo ?? "", p.proprietario ?? ""]));

dv.header(4, "Dispense Di Scena");

let dispensePages = dv.array(active?.dispense ?? [])
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!dispensePages.length) {
  dispensePages = dv.pages('"Mondi/Dispense"')
    .where(p => p.stato === "pronto")
    .sort(p => p.nome ?? p.file.name, "asc")
    .array();
}

dv.table(["Dispensa", "Tipo", "Luogo", "Personaggi"], dispensePages.map(p => [p.file.link, p.tipo ?? "", p.luogo ?? "", p.personaggi ?? []]));

dv.header(4, "Mappe");

gdr.renderSessionMapCards(dv);

dv.header(4, "Musica e Risorse");

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

let mediaPages = dv.array(mediaLinks)
  .map(link => dv.page(link.path ?? link))
  .where(Boolean)
  .array();

if (!mediaPages.length) {
  mediaPages = dv.pages('"Risorse/Audio" OR "Risorse/Video" OR "Risorse/Immagini" OR "Risorse/Dispense"')
    .where(p => p.file.name !== "Audio" && p.file.name !== "Video" && p.file.name !== "Immagini" && p.file.name !== "Dispense" && p.stato === "pronto")
    .sort(p => p.uso ?? "", "asc")
    .array();
}

if (!mediaPages.length) {
  dv.paragraph("Nessun media pronto o collegato alla sessione attiva.");
} else {
  dv.table(["Risorsa", "Uso", "Tono", "Campagna", "Stato"], mediaPages.map(p => [p.file.link, p.uso ?? "", p.tono ?? "", p.campagna ?? "", p.stato ?? ""]));
}
```

tab: Post

### Post-Sessione

> [!missione] Conseguenze
> - [ ] Aggiornare missioni
> - [ ] Aggiornare PNG e relazioni
> - [ ] Aggiornare luoghi visitati
> - [ ] Aggiornare clock e progress track
> - [ ] Spostare appunti nelle note giuste

> [!tesoro] Ricompense e promesse
> 
````
