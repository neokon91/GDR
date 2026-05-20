---
icon: scroll-text
fieldsOrder:
  - nome
  - tipo
  - stato
  - mondo
  - committente
  - luoghi
  - personaggi
  - fazioni
  - tracciati
  - progress_value
  - progress_max
  - pressione
  - prossima_mossa
  - scadenza_mondo
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
        "0": incarico
        "1": ricerca
        "2": mistero
        "3": salvataggio
        "4": caccia
        "5": viaggio
        "6": fronte
        "7": trama personale
        "8": missione di fazione
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": proposta
        "1": accettata
        "2": in corso
        "3": completata
        "4": fallita
        "5": archiviata
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: committente
    id: committente
    type: File
    options: {}
  - name: luoghi
    id: luoghi
    type: MultiFile
    options: {}
  - name: personaggi
    id: personaggi
    type: MultiFile
    options: {}
  - name: fazioni
    id: fazioni
    type: MultiFile
    options: {}
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
  - name: progress_value
    id: progress_value
    type: Number
    options: {}
  - name: progress_max
    id: progress_max
    type: Number
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
---

# FileClass missione

Campi principali per missioni aperte, pressioni e conseguenze.
