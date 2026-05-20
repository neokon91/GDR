<% await tp.user.sessione(tp) %>
# `=this.nome`

````tabs
tab: Prepara

> [!scena] Cinque Blocchi
> Obiettivo: `INPUT[text:obiettivo]`
>
> Prima scena: `INPUT[text:apertura]`
>
> Scelta concreta: `INPUT[text:scelta]`
>
> > [!timer]- Pressioni
> > `INPUT[inlineList:pressioni]`
>
> > [!handout]- Materiale pronto
> > `INPUT[inlineList:materiale_pronto]`

tab: Ancore

> [!luogo] Tre Ancore Minime
> Mondo: `INPUT[mondo][:mondo]`
>
> Luoghi: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Fazioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> PNG: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Missioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`
>
> Clock: `INPUT[inlineListSuggester(optionQuery("Mondi/Tracciati"), useLinks(partial)):tracciati]`

tab: Live

> [!regia] Cockpit
> Attiva al tavolo: `INPUT[toggle:attiva]`
>
> Scena corrente: `INPUT[text:scena_corrente]`
>
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> > [!indizio]- Appunti live
> > `INPUT[inlineListSuggester(optionQuery("Inbox"), useLinks(partial), allowOther):appunti_live]`

tab: Dopo

> [!timer] Delta Del Mondo
> ```meta-bind
> INPUT[list:conseguenze]
> ```
>
> > [!lettura]- Recap pubblico
> > ```meta-bind
> > INPUT[list:recap_pubblico]
> > ```
>
> > [!segreto]- Recap DM
> > ```meta-bind
> > INPUT[list:recap_dm]
> > ```
````

> [!scena] Sessione Radicata Nel Mondo
> Una sessione non parte dal vuoto. Prima collega almeno tre ancore mondo, poi completa i cinque campi di gioco.
>
> | Ancora | Campo |
> | --- | --- |
> | Mondo | `INPUT[mondo][:mondo]` |
> | Luoghi | `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]` |
> | Poteri | `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]` |
> | PNG | `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]` |
> | Missioni | `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]` |
> | Clock | `INPUT[inlineListSuggester(optionQuery("Mondi/Tracciati"), useLinks(partial)):tracciati]` |
>
> | Blocco | Campo |
> | --- | --- |
> | Obiettivo | `INPUT[text:obiettivo]` |
> | Prima scena | `INPUT[text:apertura]` |
> | Scelta concreta | `INPUT[text:scelta]` |
> | Pressione | `INPUT[inlineList:pressioni]` |
> | Materiale pronto | `INPUT[inlineList:materiale_pronto]` |
>
> Stato: `INPUT[inlineSelect(option(preparazione, Preparazione), option(pronto, Pronto), option(in corso, In corso), option(giocata, Giocata), option(archiviata, Archiviata)):stato]`
>
> Attiva al tavolo: `INPUT[toggle:attiva]`
>
> `BUTTON[durante-il-gioco-durante-il-gioco]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const checks = [
  ["Obiettivo", current.obiettivo],
  ["Prima scena", current.apertura],
  ["Scelta", current.scelta],
  ["Pressione", current.pressioni],
  ["Materiale", current.materiale_pronto?.length ? current.materiale_pronto : [...(current.incontri ?? []), ...(current.dispense ?? []), ...(current.mappe ?? [])]]
];
const ok = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const ready = checks.filter(([, value]) => ok(value)).length;
dv.paragraph(ready === 5 ? "Pronta: imposta stato `pronto` e gioca." : `Mancano ${5 - ready} blocchi. Non aprire altro: completa i campi qui sopra.`);
```

> [!scena] Scaletta Giocabile
> Output concreto della preparazione: questa e la traccia da usare al tavolo.

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPlayableOutline(dv, dv.current());
```

> [!regia] Sessione Attiva
> Per andare al tavolo lascia `attiva: true` solo su questa sessione. Spegnilo sulle altre sessioni.

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderActiveSessionBanner(dv);
```

>[!infoboxwiki]- Sessione
> Data:
> `INPUT[date:data]`
>
> Data nel mondo:
> `INPUT[text:data_mondo]`
>
> Calendario:
> `INPUT[text:fc-calendar]`
>
> Data Calendarium:
> `INPUT[text:fc-date]`
>
> Fine evento:
> `INPUT[text:fc-end]`
>
> Categoria Calendarium:
> `INPUT[inlineSelect(option(sessione, Sessione), option(scadenza, Scadenza), option(festa, Festa), option(pericolo, Pericolo), option(conseguenza, Conseguenza)):fc-category]`
>
> Stato:
> `INPUT[inlineSelect(option(preparazione, Preparazione), option(pronto, Pronto), option(in corso, In corso), option(giocata, Giocata), option(archiviata, Archiviata)):stato]`
>
> Sessione attiva:
> `INPUT[toggle:attiva]`
>
> Campagne:
> `INPUT[campagne][:campagne]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Missioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`
>
> Clock e tracciati:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Tracciati"), useLinks(partial)):tracciati]`
>
> Creature:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial)):creature]`
>
> Incontri:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial)):incontri]`
>
> Dispense:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Dispense"), useLinks(partial)):dispense]`
>
> Mappe:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappe]`
>
> Audio:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Audio"), useLinks(partial), allowOther):audio]`
>
> Immagini:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Immagini"), useLinks(partial), allowOther):immagini]`
>
> Video:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Video"), useLinks(partial), allowOther):video]`
>
> Obiettivo:
> `=this.obiettivo`

> [!scena] Al tavolo
> Apertura, testo da leggere, pressione e tiri stanno qui per non disperdere la preparazione.
>
> > [!lettura]- Testo da leggere
> > `=this.apertura`
>
> > [!timer]- Pressione visibile
> > - Clock: `=this.tracciati`
> > - Missioni: `=this.missioni`
> > - Scelta: `=this.scelta`
>
> > [!regola]- Tiri rapidi
> > - D20: `dice: 1d20`
> > - Complicazione: `dice: [[Risorse/Tabelle/Tabelle#^complicazioni]]`
> > - Umore PNG: `dice: [[Risorse/Tabelle/Tabelle#^umore-png]]`

> [!regia] Gestione
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> `BUTTON[materiali-al-tavolo-risorse-materiali-al-tavolo]`
>
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]`
>
> `BUTTON[post-sessione-risorse-post-sessione-guidato-2]`

````tabs
tab: Scaletta

## Scene

```meta-bind
INPUT[list:scene]
```

## Obiettivo Della Sessione

> [!missione] Obiettivo
> `=this.obiettivo`

## Essenziale Al Tavolo

### Apertura

```meta-bind
INPUT[list:scene]
```

### Pressione Da Mostrare

```meta-bind
INPUT[list:pressioni]
```

### Segreti Rivelabili

```meta-bind
INPUT[list:segreti_rivelabili]
```

## Scaletta

> [!scena]- Battute previste
> - [ ] Apertura
> - [ ] Scena di pressione
> - [ ] Scelta rilevante
> - [ ] Chiusura

tab: In Scena

## Cockpit Live

> [!scena] Scena Corrente
> `INPUT[text:scena_corrente]`

> [!missione] Decisioni Prese
> ```meta-bind
> INPUT[list:decisioni_prese]
> ```

> [!indizio] Appunti Live
> `INPUT[inlineListSuggester(optionQuery("Inbox"), useLinks(partial), allowOther):appunti_live]`

## Luoghi In Scena

```dataview
TABLE tipo, pericolo
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
```

## PNG In Scena

```dataview
TABLE ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
```

## Missioni Vive

```dataview
TABLE stato, pressione, progress_value, progress_max, committente, prossima_mossa
FROM "Mondi/Missioni"
WHERE contains(this.missioni, file.link)
SORT pressione DESC, nome ASC
```

## Clock E Tracciati

```dataview
TABLE tipo, stato, progress_value, progress_max, pressione, innesco, prossima_mossa
FROM "Mondi/Tracciati"
WHERE contains(this.tracciati, file.link)
SORT pressione DESC, progress_value DESC, nome ASC
```

## Incontri

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE contains(this.incontri, file.link)
SORT pericolo DESC
```

## Creature

```dataview
TABLE type AS tipo_statblock, size AS taglia, cr
FROM "Mondi/Creature"
WHERE contains(this.creature, file.link)
SORT cr ASC
```

## Dispense

```dataview
TABLE tipo, stato, luogo
FROM "Mondi/Dispense"
WHERE contains(this.dispense, file.link)
```

## Mappe

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderSessionMapCards(dv);
```

## Media

```dataview
TABLE uso, tono, campagna, stato
FROM "Risorse/Audio" OR "Risorse/Immagini" OR "Risorse/Video"
WHERE contains(this.audio, file.link) OR contains(this.immagini, file.link) OR contains(this.video, file.link)
SORT uso ASC, tono ASC, file.name ASC
```

tab: Output Sessione

## Decisioni

```meta-bind
INPUT[list:decisioni_prese]
```

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Recap Pubblico

```meta-bind
INPUT[list:recap_pubblico]
```

## Recap DM

```meta-bind
INPUT[list:recap_dm]
```

## Prossima Apertura

`INPUT[text:prossima_apertura]`

## Output Pronto

```meta-bind
INPUT[list:output_sessione]
```

## Oggetti In Scena

```dataview
TABLE tipo, rarita, stato, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE contains(this.oggetti, file.link)
SORT nome ASC
```

tab: Ricompense

## Materiale Pronto

> [!tesoro] Ricompense previste
>

```meta-bind
INPUT[list:ricompense]
```

## Appunti Durante Il Gioco

> [!indizio] Appunti rapidi
>

## Segreti Rivelabili

```meta-bind
INPUT[list:segreti_rivelabili]
```

## Domande Al Tavolo

```meta-bind
INPUT[list:domande_al_tavolo]
```

## Pressioni

```meta-bind
INPUT[list:pressioni]
```

## Decisioni Attese

```meta-bind
INPUT[list:decisioni_attese]
```

## Arricchisci Dopo

```meta-bind
INPUT[list:voci]
```

tab: Resoconto

## Resoconto

> [!scena]- Cosa e successo
>

> [!indizio]- Fatti canonici emersi
>

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Canone E Propagazione

```meta-bind
INPUT[list:fatti_canonici]
```

```meta-bind
INPUT[list:entita_impattate]
```

```meta-bind
INPUT[list:propaga_a]
```

```meta-bind
INPUT[list:prossime_mosse_fuori_scena]
```

> [!timer]- Clock aggiornati
> -

> [!missione]- Missioni e mondo
>

> [!png]- PNG cambiati
>

> [!luogo]- Luoghi cambiati
>

## Ricompense Date

> [!tesoro]- Ricompense effettive
>

tab: Prossima

## Da Riprendere

> [!segreto]- Da riprendere
>

## Preparazione Prossima

> [!timer] Apertura prossima sessione
> - [ ] Riassunto da leggere
> - [ ] Scena iniziale
> - [ ] Clock o pressione da mostrare subito
> - [ ] Pressione attiva
> - [ ] Una reazione fuori scena da [[Cosa Succede Fuori Scena]]
````
