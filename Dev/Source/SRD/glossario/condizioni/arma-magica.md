---
id: dnd.condizione.arma-magica
nome: Arma magica
concessa_da: dnd.incantesimo.arma-magica
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: tiri_colpire, operazione: somma, valore: {piatto: 1}, per_grado: true}
      - {bersaglio: danni, operazione: somma, valore: {piatto: 1}, per_grado: true}
---
L'arma diventa magica e ha un bonus di +1 ai tiri per colpire e ai tiri per i danni.

La concede [[dnd.incantesimo.arma-magica]]. Il bonus vale +1 per GRADO della
condizione: il manuale lo porta a +2 con uno slot di 3º-5º livello e a +3 dal 6º,
e lo `scaling_grado` dell'incantesimo sceglie il grado dallo slot speso (2 dal 3º,
3 dal 6º). Il motore lo esegue.
