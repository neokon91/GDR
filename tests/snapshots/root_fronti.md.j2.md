# ⏳ Fronti — orologi attivi

> [!info] A cosa serve
> Tutti i fronti con un **clock** in corso: quanto sono vicini a scatenarsi e cosa
> accadrà. Quando un clock è **pieno**, apri il fronte e premi *Scatena conseguenza*
> (crea l'evento e azzera il clock). Imposti un clock dal tab *Al tavolo* di una nota.

> [!tip] Far girare il mondo
> `BUTTON[avanza-mondo]` — avanza **tutti** i Fronti di un passo (in proporzione al calore: 🔴 Crisi +2, 🟠 Tensione +1, 🟢 Calma fermo), scatena i pieni (conseguenza in bozza) e ne propaga le **onde** nel grafo. Scrive una cronaca «Giro del mondo». *Premilo tra una sessione e l'altra.*

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderStatoMondo");
```

## 🔴 Pieni — pronti a scatenare
```dataview
table without id file.link as Fronte, (clock + "/" + clock_dim) as Clock, conseguenza as Conseguenza, conseguenza_su as Bersaglio
from ""
where clock_dim and clock >= clock_dim and stato != "archiviata"
sort file.name asc
```

## ⏳ In corso
```dataview
table without id file.link as Fronte, (clock + "/" + clock_dim) as Clock, prossima_mossa as "Prossima mossa", conseguenza as Conseguenza
from ""
where clock_dim and clock < clock_dim and stato != "archiviata"
sort (clock / clock_dim) + (default(pressione, 0) / 10) desc
```

## 📜 Conseguenze scatenate — storia del mondo
Gli eventi nati da un clock pieno: la giocata che ha mosso il worldbuilding.
```dataview
table without id file.link as Evento, mondo as Mondo, quando as Quando
from ""
where categoria = "evento" and tipo = "conseguenza" and stato != "archiviata"
sort quando desc
limit 20
```
