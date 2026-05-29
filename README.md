# Vault GDR

Un vault Obsidian professionale per DM e worldbuilder italiani. Aiuta a costruire ambientazioni profonde, trasformarle in campagne, preparare sessioni radicate nel Codex del mondo, controllare il party e mostrare ai giocatori solo materiale sicuro.

L'obiettivo e farlo sembrare un'app locale dentro Obsidian, non una cartella di appunti. Non e una app standalone e non e un rules engine completo: il valore sta nel collegare mondo, preparazione, sessione e conseguenze. Il centro e il **Codex del Mondo**; il flusso operativo porta quel mondo al tavolo con **Prepara -> Gioca -> Aggiorna il mondo**.

Apri [[Inizia Qui]] per il primo avvio. Il percorso principale passa da [[Risorse/Preparazione Sessione]] per preparare una sessione, [[Hub/Durante il Gioco]] per giocarla e [[Hub/Cosa Succede Fuori Scena]] per aggiornare conseguenze, missioni e prossime mosse. Le dashboard avanzate sono strumenti di supporto, non tappe obbligatorie.

## Perche Usarlo

- **Non tecnico**: l'utente usa pulsanti, dashboard e guide, non configurazioni.
- **Completo**: mondo, campagna, sessione, post-sessione e vista giocatori.
- **Vista giocatori**: recap, PNG noti, luoghi scoperti, dispense, mappe condivise e controllo anti-segreti.
- **Controllo party**: PG, HP, inventario, obiettivi e flag in una schermata da sessione.
- **Controllo qualita**: copertura, buchi operativi, sicurezza della pubblicazione e materiale pronto da condividere.
- **Worldbuilding sistemico**: culture, lingue, storia, conflitti, cosmologia, fazioni, relazioni, causalità e conseguenze persistenti.
- **Regione giocabile**: ponte tra worldbuilding profondo e tavolo, con luoghi, poteri, pressioni, segreti, missioni e materiale player-safe.
- **Compatibilita 5.5e sobria**: creature, incontri, oggetti, party e riferimenti SRD sono pensati per fantasy D&D-like, ma restano scaffolding operativo e non una ripubblicazione completa del regolamento.
- **Markdown-first**: i contenuti restano nel vault dell'utente.
- **Release finale**: il vault genera una copia consegnabile pulita usando `npm run release:final`.

## Primo Avvio In 5 Minuti

1. Scarica lo ZIP della release.
2. Estrai lo ZIP, apri la cartella in Obsidian e accetta/abilita i plugin community inclusi solo se la release arriva da fonte affidabile.
3. Vai su [[Inizia Qui]]. Apri [[Risorse/Setup Guidato]] solo se pulsanti, tabelle o pagina iniziale non rispondono.
4. Scegli una strada: **Prima sessione** per giocare subito, **Crea mondo** per fondare l'ambientazione, **Regione giocabile** per rendere un territorio pronto al tavolo.
5. Quando hai obiettivo, luogo, pressione e materiale essenziale, passa a **Prepara sessione**, poi **Gioca**, poi **Chiudi e aggiorna**.

## Aspetto GDR

La release utente include lo snippet, le configurazioni principali e, quando preparata dal manutentore, i plugin community da accettare all'apertura. I bundle plugin restano fuori da Git.

Se l'aspetto non sembra quello previsto:

1. Apri **Impostazioni > Aspetto > Snippet CSS**.
2. Verifica che `gdr-vault` sia attivo.
3. Se non lo vedi, ricarica gli snippet CSS dalla stessa sezione.
4. Consigliato: tema **Minimal** e pannello **Style Settings > GDR Vault** per palette, densità di dashboard, tabelle e callout.

Lo snippet non aggiunge dipendenze. Migliora dashboard, callout, card, pulsanti e Vista Giocatori usando classi CSS compatibili con Obsidian, Dataview e Meta Bind.

## Flusso Rapido

1. Apri il vault in Obsidian e vai su [[Inizia Qui]].
2. Clicca **Prima sessione** se vuoi arrivare subito al tavolo, oppure **Crea mondo** se devi fondare l'ambientazione.
3. Prepara solo il minimo giocabile: obiettivo, apertura, luogo, PNG, pressione e materiale essenziale.
4. Clicca **Gioca**.
5. Dopo la partita clicca **Chiudi e aggiorna**.
6. Usa **Regione giocabile** quando una zona deve reggere piu sessioni senza diventare enciclopedia.
7. Usa Worldbuilder, Bibbia del Mondo, Atlante e Canone solo quando una domanda del tavolo richiede profondita.

Se dashboard, pulsanti o tabelle non funzionano, apri [[Risorse/Primo Avvio Strumenti]], [[Risorse/FAQ]] e poi [[Risorse/Se Qualcosa Non Funziona]].

## Flusso Consigliato

1. Crea o apri un mondo dalla [[Worldbuilder Dashboard]].
2. Usa [[Risorse/Regione Giocabile]] per dare al primo territorio luoghi, poteri, pressioni, segreti e uscita verso sessione.
3. Costruisci il Codex: culture, lingue, storia, poteri, religioni, relazioni, risorse, mappe e misteri solo quando servono.
4. Trasforma il mondo in campagna o avventura da [[Campagna da Ambientazione]].
5. Prepara la prossima sessione con [[Risorse/Preparazione Sessione]] solo quando ha almeno tre ancore mondo.
6. Crea entita utili al mondo e al tavolo: PNG, luoghi, missioni, incontri, oggetti, dispense, culture, conflitti, rotte, risorse e relazioni.
7. Collega le note usando i campi interattivi.
8. Durante il gioco usa [[Hub/Durante il Gioco]] per appunti, timer, PNG attivi, incontri pronti, dispense e Inbox Live.
9. Usa clock e progress track in [[Mondi/Tracciati/Tracciati]] quando una minaccia, un viaggio o un rituale deve avanzare in modo visibile.
10. Dopo la sessione apri [[Risorse/Post Sessione Guidato]]: canonizza eventi, aggiorna mondo/missioni/tracciati e scegli la prossima sessione attiva.
11. Apri [[Hub/Cosa Succede Fuori Scena]] per decidere quali PNG, fazioni, missioni e clock reagiscono prima della sessione successiva.

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
- `SRD`: riferimento separato al System Reference Document 5.2.1 in italiano, materializzato nella release pulita.
- `Inbox`: idee grezze e appunti non ancora sistemati.
- `Giocatori`: area dedicata a materiale condivisibile.
- `Vista Giocatori`: portale sicuro per i giocatori, pronto per tavolo, stream o pubblicazione selettiva.
- `Quality Report`: controllo visuale di copertura, note incomplete e materiale pronto da condividere.
- `Post Sessione Guidato`: percorso per consolidare quello che e successo al tavolo.

## Mondo, Campagna E Risorse

- Un **mondo** contiene ciò che esiste nell'ambientazione: luoghi, popoli, fazioni, religioni, creature, oggetti e verità canoniche.
- Una **campagna** raccoglie ciò che accade al tavolo: party, sessioni, missioni, conseguenze e ricompense.
- **Avventure** e **one-shot** stanno nella campagna quando sono legate a un gruppo o a una storia precisa.
- Tabelle, mappe, dispense e materiali riutilizzabili in piu campagne stanno in `Risorse`.
- [[Worldbuilder Dashboard]] mostra ora Atlante del Mondo, Poteri in Movimento, Relazioni PNG, Timeline Causale e Buchi Di Mondo: usali per trovare collegamenti mancanti, pressioni senza prossima mossa e lore canonica non ancora storicizzata.
- [[Atlante del Mondo]] e la vista principale per worldbuilding strutturale: geografia, culture, lingue, poteri, storia, conflitti, cosmologia, mappe, layer, territori e rotte.
- [[Geopolitical Dashboard]] mostra territori politici, confini, vassalli, risorse strategiche, relazioni diplomatiche e buchi geopolitici.
- [[Motore Mondo Vivo]] e il layer sistemico sopra gli strumenti DM: mostra propagazione eventi, dinamiche di fazione, relationship graph, causalita storica e continuita da chiudere prima della prossima sessione.
- [[Hub/Cosa Succede Fuori Scena]] e la vista pratica per il dopo sessione: mostra pressioni urgenti, clock quasi pieni, missioni in stallo, segreti da collegare e conseguenze non propagate.
- `Mondi/Relazioni` contiene alleanze, rivalita, trattati, vassallaggi, debiti e faide quando un legame deve avere stato, intensita, conseguenze e propagazione propria.
- [[Risorse/Regione Giocabile]] controlla se un territorio ha abbastanza geografia, poteri, cultura, pressione, mistero e uscita player-safe per arrivare al tavolo.
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
- Mantieni il worldbuilding portabile in `Mondi`, `Campagne`, `Hub` e `Risorse`, ma considera D&D 5.5-compatible il profilo meccanico principale per creature, incontri, oggetti, party e prep.
- Distingui sempre tre livelli: `SRD` come riferimento CC-BY-4.0, opzioni starter del vault come scaffolding compatibile, canone del mondo come materiale homebrew.

## Manutenzione Leggera

- Non lasciare link placeholder: crea la nota o trasforma il link in testo semplice.
- Archivia invece di cancellare quando una nota ha valore storico.
- Dopo una sessione, aggiorna missioni, tracciati, PNG, luoghi visitati, ricompense e conseguenze da [[Risorse/Post Sessione Guidato]].
- Il layer operativo interno e documentato in [[Dev/Sviluppo Vault]]: input Meta Bind, pulsanti, wizard, JS views e fileClass.
- Per controlli e sviluppo del vault, vedi [[Dev/Sviluppo Vault]].
- Per preparare una release o una copia pulita, apri [[Dev/RELEASE]] e [[Risorse/Controllo Vault]].
- Per creare la copia consegnabile standard, usa `npm run release:final`: produce sempre `dist/vault-gdr-clean` e `dist/vault-gdr-clean.zip`.
- Per importare mappe esterne come bozze, apri [[Risorse/Importare Mappe]] o usa `npm run import:azgaar`.
- Non modificare manualmente le note in `SRD` nella release: sono un riferimento regolamentare separato e possono essere rigenerate.

## Sviluppo leggero

- Il repository sorgente non traccia `SRD/`, `z.bases/`, `z.fileclass/`, `z.bacheche/`, `z.modelli/` o i JSON generati: sono output materializzati da pipeline.
- Dopo un clone o una modifica ai moduli YAML/Jinja, esegui `npm run sync:sources` prima dei check.
- La release pulita rigenera `SRD/`, fileClass, Bases, template, bacheche e JSON runtime con `npm run release:clean`.
- Per i dati meccanici della creazione PG modifica `Dev/TemplateFactory/modules/srd_character_build.yaml`, poi esegui `npm run sync:sources`.

## Sviluppo

Comandi principali dal root del vault:

```bash
npm run check
npm run release:final
npm run sync:sources
npm run check:repo
npm run clean:repo
npm run import:srd
npm run import:srd-data
npm run import:azgaar
npm run release:clean
npm run prepare:manual-release-test
```

`npm run release:final` e il percorso operativo normale: rigenera i sorgenti, verifica versione, runtime, JS e diff, poi costruisce una sola release finale pulita con zip validato. `npm run check` resta l'audit completo: valida pipeline dichiarativa, plugin obbligatori, link, template Meta Bind, helper Templater, file del layer interno, input template, pulsanti, preset Metadata Menu, igiene del repository, sintassi tooling e contratti runtime statici. Non apre Obsidian. Per una prova umana della release usa `npm run prepare:manual-release-test`, poi apri manualmente la cartella indicata e rimanda il feedback. `npm run sync:sources` materializza gli output ignorati necessari al vault locale. `npm run release:clean` crea la release pulita senza i controlli mirati di `release:final`. `npm run clean:repo` rimuove solo artefatti locali e temporanei ignorati.



## Per Chi E Pensato

- DM e worldbuilder che vogliono preparare e giocare da Obsidian.
- Campagne fantasy con impronta principale D&D 5.5-compatible e worldbuilding abbastanza pulito da restare adattabile.
- Utenti non tecnici che preferiscono pulsanti, dashboard e campi guidati.

## SRD

`SRD` contiene il System Reference Document 5.2.1 in italiano come archivio regolamentare separato dal contenuto del mondo. Non e sorgente tracciato: viene rigenerato nella release pulita da `Dev/TemplateFactory/tools/import_srd.js`. I dati runtime per PG, creature, incontri e oggetti sono scaffolding D&D 5.5-compatible: possono usare riferimenti SRD, ma non vanno letti come canone del mondo o come ripubblicazione completa del regolamento. La procedura tecnica sta in [[Dev/Sviluppo Vault]].

## Licenza

- Il vault e i suoi contenuti sono rilasciati con licenza **CC BY-NC-SA 4.0**. Vedi [[LICENSE]].
- Gli script runtime in `z.automazioni` e il tooling in `Dev/TemplateFactory/tools` sono rilasciati con licenza **MIT**. Vedi [[LICENSE]].
- Il materiale in `SRD` mantiene la propria licenza **CC-BY-4.0** e non e coperto dalla licenza del vault.
