---
cssclasses:
  - indice
---

# Integrazioni Plugin

Questa pagina decide quali plugin integrare per primi nel vault. Non e una lista di installazione: e una coda di lavoro per trasformare plugin gia scelti in funzioni utili al DM.

## Fonti Ufficiali Consultate

- [Calendarium](https://plugins.javalent.com/calendarium) e [eventi Calendarium](https://plugins.javalent.com/calendarium/events)
- [Initiative Tracker](https://plugins.javalent.com/it) e [inline encounters](https://plugins.javalent.com/it/encounters/inline)
- [Fantasy Statblocks](https://plugins.javalent.com/statblocks)
- [Dice Roller](https://plugins.javalent.com/dice) e [table rollers](https://plugins.javalent.com/dice/rollers/table)
- [Obsidian Excalidraw Plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin)
- [Obsidian Canvas](https://obsidian.md/help/plugins/canvas)
- [Media Extended](https://github.com/aidenlx/media-extended)

## Criterio

Integra un plugin solo quando aggiunge una cosa visibile in una dashboard, in una pagina di preparazione o durante il gioco.

Prima di lavorarci, controlla:

- quale azione del DM rende piu veloce;
- quale nota o dashboard deve mostrarlo;
- quali campi servono davvero;
- quale nota di prova verifica che funzioni;
- cosa succede se il plugin non e installato.

## Prossime Integrazioni

### 1. Calendarium

Stato: integrazione base avviata.

Obiettivo: collegare le date del mondo alle sessioni, alle missioni e agli eventi futuri.

Da fare:

- fatto: definire in [[Mondi/Calendario]] le regole minime del calendario;
- usare `data_mondo` nelle sessioni come campo leggibile e coerente;
- fatto: aggiungere nelle missioni una scadenza narrativa quando serve usando i campi Calendarium `fc-calendar`, `fc-date`, `fc-category`, `fc-display-name` e, se serve, `fc-end`;
- fatto: usare categorie semplici per gli eventi: `sessione`, `scadenza`, `festa`, `pericolo`, `conseguenza`;
- valutare eventi inline con `span` solo dentro note di sessione o resoconti, dove possono servire piu eventi nella stessa nota;
- fatto: mostrare nella DM Dashboard le prossime scadenze narrative.

Fatto bene quando: il DM sa che giorno e nel mondo, cosa sta per scadere e quale sessione arriva dopo.

### 2. Initiative Tracker E Fantasy Statblocks

Stato: integrazione base avviata.

Obiettivo: rendere gli incontri pronti davvero giocabili al tavolo.

Da fare:

- fatto: completare il template incontro con blocchi per creature, iniziativa, terreno, round e condizioni;
- fatto: collegare le creature di [[Mondi/Creature/Creature]] agli incontri;
- usare Fantasy Statblocks per le creature con blocchi `statblock` in YAML, mantenendo l'indentazione semplice e verificabile;
- fatto: usare Initiative Tracker per combattimenti veri, dato che gestisce iniziativa, turni, PF, CA, condizioni, stati a durata e creature da Fantasy Statblocks;
- usare incontri inline `encounter:` nelle note di sessione solo per gruppi semplici o incontri casuali;
- distinguere incontri sociali, esplorativi e combattimenti;
- fatto: creare una nota `Prova - Incontro` che mostri anche creature e iniziativa.

Fatto bene quando: aprendo un incontro pronto il DM puo iniziare la scena senza cercare schede altrove.

### 3. Dice Roller

Obiettivo: rendere tabelle e procedure casuali usabili senza uscire dal vault.

Da fare:

- creare tabelle riutilizzabili in [[Risorse/Tabelle/Tabelle]];
- aggiungere tiri rapidi inline con sintassi `dice:`, per esempio `dice: 1d20`;
- usare table rollers con block id per incontri casuali, complicazioni, bottino e umore PNG;
- usare lookup table a due colonne quando il risultato dipende da un tiro specifico, per esempio `1-2`, `3-4`, `15-20`;
- usare risultati annidati solo quando rimandano a tabelle gia leggibili;
- collegare i tiri alle pagine dove servono davvero, non a una pagina tecnica separata;
- evitare tabelle troppo grandi prima che siano utili al tavolo.

Fatto bene quando: durante preparazione o gioco il DM puo generare un risultato e usarlo subito.

### 4. Excalidraw, Canvas E Mappe

Obiettivo: rendere visibili relazioni, fronti, mappe e geografia senza duplicare note.

Da fare:

- usare [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]] come prova base per relazioni tra PNG, luoghi e fazioni;
- creare una convenzione per mappe di regione, dungeon e fronti;
- collegare ogni mappa alla nota mondo, luogo o campagna pertinente;
- usare Excalidraw quando servono disegno libero, annotazioni visuali, embed e link tra disegni e note;
- usare Canvas quando serve una mappa relazionale fatta di note, media, gruppi e connessioni leggibili;
- ricordare che Canvas salva file `.canvas` in formato JSON Canvas, quindi e adatto a mappe strutturate e durevoli;
- mostrare in Worldbuilder Dashboard le mappe principali.

Fatto bene quando: una mappa aiuta a capire il mondo e rimanda alle note canoniche, invece di diventare un archivio parallelo.

### 5. Media Extended

Obiettivo: preparare audio, video e immagini da usare al tavolo senza interrompere la sessione.

Nota: la documentazione ufficiale indica che Media Extended puo accedere a media fuori dal vault e puo usare rete per servizi online configurati o linkati. Inoltre segnala che le future release v4 saranno closed source, mentre il codice v3 resta MIT. Integrare solo funzioni davvero utili al tavolo.

Da fare:

- ordinare [[Risorse/Audio/Audio]], [[Risorse/Video/Video]] e [[Risorse/Immagini/Immagini]] per uso pratico;
- aggiungere campi come `uso`, `tono`, `campagna` e `stato` solo dove servono;
- usare timestamp e link a momenti precisi per video, audio e registrazioni;
- usare screenshot da video solo quando diventano dispense o riferimenti di scena;
- evitare dipendenze da URL remoti per materiale indispensabile alla sessione;
- mostrare materiale pronto in [[Durante il Gioco]];
- collegare dispense e scene ai media collegati.

Fatto bene quando: il DM apre Durante il Gioco e trova subito atmosfera, immagini o dispense pronte.

## In Attesa

Questi plugin restano secondari finche le integrazioni sopra non sono solide:

- **Hex Cartographer**: utile dopo aver stabilito come il vault gestisce regioni e viaggi.
- **Fantasy Content Generator**: utile per bozze e spunti, ma non deve creare contenuto canonico automaticamente.
- **Icon Folder**: migliora orientamento visivo, ma non sostituisce indici e dashboard chiare.

## Integrazione Trasversale: Tabs

Stato: integrazione base avviata.

Uso: migliorare la navigazione nei template lunghi senza cambiare i campi o la logica delle note.

Applicato a:

- [[z.modelli/dm/Sessione]]
- [[z.modelli/dm/Incontro]]
- [[z.modelli/dm/Missione]]
- [[z.modelli/dm/Campagna]]
- [[z.modelli/Mondo]]
- [[z.modelli/personaggio/PNG]]
- [[z.modelli/fazione/Fazione]]
- [[z.modelli/luogo/Insediamento]]

Regola: usare Tabs solo per raggruppare sezioni gia esistenti. Se il plugin non e attivo, il contenuto resta comunque leggibile come blocco markdown.

## Regola Di Priorita

Prima integra cio che si usa durante una sessione reale. Poi cio che accelera la preparazione. Solo dopo cio che abbellisce o organizza.
