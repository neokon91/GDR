# 🗺 Quest log — le missioni

> [!info] A cosa serve
> Le **missioni** dei PG raccolte per stato: cosa è **in corso**, cosa è **offerto** e non
> ancora preso, cosa è **chiuso**. Auto-generata e di **sola lettura**. Si popola creando
> **Missioni** (col bottone *Crea*) e impostandone *committente*, *ricompensa* e *stato*
> (tab *Al tavolo*); collega *Dove* / *PNG* / *Fazione dietro* nel tab *Collegamenti*.

> [!example] Crea
> `BUTTON[crea-missione]` · `BUTTON[crea-scena]` · `BUTTON[crea-indizio]`

## ⚔️ In corso — l'arco aperto
```dataview
table without id file.link as Missione, tipo as Tipo, committente as Committente, ricompensa as Ricompensa, luogo as Dove
from "Mondi"
where categoria = "missione" and stato_missione = "in corso" and stato != "archiviata"
sort file.name asc
```

## 📜 Disponibili — offerte non ancora prese
```dataview
table without id file.link as Missione, tipo as Tipo, committente as Committente, ricompensa as Ricompensa, luogo as Dove
from "Mondi"
where categoria = "missione" and (stato_missione = "proposta" or !stato_missione) and stato != "archiviata"
sort file.name asc
```

## 🏁 Concluse — come sono finite
```dataview
table without id file.link as Missione, stato_missione as Esito, committente as Committente, ricompensa as Ricompensa
from "Mondi"
where categoria = "missione" and (stato_missione = "completata" or stato_missione = "fallita" or stato_missione = "abbandonata") and stato != "archiviata"
sort file.name asc
```

> [!note] Dal gancio all'arco
> Una **missione** trasforma un `#gancio` volante in un filo che torna: dalle un
> *committente* con un secondo fine e una *posta in gioco*, legala a un **Fronte** e la
> sua riuscita (o il suo fallimento) muove il mondo — vedi **[[Fronti]]**.
