---
id: "srd-diavolo_della_fossa"
srd_id: "diavolo_della_fossa"
nome: "Diavolo della fossa"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Diavolo della fossa]]"]
riferimenti_srd: ["[[SRD/Mostri/Diavolo della fossa]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-aura-di-paura]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-resistenza-alla-magia]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-resistenza-leggendaria-4-giorno]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-ristoro-diabolico]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-multiattacco]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-artiglio-diabolico]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-mazza-fiammeggiante]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-morso]]", "[[SRD/Mostri/Diavolo della fossa#^srd-diavolo_della_fossa-incantesimi-del-fuoco-infernale-ricarica-4-6]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Diavolo della fossa"
type: "Immondo (diavolo)"
size: "grande"
alignment: "legale malvagio"
ac: 21
stats: [26, 14, 24, 22, 18, 24]
saves: 
  dex: 8
  wis: 10
skillsaves: 
  percezione: 10
  persuasione: 19
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 20, vista_pura: 36 m"
languages: "Infernale, telepatia 36 m"
cr: 20
traits: 
- name: "Aura di paura"
  desc: "Il diavolo della fossa irradia un'aura in un'emanazione di 6 metri fintanto che non è incapacitato.\n\n*Tiro salvezza su Saggezza:* CD 21, qualsiasi nemico che inizi il suo turno all'interno dell'aura.\n\n*Fallimento:* il bersaglio è spaventato fino all'inizio del proprio turno successivo.\n\n*Successo:* il bersaglio è immune all'aura di questo diavolo della fossa per 24 ore."
- name: "Resistenza alla magia"
  desc: "Il diavolo della fossa dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
- name: "Resistenza leggendaria (4/giorno)"
  desc: "Se il diavolo della fossa fallisce un tiro salvezza, può scegliere di superarlo comunque."
- name: "Ristoro diabolico"
  desc: "Se il diavolo della fossa muore al di fuori dei Nove Inferi, il suo corpo si dissolve in fumo sulfureo e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nei Nove Inferi."
actions: 
- name: "Multiattacco"
  desc: "Il diavolo della fossa effettua un attacco Morso, due attacchi Artiglio diabolico e un attacco Mazza fiammeggiante."
- name: "Artiglio diabolico"
  desc: "*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 26 (4d8 + 8) danni necrotici."
- name: "Mazza fiammeggiante"
  desc: "*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 22 (4d6 + 8) danni da forza più 21 (6d6) danni da fuoco."
- name: "Morso"
  desc: "*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 18 (3d6 + 8) danni perforanti. Se il bersaglio è una creatura, deve effettuare il seguente tiro salvezza.\n\n*Tiro salvezza su Costituzione:* CD 21.\n\n*Fallimento:* il bersaglio viene avvelenato. Finché è avvelenato, il bersaglio non può recuperare punti ferita e subisce 21 (6d6) danni da veleno all'inizio di ogni suo turno; il bersaglio ripete il tiro salvezza al termine di ogni suo turno e, se lo supera, l'effetto svanisce. Dopo 1 minuto, la prova viene superata automaticamente."
- name: "Incantesimi del fuoco infernale (ricarica 4-6)"
  desc: "Il diavolo della fossa lancia palla di fuoco (di 5º livello) due volte, senza bisogno di componenti materiali e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 21). Può sostituire un incantesimo palla di fuoco con blocca mostri (di 7º livello) o con muro di fuoco."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Immondo (diavolo)"
dimensione: "Grande"
allineamento: "legale malvagio"
classe_armatura: 21
iniziativa: 14
hp: 337
hit_dice: "27d10 + 189"
speed: "camminata: 9 m, volo: 18 m"
xp: 25000
bonus_competenza: 6
statblock: true
---
# Diavolo della fossa

````tabs
tab: Scheda
```statblock
monster: Diavolo della fossa
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Grande Immondo (diavolo), legale malvagio
> CA: 21
> PF: 337 (27d10 + 189)
> Velocita: camminata: 9 m, volo: 18 m
> GS: 20 (PE 25.000; BC +6)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 26 | 8 | 8 |
| Destrezza | 14 | 2 | 8 |
| Costituzione | 24 | 7 | 7 |
| Intelligenza | 22 | 6 | 6 |
| Saggezza | 18 | 4 | 10 |
| Carisma | 24 | 7 | 7 |
## Abilita

percezione: 10, persuasione: 19
## Sensi

percezione_passiva: 20, vista_pura: 36 m
## Lingue

Infernale, telepatia 36 m
tab: Azioni
## Tratti

### Aura di paura

Il diavolo della fossa irradia un'aura in un'emanazione di 6 metri fintanto che non è incapacitato.

*Tiro salvezza su Saggezza:* CD 21, qualsiasi nemico che inizi il suo turno all'interno dell'aura.

*Fallimento:* il bersaglio è spaventato fino all'inizio del proprio turno successivo.

*Successo:* il bersaglio è immune all'aura di questo diavolo della fossa per 24 ore.
^srd-diavolo_della_fossa-aura-di-paura

### Resistenza alla magia

Il diavolo della fossa dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.
^srd-diavolo_della_fossa-resistenza-alla-magia

### Resistenza leggendaria (4/giorno)

Se il diavolo della fossa fallisce un tiro salvezza, può scegliere di superarlo comunque.
^srd-diavolo_della_fossa-resistenza-leggendaria-4-giorno

### Ristoro diabolico

Se il diavolo della fossa muore al di fuori dei Nove Inferi, il suo corpo si dissolve in fumo sulfureo e ne acquisisce uno nuovo all'istante, tornando in vita con tutti i suoi punti ferita da qualche parte nei Nove Inferi.
^srd-diavolo_della_fossa-ristoro-diabolico
## Azioni

### Multiattacco

Il diavolo della fossa effettua un attacco Morso, due attacchi Artiglio diabolico e un attacco Mazza fiammeggiante.
^srd-diavolo_della_fossa-multiattacco

### Artiglio diabolico

*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 26 (4d8 + 8) danni necrotici.
^srd-diavolo_della_fossa-artiglio-diabolico

### Mazza fiammeggiante

*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 22 (4d6 + 8) danni da forza più 21 (6d6) danni da fuoco.
^srd-diavolo_della_fossa-mazza-fiammeggiante

### Morso

*Tiro per colpire in mischia:* +14, portata 3 m. *Colpito:* 18 (3d6 + 8) danni perforanti. Se il bersaglio è una creatura, deve effettuare il seguente tiro salvezza.

*Tiro salvezza su Costituzione:* CD 21.

*Fallimento:* il bersaglio viene avvelenato. Finché è avvelenato, il bersaglio non può recuperare punti ferita e subisce 21 (6d6) danni da veleno all'inizio di ogni suo turno; il bersaglio ripete il tiro salvezza al termine di ogni suo turno e, se lo supera, l'effetto svanisce. Dopo 1 minuto, la prova viene superata automaticamente.
^srd-diavolo_della_fossa-morso

### Incantesimi del fuoco infernale (ricarica 4-6)

Il diavolo della fossa lancia palla di fuoco (di 5º livello) due volte, senza bisogno di componenti materiali e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 21). Può sostituire un incantesimo palla di fuoco con blocca mostri (di 7º livello) o con muro di fuoco.
^srd-diavolo_della_fossa-incantesimi-del-fuoco-infernale-ricarica-4-6
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.