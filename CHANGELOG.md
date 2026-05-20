# Changelog

## Unreleased

### Prossima Fase

- QA visuale delle dashboard principali e preparazione release community 1.0.

## 0.9.0 - 2026-05-20

### Aggiunto

- [[Motore Mondo Vivo]] come dashboard per propagazione eventi, dinamiche di fazione, relationship graph, causalita storica e continuita narrativa.
- [[Geopolitical Dashboard]] per territori politici, confini, vassalli, risorse strategiche, relazioni diplomatiche e buchi geopolitici.
- [[Bibbia del Mondo]], [[Revisione Lore]] e [[Controllo Canone]] per mantenere coerenza narrativa, fonte, canone e retcon.
- Nuova area [[Mondi/Relazioni/Relazioni]] con template [[z.modelli/worldbuilding/Relazione]] e automazione `relazione`.
- Template e automazioni per lore persistence, event propagation, stato del mondo e causalita storica.
- Demo geopolitica con [[Demo - Marca della Soglia]] e [[Demo - Custodi e Brumafonda]].
- [[Risorse/Guida Lore Professionale]] e [[Risorse/Checklist Lore Professionale]].

### Migliorato

- [[Worldbuilder Dashboard]], [[Atlante del Mondo]], [[Mondi/Stato del Mondo]], [[Risorse/Preparazione Sessione]] e [[Risorse/Post Sessione Guidato]] ora leggono anche propagazione, relazioni e geopolitica.
- I template politici sono operativi: regni, imperi, repubbliche, oligarchie, ducati, contee, baronie e regioni tracciano confini, legittimita, risorse e crisi.
- Cultura e religione producono scelte, tabu, autorita, rituali, eresie, luoghi sacri e propagazione.
- [[Demo - La Reliquia Spezzata]] mostra una catena end-to-end: evento storico -> fazione si muove -> relazione peggiora -> territorio politico nasce -> prossima sessione.
- Il controllo vault segnala geopolitica debole, relazioni senza conseguenze, religioni senza luoghi sacri, culture senza tensioni, eventi senza causa e lore non propagata.

## 0.8.0 - 2026-05-20

### Aggiunto

- Documentazione prodotto in `docs/`: strategia, installazione e matrice strumenti.
- `CONTRIBUTING.md` e issue template GitHub per bug e feature request.
- [[Risorse/Importare Mappe]] e import GeoJSON Azgaar verso bozze di luoghi.
- [[Risorse/Roadmap/0.8.0|Roadmap 0.8.0]] per completamento prodotto prima della release ZIP iniziale.
- [[Demo - Brumafonda.hexcartographer]] per regioni, viaggi ed esplorazione a esagoni.
- [[Demo - Mappa Zoomabile]] con blocco `zoommap` e base SVG locale per TTRPG Tools: Maps.
- [[Risorse/Media Scene]] e [[Demo - Nebbia Sul Ponte]] per cue con timestamp e scene.
- Tabelle Dice Roller per viaggio, scoperte esagono, reazioni fazione e conseguenze post-sessione.

### Migliorato

- README riposizionato come pagina prodotto e non solo guida interna al vault.
- Checklist release aggiornata per ZIP pulito e documentazione community.
- Media, mappe e tabelle sono collegati alla demo e a [[Durante il Gioco]].
- TTRPG Tools: Maps e Hex Cartographer sono guidati ma non bloccano il percorso base.
- BRAT resta attivo come strumento essenziale di manutenzione per plugin non ufficiali; Iron Vault ed Emoji Toolbar restano fuori dal flusso base.
- Aggiunta nota di studio su Iron Vault per replicare nel vault funzioni utili senza imporre il plugin.
- `npm run release:clean` ora genera l'unico ZIP di release, destinato agli utenti e senza materiali di sviluppo repository.

## 0.7.0 - 2026-05-20

### Aggiunto

- [[Vista Giocatori]] per materiale condivisibile: recap, obiettivi, PNG, luoghi e dispense note.
- [[Giocatori/Giocatori]] come indice dell'area giocatori.
- [[Risorse/Release Pulita]] per preparare una copia consegnabile del vault.
- Script `npm run release:clean` per creare `dist/vault-gdr-clean` e, se disponibile, `dist/vault-gdr-clean.zip`.

### Migliorato

- [[Inizia Qui]] resta la pagina introduttiva all'apertura e mostra una prossima azione senza creare contenuti automaticamente.
- [[Risorse/Roadmap/0.7.0|Roadmap 0.7.0]] registra le decisioni di esperienza utente confermate.

## 0.6.0 - 2026-05-20

### Aggiunto

- [[Campagna da Ambientazione]] per trasformare regioni, culture e conflitti in campagne e archi narrativi.
- Generatore guidato "Campagna Da Regione".
- Generatore guidato "Arco Da Conflitto".
- [[Risorse/Opportunità Di Avventura]] per trovare elementi dell'ambientazione pronti a diventare missioni.
- [[Risorse/Fronti Di Campagna]] per pressioni, prossime mosse e scadenze.
- [[Risorse/Generare Campagna Da Ambientazione]] come guida non tecnica.
- [[Risorse/Roadmap/0.7.0|Roadmap 0.7.0]] con proposta e domande sul comportamento atteso del vault.

### Migliorato

- [[1. DM Dashboard]], [[Inizia Qui]], [[Risorse/Risorse]] e README collegano il nuovo percorso da ambientazione a gioco.
- Le campagne generate da regione includono profilo, culture, fazioni, conflitti e domande di campagna.
- Gli archi da conflitto collegano conflitti, campagne, luoghi, fazioni, ricompense e fronti.

## 0.5.0 - 2026-05-20

### Aggiunto

- [[Atlante del Mondo]] per worldbuilding tassonomico e ambientazioni grandi.
- Nuove aree per [[Mondi/Culture/Culture]], [[Mondi/Lingue/Lingue]], [[Mondi/Storia/Storia]], [[Mondi/Conflitti/Conflitti]] e [[Mondi/Cosmologia/Cosmologia]].
- Modelli guidati per cultura, lingua, era storica, conflitto e cosmologia.
- [[Risorse/Worldbuilding Tassonomico]] come guida non tecnica alla costruzione di mondi ricchi.
- [[Risorse/Roadmap/0.5.0|Roadmap 0.5.0]] completata e [[Risorse/Roadmap/0.6.0|Roadmap 0.6.0]] preparata.

### Migliorato

- [[Worldbuilder Dashboard]] collega l'Atlante e mostra conteggi per culture, lingue, conflitti e cosmologia.
- [[Inizia Qui]] porta il worldbuilding avanzato su [[Atlante del Mondo]].
- Controllo qualità aggiornato per le nuove categorie di ambientazione.

## 0.4.0 - 2026-05-20

### Aggiunto

- [[Risorse/Setup Guidato]] per verificare lo stato del vault senza leggere impostazioni interne.
- [[Risorse/Post Sessione Guidato]] per chiudere la partita con passaggi leggibili.
- [[Risorse/Consegna Nuovo DM]] per consegnare il vault senza spiegazioni tecniche.
- [[Risorse/Profili Campagna]] per fantasy classico, investigativo, sandbox e one-shot.
- [[Risorse/Materiali Al Tavolo]] per controllare dispense, mappe, media, incontri e creature della sessione attiva.
- [[Risorse/Preset Calendario]] per usare date del mondo senza spiegare configurazioni interne.
- [[Risorse/Roadmap/0.4.0|Roadmap 0.4.0]] completata come tracciamento della versione.

### Migliorato

- [[Mondi/Calendario]] ora parte da oggi nel mondo, prossime sessioni, missioni con pressione e date da sistemare.
- Demo aggiornata con date narrative gia pronte per calendario, sessioni, scadenze e timeline.
- [[Inizia Qui]] e [[Risorse/Risorse]] collegano il percorso di consegna, preparazione, gioco e post-sessione.

## 0.3.0 - 2026-05-20

### Aggiunto

- Template live dedicati per evento, conseguenza, PNG improvvisato, luogo improvvisato e nota grezza.
- Automazioni live che provano a collegare automaticamente mondo e sessione attiva.
- Checklist post-sessione guidata per chiudere sessione, canonizzare lore e preparare la prossima apertura.
- Validazione frontmatter per categorie, stati e campi operativi minimi.

### Migliorato

- [[1. DM Dashboard]] e [[Worldbuilder Dashboard]] usano gli helper condivisi del Session Context.
- [[Durante il Gioco]] e [[Inbox/Inbox]] creano note live piu specifiche invece di usare sempre template generici.
- `z.automazioni/check_vault.js` distingue meglio warning utili da rumore su note indice o risorse.

## 0.2.0 - 2026-05-19

### Aggiunto

- [[Durante il Gioco]] come runtime DM con sessione attiva esplicita, contesto mondo, lore collegata e quick create.
- [[z.modelli/Lore Capture]] per catturare eventi, dialoghi, luoghi, PNG improvvisati e conseguenze dalla sessione.
- [[Mondi/Timeline/Timeline]] e [[z.modelli/Evento Storico]] per storicizzare eventi canonici, rumor, leggende, segreti e fatti dimenticati.
- [[Mondi/Stato del Mondo]] per vedere conseguenze da applicare, PNG cambiati, luoghi in crisi, fazioni in movimento e missioni influenzate.
- [[Risorse/Roadmap/0.2.0|Roadmap 0.2.0]] per tracciare lo stato della roadmap Runtime + Lore Engine.
- Import SRD esteso a Background, Equipaggiamento, Talenti, Lingue e Specie dalla fonte JSON aggiornata.
- Demo aggiornata con Lore Capture canonizzata, evento storico e conseguenze applicate a luogo, fazione e missione.
- Filtri opzionali per mondo e campagna su [[Worldbuilder Dashboard]] e [[Mondi/Stato del Mondo]].

### Migliorato

- Template sessione con campo `attiva`, stato `in corso` e missioni vive.
- Template e automazioni per PNG, luoghi e fazioni con stati utili allo stato dinamico del mondo.
- [[Worldbuilder Dashboard]], [[Mondi/Mondo]] e [[Inbox/Inbox]] con viste per timeline, lore da canonizzare e stato canonico.
- [[Durante il Gioco]] piu compatta nella vista tavolo.

### Corretto

- Import SRD ora gestisce anche `sezioni[].descrizione`, presente nelle nuove tipologie JSON.

## 0.1.0 - 2026-05-19

### Aggiunto

- Nota [[Inizia Qui]] come onboarding non tecnico.
- [[Risorse/FAQ]] per supporto non tecnico.
- Mini-campagna demo [[Demo - La Reliquia Spezzata]] con mondo, sessioni, PNG, luoghi, fazione, missione, incontro, oggetto, dispensa e mappa relazionale.
- Smoke test tecnico `node z.automazioni/check_vault.js`.
- Documentazione di release in [[RELEASE]].
- File [[VERSION]] con versione corrente del vault.

### Migliorato

- [[Durante il Gioco]] come schermata da tavolo con quadro di regia, missioni della sessione e comandi rapidi.
- Configurazione Templater, Meta Bind e Metadata Menu per separare meglio aree operative, tecniche e generate.
- Snippet `gdr-vault.css`: wrapping, focus visibile, tabelle larghe, griglie responsive e movimento ridotto.
- Documentazione utente per primo avvio, plugin, aiuto e aspetto del vault.

### Corretto

- Icon Folder aggiornato sui percorsi `Mondi/...`.
- Workspace e Homepage puntano all'ingresso corretto del vault.
