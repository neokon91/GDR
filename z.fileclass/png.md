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
  - stato_canonico
  - canonico
  - pressione
  - prossima_mossa
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

# FileClass png

Campi principali per PNG giocabili al tavolo.
