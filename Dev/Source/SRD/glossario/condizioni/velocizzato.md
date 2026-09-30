---
id: dnd.condizione.velocizzato
nome: Velocizzato
concessa_da: dnd.incantesimo.velocita
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: ca, operazione: somma, valore: {piatto: 2}}
      - {bersaglio: tiri_salvezza.destrezza, operazione: vantaggio}
      - {bersaglio: velocita.camminata, operazione: moltiplica, valore: 2}
---
Finché dura, il bersaglio ha +2 alla Classe Armatura, vantaggio ai tiri salvezza
su Destrezza, velocità raddoppiata e un'azione aggiuntiva per turno (un solo
attacco, Scatto, Disimpegno, Nascondersi o Utilizzo).

La concede [[dnd.incantesimo.velocita]], che richiede concentrazione: quando
finisce, il bersaglio è incapacitato fino alla fine del suo turno successivo (lo
applica il GM). La pozione di velocità dà lo stesso effetto senza quella
spossatezza. L'azione aggiuntiva e la velocità la plancia non le conta: le tiene il GM.
