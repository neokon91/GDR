<% await tp.user.tracciato(tp) %>
# `=this.nome`

>[!infoboxwiki]- Tracciato
> Tipo:
> `INPUT[inlineSelect(option(clock, Clock), option(progress track, Progress track), option(fronte, Fronte), option(rituale, Rituale), option(minaccia, Minaccia), option(viaggio, Viaggio), option(progetto, Progetto)):tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(attivo, Attivo), option(in pausa, In pausa), option(completato, Completato), option(fallito, Fallito), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Campagne:
> `INPUT[campagne][:campagne]`
>
> Missioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Avanzamento:
> `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> Segmenti:
> `INPUT[number:progress_max]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Innesco:
> `INPUT[text:innesco]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`
>
> Evento scatenante:
> `INPUT[text:evento_scatenante]`
>
> Esito parziale:
> `INPUT[text:esito_parziale]`
>
> Esito finale:
> `INPUT[text:esito_finale]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

> [!regia] Gestione
> Avanzamento: `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> Stato: `INPUT[inlineSelect(option(attivo, Attivo), option(in pausa, In pausa), option(completato, Completato), option(fallito, Fallito), option(archiviata, Archiviata)):stato]`
>
> `BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`
>
> `BUTTON[nuova-conseguenza-z-modelli-live-conseguenza-md-default]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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

> [!timer] Posta
> `=this.posta`

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!pericolo] Al Tavolo
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Cosa cambia se ignorato: `INPUT[text:prossima_mossa]`
>
> Player-safe: `INPUT[text:player_safe]`

> [!segreto]- DM
> `INPUT[text:segreto]`

### Connessioni Vive

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):connessioni]`

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.connessioni, file.link)
SORT categoria ASC, file.name ASC
```

### Feedback Creazione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
```

## Essenziale Al Tavolo

> [!pericolo] Quando avanza
> `INPUT[text:innesco]`

> [!scena] Cosa succede adesso
> `INPUT[text:prossima_mossa]`

> [!missione] Cosa cambia quando si riempie
> `INPUT[text:posta]`

````tabs
tab: Uso

## Quando Avanza

> [!pericolo] Innesco
> `=this.innesco`

## Prossima Mossa

> [!scena] Mossa
> `=this.prossima_mossa`

## Mosse Di Escalation

```meta-bind
INPUT[list:mosse]
```

## Creazione Rapida

Compila questi tre campi prima dei collegamenti: innesco, prossima mossa e posta. Missioni, fazioni e luoghi possono essere collegati dopo.

## Segmenti

- [ ] 1
- [ ] 2
- [ ] 3
- [ ] 4
- [ ] 5
- [ ] 6

tab: Collegamenti

## Missioni

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa
FROM "Mondi/Missioni"
WHERE contains(this.missioni, file.link)
SORT pressione DESC, nome ASC
```

## Fazioni

```dataview
TABLE tipo, pressione, prossima_mossa, luoghi
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT pressione DESC, nome ASC
```

## Luoghi

```dataview
TABLE tipo, pericolo, stabilita, pressione
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
SORT pressione DESC, nome ASC
```

tab: Conseguenze

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Propagazione

### Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

### Propaga A

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

## Rendere Giocabile

```meta-bind
INPUT[list:scelte]
```

```meta-bind
INPUT[list:rischi]
```

```meta-bind
INPUT[list:indizi]
```

```meta-bind
INPUT[list:png_coinvolti]
```

```meta-bind
INPUT[list:ricompense]
```

> [!segreto]- Cosa cambia quando si riempie
>
````
