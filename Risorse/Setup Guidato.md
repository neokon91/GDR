---
cssclasses:
  - indice
categoria: risorsa
tipo: setup
stato: pronto
---

# Setup Guidato

Usa questa pagina dopo aver aperto il vault per la prima volta. Non serve capire gli strumenti interni: guarda cosa e pronto e cosa richiede attenzione.

## Stato Del Vault

```dataviewjs
const enabled = id => app.plugins.enabledPlugins.has(id);
const exists = path => !!app.vault.getAbstractFileByPath(path);

const checks = [
  ["Pulsanti", enabled("obsidian-meta-bind-plugin") && enabled("templater-obsidian"), "I pulsanti aprono pagine e creano note."],
  ["Tabelle", enabled("dataview"), "Dashboard, indici e controlli mostrano dati leggibili."],
  ["Campi guidati", enabled("metadata-menu"), "I campi delle note sono piu facili da compilare."],
  ["Bacheche", enabled("obsidian-kanban"), "Preparazione e post-sessione sono organizzate."],
  ["Creature", enabled("obsidian-5e-statblocks"), "Mostri e creature possono apparire come schede."],
  ["Tiri rapidi", enabled("obsidian-dice-roller"), "I tiri `dice:` e le tabelle casuali funzionano."],
  ["Calendario", enabled("calendarium"), "Date del mondo e scadenze narrative sono disponibili."],
  ["Mappe e schemi", enabled("obsidian-excalidraw-plugin"), "Mappe, fronti e relazioni sono modificabili."],
  ["Pagina iniziale", enabled("homepage"), "Il vault puo aprirsi da Inizia Qui."],
  ["Demo", exists("Campagne/Demo - La Reliquia Spezzata.md"), "La demo e disponibile per capire il flusso."]
];

dv.table(
  ["Area", "Stato", "Cosa significa"],
  checks.map(([label, ok, text]) => [label, ok ? "Pronto" : "Da controllare", text])
);
```

## Se Tutto E Pronto

1. Apri [[Inizia Qui]].
2. Apri [[Demo - La Reliquia Spezzata]] se vuoi vedere un esempio completo.
3. Apri [[1. DM Dashboard]] per preparare.
4. Apri [[Durante il Gioco]] quando sei al tavolo.

## Se Qualcosa E Da Controllare

1. Apri [[Risorse/Primo Avvio Strumenti]].
2. Riavvia Obsidian.
3. Riapri questa pagina.
4. Se il problema resta, apri [[Risorse/Se Qualcosa Non Funziona]].

## Prova Rapida

| Prova | Dove guardare |
| --- | --- |
| I pulsanti aprono pagine | [[Inizia Qui]] |
| Le dashboard mostrano tabelle o carte | [[1. DM Dashboard]] |
| Il tavolo mostra una sessione o un messaggio chiaro | [[Durante il Gioco]] |
| Il calendario mostra date o cose da calendarizzare | [[Mondi/Calendario]] |
| I tiri rapidi sono leggibili | [[Risorse/Tabelle/Tabelle]] |
| Le schede creatura appaiono | [[Mondi/Creature/Prova - Creatura]] |

## Cosa Ignorare

- Cartelle `z.*`.
- File tecnici.
- Impostazioni interne degli strumenti, finche il vault funziona.
