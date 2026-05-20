<% await tp.user.cosmologia(tp) %>
# `=this.nome`

>[!infobox|wiki]- Cosmologia
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Divinità:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial)):divinita]`
>
> Creature:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial)):creature]`
>
> Luoghi collegati:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi_collegati]`

## Regola Del Reame

> [!regola] Cosa funziona diversamente qui
> `=this.regola`

## Struttura Cosmologica

### Origine E Funzione

```meta-bind
INPUT[list:origine_funzione]
```

### Leggi Metafisiche

```meta-bind
INPUT[list:leggi_metafisiche]
```

### Confini, Soglie E Vie D'accesso

```meta-bind
INPUT[list:soglie_accesso]
```

### Cosa Succede Ai Morti

```meta-bind
INPUT[list:morte_aldila]
```

### Cosa Sanno Le Religioni

```meta-bind
INPUT[list:dottrine_religiose]
```

## Pericolo

> [!pericolo] Costo o rischio
> `=this.pericolo`

## Conseguenze Sul Mondo

```meta-bind
INPUT[list:effetti_su_magia]
```

```meta-bind
INPUT[list:effetti_su_culture]
```

```meta-bind
INPUT[list:fenomeni_visibili]
```

## Uso In Sessione

> [!scena] Come entra al tavolo
>

```meta-bind
INPUT[list:scene_cosmiche]
```

```meta-bind
INPUT[list:indizi_cosmici]
```

## Misteri

> [!segreto]- Verità cosmiche
>

```meta-bind
INPUT[list:misteri]
```
