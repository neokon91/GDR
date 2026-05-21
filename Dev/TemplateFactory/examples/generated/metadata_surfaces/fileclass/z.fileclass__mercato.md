---
icon: store
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: mercato
target: z.fileclass/mercato.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- tipo
- stato
- mondo
- luogo
- luoghi
- regioni
- fazioni_controllanti
- fazioni
- risorse
- rotte
- pedaggi
- rischi
- dipendenze
- pressione
- gancio
- uso_al_tavolo
- player_safe
- prossima_mossa
- connessioni
- missioni
- conflitti
- sessioni
- mappe
- coordinate
- mappa
- layer_mappa
- tipo_mappa
- propaga_a
- entita_impattate
- conseguenze
- domande_aperte
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
  options: {}
- name: stato
  id: stato
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': bozza
      '1': pronto
      '2': in gioco
      '3': archiviata
- name: mondo
  id: mondo
  type: File
  options: {}
- name: luogo
  id: luogo
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
- name: fazioni
  id: fazioni
  type: MultiFile
  options: {}
- name: risorse
  id: risorse
  type: MultiFile
  options: {}
- name: rotte
  id: rotte
  type: MultiFile
  options: {}
- name: pedaggi
  id: pedaggi
  type: Input
  options: {}
- name: rischi
  id: rischi
  type: Input
  options: {}
- name: dipendenze
  id: dipendenze
  type: Multi
  options: {}
- name: pressione
  id: pressione
  type: Number
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
- name: connessioni
  id: connessioni
  type: MultiFile
  options: {}
- name: missioni
  id: missioni
  type: MultiFile
  options: {}
- name: conflitti
  id: conflitti
  type: Input
  options: {}
- name: sessioni
  id: sessioni
  type: MultiFile
  options: {}
- name: mappe
  id: mappe
  type: MultiFile
  options: {}
- name: coordinate
  id: coordinate
  type: Input
  options: {}
- name: mappa
  id: mappa
  type: Input
  options: {}
- name: layer_mappa
  id: layer_mappa
  type: Input
  options: {}
- name: tipo_mappa
  id: tipo_mappa
  type: Input
  options: {}
- name: propaga_a
  id: propaga_a
  type: MultiFile
  options: {}
- name: entita_impattate
  id: entita_impattate
  type: MultiFile
  options: {}
- name: conseguenze
  id: conseguenze
  type: MultiFile
  options: {}
- name: domande_aperte
  id: domande_aperte
  type: Input
  options: {}
---

# FileClass mercato

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
