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
  - creature
  - personaggi
  - mappe
  - audio
  - pericolo
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
  - name: creature
    id: creature
    type: MultiFile
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
  - name: pericolo
    id: pericolo
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

