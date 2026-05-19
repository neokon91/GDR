<% await tp.user.sessione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sessione
> Data:
> `INPUT[date:data]`
>
> Data nel mondo:
> `INPUT[text:data_mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(preparazione, Preparazione), option(pronto, Pronto), option(giocata, Giocata), option(archiviata, Archiviata)):stato]`
>
> Campagne:
> `INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial)):campagne]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):personaggi]`
>
> Creature:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Creature"), useLinks(partial)):creature]`
>
> Incontri:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Incontri"), useLinks(partial)):incontri]`
>
> Dispense:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Dispense"), useLinks(partial)):dispense]`

> [!scena] Apertura
> 

> [!lettura] Testo da leggere
> 

> [!timer] Timer della sessione
> - [ ] 
> - [ ] 
> - [ ] 
> - [ ] 

## Scene

```meta-bind
INPUT[list:scene]
```

## Scaletta

> [!scena] Battute previste
> - [ ] Apertura
> - [ ] Scena di pressione
> - [ ] Scelta rilevante
> - [ ] Chiusura

## Luoghi In Scena

```dataview
TABLE tipo, pericolo
FROM "Mondo/Luoghi"
WHERE contains(this.luoghi, file.link)
```

## PNG In Scena

```dataview
TABLE ruolo, stato, luogo
FROM "Mondo/Personaggi"
WHERE contains(this.personaggi, file.link)
```

## Incontri

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondo/Incontri"
WHERE contains(this.incontri, file.link)
SORT pericolo DESC
```

## Creature

```dataview
TABLE type AS tipo_statblock, size AS taglia, cr
FROM "Mondo/Creature"
WHERE contains(this.creature, file.link)
SORT cr ASC
```

## Dispense

```dataview
TABLE tipo, stato, luogo
FROM "Mondo/Dispense"
WHERE contains(this.dispense, file.link)
```

## Ricompense

> [!tesoro] Ricompense previste
> 

```meta-bind
INPUT[list:ricompense]
```

## Appunti Durante Il Gioco

> [!indizio] Appunti rapidi
> 

## Resoconto

> [!scena] Cosa e successo
> 

> [!indizio] Fatti canonici emersi
> 

## Conseguenze

> [!missione] Missioni e mondo
> 

> [!png] PNG cambiati
> 

> [!luogo] Luoghi cambiati
> 

## Ricompense Date

> [!tesoro] Ricompense effettive
> 

## Da Riprendere

> [!segreto]- Da riprendere
> 

## Preparazione Prossima

> [!timer] Apertura prossima sessione
> - [ ] Riassunto da leggere
> - [ ] Scena iniziale
> - [ ] Pressione attiva
