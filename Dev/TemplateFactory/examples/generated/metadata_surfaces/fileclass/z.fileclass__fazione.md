---
icon: landmark
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: fazione
target: z.fileclass/fazione.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- tipo
- stato
- canonico
- stato_canonico
- mondo
- leader
- luoghi
- personaggi
- missioni
- obiettivo
- gancio
- uso_al_tavolo
- player_safe
- obiettivo_nascosto
- agenda
- influenza
- pressione
- prossima_mossa
- scadenza_mondo
- progress_value
- progress_max
- innesco
- escalation
- posta
- mosse_visibili
- mosse_segrete
- scelte
- rischi
- indizi
- ricompense
- risorse
- debolezze
- alleati
- rivali
- trattati
- relazioni
- eventi
- propaga_a
- conseguenze
- segreti
- domande_aperte
- connessioni
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
  type: Input
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
      '3': ostile
      '4': in guerra
      '5': archiviata
- name: canonico
  id: canonico
  type: Boolean
  options: {}
- name: stato_canonico
  id: stato_canonico
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': canonico
      '1': rumor
      '2': leggenda
      '3': falso
      '4': retcon
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
- name: obiettivo
  id: obiettivo
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
- name: obiettivo_nascosto
  id: obiettivo_nascosto
  type: Input
  options: {}
- name: agenda
  id: agenda
  type: Multi
  options: {}
- name: influenza
  id: influenza
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
- name: scadenza_mondo
  id: scadenza_mondo
  type: Input
  options: {}
- name: progress_value
  id: progress_value
  type: Number
  options: {}
- name: progress_max
  id: progress_max
  type: Number
  options: {}
- name: innesco
  id: innesco
  type: Input
  options: {}
- name: escalation
  id: escalation
  type: Input
  options: {}
- name: posta
  id: posta
  type: Input
  options: {}
- name: mosse_visibili
  id: mosse_visibili
  type: Input
  options: {}
- name: mosse_segrete
  id: mosse_segrete
  type: Input
  options: {}
- name: scelte
  id: scelte
  type: Input
  options: {}
- name: rischi
  id: rischi
  type: Multi
  options: {}
- name: indizi
  id: indizi
  type: Input
  options: {}
- name: ricompense
  id: ricompense
  type: Multi
  options: {}
- name: risorse
  id: risorse
  type: MultiFile
  options: {}
- name: debolezze
  id: debolezze
  type: Input
  options: {}
- name: alleati
  id: alleati
  type: MultiFile
  options: {}
- name: rivali
  id: rivali
  type: MultiFile
  options: {}
- name: trattati
  id: trattati
  type: Input
  options: {}
- name: relazioni
  id: relazioni
  type: MultiFile
  options: {}
- name: eventi
  id: eventi
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
- name: segreti
  id: segreti
  type: Multi
  options: {}
- name: domande_aperte
  id: domande_aperte
  type: Input
  options: {}
- name: connessioni
  id: connessioni
  type: MultiFile
  options: {}
---

# FileClass fazione

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
