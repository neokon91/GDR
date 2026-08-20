# Backlog fase pulizia/refactor

> Estratto durevole dall'handoff del 2026-08-20 (fase pulizia/refactor/estetica).
> Interprete test: `/usr/local/bin/python3.11` (ha jinja2/pytest; il `python3` di default = brew 3.14 senza jinja2).
> Comandi: `npm run check`, `npm test` (= `python3 -m pytest -q`), `npm run build`. Baseline: 461 test verdi.

## Findings da implementare

### Alta priorità
- **[UX] Consolidare la tab «🔗 Collegamenti»**: 3 callout quasi-sinonimi (Collega / Relazioni / Collegamenti) → 1 header «Collega e relazioni» (bottone in cima = "modo rapido", campi sotto = "a mano"). È il passo dove il DM si perde. `_macros.j2:351/355/370`, `_entity_base.j2`.
- **[Codice] Anti-drift crea_pg↔sali_pg**: `scegliMulti`/`maxAtLevel`/`risorseAtLevel`/`mod`/`sigla` sono duplicati FUORI dai marker → rischio drift silenzioso (risorse calcolate diverse tra creazione e level-up). Portarli sotto l'anti-drift esistente (blocco `>>>pg-shared`) o un `_pg_shared.js`. `crea_pg.js` / `sali_pg.js`.
- **[Estetica] SRD nel sistema visivo**: le note `SRD/` non hanno infobox né accento-categoria → look "grezzo" vs `Mondi/`. Dare header coerente (`[!infobox|srd-*]` + accenti in `category_accent_css`) e rifare l'**indice SRD** con card/link per sezione. `build_srd.py:245-275` e `:720-730`, `presentation.py`.
- **[Estetica] Statblock 2024 dark-aware**: la pelle pergamena è LIGHT-ONLY → rettangoli abbaglianti in dark. Aggiungere variante `:is(.theme-dark) .statblock:has(.gdr-sb-2024)` (bg scuro pergamena). `presentation.py:268-285`.

### Media priorità
- **[UX] Onboarding — ridondanza**: "Come si usa" duplicato LEGGIMI↔Manuale (LEGGIMI = minimo per giocare, resto→Manuale); "cancella Astaria" 4×→1× (nel tour); avviso-plugin 5×→"→ [[Diagnostica]]"; unificare "3 passi" vs "5 tappe" (i 3 contengono i 5). `leggimi/home/manuale/crea_il_tuo_mondo.md.j2`.
- **[UX] Naming coerente**: "sito dei giocatori" ha 5 nomi + bottone "Genera sito giocatori" vs prosa "Genera sito" → fissarne UNO. Distinguere il pannello Home "🎲 Al tavolo" dal componente "Al tavolo". "Far girare il mondo"/"Avanza il mondo" coerente. `plugins.yaml`, note varie.
- **[Codice] `validate.check()` monolitico** (~225 righe): estrarre `validate_plugins()`/`validate_metabind()`/`validate_js_antidrift()`/`validate_templates()`. `validate.py:497+`.
- **[Codice] `70_dispatch.js`**: catena di 25+ `if` (8 identici) → tabella `HANDLERS` + helper `delegate(tp,"X")` (come `PANELS` in boot.mjs).
- **[Estetica] `opzioni()` 6 controlli**: raggruppare "Cos'è" (Stato/Tipo/Famiglia) vs "Condivisione" (Visibilità/Rivelazione). `_macros.j2:170`.
- **[Estetica] Canvas preset collisioni**: pink=purple e blue=cyan (`_CANVAS_PRESET`, `presentation.py:322`).

### Bassa priorità / quick
- **[Codice] Facciata re-export `render.py`**: ~26 nomi re-importati mai usati come `render.X`; e `write_hexmaker` export orfano in `__init__.py`. Ripulire.
- **[Codice] `slugify` divergenti** (create_entity vs genera_sito): allinearle (filename incoerenti).
- **[Codice] `validate_aux_yaml` swallow**: distinguere file-aux ASSENTE (skip ok) da MALFORMATO (deve dare errore). `validate.py:359`.
- **[Codice] Folder-note ancora su Dataview**: dare loro una `.base` da `bases_doc` e togliere il ramo Dataview di `index.md.j2` (o documentare il perché resta).
- **[Estetica] Timeline palette** scollegata da CATEGORY_ACCENTS (`40_tempo.js:162`); doppia icona emoji+Lucide nei titoli callout (`_macros.j2` guida/opzioni/tip).

## Piano test IN-APP da "tester" (creazione encounter end-to-end)

Obiettivo: comportarsi da DM esterno e far **funzionare un incontro** dall'inizio alla fine in Obsidian, verificando le superfici che i test headless non coprono (Meta Bind, Initiative Tracker, Fantasy Statblocks, Dice Roller). Vault: `dist/GDR-vault` (fai prima `npm run build` con python3.11 se serve rigenerare; il seed «Astaria» ha già un incontro «Guardiani della Terza Porta»).

Setup computer-use: `request_access(["Obsidian"])`, apri il vault (`open -a Obsidian ".../dist/GDR-vault"`), poi pilota con `computer_batch` (screenshot per verificare). Cmd+O = quick switcher. Console: Cmd+Alt+I.

Flusso da provare (segna FAIL con nota/atteso/visto/superficie):
1. **Party**: Impostazioni → Initiative Tracker → Parties → «Gruppo»: aggiungi i PG puntandoli a `Mondi/Personaggi` (c'è **Korbin Salmastro**). Verifica che `players: true` poi li includa.
2. **Crea un Incontro nuovo**: da Home/Bestiario bottone *Crea → Incontro* → il wizard chiede solo nome (+tipo). La nota nasce snella.
3. **Collega le creature**: tab Collegamenti → *Collega* → aggiungi 1-2 creature (crea una **Creatura** homebrew col solo **GS** se non ce ne sono, poi *Genera statblock dal GS*). Eventuali **Alleati**.
4. **Aggiorna l'incontro**: nel tab Combattimento premi **Aggiorna l'incontro** → il blocco ```encounter``` si riscrive dalle creature collegate (alleati col flag `ally`); verifica budget XP nel pannello difficoltà.
5. **Schiera il gruppo**: bottone **Schiera il gruppo** → popola il Party di Initiative Tracker dai PG. Verifica che i PG compaiano nel tracker.
6. **Avvia l'incontro**: dal blocco encounter/statblock → *Avvia incontro*/*Aggiungi al tracker*. Avanza i turni; il round-counter sale.
7. **Statblock giocabili**: apri lo statblock di una creatura → i **dadi** (+N a colpire, danno 2d6+X) sono **cliccabili** (Dice Roller). Applica **condizioni** (status del tracker). Verifica i link `[[Afferrato]]` ecc. nelle azioni.
8. **Scheda PG (Korbin)**: i tiri caratteristica/TS/abilità/iniziativa/TS-morte hanno il bonus reale e sono cliccabili; *Sali di livello* e *Riposo* funzionano.
9. **Glossario**: apri **[[Glossario]]** → condizioni/maestrie/ordini rendono; **[[Guida al combattimento]]** linka.
10. **Sito**: **[[Occhi del giocatore]]** → **Genera sito** → verifica che esca in `Sito-giocatori/` senza spoiler (niente uso_al_tavolo/segreti; incontri/PG-DM fuori).

Ogni bug in-app → correggilo alla SORGENTE (Dev/Source), aggiungi/aggiorna un test (o un check anti-drift), rigenera, ricontrolla in-app.

## itch.io — stato pubblicazione

butler loggato, progetto `neokon91/gdr-italian-vault` esiste, release **0.1.0 live** (canali vault+site). Tutto il lavoro recente NON è ancora su itch. Per pubblicare: bump `version` in package.json + CHANGELOG *Non rilasciato*→`[0.2.0]`, `npm run check && npm test`, `npm run publish:itch` (ora solo canale vault; il sito non è più artefatto di release). La 0.1.0 live potrebbe essere pre-turnkey → ripubblicare comunque.
