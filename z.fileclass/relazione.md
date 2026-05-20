---
icon: network
fieldsOrder:
  - nome
  - tipo
  - stato
  - mondo
  - soggetti
  - intensita
  - pressione
  - origine
  - posta
  - prossima_mossa
  - innesco
  - eventi
  - conseguenze
  - entita_impattate
  - propaga_a
  - canonico
  - sessioni
  - connessioni
  - player_safe
  - luoghi
  - fazioni
  - missioni
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
        "0": relazione
        "1": alleanza
        "2": rivalità
        "3": guerra fredda
        "4": vassallaggio
        "5": trattato
        "6": debito
        "7": faida
        "8": patto religioso
        "9": tradimento
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": bozza
        "1": pronto
        "2": in gioco
        "3": in guerra
        "4": archiviata
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: soggetti
    id: soggetti
    type: MultiFile
    options: {}
  - name: intensita
    id: intensita
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
  - name: posta
    id: posta
    type: Input
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: innesco
    id: innesco
    type: Input
    options: {}
  - name: eventi
    id: eventi
    type: MultiFile
    options: {}
  - name: conseguenze
    id: conseguenze
    type: MultiFile
    options: {}
  - name: entita_impattate
    id: entita_impattate
    type: MultiFile
    options: {}
  - name: propaga_a
    id: propaga_a
    type: MultiFile
    options: {}
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
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
---

# FileClass relazione

Campi principali per alleanze, rivalità, trattati, debiti, faide e vassallaggi.
