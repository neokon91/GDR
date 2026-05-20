<% await tp.user.campagna(tp) %>
# `=this.nome`

>[!infoboxwiki]- Campagna
> Stato:
> `INPUT[inlineSelect(option(preparazione, Preparazione), option(in gioco, In gioco), option(in pausa, In pausa), option(conclusa, Conclusa), option(archiviata, Archiviata)):stato]`
>
> Tono:
> `INPUT[text:tono]`
>
> Livello attuale:
> `INPUT[number:livello_attuale]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Luoghi principali:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

> [!scena] Premessa
>

````tabs
tab: Tavolo

## Tono e Temi

> [!regola] Paletti di campagna
>

## Party

```dataview
TABLE giocatore, classe, livello, stato
FROM "Mondi/Personaggi"
WHERE tipo = "pg" AND contains(this.personaggi, file.link)
```

tab: Mondo

## Luoghi Chiave

```dataview
TABLE tipo, pericolo
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
```

## Fazioni In Gioco

```dataview
TABLE tipo, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
```

tab: Sessioni

## Sessioni

```dataview
TABLE data, data_mondo, stato
FROM "Mondi/Sessioni"
WHERE contains(campagne, this.file.link) OR contains(this.sessioni, file.link)
SORT data DESC
```

tab: Trama

## Trama

> [!missione] Trama
>

## Missioni Aperte

```dataview
TABLE stato, committente, luoghi
FROM "Mondi/Missioni"
WHERE contains(personaggi, this.file.link) OR contains(luoghi, this.file.link) OR stato = "in corso"
SORT stato ASC, nome ASC
```

tab: Fronti

## Fronti e Minacce

> [!pericolo] Fronti e minacce
>

> [!timer] Orologi di campagna
> - [ ]
> - [ ]
> - [ ]
> - [ ]

## Verita Canoniche

> [!indizio] Verita confermate
>

tab: Note

## Note
````
