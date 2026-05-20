---
icon: film
fieldsOrder:
  - nome
  - tipo
  - stato
  - uso
  - tono
  - campagna
  - scena
  - timestamp
  - file
  - url
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
        "0": audio
        "1": video
        "2": immagine
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": bozza
        "1": pronto
        "2": usato
        "3": archiviata
  - name: uso
    id: uso
    type: Input
    options: {}
  - name: tono
    id: tono
    type: Input
    options: {}
  - name: campagna
    id: campagna
    type: File
    options: {}
  - name: scena
    id: scena
    type: Input
    options: {}
  - name: timestamp
    id: timestamp
    type: Input
    options: {}
  - name: file
    id: file
    type: Input
    options: {}
  - name: url
    id: url
    type: Input
    options: {}
---

