---
icon: calendar-days
fieldsOrder:
  - nome
  - tipo
  - data
  - data_mondo
  - stato
  - attiva
  - mondo
  - campagne
  - luoghi
  - personaggi
  - missioni
  - tracciati
  - incontri
  - pressione
  - prossima_mossa
  - connessioni
  - player_safe
  - entita_impattate
  - propaga_a
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
        "0": sessione di campagna
        "1": sessione zero
        "2": interludio
        "3": downtime
        "4": finale
        "5": one-shot
  - name: data
    id: data
    type: Date
    options: {}
  - name: data_mondo
    id: data_mondo
    type: Input
    options: {}
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": preparazione
        "1": pronto
        "2": in corso
        "3": giocata
        "4": archiviata
  - name: attiva
    id: attiva
    type: Boolean
    options: {}
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: campagne
    id: campagne
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
  - name: incontri
    id: incontri
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
---

# FileClass sessione

Campi principali per preparazione, gioco e resoconto sessione.
