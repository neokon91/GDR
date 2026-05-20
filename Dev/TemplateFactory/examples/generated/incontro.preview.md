<% await tp.user.incontro(tp) %>
# `=this.nome`

> [!scena] Obiettivo
> `INPUT[text:obiettivo]`

````tabs
tab: Incontro

```encounter
players: []
creatures: []
```

tab: Creature

```statblock
monster: Creatura
```

tab: Tavolo

> [!conflitto]- Complicazioni
> `dice: [[Risorse/Tabelle/Tabelle#^complicazioni]]`
>
> Terreno: `INPUT[text:terreno]`
>
> Ricompense: `INPUT[inlineList:ricompense]`

tab: Fallback

| Nome | Iniziativa | CA | PF | Condizioni |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
````
