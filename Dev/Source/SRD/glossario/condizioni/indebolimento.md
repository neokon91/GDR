---
id: dnd.condizione.indebolimento
nome: Indebolimento
# A LIVELLI cumulativi: il valore si moltiplica per il GRADO (1–6) con `per_grado`.
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: d20, operazione: somma, valore: -2, per_grado: true}
      - {bersaglio: velocita.camminata, operazione: somma, valore: -1.5, per_grado: true}
---
**Livelli di Indebolimento**
Ogni volta che ricevi questa condizione ottieni 1 livello. A 6 livelli muori.

**Influenza sulle Prove con D20**
Quando effettui una prova con d20, il risultato è ridotto del doppio del tuo livello di indebolimento.

**Velocità Ridotta**
La Velocità è ridotta di 1,5 metri per livello di Indebolimento.

**Rimozione dei Livelli**
Terminando un riposo lungo perdi 1 livello di Indebolimento. A livello 0 la condizione termina.
