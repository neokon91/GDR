---
id: "srd-glabrezu"
srd_id: "glabrezu"
nome: "Glabrezu"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Glabrezu]]"]
riferimenti_srd: ["[[SRD/Mostri/Glabrezu]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Glabrezu#^srd-glabrezu-resistenza-alla-magia]]", "[[SRD/Mostri/Glabrezu#^srd-glabrezu-ristoro-demoniaco]]", "[[SRD/Mostri/Glabrezu#^srd-glabrezu-multiattacco]]", "[[SRD/Mostri/Glabrezu#^srd-glabrezu-tenaglia]]", "[[SRD/Mostri/Glabrezu#^srd-glabrezu-incantesimi]]", "[[SRD/Mostri/Glabrezu#^srd-glabrezu-pugno]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Glabrezu"
type: "Immondo (demone)"
size: "grande"
alignment: "caotico malvagio"
ac: 17
stats: [20, 15, 21, 19, 17, 16]
saves: 
  str: 9
  con: 9
  wis: 7
  cha: 7
skillsaves: 
  inganno: 7
  percezione: 7
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 17, vista_pura: 36 m"
languages: "Abissale, telepatia 36 m"
cr: 9
traits: 
- name: "Resistenza alla magia"
  desc: "Il glabrezu dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
- name: "Ristoro demoniaco"
  desc: "Se il glabrezu muore al di fuori dell'Abisso, il suo corpo si dissolve diventando icore e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nell'Abisso."
actions: 
- name: "Multiattacco"
  desc: "Il glabrezu effettua due attacchi Tenaglia, e utilizza Pugno o Incantesimi."
- name: "Tenaglia"
  desc: "*Tiro per colpire in mischia:* +9, portata 3 m. *Colpito:* 16 (2d10 + 5) danni taglienti. Se il bersaglio è una creatura di taglia Media o inferiore viene afferrato (CD 15 per sfuggire) da una delle due tenaglie."
- name: "Incantesimi"
  desc: "Il glabrezu lancia uno dei seguenti incantesimi senza bisogno di componenti materiali, utilizzando Intelligenza come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 16):\n\n1/giorno ciascuno:\n- confusione\n- parola del potere stordire\n- volare\n\nA volontà:\n- dissolvi magie\n- individuazione del magico\n- oscurità"
- name: "Pugno"
  desc: "*Tiro salvezza su Destrezza:* CD 17, una creatura afferrata dal glabrezu. *Fallimento:* 15 (3d6 + 5) danni contundenti. *Successo:* danni dimezzati."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo (demone)"
dimensione: "Grande"
allineamento: "caotico malvagio"
classe_armatura: 17
iniziativa: 6
hp: 189
hit_dice: "18d10 + 90"
speed: "camminata: 12 m"
xp: 5000
bonus_competenza: 4
statblock: true
---
# Glabrezu

````tabs
tab: Scheda
```statblock
monster: Glabrezu
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Immondo (demone), caotico malvagio
> CA: 17
> PF: 189 (18d10 + 90)
> Velocita: camminata: 12 m
> GS: 9 (PE 5.000; BC +4)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 20 | 5 | 9 |
| Destrezza | 15 | 2 | 2 |
| Costituzione | 21 | 5 | 9 |
| Intelligenza | 19 | 4 | 4 |
| Saggezza | 17 | 3 | 7 |
| Carisma | 16 | 3 | 7 |
## Abilita

inganno: 7, percezione: 7
## Sensi

percezione_passiva: 17, vista_pura: 36 m
## Lingue

Abissale, telepatia 36 m
tab: Azioni
## Tratti

### Resistenza alla magia

Il glabrezu dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.
^srd-glabrezu-resistenza-alla-magia

### Ristoro demoniaco

Se il glabrezu muore al di fuori dell'Abisso, il suo corpo si dissolve diventando icore e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nell'Abisso.
^srd-glabrezu-ristoro-demoniaco
## Azioni

### Multiattacco

Il glabrezu effettua due attacchi Tenaglia, e utilizza Pugno o Incantesimi.
^srd-glabrezu-multiattacco

### Tenaglia

*Tiro per colpire in mischia:* +9, portata 3 m. *Colpito:* 16 (2d10 + 5) danni taglienti. Se il bersaglio è una creatura di taglia Media o inferiore viene afferrato (CD 15 per sfuggire) da una delle due tenaglie.
^srd-glabrezu-tenaglia

### Incantesimi

Il glabrezu lancia uno dei seguenti incantesimi senza bisogno di componenti materiali, utilizzando Intelligenza come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 16):

1/giorno ciascuno:
- confusione
- parola del potere stordire
- volare

A volontà:
- dissolvi magie
- individuazione del magico
- oscurità
^srd-glabrezu-incantesimi

### Pugno

*Tiro salvezza su Destrezza:* CD 17, una creatura afferrata dal glabrezu. *Fallimento:* 15 (3d6 + 5) danni contundenti. *Successo:* danni dimezzati.
^srd-glabrezu-pugno
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.