---
id: "srd-signore_delle_mummie"
srd_id: "signore_delle_mummie"
nome: "Signore delle mummie"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Signore delle mummie]]"]
riferimenti_srd: ["[[SRD/Mostri/Signore delle mummie]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-resistenza-alla-magia]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-resistenza-leggendaria-3-giorno-o-4-giorno-nella-tana]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-ristoro-non-morto]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-multiattacco]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-pugno-di-putrefazione]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-incanalare-energia-negativa]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-incantesimi]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-sguardo-funesto]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-vortice-di-sabbia]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-colpo-necrotico]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-comando-intimidatorio]]", "[[SRD/Mostri/Signore delle mummie#^srd-signore_delle_mummie-sguardo]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Signore delle mummie"
type: "Non morto (chierico)"
size: "medio o piccolo"
alignment: "legale malvagio"
ac: 17
stats: [18, 10, 17, 11, 19, 16]
saves: 
  int: 5
  wis: 9
skillsaves: 
  percezione: 9
  religione: 5
  storia: 5
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 19, vista_pura: 18 m"
languages: "Comune più altre tre lingue"
cr: 15
traits: 
- name: "Resistenza alla magia"
  desc: "Il signore delle mummie dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici."
- name: "Resistenza leggendaria (3/giorno o 4/giorno nella tana)"
  desc: "Se il signore delle mummie fallisce un tiro salvezza, può scegliere di superarlo comunque."
- name: "Ristoro non morto"
  desc: "Se annientata, la mummia acquisisce un nuovo corpo dopo 24 ore se il suo cuore è intatto, tornando in vita con tutti i suoi punti ferita. Il nuovo corpo appare in uno spazio libero all'interno della tana della mummia. Il cuore è un oggetto di taglia Minuscola con CA 17, PF 10 e immunità a tutti i danni, eccetto ai danni da fuoco."
actions: 
- name: "Multiattacco"
  desc: "Il signore delle mummie effettua un attacco Pugno di putrefazione o Incanalare energia negativa, e usa Sguardo funesto."
- name: "Pugno di putrefazione"
  desc: "*Tiro per colpire in mischia:* +9, portata 1,5 m *Colpito:* 15 (2d10 + 4) danni contundenti più 10 (3d6) danni necrotici. Se il bersaglio è una creatura, viene maledetto. Finché è maledetto, il bersaglio non può recuperare punti ferita, non ottiene alcun beneficio dai riposi lunghi, e i suoi punti ferita massimi sono ridotti di 10 (3d6) ogni 24 ore trascorse. Una creatura muore e si disintegra in polvere se viene ridotta a 0 punti ferita da questo attacco."
- name: "Incanalare energia negativa"
  desc: "*Tiro per colpire a distanza:* +9, gittata 18 m. *Colpito:* 25 (6d6 + 4) danni necrotici."
- name: "Incantesimi"
  desc: "Il signore delle mummie lancia uno dei seguenti incantesimi, senza bisogno di componenti materiali, utilizzando Saggezza come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 17, +9 al tiro per colpire degli attacchi con incantesimo): 1/giorno ciascuno: Animare morti, ferire, piaga degli insetti (di 7º livello) A volontà: Dissolvi magie, taumaturgia"
- name: "Sguardo funesto"
  desc: "*Tiro salvezza su Saggezza:* CD 17, una creatura che la mummia è in grado di vedere entro 18 metri. *Fallimento:* 25 (6d6 + 4) danni psichici, e il bersaglio è paralizzato fino al termine del turno successivo della mummia."
bonus_actions: []
reactions: 
- name: "Vortice di sabbia"
  desc: "Attivazione: la mummia viene colpita con un tiro per colpire. Esito: la mummia aggiunge 2 alla sua CA contro quell'attacco, aumentando le probabilità che il colpo non vada a segno, e si teletrasporta fino a 18 metri in uno spazio libero che è in grado di vedere. Ogni creatura a sua scelta che è in grado di vedere entro 1,5 metri dallo spazio di destinazione è accecata fino al termine del turno successivo della mummia."
legendary_actions: 
- name: "Colpo necrotico"
  desc: "La mummia effettua un attacco Pugno di putrefazione o Incanalare energia negativa."
- name: "Comando intimidatorio"
  desc: "La mummia lancia comando (di 2º livello), utilizzando la stessa caratteristica da incantatore di Incantesimi. Non può ripetere quest'azione fino all'inizio del proprio turno successivo."
- name: "Sguardo"
  desc: "La mummia usa Sguardo funesto. Non può ripetere quest'azione fino all'inizio del proprio turno successivo."
lair_actions: []
tipo_creatura: "Non morto (chierico)"
dimensione: "Medio o Piccolo"
allineamento: "legale malvagio"
classe_armatura: 17
iniziativa: 10
hp: 187
hit_dice: "25d8 + 75"
speed: "camminata: 9 m"
xp: 13000
bonus_competenza: 5
statblock: true
---
# Signore delle mummie

````tabs
tab: Scheda
```statblock
monster: Signore delle mummie
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio o Piccolo Non morto (chierico), legale malvagio
> CA: 17
> PF: 187 (25d8 + 75)
> Velocita: camminata: 9 m
> GS: 15 (PE 13.000, o 15.000 nella tana; BC +5)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 18 | 4 | 4 |
| Destrezza | 10 | 0 | 0 |
| Costituzione | 17 | 3 | 3 |
| Intelligenza | 11 | 0 | 5 |
| Saggezza | 19 | 4 | 9 |
| Carisma | 16 | 3 | 3 |
## Abilita

percezione: 9, religione: 5, storia: 5
## Sensi

percezione_passiva: 19, vista_pura: 18 m
## Lingue

Comune più altre tre lingue
tab: Azioni
## Tratti

### Resistenza alla magia

Il signore delle mummie dispone di vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.
^srd-signore_delle_mummie-resistenza-alla-magia

### Resistenza leggendaria (3/giorno o 4/giorno nella tana)

Se il signore delle mummie fallisce un tiro salvezza, può scegliere di superarlo comunque.
^srd-signore_delle_mummie-resistenza-leggendaria-3-giorno-o-4-giorno-nella-tana

### Ristoro non morto

Se annientata, la mummia acquisisce un nuovo corpo dopo 24 ore se il suo cuore è intatto, tornando in vita con tutti i suoi punti ferita. Il nuovo corpo appare in uno spazio libero all'interno della tana della mummia. Il cuore è un oggetto di taglia Minuscola con CA 17, PF 10 e immunità a tutti i danni, eccetto ai danni da fuoco.
^srd-signore_delle_mummie-ristoro-non-morto
## Azioni

### Multiattacco

Il signore delle mummie effettua un attacco Pugno di putrefazione o Incanalare energia negativa, e usa Sguardo funesto.
^srd-signore_delle_mummie-multiattacco

### Pugno di putrefazione

*Tiro per colpire in mischia:* +9, portata 1,5 m *Colpito:* 15 (2d10 + 4) danni contundenti più 10 (3d6) danni necrotici. Se il bersaglio è una creatura, viene maledetto. Finché è maledetto, il bersaglio non può recuperare punti ferita, non ottiene alcun beneficio dai riposi lunghi, e i suoi punti ferita massimi sono ridotti di 10 (3d6) ogni 24 ore trascorse. Una creatura muore e si disintegra in polvere se viene ridotta a 0 punti ferita da questo attacco.
^srd-signore_delle_mummie-pugno-di-putrefazione

### Incanalare energia negativa

*Tiro per colpire a distanza:* +9, gittata 18 m. *Colpito:* 25 (6d6 + 4) danni necrotici.
^srd-signore_delle_mummie-incanalare-energia-negativa

### Incantesimi

Il signore delle mummie lancia uno dei seguenti incantesimi, senza bisogno di componenti materiali, utilizzando Saggezza come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 17, +9 al tiro per colpire degli attacchi con incantesimo): 1/giorno ciascuno: Animare morti, ferire, piaga degli insetti (di 7º livello) A volontà: Dissolvi magie, taumaturgia
^srd-signore_delle_mummie-incantesimi

### Sguardo funesto

*Tiro salvezza su Saggezza:* CD 17, una creatura che la mummia è in grado di vedere entro 18 metri. *Fallimento:* 25 (6d6 + 4) danni psichici, e il bersaglio è paralizzato fino al termine del turno successivo della mummia.
^srd-signore_delle_mummie-sguardo-funesto
## Azioni Leggendarie

Subito dopo il turno di un'altra creatura, la mummia può consumare un utilizzo per effettuare una delle seguenti azioni. La mummia recupera tutti gli utilizzi consumati all'inizio di ogni suo turno.

## Opzioni

### Colpo necrotico

La mummia effettua un attacco Pugno di putrefazione o Incanalare energia negativa.
^srd-signore_delle_mummie-colpo-necrotico

### Comando intimidatorio

La mummia lancia comando (di 2º livello), utilizzando la stessa caratteristica da incantatore di Incantesimi. Non può ripetere quest'azione fino all'inizio del proprio turno successivo.
^srd-signore_delle_mummie-comando-intimidatorio

### Sguardo

La mummia usa Sguardo funesto. Non può ripetere quest'azione fino all'inizio del proprio turno successivo.
^srd-signore_delle_mummie-sguardo
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.