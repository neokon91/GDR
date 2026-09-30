---
id: dnd.condizione.privo-di-sensi
nome: Privo di sensi
attivita:
  # Prono e "critico se colpito entro 1,5 m": prosa (concatenamento/posizione).
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
**Inerte**
La creatura ha le condizioni incapacitato e prono e lascia cadere ciò che impugna.

**Velocità 0**
La velocità è 0 e non può aumentare.

**Influenza sugli attacchi**
I tiri per colpire contro la creatura hanno vantaggio.

**Influenza sui tiri salvezza**
La creatura fallisce automaticamente i TS su Forza e Destrezza.

**Colpi critici automatici**
Ogni tiro per colpire che la colpisce è critico se l'attaccante è entro 1,5 metri.

**Ignaro**
La creatura non è consapevole di ciò che la circonda.
