# Reference: Tab Panels (`tab-panels`)

Repo: https://github.com/gnoxnahte/obsidian-tab-panels

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
