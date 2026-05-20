# Pubblicazione Community

Questa nota separa la release ZIP per utenti dalla pubblicazione del progetto in community.

## Canali

| Canale | Scopo | Contenuto |
| --- | --- | --- |
| Release ZIP | Utente finale non tecnico | Vault pronto, plugin inclusi, demo, guide operative. |
| Repository GitHub | Sviluppo e trasparenza | Sorgenti, script, docs, issue, changelog. |
| Pagina community | Presentazione | Cosa fa, screenshot, limiti, link alla release. |

## Prima Di Pubblicare

- `npm run check` passa.
- `npm run release:clean` genera ZIP e cartella pulita.
- Lo ZIP si apre in Obsidian e parte da `Inizia Qui`.
- La demo mostra: sessione attiva, clock visibile, conseguenza canonizzata, timeline aggiornata e Stato Campagna.
- README spiega il prodotto, non dettagli interni.
- `docs/INSTALLAZIONE.md` copre installazione da ZIP e da repository.
- Licenze chiare: vault, script, SRD e plugin di terze parti.

## Messaggio Pubblico

Descrizione breve:

> Vault GDR e un vault Obsidian per DM e worldbuilder italiani: prepara sessioni, gestisce missioni e clock, consolida il post-sessione e mantiene un mondo vivo con dashboard operative.

Punti da evidenziare:

- pensato per DM non tecnici;
- Markdown-first, contenuti dell'utente sempre leggibili;
- demo inclusa;
- supporto per sessioni, missioni, tracciati, PNG, luoghi, fazioni, timeline e materiali;
- non richiede Iron Vault.

## Limiti Da Dichiarare

- Alcuni plugin Obsidian vanno abilitati al primo avvio.
- Il vault e pensato per fantasy/D&D-like, non per un sistema specifico obbligatorio.
- Lo SRD e riferimento separato e mantiene la sua licenza.
- Le automazioni non modificano automaticamente note collegate per evitare sovrascritture: il DM conferma in post-sessione.
- Alcune viste avanzate dipendono da Dataview, Meta Bind, Templater e JS Engine.

## Checklist Release Community

- [ ] Preparare screenshot o GIF di `Inizia Qui`, `Durante il Gioco`, `Stato Campagna`, tracciato demo.
- [ ] Creare release GitHub con ZIP generato.
- [ ] Inserire link a installazione, licenze e changelog.
- [ ] Aprire issue template e CONTRIBUTING.
- [ ] Annotare limiti noti e prossima roadmap.
