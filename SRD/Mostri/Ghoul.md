---
id: "srd-ghoul"
srd_id: "ghoul"
nome: "Ghoul"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Ghoul]]"]
riferimenti_srd: ["[[SRD/Mostri/Ghoul]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Ghoul#^srd-ghoul-multiattacco]]", "[[SRD/Mostri/Ghoul#^srd-ghoul-artiglio]]", "[[SRD/Mostri/Ghoul#^srd-ghoul-morso]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Ghoul"
type: "Non morto"
size: "medio"
alignment: "caotico malvagio"
ac: 12
stats: [13, 15, 10, 7, 10, 6]
saves: {}
skillsaves: {}
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 10, scurovisione: 18 m"
languages: "Comune"
cr: 1
traits: []
actions: 
- name: "Multiattacco"
  desc: "Il ghoul effettua due attacchi Morso."
- name: "Artiglio"
  desc: "*Tiro per colpire in mischia:* +4, portata 1,5 m. *Colpito:* 4 (1d4 + 2) danni taglienti. Se il bersaglio è una creatura diversa da un non morto o da un elfo, subisce il seguente effetto.\n\n*Tiro salvezza su Costituzione:* CD 10. *Fallimento:* il bersaglio è paralizzato fino al termine del proprio turno successivo."
- name: "Morso"
  desc: "*Tiro per colpire in mischia:* +4, portata 1,5 m. *Colpito:* 5 (1d6 + 2) danni perforanti più 3 (1d6) danni necrotici."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Non morto"
dimensione: "Medio"
allineamento: "caotico malvagio"
classe_armatura: 12
iniziativa: 2
hp: 22
hit_dice: "5d8"
speed: "camminata: 9 m"
xp: 200
bonus_competenza: 2
statblock: true
---
# Ghoul

````tabs
tab: Scheda
```statblock
monster: Ghoul
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio Non morto, caotico malvagio
> CA: 12
> PF: 22 (5d8)
> Velocita: camminata: 9 m
> GS: 1 (PE 200; BC +2)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 13 | 1 | 1 |
| Destrezza | 15 | 2 | 2 |
| Costituzione | 10 | 0 | 0 |
| Intelligenza | 7 | -2 | -2 |
| Saggezza | 10 | 0 | 0 |
| Carisma | 6 | -2 | -2 |
## Sensi

percezione_passiva: 10, scurovisione: 18 m
## Lingue

Comune
tab: Azioni
## Azioni

### Multiattacco

Il ghoul effettua due attacchi Morso.
^srd-ghoul-multiattacco

### Artiglio

*Tiro per colpire in mischia:* +4, portata 1,5 m. *Colpito:* 4 (1d4 + 2) danni taglienti. Se il bersaglio è una creatura diversa da un non morto o da un elfo, subisce il seguente effetto.

*Tiro salvezza su Costituzione:* CD 10. *Fallimento:* il bersaglio è paralizzato fino al termine del proprio turno successivo.
^srd-ghoul-artiglio

### Morso

*Tiro per colpire in mischia:* +4, portata 1,5 m. *Colpito:* 5 (1d6 + 2) danni perforanti più 3 (1d6) danni necrotici.
^srd-ghoul-morso
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.