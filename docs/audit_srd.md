# Audit SRD IT — completezza e correttezza del contenuto generato

> ⏳ **STORICO (2026-08-20)** — audit di `build_srd.py` (pagine vault da `Dev/Source/SRD/*.json`).
> Valido per quel generatore, ma **non** copre il percorso `archivio/srd → plugin/data`
> (bestiario del motore/Board): sono due fonti dati SRD distinte — vedi [combat_engine.md](combat_engine.md).

**Data:** 2026-08-20 · **Tipo:** solo-report (nessun file del repo modificato)
**Ambito:** generatore `Dev/Tools/build_srd.py`, sorgenti `Dev/Source/SRD/*.json`, output generato in `dist/GDR-vault/SRD/`.

## Metodo

Confronto tra i JSON sorgente e le note prodotte in `dist/GDR-vault/SRD/`. Le
quantità di voci combaciano tra sorgente e output (nessuna voce persa):
incantesimi 339, mostri 334, oggetti magici 256, equipaggiamento 197, glossario
153 = Condizioni 15 + Glossario 138, regole 47, lingue 19, talenti 17, classi 12,
specie 9, background 4. Il problema non è la quantità ma la **profondità** di
alcune categorie e alcuni campi non mappati dal generatore.

Nota di natura: molte lacune nascono dai **dati sorgente** (i JSON di
`massimobarbieri/DND-SRD-IT`), non dal codice del generatore; dove invece è il
generatore a lasciare cadere un dato presente nel sorgente, lo segnalo come *bug
del mapper*.

---

## 1. Voci con campi mancanti / vuoti

### 1.1 Specie — tutte e 9 sono stub (CRITICO)
`Dev/Source/SRD/srd_5_2_1_species.json` → `dist/GDR-vault/SRD/Specie/`

Nessuna delle 9 specie ha blocchi di tratto (`blocchi = 0` in ogni sezione). La
sezione «Tratti» contiene **solo la sintesi di una riga** (`tratti_sintesi`), non
le meccaniche vere:

| Specie | Contenuto reale | Cosa manca |
|---|---|---|
| Dragonide | sintesi + tabella Antenati draconici | Soffio: dadi danno, CD, area, ricarica; Resistenza; Scurovisione; Volo draconico |
| Elfo | sintesi + tabella Lignaggi | effetti dei lignaggi, Scurovisione, Retaggio fatato, Trance |
| Tiefling | sintesi + tabella Retaggi | effetti dei retaggi immondi, incantesimi concessi |
| Gnomo, Goliath, Halfling, Nano, Orco, Umano | **solo** la sintesi di una riga | tutto: nessuna meccanica di tratto |

**Impatto al tavolo: ALTO.** La creazione del personaggio è core. Un giocatore
che sceglie Dragonide non trova quanti danni fa il soffio né la CD; Nano/Orco/
Umano non hanno alcun testo di tratto giocabile. Le note vanno bene come
promemoria del nome dei tratti, non come regole.

### 1.2 Mostri senza campi di gioco chiave
`dist/GDR-vault/SRD/Mostri/`

| Mostro | Campi mancanti | Natura |
|---|---|---|
| Insetto gigante | grado_sfida, punti_ferita, iniziativa, bonus_competenza | template evocato (statistiche variabili) |
| Cavalcatura ultraterrena | punti_ferita, bonus_competenza | evocazione (Cavalcare + Trova destriero) |
| Oggetto animato | punti_ferita, iniziativa, bonus_competenza | evocazione (Animare oggetti) |
| Spirito draconico | punti_ferita, bonus_competenza | evocazione scalata sul livello incantesimo |
| Boleto stridente | azioni | creatura passiva (solo reazione/urlo) |

**Impatto: MEDIO.** Sono creature-template/evocazione con stat variabili, ma
come schede di bestiario risultano statblock degradati: `hp`/`cr` omessi
lasciano il DM senza punti ferita e senza grado sfida sul colpo d'occhio.

### 1.3 Oggetti magici senza rarità (3)
`srd_5_2_1_magic_items.json`: **Bracciali dell'arciere**, **Sfera
annientatrice**, **Talismano del bene puro** hanno `rarita` assente.

**Impatto: MEDIO.** Doppio effetto: (a) l'infobox mostra solo il tipo, senza
fascia di rarità; (b) `srd_loot_pool()` filtra per rarità mappata, quindi questi
3 oggetti (fra cui 2 leggendari iconici) **non compaiono mai** nel bottino
casuale del generatore `tesoro`.

### 1.4 Equipaggiamento senza costo (7 strumenti)
Strumenti/borse senza `costo`: Scorte da alchimista, Strumenti da fabbro, da
falegname, Arnesi da scasso, Borsa da erborista, Strumento musicale, Trucchi per
il camuffamento (le 5 «Monete» sono giustamente prive di costo).

**Impatto: BASSO.** La tabella «Dettagli» dello strumento esce senza prezzo.

---

## 2. Link «Vedi anche» rotti (8)

`_vedi_anche()` risolve gli id via `srd_id_index()`; 8 voci di glossario puntano
a id-concetto che **non esistono** come voce SRD, quindi escono come testo in
chiaro invece che come link `[[…]]`:

| Voce glossario | id irrisolto |
|---|---|
| Allineamento | creazione_del_personaggio |
| Personaggio giocante | creazione_del_personaggio |
| Scheda del personaggio | creazione_del_personaggio |
| Arma | equipaggiamento |
| Competenza nelle armature | armatura |
| Incontro | interazioni_sociali |
| Punti esperienza | avanzamento_di_livello |
| Sintonia | oggetti_magici |

**Impatto: BASSO-MEDIO.** Nessun link rotto «hard» (il fallback è testo
leggibile), ma la navigazione promessa dal footer «Vedi anche» non funziona per
questi rimandi.

---

## 3. Statblock — campi 2024 non mappati

Verifica su `srd_statblock_yaml()` (mappa `tratti`, `azioni`, `azioni_bonus`,
`reazioni`, `azioni_leggendarie.azioni` + `descrizione_utilizzi`).

### 3.1 Conteggio azioni leggendarie perso (MEDIO-ALTO) — *bug del mapper*
Il sorgente ha `azioni_leggendarie.utilizzi` (es. Drago bianco adulto: `"Utilizzi
di azioni leggendarie 3 (4 nella tana)"`). Il mapper emette
`legendary_description` (= `descrizione_utilizzi`) e `legendary_actions`, ma
**non** `utilizzi`. Risultato: lo statblock elenca le azioni leggendarie senza
dire **quante** se ne possono usare per round. Riguarda tutte le ~30 creature con
azioni leggendarie.

### 3.2 Spellcasting — OK
Nel formato 2024 il lancio incantesimi è un'**azione** «Incantesimi» (vedi
Arcimago), correttamente mappata da `actions("azioni")`. Nessuna perdita.

### 3.3 Tana (lair) / regionali / mitici — assenti a monte
- **Lair:** il SRD 2024 non ha blocchi «azioni della tana» separati; la variante
  tana è ridotta a note testuali in `grado_sfida.raw` («… nella tana; BC +5») e
  in `azioni_leggendarie.utilizzi` («4 nella tana»). Il generatore scarta
  `grado_sfida.raw`, quindi la nota di tana sul PE/BC va persa.
- **Effetti regionali** e **azioni mitiche:** 0 occorrenze nel sorgente
  (`regional`/`mitic`). Non è un difetto di mappatura: non esistono nel dato.

**Impatto: MEDIO** (3.1) / **BASSO** (3.3).

---

## 4. Tabelle di progressione — nessuna incompleta (verificato)

Tutte e 12 le classi hanno progressione **1→20 completa** (20 righe ciascuna). Le
«celle vuote» dei caster (Bardo, Chierico, Mago, Stregone, Druido…) sono le
colonne di slot incantesimo naturalmente sparse ai livelli bassi, non buchi. Le
tabelle di classe (Tratti, Progressione, Privilegi chiave, Lista incantesimi,
sottoclasse) e i lignaggi di specie sono rese correttamente. **Nessun problema.**

---

## 5. Prose duplicate non de-duplicate

Il de-dup `once()` normalizza e scarta i ripetuti esatti nella stessa nota, ed è
efficace (**0** duplicati esatti nell'intero vault). Sfugge però un caso
**near-dup** sistematico:

**Tutte e 9 le specie** ripetono due volte la sintesi dei tratti. La
`descrizione` è `"«Taglia», «vel»; «tratti_sintesi»."` mentre la sezione «Tratti»
è `"«tratti_sintesi»."`: differiscono solo per il prefisso taglia/velocità,
quindi il dedup non le riconosce come uguali. Esempio Dragonide: «Media, 9 m;
discendenza draconica, soffio…» seguito da «### Tratti / discendenza draconica,
soffio…».

**Impatto: BASSO-MEDIO** (cosmetico, ma su ogni scheda specie).

---

## 6. Incoerenze IT/EN

### 6.1 Letterale `True` negli statblock (MEDIO) — *bug del mapper*
8 mostri hanno chiavi `sensi` con **valore booleano** (l'informazione è nel nome
della chiave): il mapper fa `f"{t.replace('_',' ')} {v}"` e stampa il letterale
Python `True` nel testo rivolto al giocatore.

Mostri colpiti: **Imp, Lemure, Diavolo barbuto, Diavolo cornuto, Diavolo d'ossa,
Diavolo delle catene, Diavolo uncinato, Insetto gigante**.
Esempi resi: `senses: … scurovisione 36 m non ostacolata dall oscurita magica
True` · `senses: percezione passiva variabile True`. Oltre al `True`, il testo del
senso è uno snake_case «srotolato» poco curato.

### 6.2 Prosa tradotta — pulita
Nessun residuo inglese nella prosa (i match su «creature» sono l'italiano
plurale di «creatura», falsi positivi). Nessun `None`/`???` nell'output.

### 6.3 Chiavi statblock in inglese — per design
I campi YAML (`name`, `hp`, `ac`, `traits`, `actions`…) sono in inglese perché è
lo schema di Fantasy Statblocks; le **etichette** rese sono IT (layout ITA). Non
è un bug.

---

## Top 8 lacune SRD

| # | Lacuna | Dove | Cosa manca | Impatto al tavolo |
|---|---|---|---|---|
| 1 | **Specie ridotte a stub** | tutte le 9 in `Specie/` | meccaniche dei tratti (soffio/CD/danni, resistenze, scurovisione, retaggi); Nano/Orco/Umano/Gnomo/Goliath/Halfling hanno solo 1 riga | **ALTO** — creazione PG ingiocabile dalla sola scheda |
| 2 | **Conteggio azioni leggendarie perso** | ~30 mostri in `Mostri/` | `azioni_leggendarie.utilizzi` non mappato: si vedono le azioni ma non quante per round | **MEDIO-ALTO** — gestione boss |
| 3 | **Letterale `True` nei sensi** | 7 diavoli + Insetto gigante | `sensi` booleani rendono «… True» nello statblock | **MEDIO** — sembra rotto sotto gli occhi dei giocatori |
| 4 | **3 oggetti magici senza rarità** | Bracciali dell'arciere, Sfera annientatrice, Talismano del bene puro | `rarita` assente → niente fascia nell'infobox + esclusi dal bottino | **MEDIO** — 2 leggendari iconici invisibili al generatore tesoro |
| 5 | **5 mostri-evocazione degradati** | Insetto gigante, Cavalcatura/Oggetto animato/Spirito draconico, Boleto stridente | `punti_ferita`/`grado_sfida`/`azioni` assenti | **MEDIO** — statblock senza PF/GS/azioni |
| 6 | **Prosa specie duplicata** | tutte le 9 in `Specie/` | sintesi tratti ripetuta 2× (dedup manca per il prefisso taglia/velocità) | **BASSO-MEDIO** — cosmetico |
| 7 | **8 link «Vedi anche» irrisolti** | `Glossario/` (Allineamento, Arma, Sintonia, …) | id-concetto inesistenti → rimando in chiaro, non cliccabile | **BASSO-MEDIO** — navigazione |
| 8 | **Nota «tana» del GS persa** + 7 strumenti senza costo | `Mostri/` (droni con tana) e `Equipaggiamento/` | `grado_sfida.raw` scartato (PE/BC in tana); `costo` mancante sugli attrezzi | **BASSO** — dettaglio |

### Priorità di intervento suggerita
- **Dati sorgente** (upstream `DND-SRD-IT`): #1, #4, #5 — sono buchi nel JSON.
- **Mapper `build_srd.py`** (fix locali possibili): #2 (aggiungere `utilizzi` a
  `legendary_actions`/`legendary_description`), #3 (gestire i valori booleani di
  `sensi`), #6 (normalizzare il prefisso nel dedup o non emettere due volte
  `tratti_sintesi`), #8 (recuperare `grado_sfida.raw`).
