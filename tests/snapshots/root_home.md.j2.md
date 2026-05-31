# 🏠 GDR — Home

````tabs
--- 🌍 Worldbuilding
> [!abstract] Indici
> [[Atlante|🗺️ Atlante]]
> [[Bestiario|🐾 Bestiario]]
> [[Fazioni|⚔️ Fazioni]]
> [[Cast|🎭 Cast]]
> [[Cronologia|📜 Cronologia]]

> [!example] Crea
> `BUTTON[crea-mondo]`
> `BUTTON[crea-luogo]`
> `BUTTON[crea-fazione]`
> `BUTTON[crea-evento]`
> `BUTTON[crea-png]`
> `BUTTON[crea-creatura]`
> `BUTTON[crea-oggetto]`
> `BUTTON[crea-oggetto_magico]`
> `BUTTON[crea-incantesimo]`
> `BUTTON[crea-epoca]`
> `BUTTON[crea-culto]`
> `BUTTON[crea-regno]`
> `BUTTON[crea-sistema_magico]`
> `BUTTON[crea-dominio]`
> `BUTTON[crea-legge_fondamentale]`
> `BUTTON[crea-entita_primordiale]`
> `BUTTON[crea-piano]`

> [!example]- Altri tipi
> `BUTTON[crea-cosmologia]`
> `BUTTON[crea-cultura]`
> `BUTTON[crea-lingua]`
> `BUTTON[crea-insidia]`
> `BUTTON[crea-classe]`
> `BUTTON[crea-sottoclasse]`
> `BUTTON[crea-specie]`
> `BUTTON[crea-background]`
> `BUTTON[crea-talento]`
> `BUTTON[crea-divinita]`
> `BUTTON[crea-bastione]`
> `BUTTON[crea-regola]`
> `BUTTON[crea-nota_rapida]`
> `BUTTON[crea-mito]`
> `BUTTON[crea-profezia]`
> `BUTTON[crea-istituzione]`
> `BUTTON[crea-bioma]`
> `BUTTON[crea-ecosistema]`

## 🤝 Trame (alleati / rivali)
```dataview
table without id file.link as Chi, alleati as Alleati, rivali as Rivali
from ""
where alleati or rivali
sort file.name asc
```

## Cronologia eventi
```dataview
table without id file.link as Evento, quando as Quando, mondo as Mondo
from ""
where categoria = "evento"
sort quando asc
```

## Note per categoria
```dataview
table without id Categoria, length(rows) as Note
from ""
where categoria
group by categoria as Categoria
sort Categoria asc
```

## Da rifinire (bozze)
```dataview
table without id file.link as Nota, categoria as Categoria, mondo as Mondo
from ""
where stato = "bozza" and categoria
sort file.mtime desc
limit 20
```

--- 🎲 Al tavolo
> [!example] Crea
> `BUTTON[crea-pg]`
> `BUTTON[crea-incontro]`
> `BUTTON[crea-sessione]`

## Sessione attiva
```dataview
list
where categoria = "sessione" and attiva = true
```

## In gioco
```dataview
list
where stato = "in gioco"
```

## 🔥 Fronti caldi
Cosa preme nel mondo adesso — ordina per pressione. Ogni riga è una mossa pronta da giocare;
`Clock` mostra il progresso del fronte e `Conseguenza` cosa accade quando si riempie.
```dataview
table without id file.link as Fronte, pressione as Pressione, prossima_mossa as "Prossima mossa", (clock + "/" + clock_dim) as Clock, conseguenza as Conseguenza
from ""
where (pressione >= 5 or clock_dim) and stato != "archiviata"
sort (clock / clock_dim) desc, pressione desc
limit 12
```

## ✅ Da fare
Scrivi un task in qualunque nota con `- [ ] ...`: comparirà qui.
```tasks
not done
sort by priority
limit 15
```
````
