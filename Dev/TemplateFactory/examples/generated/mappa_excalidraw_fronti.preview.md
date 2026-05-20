<% await tp.user.mappa(tp) %>
# `=this.nome`

````tabs
tab: Mappa

> [!scena] Cosa Mostra
> `INPUT[text:cosa_mostra]`
>
> Coordinate: `INPUT[text:coordinates]`
>
> Luoghi: `INPUT[luoghi][:luoghi]`

tab: DM

> [!segreto]- Layer DM
> ```meta-bind
> INPUT[list:layer_dm]
> ```

tab: Pubblico

> [!lettura]- Layer Pubblico
> ```meta-bind
> INPUT[list:layer_pubblico]
> ```

tab: Fallback

| Pin | Coordinate | Nota |
| --- | --- | --- |
|  |  |  |
````

```dataview
TABLE tipo, stato, coordinates, luoghi
FROM "Risorse/Mappe"
WHERE stato != "archiviata"
SORT file.name ASC
```
