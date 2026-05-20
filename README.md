# Vault GDR

Un vault Obsidian professionale per DM e worldbuilder italiani: costruisce ambientazioni profonde, trasforma mondi complessi in campagne, prepara sessioni radicate nel Codex, controlla il party e offre un portale dedicato ai giocatori.

L'obiettivo e farlo sembrare una app locale dentro Obsidian, non una cartella di appunti: il punto di forza e il **Codex del Mondo**, poi il flusso operativo porta quel mondo al tavolo con **Prepara -> Gioca -> Aggiorna il mondo**.

Apri [[Inizia Qui]] per il primo avvio. Il flusso principale e [[Risorse/Preparazione Sessione]] per produrre una sessione pronta, [[Durante il Gioco]] per giocarla e [[Cosa Succede Fuori Scena]] per aggiornare conseguenze, missioni e prossime mosse. Le dashboard avanzate restano strumenti di supporto, non tappe obbligatorie.

## Perche Usarlo

- **Non tecnico**: l'utente usa pulsanti, dashboard e guide, non configurazioni.
- **Completo**: mondo, campagna, sessione, post-sessione e vista giocatori.
- **Player portal**: recap, PNG noti, luoghi scoperti, handout, mappe condivise e controllo anti-segreti.
- **Party control**: PG, HP, inventario, obiettivi e flags in una schermata da sessione.
- **Quality report**: copertura, buchi operativi, sicurezza pubblicazione e materiale screenshot-ready.
- **Worldbuilding sistemico**: culture, lingue, storia, conflitti, cosmologia, fazioni, relazioni, causalita e conseguenze persistenti.
- **Markdown-first**: i contenuti restano nel vault dell'utente.
- **Release pulita**: il vault puo generare una copia consegnabile con `npm run release:clean`.

## Primi 5 Minuti

1. Scarica lo ZIP della release o clona il repository.
2. Apri la cartella in Obsidian.
3. Vai su [[Inizia Qui]].
4. Se Obsidian chiede conferma per gli strumenti inclusi nel vault, abilitali solo se hai scaricato da fonte affidabile.
5. Apri [[Risorse/Setup Guidato]].
6. Clicca **Crea Il Mondo** in [[Inizia Qui]].
7. Crea o scegli un mondo homebrew e compila Codex, Atlante e prime entità.
8. Trasforma quel mondo in campagna, avventura o sessione.
9. Collega almeno tre ancore mondo alla sessione: mondo, luogo, potere/PNG, missione, clock, mappa o scena.
10. Apri **Gioca** quando vai al tavolo.

## Attivare L'Aspetto GDR

1. Apri **Impostazioni > Aspetto > Snippet CSS**.
2. Attiva `gdr-vault`.
3. Se non lo vedi, ricarica gli snippet CSS dalla stessa sezione.
4. Consigliato: tema **Minimal** e pannello **Style Settings > GDR Vault** per palette, densita di dashboard, tabelle e callout.

Lo snippet non aggiunge dipendenze: migliora dashboard, callout, card, pulsanti e viste giocatori usando classi CSS compatibili con Obsidian, Dataview e Meta Bind.

## Flusso Rapido

1. Apri il vault in Obsidian e vai su [[Inizia Qui]].
2. Clicca **Crea Il Mondo**.
3. Crea o apri il Codex del mondo.
4. Clicca **Trasforma In Gioco** per derivare campagna, avventura o sessione.
5. Collega almeno tre ancore mondo, poi completa: obiettivo, prima scena, scelta, pressione, materiale.
6. Clicca **Gioca**.
7. Dopo la partita clicca **Aggiorna il mondo**.

Se dashboard, pulsanti o tabelle non funzionano, apri [[Risorse/Primo Avvio Strumenti]], [[Risorse/FAQ]] e poi [[Risorse/Se Qualcosa Non Funziona]].

## Flusso Consigliato

1. Crea o apri un mondo dalla [[Worldbuilder Dashboard]].
2. Costruisci il Codex: luoghi, culture, lingue, storia, poteri, religioni, relazioni, risorse, mappe e misteri.
3. Trasforma il mondo in campagna o avventura da [[Campagna da Ambientazione]].
4. Prepara la prossima sessione con [[Risorse/Preparazione Sessione]] solo quando ha almeno tre ancore mondo.
5. Crea entita utili al mondo e al tavolo: PNG, luoghi, missioni, incontri, oggetti, dispense, culture, conflitti, rotte, risorse e relazioni.
6. Collega le note usando i campi interattivi.
7. Durante il gioco usa [[Durante il Gioco]] per appunti, timer, PNG attivi, incontri pronti, dispense e Inbox Live.
8. Usa clock e progress track in [[Mondi/Tracciati/Tracciati]] quando una minaccia, un viaggio o un rituale deve avanzare in modo visibile.
9. Dopo la sessione apri [[Risorse/Post Sessione Guidato]]: canonizza eventi, aggiorna mondo/missioni/tracciati e scegli la prossima sessione attiva.
10. Apri [[Cosa Succede Fuori Scena]] per decidere quali PNG, fazioni, missioni e clock reagiscono prima della sessione successiva.

## Dove Trovare Le Cose

- `Inizia Qui`: tre azioni concrete, Prepara -> Gioca -> Aggiorna il mondo.
- `Hub/Party Control`: controllo party, HP, obiettivi, ricompense, missioni e flags.
- `Campagne`: campagne attive, in pausa, concluse o archiviate.
- `Mondi`: ambientazioni, luoghi, culture, lingue, storia, conflitti, religioni, relazioni, creature, oggetti e dispense.
- `Mondi/Sessioni`: preparazione e resoconti delle sessioni.
- `Mondi/Timeline`: eventi canonici, rumor, leggende e conseguenze storicizzate.
- `Mondi/Missioni`: incarichi, trame aperte e obiettivi.
- `Mondi/Tracciati`: clock e progress track per fronti, missioni, rituali, minacce e viaggi.
- `Mondi/Incontri`: scene di conflitto, ostacoli e combattimenti pronti.
- `Risorse`: mappe, immagini, audio, video, tabelle e dispense generiche.
- `SRD`: riferimento separato al System Reference Document 5.2.1 in italiano.
- `Inbox`: idee grezze e appunti non ancora sistemati.
- `Giocatori`: area dedicata a materiale condivisibile.
- `Vista Giocatori`: portale player-facing safe-by-default, pronto per tavolo, stream o pubblicazione selettiva.
- `Quality Report`: analytics visuale per copertura, note incomplete e materiale screenshot-ready.
- `Post Sessione Guidato`: percorso per consolidare quello che e successo al tavolo.

## Mondo, Campagna E Risorse

- Un **mondo** contiene cio che esiste nell'ambientazione: luoghi, popoli, fazioni, religioni, creature, oggetti e verita canoniche.
- Una **campagna** raccoglie cio che accade al tavolo: party, sessioni, missioni, conseguenze e ricompense.
- **Avventure** e **one-shot** stanno nella campagna quando sono legate a un gruppo o a una storia precisa.
- Tabelle, mappe, dispense e materiali riutilizzabili in piu campagne stanno in `Risorse`.
- [[Worldbuilder Dashboard]] mostra ora Atlante del Mondo, Poteri in Movimento, Relazioni PNG, Timeline Causale e Buchi Di Mondo: usali per trovare collegamenti mancanti, pressioni senza prossima mossa e lore canonica non ancora storicizzata.
- [[Atlante del Mondo]] e la vista principale per worldbuilding strutturale: geografia, culture, lingue, poteri, storia, conflitti, cosmologia, mappe, layer, territori e rotte.
- [[Geopolitical Dashboard]] mostra territori politici, confini, vassalli, risorse strategiche, relazioni diplomatiche e buchi geopolitici.
- [[Motore Mondo Vivo]] e il layer sistemico sopra gli strumenti DM: mostra propagazione eventi, dinamiche di fazione, relationship graph, causalita storica e continuita da chiudere prima della prossima sessione.
- [[Cosa Succede Fuori Scena]] e la vista pratica per il dopo sessione: mostra pressioni urgenti, clock quasi pieni, missioni in stallo, segreti da collegare e conseguenze non propagate.
- `Mondi/Relazioni` contiene alleanze, rivalita, trattati, vassallaggi, debiti e faide quando un legame deve avere stato, intensita, conseguenze e propagazione propria.
- [[Campagna da Ambientazione]] trasforma regioni e conflitti in campagne, archi narrativi, fronti e opportunita di avventura.
- [[Mondi/Stato del Mondo]] e la vista Stato Campagna: filtra per mondo o campagna e mostra missioni aperte, clock attivi, PNG mossi fuori scena, pressioni e conseguenze.

## Uso Quotidiano

- Usa `bozza` per contenuti incompleti.
- Usa `pronto` per materiale utilizzabile al tavolo.
- Usa `attiva: true` su una sola sessione alla volta. Se nessuna sessione e attiva, le viste usano come fallback l'ultima sessione `pronto` o `preparazione`.
- Usa `archiviata` per contenuti da conservare ma non piu attivi.
- Usa `canonico: true` solo quando un contenuto e confermato nel mondo di gioco.
- Usa i pulsanti operativi quando possibile: **Marca Canonico**, **Marca Rumor**, **Archivia**, **Applica Conseguenza**, **Avanza Clock**, **Collega Sessione Attiva**, **Propaga A Entita** e **Prepara Recap Pubblico**. Sono azioni centralizzate: modificano YAML e collegamenti in modo coerente.
- Quando crei luoghi, PNG, fazioni o missioni dai pulsanti guidati, compila subito i collegamenti richiesti: il vault usera quei campi per mostrare fronti, segreti, pressioni e materiale pronto nelle dashboard.
- Nelle schede lunghe, guarda prima il riquadro in alto: tab e callout chiusi servono a tenere separati dettagli, segreti, materiali e post-sessione.
- Usa Inbox Live per catturare eventi, conseguenze, PNG improvvisati, luoghi improvvisati e note grezze senza interrompere il gioco.
- Quando crei una nuova entità, scegli la creazione rapida se ti serve giocare subito: i collegamenti e i dettagli opzionali si aggiungono dopo dalla scheda. Vedi [[Risorse/Creazione Guidata Entità]].
- Usa `Nuovo Clock` per creare un tracciato quando una pressione deve avanzare a segmenti invece di restare una nota testuale.
- Apri [[Risorse/Come Usare I Clock]] se vuoi tre esempi pratici: minaccia, viaggio e rituale.
- Mantieni `SRD` separato dal contenuto canonico: e riferimento regolamentare, non ambientazione.
- Mantieni il core system-neutral in `Mondi`, `Campagne`, `Hub` e `Risorse`; usa `SRD` come modulo regolamentare opzionale per campagne D&D-like.

## Manutenzione Leggera

- Non lasciare link placeholder: crea la nota o trasforma il link in testo semplice.
- Archivia invece di cancellare quando una nota ha valore storico.
- Dopo una sessione, aggiorna missioni, tracciati, PNG, luoghi visitati, ricompense e conseguenze da [[Risorse/Post Sessione Guidato]].
- Il layer operativo interno e documentato in [[Dev/Plugin Layer Interno]]: input Meta Bind, pulsanti, wizard, JS views e fileClass.
- Per controlli e sviluppo del vault, vedi [[Dev/Sviluppo Vault]].
- Per preparare una release o una copia pulita, apri [[Dev/RELEASE]] e [[Risorse/Controllo Vault]].
- Per creare una copia consegnabile, apri [[Dev/Release Pulita]] o usa `npm run release:clean`.
- Per importare mappe esterne come bozze, apri [[Risorse/Importare Mappe]] o usa `npm run import:azgaar`.
- Non modificare manualmente le note in `SRD`: sono un riferimento regolamentare separato e possono essere rigenerate.

## Sviluppo

Comandi principali dal root del vault:

```bash
npm run check
npm run check:repo
npm run clean:repo
npm run import:srd
npm run import:azgaar
npm run release:clean
```

`npm run check` valida plugin obbligatori, link, template Meta Bind, helper Templater, file del plugin layer interno, input template, pulsanti, preset Metadata Menu, igiene repository e sintassi degli script in `z.automazioni` e `z.engine`. `npm run clean:repo` rimuove solo artefatti locali e temporanei ignorati.



## Per Chi E Pensato

- DM e worldbuilder che vogliono preparare e giocare da Obsidian.
- Campagne fantasy system-neutral, con modulo SRD 5.2.1 italiano separato per giochi D&D-like.
- Utenti non tecnici che preferiscono pulsanti, dashboard e campi guidati.

## SRD

`SRD` contiene il System Reference Document 5.2.1 in italiano come archivio regolamentare separato dal contenuto del mondo. Per rigenerarlo usa:

La rigenerazione dello SRD e una procedura tecnica documentata in [[Dev/Sviluppo Vault]].

## Licenza

- Il vault e i suoi contenuti sono rilasciati con licenza **CC BY-NC-SA 4.0**. Vedi [[LICENSE]].
- Gli script originali in `z.automazioni` sono rilasciati con licenza **MIT**. Vedi [[z.automazioni/LICENSE]].
- Il materiale in `SRD` mantiene la propria licenza **CC-BY-4.0** e non e coperto dalla licenza del vault. Vedi [[SRD/Licenza SRD]].
