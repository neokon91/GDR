<% await tp.user.missione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Missione
> Stato:
> `INPUT[inlineSelect(option(proposta, Proposta), option(accettata, Accettata), option(in corso, In corso), option(completata, Completata), option(fallita, Fallita), option(archiviata, Archiviata)):stato]`
>
> Committente:
> `INPUT[suggester(optionQuery("Mondo/Personaggi"), useLinks(partial), allowOther):committente]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):personaggi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Fazioni"), useLinks(partial)):fazioni]`

> [!missione] Obiettivo
> 

> [!timer] Progressione
> - [ ] 
> - [ ] 
> - [ ] 
> - [ ] 

## Situazione

> [!scena] Situazione
> 

## Indizi

> [!indizio] Indizi
> 

## Ostacoli

> [!pericolo] Ostacoli
> 

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondo/Oggetti"), useLinks(partial), allowOther):ricompense]`

## Collegamenti

### Personaggi Coinvolti

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondo/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

### Luoghi Coinvolti

```dataview
TABLE tipo, stato, pericolo
FROM "Mondo/Luoghi"
WHERE contains(this.luoghi, file.link)
SORT nome ASC
```

## Esiti Possibili

> [!segreto]- Esiti possibili
> 

## Note
