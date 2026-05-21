---
icon: swords
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: incontro
target: z.fileclass/incontro.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- tipo
- stato
- mondo
- luogo
- missioni
- fazioni
- creature
- personaggi
- mappe
- audio
- sessioni
- pericolo
- ricompense
- gancio
- uso_al_tavolo
- player_safe
- pressione
- prossima_mossa
- round
- condizioni
- encounter_creatures
- entita_impattate
- propaga_a
- conseguenze
- fonti
- riferimenti_srd
- riferimenti_regola
- sezioni_collegate
- blocchi_collegati
- tabelle_collegate
- tags
fields:
- name: id
  id: id
  type: Input
  options: {}
- name: nome
  id: nome
  type: Input
  options: {}
- name: categoria
  id: categoria
  type: Select
  options: {}
- name: fileClass
  id: fileClass
  type: Input
  options: {}
- name: tipo
  id: tipo
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': combattimento
      '1': esplorazione
      '2': pericolo ambientale
      '3': trappola
- name: stato
  id: stato
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': bozza
      '1': pronto
      '2': in gioco
      '3': usato
      '4': archiviata
- name: mondo
  id: mondo
  type: File
  options: {}
- name: luogo
  id: luogo
  type: File
  options: {}
- name: missioni
  id: missioni
  type: MultiFile
  options: {}
- name: fazioni
  id: fazioni
  type: MultiFile
  options: {}
- name: creature
  id: creature
  type: MultiFile
  options: {}
- name: personaggi
  id: personaggi
  type: MultiFile
  options: {}
- name: mappe
  id: mappe
  type: MultiFile
  options: {}
- name: audio
  id: audio
  type: MultiFile
  options: {}
- name: sessioni
  id: sessioni
  type: MultiFile
  options: {}
- name: pericolo
  id: pericolo
  type: Number
  options: {}
- name: ricompense
  id: ricompense
  type: MultiFile
  options: {}
- name: gancio
  id: gancio
  type: Input
  options: {}
- name: uso_al_tavolo
  id: uso_al_tavolo
  type: Input
  options: {}
- name: player_safe
  id: player_safe
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
- name: round
  id: round
  type: Number
  options: {}
- name: condizioni
  id: condizioni
  type: Input
  options: {}
- name: encounter_creatures
  id: encounter_creatures
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
- name: conseguenze
  id: conseguenze
  type: MultiFile
  options: {}
- name: fonti
  id: fonti
  type: MultiFile
  options: {}
- name: riferimenti_srd
  id: riferimenti_srd
  type: MultiFile
  options: {}
- name: riferimenti_regola
  id: riferimenti_regola
  type: MultiFile
  options: {}
- name: sezioni_collegate
  id: sezioni_collegate
  type: MultiFile
  options: {}
- name: blocchi_collegati
  id: blocchi_collegati
  type: MultiFile
  options: {}
- name: tabelle_collegate
  id: tabelle_collegate
  type: MultiFile
  options: {}
- name: tags
  id: tags
  type: Multi
  options: {}
---

# FileClass incontro

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
