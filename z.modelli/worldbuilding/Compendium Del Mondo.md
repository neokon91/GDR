<% await tp.user.compendium_mondo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Compendium
> Tipo:
> `INPUT[inlineSelect(option(materiale, Materiale), option(pianta, Pianta), option(malattia, Malattia), option(moneta, Moneta), option(tecnologia, Tecnologia), option(cibo, Cibo), option(superstizione, Superstizione), option(professione, Professione), option(creatura regionale, Creatura Regionale)):tipo]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Culture:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`
>
> Regioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`
>
> Risorse:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
>
> Uso narrativo:
> `INPUT[text:uso_narrativo]`

````tabs
tab: Identità

## Cosa Si Nota

> [!scena] Al tavolo
> `=this.uso_narrativo`

## Usi

```meta-bind
INPUT[list:usi]
```

## Rischi

```meta-bind
INPUT[list:rischi]
```

tab: Mondo

## Culture, Regioni E Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`

## Eventi Storici

`INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):eventi_storici]`

tab: Gioco

## Missioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Segreti

```meta-bind
INPUT[list:segreti]
```

tab: Mappa

## Campi Mappa

| Campo | Valore |
| --- | --- |
| Mappa | `=this.mappa` |
| Coordinate | `=this.coordinate` |
| Layer | `=this.layer_mappa` |
| Tipo mappa | `=this.tipo_mappa` |
````
