---
icon: book-marked
fieldsOrder:
  - nome
  - tipo
  - mondo
  - culture
  - regioni
  - risorse
  - fazioni
  - missioni
  - eventi_storici
  - uso_narrativo
  - segreti
  - stato
  - stato_canonico
  - canonico
  - pressione
  - prossima_mossa
  - connessioni
  - player_safe
  - entita_impattate
  - propaga_a
  - sessioni
  - luoghi
  - tracciati
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
        "0": materiale
        "1": pianta
        "2": malattia
        "3": moneta
        "4": tecnologia
        "5": cibo
        "6": superstizione
        "7": professione
        "8": creatura regionale
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: culture
    id: culture
    type: MultiFile
    options: {}
  - name: regioni
    id: regioni
    type: MultiFile
    options: {}
  - name: risorse
    id: risorse
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
  - name: eventi_storici
    id: eventi_storici
    type: MultiFile
    options: {}
  - name: uso_narrativo
    id: uso_narrativo
    type: Input
    options: {}
  - name: segreti
    id: segreti
    type: Input
    options: {}
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
  - name: stato_canonico
    id: stato_canonico
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": canonico
        "1": rumor
        "2": leggenda
        "3": falso
        "4": retcon
  - name: canonico
    id: canonico
    type: Boolean
    options: {}
  - name: pressione
    id: pressione
    type: Number
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: connessioni
    id: connessioni
    type: MultiFile
    options: {}
  - name: player_safe
    id: player_safe
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
  - name: sessioni
    id: sessioni
    type: MultiFile
    options: {}
  - name: luoghi
    id: luoghi
    type: MultiFile
    options: {}
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
---

