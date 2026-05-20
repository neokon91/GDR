---
cssclasses:
  - dashboard
  - gdr-post-session-flow
categoria: risorsa
tipo: post-sessione
stato: pronto
---

# Post Sessione Guidato

> [!missione] Output
> Trasforma la sessione appena giocata in mondo aggiornato: decisioni, conseguenze, missioni, PNG, luoghi, clock, recap pubblico, recap DM e prossima sessione.

`BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

`BUTTON[nuovo-evento-storico-z-modelli-evento-storico-md]`

`BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`

## Sessione Da Processare

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderActiveSessionBanner(dv);
gdr.renderPostSessionFocus(dv);
```

## 1. Decisioni Prese

> [!scena] Cosa hanno scelto i giocatori
> -

> [!indizio] Informazioni emerse
> -

> [!tesoro] Materiale usato o consegnato
> -

## 2. Canonico Da Confermare

Trasforma solo cio che resta vero nel mondo. Il resto resta rumor, bozza o appunto archiviato.

```dataview
TABLE tipo, stato, stato_canonico, sessioni, collegamenti, impatto
FROM "Inbox" OR "Mondi/Timeline"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (categoria = "lore capture" OR categoria = "evento storico" OR stato_canonico OR canonico != null)
SORT file.mtime DESC
LIMIT 12
```

> [!regia] Conferma canone
> - [ ] Evento vero creato o aggiornato in [[Mondi/Timeline/Timeline]].
> - [ ] PNG, luogo, fazione o missione aggiornati se sono cambiati.
> - [ ] Appunti non canonici marcati rumor, leggenda, segreto, falso, archiviata o ignorata.

## 3. Conseguenze Da Applicare

```dataview
TABLE categoria, tipo, stato, entita_impattate, propaga_a, conseguenze, prossima_mossa
FROM "Mondi" OR "Inbox"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (conseguenze OR entita_impattate OR propaga_a OR prossima_mossa)
SORT file.mtime DESC
LIMIT 16
```

> [!timer] Applicazione
> - [ ] Missioni: stato, pressione, ricompense, prossima mossa.
> - [ ] PNG: atteggiamento, luogo, segreti rivelati, conseguenze.
> - [ ] Luoghi: stato, pericolo, controllo, accesso.
> - [ ] Clock: `progress_value`, `pressione`, `innesco`, `prossima_mossa`.
> - [ ] Fazioni: obiettivo, pressione, relazione, propagazione.

## 4. Prossime Mosse

Apri [[Cosa Succede Fuori Scena]] solo per decidere cosa si muove prima della prossima preparazione.

```dataview
TABLE categoria, tipo, stato, pressione, progress_value, progress_max, innesco, prossima_mossa
FROM "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Personaggi" OR "Mondi/Tracciati" OR "Mondi/Missioni" OR "Mondi/Conflitti"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (pressione >= 5 OR progress_value >= 3 OR prossima_mossa OR innesco)
SORT pressione DESC, progress_value DESC, file.mtime DESC
LIMIT 12
```

## 5. Prossima Sessione

```dataview
TABLE data, data_mondo, stato, attiva, obiettivo, apertura, scelta
FROM "Mondi/Sessioni"
WHERE !startswith(file.name, "Prova -") AND (attiva = true OR stato = "preparazione" OR stato = "pronto")
SORT attiva DESC, data DESC, file.mtime DESC
LIMIT 8
```

> [!scena] Passaggio di consegne
> - [ ] Sessione giocata: `stato: giocata`, `attiva: false`.
> - [ ] Prossima sessione scelta o creata.
> - [ ] Prossima sessione: `attiva: true` solo su una nota.
> - [ ] Prima scena della prossima sessione compilata.

## 6. Recap Pubblico

> [!lettura] Testo mostrabile ai giocatori
> - Cosa e successo:
> - Cosa sanno tutti:
> - Missioni aggiornate:
> - PNG o luoghi ora noti:
> - Prossimo aggancio pubblico:

## 7. Recap DM

> [!segreto] Note private
> - Verita dietro gli eventi:
> - Conseguenze non viste:
> - Fazioni che reagiscono:
> - Segreti ancora nascosti:
> - Apertura consigliata:

## Chiusura

- [ ] Ogni appunto live ha una decisione: canonico, conseguenza, rumor o archiviato.
- [ ] Conseguenze applicate a missioni, PNG, luoghi, fazioni o clock.
- [ ] Recap pubblico compilato senza segreti.
- [ ] Recap DM compilato con prossime mosse reali.
- [ ] Una sola sessione ha `attiva: true`.
