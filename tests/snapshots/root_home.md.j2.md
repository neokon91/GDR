# 🏠 GDR — Home

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
> `BUTTON[crea-pg]`
> `BUTTON[crea-png]`
> `BUTTON[crea-creatura]`
> `BUTTON[crea-incontro]`
> `BUTTON[crea-oggetto]`
> `BUTTON[crea-oggetto_magico]`
> `BUTTON[crea-incantesimo]`
> `BUTTON[crea-sessione]`

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
Cosa preme nel mondo adesso — ordina per pressione. Ogni riga è una mossa pronta da giocare.
```dataview
table without id file.link as Fronte, pressione as Pressione, prossima_mossa as "Prossima mossa", categoria as Categoria
from ""
where pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 12
```

## 🤝 Trame (alleati / rivali)
```dataview
table without id file.link as Chi, alleati as Alleati, rivali as Rivali
from ""
where alleati or rivali
sort file.name asc
```

## ✅ Da fare
Scrivi un task in qualunque nota con `- [ ] ...`: comparirà qui.
```tasks
not done
sort by priority
limit 15
```

## Da rifinire (bozze)
```dataview
table without id file.link as Nota, categoria as Categoria, mondo as Mondo
from ""
where stato = "bozza" and categoria
sort file.mtime desc
limit 20
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
table without id length(rows) as N
from ""
where categoria
group by categoria as Categoria
sort Categoria asc
```
