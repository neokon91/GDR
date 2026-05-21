---
id: "srd-golem_di_carne"
srd_id: "golem_di_carne"
nome: "Golem di carne"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Golem di carne]]"]
riferimenti_srd: ["[[SRD/Mostri/Golem di carne]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-assorbimento-del-fulmine]]", "[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-avversione-al-fuoco]]", "[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-berserk]]", "[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-forma-immutabile]]", "[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-resistenza-alla-magia]]", "[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-multiattacco]]", "[[SRD/Mostri/Golem di carne#^srd-golem_di_carne-schianto]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Golem di carne"
type: "Costrutto"
size: "medio"
alignment: "neutrale"
ac: 9
stats: [19, 9, 18, 6, 10, 5]
saves: {}
skillsaves: {}
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 10, scurovisione: 18 m"
languages: "capisce il Comune più un'altra lingua ma non le parla"
cr: 5
traits: 
- name: "Assorbimento del fulmine"
  desc: "Ogni volta che il golem subisce danni da fulmine, recupera un numero di punti ferita pari ai danni da fulmine inflitti."
- name: "Avversione al fuoco"
  desc: "Se il golem subisce danni da fuoco, subisce svantaggio ai tiri per colpire e alle prove di caratteristica fino al termine del proprio turno successivo."
- name: "Berserk"
  desc: "Ogni volta che il golem inizia il suo turno sanguinante, tira 1d6. Se esce 6, il golem entra in uno stato di berserk. A ogni suo turno, finché è in stato di berserk, il golem attacca la creatura più vicina che è in grado di vedere. Se nessuna creatura è abbastanza vicina per essere attaccata, il golem si scaglia contro un oggetto. Una volta che il golem entra in stato di berserk, rimane in questo stato finché non viene distrutto o non è più sanguinante. Il creatore del golem, se si trova entro 18 metri dal golem in stato di berserk, può cercare di calmarlo eseguendo un'azione per effettuare una prova di Carisma (Persuasione) con CD 15. Il golem deve essere in grado di udire il suo creatore. Se la prova ha successo, il golem esce dallo stato di berserk fino all'inizio del proprio turno successivo; a quel punto, se è ancora sanguinante, riprende a effettuare il tiro del tratto Berserk."
- name: "Forma immutabile"
  desc: "Il golem non può mutare forma."
- name: "Resistenza alla magia"
  desc: "Il golem dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
actions: 
- name: "Multiattacco"
  desc: "Il golem effettua due attacchi Schianto."
- name: "Schianto"
  desc: "*Tiro per colpire in mischia:* +7, portata 1,5 m. *Colpito:* 13 (2d8 + 4) danni contundenti più 4 (1d8) danni da fulmine."
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
tipo_creatura: "Costrutto"
dimensione: "Medio"
allineamento: "neutrale"
classe_armatura: 9
iniziativa: -1
hp: 127
hit_dice: "15d8 + 60"
speed: "camminata: 9 m"
xp: 1800
bonus_competenza: 3
statblock: true
---
# Golem di carne

````tabs
tab: Scheda
```statblock
monster: Golem di carne
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio Costrutto, neutrale
> CA: 9
> PF: 127 (15d8 + 60)
> Velocita: camminata: 9 m
> GS: 5 (PE 1.800; BC +3)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 19 | 4 | 4 |
| Destrezza | 9 | -1 | -1 |
| Costituzione | 18 | 4 | 4 |
| Intelligenza | 6 | -2 | -2 |
| Saggezza | 10 | 0 | 0 |
| Carisma | 5 | -3 | -3 |
## Sensi

percezione_passiva: 10, scurovisione: 18 m
## Lingue

capisce il Comune più un'altra lingua ma non le parla
tab: Azioni
## Tratti

### Assorbimento del fulmine

Ogni volta che il golem subisce danni da fulmine, recupera un numero di punti ferita pari ai danni da fulmine inflitti.
^srd-golem_di_carne-assorbimento-del-fulmine

### Avversione al fuoco

Se il golem subisce danni da fuoco, subisce svantaggio ai tiri per colpire e alle prove di caratteristica fino al termine del proprio turno successivo.
^srd-golem_di_carne-avversione-al-fuoco

### Berserk

Ogni volta che il golem inizia il suo turno sanguinante, tira 1d6. Se esce 6, il golem entra in uno stato di berserk. A ogni suo turno, finché è in stato di berserk, il golem attacca la creatura più vicina che è in grado di vedere. Se nessuna creatura è abbastanza vicina per essere attaccata, il golem si scaglia contro un oggetto. Una volta che il golem entra in stato di berserk, rimane in questo stato finché non viene distrutto o non è più sanguinante. Il creatore del golem, se si trova entro 18 metri dal golem in stato di berserk, può cercare di calmarlo eseguendo un'azione per effettuare una prova di Carisma (Persuasione) con CD 15. Il golem deve essere in grado di udire il suo creatore. Se la prova ha successo, il golem esce dallo stato di berserk fino all'inizio del proprio turno successivo; a quel punto, se è ancora sanguinante, riprende a effettuare il tiro del tratto Berserk.
^srd-golem_di_carne-berserk

### Forma immutabile

Il golem non può mutare forma.
^srd-golem_di_carne-forma-immutabile

### Resistenza alla magia

Il golem dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.
^srd-golem_di_carne-resistenza-alla-magia
## Azioni

### Multiattacco

Il golem effettua due attacchi Schianto.
^srd-golem_di_carne-multiattacco

### Schianto

*Tiro per colpire in mischia:* +7, portata 1,5 m. *Colpito:* 13 (2d8 + 4) danni contundenti più 4 (1d8) danni da fulmine.
^srd-golem_di_carne-schianto
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.