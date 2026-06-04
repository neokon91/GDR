# 👁 Occhi del giocatore

> [!info] A cosa serve
> Anteprima del **portale dei giocatori** senza buildare il sito: cosa sanno già,
> cosa scopriranno, e cosa resta solo tuo. Imposta la **Rivelazione** di ogni nota
> nel tab *Al tavolo* (👁 *Condivisione*). Quando i giocatori avanzano, genera il
> sito al livello raggiunto:
> ```
> npm run site -- --reveal incontrato
> ```
> *pubblico* esce già col `npm run site` semplice; `--reveal segreto` (o `tutto`)
> svela anche i colpi di scena. `visibilita: dm` non esce **mai**.

## 🟢 Noto da subito — *pubblico*
> [!tip]- Cosa significa
> Ciò che i personaggi sanno dall'inizio: il sapere comune del setting. Esce già
> col `npm run site` di base.
```dataview
table without id file.link as Voce, categoria as Categoria, mondo as Mondo
from "Mondi"
where categoria and stato != "archiviata"
where !contains(list("sessione", "incontro", "insidia"), categoria)
where !visibilita or !contains(list("dm", "gm", "master", "privato", "segreto"), lower(string(visibilita)))
where !rivelazione or rivelazione = "pubblico"
sort categoria asc, file.name asc
```

## 🔭 Da scoprire — *incontrato*
> [!tip]- Cosa significa
> Entra nel portale quando i PG lo incontrano. Lo riveli alzando il livello:
> `npm run site -- --reveal incontrato`.
```dataview
table without id file.link as Voce, categoria as Categoria, mondo as Mondo
from "Mondi"
where categoria and stato != "archiviata"
where !visibilita or !contains(list("dm", "gm", "master", "privato", "segreto"), lower(string(visibilita)))
where rivelazione = "incontrato"
sort categoria asc, file.name asc
```

## 🎭 Colpi di scena — *segreto*
> [!tip]- Cosa significa
> Verità nascoste e ribaltoni: li svela `--reveal segreto` (o `--reveal tutto`),
> quando la storia li porta a galla.
```dataview
table without id file.link as Voce, categoria as Categoria, mondo as Mondo
from "Mondi"
where categoria and stato != "archiviata"
where !visibilita or !contains(list("dm", "gm", "master", "privato", "segreto"), lower(string(visibilita)))
where rivelazione = "segreto"
sort categoria asc, file.name asc
```

## 🔒 Solo DM — *mai condiviso*
> [!tip]- Cosa significa
> Note con `visibilita: dm` (appunti, meta, regìa): **non** finiscono nel portale a
> nessun livello. Per condividerle, togli `visibilita: dm` e dài loro una *Rivelazione*.
```dataview
table without id file.link as Voce, categoria as Categoria, mondo as Mondo
from "Mondi"
where categoria and stato != "archiviata"
where visibilita and contains(list("dm", "gm", "master", "privato", "segreto"), lower(string(visibilita)))
sort categoria asc, file.name asc
```

> [!note] Promemoria
> La **Rivelazione** (`pubblico`/`incontrato`/`segreto`) è *quando* una nota diventa
> visibile; `visibilita: dm` è il *mai*. I campi da DM (uso al tavolo, gancio,
> pressione, callout *Segreto*) e gli strumenti (incontri, tiri `dice:`) restano
> comunque fuori dal portale, a ogni livello.
