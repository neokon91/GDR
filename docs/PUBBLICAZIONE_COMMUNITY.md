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
- La demo mostra: sessione attiva, clock visibile, conseguenza canonizzata, timeline aggiornata, Stato Campagna, relazione peggiorata, territorio politico nato e prossima sessione influenzata.
- README spiega il prodotto, non dettagli interni.
- `docs/INSTALLAZIONE.md` copre installazione da ZIP e da repository.
- Licenze chiare: vault, script, SRD e plugin di terze parti.

## Messaggio Pubblico

Descrizione breve:

> Vault GDR e un vault Obsidian per DM e worldbuilder italiani: prepara sessioni, gestisce party, missioni e clock, mantiene un mondo vivo con fazioni, relazioni e geopolitica, e offre un portale giocatori sicuro per recap, handout e mappe pubbliche.

Punti da evidenziare:

- pensato per DM non tecnici;
- Markdown-first, contenuti dell'utente sempre leggibili;
- demo inclusa;
- supporto per sessioni, missioni, tracciati, PNG, luoghi, fazioni, relazioni, territori politici, timeline, party control, quality report e materiali;
- portale giocatori safe-by-default con controllo anti-segreti;
- core system-neutral con SRD separato;
- non richiede Iron Vault.

## Limiti Da Dichiarare

- Alcuni plugin Obsidian vanno abilitati al primo avvio.
- Il vault e pensato per fantasy system-neutral e D&D-like, non per un sistema specifico obbligatorio.
- Lo SRD e riferimento separato e mantiene la sua licenza.
- Le automazioni non modificano automaticamente note collegate per evitare sovrascritture: il DM conferma in post-sessione.
- Alcune viste avanzate dipendono da Dataview, Meta Bind, Templater e JS Engine.
- L'export statico dedicato dell'area giocatori resta un obiettivo successivo.

## Checklist Release Community

- [ ] Preparare screenshot o GIF di `Inizia Qui`, `Vista Giocatori`, `Party Control`, `Quality Report`, `Durante il Gioco`, `Stato Campagna`, `Motore Mondo Vivo`, `Geopolitical Dashboard`, tracciato demo e relazione demo.
- [ ] Creare release GitHub con ZIP generato.
- [ ] Inserire link a installazione, licenze e changelog.
- [ ] Aprire issue template e CONTRIBUTING.
- [ ] Annotare limiti noti e prossima roadmap.

Per il testo lungo della release, usa [PAGINA_RELEASE.md](PAGINA_RELEASE.md).
