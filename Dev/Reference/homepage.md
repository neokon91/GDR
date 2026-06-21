# Reference: Homepage (`homepage`)

Versione vault: **v4.4.4**. Doc: https://github.com/mirnovov/obsidian-homepage

> Usato da: `render.py → write_homepage` (`HOMEPAGE_CONFIG`). Apre la nota **Home**
> all'avvio di Obsidian.

## Cos'è
Definisce una **nota di apertura** all'avvio (e un comando "Open homepage"). Nel progetto
punta a `Home` (la dashboard a 2 aree).

## Config (`HOMEPAGE_CONFIG` → `data.json`)
Campi chiave:
- `homepages."Main Homepage".value: "Home"`, `kind: "File"` — la nota di partenza.
- `openOnStartup: true`, `openMode: "Replace all open notes"`.
- `refreshDataview: true` — forza il refresh delle query Dataview all'apertura.
- `version: 4`, `separateMobile: false`.

## ⚠️ Gotcha — scrittura solo al PRIMO setup
`write_homepage` scrive `data.json` **solo se la cartella plugin esiste E `data.json`
manca** (`plugin_dir.is_dir() and not data_json.is_file()`). Motivo: **non sovrascrivere**
le scelte dell'utente su build successive.
- Conseguenza: se vuoi rigenerare la config Homepage, **cancella prima** il suo
  `data.json` e rigira la build.
- Se il plugin non è ancora installato alla prima build, la config **non viene scritta**
  → installa il plugin e rigira (o configura a mano).
- `refreshDataview: true` dipende da Dataview installato; con gli indici migrati a
  **Bases** il refresh tocca solo le query Dataview residue (hub/fallback).

## Opzioni ufficiali non usate (utente)
- **`commands: []`** (campo già presente, vuoto) — esegue comandi all'apertura di Home (es.
  refresh di altri pannelli/plugin); generalizza `refreshDataview: true`.
- **`separateMobile: false` → `true`** per una **Home mobile separata** (la dashboard a 2 aree è
  pensata desktop → una versione snella al tavolo).
- **`kind`** ufficiali: `File`, `Workspace`, `Canvas`, **`Base`**, Daily/Periodic Note, Random,
  Graph. Con gli indici migrati a Bases, Home può puntare a un `.base` (`kind: "Base"`).
- Richiamo a runtime: comando **"Open homepage"** o **ribbon button** per tornare a Home.
