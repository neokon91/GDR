<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`
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

````tabs
tab: Uso

## Identità Del Punto D'Interesse

### Perché Esiste

```meta-bind
INPUT[list:origine_funzione]
```

### Cosa Lo Rende Memorabile

```meta-bind
INPUT[list:dettagli_memorabili]
```

### Tracce Del Passato

```meta-bind
INPUT[list:tracce_passato]
```

### Cosa Sta Cambiando

```meta-bind
INPUT[list:cambiamenti]
```

## Uso Al Tavolo

> [!scena]- Funzione narrativa
>

## Hook narrativi

```meta-bind
INPUT[list:scene]
```

tab: Rete

## PNG collegati

```dataview
TABLE ruolo, stato
FROM "Mondi/Personaggi"
WHERE luogo = this.file.link
```

## Eventi

> [!scena]- Eventi
>

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Segreti
>

## Indizi

```meta-bind
INPUT[list:indizi]
```

````
