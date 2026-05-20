<% await tp.user.culto(tp) %>
# `=this.nome`

>[!infoboxwiki]- Divinità
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

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!missione] Fede In Gioco
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Cosa chiede ai fedeli: `INPUT[text:richiesta_ai_fedeli]`
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
