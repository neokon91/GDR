# Sviluppo Vault

Questa nota guida le modifiche future al vault. Il destinatario e un DM o worldbuilder che vuole preparare e giocare meglio, non una persona tecnica.

## Principio Guida

Ogni modifica deve rendere piu facile una di queste azioni:

- preparare una sessione;
- trovare informazioni durante il gioco;
- ricordare cosa e successo;
- trasformare idee grezze in mondo giocabile;
- mantenere continuita tra sessioni.

Se una modifica non aiuta almeno una di queste azioni, probabilmente non serve.

## Utente Finale

Il vault deve funzionare per una persona che:

- non vuole leggere codice;
- non vuole capire Dataview, Templater o Meta Bind;
- ragiona in termini di campagna, sessione, PNG, luogo, missione e conseguenze;
- ha bisogno di trovare informazioni in pochi secondi durante il gioco;
- prende appunti disordinati e li sistema dopo.

## Regole Di Progettazione

- Usa parole da tavolo, non parole tecniche.
- Metti i pulsanti dove l'utente prende decisioni.
- Usa card per attenzione immediata.
- Usa tabelle per archivi e confronto.
- Usa liste per risorse semplici.
- Usa callout per testo da leggere, indizi, segreti, pericoli e ricompense.
- Lascia i dettagli tecnici in `z.modelli`, `z.automazioni` e CSS.

## Cosa Deve Essere Sempre Visibile

Nella dashboard o a un clic dalla dashboard devono esserci:

- prossima sessione;
- cosa e pronto;
- missioni aperte;
- PNG in gioco;
- idee da smistare;
- post-sessione;
- guida DM;
- controllo vault.

## Stati Consigliati

Usa pochi stati e usali sempre nello stesso modo.

- `bozza`: esiste ma non e pronta.
- `preparazione`: sessione o campagna in lavorazione.
- `pronto`: utilizzabile al tavolo.
- `in gioco`: attivo nella campagna o al tavolo.
- `usato`: incontro, creatura o materiale gia sfruttato.
- `giocata`: sessione conclusa.
- `consegnato`: dispensa, informazione o oggetto dato ai giocatori.
- `completata`: missione riuscita.
- `fallita`: missione fallita.
- `da smistare`: nota rapida ancora da decidere.
- `smistata`: nota rapida gia trasformata o collegata.
- `in pausa`: campagna sospesa.
- `conclusa`: campagna terminata.
- `archiviata`: non serve piu, ma va conservata.

Per le missioni usa anche gli stati di avanzamento `proposta`, `accettata` e `in corso`. Per confermare un elemento del mondo usa `canonico: true`, non uno stato separato come "confermato".

## Dove Vanno Le Cose

- Idee vaghe: [[Inbox/Inbox]]
- Appunti live: [[Durante il Gioco]]
- Conseguenze dopo sessione: [[z.bacheche/Post Sessione]]
- Contenuto confermato del mondo: `Mondo`
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

- Troppe cartelle.
- Troppi stati.
- Campi obbligatori che il DM non sa compilare.
- Pagine piene di query ma senza scopo.
- Template lunghi prima che il contenuto serva davvero.
- Nomi misti italiano/inglese.
- Automatismi invisibili che sorprendono l'utente.

## Priorita Future

1. Migliorare esperienza durante il gioco.
2. Migliorare post-sessione e continuita.
3. Rendere piu chiari i template.
4. Aggiungere viste utili alle pagine indice.
5. Solo dopo, abbellire.

## Definizione Di Fatto Bene

Una modifica e riuscita quando il DM puo usarla senza chiedersi:

- dove devo cliccare?
- dove devo scrivere?
- questa cosa e canonica?
- cosa devo preparare adesso?
- cosa devo aggiornare dopo la sessione?
