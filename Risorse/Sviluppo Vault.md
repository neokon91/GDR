# Sviluppo Vault

Questa nota guida le modifiche future al vault. Il destinatario finale è un DM o worldbuilder che vuole preparare e giocare meglio, non una persona tecnica.

## Principio Guida
Ogni modifica deve rendere piu facile una di queste azioni:
- preparare una sessione, one-shot, avventura o campagna;
- trovare le informazioni utili facilmente durante il gioco;
- tenere traccia di cosa è successo;
- trasformare le idee grezze in strutture definite di un mondo giocabile;
- mantenere continuità tra sessioni.

## Utente Finale
Il vault deve funzionare per una persona che:
- non vuole leggere codice;
- non vuole comprendere Dataview, Templater o Meta Bind;
- ragiona da worldbuilder e DM;
- ha bisogno di trovare informazioni rapidamente durante il gioco;
- poter prendere appunti disordinati e sistemarli successivamente.

## Regole Di Progettazione
- Una schermata per Worldbuilding e una per DM.
- Usa parole da tavolo, non parole tecniche.
- Inserire pulsanti dove l'utente prende decisioni.
- Usare card per attenzione immediata.
- Usare tabelle per archivi e confronto.
- Usare liste per risorse semplici.
- Usare callout customizzati per testo da leggere, indizi, segreti, pericoli e ricompense.
- Lascia i dettagli tecnici in `z.modelli`, `z.automazioni` e CSS.

## Cosa Deve Essere Sempre Visibile
Nella dashboard DM devono esserci:
- campagne in corso;
- prossime sessioni;
- idee da smistare/completare;
- guida DM;
Nella dashboard Worldbuilder devono esserci:
- pulsanti di creazione;
- note in stato bozza da completare;
- rapida visuale dei diversi mondi

## Stati delle Note Consigliati
Usa pochi stati e usali sempre nello stesso modo.
- `bozza`: esiste ma non e pronta.
- `pronto`: utilizzabile al tavolo.
- `archiviata`: non serve piu, ma va conservata.

Tutte le entità che lo richiedono avranno anche altri `stato_attuale` come, ad esempio, per PNG `morto`, `vivo` ecc.

## Dove Vanno Le Cose
- Idee vaghe: [[Inbox/Inbox]]
- Appunti live: [[Durante il Gioco]]
- Conseguenze dopo sessione: [[z.bacheche/Post Sessione]]
- Contenuto confermato del mondo: `Mondi`
- Materiale generico riutilizzabile: `Risorse`
- Strumenti e template: `z.modelli`, `z.automazioni`, `z.bacheche`

## Checklist Per Ogni Nuova Funzione

Prima di aggiungere una funzione, chiedi:

- Il DM capisce a cosa serve dal nome?
- Si usa dalla dashboard o da una pagina indice?
- Funziona anche se ci sono poche note?
- Non richiede spiegazioni tecniche?
- Ha uno stato chiaro?
- Appare in una vista utile?
- Non crea doppioni di cartelle o concetti?

## Cosa Evitare

- Campi obbligatori che il DM non sa compilare.
- Pagine piene di query ma senza scopo.
- Template lunghi prima che il contenuto serva davvero.
- Nomi misti italiano/inglese.
- Automatismi invisibili che sorprendono l'utente.

## Priorita Future
1. Worldbuilding
2. Gestione sessione
3. Abbellire.

## Definizione Di Fatto Bene
Una modifica e riuscita quando il DM puo usarla senza chiedersi:
- dove devo cliccare?
- dove devo scrivere?
- questa cosa è canonica?
- cosa devo preparare adesso?
- cosa devo aggiornare dopo la sessione?
