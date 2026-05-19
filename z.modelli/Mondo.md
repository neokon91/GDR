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
> Canonico:
> `INPUT[toggle:canonico]`

## Identità

> [!scena] Promessa del mondo
>

## Verità Canoniche

> [!indizio] Cosa è vero in questo mondo
>

## Continenti e Regioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):continenti]`

```dataview
TABLE tipo, stato, bioma
FROM "Mondi/Luoghi"
WHERE mondo = this.file.link
SORT nome ASC
LIMIT 12
```

## Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE mondo = this.file.link
SORT nome ASC
LIMIT 12
```

## Religioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):religioni]`

```dataview
TABLE tipo, sottotipo, stato
FROM "Mondi/Religioni"
WHERE mondo = this.file.link
SORT nome ASC
LIMIT 12
```

## Campagne In Questo Mondo

`INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial), allowOther):campagne]`

```dataview
TABLE stato, tono, livello_attuale
FROM "Campagne"
WHERE contains(mondi, this.file.link) OR contains(mondo, this.file.link) OR contains(this.campagne, file.link)
SORT stato ASC, nome ASC
```

## Note Di Costruzione

> [!segreto]- Idee non ancora confermate
>
