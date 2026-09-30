---
id: dnd.condizione.pietrificato
nome: Pietrificato
attivita:
  # Immunità al veleno = prosa (nel motore non c'è ancora l'immunità).
  - tipo: passivo
    effetti:
      - {bersaglio: azioni, operazione: vieta}
      - {bersaglio: azioni-bonus, operazione: vieta}
      - {bersaglio: reazioni, operazione: vieta}
      - {bersaglio: velocita.camminata, operazione: imposta, valore: 0}
      - {bersaglio: tiri_salvezza.forza, operazione: imposta, valore: fallimento}
      - {bersaglio: tiri_salvezza.destrezza, operazione: imposta, valore: fallimento}
      - {bersaglio: tiri_colpire_subiti, operazione: vantaggio}
      - {bersaglio: resistenza, operazione: concedi, valore: tutti-i-danni}
---
**Trasformazione in Sostanza Inanimata**
La creatura e gli oggetti non magici indossati o trasportati diventano una sostanza solida inanimata;
la creatura smette di invecchiare e il peso è decuplicato.

**Incapacitato**
La creatura ha la condizione Incapacitato.

**Velocità 0**
La Velocità è 0 e non può aumentare.

**Influenza sugli Attacchi**
I tiri per colpire contro la creatura hanno Vantaggio.

**Influenza sui tiri salvezza**
La creatura fallisce automaticamente i tiri salvezza su Forza e Destrezza.

**Resistenza ai Danni**
La creatura è resistente a tutti i danni.

**Immunità ai Veleni**
La creatura è Immune alla condizione Avvelenato.
