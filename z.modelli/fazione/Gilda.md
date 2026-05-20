<% await tp.user.fazione(tp, { tipoFazione: "gilda" }) %>
# `=this.nome`

>[!infobox|wiki]- Gilda
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[stato base][:stato]`
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
> PNG:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Scadenza nel mondo:
> `INPUT[text:scadenza_mondo]`

> [!timer] Fronte attivo
> Prossima mossa: `=this.prossima_mossa`
>
> Scadenza: `=this.scadenza_mondo`

````tabs
tab: Identità

## Scopo

`INPUT[text:obiettivo]`

> [!missione]- Cosa vuole la gilda
> `=this.obiettivo`
>

## Prossima Mossa

`INPUT[text:prossima_mossa]`

> [!timer]- Se nessuno interviene
> `=this.prossima_mossa`

tab: Servizi

## Servizi

```meta-bind
INPUT[list:servizi]
```

## Regole E Prezzi

> [!regola]- Come funziona
>

tab: Rete

## PNG Della Gilda

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link) OR contains(fazioni, this.file.link)
SORT nome ASC
```

## Luoghi Della Gilda

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
SORT nome ASC
```

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Cosa non dicono
>
````
