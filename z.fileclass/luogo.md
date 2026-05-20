---
icon: map-pin
fieldsOrder:
  - nome
  - famiglia_luogo
  - tipo
  - stato
  - canonico
  - mondo
  - luogo_padre
  - governante
  - fazioni
  - personaggi
  - missioni
  - stabilita
  - pericolo
  - pressione
  - impressione
  - tensione
  - stato_canonico
  - sessioni
  - connessioni
  - player_safe
  - entita_impattate
  - propaga_a
  - tracciati
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: famiglia_luogo
    id: famiglia_luogo
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
        "3": minacciato
        "4": archiviata
  - name: canonico
    id: canonico
    type: Boolean
    options: {}
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: luogo_padre
    id: luogo_padre
    type: File
    options: {}
  - name: governante
    id: governante
    type: File
    options: {}
  - name: fazioni
    id: fazioni
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
  - name: stabilita
    id: stabilita
    type: Number
    options: {}
  - name: pericolo
    id: pericolo
    type: Number
    options: {}
  - name: pressione
    id: pressione
    type: Number
    options: {}
  - name: impressione
    id: impressione
    type: Input
    options: {}
  - name: tensione
    id: tensione
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
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
---

# FileClass luogo

Campi principali per luoghi giocabili e collegati.
