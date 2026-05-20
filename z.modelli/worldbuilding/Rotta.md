<% await tp.user.rotta(tp) %>
# `=this.nome`

>[!infobox|wiki]- Rotta
> Stato rotta:
> `INPUT[inlineSelect(option(aperta, Aperta), option(chiusa, Chiusa), option(contesa, Contesa), option(maledetta, Maledetta), option(interrotta, Interrotta)):stato_rotta]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Partenza:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):partenza]`
>
> Arrivo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):arrivo]`
>
> Regioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`
>
> Fazioni controllanti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`
>
> Risorse trasportate:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse_trasportate]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

> [!timer] Stato commerciale
> `=this.stato_rotta` · pressione `=this.pressione`
>
> Prossima mossa: `=this.prossima_mossa`

````tabs
tab: Rotta

## Passaggio

| Campo | Valore |
| --- | --- |
| Partenza | `=this.partenza` |
| Arrivo | `=this.arrivo` |
| Regioni | `=this.regioni` |
| Mappa | `=this.mappa` |
| Coordinate | `=this.coordinate` |
| Layer | `=this.layer_mappa` |

## Rischi

```meta-bind
INPUT[list:rischi]
```

## Pedaggi

```meta-bind
INPUT[list:pedaggi]
```

tab: Economia

## Risorse Trasportate

`INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse_trasportate]`

## Mercati Collegati

`INPUT[inlineListSuggester(optionQuery("Mondi/Mercati"), useLinks(partial), allowOther):mercati]`

## Conseguenze Se Bloccata

```meta-bind
INPUT[list:conseguenze_se_bloccata]
```

## Conseguenze Da Propagare

```meta-bind
INPUT[list:conseguenze]
```

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

tab: Gioco

## Missioni, Conflitti E Sessioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Conflitti"), useLinks(partial), allowOther):conflitti]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`

## Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

tab: Mappa

## Campi Mappa

| Campo | Uso |
| --- | --- |
| `mappa` | Link a Excalidraw, Hex Cartographer, Zoom Map o immagine. |
| `coordinate` | Coordinate libere, hex, lat/lon o coordinate della mappa. |
| `layer_mappa` | commerciale, politica, religiosa, conflitti. |
| `tipo_mappa` | vista principale consigliata. |

```dataview
TABLE uso, mondo, luogo, stato
FROM "Risorse/Mappe"
WHERE contains(this.mappe, file.link) OR contains(luoghi, this.partenza) OR contains(luoghi, this.arrivo)
SORT uso ASC, file.name ASC
```
````
