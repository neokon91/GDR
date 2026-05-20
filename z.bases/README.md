# z.bases

Viste Bases pilota per il vault.

Queste viste non sostituiscono Dataview: servono come layer modificabile sopra i metadati principali, utile a chi vuole correggere stato, pressione, collegamenti e prossime mosse senza toccare query.

| Base | Uso |
| --- | --- |
| `Missioni.base` | Missioni aperte, stato, pressione e prossima mossa. |
| `PNG.base` | PNG in gioco, ruolo, luogo, fazioni e prossima mossa. |
| `Luoghi.base` | Luoghi attivi, pericolo, gerarchia e governanti. |
| `Incontri.base` | Incontri pronti, luogo, pericolo, creature e personaggi. |

Regola: aggiungere qui solo viste su frontmatter gia stabile. Le viste aggregate, i controlli complessi e le card operative restano in Dataview/DataviewJS.
