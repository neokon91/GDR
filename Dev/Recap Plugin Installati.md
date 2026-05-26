---
cssclasses:
  - indice
categoria: risorsa
tipo: plugin
stato: pronto
aggiornato: 2026-05-20
---

# Recap Plugin Installati

Questa pagina riassume i plugin community presenti nel vault, come sono configurati e come usarli meglio. Per il primo avvio resta valida [[Risorse/Primo Avvio Strumenti]]. Per le priorita di sviluppo usa [[Dev/Integrazioni Plugin]].

## Sintesi

Plugin community abilitati: 27.

| Plugin | Versione nel vault | Stato nel vault | Chi ne beneficia | Uso migliore |
| --- | ---: | --- | --- | --- |
| Dataview | 0.5.68 | integrato | DM, manutentore | Dashboard, indici, controlli e viste operative automatiche. |
| Templater | 2.20.4 | integrato | DM, worldbuilder | Creazione guidata di sessioni, missioni, PNG, luoghi e note live. |
| Meta Bind | 1.4.10 | integrato | DM, giocatori al tavolo | Pulsanti, toggle, input e campi modificabili dentro le note. |
| JS Engine | 0.3.5 | supporto avanzato | manutentore | JavaScript in-note dove DataviewJS o Meta Bind non bastano. |
| Metadata Menu | 0.8.12 | integrato, da estendere sui contenuti reali | manutentore, worldbuilder | FileClass e campi guidati per migliorare la qualita dei metadati. |
| Folder Notes | 1.8.19 | integrato | tutti | Cartelle principali apribili come note indice. |
| Homepage | 4.4.2 | integrato | tutti | Apertura automatica di [[Inizia Qui]]. |
| Workspaces core | core abilitato | DM, worldbuilder, manutentore | Tre layout salvati: `DM al tavolo`, `Worldbuilding`, `Manutenzione`. |
| Bookmarks core | core abilitato | tutti | Segnalibri raggruppati per accesso rapido alle pagine vive. |
| Kanban | 2.0.51 | integrato base | DM | Bacheche Markdown per preparazione, post-sessione e creature. |
| Tasks | 8.0.0 | supportato | DM | Vista globale dei task operativi con global filter `#task`; non sostituisce missioni, clock o lore. |
| Maps | 0.1.6 | supportato leggero | worldbuilder, manutentore | Vista mappa per Bases usando `coordinates`, `icon` e `color`. |
| Callout Manager | 1.1.1 | integrato | DM, giocatori | Callout GDR coerenti per scene, PNG, luoghi, fazioni, missioni, timeline, segreti, pericoli e ricompense. |
| Fantasy Statblocks | 4.10.3 | integrato | DM | Schede mostro e creature richiamabili da note e incontri. |
| Initiative Tracker | 13.0.21 | supportato | DM al tavolo | Combattimenti con blocchi `encounter`, vista [[Risorse/Iniziativa e Combattimenti]] e creature da Fantasy Statblocks. |
| Dice Roller | 11.4.2 | supportato | DM, giocatori | Tiri inline, tabelle casuali e lookup table da note Markdown. |
| Calendarium | 2.1.0 | integrato con default e custom | DM, worldbuilder | Calendario fantasy, eventi, scadenze e timeline del mondo. |
| Excalidraw | 2.23.3 | integrato | worldbuilder, DM | Mappe relazionali, fronti, reti di indizi, scene e dungeon collegati a note. |
| Advanced Canvas | 6.1.6 | supportato | worldbuilder, DM | Canvas strutturali di note, gruppi e connessioni per fronti e archi di campagna. |
| Media Extended | 4.2.4 | supportato leggero | DM al tavolo | Audio/video con timestamp e riferimenti a momenti precisi. Desktop only. |
| Generatore di Contenuti Fantasy | 1.2.4 | integrato custom | DM, worldbuilder | Spunti rapidi in italiano salvati come bozze in `Inbox/Generati`. |
| Iconize | 2.14.7 | integrato visuale | tutti | Icone per orientamento in file explorer, link e note. |
| Tabs | 1.1.8 | integrato | tutti | Sezioni a schede in dashboard, template lunghi e mostri SRD. |
| Style Settings | 1.0.9 | integrato visuale | manutentore | Regolazione dello snippet `gdr-vault` senza modificare CSS. |
| Linter | 1.31.2 | supporto sviluppo | manutentore | Pulizia manuale e prudente delle note, senza lint on save. |
| Advanced Tables | 0.23.2 | supporto | DM, manutentore | Editing veloce di tabelle Markdown e tabelle casuali. |
| TTRPG Tools: Maps | 1.9.5 | opzionale guidato | DM al tavolo | Mappe zoomabili con marker, layer, misure e note collegate. |
| Hex Cartographer | 1.0.2 | opzionale guidato | worldbuilder | Mappe esagonali per regioni, viaggi e hexcrawl. |
| BRAT | 2.0.4 | manutenzione essenziale | manutentore | Installazione/test di plugin beta o non ufficiali da repository GitHub. |

Nota: `table-editor-obsidian` e il plugin mostrato come **Advanced Tables**; `obsidian-icon-folder` e oggi **Iconize**; `zoom-map` e **TTRPG Tools: Maps**. Iron Vault ed Emoji Toolbar non sono inclusi nel bundle del vault.

## Fonti Ufficiali Consultate

- [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) e [repository](https://github.com/blacksmithgu/obsidian-dataview)
- [Templater](https://silentvoid13.github.io/Templater/)
- [Meta Bind](https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/)
- [JS Engine](https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/)
- [Metadata Menu](https://mdelobelle.github.io/metadatamenu/)
- [Folder Notes](https://lostpaul.github.io/obsidian-folder-notes/)
- [Kanban](https://publish.obsidian.md/kanban/Obsidian+Kanban+Plugin)
- [Tasks](https://publish.obsidian.md/tasks/)
- Maps 0.1.6 verificato dal manifest locale; documentazione Obsidian: Map view per Bases.
- [Callout Manager](https://github.com/eth-p/obsidian-callout-manager)
- [Calendarium](https://plugins.javalent.com/calendarium)
- [Initiative Tracker](https://plugins.javalent.com/it)
- [Fantasy Statblocks](https://plugins.javalent.com/statblocks)
- [Dice Roller](https://plugins.javalent.com/dice)
- [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin)
- Advanced Canvas 6.1.6 verificato dal manifest locale.
- [Media Extended v4](https://mx.aidenlx.site/docs/v4/load-media)
- [Iconize](https://florianwoelki.github.io/obsidian-iconize/)
- [Advanced Tables](https://github.com/tgrosinger/advanced-tables-obsidian)
- [Style Settings](https://github.com/mgmeyers/obsidian-style-settings)
- Linter 1.31.2 verificato dal manifest locale.
- [Tabs](https://xhuajin.github.io/obsidian-tabs/)
- [TTRPG Tools: Maps](https://ttrpg-tools-obsidian.org/)
- [BRAT](https://tfthacker.com/BRAT)
- [Fantasy Content Generator](https://github.com/Gregory-Jagermeister/Fantasy-Content-Generator)

## Combinazioni Da Sfruttare

## Verifica Uso Reale

| Plugin | Segnale nel vault | Valutazione |
| --- | --- | --- |
| Dataview | centinaia di blocchi `dataview` e `dataviewjs` | sfruttato bene |
| Meta Bind | molti pulsanti e input nei template/dashboard | sfruttato bene |
| Templater | template e script in `z.modelli`/`z.automazioni` | sfruttato bene |
| Metadata Menu | FileClass in `z.fileclass` | migliorato con nuove classi per incontri, mappe, media, rotte e risorse |
| Tabs | usato in template e dashboard lunghe | sfruttato bene, da non abusare |
| Dice Roller | tiri inline e tabelle con block id | sfruttato bene |
| Calendarium | calendario neutro `Calendario Del Mondo` attivo | sfruttato per leggere `fc-*` e dare un calendario diegetico coerente senza ambientazioni protette |
| Fantasy Statblocks | creature con `statblock: true` e blocchi `statblock` | buono, ora collegato meglio agli incontri di combattimento |
| Media Extended | indici media e timestamp | leggero, sufficiente finche non ci sono media reali di campagna |
| Kanban | tre bacheche operative | base, migliorabile con task piu collegati |
| Tasks | global filter `#task` e [[Risorse/Task DM]] | supportato per lavoro operativo del DM |
| Linter | configurazione manuale e note guida | supporto sviluppo, non workflow utente finale |
| Workspaces/Bookmarks | core attivi e guida dedicata | supportati per navigazione e cambio contesto |

### Dashboard Operative

Usa insieme Dataview, Meta Bind, Templater, JS Engine e Homepage.

- Dataview legge stato, categoria, collegamenti, date e liste.
- Meta Bind offre pulsanti e input direttamente in dashboard.
- Templater crea note gia coerenti con i campi del vault.
- JS Engine va riservato a widget complessi o output che DataviewJS rende troppo verbosi.
- Homepage deve restare puntata a [[Inizia Qui]], perche e la porta non tecnica.

Beneficia soprattutto: DM che prepara e gioca spesso, manutentore del vault.

### Combattimento Al Tavolo

Usa insieme Fantasy Statblocks, Initiative Tracker, Dice Roller e Callout Manager.

- La creatura deve avere `statblock: true` e `name` coerente.
- Il blocco `statblock` richiama il nome esatto del mostro.
- Il blocco `encounter` usa gli stessi nomi per avviare l'iniziativa.
- [[Risorse/Iniziativa e Combattimenti]] mostra i combattimenti pronti e quelli senza `encounter_creatures`.
- Dice Roller copre tiri rapidi e tabelle casuali.
- I callout `incontro`, `pericolo`, `timer` e `regola` separano cio che va letto, deciso o tracciato.

Beneficia soprattutto: DM durante combattimenti e scene con pressione.

### Preparazione Sessione

Usa insieme Kanban, Templater, Dataview, Metadata Menu e Advanced Tables.

- Kanban mantiene la coda di lavoro in `z.bacheche`.
- Templater crea la sessione e i materiali.
- Dataview mostra cosa e pronto o incompleto.
- Metadata Menu puo diventare utile creando FileClass per `sessione`, `missione`, `png`, `luogo`, `incontro`.
- Advanced Tables rende veloci tabelle di incontri, bottini, rumor e conseguenze.

Beneficia soprattutto: DM che prepara a blocchi e vuole ridurre controllo manuale.

### Worldbuilding

Usa insieme Excalidraw, Canvas core, Advanced Canvas, Iconize, Folder Notes, Tabs, Hex Cartographer e TTRPG Tools: Maps.

- Excalidraw e adatto a relazioni vive: fazioni, fronti, dungeon, indizi e mappe ragionate.
- Canvas core e Advanced Canvas sono meglio quando vuoi una mappa fatta di note, media e gruppi strutturati.
- Iconize aiuta a orientarsi, ma non sostituisce indici e dashboard.
- Folder Notes mantiene ogni cartella leggibile come pagina.
- Tabs riduce lo scrolling di dashboard e template lunghi.

Beneficia soprattutto: worldbuilder e DM che gestisce luoghi, fazioni e viaggi.

### Media E Atmosfera

Usa insieme Media Extended, Templater, Dataview e Durante il Gioco.

- Media Extended serve per aprire media locali o esterni e lavorare con timestamp.
- Le note in [[Risorse/Audio/Audio]], [[Risorse/Video/Video]] e [[Risorse/Immagini/Immagini]] dovrebbero avere almeno `uso`, `tono`, `campagna`, `stato`.
- Le risorse indispensabili alla sessione dovrebbero essere locali, non solo URL remoti.
- Durante il Gioco deve mostrare solo media pronti, non archivi generici.

Beneficia soprattutto: DM che usa musica, immagini, handout o video-reference.

## Spunti Di Miglior Uso

### Per Il DM

- Usa [[Durante il Gioco]] come unica schermata al tavolo: sessione attiva, scene, incontri, tabelle e note live.
- Prepara ogni combattimento serio con blocco `encounter`; usa `encounter:` inline solo per gruppi semplici.
- Porta le tabelle casuali in [[Risorse/Tabelle/Tabelle]] con block id stabili, poi richiamale con Dice Roller.
- Dopo sessione, usa [[z.bacheche/Post Sessione]] prima di aggiornare il mondo canonico.

### Per Il Worldbuilder

- Usa Excalidraw per fronti e relazioni, TTRPG Tools: Maps per mappe giocabili, Hex Cartographer per regioni a esagoni.
- Ogni mappa deve rimandare a note canoniche, non diventare un archivio parallelo.
- Usa Iconize e Folder Notes solo per orientamento; la conoscenza deve restare in note, campi e link.
- Usa Tabs in dashboard grandi, non in note piccole.

### Per Il Manutentore

- Crea FileClass Metadata Menu per i tipi principali: `sessione`, `missione`, `png`, `luogo`, `incontro`, `mappa`, `media`.
- Mantieni le query Dataview semplici e lascia il collaudo agli script automatici, non a note fittizie.
- Prima di cambiare un campo YAML, cerca il campo in dashboard, template, `z.automazioni` e controlli.
- Conserva BRAT attivo per manutenzione e plugin non ufficiali: non deve essere parte del flusso utente finale.

### Per Giocatori O Co-DM

- Possono usare [[Inizia Qui]], [[Durante il Gioco]], [[Risorse/Tabelle/Tabelle]] e le dispense senza conoscere i plugin.
- Possono beneficiare di Dice Roller, Callout Manager, Statblocks e Media Extended solo se il DM prepara le note prima.
- Non dovrebbero toccare `z.modelli`, `z.automazioni`, BRAT o impostazioni plugin.

## Prossime Azioni Consigliate

1. Rinominare `Calendario Del Mondo` e rifinire mesi, feste e stagioni solo quando il calendario diegetico della campagna diventa canonico.
2. Fatto: create FileClass Metadata Menu aggiuntive per `incontro`, `rotta`, `risorsa`, `mercato`, `compendium`, `ricorrenza`, `mappa` e `media`.
4. Fatto: Hex Cartographer resta opzionale guidato per `regione -> esagoni -> incontri -> conseguenze`.
5. Fatto: Media Extended e collegato a [[Durante il Gioco]] tramite media con `stato: pronto`.
8. Fatto: Linter configurato come supporto sviluppo manuale in [[Dev/Linter e Sviluppo]].
9. Fatto: Workspaces e Bookmarks collegati a [[Risorse/Workspaces e Segnalibri]].
10. Fatto: Maps per Bases installato e collegato a [[z.bases/Atlante Mappe.base]] e [[Risorse/Mappe Bases]].
11. Tenere Iron Vault fuori dal bundle: usare [[Dev/Studio Iron Vault]] solo come studio di design.
