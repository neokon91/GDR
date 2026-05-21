---
id: "srd-vampiro"
srd_id: "vampiro"
nome: "Vampiro"
categoria: "srd"
tipo: "mostro"
stato: "pronto"
canonico: false
fonte: "SRD 5.2.1"
licenza: "CC-BY-4.0"
repository: "neokon91/DND-SRD-IT"
generato_da: "import_srd"
fonti: ["[[SRD/Licenza SRD]]", "[[SRD/Mostri/Vampiro]]"]
riferimenti_srd: ["[[SRD/Mostri/Vampiro]]"]
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: ["[[SRD/Mostri/Vampiro#^srd-vampiro-acqua-corrente]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-debolezze-dei-vampiri]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-fuga-nebbiosa]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-luce-del-sole]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-movimenti-del-ragno]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-paletto-nel-cuore]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-proibizione]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-resistenza-leggendaria-3-giorno-o-4-giorno-nella-tana]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-multiattacco-solo-in-forma-di-vampiro]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-colpo-tombale-solo-in-forma-di-vampiro]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-morso-solo-in-forma-di-pipistrello-o-vampiro]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-fascino-ricarica-5-6]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-mutaforma]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-qualsiasi-cosa-indossi-si-trasforma-insieme-a-lui]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-colpo-immortale]]", "[[SRD/Mostri/Vampiro#^srd-vampiro-incantare]]"]
tabelle_collegate: []
tags: ["dnd55/srd", "dnd55/creatura"]
name: "Vampiro"
type: "Non morto"
size: "medio o piccolo"
alignment: "legale malvagio"
ac: 16
stats: [18, 18, 18, 17, 15, 18]
saves: 
  dex: 9
  con: 9
  wis: 7
  cha: 9
skillsaves: 
  furtivita: 9
  percezione: 7
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses: "percezione_passiva: 17, scurovisione: 36 m"
languages: "Comune più altre due lingue"
cr: 13
traits: 
- name: "Acqua corrente"
  desc: "Il vampiro subisce 20 danni da acido se termina il suo turno nell'acqua corrente."
- name: "Debolezze dei vampiri"
  desc: "Il vampiro ha le seguenti debolezze:"
- name: "Fuga nebbiosa"
  desc: "Se il vampiro scende a 0 punti ferita al di fuori del suo luogo di riposo, usa Mutaforma per trasformarsi in nebbia (nessuna azione richiesta). Se non può usare Mutaforma, viene distrutto. Finché ha 0 punti ferita in forma nebbiosa, non può tornare alla forma di vampiro e deve raggiungere il suo luogo di riposo entro 2 ore, altrimenti viene distrutto. Una volta raggiunto il luogo di riposo, torna alla forma di vampiro ed è paralizzato finché non recupera un qualsiasi numero di punti ferita; recupera 1 punto ferita una volta trascorsa 1 ora in questo stato."
- name: "Luce del sole"
  desc: "Il vampiro subisce 20 danni radiosi quando inizia il suo turno alla luce del sole. Finché è esposto alla luce del sole, subisce svantaggio a tiri per colpire e prove di caratteristica."
- name: "Movimenti del ragno"
  desc: "Il vampiro può scalare le superfici difficili, compresi i soffitti, senza effettuare una prova di caratteristica."
- name: "Paletto nel cuore"
  desc: "Se un'arma che infligge danni perforanti gli viene conficcata nel cuore mentre è incapacitato nel suo luogo di riposo, il vampiro è paralizzato finché non viene rimossa l'arma."
- name: "Proibizione"
  desc: "Il vampiro non può entrare in casa di qualcuno se non viene invitato da chi vi risiede."
- name: "Resistenza leggendaria (3/giorno o 4/giorno nella tana)"
  desc: "Se il vampiro fallisce un tiro salvezza, può scegliere di superarlo comunque."
actions: 
- name: "Multiattacco (solo in forma di vampiro)"
  desc: "Il vampiro effettua due attacchi Colpo tombale e usa Morso."
- name: "Colpo tombale (solo in forma di vampiro)"
  desc: "*Tiro per colpire in mischia:* +9, portata 1,5 m. *Colpito:* 8 (1d8 + 4) danni contundenti più 7 (2d6) danni necrotici. Se il bersaglio è una creatura di taglia Grande o inferiore, è afferrato (CD 14 per sfuggire) da una delle due mani."
- name: "Morso (solo in forma di pipistrello o vampiro)"
  desc: "*Tiro salvezza su Costituzione:* CD 17, una creatura entro 1,5 metri che sia consenziente, afferrata, incapacitata o trattenuta. *Fallimento:* 6 (1d4 + 4) danni perforanti più 13 (3d8) danni necrotici. I punti ferita massimi del bersaglio sono ridotti di un ammontare pari ai danni necrotici subiti, e il vampiro recupera punti ferita pari a quell'ammontare. Un umanoide ridotto a 0 punti ferita da questi danni e poi sepolto, risorge al tramonto seguente in forma di progenie vampirica controllata dal vampiro."
bonus_actions: 
- name: "Fascino (ricarica 5-6)"
  desc: "Il vampiro lancia charme su persone, senza bisogno di componenti e utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 17), con una durata di 24 ore. Il bersaglio affascinato si presta di suo spontanea volontà a Morso del vampiro; i danni subiti non pongono fine all'incantesimo. Al termine dell'incantesimo, il bersaglio non sa di essere stato affascinato dal vampiro."
- name: "Mutaforma"
  desc: "Se il vampiro non è alla luce del sole o in acqua corrente, si trasforma in un pipistrello di taglia Minuscola (velocità 1,5 metri, volo 9 metri) o una nube di nebbia di taglia Media (velocità 1,5 metri, volo 6 metri [fluttuare]), oppure torna alla forma di vampiro."
- name: "Qualsiasi cosa indossi, si trasforma insieme a lui"
  desc: "Finché è in forma di pipistrello, il vampiro non può parlare. Le sue statistiche di gioco, a eccezione della taglia e della velocità, non cambiano. Finché è in forma di nebbia, il vampiro non può effettuare alcuna azione, né parlare o manipolare oggetti. Non ha peso e può entrare nello spazio di un nemico e fermarvisi. Inoltre, se l'aria può passare attraverso uno spazio, anche la nebbia può farlo, ma non può attraversare l'acqua. È resistente a tutti i danni, eccetto quelli subiti dalla luce del sole."
reactions: []
legendary_actions: 
- name: "Colpo immortale"
  desc: "Il vampiro si muove fino a metà della sua velocità, ed effettua un attacco Colpo tombale."
- name: "Incantare"
  desc: "Il vampiro lancia comando senza bisogno di componenti, utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 17). Il vampiro non può ripetere quest'azione fino all'inizio del proprio turno successivo."
lair_actions: []
tipo_creatura: "Non morto"
dimensione: "Medio o Piccolo"
allineamento: "legale malvagio"
classe_armatura: 16
iniziativa: 14
hp: 195
hit_dice: "23d8 + 92"
speed: "camminata: 12 m, scalata: 12 m"
xp: 10000
bonus_competenza: 5
statblock: true
---
# Vampiro

````tabs
tab: Scheda
```statblock
monster: Vampiro
```
tab: Dettagli
> [!infobox|wiki]- Mostro SRD
> Tipo: Medio o Piccolo Non morto, legale malvagio
> CA: 16
> PF: 195 (23d8 + 92)
> Velocita: camminata: 12 m, scalata: 12 m
> GS: 13 (PE 10.000, o 11.500 nella tana; BC +5)
## Caratteristiche
| Caratteristica | Punteggio | Modificatore | Tiro Salvezza |
| --- | --- | --- | --- |
| Forza | 18 | 4 | 4 |
| Destrezza | 18 | 4 | 9 |
| Costituzione | 18 | 4 | 9 |
| Intelligenza | 17 | 3 | 3 |
| Saggezza | 15 | 2 | 7 |
| Carisma | 18 | 4 | 9 |
## Abilita

furtivita: 9, percezione: 7
## Sensi

percezione_passiva: 17, scurovisione: 36 m
## Lingue

Comune più altre due lingue
tab: Azioni
## Tratti

### Acqua corrente

Il vampiro subisce 20 danni da acido se termina il suo turno nell'acqua corrente.
^srd-vampiro-acqua-corrente

### Debolezze dei vampiri

Il vampiro ha le seguenti debolezze:
^srd-vampiro-debolezze-dei-vampiri

### Fuga nebbiosa

Se il vampiro scende a 0 punti ferita al di fuori del suo luogo di riposo, usa Mutaforma per trasformarsi in nebbia (nessuna azione richiesta). Se non può usare Mutaforma, viene distrutto. Finché ha 0 punti ferita in forma nebbiosa, non può tornare alla forma di vampiro e deve raggiungere il suo luogo di riposo entro 2 ore, altrimenti viene distrutto. Una volta raggiunto il luogo di riposo, torna alla forma di vampiro ed è paralizzato finché non recupera un qualsiasi numero di punti ferita; recupera 1 punto ferita una volta trascorsa 1 ora in questo stato.
^srd-vampiro-fuga-nebbiosa

### Luce del sole

Il vampiro subisce 20 danni radiosi quando inizia il suo turno alla luce del sole. Finché è esposto alla luce del sole, subisce svantaggio a tiri per colpire e prove di caratteristica.
^srd-vampiro-luce-del-sole

### Movimenti del ragno

Il vampiro può scalare le superfici difficili, compresi i soffitti, senza effettuare una prova di caratteristica.
^srd-vampiro-movimenti-del-ragno

### Paletto nel cuore

Se un'arma che infligge danni perforanti gli viene conficcata nel cuore mentre è incapacitato nel suo luogo di riposo, il vampiro è paralizzato finché non viene rimossa l'arma.
^srd-vampiro-paletto-nel-cuore

### Proibizione

Il vampiro non può entrare in casa di qualcuno se non viene invitato da chi vi risiede.
^srd-vampiro-proibizione

### Resistenza leggendaria (3/giorno o 4/giorno nella tana)

Se il vampiro fallisce un tiro salvezza, può scegliere di superarlo comunque.
^srd-vampiro-resistenza-leggendaria-3-giorno-o-4-giorno-nella-tana
## Azioni

### Multiattacco (solo in forma di vampiro)

Il vampiro effettua due attacchi Colpo tombale e usa Morso.
^srd-vampiro-multiattacco-solo-in-forma-di-vampiro

### Colpo tombale (solo in forma di vampiro)

*Tiro per colpire in mischia:* +9, portata 1,5 m. *Colpito:* 8 (1d8 + 4) danni contundenti più 7 (2d6) danni necrotici. Se il bersaglio è una creatura di taglia Grande o inferiore, è afferrato (CD 14 per sfuggire) da una delle due mani.
^srd-vampiro-colpo-tombale-solo-in-forma-di-vampiro

### Morso (solo in forma di pipistrello o vampiro)

*Tiro salvezza su Costituzione:* CD 17, una creatura entro 1,5 metri che sia consenziente, afferrata, incapacitata o trattenuta. *Fallimento:* 6 (1d4 + 4) danni perforanti più 13 (3d8) danni necrotici. I punti ferita massimi del bersaglio sono ridotti di un ammontare pari ai danni necrotici subiti, e il vampiro recupera punti ferita pari a quell'ammontare. Un umanoide ridotto a 0 punti ferita da questi danni e poi sepolto, risorge al tramonto seguente in forma di progenie vampirica controllata dal vampiro.
^srd-vampiro-morso-solo-in-forma-di-pipistrello-o-vampiro
## Azioni Leggendarie

Subito dopo il turno di un'altra creatura, il vampiro può consumare un utilizzo per effettuare una delle seguenti azioni. Il vampiro recupera tutti gli utilizzi consumati all'inizio di ogni suo turno.

## Opzioni

### Colpo immortale

Il vampiro si muove fino a metà della sua velocità, ed effettua un attacco Colpo tombale.
^srd-vampiro-colpo-immortale

### Incantare

Il vampiro lancia comando senza bisogno di componenti, utilizzando Carisma come caratteristica da incantatore (CD del tiro salvezza sull'incantesimo 17). Il vampiro non può ripetere quest'azione fino all'inizio del proprio turno successivo.
^srd-vampiro-incantare
````

> [!info] Licenza
> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.