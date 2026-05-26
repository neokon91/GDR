---
cssclasses:
  - dashboard
  - gdr-prep-flow
categoria: risorsa
tipo: preparazione
stato: pronto
---

# Preparazione Sessione

Questa pagina serve a trasformare un mondo gia costruito in una sessione live. Se non hai almeno un mondo, un luogo e una pressione/fazione/missione, torna prima al [[Worldbuilder Dashboard]]: una sessione non deve nascere nel vuoto.

## Azioni Rapide

<!-- workflow:quick_actions:start prepara_sessione -->
> [!regia] Azioni rapide
> Preparare una sessione radicata nel mondo.
>
> Plugin coinvolti: `Templater`, `Dataview`, `Tasks`, `Kanban`, `Dice Roller`, `Initiative Tracker`, `Fantasy Statblocks`, `Media Extended`.
>
> **Nuova sessione** - non esiste ancora una nota sessione per il prossimo tavolo
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> **Rendi sessione attiva** - hai scelto quale sessione userai al tavolo
> `BUTTON[rendi-sessione-attiva]`
>
> **Nuova entita viva** - manca un'ancora mondo giocabile
> `BUTTON[wizard-nuova-entita-viva]`
>
> **Collega sessione attiva** - una nota utile non e ancora collegata alla sessione
> `BUTTON[collega-sessione-attiva]`
>
> **Nuova mappa** - serve materiale spaziale pronto al tavolo
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`
>
> **Apri tavolo** - la sessione e pronta o in corso
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> [!regia]- Ancore mondo
> Collegare materiale vivo prima di compilare i cinque blocchi della sessione.
>
> **Worldbuilder** - mancano mondo, luogo, fazione o pressione
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> **Nuova missione** - serve un obiettivo giocabile
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuovo clock** - manca una pressione visibile
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
>
> **Nuova fazione** - serve un potere che reagisce
> `BUTTON[nuova-fazione-z-modelli-fazione-router-md]`
>
> [!regia]- Materiale pronto
> Preparare solo cio che puo arrivare davvero al tavolo.
>
> **Nuovo incontro** - serve una scena meccanica o un combattimento
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`
>
> **Nuova dispensa** - serve materiale da consegnare o leggere
> `BUTTON[nuova-dispensa-z-modelli-dispensa-md]`
>
> **Nuova mappa fronti** - vuoi visualizzare relazioni, pressioni o fronti
> `BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md-2]`
>
> **Nuovo PNG** - serve una persona pronta in scena
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
<!-- workflow:quick_actions:end prepara_sessione -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "prepara_sessione");
```

## Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderActiveSessionBanner(dv);
```

## Sessione Da Rendere Giocabile

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPreparationFocus(dv);
```

## Ancore Mondo Prima Dei Cinque Blocchi

Apri la sessione indicata sopra e collega almeno tre ancore:

- mondo;
- luogo;
- fazione, religione, PNG o altro potere;
- missione o avventura;
- clock, minaccia, fronte o relazione in pressione;
- mappa, scena, incontro o materiale pronto.

Solo dopo compila i cinque campi di gioco.

> [!scena] Blocco 1 - Obiettivo
> Scrivi una frase: cosa devono ottenere, scoprire o decidere i personaggi entro fine sessione.

> [!luogo] Blocco 2 - Prima Scena
> Dove si apre la sessione, chi e presente, cosa sta gia succedendo.

> [!missione] Blocco 3 - Scelta
> Una decisione reale per i giocatori. Se non cambia nulla, non e una scelta.

> [!timer] Blocco 4 - Pressione
> Una missione, fazione, relazione o clock che avanza se il party perde tempo.

> [!handout] Blocco 5 - Materiale
> Almeno una cosa pronta da usare: incontro, mappa, handout, PNG o oggetto.

## Prendi Materiale Senza Cercare

````tabs
tab: Missioni

```dataview
TABLE stato, pressione, prossima_mossa, committente, luoghi, personaggi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso")
SORT pressione DESC, stato ASC, nome ASC
LIMIT 6
```

tab: Pressioni

```dataview
TABLE categoria, tipo, pressione, progress_value, progress_max, prossima_mossa
FROM "Mondi/Relazioni" OR "Mondi/Luoghi" OR "Mondi/Fazioni" OR "Mondi/Tracciati"
WHERE stato != "archiviata" AND (pressione >= 6 OR progress_value >= progress_max - 1)
SORT pressione DESC, progress_value DESC
LIMIT 8
```

tab: PNG

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato != "archiviata"
SORT stato ASC, nome ASC
LIMIT 8
```

tab: Scene

```dataview
TABLE luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE stato = "pronto"
SORT pericolo DESC
LIMIT 8
```

tab: Handout

```dataview
TABLE tipo, luogo, personaggi, pubblico
FROM "Mondi/Dispense"
WHERE stato = "pronto"
SORT pubblico DESC, nome ASC
LIMIT 8
```
````

## Fatto

Quando le ancore mondo e i cinque blocchi sono completi:

1. apri la nota sessione;
2. imposta `stato: pronto`;
3. spegni `attiva` sulle altre sessioni;
4. imposta `attiva: true` solo su questa se e la prossima al tavolo;
5. apri [[Hub/Durante il Gioco]].
