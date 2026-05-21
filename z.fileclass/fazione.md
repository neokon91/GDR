---
icon: landmark
fieldsOrder:
  - nome
  - tipo
  - stato
  - canonico
  - mondo
  - leader
  - luoghi
  - personaggi
  - missioni
  - tracciati
  - pressione
  - prossima_mossa
  - scadenza_mondo
  - obiettivo
  - origine
  - tensione
  - dipendenze
  - simboli_visibili
  - costo_sociale
  - evoluzione_se_ignorata
  - obiettivo_nascosto
  - rivali
  - stato_canonico
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
        "4": in guerra
        "5": archiviata
  - name: canonico
    id: canonico
    type: Boolean
    options: {}
  - name: mondo
    id: mondo
    type: File
    options: {}
  - name: leader
    id: leader
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
  - name: obiettivo
    id: obiettivo
    type: Input
    options: {}
  - name: origine
    id: origine
    type: Input
    options: {}
  - name: tensione
    id: tensione
    type: Input
    options: {}
  - name: dipendenze
    id: dipendenze
    type: Multi
    options: {}
  - name: simboli_visibili
    id: simboli_visibili
    type: Multi
    options: {}
  - name: costo_sociale
    id: costo_sociale
    type: Input
    options: {}
  - name: evoluzione_se_ignorata
    id: evoluzione_se_ignorata
    type: Input
    options: {}
  - name: obiettivo_nascosto
    id: obiettivo_nascosto
    type: Input
    options: {}
  - name: rivali
    id: rivali
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

# FileClass fazione

Campi principali per poteri, fronti e pressioni.
