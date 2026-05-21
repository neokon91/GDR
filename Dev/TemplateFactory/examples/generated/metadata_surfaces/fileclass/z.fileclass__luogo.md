---
icon: map-pin
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: luogo
target: z.fileclass/luogo.md
fieldsOrder:
- id
- nome
- categoria
- fileClass
- famiglia_luogo
- tipo
- sottotipo
- tipologia
- bioma
- stato
- canonico
- stato_canonico
- mondo
- luogo_padre
- governante
- popolazione
- stabilita
- pericolo
- pressione
- legittimita
- capitale
- impressione
- gancio
- uso_al_tavolo
- player_safe
- funzione_narrativa
- tensione
- promessa_al_tavolo
- confini
- vassalli
- alleati
- rivali
- relazioni
- culture
- risorse_strategiche
- eserciti
- crisi_interne
- scelte
- rischi
- ricompense
- hp_massimi
- hp_attuali
- fazioni
- religioni
- personaggi
- missioni
- sessioni
- risorse
- problemi
- conseguenze
- segreti
- indizi
- voci
- scene
- prossima_mossa
- domande_aperte
- connessioni
- collegamenti_mancanti
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
- name: famiglia_luogo
  id: famiglia_luogo
  type: Input
  options: {}
- name: tipo
  id: tipo
  type: Input
  options: {}
- name: sottotipo
  id: sottotipo
  type: Input
  options: {}
- name: tipologia
  id: tipologia
  type: Input
  options: {}
- name: bioma
  id: bioma
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
      '3': minacciato
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
- name: luogo_padre
  id: luogo_padre
  type: File
  options: {}
- name: governante
  id: governante
  type: File
  options: {}
- name: popolazione
  id: popolazione
  type: Input
  options: {}
- name: stabilita
  id: stabilita
  type: Number
  options: {}
- name: pericolo
  id: pericolo
  type: Number
  options: {}
- name: pressione
  id: pressione
  type: Number
  options: {}
- name: legittimita
  id: legittimita
  type: Input
  options: {}
- name: capitale
  id: capitale
  type: Input
  options: {}
- name: impressione
  id: impressione
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
- name: funzione_narrativa
  id: funzione_narrativa
  type: Input
  options: {}
- name: tensione
  id: tensione
  type: Input
  options: {}
- name: promessa_al_tavolo
  id: promessa_al_tavolo
  type: Input
  options: {}
- name: confini
  id: confini
  type: Input
  options: {}
- name: vassalli
  id: vassalli
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
- name: relazioni
  id: relazioni
  type: MultiFile
  options: {}
- name: culture
  id: culture
  type: MultiFile
  options: {}
- name: risorse_strategiche
  id: risorse_strategiche
  type: Input
  options: {}
- name: eserciti
  id: eserciti
  type: Input
  options: {}
- name: crisi_interne
  id: crisi_interne
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
- name: ricompense
  id: ricompense
  type: Multi
  options: {}
- name: hp_massimi
  id: hp_massimi
  type: Input
  options: {}
- name: hp_attuali
  id: hp_attuali
  type: Input
  options: {}
- name: fazioni
  id: fazioni
  type: MultiFile
  options: {}
- name: religioni
  id: religioni
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
- name: sessioni
  id: sessioni
  type: MultiFile
  options: {}
- name: risorse
  id: risorse
  type: MultiFile
  options: {}
- name: problemi
  id: problemi
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
- name: indizi
  id: indizi
  type: Input
  options: {}
- name: voci
  id: voci
  type: Input
  options: {}
- name: scene
  id: scene
  type: Multi
  options: {}
- name: prossima_mossa
  id: prossima_mossa
  type: Input
  options: {}
- name: domande_aperte
  id: domande_aperte
  type: Input
  options: {}
- name: connessioni
  id: connessioni
  type: MultiFile
  options: {}
- name: collegamenti_mancanti
  id: collegamenti_mancanti
  type: Input
  options: {}
---

# FileClass luogo

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
