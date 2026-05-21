---
id: "srd-oni"
srd_id: "oni"
nome: "Oni"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Oni]]"]
riferimenti_srd: ["[[SRD/Mostri/Oni]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Oni#^srd-oni-rigenerazione]]", "[[SRD/Mostri/Oni#^srd-oni-multiattacco]]", "[[SRD/Mostri/Oni#^srd-oni-artiglio]]", "[[SRD/Mostri/Oni#^srd-oni-raggio-dell-incubo]]", "[[SRD/Mostri/Oni#^srd-oni-incantesimi]]", "[[SRD/Mostri/Oni#^srd-oni-mutaforma]]", "[[SRD/Mostri/Oni#^srd-oni-invisibilita]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Oni"
type: "Immondo"
size: "grande"
alignment: "legale malvagio"
ac: 17
stats: [19, 11, 16, 14, 12, 15]
saves: 
  dex: 3
  con: 6
  wis: 4
  cha: 5
skillsaves: 
  arcano: 5
  inganno: 8
  percezione: 4
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 14, scurovisione: 18 m"
languages: "Comune, Gigante"
cr: 7
traits: 
- name: "Rigenerazione"
  desc: "L'oni recupera 10 punti ferita all'inizio di ogni suo turno, se ha almeno 1 punto ferita."
actions: 
- name: "Multiattacco"
  desc: "L'oni effettua due attacchi Artiglio o Raggio dell'incubo. Può sostituire un attacco con un utilizzo di Incantesimi."
- name: "Artiglio"
  desc: "*Tiro per colpire in mischia:* +7, portata 3 m. *Colpito:* 10 (1d12 + 4) danni taglienti più 9 (2d8) danni necrotici."
- name: "Raggio dell'incubo"
  desc: "*Tiro per colpire a distanza:* +5, gittata 18 m. *Colpito:* 9 (2d6 + 2) danni psichici, e il bersaglio è spaventato fino all'inizio del turno successivo dell'oni."
- name: "Incantesimi"
  desc: "L'oni lancia uno dei seguenti incantesimi, senza bisogno di componenti materiali, utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 13): 1/giorno ciascuno: Charme su persone (di 2º livello), forma gassosa, oscurità, sonno"
- name: "Mutaforma"
  desc: "L'oni si trasforma in un umanoide di taglia Piccola o Media, o in un gigante di taglia Grande, oppure torna alla sua vera forma. A eccezione della taglia, le sue statistiche di gioco restano le stesse in ogni forma. Nessun oggetto che indossa o trasporta viene trasformato."
bonus_actions: 
- name: "Invisibilità"
  desc: "L'oni lancia invisibilità su se stesso, senza bisogno di componenti e utilizzando la stessa caratteristica da incantatore di Incantesimi."
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo"
dimensione: "Grande"
allineamento: "legale malvagio"
classe_armatura: 17
iniziativa: 0
hp: 119
hit_dice: "14d10 + 42"
speed: "camminata: 9 m, volo: 9 m (fluttuare)"
xp: 2900
bonus_competenza: 3
statblock: true
---
# Oni

````tabs
tab: Scheda
```statblock
monster: Oni
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Immondo, legale malvagio
> CA: 17
> PF: 119 (14d10 + 42)
> Velocita: camminata: 9 m, volo: 9 m (fluttuare)
> GS: 7 (PE 2.900; BC +3)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 19 | 4 | 4 |
| Destrezza | 11 | 0 | 3 |
| Costituzione | 16 | 3 | 6 |
| Intelligenza | 14 | 2 | 2 |
| Saggezza | 12 | 1 | 4 |
| Carisma | 15 | 2 | 5 |
## Abilita

arcano: 5, inganno: 8, percezione: 4
## Sensi

percezione_passiva: 14, scurovisione: 18 m
## Lingue

Comune, Gigante
tab: Azioni
## Tratti

### Rigenerazione

L'oni recupera 10 punti ferita all'inizio di ogni suo turno, se ha almeno 1 punto ferita.
^srd-oni-rigenerazione
## Azioni

### Multiattacco

L'oni effettua due attacchi Artiglio o Raggio dell'incubo. Può sostituire un attacco con un utilizzo di Incantesimi.
^srd-oni-multiattacco

### Artiglio

*Tiro per colpire in mischia:* +7, portata 3 m. *Colpito:* 10 (1d12 + 4) danni taglienti più 9 (2d8) danni necrotici.
^srd-oni-artiglio

### Raggio dell'incubo

*Tiro per colpire a distanza:* +5, gittata 18 m. *Colpito:* 9 (2d6 + 2) danni psichici, e il bersaglio è spaventato fino all'inizio del turno successivo dell'oni.
^srd-oni-raggio-dell-incubo

### Incantesimi

L'oni lancia uno dei seguenti incantesimi, senza bisogno di componenti materiali, utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 13): 1/giorno ciascuno: Charme su persone (di 2º livello), forma gassosa, oscurità, sonno
^srd-oni-incantesimi

### Mutaforma

L'oni si trasforma in un umanoide di taglia Piccola o Media, o in un gigante di taglia Grande, oppure torna alla sua vera forma. A eccezione della taglia, le sue statistiche di gioco restano le stesse in ogni forma. Nessun oggetto che indossa o trasporta viene trasformato.
^srd-oni-mutaforma
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.