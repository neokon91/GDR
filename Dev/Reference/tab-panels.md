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
- **Cache** (`enableCaching`, default OFF): con OFF, link/heading/tag scritti **nel corpo** di una
  tab non finiscono nell'indice di Obsidian → niente Outline/backlink-da-corpo, Dataview non vede
  contenuto-in-tab. *Le nostre relazioni stanno nel frontmatter → indicizzate comunque.* Attivare
  la cache (`enableCaching: true`, non altera i file; serve "Rebuild cache") recupera Outline e
  backlink dai `[[wikilink]]` scritti a mano nel corpo Lore. Cablabile via `merge_plugin_config`.
- **Footnote**: `[^1]` e la sua definizione devono stare nella **stessa** code-block tabs (le
  inline `^[...]` ok). Niente linking a una tab specifica / "ricorda ultima tab" (assenti in 1.2.3).
