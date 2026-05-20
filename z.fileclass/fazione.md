---
icon: landmark
fieldsOrder:
  - nome
  - tipo
  - stato
  - canonico
  - mondo
  - leader
  - luoghi
  - personaggi
  - missioni
  - tracciati
  - pressione
  - prossima_mossa
  - scadenza_mondo
  - obiettivo
  - obiettivo_nascosto
  - rivali
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: tipo
    id: tipo
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
        "4": in guerra
        "5": archiviata
  - name: canonico
    id: canonico
    type: Boolean
    options: {}
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: leader
    id: leader
    type: MultiFile
    options: {}
  - name: luoghi
    id: luoghi
    type: MultiFile
    options: {}
  - name: personaggi
    id: personaggi
    type: MultiFile
    options: {}
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
  - name: pressione
    id: pressione
    type: Number
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: scadenza_mondo
    id: scadenza_mondo
    type: Input
    options: {}
  - name: obiettivo
    id: obiettivo
    type: Input
    options: {}
  - name: obiettivo_nascosto
    id: obiettivo_nascosto
    type: Input
    options: {}
  - name: rivali
    id: rivali
    type: MultiFile
    options: {}
---

# FileClass fazione

Campi principali per poteri, fronti e pressioni.
