# Plugin GDR — spike Tier B

Dimostratore del salto a **plugin Obsidian nativo** (vedi
[../docs/tier_b_plugin_evaluation.md](../docs/tier_b_plugin_evaluation.md)). Prova che
il porting **non è un rewrite**: riusa `z.automazioni/views.js` e `meta_actions.js` del
vault **senza modificarli**.

## Cosa dimostra
1. **Blocco ` ```gdr <renderX> `** al posto del blocco `js-engine` (32 nel vault) —
   `registerMarkdownCodeBlockProcessor`.
2. **Comando nativo + hotkey + icona ribbon** «GDR: Riposo lungo (PG attivo)» → dispatcher
   `meta_actions(tp, "riposo_lungo")`.
3. **Re-render reattivo**: ogni blocco si ridisegna sui cambi di frontmatter
   (`metadataCache 'changed'`), non solo il radar come oggi.
4. **Cruscotto DM (`ItemView`)**: pannello laterale persistente «da app» con sezioni riusate
   (`renderStatoMondo`/`renderTensioni`/`renderProiezione`) + azioni rapide («Giro del mondo»,
   «Aggiorna»), reattivo su `metadataCache` e robusto al cold-start di Dataview
   (`dataview:index-ready`). Apri con il comando «Apri il Cruscotto DM» o l'icona ribbon.

Tutti e 4 i punti **validati dal vivo** in Obsidian su `dist/GDR-vault` (vedi
[../docs/tier_b_plugin_evaluation.md](../docs/tier_b_plugin_evaluation.md)).

## Build
```bash
cd plugin
npm install
npm run build      # → main.js (esbuild, CJS, obsidian esterno)
```

## Installazione nel vault di sviluppo
Copia `manifest.json` + `main.js` in
`dist/GDR-vault/.obsidian/plugins/gdr/` e abilita **gdr** in
*Impostazioni → Plugin della community* (o già presente in `community-plugins.json`).
Apri **`GDR — Demo plugin.md`** e prova il blocco + il comando.

## In un B2 completo (non fatto qui)
- Il plugin **sussume `boot.mjs`** (qui la mappa `PANELS` è duplicata a scopo demo).
- `render.py` bundla il plugin nel vault ed emette ` ```gdr ` invece di `js-engine`;
  `fetch_plugins.py`/turnkey lo trattano come gli altri plugin `.obsidian/plugins/<id>/`.
- `tp.system.suggester`/`prompt` → `SuggestModal`/`Modal`; `tp.user.*` → chiamate dirette.
- La logica resta JS/TS puro → i test node headless e l'anti-drift continuano a valere.
