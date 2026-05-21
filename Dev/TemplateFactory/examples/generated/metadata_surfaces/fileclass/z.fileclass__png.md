---
icon: user-round
generated_from: Dev/TemplateFactory/modules/frontmatter_profiles.yaml
profile: png
target: z.fileclass/png.md
fieldsOrder:
- id
- statblock
- name
- nome
- categoria
- fileClass
- tipo
- ruolo
- stato
- canonico
- stato_canonico
- mondo
- luogo
- fazioni
- relazioni
- missioni
- sessioni
- connessioni
- vuole
- sa
- leva
- segreto
- domande_aperte
- atteggiamento
- pressione
- prossima_mossa
- conseguenze
- type
- size
- alignment
- ac
- hp
- hp_massimi
- hp_attuali
- hit_dice
- speed
- cr
- stats
- saves
- skillsaves
- damage_vulnerabilities
- damage_resistances
- damage_immunities
- condition_immunities
- senses
- languages
- traits
- actions
- bonus_actions
- reactions
- legendary_actions
- lair_actions
fields:
- name: id
  id: id
  type: Input
  options: {}
- name: statblock
  id: statblock
  type: Boolean
  options: {}
- name: name
  id: name
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
- name: ruolo
  id: ruolo
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
      '4': scomparso
      '5': morto
      '6': archiviata
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
- name: luogo
  id: luogo
  type: File
  options: {}
- name: fazioni
  id: fazioni
  type: MultiFile
  options: {}
- name: relazioni
  id: relazioni
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
- name: connessioni
  id: connessioni
  type: MultiFile
  options: {}
- name: vuole
  id: vuole
  type: Input
  options: {}
- name: sa
  id: sa
  type: Input
  options: {}
- name: leva
  id: leva
  type: Input
  options: {}
- name: segreto
  id: segreto
  type: Input
  options: {}
- name: domande_aperte
  id: domande_aperte
  type: Input
  options: {}
- name: atteggiamento
  id: atteggiamento
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
- name: conseguenze
  id: conseguenze
  type: MultiFile
  options: {}
- name: type
  id: type
  type: Input
  options: {}
- name: size
  id: size
  type: Input
  options: {}
- name: alignment
  id: alignment
  type: Input
  options: {}
- name: ac
  id: ac
  type: Input
  options: {}
- name: hp
  id: hp
  type: Input
  options: {}
- name: hp_massimi
  id: hp_massimi
  type: Input
  options: {}
- name: hp_attuali
  id: hp_attuali
  type: Input
  options: {}
- name: hit_dice
  id: hit_dice
  type: Input
  options: {}
- name: speed
  id: speed
  type: Input
  options: {}
- name: cr
  id: cr
  type: Input
  options: {}
- name: stats
  id: stats
  type: Input
  options: {}
- name: saves
  id: saves
  type: Input
  options: {}
- name: skillsaves
  id: skillsaves
  type: Input
  options: {}
- name: damage_vulnerabilities
  id: damage_vulnerabilities
  type: Input
  options: {}
- name: damage_resistances
  id: damage_resistances
  type: Input
  options: {}
- name: damage_immunities
  id: damage_immunities
  type: Input
  options: {}
- name: condition_immunities
  id: condition_immunities
  type: Input
  options: {}
- name: senses
  id: senses
  type: Input
  options: {}
- name: languages
  id: languages
  type: Input
  options: {}
- name: traits
  id: traits
  type: Input
  options: {}
- name: actions
  id: actions
  type: Input
  options: {}
- name: bonus_actions
  id: bonus_actions
  type: Input
  options: {}
- name: reactions
  id: reactions
  type: Input
  options: {}
- name: legendary_actions
  id: legendary_actions
  type: Input
  options: {}
- name: lair_actions
  id: lair_actions
  type: Input
  options: {}
---

# FileClass png

Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; materializza solo dopo review del diff.
