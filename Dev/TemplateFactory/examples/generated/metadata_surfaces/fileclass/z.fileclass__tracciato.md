---
icon: timer
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: tracciato
target: z.fileclass/tracciato.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- tipo
- stato
- mondo
- campagne
- missioni
- fazioni
- luoghi
- personaggi
- sessioni
- progress_value
- progress_max
- pressione
- gancio
- uso_al_tavolo
- player_safe
- posta
- prossima_mossa
- innesco
- connessioni
- evento_scatenante
- esito_parziale
- esito_finale
- entita_impattate
- propaga_a
- mosse
- scelte
- rischi
- indizi
- png_coinvolti
- ricompense
- conseguenze
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
      '0': clock
      '1': progress track
      '2': fronte
      '3': rituale
      '4': minaccia
      '5': viaggio
      '6': progetto
- name: stato
  id: stato
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': attivo
      '1': in pausa
      '2': completato
      '3': fallito
      '4': archiviata
- name: mondo
  id: mondo
  type: File
  options: {}
- name: campagne
  id: campagne
  type: MultiFile
  options: {}
- name: missioni
  id: missioni
  type: MultiFile
  options: {}
- name: fazioni
  id: fazioni
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
- name: posta
  id: posta
  type: Input
  options: {}
- name: prossima_mossa
  id: prossima_mossa
  type: Input
  options: {}
- name: innesco
  id: innesco
  type: Input
  options: {}
- name: connessioni
  id: connessioni
  type: MultiFile
  options: {}
- name: evento_scatenante
  id: evento_scatenante
  type: Input
  options: {}
- name: esito_parziale
  id: esito_parziale
  type: Input
  options: {}
- name: esito_finale
  id: esito_finale
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
- name: mosse
  id: mosse
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
- name: png_coinvolti
  id: png_coinvolti
  type: Input
  options: {}
- name: ricompense
  id: ricompense
  type: Multi
  options: {}
- name: conseguenze
  id: conseguenze
  type: MultiFile
  options: {}
---

# FileClass tracciato

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
