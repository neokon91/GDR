# Play layer — superficie giocabile, clock, archetipi, incontri

Le meccaniche "al tavolo" che fanno da ponte fra worldbuilding e gioco. Tutte
**data-driven** (YAML) + rese da macro Jinja (`_macros.j2`) e pannelli JS Engine
(`views.js`); le azioni che scrivono il frontmatter sono in `meta_actions.js` (più
`sali_pg.js`). Per il PG vedi [rules_layer](rules_layer.md).

## Superficie giocabile (`tavolo`)
Ogni nota lore espone `uso_al_tavolo`/`gancio`/`pressione`/`prossima_mossa` (single
source `core.tavolo`, macro `tavolo()`). `pressione` (0-10) ha l'etichetta di rischio
calcolata (Calma/Tensione/Crisi). È il differenziatore: lore già pronta a essere giocata.

## Clock & conseguenze (un fronte che esplode muove il mondo)
- **Modello**: un fronte traccia un orologio a segmenti — `clock_dim` (4/6/8) + `clock`
  (pieni) — più `conseguenza` (cosa accade a clock pieno) e `conseguenza_su` (link
  all'entità colpita). Campi in `core.yaml`; macro `clock()` nel tab *Al tavolo* (opt-in:
  senza `clock_dim` mostra solo un suggerimento). La macchina del Fronte appare **solo
  sulle categorie in `core.fronte_categorie`** (attori/cosmici: fazione, culto, divinità,
  regno, luogo, esercito, calamità, …); sulle altre l'*Al tavolo* tiene Uso al tavolo/
  Gancio/Condivisione senza il clock. I profili-sottotipo possono segnalare `clock: true`
  per guidare (vedi [data_model](data_model.md) §Gruppi e profili-sottotipo).
- **Visual**: `views.renderClock`/`clockSvg` disegnano l'orologio SVG (segmenti pieni).
- **Ponte**: il bottone *Scatena conseguenza* (`meta_actions.scatena_conseguenza`) crea un
  **evento collegato** (`tipo: conseguenza`), azzera il clock e linka tutto → la giocata
  diventa storia del mondo.
- **Dashboard**: `Indici/Fronti.md` (auto, `fronti.md.j2`) — clock pieni / in corso /
  conseguenze-storia.

## Catena di prep (missione → scena → incontro/indizio)
Le entità *tavolo* si concatenano per relazione tipizzata **reciproca**: una `missione` raccoglie le
sue `scene`; ogni `scena` (`conduce_a` per il flusso non-lineare) espone `incontri`, `indizi` (regola
dei 3 indizi) e — via incontro — `insidie`. Il cerchio col mondo durevole si chiude da due lati:
`scena.genera_evento`→`evento` trasforma l'esito di una scena-climax in storia di campagna (la timeline
causale), e bottino/ricompense sono note vere (`incontro.bottino`/`missione.ricompensa_oggetto`→`oggetto`).
Così la prep è navigabile dal filo-avventura al singolo statblock e ritorno.

## Archetipi & profilo (tag-da-assi)
- **Catalogo** `archetipi` in `assi/<id>.yaml`: `{id, nome, quando:{asse: comparatore},
  tag}`. `quando` = combinazione di valori-assi; comparatori `">=N"` `"<=N"` `">N"` `"<N"`
  `"N"`(==) `"N-M"`. `render` lo distribuisce in `core.archetipi[id]` → `core.json`.
- **In nota** (vista *Profilo*, `views.renderProfilo`, tab *Carattere*): mostra gli
  archetipi che combaciano coi valori-assi correnti; il bottone *Applica profilo*
  (`meta_actions.applica_profilo`) scrive i tag `profilo/<x>` **rimuovendo prima i vecchi
  `profilo/*`** (nessun residuo se cambi gli assi).
- **In creazione**: il wizard offre l'archetipo come **preset** → pre-compila i valori-assi
  (`create_entity.presetValori`, derivati dal `quando`; `valori:` esplicito = override) + i tag.
- **Famiglie → preset assi**: anche la `famiglia` (classificazione a 2 livelli) può pre-compilare
  gli assi col campo opzionale `assi:{asseId: 1-5}` in `entities/<id>.yaml` (`create_entity.famigliaPreset`).
  Il wizard chiede la famiglia (per le categorie che ne hanno); la famiglia dà il livello "ampio",
  l'archetipo lo rifinisce (precedenza). `validate` controlla che gli id-asse siano reali (1-5).

## Generazione nomi/spunti
**Generatore homebrew** in corpo nota (macro `genera_nome()`, `generatori.yaml` → `core.json`;
`genera.js`): nomi di **persona/toponimi/fazioni in italiano, a tema** + spunti al tavolo (PNG,
taverne, bevande, ganci, dicerie, insediamenti, oggetti, meteo, stanze di dungeon,
**trappole/insidie**, **eventi di viaggio**), più due generatori legati all'**SRD**: **tesoro**
(monete a fascia + un oggetto/equip reale per rarità, da `tesoro._srd`) e **incontro casuale**
(pesca una **creatura REALE** dell'SRD per banda di GS da `incontro._srd`, + numero/attività/
atteggiamento/twist — fn dedicata `generaIncontro`). I **ganci/dicerie** sono **world-aware**: i
terminali `{fazione}`/`{luogo}`/`{nome}` pescano da fazioni/luoghi/PNG **reali del mondo attivo**
(`worldPool`, dal `mondo` della nota), con fallback alla generazione se il mondo è vuoto. Bottone
*Genera (locale)* (`meta_actions` → `tp.user.genera`): deduce il tipo dalla categoria, risolve lo
**stile** (`stile_nomi` di cultura/specie, anche luogo→cultura; ★ candidati in cima), genera N
opzioni, inserisce al cursore. Logica pura testabile (`generaPersona/Toponimo/Fazione/DaForme/
Tesoro/Incontro`, `rng` iniettabile).

**Tabelle casuali (roll nativo del Dice Roller)** — separate dal generatore: la nota-libreria
`Tabelle casuali.md` (a livello-radice) raccoglie **lookup-table** del plugin (`dice: 1dN` + righe
a range + block-id `^id`), tirabili inline con `` `dice: [[Tabelle casuali#^id]]` `` → numero +
esito con UI/cronologia. Vincolo: le lookup-table vanno a **livello-radice** di una nota (un
block-id dentro il fence ````tabs non è raggiungibile dal link).

## Difficoltà incontri (DMG 2024)
- **Dati**: tabelle `cr_xp` (GS→PE) + `budget_2024` (Bassa/Moderata/Alta per personaggio)
  in `system.yaml` → `core.json`. GS/PE **interrogabili**: mostri SRD (frontmatter `gs`/`pe`
  da `grado_sfida`) + campo `gs` su `creatura` homebrew.
- **Calcolo** (`views.renderEncounter`, tab *Combattimento*): budget del gruppo
  (`pg_livello`×`pg_numero`) vs XP totale delle creature collegate (`pe` diretto o `cr_xp[gs]`)
  → etichetta difficoltà (Banale/Bassa/Moderata/Alta/Mortale).
- **Auto-riscrittura del blocco** (`meta_actions.aggiorna_encounter`, bottone *Aggiorna
  encounter*): riscrive il fence ```` ```encounter ```` dalle creature in *Collegamenti*
  (conta per nome — occorrenze ripetute = quantità — risolve i link al basename, allinea
  `name:` al titolo, preserva `players:`) ed emette gli **alleati** collegati (campo
  `alleati`) col flag `, ally` (Initiative Tracker li separa dai nemici). Niente più
  copia-incolla. I **PG** entrano nel tracker via `players: true` configurando il **Party**
  nelle impostazioni di Initiative Tracker (note in `Mondi/Personaggi`).

## Combattimento al tavolo (VTT-lite, plugin Javalent)
La triade **Initiative Tracker + Fantasy Statblocks + Dice Roller** dà l'automazione di
combattimento *testuale* (iniziativa, PF, condizioni, dadi cliccabili — **non** una mappa
con token: IT ha rimosso l'integrazione mappa in v12). La pipeline la sfrutta a fondo:
- **Statblock giocabile dal GS** (`meta_actions.scaffold_statblock`): riempie il blocco dai
  valori-base del GS (mediane SRD) con **multiattacco** (2 da GS 2, 3 da GS 11) e TS
  competenti; `views.renderVerificaGS` stima il GS difensivo/offensivo e avvisa se i numeri
  (rifiniti a mano) escono dal GS dichiarato.
- **Condizioni → status di Initiative Tracker** (15 condizioni 5.5e + Concentrazione/Reazione)
  e **party «Gruppo»** di default, iniettati in `data.json` (`render.write_initiative_tracker`,
  non distruttivo: solo chiavi assenti). Dadi cliccabili negli statblock via `useDice` (FS).
- Guida operativa passo-passo: **[[Guida al combattimento]]** (`Indici/`).

## Azioni (`meta_actions.js` + bottoni)
`collega` (link reciproco), `marca_canonico`, `archivia`, `applica_profilo`,
`scatena_conseguenza`, `avanza_fronte` (clock +1), `sali_di_livello` (delega a `tp.user.sali_pg`),
`aggiorna_encounter` (creature + alleati collegati), `riposo_breve`/`riposo_lungo` (loop di
sessione 2024: Dadi Vita, slot, TS-morte, concentrazione, Esaurimento), `turno_bastione`,
`genera` (delega a `tp.user.genera`, generatore nomi). Esposte come bottoni Meta Bind: `plugins.yaml:buttons` → `templates.yaml:actions`
→ `action.md.j2` genera il file azione che chiama `tp.user.meta_actions(tp, "<id>")`. *(I bottoni
`command` non passano da qui: lanciano un comando di Obsidian direttamente.)*

## Pannelli JS Engine (`views.js`)
`renderEntityPanel` (Vista: "pronto al tavolo?" + Citato da), `renderSessionPanel`,
`renderAxesRadar`/`renderAxesCompare` (radar assi), `renderProfilo`, `renderClock`,
`renderEncounter`, `renderVerificaGS` (coerenza GS creatura: difensivo AC+PF / offensivo
attacco+danno vs dichiarato), `renderRisorsePG` (barre PF/Dadi Vita/Esaurimento della scheda
PG), `renderProgressione`, `renderTimeline` (linea del tempo: eventi per
epoca, ordinati per `quando`; pannello in cima alla pagina *Cronologia*, opt-in via
`pages.yaml:panel: timeline`), `renderMap` (tab *Mappa* su luogo/mondo: embed del campo
`mappa` — Excalidraw/immagine/nota), `renderCondizioni` (quick-ref delle 15 condizioni
5.5e da `core.condizioni`/SRD: scheda PG *Al tavolo* + incontro *Combattimento*),
`renderIncantesimi` (incantesimi per livello + slot residui + link SRD; marca con 🌀 quelli
a **concentrazione**), `renderMaestrie` (maestrie armi 2024), `renderSpecieTratti` (sezioni
SRD della specie), `renderDintorni`/`renderViaggio`/`renderPressioni` (geografia: confini e
distanza, rotte×tempo×pericolo, spinte del grafo econ/geo sui Fronti).

Il corpo nota di ogni pannello è **una riga** che importa il guscio unico
`z.automazioni/boot.mjs` (modulo ESM via `engine.importJs`) e gli delega il pannello per
nome: `(await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderX")`.
`boot.mjs` concentra in un solo posto ciò che prima era ripetuto in ogni blocco — carica
`views.js` come CommonJS (`new Function`, perché `importJs` usa `import()` ESM e non vedrebbe
`module.exports`), risolve `dv`/`page` e fa `engine.markdown.create`. Aggiornare `views.js`
(la logica) o `boot.mjs` (il guscio) si propaga a tutte le note senza ricrearle. `core.json` è
**cache-ato** per-modulo (`views.loadCoreData`/`boot.loadCore`): immutabile a runtime, lo si legge
una volta per sessione (dopo una rebuild basta riaprire la nota).

**Radar degli assi** (`js-engine` → `boot.radar`): il radar del tab *Carattere* legge i
valori-assi dal **frontmatter** della nota e disegna `views.radarMarkdownFromValues`. È
**reattivo**: `engine.reactive` (ReactiveComponent) ridisegnato da un listener `metadataCache`
'changed' registrato sul `component` del blocco (auto-deregistrato all'unload) → si aggiorna
**live** muovendo uno slider, senza riaprire la nota (confermato in-app 2026-06-09; fallback
statico se `engine.reactive` non c'è). *(Una variante `meta-bind-js-view` per la reattività dava
`META_BIND_ERROR` su Meta Bind 1.4.x — verificato 2026-06-01 — quindi si usa js-engine col suo
`reactive`.)* Le **etichette-valore** degli assi restano reattive anche via VIEW Meta Bind, come
ritratto/pressione/modificatori PG.
