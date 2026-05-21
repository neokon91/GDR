---
id: "srd-troll"
srd_id: "troll"
nome: "Troll"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Troll]]"]
riferimenti_srd: ["[[SRD/Mostri/Troll]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Troll#^srd-troll-arti-abominevoli-4-giorno]]", "[[SRD/Mostri/Troll#^srd-troll-rigenerazione]]", "[[SRD/Mostri/Troll#^srd-troll-multiattacco]]", "[[SRD/Mostri/Troll#^srd-troll-squarcio]]", "[[SRD/Mostri/Troll#^srd-troll-carica]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Troll"
type: "Gigante"
size: "grande"
alignment: "caotico malvagio"
ac: 15
stats: [18, 13, 20, 7, 9, 7]
saves: {}
skillsaves: 
  percezione: 5
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 15, scurovisione: 18 m"
languages: "Gigante"
cr: 5
traits: 
- name: "Arti abominevoli (4/giorno)"
  desc: "Se il troll termina qualsiasi turno sanguinante e subisce più di 15 danni taglienti durante tale turno, uno dei suoi arti viene reciso, cade nello spazio del troll e diventa un arto di troll. L'arto svolge il suo turno subito dopo quello del troll. Il troll ha 1 livello di indebolimento per ogni arto mancante e fa ricrescere gli arti la prossima volta che recupera punti ferita."
- name: "Rigenerazione"
  desc: "Il troll recupera 15 punti ferita all'inizio di ogni suo turno. Se il troll subisce danni da acido o fuoco, questo tratto non funziona all'inizio del suo turno successivo. Il troll muore solo se inizia il turno con 0 punti ferita e non si rigenera."
actions: 
- name: "Multiattacco"
  desc: "Il troll effettua tre attacchi Squarcio."
- name: "Squarcio"
  desc: "*Tiro per colpire in mischia:* +7, portata 3 m. *Colpito:* 11 (2d6 + 4) danni taglienti."
bonus_actions: 
- name: "Carica"
  desc: "Il troll si muove fino a metà della sua velocità in linea retta verso un nemico che è in grado di vedere."
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Gigante"
dimensione: "Grande"
allineamento: "caotico malvagio"
classe_armatura: 15
iniziativa: 1
hp: 94
hit_dice: "9d10 + 45"
speed: "camminata: 9 m"
xp: 1800
bonus_competenza: 3
statblock: true
---
# Troll

````tabs
tab: Scheda
```statblock
monster: Troll
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Gigante, caotico malvagio
> CA: 15
> PF: 94 (9d10 + 45)
> Velocita: camminata: 9 m
> GS: 5 (PE 1.800; BC +3)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 18 | 4 | 4 |
| Destrezza | 13 | 1 | 1 |
| Costituzione | 20 | 5 | 5 |
| Intelligenza | 7 | -2 | -2 |
| Saggezza | 9 | -1 | -1 |
| Carisma | 7 | -2 | -2 |
## Abilita

percezione: 5
## Sensi

percezione_passiva: 15, scurovisione: 18 m
## Lingue

Gigante
tab: Azioni
## Tratti

### Arti abominevoli (4/giorno)

Se il troll termina qualsiasi turno sanguinante e subisce più di 15 danni taglienti durante tale turno, uno dei suoi arti viene reciso, cade nello spazio del troll e diventa un arto di troll. L'arto svolge il suo turno subito dopo quello del troll. Il troll ha 1 livello di indebolimento per ogni arto mancante e fa ricrescere gli arti la prossima volta che recupera punti ferita.
^srd-troll-arti-abominevoli-4-giorno

### Rigenerazione

Il troll recupera 15 punti ferita all'inizio di ogni suo turno. Se il troll subisce danni da acido o fuoco, questo tratto non funziona all'inizio del suo turno successivo. Il troll muore solo se inizia il turno con 0 punti ferita e non si rigenera.
^srd-troll-rigenerazione
## Azioni

### Multiattacco

Il troll effettua tre attacchi Squarcio.
^srd-troll-multiattacco

### Squarcio

*Tiro per colpire in mischia:* +7, portata 3 m. *Colpito:* 11 (2d6 + 4) danni taglienti.
^srd-troll-squarcio
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.