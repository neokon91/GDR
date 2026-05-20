# z.bases

Viste Bases pilota per il vault.

Queste viste non sostituiscono Dataview: servono come layer modificabile sopra i metadati principali, utile a chi vuole correggere stato, pressione, collegamenti e prossime mosse senza toccare query.

| Base | Uso |
| --- | --- |
| `Missioni.base` | Missioni aperte, sotto pressione, per campagna, chiusura e vista completa. |
| `Worldbuilding.base` | Culture, religioni, societa e cosmologia: Codex vivo, collegamenti, pubblicazione e propagazione. |
| `Fazioni.base` | Fazioni in movimento, pressione, relazioni, mondo e archivio. |
| `Economia.base` | Risorse, rotte, mercati, pressioni economiche e archivio. |
| `PNG.base` | PNG in gioco, pressione, segreti/leve, archivio e schede rapide. |
| `Luoghi.base` | Luoghi attivi, pericolosi, per mondo e gerarchia. |
| `Incontri.base` | Incontri pronti, pericolo alto, per sessione e da completare. |
| `Atlante Mappe.base` | Mappa, tabella, layer e dati marker. |

Regola: aggiungere qui solo viste su frontmatter gia stabile. Le viste aggregate, i controlli complessi e le card operative restano in Dataview/DataviewJS.
