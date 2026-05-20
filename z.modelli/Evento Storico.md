<% await tp.user.evento_storico(tp) %>
# `=this.nome`

>[!infobox|wiki]- Evento Storico
> Stato:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(segreto, Segreto), option(falso, Falso), option(retcon, Retcon), option(dimenticato, Dimenticato), option(archiviata, Archiviata)):stato_canonico]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Fonte:
> `INPUT[inlineSelect(option(prep, Prep), option(sessione, Sessione), option(player, Player), option(improvvisazione, Improvvisazione), option(retcon, Retcon), option(import, Import)):fonte]`
>
> Grado certezza:
> `INPUT[inlineSelect(option(basso, Basso), option(medio, Medio), option(alto, Alto)):grado_certezza]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Data mondo:
> `INPUT[text:data_mondo]`
>
> Calendario:
> `INPUT[text:fc-calendar]`
>
> Data Calendarium:
> `INPUT[text:fc-date]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Sessioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial)):sessioni]`
>
> Missioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`
>
> Tracciati:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Tracciati"), useLinks(partial)):tracciati]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`
>
> Pronta al tavolo:
> `INPUT[toggle:giocabile]`

> [!lettura] Evento
>

## Lettura Storica

### Cosa Accadde Davvero

```meta-bind
INPUT[list:fatti_accertati]
```

### Come Viene Ricordato

```meta-bind
INPUT[list:memoria_pubblica]
```

### Chi Lo Racconta Diversamente

```meta-bind
INPUT[list:versioni_alternative]
```

### Cosa Ha Cambiato Nella Vita Quotidiana

```meta-bind
INPUT[list:cambiamenti_quotidiani]
```

### Eredità Materiali

```meta-bind
INPUT[list:eredita_materiali]
```

## Causalità

> [!scena] Causa
> `INPUT[text:causa]`
>
> Cause collegate:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):cause]`
>
> Effetti collegati:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):effetti]`
>
> [!timer] Prossima mossa
> `INPUT[text:prossima_mossa]`

## Propagazione

> [!timer] Cosa cambia nel mondo
> Entità impattate:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
>
> Stato mondo:
> `INPUT[list:stato_mondo]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Rendere Giocabile

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

### PNG Coinvolti

```meta-bind
INPUT[list:png_coinvolti]
```

### Ricompense

```meta-bind
INPUT[list:ricompense]
```

## Controllo Canone

> [!warning] Contraddizioni e retcon
> Contraddice:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):contraddice]`
>
> Retcon di:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):retcon_di]`
>
> Motivo retcon:
> `INPUT[text:retcon_motivo]`

## Collegamenti Dinamici

### PNG Coinvolti

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

### Fazioni Coinvolte

```dataview
TABLE tipo, stato, pressione, prossima_mossa
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT pressione DESC, nome ASC
```

### Sessioni Collegate

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(this.sessioni, file.link)
SORT data DESC
```

### Propagazione Collegata

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.propaga_a, file.link) OR contains(this.entita_impattate, file.link) OR contains(this.effetti, file.link)
SORT categoria ASC, nome ASC
```
