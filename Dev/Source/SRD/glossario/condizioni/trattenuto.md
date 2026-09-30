---
id: dnd.condizione.trattenuto
nome: Trattenuto
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: velocita.camminata, operazione: imposta, valore: 0}
      - {bersaglio: tiri_colpire, operazione: svantaggio}
      - {bersaglio: tiri_colpire_subiti, operazione: vantaggio}
      - {bersaglio: tiri_salvezza.destrezza, operazione: svantaggio}
---
## Velocità 0
La velocità è 0 e non può aumentare.

## Influenza sugli Attacchi
I tiri per colpire contro la creatura hanno Vantaggio, mentre i suoi tiri per colpire hanno Svantaggio.

## Influenza sui Tiri Salvezza
La creatura ha Svantaggio nei tiri salvezza su Destrezza.
