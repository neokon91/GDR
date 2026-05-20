---
icon: map
fieldsOrder:
  - nome
  - tipo
  - uso
  - stato
  - mondo
  - luogo
  - luoghi
  - fazioni
  - missioni
  - layer_mappa
  - tipo_mappa
  - coordinates
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: tipo
    id: tipo
    type: Input
    options: {}
  - name: uso
    id: uso
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": regione
        "1": esagoni
        "2": zoom
        "3": dungeon
        "4": fronte
        "5": relazioni
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": bozza
        "1": pronto
        "2": in gioco
        "3": archiviata
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: luogo
    id: luogo
    type: File
    options: {}
  - name: luoghi
    id: luoghi
    type: MultiFile
    options: {}
  - name: fazioni
    id: fazioni
    type: MultiFile
    options: {}
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: layer_mappa
    id: layer_mappa
    type: Input
    options: {}
  - name: tipo_mappa
    id: tipo_mappa
    type: Input
    options: {}
  - name: coordinates
    id: coordinates
    type: Input
    options: {}
---
