# Vault GDR

Un vault Obsidian professionale per DM e worldbuilder italiani: prepara sessioni, costruisce ambientazioni ricche, trasforma mondi in campagne e offre una vista dedicata ai giocatori.

L'obiettivo e farlo sembrare una app locale dentro Obsidian, non una cartella di appunti: l'utente apre [[Inizia Qui]], sceglie cosa fare e usa dashboard, pulsanti e viste gia pronte.

Apri [[Inizia Qui]] per il primo avvio. Usa [[1. DM Dashboard]] per preparare, [[Atlante del Mondo]] per costruire ambientazioni ricche, [[Campagna da Ambientazione]] per trasformarle in gioco, [[Durante il Gioco]] durante la sessione e [[Vista Giocatori]] per materiale condivisibile.

## Perche Usarlo

- **Non tecnico**: l'utente usa pulsanti, dashboard e guide, non configurazioni.
- **Completo**: mondo, campagna, sessione, post-sessione e vista giocatori.
- **Worldbuilding profondo**: culture, lingue, storia, conflitti, cosmologia e luoghi connessi.
- **Markdown-first**: i contenuti restano nel vault dell'utente.
- **Release pulita**: il vault puo generare una copia consegnabile con `npm run release:clean`.

## Primi 5 Minuti

1. Scarica lo ZIP della release o clona il repository.
2. Apri la cartella in Obsidian.
3. Vai su [[Inizia Qui]].
4. Se Obsidian chiede conferma per gli strumenti inclusi nel vault, abilitali solo se hai scaricato da fonte affidabile.
5. Apri [[Risorse/Setup Guidato]].

Guida dettagliata: [docs/INSTALLAZIONE.md](docs/INSTALLAZIONE.md).

## Flusso Rapido

1. Apri il vault in Obsidian e vai su [[Inizia Qui]].
2. Se Obsidian chiede conferma per gli strumenti inclusi nel vault, abilitali: servono per dashboard, pulsanti e tabelle.
3. Crea o apri una campagna da [[Campagne/Campagne]].
4. Crea una sessione con il pulsante `Nuova Sessione` dalla dashboard.
5. Durante la partita apri [[Durante il Gioco]] per appunti live, incontri, PNG, dispense e materiali pronti.

Se dashboard, pulsanti o tabelle non funzionano, apri [[Risorse/Primo Avvio Strumenti]], [[Risorse/FAQ]] e poi [[Risorse/Se Qualcosa Non Funziona]].

## Flusso Consigliato

1. Crea o apri una campagna da [[Campagne/Campagne]].
2. Scegli il mondo di riferimento dalla [[Worldbuilder Dashboard]].
3. Prepara la prossima sessione con [[Risorse/Preparazione Sessione]].
4. Crea solo le entita davvero utili al tavolo: PNG, luoghi, missioni, incontri, oggetti e dispense.
5. Collega le note usando i campi interattivi.
6. Durante il gioco usa [[Durante il Gioco]] per appunti, timer, PNG attivi, incontri pronti, dispense e Inbox Live.
7. Usa clock e progress track in [[Mondi/Tracciati/Tracciati]] quando una minaccia, un viaggio o un rituale deve avanzare in modo visibile.
8. Dopo la sessione apri [[Risorse/Post Sessione Guidato]]: canonizza eventi, aggiorna mondo/missioni/tracciati e scegli la prossima sessione attiva.

## Dove Trovare Le Cose

- `Inizia Qui`: percorso guidato per primo avvio, preparazione, gioco e worldbuilding.
- `Campagne`: campagne attive, in pausa, concluse o archiviate.
- `Mondi`: ambientazioni, luoghi, culture, lingue, storia, conflitti, religioni, creature, oggetti e dispense.
- `Mondi/Sessioni`: preparazione e resoconti delle sessioni.
- `Mondi/Timeline`: eventi canonici, rumor, leggende e conseguenze storicizzate.
- `Mondi/Missioni`: incarichi, trame aperte e obiettivi.
- `Mondi/Tracciati`: clock e progress track per fronti, missioni, rituali, minacce e viaggi.
- `Mondi/Incontri`: scene di conflitto, ostacoli e combattimenti pronti.
- `Risorse`: mappe, immagini, audio, video, tabelle e dispense generiche.
- `SRD`: riferimento separato al System Reference Document 5.2.1 in italiano.
- `Inbox`: idee grezze e appunti non ancora sistemati.
- `Giocatori`: area dedicata a materiale condivisibile.
- `Post Sessione Guidato`: percorso per consolidare quello che e successo al tavolo.

## Mondo, Campagna E Risorse

- Un **mondo** contiene cio che esiste nell'ambientazione: luoghi, popoli, fazioni, religioni, creature, oggetti e verita canoniche.
- Una **campagna** raccoglie cio che accade al tavolo: party, sessioni, missioni, conseguenze e ricompense.
- **Avventure** e **one-shot** stanno nella campagna quando sono legate a un gruppo o a una storia precisa.
- Tabelle, mappe, dispense e materiali riutilizzabili in piu campagne stanno in `Risorse`.
- [[Worldbuilder Dashboard]] mostra ora Atlante del Mondo, Poteri in Movimento, Relazioni PNG, Timeline Causale e Buchi Di Mondo: usali per trovare collegamenti mancanti, pressioni senza prossima mossa e lore canonica non ancora storicizzata.
- [[Atlante del Mondo]] e la vista principale per worldbuilding tassonomico: geografia, culture, lingue, poteri, storia, conflitti e cosmologia.
- [[Campagna da Ambientazione]] trasforma regioni e conflitti in campagne, archi narrativi, fronti e opportunita di avventura.
- [[Mondi/Stato del Mondo]] e la vista Stato Campagna: filtra per mondo o campagna e mostra missioni aperte, clock attivi, PNG mossi fuori scena, pressioni e conseguenze.

## Uso Quotidiano

- Usa `bozza` per contenuti incompleti.
- Usa `pronto` per materiale utilizzabile al tavolo.
- Usa `attiva: true` su una sola sessione alla volta. Se nessuna sessione e attiva, le viste usano come fallback l'ultima sessione `pronto` o `preparazione`.
- Usa `archiviata` per contenuti da conservare ma non piu attivi.
- Usa `canonico: true` solo quando un contenuto e confermato nel mondo di gioco.
- Quando crei luoghi, PNG, fazioni o missioni dai pulsanti guidati, compila subito i collegamenti richiesti: il vault usera quei campi per mostrare fronti, segreti, pressioni e materiale pronto nelle dashboard.
- Nelle schede lunghe, guarda prima il riquadro in alto: tab e callout chiusi servono a tenere separati dettagli, segreti, materiali e post-sessione.
- Usa Inbox Live per catturare eventi, conseguenze, PNG improvvisati, luoghi improvvisati e note grezze senza interrompere il gioco.
- Usa `Nuovo Clock` per creare un tracciato quando una pressione deve avanzare a segmenti invece di restare una nota testuale.
- Mantieni `SRD` separato dal contenuto canonico: e riferimento regolamentare, non ambientazione.

## Manutenzione Leggera

- Non lasciare link placeholder: crea la nota o trasforma il link in testo semplice.
- Archivia invece di cancellare quando una nota ha valore storico.
- Dopo una sessione, aggiorna missioni, tracciati, PNG, luoghi visitati, ricompense e conseguenze da [[Risorse/Post Sessione Guidato]].
- Per controlli e sviluppo del vault, vedi [[Risorse/Sviluppo Vault]].
- Per preparare una release o una copia pulita, apri [[RELEASE]] e [[Risorse/Controllo Vault]].
- Per creare una copia consegnabile, apri [[Risorse/Release Pulita]] o usa `npm run release:clean`.
- Per importare mappe esterne come bozze, apri [[Risorse/Importare Mappe]] o usa `npm run import:azgaar`.
- Non modificare manualmente le note in `SRD`: sono un riferimento regolamentare separato e possono essere rigenerate.

## Prodotto E Community

- Strategia prodotto: [docs/STRATEGIA_PRODOTTO.md](docs/STRATEGIA_PRODOTTO.md).
- Installazione: [docs/INSTALLAZIONE.md](docs/INSTALLAZIONE.md).
- Matrice strumenti: [docs/STRUMENTI.md](docs/STRUMENTI.md).
- Completamento plugin per release ZIP: [docs/COMPLETAMENTO_PLUGIN.md](docs/COMPLETAMENTO_PLUGIN.md).
- Contribuire: [CONTRIBUTING.md](CONTRIBUTING.md).

## Demo

Apri [[Demo - La Reliquia Spezzata]] per vedere una mini-campagna completa gia collegata.

## Per Chi E Pensato

- DM e worldbuilder che vogliono preparare e giocare da Obsidian.
- Campagne fantasy compatibili con D&D 5.2.1 o giochi simili.
- Utenti non tecnici che preferiscono pulsanti, dashboard e campi guidati.

## SRD

`SRD` contiene il System Reference Document 5.2.1 in italiano come archivio regolamentare separato dal contenuto del mondo. Per rigenerarlo usa:

La rigenerazione dello SRD e una procedura tecnica documentata in [[Risorse/Sviluppo Vault]].

## Licenza

- Il vault e i suoi contenuti sono rilasciati con licenza **CC BY-NC-SA 4.0**. Vedi [[LICENSE]].
- Gli script originali in `z.automazioni` sono rilasciati con licenza **MIT**. Vedi [[z.automazioni/LICENSE]].
- Il materiale in `SRD` mantiene la propria licenza **CC-BY-4.0** e non e coperto dalla licenza del vault. Vedi [[SRD/Licenza SRD]].
