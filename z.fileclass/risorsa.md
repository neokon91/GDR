---
icon: gem
fieldsOrder:
  - nome
  - mondo
  - luoghi
  - regioni
  - fazioni_controllanti
  - uso_narrativo
  - scarsita
  - luoghi_dipendenti
  - rotte
  - mercati
  - pressione
  - prossima_mossa
  - stato
  - stato_canonico
  - canonico
  - sessioni
  - connessioni
  - player_safe
  - entita_impattate
  - propaga_a
  - missioni
  - tracciati
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: luoghi
    id: luoghi
    type: MultiFile
    options: {}
  - name: regioni
    id: regioni
    type: MultiFile
    options: {}
  - name: fazioni_controllanti
    id: fazioni_controllanti
    type: MultiFile
    options: {}
  - name: uso_narrativo
    id: uso_narrativo
    type: Input
    options: {}
  - name: scarsita
    id: scarsita
    type: Input
    options: {}
  - name: luoghi_dipendenti
    id: luoghi_dipendenti
    type: MultiFile
    options: {}
  - name: rotte
    id: rotte
    type: MultiFile
    options: {}
  - name: mercati
    id: mercati
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
  - name: stato
    id: stato
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": bozza
        "1": pronto
        "2": in gioco
        "3": archiviata
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
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
---

