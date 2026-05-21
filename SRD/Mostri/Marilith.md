---
id: "srd-marilith"
srd_id: "marilith"
nome: "Marilith"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Marilith]]"]
riferimenti_srd: ["[[SRD/Mostri/Marilith]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Marilith#^srd-marilith-reattiva]]", "[[SRD/Mostri/Marilith#^srd-marilith-resistenza-alla-magia]]", "[[SRD/Mostri/Marilith#^srd-marilith-ristoro-demoniaco]]", "[[SRD/Mostri/Marilith#^srd-marilith-multiattacco]]", "[[SRD/Mostri/Marilith#^srd-marilith-lama-del-patto]]", "[[SRD/Mostri/Marilith#^srd-marilith-stritolare]]", "[[SRD/Mostri/Marilith#^srd-marilith-teletrasporto-ricarica-5-6]]", "[[SRD/Mostri/Marilith#^srd-marilith-parata]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Marilith"
type: "Immondo (demone)"
size: "grande"
alignment: "caotico malvagio"
ac: 16
stats: [18, 20, 20, 18, 16, 20]
saves: 
  str: 9
  con: 10
  wis: 8
  cha: 10
skillsaves: 
  percezione: 8
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 18, vista_pura: 36 m"
languages: "Abissale, telepatia 36 m"
cr: 16
traits: 
- name: "Reattiva"
  desc: "Il marilith può effettuare una reazione a ogni turno in combattimento."
- name: "Resistenza alla magia"
  desc: "Il marilith dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
- name: "Ristoro demoniaco"
  desc: "Se il marilith muore al di fuori dell'Abisso, il suo corpo si dissolve diventando icore e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nell'Abisso."
actions: 
- name: "Multiattacco"
  desc: "Il marilith effettua sei attacchi Lama del patto e usa Stritolare."
- name: "Lama del patto"
  desc: "*Tiro per colpire in mischia:* +10, portata 1,5 m. *Colpito:* 10 (1d8 + 5) danni taglienti più 7 (2d6) danni necrotici."
- name: "Stritolare"
  desc: "*Tiro salvezza su Forza:* CD 17, una creatura di taglia Media o inferiore che il marilith è in grado di vedere entro 1,5 metri. *Fallimento:* 15 (2d10 + 4) danni contundenti. Il bersaglio è afferrato (CD 14 per sfuggire) ed è trattenuto finché la presa perdura."
bonus_actions: 
- name: "Teletrasporto (ricarica 5-6)"
  desc: "Il marilith si teletrasporta fino a massimo di 36 metri in uno spazio libero che è in grado di vedere."
reactions: 
- name: "Parata"
  desc: "Attivazione: il marilith viene colpito da un tiro per colpire in mischia mentre tiene in mano un'arma. Esito: il marilith aggiunge 5 alla sua CA contro quell'attacco, aumentando le probabilità che il colpo non vada a segno."
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo (demone)"
dimensione: "Grande"
allineamento: "caotico malvagio"
classe_armatura: 16
iniziativa: 10
hp: 220
hit_dice: "21d10 + 105"
speed: "camminata: 12 m, scalata: 12 m"
xp: 15000
bonus_competenza: 5
statblock: true
---
# Marilith

````tabs
tab: Scheda
```statblock
monster: Marilith
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Immondo (demone), caotico malvagio
> CA: 16
> PF: 220 (21d10 + 105)
> Velocita: camminata: 12 m, scalata: 12 m
> GS: 16 (PE 15.000; BC +5)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 18 | 4 | 9 |
| Destrezza | 20 | 5 | 5 |
| Costituzione | 20 | 5 | 10 |
| Intelligenza | 18 | 4 | 4 |
| Saggezza | 16 | 3 | 8 |
| Carisma | 20 | 5 | 10 |
## Abilita

percezione: 8
## Sensi

percezione_passiva: 18, vista_pura: 36 m
## Lingue

Abissale, telepatia 36 m
tab: Azioni
## Tratti

### Reattiva

Il marilith può effettuare una reazione a ogni turno in combattimento.
^srd-marilith-reattiva

### Resistenza alla magia

Il marilith dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.
^srd-marilith-resistenza-alla-magia

### Ristoro demoniaco

Se il marilith muore al di fuori dell'Abisso, il suo corpo si dissolve diventando icore e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nell'Abisso.
^srd-marilith-ristoro-demoniaco
## Azioni

### Multiattacco

Il marilith effettua sei attacchi Lama del patto e usa Stritolare.
^srd-marilith-multiattacco

### Lama del patto

*Tiro per colpire in mischia:* +10, portata 1,5 m. *Colpito:* 10 (1d8 + 5) danni taglienti più 7 (2d6) danni necrotici.
^srd-marilith-lama-del-patto

### Stritolare

*Tiro salvezza su Forza:* CD 17, una creatura di taglia Media o inferiore che il marilith è in grado di vedere entro 1,5 metri. *Fallimento:* 15 (2d10 + 4) danni contundenti. Il bersaglio è afferrato (CD 14 per sfuggire) ed è trattenuto finché la presa perdura.
^srd-marilith-stritolare
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.