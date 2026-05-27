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
> Risultato: scena corrente, decisioni, appunti live, pressioni e materiali usabili senza uscire dal tavolo.

## Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLiveTableNow(dv);
```

## Stato Tavolo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLiveTableReadiness(dv);
```

## Code Live

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLiveTableQueues(dv);
```

## Materiali

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLiveTableMaterials(dv);
```

## Continuita Live

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderM11ContinuityChain(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLiveTableSurfaceLinks(dv);
```

## Azioni

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
