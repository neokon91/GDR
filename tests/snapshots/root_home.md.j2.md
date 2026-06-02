# 🏠 GDR — Home

> [!tip] Nuovo qui? Apri il **[[LEGGIMI]]**
> 3 passi per partire + come si usa. Il vault arriva con il mondo-esempio **Valdombra**:
> i cruscotti qui sotto sono **già pieni** — esplorali (parti dall'[[Atlante]]), poi crea il
> tuo con i bottoni **Crea**. Per ripartire pulito, cancella `Mondi/_Esempio — Valdombra`.

````tabs
--- 🌍 Worldbuilding
> [!abstract] Indici
> [[Atlante|🗺️ Atlante]]
> [[Bestiario|🐾 Bestiario]]
> [[Fazioni|⚔️ Fazioni]]
> [[Risorse|📦 Risorse]]
> [[Cast|🎭 Cast]]
> [[Cronologia|📜 Cronologia]]
> [[Geografia|🧭 Geografia & confini]]
> [[Economia|💰 Economia & rotte]]

> [!example] Crea
> `BUTTON[crea-mondo]`
> `BUTTON[crea-luogo]`
> `BUTTON[crea-cultura]`
> `BUTTON[crea-fazione]`
> `BUTTON[crea-evento]`
> `BUTTON[crea-png]`

> [!example]- Altri tipi
> `BUTTON[crea-cosmologia]`
> `BUTTON[crea-lingua]`
> `BUTTON[crea-creatura]`
> `BUTTON[crea-oggetto]`
> `BUTTON[crea-oggetto_magico]`
> `BUTTON[crea-incantesimo]`
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
> `BUTTON[crea-epoca]`
> `BUTTON[crea-mito]`
> `BUTTON[crea-culto]`
> `BUTTON[crea-profezia]`
> `BUTTON[crea-regno]`
> `BUTTON[crea-istituzione]`
> `BUTTON[crea-bioma]`
> `BUTTON[crea-ecosistema]`
> `BUTTON[crea-sistema_magico]`
> `BUTTON[crea-dominio]`
> `BUTTON[crea-legge_fondamentale]`
> `BUTTON[crea-entita_primordiale]`
> `BUTTON[crea-piano]`
> `BUTTON[crea-risorsa]`
> `BUTTON[crea-albero_evolutivo]`

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

## 🧵 Fili narrativi
Ganci da seminare (`#gancio`) e trame aperte (`#trama`). Scrivi in qualunque nota un task
taggato — es. `- [ ] Il duca scopre il tradimento #trama 📅 2025-01-30` — e comparirà qui.
```tasks
not done
(tags include #gancio) OR (tags include #trama)
sort by due
limit 20
```

## ✅ Da fare
Ogni altro task aperto (`- [ ] ...`) scritto in una nota. I fili narrativi stanno qui sopra.
```tasks
not done
(tags do not include #gancio) AND (tags do not include #trama)
sort by priority
limit 15
```
````
