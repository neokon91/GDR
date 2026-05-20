---
icon: route
fieldsOrder:
  - nome
  - stato_rotta
  - mondo
  - partenza
  - arrivo
  - regioni
  - fazioni_controllanti
  - risorse_trasportate
  - mercati
  - rischi
  - pedaggi
  - pressione
  - prossima_mossa
  - conseguenze_se_bloccata
  - propaga_a
  - stato
  - stato_canonico
  - canonico
  - sessioni
  - connessioni
  - player_safe
  - entita_impattate
  - missioni
  - tracciati
fields:
  - name: nome
    id: nome
    type: Input
    options: {}
  - name: stato_rotta
    id: stato_rotta
    type: Select
    options:
      sourceType: ValuesList
      valuesList:
        "0": aperta
        "1": chiusa
        "2": contesa
        "3": maledetta
        "4": interrotta
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: partenza
    id: partenza
    type: File
    options: {}
  - name: arrivo
    id: arrivo
    type: File
    options: {}
  - name: regioni
    id: regioni
    type: MultiFile
    options: {}
  - name: fazioni_controllanti
    id: fazioni_controllanti
    type: MultiFile
    options: {}
  - name: risorse_trasportate
    id: risorse_trasportate
    type: MultiFile
    options: {}
  - name: mercati
    id: mercati
    type: MultiFile
    options: {}
  - name: rischi
    id: rischi
    type: Input
    options: {}
  - name: pedaggi
    id: pedaggi
    type: Input
    options: {}
  - name: pressione
    id: pressione
    type: Number
    options: {}
  - name: prossima_mossa
    id: prossima_mossa
    type: Input
    options: {}
  - name: conseguenze_se_bloccata
    id: conseguenze_se_bloccata
    type: Input
    options: {}
  - name: propaga_a
    id: propaga_a
    type: MultiFile
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
  - name: missioni
    id: missioni
    type: MultiFile
    options: {}
  - name: tracciati
    id: tracciati
    type: MultiFile
    options: {}
---

