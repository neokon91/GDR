---
id: dnd.condizione.stordito
nome: Stordito
attivita:
  - tipo: passivo
    effetti:
      - {bersaglio: azioni, operazione: vieta}
      - {bersaglio: azioni-bonus, operazione: vieta}
      - {bersaglio: reazioni, operazione: vieta}
      - {bersaglio: tiri_salvezza.forza, operazione: imposta, valore: fallimento}
      - {bersaglio: tiri_salvezza.destrezza, operazione: imposta, valore: fallimento}
      - {bersaglio: tiri_colpire_subiti, operazione: vantaggio}
---
**Incapacitato**
La creatura ha la condizione Incapacitato.

**Influenza sui Tiri Salvezza**
La creatura fallisce automaticamente i tiri salvezza su Forza e Destrezza.

**Influenza sugli Attacchi**
I tiri per colpire contro la creatura hanno Vantaggio.
