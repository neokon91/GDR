---
id: dnd.condizione.afferrato
nome: Afferrato
attivita:
  # "Svantaggio agli attacchi verso altri bersagli" è relazionale: resta prosa
  # finché non c'è la posizione. Qui la parte già eseguibile.
  - tipo: passivo
    effetti:
      - {bersaglio: velocita.camminata, operazione: imposta, valore: 0}
---
**Velocità 0**
La velocità della creatura è 0 e non può aumentare.

**Influenza sugli Attacchi**
La creatura ha Svantaggio ai tiri per colpire contro bersagli diversi da chi l'ha afferrata.

**Movibile**
Chi ha afferrato la creatura può trascinarla o spostarla, pagando movimento extra salvo eccezioni di taglia.
