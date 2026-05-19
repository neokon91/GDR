# Sviluppo Vault

Questa nota guida le modifiche future al vault. Il destinatario finale è un DM o worldbuilder che vuole preparare e giocare meglio, non una persona tecnica.

## Principio Guida
Ogni modifica deve rendere piu facile una di queste azioni:
- preparare una sessione o una campagna;
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
- elenco dei mondi;
- note in stato bozza da completare;
- rapida visuale dei diversi mondi

## Stati delle Note Consigliati
Usa pochi stati e usali sempre nello stesso modo.
- `bozza`: esiste ma non e pronta.
- `pronto`: utilizzabile al tavolo.
- `archiviata`: non serve piu, ma va conservata.

Tutte le entità che lo richiedono avranno anche altri `stato_attuale` come, ad esempio, per PNG `morto`, `vivo` ecc.

## Note Di Prova

Le note di prova sono contenuti finti usati per controllare che template, automazioni, Dataview, callout e CSS funzionino insieme.

Regole:

- nome con prefisso `Prova -`;
- `stato: archiviata`, quando il campo esiste;
- `canonico: false`, quando il campo ha senso;
- collegamenti realistici tra mondo, PNG, luoghi, fazioni, missioni, incontri e oggetti;
- raccolta centrale in [[Risorse/Prove Entità]];
- esclusione da dashboard, indici operativi e controlli di preparazione.

Le prove non devono guidare il gioco. Devono solo mostrare se una modifica rompe qualcosa o se un template produce note leggibili.

Quando aggiungi o cambi un template importante:

- crea una nota reale solo se serve al tavolo;
- crea o aggiorna una nota `Prova - ...` per collaudare il formato;
- controlla che la nota di prova non compaia nelle viste operative;
- controlla che compaia invece in [[Risorse/Prove Entità]].

## Test Con CLI Obsidian

Usa la CLI di Obsidian per controlli ripetibili prima di consegnare o pubblicare modifiche al vault.

Prerequisiti:

- Obsidian aggiornato con installer recente;
- interfaccia CLI attiva in `Impostazioni > Generale > Avanzate`;
- vault `GDR` aperto almeno una volta in Obsidian.

Comandi consigliati:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian version vault=GDR
/Applications/Obsidian.app/Contents/MacOS/Obsidian vault vault=GDR
/Applications/Obsidian.app/Contents/MacOS/Obsidian plugins:enabled vault=GDR filter=community versions format=tsv
/Applications/Obsidian.app/Contents/MacOS/Obsidian unresolved vault=GDR total
```

Controlli di rendering e plugin:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian open vault=GDR path='1. DM Dashboard.md'
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:debug vault=GDR on
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:dom vault=GDR selector='.workspace-leaf-content[data-type="markdown"]' text
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:dom vault=GDR selector='.dataview-error, .dataviewjs-error, .block-language-dataview .error' total
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:errors vault=GDR
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:console vault=GDR level=error limit=50
```

Smoke test Meta Bind non distruttivo:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian eval vault=GDR code='(() => { const btn=[...document.querySelectorAll("button")].find(b => b.textContent.includes("Durante Il Gioco")); if (!btn) return "button-not-found"; btn.click(); return "clicked"; })()'
/Applications/Obsidian.app/Contents/MacOS/Obsidian tabs vault=GDR ids
```

Esito atteso:

- `unresolved` deve restituire `0`;
- `dev:errors` deve indicare che non ci sono errori catturati;
- `dev:console level=error` non deve mostrare errori;
- la dashboard deve contenere i pulsanti Meta Bind e i riepiloghi Dataview;
- lo smoke test deve aprire [[Durante il Gioco]].

## Dove Vanno Le Cose
- Idee vaghe: [[Inbox/Inbox]]
- Appunti live: [[Durante il Gioco]]
- Conseguenze dopo sessione: [[z.bacheche/Post Sessione]]
- Contenuto confermato del mondo: `Mondi`
- Campagne, party e avanzamento al tavolo: `Campagne`
- Avventure e one-shot legate a una campagna: dentro la campagna
- Avventure, one-shot, mappe, tabelle e dispense riutilizzabili: `Risorse`
- Strumenti e template: `z.modelli`, `z.automazioni`, `z.bacheche`

## Cartelle

Le cartelle non sono vietate. Se una funzione, una categoria o una automazione ha bisogno di una cartella chiara per funzionare bene, la cartella va creata.

Prima di creare una cartella, controlla solo che:

- abbia un nome italiano e comprensibile al DM;
- non dupli una cartella o un concetto già esistente;
- sia usata da template, automazioni, dashboard o pagine indice;
- aiuti a trovare contenuti durante preparazione o gioco.

Se la cartella serve, creala insieme alla nota indice quando ha senso. Evita solo cartelle speculative che non vengono ancora usate.

## Mondo e Campagna

- `Mondo` è il contenitore canonico dell'ambientazione.
- `Campagna` è l'esperienza di gioco dentro uno o più mondi.
- Ogni nota di worldbuilding dovrebbe avere il campo `mondo` quando appartiene a una ambientazione precisa.
- Le risorse riutilizzabili restano in `Risorse`, anche se possono essere usate in più campagne.

## Checklist Per Ogni Nuova Funzione

Prima di aggiungere una funzione, chiedi:

- Il DM capisce a cosa serve dal nome?
- Si usa dalla dashboard o da una pagina indice?
- Funziona anche se ci sono poche note?
- Non richiede spiegazioni tecniche?
- Ha uno stato chiaro?
- Appare in una vista utile?
- Crea nuove cartelle solo quando servono davvero?
- Non crea doppioni di cartelle o concetti?
- Esiste una nota di prova se la funzione cambia un template o una vista importante?
- Le note di prova sono filtrate fuori da dashboard e indici operativi?

## Cosa Evitare

- Campi obbligatori che il DM non sa compilare.
- Pagine piene di query ma senza scopo.
- Template lunghi prima che il contenuto serva davvero.
- Nomi misti italiano/inglese.
- Automatismi invisibili che sorprendono l'utente.
- Note di prova visibili nelle viste di gioco.

## Priorita Future
1. Integrazioni plugin che aiutano davvero al tavolo: [[Risorse/Integrazioni Plugin]].
2. Worldbuilding.
3. Gestione sessione.
4. Abbellire.

## Definizione Di Fatto Bene
Una modifica e riuscita quando il DM puo usarla senza chiedersi:
- dove devo cliccare?
- dove devo scrivere?
- questa cosa è canonica?
- cosa devo preparare adesso?
- cosa devo aggiornare dopo la sessione?
