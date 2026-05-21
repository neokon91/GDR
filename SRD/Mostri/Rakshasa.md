---
id: "srd-rakshasa"
srd_id: "rakshasa"
nome: "Rakshasa"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Rakshasa]]"]
riferimenti_srd: ["[[SRD/Mostri/Rakshasa]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Rakshasa#^srd-rakshasa-resistenza-maggiore-alla-magia]]", "[[SRD/Mostri/Rakshasa#^srd-rakshasa-ristoro-immondo]]", "[[SRD/Mostri/Rakshasa#^srd-rakshasa-multiattacco]]", "[[SRD/Mostri/Rakshasa#^srd-rakshasa-tocco-maledetto]]", "[[SRD/Mostri/Rakshasa#^srd-rakshasa-incantesimi]]", "[[SRD/Mostri/Rakshasa#^srd-rakshasa-ordine-funesto-ricarica-5-6]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Rakshasa"
type: "Immondo"
size: "medio"
alignment: "legale malvagio"
ac: 17
stats: [14, 17, 18, 13, 16, 20]
saves: {}
skillsaves: 
  inganno: 10
  intuizione: 8
  percezione: 8
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 18, vista_pura: 36 m"
languages: "Comune, Infernale"
cr: 13
traits: 
- name: "Resistenza maggiore alla magia"
  desc: "Il rakshasa supera automaticamente i tiri salvezza contro incantesimi e altri effetti magici, e i tiri per colpire degli incantesimi lo mancano automaticamente. Senza il consenso del rakshasa, nessun incantesimo può osservare il rakshasa a distanza o individuarne i pensieri, il tipo di creatura o l'allineamento."
- name: "Ristoro immondo"
  desc: "Se il rakshasa muore al di fuori dei Nove Inferi, il suo corpo si dissolve diventando icore e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nei Nove Inferi."
actions: 
- name: "Multiattacco"
  desc: "Il rakshasa effettua tre attacchi Tocco maledetto."
- name: "Tocco maledetto"
  desc: "*Tiro per colpire in mischia:* +10, portata 1,5 m. *Colpito:* 12 (2d6 + 5) danni taglienti più 19 (3d12) danni necrotici. Se il bersaglio è una creatura, viene maledetto. Finché è maledetto, il bersaglio non ottiene alcun beneficio dal riposo breve o lungo."
- name: "Incantesimi"
  desc: "Il rakshasa lancia uno dei seguenti incantesimi, senza bisogno di componenti materiali e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 18):1/giorno ciascuno: Immagine maggiore, invisibilità, spostamento planare, volareA volontà: Camuffare se stesso, illusione minore, individuazione dei pensieri, individuazione del magico, mano magica"
- name: "Ordine funesto (ricarica 5-6)"
  desc: "*Tiro salvezza su Saggezza:* CD 18, tutti i nemici in un'emanazione di 9 metri di cui il rakshasa è il punto di origine. *Fallimento:* 28 (8d6) danni psichici, e il bersaglio è spaventato e incapacitato fino all'inizio del turno successivo del rakshasa."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo"
dimensione: "Medio"
allineamento: "legale malvagio"
classe_armatura: 17
iniziativa: 8
hp: 221
hit_dice: "26d8 + 104"
speed: "camminata: 12 m"
xp: 10000
bonus_competenza: 5
statblock: true
---
# Rakshasa

````tabs
tab: Scheda
```statblock
monster: Rakshasa
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio Immondo, legale malvagio
> CA: 17
> PF: 221 (26d8 + 104)
> Velocita: camminata: 12 m
> GS: 13 (PE 10.000; BC +5)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 14 | 2 | 2 |
| Destrezza | 17 | 3 | 3 |
| Costituzione | 18 | 4 | 4 |
| Intelligenza | 13 | 1 | 1 |
| Saggezza | 16 | 3 | 3 |
| Carisma | 20 | 5 | 5 |
## Abilita

inganno: 10, intuizione: 8, percezione: 8
## Sensi

percezione_passiva: 18, vista_pura: 36 m
## Lingue

Comune, Infernale
tab: Azioni
## Tratti

### Resistenza maggiore alla magia

Il rakshasa supera automaticamente i tiri salvezza contro incantesimi e altri effetti magici, e i tiri per colpire degli incantesimi lo mancano automaticamente. Senza il consenso del rakshasa, nessun incantesimo può osservare il rakshasa a distanza o individuarne i pensieri, il tipo di creatura o l'allineamento.
^srd-rakshasa-resistenza-maggiore-alla-magia

### Ristoro immondo

Se il rakshasa muore al di fuori dei Nove Inferi, il suo corpo si dissolve diventando icore e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nei Nove Inferi.
^srd-rakshasa-ristoro-immondo
## Azioni

### Multiattacco

Il rakshasa effettua tre attacchi Tocco maledetto.
^srd-rakshasa-multiattacco

### Tocco maledetto

*Tiro per colpire in mischia:* +10, portata 1,5 m. *Colpito:* 12 (2d6 + 5) danni taglienti più 19 (3d12) danni necrotici. Se il bersaglio è una creatura, viene maledetto. Finché è maledetto, il bersaglio non ottiene alcun beneficio dal riposo breve o lungo.
^srd-rakshasa-tocco-maledetto

### Incantesimi

Il rakshasa lancia uno dei seguenti incantesimi, senza bisogno di componenti materiali e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 18):1/giorno ciascuno: Immagine maggiore, invisibilità, spostamento planare, volareA volontà: Camuffare se stesso, illusione minore, individuazione dei pensieri, individuazione del magico, mano magica
^srd-rakshasa-incantesimi

### Ordine funesto (ricarica 5-6)

*Tiro salvezza su Saggezza:* CD 18, tutti i nemici in un'emanazione di 9 metri di cui il rakshasa è il punto di origine. *Fallimento:* 28 (8d6) danni psichici, e il bersaglio è spaventato e incapacitato fino all'inizio del turno successivo del rakshasa.
^srd-rakshasa-ordine-funesto-ricarica-5-6
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.