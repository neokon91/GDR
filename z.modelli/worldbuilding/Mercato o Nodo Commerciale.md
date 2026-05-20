<% await tp.user.mercato(tp) %>
# `=this.nome`

> [!economia] Nodo Commerciale
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> > [!luogo]- Dove si trova
> > Luogo: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> > [!timer]- Cosa succede se cambia
> > Prossima mossa: `INPUT[text:prossima_mossa]`

>[!infoboxwiki]- Mercato O Nodo
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Fazioni controllanti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`
>
> Risorse:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`
>
> Rotte:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Rotte"), useLinks(partial), allowOther):rotte]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!missione] Al Tavolo
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Cosa cambia se ignorato: `INPUT[text:prossima_mossa]`
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
tab: Nodo

## Funzione Commerciale

> [!luogo]- Cosa arriva qui
>

## Risorse Scambiate

`INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`

## Dipendenze

```meta-bind
INPUT[list:dipendenze]
```

tab: Controllo

## Fazioni Controllanti

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`

## Pedaggi, Gabelle, Diritti

```meta-bind
INPUT[list:pedaggi]
```

## Rischi

```meta-bind
INPUT[list:rischi]
```

tab: Propagazione

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

## Collegamenti Di Gioco

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Conflitti"), useLinks(partial), allowOther):conflitti]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`
````
