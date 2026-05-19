# Vault GDR

Questo Vault Obsidian è progettato per supportare l'utente nella preparazione e gestione di campagne GDR: mondo, sessioni, PNG, luoghi, fazioni, missioni, incontri, oggetti e materiali da consegnare ai giocatori.

Apri [[1. DM Dashboard]] per preparare e giocare. Usa [[Worldbuilder Dashboard]] per costruire il mondo. Durante la sessione usa [[Durante il Gioco]].

## Flusso Consigliato

1. Crea o apri una campagna da [[Campagne/Campagne]].
2. Scegli il mondo di riferimento dalla [[Worldbuilder Dashboard]].
3. Prepara la prossima sessione con [[Risorse/Preparazione Sessione]].
4. Crea solo le entità davvero utili al tavolo: PNG, luoghi, missioni, incontri, oggetti e dispense.
5. Collega le note usando i campi interattivi Meta Bind.
6. Durante il gioco usa [[Durante il Gioco]] per appunti, timer, PNG attivi, incontri pronti e dispense.
7. Dopo la sessione sposta gli appunti importanti nelle note del mondo e cambia gli stati.

## Struttura

- `Campagne`: campagne attive, in pausa, concluse o archiviate.
- `Mondi`: ambientazioni, luoghi, personaggi, fazioni, religioni, creature, oggetti e dispense.
- `Mondi/Sessioni`: preparazione e resoconti delle sessioni.
- `Mondi/Missioni`: incarichi, trame aperte e obiettivi.
- `Mondi/Incontri`: scene di conflitto, ostacoli e combattimenti pronti.
- `Risorse`: mappe, immagini, audio, video, tabelle e dispense generiche.
- `Inbox`: idee grezze e appunti non ancora canonici.

## Mondi, Campagne e Contenuti

- Un **mondo** contiene cio che esiste nell'ambientazione: luoghi, popoli, fazioni, religioni, creature, oggetti e verita canoniche.
- Una **campagna** usa uno o piu mondi e raccoglie cio che accade al tavolo: party, sessioni, missioni, conseguenze e ricompense.
- **Avventure** e **one-shot** stanno nella campagna quando sono legate a un gruppo o a una storia precisa.
- Se un'avventura, una one-shot, una tabella, una mappa o una dispensa e riutilizzabile in piu campagne, trattala come risorsa generica in `Risorse`.

## Convenzioni

Usa questi campi in modo coerente, perché alimentano Dataview e dashboard.

- `categoria`: tipo generale della nota, per esempio `sessione`, `personaggio`, `luogo`, `missione`.
- `tipo`: sottotipo utile al gioco, per esempio `pg`, `png`, `dungeon`, `oggetto magico`.
- `stato`: avanzamento operativo. Valori comuni: `bozza`, `preparazione`, `pronto`, `in gioco`, `usato`, `giocata`, `consegnato`, `completata`, `fallita`, `da smistare`, `smistata`, `in pausa`, `conclusa`, `archiviata`.
- `canonico`: `true` quando il contenuto è confermato nel mondo di gioco.
- `mondo`: collega una nota al mondo a cui appartiene.
- `luogo`, `luoghi`, `personaggi`, `fazioni`, `ricompense`: usa link interni quando possibile.

Per le note di categoria `mondo`, usa anche `tono`, `tema`, `tecnologia`, `magia`, `continenti`, `fazioni`, `religioni` e `campagne`.

## Note Di Prova

Le note con prefisso `Prova -` servono solo a collaudare template, campi, callout, CSS, Dataview e collegamenti.

- Sono raccolte in [[Risorse/Prove Entità]].
- Non sono contenuto canonico.
- Usano `stato: archiviata` quando possibile.
- Le dashboard e gli indici operativi devono escluderle.
- Se aggiungi un nuovo template importante, crea o aggiorna una nota di prova collegata.
- Se una nota di prova compare in una vista di gioco, va filtrata con `!startswith(file.name, "Prova -")` o con un controllo equivalente in DataviewJS.

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
- Prima di pubblicare modifiche importanti, esegui i test con CLI Obsidian descritti in [[Risorse/Sviluppo Vault]].
- Per evolvere il vault senza renderlo tecnico, segui [[Risorse/Sviluppo Vault]].

## Licenza

- Il vault e i suoi contenuti sono rilasciati con licenza **CC BY-NC-SA 4.0**. Vedi [[LICENSE]].
- Gli script originali in `z.automazioni` sono rilasciati con licenza **MIT**. Vedi [[z.automazioni/LICENSE]].
