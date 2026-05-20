---
icon: timer
fieldsOrder:
  - nome
  - tipo
  - stato
  - mondo
  - campagne
  - missioni
  - fazioni
  - luoghi
  - personaggi
  - progress_value
  - progress_max
  - pressione
  - innesco
  - posta
  - prossima_mossa
  - conseguenze
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
        "0": clock
        "1": progress track
        "2": fronte
        "3": rituale
        "4": minaccia
        "5": viaggio
        "6": progetto
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": attivo
        "1": in pausa
        "2": completato
        "3": fallito
        "4": archiviata
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: campagne
    id: campagne
    type: MultiFile
    options: {}
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: fazioni
    id: fazioni
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
  - name: innesco
    id: innesco
    type: Input
    options: {}
  - name: posta
    id: posta
    type: Input
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: conseguenze
    id: conseguenze
    type: MultiFile
    options: {}
---

# FileClass tracciato

Campi principali per clock e progress track.
