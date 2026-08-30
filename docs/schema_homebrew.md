# Schema homebrew — il contratto delle entità giocabili

Questo è il **contratto** che il motore (`regole`) e il plugin (`gdr`) consumano. Vale sia
per i contenuti SRD (generati dall'archivio) sia per l'**homebrew** che il DM scrive nel
vault: chi rispetta questo schema è un cittadino di prima classe (statblock, Board,
combattimento). È l'analogo del *data model* di un System Foundry.

Principio: **il motore è tollerante** — `daMostro` non va mai in crash, usa valori di default
per i campi mancanti. Quindi una creatura incompleta *schiera lo stesso*, ma silenziosamente
sbagliata. La validazione (§8) rende visibile questa "wrongness silenziosa".

---

## 1. Il blocco `gdr statblock`

Una creatura homebrew vive in una nota (`categoria: creatura`, cartella `Mondi/Creature`) in
un blocco di codice `gdr statblock`. Due sintassi, stesso renderer:

**a) Lookup per id** (creatura del bestiario, SRD o homebrew già indicizzata):
~~~
```gdr
statblock aboleth
```
~~~

**b) Inline** (homebrew autonoma — la forma `RawMostro` nel corpo del blocco):
~~~
```gdr
statblock
nome: Non-morto del Faro
taglia: media
...
```
~~~

> La convenzione è **arg nella prima riga del corpo** (`statblock <id>`), come i pannelli
> `gdr`. Il plugin tollera anche l'arg nella info-string del fence (` ```gdr statblock <id> `),
> recuperandolo da `getSectionInfo` — ma la forma sopra è quella canonica.

---

## 2. RawMostro — i campi

### Obbligatorio
| Campo | Tipo | Note |
|---|---|---|
| `nome` | stringa | Senza questo la creatura non è utilizzabile (ERRORE). |

### Consigliati (se mancano → default silenzioso)
| Campo | Tipo | Se manca |
|---|---|---|
| `caratteristiche` | `{forza:{valore}, destrezza:{valore}, …}` (le 6) | mod, TS e PF usano **10** |
| `ca.valore` | intero | Classe Armatura **10** |
| `dadi_vita` + `taglia` | intero + `minuscola…mastodontica` | PF **10** (i PF = `dadi_vita × media(dado di taglia) + Cos`) |
| `gs` | numero o frazione (`"1/2"`) | niente **bonus di competenza** su TS, CD, attacchi |

Ogni caratteristica può marcare `competenza: true` → il suo tiro salvezza somma il bonus di
competenza (dal `gs`). Es. `costituzione: {valore: 15, competenza: true}`.

### Opzionali — presentazione (solo statblock, non toccano il motore)
`tipo` · `allineamento` · `velocita: {camminata, volo, nuoto…}` (in metri) · `sensi: {scurovisione: 18, …}` ·
`percezione_passiva` · `lingue: [Comune, {telepatia: 18}]` · `abilita` / `competenza_abilita` /
`maestria_abilita` · `resistenze` · `immunita_danni` · `immunita_condizioni` · `vulnerabilita` ·
`equipaggiamento`.

### Sezioni narrative + giocabili
`tratti` · `azioni` · `azioni_bonus` · `reazioni` · `azioni_leggendarie` — ognuna è una **lista di
voci** `{nome, testo, attivita?}`:

- `nome` + `testo` = la prosa mostrata nello statblock (Markdown: corsivi, `[[wikilink]]`).
- `attivita` (opzionale) = ciò che rende la voce **giocabile** nella Board (§3). Senza
  `attivita` la voce è solo descrittiva (il DM la gioca a mano leggendo il testo) — come nei
  manuali stampati.

---

## 3. `attivita` — rendere un'azione giocabile

Solo le voci con `attivita` di un `tipo` che il motore conosce diventano **bottoni cliccabili**
nel pannello di turno. I tre tipi:

**Tiro salvezza** (il più semplice da scrivere a mano):
```yaml
attivita:
  - tipo: tiro-salvezza
    tiro_salvezza:
      caratteristica: destrezza                 # su cosa tira il bersaglio
      cd: { caratteristica: costituzione, base: 8, competenza: true }   # CD = 8 + mod(Cos) + PB
    successo: danno-dimezzato                    # opzionale: mezzo danno se supera
    fallimento:
      - danno: { numero_dadi: 6, dado: d6, tipo_danno: fuoco }
```

**Attacco** (conviene copiarlo da un mostro SRD o usare *Genera dal GS*):
```yaml
attivita:
  - tipo: attacco
    attacco:
      categoria: arma-mischia                    # o arma-distanza
      bonus: { caratteristica: destrezza, competenza: true }   # colpire = mod + PB
      portata: 1.5
    colpito:
      - danno: { numero_dadi: 1, dado: d6, tipo_danno: tagliente, bonus: { caratteristica: destrezza } }
```

**Multiattacco** (rimanda ad altre azioni per slug):
```yaml
attivita:
  - tipo: multiattacco
    sequenza:
      - { azione: morso, ripetizioni: 2 }
```

Una voce **con `attivita`** può anche imporre condizioni: aggiungi `concede`/`condizione` nel
ramo `colpito`/`fallimento` (l'engine le applica e le condizioni "mordono" i tiri, §6).

---

## 4. Reazioni, azioni bonus e leggendarie

- **`azioni_bonus`**: stesse voci di `azioni`; il motore le mette nello slot *azione bonus*
  dell'economia del turno → la Board le mostra in un gruppo «⚡ Azioni bonus» separato.
- **`azioni_leggendarie`** + `azioni_leggendarie_utilizzi: {numero: 3}`: il pozzo (si ricarica
  ogni round). Ogni voce ha `attivita: [{tipo: azione-leggendaria, costo: 1, …}]` (con
  `effetti` propri o un rimando `azione: <slug>`). La Board le offre fra un turno e l'altro.
- **`reazioni`** che ribaltano un esito (Resistenza Leggendaria): `sostituisci_esito:
  {nome, utilizzi}` sul mostro → quando fallisce un TS, la Board offre di trasformarlo in
  successo.

---

## 5. Incantesimi — creature incantatrici e homebrew

Due pezzi indipendenti, stesso motore.

### a) L'incantesimo homebrew (una nota)

Una nota `categoria: incantesimo` (cartella `Mondi/Incantesimi`) descrive un incantesimo
lanciabile. La meccanica sta nel frontmatter `attivita:` — **le stesse forme del §3**
(attacco / tiro-salvezza / …); senza `attivita` l'incantesimo è solo prosa e si lancia
*narrato* (la Board lo logga, spende la risorsa, l'effetto lo applica il DM leggendo).

```yaml
---
categoria: incantesimo
id: fulmine-nero          # se assente → homebrew:<slug-del-nome-file>
nome: Fulmine Nero
livello: 2
tempo_lancio: azione      # → economia del turno (azione/bonus/reazione)
concentrazione: false
attivita:
  - tipo: tiro-salvezza
    tiro_salvezza: { caratteristica: costituzione, cd: incantesimo }   # CD = quella del lanciatore
    fallimento: { danno: { numero_dadi: 4, dado: d8, tipo_danno: necrotico } }
    successo: danno-dimezzato
---
```

Il plugin lo scopre (`homebrewIncantesimi`) e lo **fonde** col catalogo SRD bundlato
(`srd_incantesimi.json`, generato da `gen_incantesimi.py`) → `incantesimiCompleti()`. Da qui
nasce il `RisolviIncantesimo` che il motore usa (§b). `cd: incantesimo` / `caratteristica:
incantesimo` = "usa i numeri di CHI lancia" (CD e attacco magico dal blocco `incantatore`).

### b) La creatura che lo lancia (blocco `incantatore`, **forma 2024**)

Una creatura lancia dandosi un'attività `incantatore` (in un tratto o in `azioni`). **Le
creature 2024 NON hanno slot**: lanciano **a volontà** e **X/giorno**, e alcune a un
**livello fisso** (`{id, livello}`). Gli id referenziano il catalogo (§a): SRD o homebrew.

```yaml
azioni:
  - nome: Incantesimi
    testo: "Lo stregone lancia i suoi incantesimi (CD 14, +6 al colpire)."
    attivita:
      - tipo: incantatore
        caratteristica: carisma       # informativa
        cd: 14                        # la CD dei suoi incantesimi (→ `cd: incantesimo`)
        attacco: 6                    # il bonus d'attacco magico (→ attacchi d'incantesimo)
        a_volonta: [dardo-di-fuoco, fulmine-nero]     # illimitati (SRD + homebrew)
        al_giorno:
          - usi: 1
            incantesimi: [{ id: palla-di-fuoco, livello: 3 }, cono-di-freddo]  # 1/giorno; livello fisso opzionale
```

La Board mostra un gruppo «🔮 Incantesimi» nel turno: un bottone per incantesimo (etichetta
col costo — *a volontà* · *N/M/dì* · livello fisso *Nº* · 🌀 concentrazione), e un unico
picker multi-bersaglio (le aree "prendono" chi il DM spunta). Lanciare spende l'uso/economia,
apre la concentrazione, esegue le attività coi numeri del lanciatore.

> **Slot** (`slot: [{livello, quanti, incantesimi}]`) esistono ancora nel motore ma servono ai
> **PG** (che nel 2024 gli slot ce li hanno): il loro readout «Slot: 1º ●●○ …» compare solo
> quando il combattente ha slot. Per le creature 2024, usa `a_volonta`/`al_giorno`.

---

## 6. Condizioni ed effetti (Active Effects)

Una condizione è un def che **morde i tiri**, nella stessa forma delle 15 SRD:
```yaml
id: dnd.condizione.maledetto        # o uno slug homebrew
nome: Maledetto
attivita:
  - tipo: passivo
    effetti:
      - { bersaglio: tiri_salvezza, operazione: svantaggio }
      - { bersaglio: tiri_colpire,  operazione: svantaggio }
```
`bersaglio` ∈ `tiri_colpire · tiri_salvezza · prove · velocita …` · `operazione` ∈
`svantaggio · vantaggio · …`. Il motore (`risolviCondizioni`) le combina e le applica ai
comandi.

**Discovery homebrew** (implementata): una nota `categoria: condizione` nel vault viene
scoperta dal plugin (`homebrewCondizioni`) e **fusa** con le SRD (`condizioniComplete`) →
appare nel picker «＋stato» della Board e **morde i tiri** come le SRD. Forma ergonomica nel
frontmatter — `effetti:` diretto (lo si avvolge in un'attività passiva):
```yaml
---
categoria: condizione
nome: Maledetto
effetti:
  - { bersaglio: tiri_colpire,  operazione: svantaggio }
  - { bersaglio: tiri_salvezza, operazione: svantaggio }
---
prosa della condizione…
```
oppure `attivita:` completo (identico alle SRD). L'id nasce dallo slug del nome-file
(`homebrew:<slug>`) se il frontmatter non lo porta.

---

## 7. Oggetti-effetto (equipaggiabili)

Un oggetto magico è un **Active Effect sul portatore**: la STESSA forma delle condizioni (§6),
ma applicato equipaggiando invece che affliggendo. Una nota `categoria: oggetto` con `effetti:`
(o `attivita:` completo) è scoperta dal plugin (`homebrewOggetti`) e fusa col bundle SRD
(`oggettiComplete`) → appare nel picker **«🎒 Equipaggia»** della Board; gli `effetti` MORDONO i
tiri di chi la porta (via `risolviCondizioni`, come le condizioni). Il chip 🎒 col nome; cliccarlo
disequipaggia. Id `oggetto:<slug>` se assente.

Oltre a (s)vantaggio, gli effetti fanno **bonus additivi** (`operazione: somma`) sui canali
`colpire · danno · salvezza · ca`, con `valore: {piatto: N}` o `{dado: dN}`:
```yaml
---
categoria: oggetto
nome: Spada Lunga +1
effetti:
  - { bersaglio: colpire, operazione: somma, valore: { piatto: 1 } }
  - { bersaglio: danno,   operazione: somma, valore: { piatto: 1 } }
---
prosa dell'oggetto…
```
**Dati SRD in archivio** (principio: dati in archivio, codice consuma): un magic item di
`archivio/srd/magic_items/*.oggetto-magico.yaml` che porta un `effetti:` viene bundlato da
`gen_oggetti.py` (→ `srd_oggetti.json`) e diventa equipaggiabile (es. Mantello/Anello di
protezione = +1 CA e TS). Gli item senza `effetti` restano prosa (il DM li gioca a mano).

> **La meccanica anche nel CORPO** — per oggetti/incantesimi/condizioni la discovery legge
> `effetti`/`attivita` dal frontmatter **oppure** da un blocco ```yaml nel corpo (`estraiDefBody`):
> più visibile ed editabile a vista, come lo statblock delle creature. Il template «Crea …»
> scaffolda un blocco commentato (`⚙️ Meccanica`) da attivare togliendo i `#`.

---

## 8. Validazione — la rete di sicurezza

Il contratto sopra è **applicato** da `validaRawMostro` / `validaDef` (plugin/statblock.ts):

- **Inline** (creature): sotto ogni statblock homebrew incompleto compare un callout con errori
  (`nome` mancante / YAML rotto) e avvisi (campi mancanti → default). Feedback dove autori.
- **Batch**: il comando **«GDR: Valida l'homebrew del vault»** scansiona TUTTE le entità giocabili
  — creature (`gdr statblock`) + oggetti/incantesimi/condizioni (`effetti`/`attivita`) — e apre un
  report unico raggruppato ✅ / ⚠️ / ❌ (avviso se una def è solo-prosa o ha effetti malformati).

I dati SRD dell'archivio hanno il loro gate a build (`archivio/tools/validate_archivio.py`).

---

## Esempio minimo giocabile

```yaml
nome: Sentinella d'Ossa
taglia: media
tipo: non-morto
allineamento: neutrale malvagio
ca: { valore: 13 }
dadi_vita: 4
gs: "1/2"
caratteristiche:
  forza: { valore: 14 }
  destrezza: { valore: 12 }
  costituzione: { valore: 15, competenza: true }
  intelligenza: { valore: 6 }
  saggezza: { valore: 10 }
  carisma: { valore: 5 }
velocita: { camminata: 9 }
azioni:
  - nome: Lama spezzata
    testo: "*Tiro per colpire in mischia:* +4. *Colpito:* 5 (1d6+2) danni taglienti."
    attivita:
      - tipo: attacco
        attacco: { categoria: arma-mischia, bonus: { caratteristica: forza, competenza: true }, portata: 1.5 }
        colpito:
          - danno: { numero_dadi: 1, dado: d6, tipo_danno: tagliente, bonus: { caratteristica: forza } }
```
