<% await tp.user.oggetto(tp) %>
# `=this.nome`

>[!infoboxwiki]- Oggetto
> Tipo:
> `INPUT[text:tipo]`
>
> Rarità:
> `INPUT[inlineSelect(option(comune, Comune), option(non comune, Non Comune), option(raro, Raro), option(molto raro, Molto Raro), option(leggendario, Leggendario), option(artefatto, Artefatto)):rarita]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(consegnato, Consegnato), option(archiviata, Archiviata)):stato]`
>
> Canonico:
> `INPUT[canonico][:canonico]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Proprietario:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

> [!tesoro] Descrizione
>

## Scheda Viva

> [!scena] Gancio
> `INPUT[text:gancio]`

> [!missione] Al Tavolo
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Cosa cambia se ignorato: `INPUT[text:prossima_mossa]`
>
> Versione player-safe: `INPUT[text:player_safe]`

> [!segreto]- DM
> `INPUT[text:segreto]`

### Connessioni Vive

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):connessioni]`

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.connessioni, file.link)
SORT categoria ASC, file.name ASC
```

### Feedback Creazione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderCreationFeedback(dv);
```

## Proprietà

> [!regola] Proprietà
>

## Storia

> [!indizio] Storia
>

## Proprietario

`INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`

## Luogo

`INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

## Segreti

> [!segreto]- Segreti
>
