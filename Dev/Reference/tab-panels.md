# Reference: Tab Panels (`tab-panels`)

Versione vault: **v1.2.3**. Repo: https://github.com/GnoxNahte/obsidian-tab-panels

## Sintassi
Code block ` ```tabs ` con separatori `--- Titolo`:
```md
```tabs
--- Prima scheda
contenuto
--- Seconda scheda
contenuto
```
```
- Tab di default all'apertura: `--- Titolo (default)`.
- **Code block annidati** (dataviewjs/statblock dentro una tab): usa **4 backtick** per il
  contenitore esterno e 3 per quelli interni:
  ````md
  ````tabs
  --- Vista
  ```dataviewjs
  ...
  ```
  ````
  ````
  (In alternativa contenitore con `~~~tabs` e interni a backtick.)

⚠️ NON è il plugin `tabs` di xhuajin (sintassi `tab:`). Questo vault usa **tab-panels**
→ separatori `--- Titolo`. I template Jinja generano `--- {{ titolo }}`.

## Limiti & feature sperimentali (rilevanti: tutto il vault vive dentro `tabs`)
- **Read-only**: il contenuto delle tab è reso in sola lettura. Gli **INPUT/BUTTON Meta Bind
  funzionano** (sono blocchi processati), ma una **checkbox markdown nuda** dentro una tab non si
  spunta. Per renderle editabili: setting `enableEditableTabs` (sperimentale, modifica i file).
- **Cache** (`enableCaching`): **la pipeline la abilita** (`write_tab_panels` →
  `merge_plugin_config`). Senza, link/heading/tag scritti **nel corpo** di una tab non finiscono
  nell'indice di Obsidian → niente Outline/backlink-da-corpo, Dataview non vede contenuto-in-tab.
  Con ON, i `[[wikilink]]` scritti a mano nel corpo Lore tornano backlink/Outline. *(Le relazioni
  tipizzate stanno comunque nel frontmatter.)* ⚠️ Per le note **già esistenti** serve un "Rebuild
  cache" una tantum (comando del plugin); le nuove si indicizzano da sole — non altera i file.
- **Footnote**: `[^1]` e la sua definizione devono stare nella **stessa** code-block tabs (le
  inline `^[...]` ok). Niente linking a una tab specifica / "ricorda ultima tab" (assenti in 1.2.3).
