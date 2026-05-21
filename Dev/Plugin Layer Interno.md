# Plugin Layer Interno

Questa nota documenta il layer operativo interno del vault. Non e un plugin Obsidian separato: e una libreria di template, azioni, wizard, viste e fileClass riusabili.

## Meta Bind Design System

Input template globali da usare nei template:

- `mondo`
- `stato`
- `pressione`
- `prossima_mossa`
- `connessioni`
- `player_safe`
- `entita_impattate`
- `propaga_a`
- `sessioni`
- `luoghi`
- `fazioni`
- `missioni`
- `tracciati`

## Meta Bind Action Library

Pulsanti globali:

- `BUTTON[marca-canonico]`
- `BUTTON[marca-rumor]`
- `BUTTON[archivia-nota]`
- `BUTTON[applica-conseguenza]`
- `BUTTON[avanza-clock]`
- `BUTTON[collega-sessione-attiva]`
- `BUTTON[propaga-a-entita]`
- `BUTTON[prepara-recap-pubblico]`

Le azioni passano da `z.automazioni/meta_actions.js`, cosi i pulsanti restano dichiarativi e il comportamento vive in un punto solo.

`prepara-recap-pubblico` aggiunge testo a `recap_pubblico`, ma non deve mai marcare pubblica l'intera sessione: una sessione puo contenere recap mostrabile e campi DM nello stesso frontmatter.

## Templater Wizard Layer

Wizard centralizzati:

- `z.modelli/wizard/Nuova Entita Viva.md`
- `z.modelli/wizard/Appunto Live.md`
- `z.modelli/wizard/Conseguenza.md`
- `z.modelli/wizard/Fine Sessione.md`
- `z.modelli/wizard/Nuova Sessione Da Output Precedente.md`

La logica sta in `z.automazioni/wizard_layer.js`.

## JS Engine Views

Componenti riusabili:

- `z.engine/gdr_views.js`

Uso da DataviewJS o JS Engine:

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/gdr_views.js"));
gdr.renderPressureList(dv);
```

## Metadata Menu

Le fileClass principali includono ora i campi operativi ricorrenti: canone, sessioni, connessioni, player safe, entita impattate e propagazione. Il frontmatter resta YAML, ma il comportamento e trattato come schema operativo.

## Sviluppo E Manutenzione

Comandi:

```bash
npm run check
npm run check:js
```

`npm run check` e il gate principale: verifica file obbligatori, pulsanti, input template, preset Metadata Menu, helper Templater e sintassi degli script.

Quando estendi il layer:

- aggiungi i file essenziali a `REQUIRED_LAYER_FILES` in `z.automazioni/check_vault.js`;
- aggiungi input template a `REQUIRED_META_BIND_INPUT_TEMPLATES`;
- aggiungi pulsanti a `REQUIRED_META_BIND_BUTTONS`;
- aggiungi preset a `REQUIRED_METADATA_MENU_PRESETS`;
- aggiorna README, CSS e fileClass nello stesso blocco di lavoro.
- se un'azione modifica continuita, deve scrivere YAML verificabile e apparire nelle viste di `z.engine/session_views.js`.
