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
  - origine
  - causa
  - tensione
  - costo_sociale
  - evoluzione_se_ignorata
  - posta
  - scelta
  - rischi
  - prossima_mossa
  - scadenza_mondo
  - fc-calendar
  - fc-date
  - fc-category
  - stato_canonico
  - canonico
  - sessioni
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
  - name: origine
    id: origine
    type: Input
    options: {}
  - name: causa
    id: causa
    type: Input
    options: {}
  - name: tensione
    id: tensione
    type: Input
    options: {}
  - name: costo_sociale
    id: costo_sociale
    type: Input
    options: {}
  - name: evoluzione_se_ignorata
    id: evoluzione_se_ignorata
    type: Input
    options: {}
  - name: posta
    id: posta
    type: Input
    options: {}
  - name: scelta
    id: scelta
    type: Input
    options: {}
  - name: rischi
    id: rischi
    type: Multi
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: scadenza_mondo
    id: scadenza_mondo
    type: Input
    options: {}
  - name: fc-calendar
    id: fc-calendar
    type: Input
    options: {}
  - name: fc-date
    id: fc-date
    type: Input
    options: {}
  - name: fc-category
    id: fc-category
    type: Input
    options: {}
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
  - name: sessioni
    id: sessioni
    type: MultiFile
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

# FileClass missione

Campi principali per missioni aperte, pressioni e conseguenze.
