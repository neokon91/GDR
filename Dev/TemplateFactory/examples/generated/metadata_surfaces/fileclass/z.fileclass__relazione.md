---
icon: network
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: relazione
target: z.fileclass/relazione.md
fieldsOrder:
- id
- nome
- categoria
- tipo
- stato
- canonico
- stato_canonico
- mondo
- soggetti
- origine
- posta
- gancio
- uso_al_tavolo
- player_safe
- connessioni
- origine_storica
- versioni_contrapposte
- simboli_riti_trattati
- dipendenze_materiali
- ferite_aperte
- intensita
- pressione
- stabilita
- prossima_mossa
- innesco
- eventi
- trattati
- conseguenze
- entita_impattate
- propaga_a
- scelte
- rischi
- indizi
- segreti
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
- name: tipo
  id: tipo
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': relazione
      '1': alleanza
      '2': rivalità
      '3': guerra fredda
      '4': vassallaggio
      '5': trattato
      '6': debito
      '7': faida
      '8': patto religioso
      '9': tradimento
- name: stato
  id: stato
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '0': bozza
      '1': pronto
      '2': in gioco
      '3': in guerra
      '4': archiviata
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
- name: soggetti
  id: soggetti
  type: MultiFile
  options: {}
- name: origine
  id: origine
  type: Input
  options: {}
- name: posta
  id: posta
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
- name: connessioni
  id: connessioni
  type: MultiFile
  options: {}
- name: origine_storica
  id: origine_storica
  type: Input
  options: {}
- name: versioni_contrapposte
  id: versioni_contrapposte
  type: Input
  options: {}
- name: simboli_riti_trattati
  id: simboli_riti_trattati
  type: Input
  options: {}
- name: dipendenze_materiali
  id: dipendenze_materiali
  type: Input
  options: {}
- name: ferite_aperte
  id: ferite_aperte
  type: Input
  options: {}
- name: intensita
  id: intensita
  type: Number
  options: {}
- name: pressione
  id: pressione
  type: Number
  options: {}
- name: stabilita
  id: stabilita
  type: Number
  options: {}
- name: prossima_mossa
  id: prossima_mossa
  type: Input
  options: {}
- name: innesco
  id: innesco
  type: Input
  options: {}
- name: eventi
  id: eventi
  type: MultiFile
  options: {}
- name: trattati
  id: trattati
  type: Input
  options: {}
- name: conseguenze
  id: conseguenze
  type: MultiFile
  options: {}
- name: entita_impattate
  id: entita_impattate
  type: MultiFile
  options: {}
- name: propaga_a
  id: propaga_a
  type: MultiFile
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
- name: segreti
  id: segreti
  type: Multi
  options: {}
---

# FileClass relazione

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
