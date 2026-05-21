---
id: "srd-aboleth"
srd_id: "aboleth"
nome: "Aboleth"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Aboleth]]"]
riferimenti_srd: ["[[SRD/Mostri/Aboleth]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Aboleth#^srd-aboleth-anfibio]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-nube-di-muco]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-resistenza-leggendaria-3-giorno-o-4-giorno-nella-tana]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-ristoro-occulto]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-sonda-telepatica]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-multiattacco]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-tentacolo]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-consuma-ricordi]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-domina-mente-2-giorno]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-risucchio-psichico]]", "[[SRD/Mostri/Aboleth#^srd-aboleth-sferzata]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Aboleth"
type: "Aberrazione"
size: "grande"
alignment: "legale malvagio"
ac: 17
stats: [21, 9, 15, 18, 15, 18]
saves: 
  dex: 3
  con: 6
  int: 8
  wis: 6
skillsaves: 
  percezione: 10
  storia: 12
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 20, scurovisione: 36 m"
languages: "Gergo delle Profondità, telepatia 36 m"
cr: 10
traits: 
- name: "Anfibio"
  desc: "L'aboleth può respirare in aria e in acqua."
- name: "Nube di muco*"
  desc: "Finché si trova sott'acqua, l'aboleth è circondato da uno strato di muco. *Tiro salvezza su Costituzione:* CD 14, tutte le creature in un'emanazione di 1,5 metri di cui l'aboleth è il punto di origine, alla fine del turno dell'aboleth. *Fallimento:* il bersaglio è maledetto. Finché la maledizione perdura, la pelle del bersaglio diventa viscida, il bersaglio può respirare in aria e in acqua e non può recuperare punti ferita finché si trova sott'acqua."
- name: "Resistenza leggendaria (3/giorno o 4/giorno nella tana)"
  desc: "Se l'aboleth fallisce un tiro salvezza, può scegliere di superarlo comunque."
- name: "Ristoro occulto"
  desc: "Se viene annientato, l'aboleth ottiene un nuovo corpo dopo 5d10 giorni, tornando in vita con tutti i suoi punti ferita nel Reame Remoto o in un altro luogo a scelta del GM."
- name: "Sonda telepatica"
  desc: "Se una creatura che l'aboleth è in grado di vedere comunica telepaticamente con l'aboleth, quest'ultimo apprende i più grandi desideri della creatura. Finché la creatura maledetta si trova fuori da uno specchio d'acqua, subisce 6 (1d12) danni da acido a intervalli di 10 minuti, a meno che la sua pelle non venga inumidita prima che siano trascorsi i 10 minuti."
actions: 
- name: "Multiattacco"
  desc: "L'aboleth effettua due attacchi Tentacolo e usa Consuma ricordi o Domina mente, se disponibili."
- name: "Tentacolo"
  desc: "*Tiro per colpire in mischia:* +9, portata 4,5 m. *Colpito:* 12 (2d6 + 5) danni contundenti. Se il bersaglio è una creatura di taglia Grande o inferiore, è afferrato (CD 14 per sfuggire) da uno dei quattro tentacoli."
- name: "Consuma ricordi"
  desc: "*Tiro salvezza su Intelligenza:* CD 16, una creatura entro 9 metri affascinata o afferrata dall'aboleth. *Fallimento:* 10 (3d6) danni psichici. *Successo:* danni dimezzati. *Fallimento o successo:* l'aboleth acquisisce i ricordi del bersaglio se questo è un umanoide e viene ridotto a 0 punti ferita da questa azione."
- name: "Domina mente (2/giorno)"
  desc: "*Tiro salvezza su Saggezza:* CD 16, una creatura che l'aboleth è in grado di vedere entro 9 metri. *Fallimento:* la creatura è affascinata finché l'aboleth muore o si sposta su un piano di esistenza diverso da quello del bersaglio. Finché è affascinato, il bersaglio agisce come un alleato dell'aboleth ed è sotto il suo controllo finché si trova entro 18 metri da esso. Inoltre, l'aboleth e il bersaglio possono comunicare telepaticamente tra loro a qualsiasi distanza. Il bersaglio ripete il tiro salvezza ogni volta che subisce danni e ogni volta che trascorre 24 ore ad almeno 1,5 chilometri di distanza dall'aboleth e, se lo supera, l'effetto svanisce."
bonus_actions: []
reactions: []
legendary_actions: 
- name: "Risucchio psichico"
  desc: "Se l'aboleth ha affascinato o afferrato almeno una creatura, utilizza Consuma ricordi e recupera 5 (1d10) punti ferita."
- name: "Sferzata"
  desc: "L'aboleth effettua un attacco Tentacolo."
lair_actions: []
tipo_creatura: "Aberrazione"
dimensione: "Grande"
allineamento: "legale malvagio"
classe_armatura: 17
iniziativa: 7
hp: 150
hit_dice: "20d10 + 40"
speed: "camminata: 3 m, nuoto: 12 m"
xp: 5900
bonus_competenza: 4
statblock: true
---
# Aboleth

````tabs
tab: Scheda
```statblock
monster: Aboleth
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Aberrazione, legale malvagio
> CA: 17
> PF: 150 (20d10 + 40)
> Velocita: camminata: 3 m, nuoto: 12 m
> GS: 10 (PE 5.900, o 7.200 nella tana; BC +4)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 21 | 5 | 5 |
| Destrezza | 9 | -1 | 3 |
| Costituzione | 15 | 2 | 6 |
| Intelligenza | 18 | 4 | 8 |
| Saggezza | 15 | 2 | 6 |
| Carisma | 18 | 4 | 4 |
## Abilita

percezione: 10, storia: 12
## Sensi

percezione_passiva: 20, scurovisione: 36 m
## Lingue

Gergo delle Profondità, telepatia 36 m
tab: Azioni
## Tratti

### Anfibio

L'aboleth può respirare in aria e in acqua.
^srd-aboleth-anfibio

### Nube di muco*

Finché si trova sott'acqua, l'aboleth è circondato da uno strato di muco. *Tiro salvezza su Costituzione:* CD 14, tutte le creature in un'emanazione di 1,5 metri di cui l'aboleth è il punto di origine, alla fine del turno dell'aboleth. *Fallimento:* il bersaglio è maledetto. Finché la maledizione perdura, la pelle del bersaglio diventa viscida, il bersaglio può respirare in aria e in acqua e non può recuperare punti ferita finché si trova sott'acqua.
^srd-aboleth-nube-di-muco

### Resistenza leggendaria (3/giorno o 4/giorno nella tana)

Se l'aboleth fallisce un tiro salvezza, può scegliere di superarlo comunque.
^srd-aboleth-resistenza-leggendaria-3-giorno-o-4-giorno-nella-tana

### Ristoro occulto

Se viene annientato, l'aboleth ottiene un nuovo corpo dopo 5d10 giorni, tornando in vita con tutti i suoi punti ferita nel Reame Remoto o in un altro luogo a scelta del GM.
^srd-aboleth-ristoro-occulto

### Sonda telepatica

Se una creatura che l'aboleth è in grado di vedere comunica telepaticamente con l'aboleth, quest'ultimo apprende i più grandi desideri della creatura. Finché la creatura maledetta si trova fuori da uno specchio d'acqua, subisce 6 (1d12) danni da acido a intervalli di 10 minuti, a meno che la sua pelle non venga inumidita prima che siano trascorsi i 10 minuti.
^srd-aboleth-sonda-telepatica
## Azioni

### Multiattacco

L'aboleth effettua due attacchi Tentacolo e usa Consuma ricordi o Domina mente, se disponibili.
^srd-aboleth-multiattacco

### Tentacolo

*Tiro per colpire in mischia:* +9, portata 4,5 m. *Colpito:* 12 (2d6 + 5) danni contundenti. Se il bersaglio è una creatura di taglia Grande o inferiore, è afferrato (CD 14 per sfuggire) da uno dei quattro tentacoli.
^srd-aboleth-tentacolo

### Consuma ricordi

*Tiro salvezza su Intelligenza:* CD 16, una creatura entro 9 metri affascinata o afferrata dall'aboleth. *Fallimento:* 10 (3d6) danni psichici. *Successo:* danni dimezzati. *Fallimento o successo:* l'aboleth acquisisce i ricordi del bersaglio se questo è un umanoide e viene ridotto a 0 punti ferita da questa azione.
^srd-aboleth-consuma-ricordi

### Domina mente (2/giorno)

*Tiro salvezza su Saggezza:* CD 16, una creatura che l'aboleth è in grado di vedere entro 9 metri. *Fallimento:* la creatura è affascinata finché l'aboleth muore o si sposta su un piano di esistenza diverso da quello del bersaglio. Finché è affascinato, il bersaglio agisce come un alleato dell'aboleth ed è sotto il suo controllo finché si trova entro 18 metri da esso. Inoltre, l'aboleth e il bersaglio possono comunicare telepaticamente tra loro a qualsiasi distanza. Il bersaglio ripete il tiro salvezza ogni volta che subisce danni e ogni volta che trascorre 24 ore ad almeno 1,5 chilometri di distanza dall'aboleth e, se lo supera, l'effetto svanisce.
^srd-aboleth-domina-mente-2-giorno
## Azioni Leggendarie

Subito dopo il turno di un'altra creatura, l'aboleth può consumare un utilizzo per effettuare una delle seguenti azioni. L'aboleth recupera tutti gli utilizzi consumati all'inizio di ogni suo turno.

## Opzioni

### Risucchio psichico

Se l'aboleth ha affascinato o afferrato almeno una creatura, utilizza Consuma ricordi e recupera 5 (1d10) punti ferita.
^srd-aboleth-risucchio-psichico

### Sferzata

L'aboleth effettua un attacco Tentacolo.
^srd-aboleth-sferzata
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.