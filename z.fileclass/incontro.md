---
icon: swords
fieldsOrder:
  - nome
  - tipo
  - stato
  - mondo
  - luogo
  - missioni
  - fazioni
  - sessioni
  - creature
  - encounter_creatures
  - personaggi
  - mappe
  - audio
  - ricompense
  - gancio
  - uso_al_tavolo
  - prossima_mossa
  - entita_impattate
  - propaga_a
  - conseguenze
  - pericolo
  - pressione
  - round
  - condizioni
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: tipo
    id: tipo
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": combattimento
        "1": esplorazione
        "2": pericolo ambientale
        "3": trappola
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": bozza
        "1": pronto
        "2": in gioco
        "3": usato
        "4": archiviata
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: luogo
    id: luogo
    type: File
    options: {}
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: fazioni
    id: fazioni
    type: MultiFile
    options: {}
  - name: sessioni
    id: sessioni
    type: MultiFile
    options: {}
  - name: creature
    id: creature
    type: MultiFile
    options: {}
  - name: encounter_creatures
    id: encounter_creatures
    type: Input
    options: {}
  - name: personaggi
    id: personaggi
    type: MultiFile
    options: {}
  - name: mappe
    id: mappe
    type: MultiFile
    options: {}
  - name: audio
    id: audio
    type: MultiFile
    options: {}
  - name: ricompense
    id: ricompense
    type: MultiFile
    options: {}
  - name: gancio
    id: gancio
    type: Input
    options: {}
  - name: uso_al_tavolo
    id: uso_al_tavolo
    type: Input
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: entita_impattate
    id: entita_impattate
    type: MultiFile
    options: {}
  - name: propaga_a
    id: propaga_a
    type: MultiFile
    options: {}
  - name: conseguenze
    id: conseguenze
    type: MultiFile
    options: {}
  - name: pericolo
    id: pericolo
    type: Number
    options: {}
  - name: pressione
    id: pressione
    type: Number
    options: {}
  - name: round
    id: round
    type: Number
    options: {}
  - name: condizioni
    id: condizioni
    type: Input
    options: {}
---
