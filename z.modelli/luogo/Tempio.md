<% await tp.user.tempio(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Divinità principale:
> `INPUT[suggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):divinita_principale]`
>
> Culto associato:
> `INPUT[suggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):culto_associato]`
>
> Reliquie:
> `INPUT[inlineList:reliquie]`
>
> Canonico:
> `INPUT[canonico][:canonico]`
>
> Stato:
> `INPUT[stato base][:stato]`
>
> Prima impressione:
> `INPUT[text:impressione]`

> [!luogo] Al primo sguardo
> `=this.impressione`
>
> > [!scena]- Funzione narrativa
> > `=this.funzione_narrativa`

````tabs
tab: Culto

## Architettura

## Dottrina

## Rituali

## Gerarchia clericale

tab: Reliquie

## Reliquie

`INPUT[inlineList:reliquie]`

> [!tesoro]- Reliquie
>

tab: Rete

## PNG importanti

```dataview
TABLE ruolo, stato, atteggiamento
FROM "Mondi/Personaggi"
WHERE luogo = this.file.link
SORT nome ASC
```

## Luoghi collegati

```dataview
TABLE tipo, stato
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
```

tab: Misteri

## Storia

## Misteri

> [!indizio]- Misteri
>

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Segreti
>

## Hook narrativi

```meta-bind
INPUT[list:scene]
```
````
