---
cssclasses:
  - indice
categoria: risorsa
tipo: setup
stato: pronto
---

# Setup Guidato

Usa questa pagina dopo aver aperto il vault per la prima volta. Non serve capire gli strumenti interni: guarda cosa e pronto e cosa richiede attenzione.

````tabs
tab: Stato

> [!regia] Controllo Plugin
> ```dataviewjs
> const enabled = id => app.plugins.enabledPlugins.has(id);
> const checks = [
>   ["Pulsanti", enabled("obsidian-meta-bind-plugin") && enabled("templater-obsidian")],
>   ["Tabelle", enabled("dataview")],
>   ["Campi guidati", enabled("metadata-menu")],
>   ["Mappe e schemi", enabled("obsidian-excalidraw-plugin")],
>   ["Tiri rapidi", enabled("obsidian-dice-roller")],
>   ["Calendario", enabled("calendarium")]
> ];
> dv.table(["Area", "Stato"], checks.map(([label, ok]) => [label, ok ? "Pronto" : "Da controllare"]));
> ```

tab: Apri

> [!scena] Percorso Utente
> `BUTTON[inizia-qui-inizia-qui]`
>
> `BUTTON[nuovo-mondo-homebrew]`
>
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> `BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

tab: Se Non Va

> [!todo] Ripristino
> - [ ] Apri [[Risorse/Primo Avvio Strumenti]]. #task
> - [ ] Riavvia Obsidian. #task
> - [ ] Riapri questa pagina. #task
> - [ ] Se il problema resta, apri [[Risorse/Se Qualcosa Non Funziona]]. #task
````

## Fallback Markdown

| Area | Azione |
| --- | --- |
| Setup | Apri [[Risorse/Primo Avvio Strumenti]] |
| Giocare subito | Apri [[Risorse/Prima Sessione In 15 Minuti]] |

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
2. Crea o apri un mondo.
3. Prepara una sessione collegata al mondo.
4. Apri [[Durante il Gioco]] quando sei al tavolo.
5. Apri [[Hub/Cosa Succede Fuori Scena]] dopo la sessione per scegliere le reazioni del mondo.
6. Apri [[Hub/Vista Giocatori]] solo quando devi mostrare materiale ai giocatori.

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
| Il party mostra PG e HP | [[Hub/Party Control]] |
| Il portale giocatori non espone campi DM | [[Hub/Vista Giocatori]] |
| Il report qualita mostra copertura e buchi | [[Risorse/Quality Report]] |
| Il mondo vivo mostra pressioni e prossime mosse | [[Hub/Cosa Succede Fuori Scena]] |
| Il calendario mostra date o cose da calendarizzare | [[Mondi/Calendario]] |
| I tiri rapidi sono leggibili | [[Risorse/Tabelle/Tabelle]] |
| Le schede creatura appaiono | [[Mondi/Creature/Creature]] |

## Cosa Ignorare

- Cartelle `z.*`.
- File tecnici.
- Impostazioni interne degli strumenti, finche il vault funziona.
