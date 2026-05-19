# Vault GDR

Questo Vault Obsidian è progettato per supportare l'utente nella preparazione e gestione di campagne GDR: mondo, sessioni, PNG, luoghi, fazioni, missioni, incontri, oggetti e materiali da consegnare ai giocatori.

Apri [[1. DM Dashboard]] per lavorare. Durante la sessione usa [[Durante il Gioco]].

## Flusso Consigliato

1. Crea o apri una campagna da [[Campagne/Campagne]].
2. Prepara la prossima sessione con [[Risorse/Preparazione Sessione]].
3. Crea solo le entità davvero utili al tavolo: PNG, luoghi, missioni, incontri, oggetti e dispense.
4. Collega le note usando i campi interattivi Meta Bind.
5. Durante il gioco usa [[Durante il Gioco]] per appunti, timer, PNG attivi, incontri pronti e dispense.
6. Dopo la sessione sposta gli appunti importanti nelle note del mondo e cambia gli stati.

## Struttura

- `Campagne`: campagne attive, in pausa, concluse o archiviate.
- `Mondo/Personaggi`: PG e PNG.
- `Mondo/Luoghi`: città, dungeon, regioni, rovine, templi e punti di interesse.
- `Mondo/Creature`: creature e mostri con statblock.
- `Mondo/Fazioni`: gilde, casate, culti, organizzazioni e poteri.
- `Mondo/Religioni`: religioni, culti, divinità ed entità.
- `Mondo/Oggetti`: oggetti importanti, ricompense e oggetti magici.
- `Mondo/Missioni`: incarichi, trame aperte e obiettivi.
- `Mondo/Incontri`: scene di conflitto, ostacoli e combattimenti pronti.
- `Mondo/Dispense`: testi o materiali da consegnare ai giocatori.
- `Mondo/Sessioni`: preparazione e resoconti delle sessioni.
- `Risorse`: mappe, immagini, audio, video, tabelle e dispense generiche.
- `Inbox`: idee grezze e appunti non ancora canonici.

## Convenzioni

Usa questi campi in modo coerente, perché alimentano Dataview e dashboard.

- `categoria`: tipo generale della nota, per esempio `sessione`, `personaggio`, `luogo`, `missione`.
- `tipo`: sottotipo utile al gioco, per esempio `pg`, `png`, `dungeon`, `oggetto magico`.
- `stato`: avanzamento operativo. Valori comuni: `bozza`, `preparazione`, `pronto`, `in gioco`, `usato`, `giocata`, `consegnato`, `completata`, `fallita`, `da smistare`, `smistata`, `in pausa`, `conclusa`, `archiviata`.
- `canonico`: `true` quando il contenuto è confermato nel mondo di gioco.
- `luogo`, `luoghi`, `personaggi`, `fazioni`, `ricompense`: usa link interni quando possibile.

## Cartelle Di Servizio

- `z.modelli`: template Templater. Modifica con cautela.
- `z.automazioni`: script Templater usati dai template. Se cambi un percorso qui, aggiorna anche dashboard e Dataview.
- `z.bacheche`: bacheche Kanban per preparazione e creature.

## Plugin Usati

- **Templater**: crea note strutturate e sposta i file nelle cartelle giuste.
- **Meta Bind**: pulsanti, selettori, slider e campi interattivi.
- **Dataview**: tabelle, liste e riepiloghi automatici.
- **Callout Manager**: callout tematici per scene, indizi, segreti, incontri e ricompense.
- **Homepage**: apre la dashboard all'avvio.
- **Metadata Menu**: aiuta a mantenere ordinati i campi.
- **Folder Notes**: rende le cartelle principali consultabili come indici.
- **Fantasy Statblocks**: mostra statblock e creature.
- **Kanban**: gestisce preparazione e avanzamento.
- **Calendarium**: gestisce date del mondo e scadenze narrative.
- **Media Extended**: supporta audio e video al tavolo.
- **Excalidraw**:
- **Advenced Tables**:
- **Tabs**:
- **Iconize**:
- **Fantasy Content Generator**: generatore randomico di entità modificabile a piacimento
- **Dice Roller**: 
- **Initiative Tracker**:
- **TTRPG Tolls: Maps**:
- **Hex Cartographer**:

Vedi [[Risorse/Plugin Attivi]] per una lista orientata all'uso pratico.

## Manutenzione

- Non lasciare link placeholder: crea la nota o trasforma il link in testo semplice.
- Archivia invece di cancellare quando una nota ha valore storico.
- Mantieni una sola lingua nei percorsi: cartelle e note indice in italiano.
- Dopo modifiche ai template, crea una nota di prova e verifica che compaia in dashboard.
- Per evolvere il vault senza renderlo tecnico, segui [[Risorse/Sviluppo Vault]].

## Licenza

- Il vault e i suoi contenuti sono rilasciati con licenza **CC BY-NC-SA 4.0**. Vedi [[LICENSE]].
- Gli script originali in `z.automazioni` sono rilasciati con licenza **MIT**. Vedi [[z.automazioni/LICENSE]].
