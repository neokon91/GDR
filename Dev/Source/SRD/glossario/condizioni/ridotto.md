---
id: dnd.condizione.ridotto
nome: Ridotto
concessa_da: dnd.incantesimo.ingrandire-ridurre
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: prove.forza, operazione: svantaggio}
      - {bersaglio: tiri_salvezza.forza, operazione: svantaggio}
      - {bersaglio: danni, operazione: somma, valore: {dado: -d4}}
---
Finché dura, il bersaglio è di una taglia più piccola, ha svantaggio alle prove e
ai tiri salvezza su Forza, e i suoi attacchi con armi o senz'armi infliggono 1d4
danni in meno (mai sotto 1: la plancia si ferma a 0, il GM corregge).

La concede [[dnd.incantesimo.ingrandire-ridurre]] (l'effetto Ridurre), e la
pozione di diminuzione.
