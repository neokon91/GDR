---
cssclasses:
  - indice
categoria: risorsa
tipo: guida plugin
stato: pronto
plugin:
  - Initiative Tracker
  - Fantasy Statblocks
  - Dice Roller
---

# Iniziativa E Combattimenti

Questa pagina tiene separati gli incontri di combattimento dagli incontri sociali o esplorativi. Initiative Tracker va usato quando la scena deve davvero partire in round, con creature, condizioni e mappa pronta.

<!-- workflow:quick_actions:start iniziativa_combattimenti -->
> [!regia] Azioni rapide
> Preparare combattimenti che possano partire in round senza bloccare la sessione.
>
> **Torna al tavolo** - la scena e pronta o la sessione e in corso
> `BUTTON[durante-il-gioco-durante-il-gioco-3]`
>
> **Nuovo incontro** - serve una scena meccanica o un combattimento pronto
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`
>
> [!regia]- Supporto combattimento
> Preparare materiali collegati prima di entrare in iniziativa.
>
> **Nuova mappa zoom** - il combattimento ha bisogno di spazio navigabile
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`
>
> **Nuovo PNG** - serve un volto o avversario ricorrente
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
>
> **Nuovo oggetto** - la scena include ricompensa, leva o pericolo concreto
> `BUTTON[nuovo-oggetto-z-modelli-oggetto-md]`
>
> **Preparazione sessione** - devi tornare alle ancore della sessione
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
<!-- workflow:quick_actions:end iniziativa_combattimenti -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "iniziativa_combattimenti", { mode: "simple" });
```

## Combattimenti Pronti

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCombatReadiness(dv);
```

## Controllo Initiative Tracker

```dataview
TABLE stato, luogo, creature, encounter_creatures AS iniziativa
FROM "Mondi/Incontri"
WHERE tipo = "combattimento" AND !encounter_creatures
SORT file.name ASC
```

## Regola Operativa

- Gli incontri `combattimento` devono avere `encounter_creatures` e un blocco `encounter`.
- Gli incontri `esplorazione` o `sociale` possono avere creature e pericoli, ma non devono forzare Initiative Tracker.
- I nomi in `encounter_creatures` devono corrispondere al campo `name` dello statblock, per esempio `Lupo`.
- Usa quantita esplicite quando serve: `2: Lupo`, `1d4: Scheletro`, `3: Goblin`.
