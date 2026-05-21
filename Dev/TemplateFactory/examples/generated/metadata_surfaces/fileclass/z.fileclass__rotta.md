---
icon: route
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: rotta
target: z.fileclass/rotta.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- tipo
- stato
- stato_rotta
- mondo
- partenza
- arrivo
- regioni
- luoghi
- fazioni_controllanti
- fazioni
- risorse_trasportate
- risorse
- rischi
- pedaggi
- conseguenze_se_bloccata
- conseguenze
- pressione
- gancio
- uso_al_tavolo
- player_safe
- prossima_mossa
- connessioni
- missioni
- conflitti
- sessioni
- mercati
- mappe
- coordinate
- mappa
- layer_mappa
- tipo_mappa
- propaga_a
- entita_impattate
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
- name: stato_rotta
  id: stato_rotta
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': aperta
      '1': chiusa
      '2': contesa
      '3': maledetta
      '4': interrotta
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
- name: luoghi
  id: luoghi
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
- name: risorse_trasportate
  id: risorse_trasportate
  type: MultiFile
  options: {}
- name: risorse
  id: risorse
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
- name: conseguenze_se_bloccata
  id: conseguenze_se_bloccata
  type: Input
  options: {}
- name: conseguenze
  id: conseguenze
  type: MultiFile
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
- name: mercati
  id: mercati
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
- name: domande_aperte
  id: domande_aperte
  type: Input
  options: {}
---

# FileClass rotta

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
