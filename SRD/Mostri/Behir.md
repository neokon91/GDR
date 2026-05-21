---
id: "srd-behir"
srd_id: "behir"
nome: "Behir"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Behir]]"]
riferimenti_srd: ["[[SRD/Mostri/Behir]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Behir#^srd-behir-multiattacco]]", "[[SRD/Mostri/Behir#^srd-behir-morso]]", "[[SRD/Mostri/Behir#^srd-behir-soffio-di-fulmini-ricarica-5-6]]", "[[SRD/Mostri/Behir#^srd-behir-stritolare]]", "[[SRD/Mostri/Behir#^srd-behir-inghiottire]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Behir"
type: "Mostruosità"
size: "enorme"
alignment: "neutrale malvagio"
ac: 17
stats: [23, 16, 18, 7, 14, 12]
saves: {}
skillsaves: 
  furtivita: 7
  percezione: 6
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 16, scurovisione: 27 m"
languages: "Draconico"
cr: 11
traits: []
actions: 
- name: "Multiattacco"
  desc: "Il behir effettua un attacco Morso e usa Stritolare."
- name: "Morso"
  desc: "*Tiro per colpire in mischia:* +10, portata 3 m. *Colpito:* 19 (2d12 + 6) danni perforanti più 11 (2d10) danni da fulmine."
- name: "Soffio di fulmini (ricarica 5-6)"
  desc: "*Tiro salvezza su Destrezza:* CD 16, tutte le creature in una linea lunga 27 metri e larga 1,5 metri. *Fallimento:* 66 (12d10) danni da fulmine. *Successo:* danni dimezzati."
- name: "Stritolare"
  desc: "*Tiro salvezza su Forza:* CD 18, una creatura di taglia Grande o inferiore che il behir è in grado di vedere entro 1,5 metri. *Fallimento:* 28 (5d8 + 6) danni contundenti. Il bersaglio è afferrato (CD 16 per sfuggire) ed è trattenuto finché la presa perdura."
bonus_actions: 
- name: "Inghiottire"
  desc: "*Tiro salvezza su Destrezza:* CD 18, una creatura di taglia Grande o inferiore afferrata dal behir (il behir può inghiottire solo una creatura alla volta). *Fallimento:* Il behir inghiotte il bersaglio, che non è più afferrato. Finché è inghiottita, la creatura è accecata e trattenuta, beneficia di copertura totale contro gli attacchi e altri effetti al di fuori del behir, e subisce 21 (6d6) danni da acido all'inizio di ogni turno del behir. Se il behir subisce 30 o più danni in un singolo turno dalla creatura inghiottita, deve superare un tiro salvezza su Costituzione con CD 14 alla fine di quel turno, altrimenti rigurgita la creatura, che cade prona in uno spazio entro 3 metri dal behir. Se il behir muore, la creatura inghiottita non è più trattenuta e può fuggire dal cadavere usando 4,5 metri di movimento, uscendo prona."
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Mostruosità"
dimensione: "Enorme"
allineamento: "neutrale malvagio"
classe_armatura: 17
iniziativa: 3
hp: 168
hit_dice: "16d12 + 64"
speed: "camminata: 15 m, scalata: 15 m"
xp: 7200
bonus_competenza: 4
statblock: true
---
# Behir

````tabs
tab: Scheda
```statblock
monster: Behir
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Enorme Mostruosità, neutrale malvagio
> CA: 17
> PF: 168 (16d12 + 64)
> Velocita: camminata: 15 m, scalata: 15 m
> GS: 11 (PE 7.200; BC +4)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 23 | 6 | 6 |
| Destrezza | 16 | 3 | 3 |
| Costituzione | 18 | 4 | 4 |
| Intelligenza | 7 | -2 | -2 |
| Saggezza | 14 | 2 | 2 |
| Carisma | 12 | 1 | 1 |
## Abilita

furtivita: 7, percezione: 6
## Sensi

percezione_passiva: 16, scurovisione: 27 m
## Lingue

Draconico
tab: Azioni
## Azioni

### Multiattacco

Il behir effettua un attacco Morso e usa Stritolare.
^srd-behir-multiattacco

### Morso

*Tiro per colpire in mischia:* +10, portata 3 m. *Colpito:* 19 (2d12 + 6) danni perforanti più 11 (2d10) danni da fulmine.
^srd-behir-morso

### Soffio di fulmini (ricarica 5-6)

*Tiro salvezza su Destrezza:* CD 16, tutte le creature in una linea lunga 27 metri e larga 1,5 metri. *Fallimento:* 66 (12d10) danni da fulmine. *Successo:* danni dimezzati.
^srd-behir-soffio-di-fulmini-ricarica-5-6

### Stritolare

*Tiro salvezza su Forza:* CD 18, una creatura di taglia Grande o inferiore che il behir è in grado di vedere entro 1,5 metri. *Fallimento:* 28 (5d8 + 6) danni contundenti. Il bersaglio è afferrato (CD 16 per sfuggire) ed è trattenuto finché la presa perdura.
^srd-behir-stritolare
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.