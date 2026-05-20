# z.modelli

Template usati dai pulsanti Meta Bind e dai router Templater.

## Cartelle

| Percorso | Contiene |
| --- | --- |
| `dm/` | Campagne, sessioni, missioni, incontri, avventure e one-shot. |
| `fazione/` | Fazioni specializzate. |
| `geografia/` | Continenti, isole e regioni. |
| `luogo/` | Dungeon, insediamenti, rovine, templi e punti di interesse. |
| `personaggio/` | PNG, PG e divinita. |
| `politica/` | Regni, imperi, ducati e altre entita politiche. |

## Regole

- Non rinominare un template senza aggiornare i blocchi `templateFile` nelle dashboard.
- Non rinominare una chiamata `tp.user.*` senza rinominare anche lo script in `z.automazioni/`.
- Mantieni frontmatter e campi coerenti con [[Risorse/Sviluppo Vault]].
- Dopo ogni modifica esegui `npm run check` dal root.
