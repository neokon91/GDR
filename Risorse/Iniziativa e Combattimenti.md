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

`BUTTON[durante-il-gioco-durante-il-gioco-3]`

`BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`

## Combattimenti Pronti

```dataview
TABLE luogo, pericolo, creature, encounter_creatures AS iniziativa, mappe, condizioni
FROM "Mondi/Incontri"
WHERE tipo = "combattimento" AND contains(list("pronto", "in gioco"), stato)
SORT pericolo DESC, file.name ASC
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
