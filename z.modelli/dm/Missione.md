<% await tp.user.missione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Missione
> Stato:
> `INPUT[inlineSelect(option(proposta, Proposta), option(accettata, Accettata), option(in corso, In corso), option(completata, Completata), option(fallita, Fallita), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Committente:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):committente]`
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
> Scadenza nel mondo:
> `INPUT[text:scadenza_mondo]`
>
> Calendario:
> `INPUT[text:fc-calendar]`
>
> Data Calendarium:
> `INPUT[text:fc-date]`
>
> Fine evento:
> `INPUT[text:fc-end]`
>
> Categoria Calendarium:
> `INPUT[inlineSelect(option(scadenza, Scadenza), option(pericolo, Pericolo), option(conseguenza, Conseguenza), option(festa, Festa), option(sessione, Sessione)):fc-category]`

> [!missione] Obiettivo
>

> [!timer] Progressione
> - [ ]
> - [ ]
> - [ ]
> - [ ]

````tabs
tab: Situazione

## Situazione

> [!scena] Situazione
>

## Indizi

> [!indizio] Indizi
>

## Ostacoli

> [!pericolo] Ostacoli
>

tab: Ricompense

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompense]`

```dataview
TABLE tipo, rarita, stato, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE contains(this.ricompense, file.link)
SORT rarita ASC, nome ASC
```

tab: Collegamenti

## Collegamenti

### Personaggi Coinvolti

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

### Luoghi Coinvolti

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
SORT nome ASC
```

### Fazioni Coinvolte

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT nome ASC
```

tab: Esiti

## Esiti Possibili

> [!segreto]- Esiti possibili
>

## Note
````
