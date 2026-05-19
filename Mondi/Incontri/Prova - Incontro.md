---
id: prova-incontro
nome: "Prova - Incontro"
categoria: incontro
tipo: combattimento
stato: archiviata
mondo: [[Prova - Mondo]]
luogo: [[Prova - Dungeon]]
creature:
  - [[Prova - Creatura]]
personaggi:
  - [[Prova - PG]]
  - [[Prova - PNG]]
pericolo: 5
ricompense:
  - [[Prova - Oggetto]]
round: 1
condizioni:
  - accecato fino al round 2
encounter_creatures:
  - "Prova - Creatura"
---

# Prova - Incontro

> [!incontro] Setup
> Incontro di prova per creature, PNG e ricompense.

> [!regola] Tiri rapidi
> - Iniziativa: `dice: 1d20`

## Initiative Tracker

```encounter
name: Prova - Incontro
players: true
creatures:
  - Prova - Creatura
```
