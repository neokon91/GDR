<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infoboxwiki]- Sala di Controllo
> Governante:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):governante]`
>
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
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
> `INPUT[canonico][:canonico]`
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

> [!lettura] Player Safe
> Cosa si puo dire ai giocatori: `INPUT[text:player_safe]`

> [!segreto]- DM
> Segreti, verita nascoste e prossime mosse: `INPUT[text:segreto]`

> [!regia] Gestione
> `BUTTON[atlante-atlante-del-mondo-2]`
>
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
>
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]`
>
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!luogo] Al tavolo
> Prima impressione: `INPUT[text:impressione]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Tensione: `INPUT[text:tensione]`

> [!timer] Se Nessuno Interviene
> Pressione: `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
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

### Feedback Creazione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
```

### Mappe Del Luogo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPlaceMapCards(dv);
```

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
