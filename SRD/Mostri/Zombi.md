---
id: "srd-zombi"
srd_id: "zombi"
nome: "Zombi"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Zombi]]"]
riferimenti_srd: ["[[SRD/Mostri/Zombi]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Zombi#^srd-zombi-tempra-dei-non-morti]]", "[[SRD/Mostri/Zombi#^srd-zombi-schianto]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Zombi"
type: "Non morto"
size: "medio"
alignment: "neutrale malvagio"
ac: 8
stats: [13, 6, 16, 3, 6, 5]
saves: 
  wis: 0
skillsaves: {}
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 8, scurovisione: 18 m"
languages: "capisce il Comune più un'altra lingua ma non le parla"
cr: 0.25
traits: 
- name: "Tempra dei non morti"
  desc: "Se i danni riducono lo zombi a 0 punti ferita, esso effettua un tiro salvezza su Costituzione (CD pari a 5 più i danni subiti), a meno che non si tratti di danni radiosi o di un colpo critico. In caso di successo, scende invece a 1 punto ferita."
actions: 
- name: "Schianto"
  desc: "*Tiro per colpire in mischia:* +3, portata 1,5 m. *Colpito:* 5 (1d8 + 1) danni contundenti."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Non morto"
dimensione: "Medio"
allineamento: "neutrale malvagio"
classe_armatura: 8
iniziativa: -2
hp: 15
hit_dice: "2d8 + 6"
speed: "camminata: 6 m"
xp: 50
bonus_competenza: 2
statblock: true
---
# Zombi

````tabs
tab: Scheda
```statblock
monster: Zombi
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio Non morto, neutrale malvagio
> CA: 8
> PF: 15 (2d8 + 6)
> Velocita: camminata: 6 m
> GS: 1/4 (PE 50; BC +2)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 13 | 1 | 1 |
| Destrezza | 6 | -2 | -2 |
| Costituzione | 16 | 3 | 3 |
| Intelligenza | 3 | -4 | -4 |
| Saggezza | 6 | -2 | 0 |
| Carisma | 5 | -3 | -3 |
## Sensi

percezione_passiva: 8, scurovisione: 18 m
## Lingue

capisce il Comune più un'altra lingua ma non le parla
tab: Azioni
## Tratti

### Tempra dei non morti

Se i danni riducono lo zombi a 0 punti ferita, esso effettua un tiro salvezza su Costituzione (CD pari a 5 più i danni subiti), a meno che non si tratti di danni radiosi o di un colpo critico. In caso di successo, scende invece a 1 punto ferita.
^srd-zombi-tempra-dei-non-morti
## Azioni

### Schianto

*Tiro per colpire in mischia:* +3, portata 1,5 m. *Colpito:* 5 (1d8 + 1) danni contundenti.
^srd-zombi-schianto
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.