<% await tp.user.sessione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sessione
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
> `INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial)):campagne]`
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
> `INPUT[text:obiettivo]`

> [!scena] Al tavolo
> Apertura, testo da leggere, pressione e tiri stanno qui per non disperdere la preparazione.
>
> > [!lettura]- Testo da leggere
> >
> >
>
> > [!timer]- Pressione visibile
> > - Clock: `=this.tracciati`
> > - Missioni: `=this.missioni`
> > - Domanda: quale scelta deve pesare entro fine sessione?
>
> > [!regola]- Tiri rapidi
> > - D20: `dice: 1d20`
> > - Complicazione: `dice: [[Risorse/Tabelle/Tabelle#^complicazioni]]`
> > - Umore PNG: `dice: [[Risorse/Tabelle/Tabelle#^umore-png]]`

````tabs
tab: Scaletta

## Scene

```meta-bind
INPUT[list:scene]
```

## Obiettivo Della Sessione

> [!missione] Obiettivo
> `=this.obiettivo`

## Scaletta

> [!scena]- Battute previste
> - [ ] Apertura
> - [ ] Scena di pressione
> - [ ] Scelta rilevante
> - [ ] Chiusura

tab: In Scena

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

```dataview
TABLE uso, luogo, stato
FROM "Risorse/Mappe"
WHERE contains(this.mappe, file.link)
SORT uso ASC, file.name ASC
```

## Media

```dataview
TABLE uso, tono, campagna, stato
FROM "Risorse/Audio" OR "Risorse/Immagini" OR "Risorse/Video"
WHERE contains(this.audio, file.link) OR contains(this.immagini, file.link) OR contains(this.video, file.link)
SORT uso ASC, tono ASC, file.name ASC
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
````
