# Reference: Callout Manager (`callout-manager`)

Versione vault: **v1.1.1**. Doc: https://github.com/eth-p/obsidian-callout-manager

> Usato da: `render.py` (blocco "Callout Manager") inietta i callout GDR custom da
> `plugins.yaml → callouts` in `data.json → callouts.custom`.

## Cos'è
Gestisce i **callout custom** (id/colore/icona) oltre ai tipi standard di Obsidian.
I callout GDR danno identità visiva alla *superficie giocabile* delle note.

## Callout GDR custom (da `plugins.yaml → callouts`)
| id | colore (R,G,B) | icona (lucide) | uso |
|---|---|---|---|
| `tavolo` | 201, 64, 64 | `lucide-swords` | uso al tavolo / pressione |
| `gancio` | 191, 130, 42 | `lucide-anchor` | gancio narrativo |
| `segreto` | 138, 74, 173 | `lucide-eye-off` | info riservata al DM |

Emessi dalla macro `_macros.j2 → tavolo()` come `> [!tavolo] …`, alcuni **foldable**
(`> [!gancio]-`) e contenenti **campi Meta Bind** (`VIEW`/`INPUT`).

## Iniezione (render.py)
`callouts.custom` è una lista `{ id, color, icon }`. Il merge è **additivo e
idempotente**: aggiunge solo gli id mancanti, preserva `settings`/`detection` e i custom
dell'utente. Richiede il plugin installato (`plugins/callout-manager/`); altrimenti i
callout **degradano a box standard** (icona generica) — il vault resta leggibile.

## ⚠️ Gotcha
- **Degrado silenzioso**: senza il plugin (o senza i custom in `data.json`) i callout GDR
  rendono come box default, non rotti. Per i colori/icone giusti il plugin va installato e
  la build rigirata.
- **Color = stringa `"R, G, B"`** (non hex, non array). `icon` = **id Lucide** (`lucide-…`).
- **Callout collassati**: vedi [obsidian-core](obsidian-core.md#callout) — un callout
  foldable chiuso (`[!tipo]-`) **non renderizza** il contenuto dinamico (Meta Bind/Dataview/
  js-engine) finché non lo apri la prima volta.
