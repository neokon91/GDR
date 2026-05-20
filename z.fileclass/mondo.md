---
icon: globe-2
fieldsOrder:
  - nome
  - stato
  - canonico
  - tono
  - tema
  - genere
  - scala
  - magia
  - calendario
  - premessa
  - conflitto_centrale
  - vincoli
  - non_vogliamo
  - luoghi_iconici
  - fazioni_principali
  - culture_fondative
  - misteri_pubblici
  - prossime_entita_consigliate
  - materiale_pubblico
  - campagne
  - relazioni_chiave
fields:
  - name: nome
    id: nome
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
  - name: canonico
    id: canonico
    type: Boolean
    options: {}
  - name: tono
    id: tono
    type: Input
    options: {}
  - name: tema
    id: tema
    type: Input
    options: {}
  - name: genere
    id: genere
    type: Input
    options: {}
  - name: scala
    id: scala
    type: Input
    options: {}
  - name: magia
    id: magia
    type: Input
    options: {}
  - name: calendario
    id: calendario
    type: Input
    options: {}
  - name: premessa
    id: premessa
    type: Input
    options: {}
  - name: conflitto_centrale
    id: conflitto_centrale
    type: Input
    options: {}
  - name: vincoli
    id: vincoli
    type: Input
    options: {}
  - name: non_vogliamo
    id: non_vogliamo
    type: Multi
    options: {}
  - name: luoghi_iconici
    id: luoghi_iconici
    type: MultiFile
    options: {}
  - name: fazioni_principali
    id: fazioni_principali
    type: MultiFile
    options: {}
  - name: culture_fondative
    id: culture_fondative
    type: MultiFile
    options: {}
  - name: misteri_pubblici
    id: misteri_pubblici
    type: Multi
    options: {}
  - name: prossime_entita_consigliate
    id: prossime_entita_consigliate
    type: Multi
    options: {}
  - name: materiale_pubblico
    id: materiale_pubblico
    type: MultiFile
    options: {}
  - name: campagne
    id: campagne
    type: MultiFile
    options: {}
  - name: relazioni_chiave
    id: relazioni_chiave
    type: MultiFile
    options: {}
---

# FileClass mondo

Campi principali per creare un mondo homebrew giocabile senza modificare YAML a mano.
