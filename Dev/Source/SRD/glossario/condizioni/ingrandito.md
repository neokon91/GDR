---
id: dnd.condizione.ingrandito
nome: Ingrandito
concessa_da: dnd.incantesimo.ingrandire-ridurre
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: prove.forza, operazione: vantaggio}
      - {bersaglio: tiri_salvezza.forza, operazione: vantaggio}
      - {bersaglio: danni, operazione: somma, valore: {dado: d4}}
---
Finché dura, il bersaglio è di una taglia più grande, ha vantaggio alle prove e
ai tiri salvezza su Forza, e i suoi attacchi con armi o senz'armi infliggono 1d4
danni extra.

La concede [[dnd.incantesimo.ingrandire-ridurre]] (l'effetto Ingrandire), e la
pozione di crescita.
