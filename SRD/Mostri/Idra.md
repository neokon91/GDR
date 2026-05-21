---
id: "srd-idra"
srd_id: "idra"
nome: "Idra"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Idra]]"]
riferimenti_srd: ["[[SRD/Mostri/Idra]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Idra#^srd-idra-apnea]]", "[[SRD/Mostri/Idra#^srd-idra-teste-multiple]]", "[[SRD/Mostri/Idra#^srd-idra-teste-reattive]]", "[[SRD/Mostri/Idra#^srd-idra-multiattacco]]", "[[SRD/Mostri/Idra#^srd-idra-morso]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Idra"
type: "Mostruosità"
size: "enorme"
alignment: "senza allineamento"
ac: 15
stats: [20, 12, 20, 2, 10, 7]
saves: {}
skillsaves: 
  percezione: 6
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 16, scurovisione: 18 m"
languages: "nessuna"
cr: 8
traits: 
- name: "Apnea"
  desc: "L'idra può trattenere il respiro per 1 ora."
- name: "Teste multiple"
  desc: "L'idra possiede cinque teste. Ogni volta che subisce 25 o più danni in un singolo turno, una delle teste muore. Se tutte le teste muoiono, l'idra muore. Alla fine del suo turno e finché ha almeno una testa vivente, l'idra fa ricrescere due teste per ogni testa morta dal suo ultimo turno, a meno che nel corso di tale periodo non abbia subito danni da fuoco. L'idra recupera 20 punti ferita quando fa ricrescere delle nuove teste."
- name: "Teste reattive"
  desc: "Per ogni testa che l'idra possiede oltre la prima, riceve una reazione extra che può essere usata soltanto per gli attacchi di opportunità."
actions: 
- name: "Multiattacco"
  desc: "L'idra effettua un numero di attacchi Morso pari al numero di teste che possiede."
- name: "Morso"
  desc: "*Tiro per colpire in mischia:* +8, portata 3 m. *Colpito:* 10 (1d10 + 5) danni perforanti."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Mostruosità"
dimensione: "Enorme"
allineamento: "senza allineamento"
classe_armatura: 15
iniziativa: 4
hp: 184
hit_dice: "16d12 + 80"
speed: "camminata: 12 m, nuoto: 12 m"
xp: 3900
bonus_competenza: 3
statblock: true
---
# Idra

````tabs
tab: Scheda
```statblock
monster: Idra
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Enorme Mostruosità, senza allineamento
> CA: 15
> PF: 184 (16d12 + 80)
> Velocita: camminata: 12 m, nuoto: 12 m
> GS: 8 (PE 3.900; BC +3)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 20 | 5 | 5 |
| Destrezza | 12 | 1 | 1 |
| Costituzione | 20 | 5 | 5 |
| Intelligenza | 2 | -4 | -4 |
| Saggezza | 10 | 0 | 0 |
| Carisma | 7 | -2 | -2 |
## Abilita

percezione: 6
## Sensi

percezione_passiva: 16, scurovisione: 18 m
## Lingue

nessuna
tab: Azioni
## Tratti

### Apnea

L'idra può trattenere il respiro per 1 ora.
^srd-idra-apnea

### Teste multiple

L'idra possiede cinque teste. Ogni volta che subisce 25 o più danni in un singolo turno, una delle teste muore. Se tutte le teste muoiono, l'idra muore. Alla fine del suo turno e finché ha almeno una testa vivente, l'idra fa ricrescere due teste per ogni testa morta dal suo ultimo turno, a meno che nel corso di tale periodo non abbia subito danni da fuoco. L'idra recupera 20 punti ferita quando fa ricrescere delle nuove teste.
^srd-idra-teste-multiple

### Teste reattive

Per ogni testa che l'idra possiede oltre la prima, riceve una reazione extra che può essere usata soltanto per gli attacchi di opportunità.
^srd-idra-teste-reattive
## Azioni

### Multiattacco

L'idra effettua un numero di attacchi Morso pari al numero di teste che possiede.
^srd-idra-multiattacco

### Morso

*Tiro per colpire in mischia:* +8, portata 3 m. *Colpito:* 10 (1d10 + 5) danni perforanti.
^srd-idra-morso
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.