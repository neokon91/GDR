<% await tp.user.lingua(tp) %>
# `=this.nome`

>[!infobox|wiki]- Lingua
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Stato:
> `INPUT[stato base][:stato]`
>
> Culture:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial)):culture]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`

## Suono E Uso

> [!indizio] Come riconoscerla al tavolo
>

## Identità Linguistica

### Suono, Ritmo E Gesti

```meta-bind
INPUT[list:suono_ritmo_gesti]
```

### Chi La Parla E Chi Non Può Parlarla

```meta-bind
INPUT[list:parlanti_esclusi]
```

### Registri Sociali

```meta-bind
INPUT[list:registri]
```

### Scrittura, Supporti E Segni

```meta-bind
INPUT[list:scrittura_supporti]
```

## Parole Note

```meta-bind
INPUT[list:parole_note]
```

## Modi Di Dire E Visione Del Mondo

```meta-bind
INPUT[list:modi_di_dire]
```

```meta-bind
INPUT[list:concetti_intraduicibili]
```

## Storia Della Lingua

```meta-bind
INPUT[list:origine_evoluzione]
```

```meta-bind
INPUT[list:prestiti_linguistici]
```

## Uso Narrativo

```meta-bind
INPUT[list:indizi_linguistici]
```

```meta-bind
INPUT[list:conflitti_linguistici]
```

## Segreti

> [!segreto]- Lingua proibita, vera origine o significati nascosti
>

```meta-bind
INPUT[list:segreti]
```
