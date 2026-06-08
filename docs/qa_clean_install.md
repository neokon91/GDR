# QA clean-install (pre-beta)

Checklist per il **path turnkey da zip pulito** — l'esperienza del **DM esterno**, non la tua
dev-copy. La suite automatica copre la *generazione* e la *logica di rendering*; **qui** si copre
l'**integrazione plugin** (Meta Bind che binda, Dataview che indicizza, JS Engine che disegna,
reattività live) — non testabile headless, ed è dove *ogni* QA in-app ha storicamente trovato bug
veri. Falla **una volta, dall'alto in basso, su una copia pristina**.

> Per ogni **FAIL** annota: *nota · cosa attendevi · cosa hai visto · quale superficie/plugin* →
> apri una issue col template **🎲 Feedback beta**. Il sintomo n.1 di rottura è **codice grezzo**
> (`INPUT[...]`, ` ```dataview `, ` ```js-engine `) al posto di pulsanti/schede/tabelle.

## §0 — Setup: simula il DM esterno
- [ ] `npm run check && npm test` verdi (gate pre-pacchetto)
- [ ] `npm run dist` → `dist/GDR-vault-v<ver>.zip`
- [ ] Scompatta lo zip in una cartella **NUOVA** — *non* la dev-vault. Una copia pristina coglie i
      "works-on-my-machine" (path, cache, plugin già fidati)
- [ ] Obsidian → *Apri cartella come vault* sulla copia scompattata
- [ ] ⚠️ **Primo-open con Restricted Mode ON** (plugin spenti): la vault è **navigabile**? Si capisce
      cosa fare, o sembra rotta? *È qui che un DM non-tecnico rimbalza* — il momento più importante

## §1 — Attivazione plugin (il make-or-break)
- [ ] *Trust author* / Restricted mode **off**; i plugin si attivano (BRAT/community)
- [ ] Apri **Diagnostica** → tutti i plugin **essenziali** risultano **attivi**, nessuno mancante
- [ ] La checklist di Diagnostica si **disegna** (se vedi codice lì, manca **JS Engine** — caso limite da verificare)
- [ ] Su **Home** nessun codice grezzo al posto di dashboard/pulsanti

## §2 — Onboarding (il percorso del nuovo DM)
- [ ] **Home** rende le dashboard dataviewjs: «Crea il tuo mondo — n/5», Trame, Fronti caldi
- [ ] **Inizia da qui** rende; i bottoni (`crea-luogo`, link al cruscotto Fronti) funzionano
- [ ] Tour **Crea il tuo mondo** (5 tappe): ogni bottone *Crea* crea la nota giusta nella cartella giusta
- [ ] Wizard end-to-end: **Mondo → Luogo → Fazione**; frontmatter compilato, **campi del sottotipo**
      chiesti (subtype-aware), nota nella cartella corretta

## §3 — Superfici d'integrazione (rischio #1, non testabili headless)
- [ ] **Meta Bind**: l'infobox (VIEW) mostra **valori**, non `VIEW[...]` grezzo; gli INPUT
      (toggle/inlineSelect/suggester) sono editabili e **persistono** nel frontmatter
- [ ] **Dataview**: dashboard e folder-table si **popolano**; le tabelle-relazioni risolvono i `[[link]]`
- [ ] **JS Engine panel**: *Rete di collegamenti* (tabella con `[[ ]]`), radar **Carattere** (SVG),
      *Stato del Mondo*/Fronti, *Scheda*
- [ ] **Reattività**: muovi uno **slider asse** → il radar si **ridisegna live** (senza riaprire la nota);
      avanza un Fronte → il **clock** aggiorna
- [ ] **Auto-link SRD**: in una scheda i nomi (condizioni/incantesimi/mostri) sono `[[link]]` navigabili,
      anche dentro gli statblock
- [ ] **(fix di questo giro)** apri una **Missione**: l'infobox mostra **«Stato della missione»** *e*
      **«Stato»** (distinti — non più due «Stato»); idem una **primordiale** → «Stato cosmico» + «Stato»

## §4 — Entrambe le suite (demo Astaria)
- [ ] **Worldbuilding**: un luogo di Astaria (es. **Aster**) → lore + **pin** sulla mappa-città; i Fronti
      emergono; *Versione player-safe* presente
- [ ] **5.5e**: **Korbin Salmastro** (PG) → scheda, **tiri col bonus reale** (Dice Roller), risorse/riposi;
      *Sali di livello* funziona
- [ ] **Tavolo**: l'incontro **«Guardiani della Terza Porta»** → budget XP, statblock, *Prepara il gruppo (IT)*
      popola Initiative Tracker dai PG
- [ ] **Mappe**: zoom-map pan/zoom, i **pin linkano** le note; (se puoi) un import **Watabou/Azgaar**
      end-to-end → luoghi + segnaposto

## §5 — Sito giocatori (il differenziatore, player-facing)
- [ ] `npm run site -- --reveal incontrato` → il portale si genera, **spoiler-free**: una nota `segreto`
      **non** compare; una `visibilita: dm` **mai**

## §6 — Esito
- [ ] **Zero codice-grezzo** lungo tutto il percorso (il segnale n.1 di integrazione rotta)
- [ ] Ogni FAIL → issue **🎲 Feedback beta** (nota / atteso / visto / superficie)

> Nota onesta: il rischio più alto è **§0–§1** (primo-open con Restricted Mode). Anche con tutto il
> resto perfetto, se un DM non-tecnico non supera l'attivazione plugin, il funnel muore lì. Tratta
> quei due step come **blocco di rilascio**, non come dettaglio.
