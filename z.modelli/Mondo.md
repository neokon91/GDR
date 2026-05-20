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
> Temi:
> `INPUT[list:temi]`
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
> Promesse narrative:
> `INPUT[list:promesse_narrative]`
>
> Limiti:
> `INPUT[list:limiti]`
>
> Ispirazioni:
> `INPUT[list:ispirazioni]`
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

## Fondamenta Del Mondo

### Principi Di Realtà

```meta-bind
INPUT[list:principi_realta]
```

### Cosa Rende Questo Mondo Diverso

```meta-bind
INPUT[list:differenze_distintive]
```

### Contraddizioni Centrali

```meta-bind
INPUT[list:contraddizioni_centrali]
```

### Cosa La Gente Crede Vero

```meta-bind
INPUT[list:credenze_comuni]
```

## Verità Canoniche

> [!indizio] Cosa è vero in questo mondo
>

```meta-bind
INPUT[list:verita]
```

## Stato Del Mondo

```meta-bind
INPUT[list:stato_mondo]
```

## Continuità Viva

```meta-bind
INPUT[list:continuita]
```

## Relazioni Chiave

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):relazioni_chiave]`

## Bibbia Del Mondo

### Tono E Promesse

```meta-bind
INPUT[list:promesse_narrative]
```

### Temi Da Cercare

```meta-bind
INPUT[list:temi]
```

### Limiti E Cose Da Evitare

```meta-bind
INPUT[list:limiti]
```

```meta-bind
INPUT[list:non_vogliamo]
```

### Ispirazioni

```meta-bind
INPUT[list:ispirazioni]
```

### Domande Guida

```meta-bind
INPUT[list:domande_guida]
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
tab: Fondamenta

## Geografia Che Plasma La Storia

```meta-bind
INPUT[list:geografia_fondativa]
```

## Economia E Risorse

```meta-bind
INPUT[list:economia]
```

```meta-bind
INPUT[list:risorse_contese]
```

## Tecnologia, Magia E Limiti

```meta-bind
INPUT[list:regole_magia]
```

```meta-bind
INPUT[list:limiti_tecnologici]
```

## Vita Quotidiana

```meta-bind
INPUT[list:vita_quotidiana]
```

## Domande Da Tenere Aperte

```meta-bind
INPUT[list:domande_di_mondo]
```

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

## Dinamiche Di Potere

```dataview
TABLE pressione, progress_value, progress_max, agenda, prossima_mossa, alleati, rivali, propaga_a
FROM "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti"
WHERE mondo = this.file.link AND stato != "archiviata"
SORT pressione DESC, nome ASC
LIMIT 16
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

tab: Mondo Vivo

## Eventi Che Cambiano Il Mondo

```dataview
TABLE data_mondo, causa, cause, effetti, conseguenze, propaga_a, prossima_mossa
FROM "Mondi/Timeline"
WHERE mondo = this.file.link AND stato_canonico != "archiviata"
SORT data_mondo ASC, file.name ASC
LIMIT 20
```

## Propagazioni Aperte

```dataview
TABLE categoria, tipo, stato, entita_impattate, propaga_a, conseguenze, prossima_mossa
FROM "Mondi" OR "Inbox"
WHERE mondo = this.file.link AND stato != "archiviata" AND stato != "ignorata" AND (entita_impattate OR propaga_a OR conseguenze OR prossima_mossa)
SORT file.mtime DESC
LIMIT 20
```
````
