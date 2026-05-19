---
id: "srd-tarrasque"
srd_id: "tarrasque"
nome: "Tarrasque"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
name: "Tarrasque"
type: "Mostruosità (titano)"
size: "mastodonica"
alignment: "senza allineamento"
ac: 25
stats: [30, 11, 30, 3, 11, 11]
saves: 
  dex: 9
  int: 5
  wis: 9
  cha: 9
skillsaves: 
  percezione: 9
damage_vulnerabilities: 
damage_resistances: 
damage_immunities: 
condition_immunities: 
senses: "percezione_passiva: 19, vista_cieca: 36 m"
languages: "nessuna"
gear: []
traits: 
- name: "Carapace riflettente"
  desc: "Se il tarrasque è bersagliato da un incantesimo dardo incantato o un incantesimo che richiede un tiro per colpire a distanza, tira 1d6. Con un risultato di 1-5, il tarrasque non subisce alcun effetto. Con un risultato di 6, il tarrasque non subisce alcun effetto e riflette l'incantesimo contro l'incantatore, rendendolo il suo bersaglio."
- name: "Mostro da assedio"
  desc: "Il tarrasque infligge danni doppi a oggetti e strutture."
- name: "Resistenza alla magia"
  desc: "Il tarrasque dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
- name: "Resistenza leggendaria (6/giorno)"
  desc: "Se il tarrasque fallisce un tiro salvezza, può scegliere di superarlo comunque."
actions: 
- name: "Multiattacco"
  desc: "Il tarrasque effettua un attacco Morso e altri tre attacchi, usando Artiglio o Coda in qualsiasi combinazione."
- name: "Artiglio"
  desc: "*Tiro per colpire in mischia:* +19, portata 4,5 m. *Colpito:* 28 (4d8 + 10) danni taglienti."
- name: "Coda"
  desc: "*Tiro per colpire in mischia:* +19, portata 9 m. *Colpito:* 23 (3d8 + 10) danni contundenti. Se il bersaglio è una creatura di taglia Enorme o inferiore, cade a terra prono."
- name: "Morso"
  desc: "*Tiro per colpire in mischia:* +19, portata 4,5 m. *Colpito:* 36 (4d12 + 10) danni perforanti, e il bersaglio è afferrato (CD 20 per sfuggire). Finché la presa perdura, il bersaglio è trattenuto e non può teletrasportarsi."
- name: "Ruggito tonante (ricarica 5-6)"
  desc: "*Tiro salvezza su Costituzione:* CD 27, ogni creatura e oggetto che non sia indossato o trasportato in un cono di 45 metri. *Fallimento:* 78 (12d12) danni da tuono, e il bersaglio è assordato e spaventato fino al termine del proprio turno successivo. *Successo:* danni dimezzati."
bonus_actions: 
- name: "Inghiottire"
  desc: "*Tiro salvezza su Forza:* CD 27, una creatura di taglia Grande o inferiore afferrata dal tarrasque (può inghiottire fino a sei creature per volta). *Fallimento:* il bersaglio viene inghiottito e non è più afferrato. Una creatura inghiottita è accecata e trattenuta e non può teletrasportarsi, ha copertura totale contro attacchi e altri effetti al di fuori del tarrasque e subisce 56 (16d6) danni da acido all'inizio di ogni turno del tarrasque. Se il tarrasque subisce 60 o più danni in un singolo turno da una creatura al suo interno, deve superare un tiro salvezza su Costituzione con CD 20 alla fine di quel turno, altrimenti rigurgita tutte le creature inghiottite, ognuna delle quali cade a terra prona in uno spazio entro 3 metri dal tarrasque. Se il tarrasque muore, qualsiasi creatura inghiottita non è più trattenuta e può fuggire dal cadavere usando 6 metri di movimento, uscendo prona."
reactions: []
legendary_actions: 
- name: "Assalto brutale"
  desc: "Il tarrasque si muove fino a metà della sua velocità ed effettua un attacco Artiglio e un attacco Coda."
- name: "Movimento sismico"
  desc: "Il tarrasque si muove fino alla sua velocità massima. Alla fine di questo movimento, crea un'onda d'urto istantanea in un'emanazione di 18 metri di cui il tarrasque è il punto di origine. Le creature in quell'area perdono la concentrazione e, se sono di taglia Media o inferiore, cadono a terra prone. Il tarrasque non può ripetere quest'azione fino all'inizio del proprio turno successivo."
lair_actions: []
tipo_creatura: "Mostruosità (titano)"
dimensione: "Mastodonica"
allineamento: "senza allineamento"
classe_armatura: 25
iniziativa: 18
hp: 697
hit_dice: "34d20 + 340"
speed: "camminata: scavo 12 m, scalata: 18 m"
cr: 30
xp: 155000
bonus_competenza: 9
statblock: true
---
# Tarrasque

```statblock
monster: Tarrasque
```

> [!infobox|wiki]- Mostro SRD
> Tipo: Mastodonica Mostruosità (titano), senza allineamento
> CA: 25
> PF: 697 (34d20 + 340)
> Velocita: camminata: scavo 12 m, scalata: 18 m
> GS: 30 (PE 155.000; BC +9)

## Caratteristiche

| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 30 | 10 | 10 |
| Destrezza | 11 | 0 | 9 |
| Costituzione | 30 | 10 | 10 |
| Intelligenza | 3 | -4 | 5 |
| Saggezza | 11 | 0 | 9 |
| Carisma | 11 | 0 | 9 |

## Abilita

percezione: 9

## Sensi

percezione_passiva: 19, vista_cieca: 36 m

## Lingue

nessuna

## Tratti

### Carapace riflettente

Se il tarrasque è bersagliato da un incantesimo dardo incantato o un incantesimo che richiede un tiro per colpire a distanza, tira 1d6. Con un risultato di 1-5, il tarrasque non subisce alcun effetto. Con un risultato di 6, il tarrasque non subisce alcun effetto e riflette l'incantesimo contro l'incantatore, rendendolo il suo bersaglio.

### Mostro da assedio

Il tarrasque infligge danni doppi a oggetti e strutture.

### Resistenza alla magia

Il tarrasque dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.

### Resistenza leggendaria (6/giorno)

Se il tarrasque fallisce un tiro salvezza, può scegliere di superarlo comunque.

## Azioni

### Multiattacco

Il tarrasque effettua un attacco Morso e altri tre attacchi, usando Artiglio o Coda in qualsiasi combinazione.

### Artiglio

*Tiro per colpire in mischia:* +19, portata 4,5 m. *Colpito:* 28 (4d8 + 10) danni taglienti.

### Coda

*Tiro per colpire in mischia:* +19, portata 9 m. *Colpito:* 23 (3d8 + 10) danni contundenti. Se il bersaglio è una creatura di taglia Enorme o inferiore, cade a terra prono.

### Morso

*Tiro per colpire in mischia:* +19, portata 4,5 m. *Colpito:* 36 (4d12 + 10) danni perforanti, e il bersaglio è afferrato (CD 20 per sfuggire). Finché la presa perdura, il bersaglio è trattenuto e non può teletrasportarsi.

### Ruggito tonante (ricarica 5-6)

*Tiro salvezza su Costituzione:* CD 27, ogni creatura e oggetto che non sia indossato o trasportato in un cono di 45 metri. *Fallimento:* 78 (12d12) danni da tuono, e il bersaglio è assordato e spaventato fino al termine del proprio turno successivo. *Successo:* danni dimezzati.

## Azioni Leggendarie

## Opzioni

### Assalto brutale

Il tarrasque si muove fino a metà della sua velocità ed effettua un attacco Artiglio e un attacco Coda.

### Movimento sismico

Il tarrasque si muove fino alla sua velocità massima. Alla fine di questo movimento, crea un'onda d'urto istantanea in un'emanazione di 18 metri di cui il tarrasque è il punto di origine. Le creature in quell'area perdono la concentrazione e, se sono di taglia Media o inferiore, cadono a terra prone. Il tarrasque non può ripetere quest'azione fino all'inizio del proprio turno successivo.

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.