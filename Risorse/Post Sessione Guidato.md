---
cssclasses:
  - dashboard
  - gdr-post-session-flow
categoria: risorsa
tipo: post-sessione
stato: pronto
---

# Post Sessione Guidato

> [!missione] Risultato
> Trasforma la sessione appena giocata in mondo aggiornato: decisioni, conseguenze, missioni, PNG, luoghi, clock, recap pubblico, recap DM e prossima sessione.

`BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

`BUTTON[nuovo-evento-storico-z-modelli-evento-storico-md]`

`BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`

## Sessione Da Processare

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderActiveSessionBanner(dv);
gdr.renderPostSessionCommandCenter(dv);
gdr.renderPostSessionFocus(dv);
```

`BUTTON[wizard-fine-sessione]`

## 1. Decisioni Prese

> [!scena] Cosa hanno scelto i giocatori
> -

> [!indizio] Informazioni emerse
> -

> [!tesoro] Materiale usato o consegnato
> -

## 2. Canonico Da Confermare

Trasforma solo cio che resta vero nel mondo. Il resto resta rumor, bozza o appunto archiviato.

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCanonDecisionCards(dv);
```

> [!regia] Conferma canone
> - [ ] Evento vero creato o aggiornato in [[Mondi/Timeline/Timeline]].
> - [ ] PNG, luogo, fazione o missione aggiornati se sono cambiati.
> - [ ] Appunti non canonici marcati rumor, leggenda, segreto, falso, archiviata o ignorata.

## 3. Conseguenze Da Applicare

`BUTTON[registra-scelta-mondo]`

`BUTTON[applica-conseguenza]`

`BUTTON[propaga-a-entita]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderM11ContinuityChain(dv);
gdr.renderConsequenceCards(dv);
```

> [!timer] Applicazione
> - [ ] Missioni: stato, pressione, ricompense, prossima mossa.
> - [ ] PNG: atteggiamento, luogo, segreti rivelati, conseguenze.
> - [ ] Luoghi: stato, pericolo, controllo, accesso.
> - [ ] Clock: `progress_value`, `pressione`, `innesco`, `prossima_mossa`.
> - [ ] Fazioni: obiettivo, pressione, relazione, propagazione.

## 4. Prossime Mosse

Apri [[Cosa Succede Fuori Scena]] solo per decidere cosa si muove prima della prossima preparazione.

### Entità Impattate

Missioni, clock e fazioni toccate dalle conseguenze devono avere una `prossima_mossa` aggiornata prima di chiudere il post-sessione.

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderImpactedNextMoveCards(dv);
```

### Pressioni Aperte

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderNextMoveCards(dv);
```

## 5. Prossima Sessione

```dataview
TABLE data, data_mondo, stato, attiva, obiettivo, apertura, scelta
FROM "Mondi/Sessioni"
WHERE (attiva = true OR stato = "preparazione" OR stato = "pronto")
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
> `BUTTON[prepara-recap-pubblico]`
>
> - Cosa e successo:
> - Cosa sanno tutti:
> - Missioni aggiornate:
> - PNG o luoghi ora noti:
> - Prossimo aggancio pubblico:
>
> Non copiare da recap DM, segreti, prossime mosse o campi nascosti. Prima di condividere materiale, controlla [[Vista Giocatori]] e [[Risorse/Controllo Vault]].

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
