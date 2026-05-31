# 🌉 Ponte Mondo ↔ Sistema

> [!info] A cosa serve
> Le entità del tuo **mondo** che hanno anche una faccia di **gioco** (statblock,
> scheda, meccanica) e i loro legami fra le due suite. Auto-generata e di **sola
> lettura** (si rigenera a ogni build): l'SRD ufficiale resta separato in `SRD/`,
> qui c'è solo il tuo homebrew in `Mondi/`. La separazione vive *per-tab* dentro
> ogni nota (Lore/Al tavolo vs Scheda/Statblock); questa pagina ne è l'indice.

## 🐾 Bestiario del mondo — creature con statblock
```dataview
table tipo as Tipo, specie as Specie, habitat as Habitat
from "Mondi/Creature"
where statblock and stato != "archiviata"
sort file.name asc
```

## ✨ Incantesimi del mondo — per sistema magico
```dataview
table livello as Livello, tipo as Scuola
from "Mondi/Incantesimi"
where stato != "archiviata"
group by sistema_magico as "Sistema magico"
```

## 🎭 Personaggi — per specie
```dataview
table tipo as Tipo, classe as Classe, fazione as Affiliazione
from "Mondi/Personaggi"
where stato != "archiviata"
group by specie as Specie
```

## 🎒 Oggetti del mondo — per rarità di sistema
```dataview
table tipo as Tipo, rarita as Rarità, sintonia as Sintonia
from "Mondi/Oggetti"
where rarita and stato != "archiviata"
sort rarita asc
```

## 🎲 Incontri — creature collegate dal bestiario
```dataview
table creature as Creature, luogo as Luogo, pressione as Pressione
from "Mondi/Incontri"
where stato != "archiviata"
sort file.name asc
```

> [!tip] Come si popola
> Ogni tabella si riempie man mano che crei le note: una **creatura** col blocco
> statblock, un **incantesimo** homebrew legato a un **sistema magico**, un **PG**
> con la sua **specie**. I legami si impostano nel tab *Collegamenti* (relazioni
> tipizzate) o col bottone **Collega**.
