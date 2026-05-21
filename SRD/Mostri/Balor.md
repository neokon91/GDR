---
id: "srd-balor"
srd_id: "balor"
nome: "Balor"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Balor]]"]
riferimenti_srd: ["[[SRD/Mostri/Balor]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Balor#^srd-balor-aura-di-fuoco]]", "[[SRD/Mostri/Balor#^srd-balor-resistenza-alla-magia]]", "[[SRD/Mostri/Balor#^srd-balor-resistenza-leggendaria-3-giorno]]", "[[SRD/Mostri/Balor#^srd-balor-spasmi-di-morte]]", "[[SRD/Mostri/Balor#^srd-balor-multiattacco]]", "[[SRD/Mostri/Balor#^srd-balor-frusta-fiammeggiante]]", "[[SRD/Mostri/Balor#^srd-balor-lama-fulminante]]", "[[SRD/Mostri/Balor#^srd-balor-teletrasporto]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Balor"
type: "Immondo (demone)"
size: "enorme"
alignment: "caotico malvagio"
ac: 19
stats: [26, 15, 22, 20, 16, 22]
saves: 
  con: 12
  wis: 9
skillsaves: 
  percezione: 9
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 19, vista_pura: 36 m"
languages: "Abissale, telepatia 36 m"
cr: 19
traits: 
- name: "Aura di fuoco"
  desc: "Al termine di ogni turno del balor, tutte le creature in un'emanazione di 1,5 metri di cui il balor è il punto di origine subiscono 13 (3d8) danni da fuoco."
- name: "Resistenza alla magia"
  desc: "Il balor dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
- name: "Resistenza leggendaria (3/giorno)"
  desc: "Se il balor fallisce un tiro salvezza, può scegliere di superarlo comunque."
- name: "Spasmi di morte"
  desc: "Quando il balor muore, esplode. *Tiro salvezza su Destrezza:* CD 20, tutte le creature in u n'emanazione di 9 metri di cui il balor è il punto di origine. *Fallimento:* 31 (9d6) danni da fuoco più 31 (9d6) danni da forza. *Successo:* danni dimezzati. Fallimento o successo: se il balor muore al di fuori dell'Abisso, acquisisce un corpo nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nell'Abisso."
actions: 
- name: "Multiattacco"
  desc: "Il balor effettua un attacco Frusta fiammeggiante e un attacco Lama fulminante."
- name: "Frusta fiammeggiante"
  desc: "*Tiro per colpire in mischia:* +14, portata 9 m. *Colpito:* 18 (3d6 + 8) danni da forza più 17 (5d6) danni da fuoco. Se il bersaglio è una creatura di taglia Enorme o inferiore, il balor trascina il bersaglio in linea retta verso di sé fino a 7,5 metri, e il bersaglio cade a terra prono."
- name: "Lama fulminante"
  desc: "*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 21 (3d8 + 8) danni da forza più 22 (4d10) danni da fulmine, e il bersaglio non può effettuare reazioni fino all'inizio del turno successivo del balor."
bonus_actions: 
- name: "Teletrasporto"
  desc: "Il balor teletrasporta se stesso (o un demone consenziente entro 3 metri da sé) fino a 18 metri in uno spazio libero che il balor è in grado di vedere."
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo (demone)"
dimensione: "Enorme"
allineamento: "caotico malvagio"
classe_armatura: 19
iniziativa: 14
hp: 287
hit_dice: "23d12 + 138"
speed: "camminata: 12 m, volo: 24 m"
xp: 22000
bonus_competenza: 6
statblock: true
---
# Balor

````tabs
tab: Scheda
```statblock
monster: Balor
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Enorme Immondo (demone), caotico malvagio
> CA: 19
> PF: 287 (23d12 + 138)
> Velocita: camminata: 12 m, volo: 24 m
> GS: 19 (PE 22.000; BC +6)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 26 | 8 | 8 |
| Destrezza | 15 | 2 | 2 |
| Costituzione | 22 | 6 | 12 |
| Intelligenza | 20 | 5 | 5 |
| Saggezza | 16 | 3 | 9 |
| Carisma | 22 | 6 | 6 |
## Abilita

percezione: 9
## Sensi

percezione_passiva: 19, vista_pura: 36 m
## Lingue

Abissale, telepatia 36 m
tab: Azioni
## Tratti

### Aura di fuoco

Al termine di ogni turno del balor, tutte le creature in un'emanazione di 1,5 metri di cui il balor è il punto di origine subiscono 13 (3d8) danni da fuoco.
^srd-balor-aura-di-fuoco

### Resistenza alla magia

Il balor dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.
^srd-balor-resistenza-alla-magia

### Resistenza leggendaria (3/giorno)

Se il balor fallisce un tiro salvezza, può scegliere di superarlo comunque.
^srd-balor-resistenza-leggendaria-3-giorno

### Spasmi di morte

Quando il balor muore, esplode. *Tiro salvezza su Destrezza:* CD 20, tutte le creature in u n'emanazione di 9 metri di cui il balor è il punto di origine. *Fallimento:* 31 (9d6) danni da fuoco più 31 (9d6) danni da forza. *Successo:* danni dimezzati. Fallimento o successo: se il balor muore al di fuori dell'Abisso, acquisisce un corpo nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nell'Abisso.
^srd-balor-spasmi-di-morte
## Azioni

### Multiattacco

Il balor effettua un attacco Frusta fiammeggiante e un attacco Lama fulminante.
^srd-balor-multiattacco

### Frusta fiammeggiante

*Tiro per colpire in mischia:* +14, portata 9 m. *Colpito:* 18 (3d6 + 8) danni da forza più 17 (5d6) danni da fuoco. Se il bersaglio è una creatura di taglia Enorme o inferiore, il balor trascina il bersaglio in linea retta verso di sé fino a 7,5 metri, e il bersaglio cade a terra prono.
^srd-balor-frusta-fiammeggiante

### Lama fulminante

*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 21 (3d8 + 8) danni da forza più 22 (4d10) danni da fulmine, e il bersaglio non può effettuare reazioni fino all'inizio del turno successivo del balor.
^srd-balor-lama-fulminante
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.