---
id: "srd-guardiano_protettore"
srd_id: "guardiano_protettore"
nome: "Guardiano protettore"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Guardiano protettore]]"]
riferimenti_srd: ["[[SRD/Mostri/Guardiano protettore]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Guardiano protettore#^srd-guardiano_protettore-incantesimo-custodito]]", "[[SRD/Mostri/Guardiano protettore#^srd-guardiano_protettore-rigenerazione]]", "[[SRD/Mostri/Guardiano protettore#^srd-guardiano_protettore-vincolato]]", "[[SRD/Mostri/Guardiano protettore#^srd-guardiano_protettore-multiattacco]]", "[[SRD/Mostri/Guardiano protettore#^srd-guardiano_protettore-pugno]]", "[[SRD/Mostri/Guardiano protettore#^srd-guardiano_protettore-protezione]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Guardiano protettore"
type: "Costrutto"
size: "grande"
alignment: "senza allineamento"
ac: 17
stats: [18, 8, 18, 7, 10, 3]
saves: {}
skillsaves: {}
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 10, scurovisione: 18 m, vista_cieca: 3 m"
languages: "capisce i comandi impartiti in qualsiasi lingua, ma non è in grado di parlare"
cr: 7
traits: 
- name: "Incantesimo custodito"
  desc: "Un incantatore che indossa l'amuleto del guardiano protettore può fare in modo che il guardiano custodisca un incantesimo di 4º livello o inferiore. Per farlo, il portatore deve lanciare l'incantesimo sul guardiano finché si trova entro 1,5 metri da esso. L'incantesimo non ha effetto, ma è custodito all'interno del guardiano. Quando gli viene affidato un nuovo incantesimo, quello custodito in precedenza viene sovrascritto. Il guardiano protettore può lanciare l'incantesimo custodito con qualsiasi parametro deciso dall'incantatore originale, senza bisogno di componenti e utilizzando la caratteristica da incantatore di quest'ultimo. Così facendo, l'incantesimo custodito va perduto."
- name: "Rigenerazione"
  desc: "Il guardiano protettore recupera 10 punti ferita all'inizio di ogni suo turno, se ha almeno 1 punto ferita."
- name: "Vincolato"
  desc: "Il guardiano protettore è vincolato magicamente a un amuleto. Finché il guardiano e il suo amuleto si trovano sullo stesso piano di esistenza, il portatore dell'amuleto può chiamare telepaticamente ilguardiano affinché viaggi fino a lui. Il guardiano conosce la distanza e la direzione in cui si trova l'oggetto. Se il guardiano si trova entro 18 metri dal portatore dell'amuleto, la metà dei danni (arrotondati per eccesso) che il portatore subisce viene trasferita al guardiano."
actions: 
- name: "Multiattacco"
  desc: "Il guardiano effettua due attacchi Pugno."
- name: "Pugno"
  desc: "*Tiro per colpire in mischia:* +7, portata 3 m. *Colpito:* 11 (2d6 + 4) danni contundenti più 7 (2d6) danni da forza."
bonus_actions: []
reactions: 
- name: "Protezione"
  desc: "Attivazione: un tiro per colpire va a segno sul portatore dell'amuleto del guardiano protettore finché egli si trova entro 1,5 metri dal costrutto. Esito: il portatore dell'amuleto ottiene un bonus di +5 alla CA anche contro il tiro che ha provocato la reazione, aumentando le probabilità che il colpo non vada a segno, fino all'inizio del turno successivo del guardiano protettore."
legendary_actions: []
lair_actions: []
tipo_creatura: "Costrutto"
dimensione: "Grande"
allineamento: "senza allineamento"
classe_armatura: 17
iniziativa: -1
hp: 142
hit_dice: "15d10 + 60"
speed: "camminata: 9 m"
xp: 2900
bonus_competenza: 3
statblock: true
---
# Guardiano protettore

````tabs
tab: Scheda
```statblock
monster: Guardiano protettore
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Costrutto, senza allineamento
> CA: 17
> PF: 142 (15d10 + 60)
> Velocita: camminata: 9 m
> GS: 7 (PE 2.900; BC +3)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 18 | 4 | 4 |
| Destrezza | 8 | -1 | -1 |
| Costituzione | 18 | 4 | 4 |
| Intelligenza | 7 | -2 | -2 |
| Saggezza | 10 | 0 | 0 |
| Carisma | 3 | -4 | -4 |
## Sensi

percezione_passiva: 10, scurovisione: 18 m, vista_cieca: 3 m
## Lingue

capisce i comandi impartiti in qualsiasi lingua, ma non è in grado di parlare
tab: Azioni
## Tratti

### Incantesimo custodito

Un incantatore che indossa l'amuleto del guardiano protettore può fare in modo che il guardiano custodisca un incantesimo di 4º livello o inferiore. Per farlo, il portatore deve lanciare l'incantesimo sul guardiano finché si trova entro 1,5 metri da esso. L'incantesimo non ha effetto, ma è custodito all'interno del guardiano. Quando gli viene affidato un nuovo incantesimo, quello custodito in precedenza viene sovrascritto. Il guardiano protettore può lanciare l'incantesimo custodito con qualsiasi parametro deciso dall'incantatore originale, senza bisogno di componenti e utilizzando la caratteristica da incantatore di quest'ultimo. Così facendo, l'incantesimo custodito va perduto.
^srd-guardiano_protettore-incantesimo-custodito

### Rigenerazione

Il guardiano protettore recupera 10 punti ferita all'inizio di ogni suo turno, se ha almeno 1 punto ferita.
^srd-guardiano_protettore-rigenerazione

### Vincolato

Il guardiano protettore è vincolato magicamente a un amuleto. Finché il guardiano e il suo amuleto si trovano sullo stesso piano di esistenza, il portatore dell'amuleto può chiamare telepaticamente ilguardiano affinché viaggi fino a lui. Il guardiano conosce la distanza e la direzione in cui si trova l'oggetto. Se il guardiano si trova entro 18 metri dal portatore dell'amuleto, la metà dei danni (arrotondati per eccesso) che il portatore subisce viene trasferita al guardiano.
^srd-guardiano_protettore-vincolato
## Azioni

### Multiattacco

Il guardiano effettua due attacchi Pugno.
^srd-guardiano_protettore-multiattacco

### Pugno

*Tiro per colpire in mischia:* +7, portata 3 m. *Colpito:* 11 (2d6 + 4) danni contundenti più 7 (2d6) danni da forza.
^srd-guardiano_protettore-pugno
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.