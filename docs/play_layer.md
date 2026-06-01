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
  senza `clock_dim` mostra solo un suggerimento).
- **Visual**: `views.renderClock`/`clockSvg` disegnano l'orologio SVG (segmenti pieni).
- **Ponte**: il bottone *Scatena conseguenza* (`meta_actions.scatena_conseguenza`) crea un
  **evento collegato** (`tipo: conseguenza`), azzera il clock e linka tutto → la giocata
  diventa storia del mondo.
- **Dashboard**: `Indici/Fronti.md` (auto, `fronti.md.j2`) — clock pieni / in corso /
  conseguenze-storia.

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
Due vie, in corpo nota su PNG/luogo/fazione (macro `genera_nome()`):
- **Generatore homebrew** (`generatori.yaml` → `core.json`; `genera.js`): nomi di **persona/
  toponimi/fazioni in italiano, a tema**, legati all'ontologia. Bottone *Genera (locale)*
  (`meta_actions` → `tp.user.genera`): deduce il tipo dalla categoria, risolve lo **stile**
  (`stile_nomi` di cultura/specie, anche luogo→cultura; ★ candidati in cima), genera N opzioni,
  inserisce al cursore. Logica pura testabile (`generaPersona/Toponimo/Fazione`, `rng` iniettabile).
- **Fantasy Content Generator** (spunti rapidi): suggester inline `@` + bottone *Genera* (modale);
  generatori configurabili italianizzati (`fcg_it.yaml`). Vedi [plugin_contracts](plugin_contracts.md).

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
  `name:` al titolo, preserva `players:`). Niente più copia-incolla della lista.

## Azioni (`meta_actions.js` + bottoni)
`collega` (link reciproco), `marca_canonico`, `archivia`, `applica_profilo`,
`scatena_conseguenza`, `sali_di_livello` (delega a `tp.user.sali_pg`), `aggiorna_encounter`
(riscrive il blocco `encounter` dalle creature collegate), `genera` (delega a `tp.user.genera`,
generatore nomi). Esposte come bottoni Meta Bind: `plugins.yaml:buttons` → `templates.yaml:actions`
→ `action.md.j2` genera il file azione che chiama `tp.user.meta_actions(tp, "<id>")`. *(I bottoni
`command` — es. *Genera* di FCG — non passano da qui: lanciano un comando di Obsidian direttamente.)*

## Pannelli JS Engine (`views.js`)
`renderEntityPanel` (Vista: "pronto al tavolo?" + Citato da), `renderSessionPanel`,
`renderAxesRadar`/`renderAxesCompare` (radar assi), `renderProfilo`, `renderClock`,
`renderEncounter`, `renderProgressione`, `renderTimeline` (linea del tempo: eventi per
epoca, ordinati per `quando`; pannello in cima alla pagina *Cronologia*, opt-in via
`pages.yaml:panel: timeline`), `renderMap` (tab *Mappa* su luogo/mondo: embed del campo
`mappa` — Excalidraw/immagine/nota), `renderCondizioni` (quick-ref delle 15 condizioni
5.5e da `core.condizioni`/SRD: scheda PG *Al tavolo* + incontro *Combattimento*).

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
valori-assi dal **frontmatter** della nota e disegna `views.radarMarkdownFromValues`. Si
ridisegna alla **riapertura/ri-render** della nota, non live mentre muovi lo slider. *(Una
variante `meta-bind-js-view` per la reattività live era stata tentata ma dava
`META_BIND_ERROR` in-app su Meta Bind 1.4.x — verificato 2026-06-01 — quindi è stata
abbandonata a favore di js-engine, che rende sempre.)* Le **etichette-valore** degli assi
restano comunque reattive (VIEW Meta Bind), come ritratto/pressione/modificatori PG.
