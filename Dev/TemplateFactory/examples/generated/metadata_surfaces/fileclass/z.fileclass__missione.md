---
icon: scroll-text
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: missione
target: z.fileclass/missione.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- tipo
- stato
- mondo
- committente
- luoghi
- personaggi
- fazioni
- tracciati
- ricompense
- sessioni
- progress_value
- progress_max
- pressione
- posta
- scelta
- gancio
- uso_al_tavolo
- player_safe
- prossima_mossa
- domande_aperte
- indizi
- ostacoli
- scene_pronte
- decisioni
- conseguenze
- segreti
- connessioni
- scadenza_mondo
- fc-calendar
- fc-date
- fc-category
- fc-display-name
- fc-end
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
      '0': incarico
      '1': ricerca
      '2': mistero
      '3': salvataggio
      '4': caccia
      '5': viaggio
      '6': fronte
      '7': trama personale
      '8': missione di fazione
- name: stato
  id: stato
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': proposta
      '1': accettata
      '2': in corso
      '3': completata
      '4': fallita
      '5': archiviata
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
- name: ricompense
  id: ricompense
  type: Multi
  options: {}
- name: sessioni
  id: sessioni
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
- name: posta
  id: posta
  type: Input
  options: {}
- name: scelta
  id: scelta
  type: Input
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
- name: prossima_mossa
  id: prossima_mossa
  type: Input
  options: {}
- name: domande_aperte
  id: domande_aperte
  type: Input
  options: {}
- name: indizi
  id: indizi
  type: Input
  options: {}
- name: ostacoli
  id: ostacoli
  type: Input
  options: {}
- name: scene_pronte
  id: scene_pronte
  type: Input
  options: {}
- name: decisioni
  id: decisioni
  type: Input
  options: {}
- name: conseguenze
  id: conseguenze
  type: MultiFile
  options: {}
- name: segreti
  id: segreti
  type: Multi
  options: {}
- name: connessioni
  id: connessioni
  type: MultiFile
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
  options:
    sourceType: ValuesList
    valuesList:
      '0': sessione
      '1': scadenza
      '2': festa
      '3': pericolo
      '4': conseguenza
- name: fc-display-name
  id: fc-display-name
  type: Input
  options: {}
- name: fc-end
  id: fc-end
  type: Input
  options: {}
---

# FileClass missione

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
