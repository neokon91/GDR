---
id: dnd.condizione.benedetto
nome: Benedetto
concessa_da: dnd.incantesimo.benedizione
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: tiri_colpire, operazione: somma, valore: {dado: d4}}
      - {bersaglio: tiri_salvezza, operazione: somma, valore: {dado: d4}}
---
Finché dura, il bersaglio aggiunge 1d4 ai propri tiri per colpire e tiri salvezza.

La concede [[dnd.incantesimo.benedizione]], che richiede concentrazione: se
l'incantatore la perde, la condizione cade con lei.
