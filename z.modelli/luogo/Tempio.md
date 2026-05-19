<% await tp.user.tempio(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Regione:
> `INPUT[suggester(optionQuery("Mondo/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Divinità principale:
> `INPUT[suggester(optionQuery("Mondo/Religioni"), useLinks(partial), allowOther):divinita_principale]`
>
> Culto associato:
> `INPUT[suggester(optionQuery("Mondo/Religioni"), useLinks(partial), allowOther):culto_associato]`
>
> Reliquie:
> `INPUT[inlineList:reliquie]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Descrizione
> 

> [!lettura] Descrizione da leggere
> 

## Architettura

## Dottrina

## Rituali

## Gerarchia clericale

## Reliquie

`INPUT[inlineList:reliquie]`

> [!tesoro] Reliquie
> 

## PNG importanti

```dataview
TABLE ruolo, stato, atteggiamento
FROM "Mondo/Personaggi"
WHERE luogo = this.file.link
SORT nome ASC
```

## Luoghi collegati

```dataview
TABLE tipo, stato
FROM "Mondo/Luoghi"
WHERE luogo_padre = this.file.link
```

## Storia

## Misteri

> [!indizio] Misteri
> 

## Segreti

> [!segreto]- Segreti
> 

## Hook narrativi
