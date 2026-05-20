# Changelog

## 0.4.0 - in sviluppo

### Aggiunto

- [[Risorse/Setup Guidato]] per verificare lo stato del vault senza leggere impostazioni interne.
- [[Risorse/Roadmap 0.4.0]] con le prossime integrazioni orientate a DM non tecnici.

### Migliorato

- [[Mondi/Calendario]] ora parte da oggi nel mondo, prossime sessioni, missioni con pressione e date da sistemare.
- Demo aggiornata con date narrative gia pronte per calendario, sessioni, scadenze e timeline.

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
- [[Risorse/Roadmap 0.2.0]] per tracciare lo stato della roadmap Runtime + Lore Engine.
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
