---
id: "srd-succube"
srd_id: "succube"
nome: "Succube"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Succube]]"]
riferimenti_srd: ["[[SRD/Mostri/Succube]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Succube#^srd-succube-forma-incubo]]", "[[SRD/Mostri/Succube#^srd-succube-multiattacco]]", "[[SRD/Mostri/Succube#^srd-succube-tocco-immondo]]", "[[SRD/Mostri/Succube#^srd-succube-bacio-prosciugante]]", "[[SRD/Mostri/Succube#^srd-succube-fascino]]", "[[SRD/Mostri/Succube#^srd-succube-mutaforma]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Succube"
type: "Immondo"
size: "medio"
alignment: "neutrale malvagio"
ac: 15
stats: [8, 17, 13, 15, 12, 20]
saves: {}
skillsaves: 
  furtivita: 7
  inganno: 9
  intuizione: 5
  percezione: 5
  persuasione: 9
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 15, scurovisione: 18 m"
languages: "Abissale, Comune, Infernale, telepatia 18 m"
cr: 4
traits: 
- name: "Forma incubo"
  desc: "Quando la succube termina un riposo lungo, può trasformarsi in un incubo, utilizzando la relativa scheda delle statistiche al posto di questa."
actions: 
- name: "Multiattacco"
  desc: "La succube effettua un attacco Tocco immondo e utilizza Fascino o Bacio prosciugante."
- name: "Tocco immondo"
  desc: "*Tiro per colpire in mischia:* +7, portata 1,5 m. *Colpito:* 16 (2d10 + 5) danni psichici."
- name: "Bacio prosciugante"
  desc: "*Tiro salvezza su Costituzione:* CD 15, una creatura affascinata dalla succube entro 1,5 metri. *Fallimento:* 13 (3d8) danni psichici. *Successo:* danni dimezzati. *Fallimento o successo:* i punti ferita massimi del bersaglio sono ridotti di un ammontare pari ai danni subiti."
- name: "Fascino"
  desc: "La succube lancia dominare persone (di 8º livello), senza bisogno di componenti e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 15)."
bonus_actions: 
- name: "Mutaforma"
  desc: "La succube si trasforma in un umanoide di taglia Media o Piccola, oppure ritorna alla sua vera forma. Le sue statistiche di gioco sono le stesse in ogni forma, a eccezione della velocità di volo disponibile solo nella sua vera forma. Nessun oggetto che indossa o trasporta viene trasformato."
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo"
dimensione: "Medio"
allineamento: "neutrale malvagio"
classe_armatura: 15
iniziativa: 3
hp: 71
hit_dice: "13d8 + 13"
speed: "camminata: 9 m, volo: 18 m"
xp: 1100
bonus_competenza: 2
statblock: true
---
# Succube

````tabs
tab: Scheda
```statblock
monster: Succube
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio Immondo, neutrale malvagio
> CA: 15
> PF: 71 (13d8 + 13)
> Velocita: camminata: 9 m, volo: 18 m
> GS: 4 (PE 1.100; BC +2)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 8 | -1 | -1 |
| Destrezza | 17 | 3 | 3 |
| Costituzione | 13 | 1 | 1 |
| Intelligenza | 15 | 2 | 2 |
| Saggezza | 12 | 1 | 1 |
| Carisma | 20 | 5 | 5 |
## Abilita

furtivita: 7, inganno: 9, intuizione: 5, percezione: 5, persuasione: 9
## Sensi

percezione_passiva: 15, scurovisione: 18 m
## Lingue

Abissale, Comune, Infernale, telepatia 18 m
tab: Azioni
## Tratti

### Forma incubo

Quando la succube termina un riposo lungo, può trasformarsi in un incubo, utilizzando la relativa scheda delle statistiche al posto di questa.
^srd-succube-forma-incubo
## Azioni

### Multiattacco

La succube effettua un attacco Tocco immondo e utilizza Fascino o Bacio prosciugante.
^srd-succube-multiattacco

### Tocco immondo

*Tiro per colpire in mischia:* +7, portata 1,5 m. *Colpito:* 16 (2d10 + 5) danni psichici.
^srd-succube-tocco-immondo

### Bacio prosciugante

*Tiro salvezza su Costituzione:* CD 15, una creatura affascinata dalla succube entro 1,5 metri. *Fallimento:* 13 (3d8) danni psichici. *Successo:* danni dimezzati. *Fallimento o successo:* i punti ferita massimi del bersaglio sono ridotti di un ammontare pari ai danni subiti.
^srd-succube-bacio-prosciugante

### Fascino

La succube lancia dominare persone (di 8º livello), senza bisogno di componenti e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 15).
^srd-succube-fascino
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.