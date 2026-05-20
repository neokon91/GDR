<% await tp.user.risorsa_mondo(tp) %>
# `=this.nome`

> [!economia] Leva Economica
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> > [!timer]- Scarsita e pressione
> > Scarsita: `INPUT[text:scarsita]`
> >
> > Pressione: `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> > [!segreto]- DM
> > `INPUT[text:segreto]`

>[!infoboxwiki]- Risorsa
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
>
> Controllori:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`
>
> Uso narrativo:
> `INPUT[text:uso_narrativo]`
>
> Scarsità:
> `INPUT[text:scarsita]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

> [!missione] Perché conta
> `=this.uso_narrativo`

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!missione] Al Tavolo
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Cosa cambia se ignorata: `INPUT[text:prossima_mossa]`
>
> Versione player-safe: `INPUT[text:player_safe]`

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

````tabs
tab: Origine

## Luoghi Di Origine

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`

## Regioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`

## Fazioni Controllanti

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`

tab: Uso

## Usi Narrativi

```meta-bind
INPUT[list:usi]
```

## Dipendenze

```meta-bind
INPUT[list:dipendenze]
```

## Luoghi Dipendenti

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi_dipendenti]`

tab: Economia

## Rotte E Mercati

`INPUT[inlineListSuggester(optionQuery("Mondi/Rotte"), useLinks(partial), allowOther):rotte]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Mercati"), useLinks(partial), allowOther):mercati]`

## Rischi

```meta-bind
INPUT[list:rischi]
```

## Conseguenze Se Manca

```meta-bind
INPUT[list:conseguenze_se_bloccata]
```

tab: Tavolo

## Missioni, Conflitti, Sessioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Conflitti"), useLinks(partial), allowOther):conflitti]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`

## Propagazione

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
````
