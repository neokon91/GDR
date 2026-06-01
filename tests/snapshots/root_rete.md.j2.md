# 🕸️ Rete del mondo

> [!info] A cosa serve
> La salute delle **connessioni** del tuo mondo: cosa è ancora **isolato** (da
> collegare) e cosa fa da **snodo**. Auto-generata e di **sola lettura** (si
> rigenera a ogni build). Per collegare: tab *Collegamenti* o bottone **Collega**
> (scrive anche l'**inverso tipizzato** dove la coppia è univoca). Alla creazione,
> il wizard chiede *"Collegare ora?"*.

## 🔌 Da collegare — note che nessuno cita ancora
> [!tip]- Cosa significa
> Note senza alcun backlink: rischiano di restare isole. Agganciale a un luogo,
> una fazione, un evento, un'epoca… così la profondità diventa anche *rete*.
```dataview
table categoria as Categoria, mondo as Mondo
from "Mondi"
where categoria and stato != "archiviata" and length(file.inlinks) = 0
sort categoria asc, file.name asc
```

## 🌟 Snodi — le note più collegate
```dataview
table categoria as Categoria, length(file.inlinks) as "Citata da"
from "Mondi"
where categoria and stato != "archiviata" and length(file.inlinks) > 0
sort length(file.inlinks) desc
limit 20
```

> [!note] Come migliorare la connessione
> Le **relazioni tipizzate** (tab *Collegamenti*) sono il tessuto del mondo: il
> bottone **Collega** scrive il legame e il suo inverso (tipizzato se la coppia è
> univoca, es. *luogo → cultura* ↔ *cultura → regioni*). Anche il **wizard** offre
> i collegamenti alla creazione. Una nota isolata non è un errore — è un invito.
