---
id: dnd.condizione.speranzoso
nome: Speranzoso
concessa_da: dnd.incantesimo.faro-di-speranza
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: tiri_salvezza.saggezza, operazione: vantaggio}
      - {bersaglio: tiri_salvezza.morte, operazione: vantaggio}
      - {bersaglio: cure, operazione: massimizza}
---
Finché dura, il bersaglio dispone di vantaggio ai tiri salvezza su Saggezza e ai
tiri salvezza contro morte, e recupera il numero massimo di punti ferita possibile
da qualsiasi guarigione.

La concede [[dnd.incantesimo.faro-di-speranza]], che richiede concentrazione: se
l'incantatore la perde, la condizione cade con lei.
