---
id: dnd.condizione.paralizzato
nome: Paralizzato
attivita:
  # "Critico se colpito entro 1,5 m" è posizionale: resta prosa.
  - tipo: passivo
    effetti:
      - {bersaglio: azioni, operazione: vieta}
      - {bersaglio: azioni-bonus, operazione: vieta}
      - {bersaglio: reazioni, operazione: vieta}
      - {bersaglio: velocita.camminata, operazione: imposta, valore: 0}
      - {bersaglio: tiri_salvezza.forza, operazione: imposta, valore: fallimento}
      - {bersaglio: tiri_salvezza.destrezza, operazione: imposta, valore: fallimento}
      - {bersaglio: tiri_colpire_subiti, operazione: vantaggio}
---
**Incapacitato**
La creatura ha la condizione incapacitato.

**Velocità 0**
La velocità è 0 e non può aumentare.

**Influenza sui Tiri Salvezza**
La creatura fallisce automaticamente i TS su Forza e Destrezza.

**Influenza sugli Attacchi**
I tiri per colpire contro la creatura hanno vantaggio.

**Colpi Critici Automatici**
Ogni tiro per colpire che la colpisce è critico se l'attaccante è entro 1,5 metri.
