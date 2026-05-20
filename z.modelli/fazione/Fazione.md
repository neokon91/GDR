<% await tp.user.fazione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Fazione
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(ostile, Ostile), option(in guerra, In Guerra), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[canonico][:canonico]`
>
> Stato canonico:
> `INPUT[stato canonico][:stato_canonico]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Leader:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):leader]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Influenza:
> `INPUT[text:influenza]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`
>
> Scadenza nel mondo:
> `INPUT[text:scadenza_mondo]`
>
> Clock:
> `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> Segmenti:
> `INPUT[number:progress_max]`
>
> Innesco escalation:
> `INPUT[text:innesco]`
>
> Agenda:
> `INPUT[text:agenda]`
>
> Posta:
> `INPUT[text:posta]`

> [!timer] Fronte attivo
> Pressione: `=this.pressione`
>
> Prossima mossa: `=this.prossima_mossa`
>
> > [!segreto]- Obiettivo nascosto
> > `=this.obiettivo_nascosto`

## Essenziale Al Tavolo

> [!missione] Cosa vuole
> Obiettivo: `INPUT[text:obiettivo]`
>
> Posta: `INPUT[text:posta]`

> [!lettura] Player Safe
> Volto pubblico: `INPUT[text:player_safe]`

> [!segreto]- DM
> Obiettivo nascosto: `INPUT[text:obiettivo_nascosto]`

> [!timer] Se nessuno interviene
> Innesco: `INPUT[text:innesco]`
>
> Prossima mossa: `=this.prossima_mossa`

> [!regia] Gestione
> Pressione: `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Avanzamento: `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> `BUTTON[nuovo-tracciato-z-modelli-dm-tracciato-md]`
>
> `BUTTON[fuori-scena-cosa-succede-fuori-scena-default]`

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!missione] Posta
> Obiettivo pubblico: `INPUT[text:obiettivo]`
>
> Posta: `INPUT[text:posta]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`

> [!timer] Pressione
> Pressione: `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Avanzamento: `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
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

````tabs
tab: Identità

## Creazione Rapida

Questi campi bastano per usarla al tavolo; rete politica, trattati e risorse possono arrivare dopo.

```meta-bind
INPUT[list:mosse_visibili]
```

```meta-bind
INPUT[list:voci]
```

## Identità

> [!scena]- Identità pubblica
>

## Obiettivi

`INPUT[text:obiettivo]`

> [!missione]- Obiettivi
>

## Obiettivo Nascosto

`INPUT[text:obiettivo_nascosto]`

> [!segreto]- Obiettivo nascosto
> `=this.obiettivo_nascosto`

## Risorse

```meta-bind
INPUT[list:risorse]
```

## Mosse Visibili

```meta-bind
INPUT[list:mosse_visibili]
```

## Mosse Segrete

```meta-bind
INPUT[list:mosse_segrete]
```

## Debolezze

```meta-bind
INPUT[list:debolezze]
```

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

## Escalation

```meta-bind
INPUT[list:escalation]
```

## Arricchisci Dopo

```meta-bind
INPUT[list:domande_aperte]
```

> [!pericolo]- Conseguenze possibili
>

tab: Rete

## Leader

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):leader]`

## Luoghi controllati

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`

## PNG Collegati

Alleati, nemici, emissari e membri importanti restano personaggi.

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link) OR contains(fazioni, this.file.link)
SORT nome ASC
```

## Alleati

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):alleati]`

## Rivali

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):rivali]`

## Trattati E Debiti

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):trattati]`

## Relazioni Rilevanti

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):relazioni]`

## Propagazione Politica

### Eventi Che Hanno Cambiato La Fazione

`INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):eventi]`

### Entità Che Cambiano Se La Fazione Si Muove

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

tab: Missioni

## Missioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`

```dataview
TABLE stato, committente, luoghi
FROM "Mondi/Missioni"
WHERE contains(fazioni, this.file.link)
SORT stato ASC, nome ASC
```

## Giocabilità

### Scelte

```meta-bind
INPUT[list:scelte]
```

### Rischi

```meta-bind
INPUT[list:rischi]
```

### Indizi

```meta-bind
INPUT[list:indizi]
```

### Ricompense

```meta-bind
INPUT[list:ricompense]
```

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

## Domande Aperte

```meta-bind
INPUT[list:domande_aperte]
```

> [!segreto]- Segreti
>
````
