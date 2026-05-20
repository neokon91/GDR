<% await tp.user.missione(tp) %>
# `=this.nome`

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!missione] Obiettivo E Posta
> Obiettivo player-safe: `INPUT[text:player_safe]`
>
> Posta: `INPUT[text:posta]`
>
> Scelta concreta: `INPUT[text:scelta]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`

> [!timer] Pressione
> Pressione: `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Avanzamento: `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`

### Connessioni Vive

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):connessioni]`

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.connessioni, file.link)
SORT categoria ASC, file.name ASC
```

>[!infobox|wiki]- Missione
> Stato:
> `INPUT[inlineSelect(option(proposta, Proposta), option(accettata, Accettata), option(in corso, In corso), option(completata, Completata), option(fallita, Fallita), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Committente:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):committente]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Clock e tracciati:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Tracciati"), useLinks(partial)):tracciati]`
>
> Scadenza nel mondo:
> `INPUT[text:scadenza_mondo]`
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
> `INPUT[inlineSelect(option(scadenza, Scadenza), option(pericolo, Pericolo), option(conseguenza, Conseguenza), option(festa, Festa), option(sessione, Sessione)):fc-category]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Avanzamento:
> `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> Segmenti:
> `INPUT[number:progress_max]`
>
> Innesco:
> `INPUT[text:innesco]`
>
> Posta:
> `INPUT[text:posta]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

> [!missione] Obiettivo
>

> [!regia] Gestione
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> `BUTTON[fuori-scena-cosa-succede-fuori-scena]`
>
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`
>
> `BUTTON[nuova-dispensa-z-modelli-dispensa-md-default]`
>
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md-default]`

```meta-bind
INPUT[list:indizi]
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const value = Math.max(0, Number(current.progress_value ?? 0));
const max = Math.max(1, Number(current.progress_max ?? 6));
const filled = Math.min(value, max);
const pct = Math.round((filled / max) * 100);
const ticks = Array.from({ length: max }, (_, index) => `<span class="gdr-track-tick ${index < filled ? "filled" : ""}"></span>`).join("");
dv.el("div", `
  <div class="gdr-track-card">
    <div class="gdr-track-top">
      <strong>${gdr.escapeHtml(current.nome ?? current.file.name)}</strong>
      <span>${filled}/${max} · ${pct}%</span>
    </div>
    <div class="gdr-track-bar"><span style="width: ${pct}%"></span></div>
    <div class="gdr-track-ticks">${ticks}</div>
  </div>
`);
```

````tabs
tab: Situazione

## Creazione Rapida

Prima rendila giocabile; collega fazioni, luoghi e ricompense dopo.

```meta-bind
INPUT[list:scene_pronte]
```

```meta-bind
INPUT[list:decisioni]
```

## Situazione

> [!scena] Situazione
>
> > [!timer]- Se ignorata
> > Prossima mossa: `=this.prossima_mossa`
> >
> > Scadenza: `=this.scadenza_mondo`

## Scene Pronte

```meta-bind
INPUT[list:scene_pronte]
```

## Indizi

```meta-bind
INPUT[list:indizi]
```

> [!indizio]- Indizi
>

## Ostacoli

```meta-bind
INPUT[list:ostacoli]
```

> [!pericolo]- Ostacoli
>

## Decisioni

```meta-bind
INPUT[list:decisioni]
```

## Domande Aperte

```meta-bind
INPUT[list:domande_aperte]
```

## Arricchisci Dopo

```meta-bind
INPUT[list:voci]
```

tab: Ricompense

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompense]`

```dataview
TABLE tipo, rarita, stato, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE contains(this.ricompense, file.link)
SORT rarita ASC, nome ASC
```

tab: Collegamenti

## Collegamenti

### Personaggi Coinvolti

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

### Luoghi Coinvolti

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
SORT nome ASC
```

### Fazioni Coinvolte

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT nome ASC
```

### Clock E Tracciati

```dataview
TABLE tipo, stato, progress_value, progress_max, pressione, innesco, prossima_mossa
FROM "Mondi/Tracciati"
WHERE contains(this.tracciati, file.link)
SORT pressione DESC, progress_value DESC, nome ASC
```

tab: Esiti

## Esiti Possibili

```meta-bind
INPUT[list:conseguenze]
```

## Propagazione

### Entita Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

### Propaga A

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

### Se Ignorata

> [!timer] Mossa fuori scena
> Innesco: `=this.innesco`
>
> Prossima mossa: `=this.prossima_mossa`
>
> Posta: `=this.posta`

> [!segreto]- Esiti possibili
>

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Segreti
>

## Note
````
