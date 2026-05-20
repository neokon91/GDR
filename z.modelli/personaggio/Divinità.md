<% await tp.user.culto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Divinità
> Dominio o tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[stato base][:stato]`
>
> Canonica:
> `INPUT[canonico][:canonico]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Templi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):templi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

## Dogma

> [!regola] Cosa insegna
>

> [!lettura] Player Safe
> Culto, simboli e precetti noti: `INPUT[text:player_safe]`

> [!segreto]- DM
> Verita divina, eresie o prezzo nascosto: `INPUT[text:segreto]`

## Segni E Simboli

> [!indizio] Come si manifesta
>

## Fedeli E Templi

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondi/Luoghi"
WHERE contains(this.templi, file.link) OR divinita_principale = this.file.link
SORT nome ASC
```

## Fazioni Religiose

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT nome ASC
```

## Misteri

> [!segreto]- Verità divine
>
