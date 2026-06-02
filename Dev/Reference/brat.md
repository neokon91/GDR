# Reference: BRAT (`obsidian42-brat`)

Versione vault: **v2.0.4** (TfTHacker). Repo: https://github.com/TfTHacker/obsidian42-brat

> **Stato: strumento di manutenzione, non template-facing.** Non lo usa nessun
> template/script: serve solo a installare/aggiornare plugin **beta** da GitHub.

## Cos'è
*Beta Reviewers Auto-update Tool*: installa un plugin (o tema) **direttamente da un repo
GitHub** e lo tiene aggiornato, anche se non è nel catalogo community o è in beta.

## Uso (manuale)
- Comando *"BRAT: Add a beta plugin for testing"* → incolla l'URL/`user/repo` del repo GitHub.
- *"Check for updates to all beta plugins and UPDATE"* per aggiornare (manuale).
- I plugin così installati compaiono normalmente in `community-plugins.json`.

## Versioni bloccate (consigliato per i plugin di nicchia)
Per evitare che un update beta rompa la sintassi documentata nelle altre schede, usare
**"BRAT: Add a beta plugin with frozen version based on a release tag"**: installa un tag di
release preciso, **frozen** (non si auto-aggiorna). È la mitigazione diretta del rischio
"plugin beta meno stabile" e la base per "distribuzione con versioni minime testate".
- Disattivare l'**auto-update on startup** (tab "Obsidian42-BRAT") sui plugin pinnati.
- BRAT prende il `manifest.json` dagli **asset di release** (dal v1.1.0+): install/condivisione
  col path `user/repo` (es. `TfTHacker/obsidian42-brat`) o URL completo. Doc: https://tfthacker.com/brat-quick-guide

## Perché è nel vault
Alcuni plugin TTRPG (es. quelli di nicchia o pre-release) si distribuiscono via BRAT.
Documentarlo serve a **ricostruire l'ambiente**: se un plugin manca dal catalogo ufficiale,
si reinstalla via BRAT col suo repo.

## ⚠️ Gotcha
- **Fuori dalla pipeline**: `render.py` non tocca la config BRAT; non aggiungere i suoi
  plugin beta a `plugins.yaml` aspettandosi che la build li installi (la build fa solo
  merge di config, non scarica plugin).
- Plugin beta = **meno stabili**: un aggiornamento può rompere la sintassi documentata
  nelle altre schede → se qualcosa rende male dopo un update, sospettare qui.
- Verificare la **provenienza** del repo prima di installare (esegue codice di terzi).
