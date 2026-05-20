---
icon: user-round
fieldsOrder:
  - nome
  - ruolo
  - stato
  - mondo
  - luogo
  - fazioni
  - relazioni
  - missioni
  - vuole
  - sa
  - leva
  - segreto
  - atteggiamento
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: ruolo
    id: ruolo
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
        "3": ostile
        "4": scomparso
        "5": morto
        "6": archiviata
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: luogo
    id: luogo
    type: File
    options: {}
  - name: fazioni
    id: fazioni
    type: MultiFile
    options: {}
  - name: relazioni
    id: relazioni
    type: MultiFile
    options: {}
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: vuole
    id: vuole
    type: Input
    options: {}
  - name: sa
    id: sa
    type: Input
    options: {}
  - name: leva
    id: leva
    type: Input
    options: {}
  - name: segreto
    id: segreto
    type: Input
    options: {}
  - name: atteggiamento
    id: atteggiamento
    type: Input
    options: {}
---

# FileClass png

Campi principali per PNG giocabili al tavolo.
