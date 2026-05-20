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
  ["Mappe e schemi", enabled("obsidian-excalidraw-plugin"), "Mappe, fronti, indizi e scene sono modificabili."],
  ["Pagina iniziale", enabled("homepage"), "Il vault puo aprirsi da Inizia Qui."],
  ["Demo", exists("Campagne/Demo - La Reliquia Spezzata.md"), "La demo e disponibile per capire il flusso."],
  ["Prima sessione", exists("Risorse/Prima Sessione In 15 Minuti.md"), "Percorso pratico per giocare subito."],
  ["Creazione entità", exists("Risorse/Creazione Guidata Entità.md"), "Spiega cosa compilare subito e cosa aggiungere dopo."],
  ["Worldbuilding profondo", exists("Risorse/Worldbuilding Profondo.md"), "Guida per passare da schede giocabili a schede di ambientazione."],
  ["Fuori scena", exists("Cosa Succede Fuori Scena.md"), "Pressioni e prossime mosse dopo la sessione."]
];

dv.table(
  ["Area", "Stato", "Cosa significa"],
  checks.map(([label, ok, text]) => [label, ok ? "Pronto" : "Da controllare", text])
);
```

## Se Tutto E Pronto

1. Apri [[Inizia Qui]].
2. Apri [[Risorse/Prima Sessione In 15 Minuti]] se vuoi giocare subito.
3. Apri [[Risorse/Creazione Guidata Entità]] se vuoi capire quali campi compilare subito.
4. Apri [[Demo - La Reliquia Spezzata]] se vuoi vedere un esempio completo.
5. Apri [[1. DM Dashboard]] per preparare.
6. Apri [[Durante il Gioco]] quando sei al tavolo.
7. Apri [[Cosa Succede Fuori Scena]] dopo la sessione per scegliere le reazioni del mondo.

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
| Il mondo vivo mostra pressioni e prossime mosse | [[Cosa Succede Fuori Scena]] |
| Il calendario mostra date o cose da calendarizzare | [[Mondi/Calendario]] |
| I tiri rapidi sono leggibili | [[Risorse/Tabelle/Tabelle]] |
| Le schede creatura appaiono | [[Mondi/Creature/Creature]] |

## Cosa Ignorare

- Cartelle `z.*`.
- File tecnici.
- Impostazioni interne degli strumenti, finche il vault funziona.
