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
  - origine
  - causa
  - tensione
  - costo_sociale
  - evoluzione_se_ignorata
  - innesco
  - posta
  - prossima_mossa
  - conseguenze
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

# FileClass tracciato

Campi principali per clock e progress track.
