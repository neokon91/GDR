<% await tp.user.mondo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Mondo
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(archiviata, Archiviata)):stato]`
>
> Tono:
> `INPUT[text:tono]`
>
> Tema:
> `INPUT[text:tema]`
>
> Tecnologia:
> `INPUT[text:tecnologia]`
>
> Magia:
> `INPUT[text:magia]`
>
> Promessa:
> `INPUT[text:premessa]`
>
> Mappe:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappe]`
>
> Canonico:
> `INPUT[toggle:canonico]`

## Identità

> [!scena] Promessa del mondo
>
> `=this.premessa`

## Verità Canoniche

> [!indizio] Cosa è vero in questo mondo
>

```meta-bind
INPUT[list:verita]
```

## Domande Aperte

```meta-bind
INPUT[list:domande_aperte]
```

## Tensioni Attive

```meta-bind
INPUT[list:tensioni]
```

````tabs
tab: Luoghi

## Continenti e Regioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):continenti]`

```dataview
TABLE tipo, stato, bioma
FROM "Mondi/Luoghi"
WHERE mondo = this.file.link
SORT nome ASC
LIMIT 12
```

tab: Fazioni

## Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`

```dataview
TABLE tipo, stato, leader, influenza, pressione
FROM "Mondi/Fazioni"
WHERE mondo = this.file.link
SORT nome ASC
LIMIT 12
```

## Fronti e Pressioni

```dataview
TABLE stato, pressione, prossima_mossa, scadenza_mondo
FROM "Mondi/Missioni"
WHERE mondo = this.file.link AND tipo = "fronte" AND stato != "archiviata"
SORT pressione DESC, nome ASC
```

tab: Religioni

## Religioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):religioni]`

```dataview
TABLE tipo, sottotipo, stato
FROM "Mondi/Religioni"
WHERE mondo = this.file.link
SORT nome ASC
LIMIT 12
```

tab: Campagne

## Campagne In Questo Mondo

`INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial), allowOther):campagne]`

```dataview
TABLE stato, tono, livello_attuale
FROM "Campagne"
WHERE contains(mondi, this.file.link) OR contains(mondo, this.file.link) OR contains(this.campagne, file.link)
SORT stato ASC, nome ASC
```

tab: Mappe

## Mappe Del Mondo

`INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappe]`

```dataview
TABLE uso, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE contains(this.mappe, file.link) OR mondo = this.file.link
SORT uso ASC, file.name ASC
```

> [!luogo] Schema relazioni
> Usa [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]] come base quando il mondo ha molte fazioni, PNG o missioni collegate.

tab: Note

## Note Di Costruzione

```meta-bind
INPUT[list:fronti]
```

## Segreti del Mondo

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Idee non ancora confermate
>
````
