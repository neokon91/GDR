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
(riscrive il blocco `encounter` dalle creature collegate). Esposte come bottoni
Meta Bind: `plugins.yaml:buttons` → `templates.yaml:actions` → `action.md.j2` genera il file
azione che chiama `tp.user.meta_actions(tp, "<id>")`.

## Pannelli JS Engine (`views.js`)
`renderEntityPanel` (Vista: "pronto al tavolo?" + Citato da), `renderSessionPanel`,
`renderAxesRadar`/`renderAxesCompare` (radar assi), `renderProfilo`, `renderClock`,
`renderEncounter`, `renderProgressione`, `renderTimeline` (linea del tempo: eventi per
epoca, ordinati per `quando`; pannello in cima alla pagina *Cronologia*, opt-in via
`pages.yaml:panel: timeline`), `renderMap` (tab *Mappa* su luogo/mondo: embed del campo
`mappa` — Excalidraw/immagine/nota). Caricati a runtime (CommonJS via `new Function`);
aggiornare `views.js` si propaga alle note senza ricrearle.
