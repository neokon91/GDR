<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Governante:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):governante]`
>
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Popolazione:
> `INPUT[number:popolazione]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(minacciato, Minacciato), option(distrutto, Distrutto), option(archiviata, Archiviata)):stato]`
>
> Prima impressione:
> `INPUT[text:impressione]`

> [!luogo] Al primo sguardo
> `=this.impressione`
>
> > [!scena]- Funzione narrativa
> > `=this.funzione_narrativa`
>
> > [!pericolo]- Tensione locale
> > `=this.tensione`

> [!regia] Gestione
> ```meta-bind-button
> label: Atlante
> style: primary
> actions:
>   - type: open
>     link: "[[Atlante del Mondo]]"
> ```
>
> ```meta-bind-button
> label: Nuovo PNG
> style: primary
> actions:
>   - type: templaterCreateNote
>     templateFile: "z.modelli/personaggio/PNG.md"
>     folderPath: "Mondi/Personaggi"
>     open: true
> ```
>
> ```meta-bind-button
> label: Nuovo Incontro
> style: default
> actions:
>   - type: templaterCreateNote
>     templateFile: "z.modelli/dm/Incontro.md"
>     folderPath: "Mondi/Incontri"
>     open: true
> ```
>
> ```meta-bind-button
> label: Nuova Mappa Zoom
> style: default
> actions:
>   - type: templaterCreateNote
>     templateFile: "z.modelli/mappe/Mappa Zoom.md"
>     folderPath: "Risorse/Mappe"
>     open: true
> ```

````tabs
tab: Essenziale

## Creazione Rapida

Questi campi bastano per portare il luogo al tavolo.

> [!luogo] Prima impressione
> `INPUT[text:impressione]`

> [!pericolo] Tensione locale
> `INPUT[text:tensione]`

> [!scena] Promessa al tavolo
> `INPUT[text:promessa_al_tavolo]`

## Scene, Voci E Scelte

```meta-bind
INPUT[list:scene]
```

```meta-bind
INPUT[list:voci]
```

```meta-bind
INPUT[list:scelte]
```

tab: Mappa Locale

## Quartieri e Luoghi Importanti

```dataview
TABLE tipo, stato
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
```

tab: Potere

## Governo

## Economia

> [!scena]- Contesto politico
>

## Fazioni presenti

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

## Risorse

```meta-bind
INPUT[list:risorse]
```

## Voci

```meta-bind
INPUT[list:voci]
```

tab: Persone

## PNG importanti

```dataview
TABLE ruolo, stato
FROM "Mondi/Personaggi"
WHERE luogo = this.file.link OR contains(fazioni, this.file.link)
```

tab: Problemi

## Problemi attuali

```meta-bind
INPUT[list:problemi]
```

> [!pericolo]- Problemi attuali
>

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Segreti e verita nascoste
>

## Indizi

```meta-bind
INPUT[list:indizi]
```

## Scene Possibili

```meta-bind
INPUT[list:scene]
```
````
