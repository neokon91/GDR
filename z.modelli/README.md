# z.modelli

Template usati dai pulsanti Meta Bind e dai router Templater.

## Cartelle

| Percorso | Contiene |
| --- | --- |
| `azioni/` | Template sottili per pulsanti Meta Bind operativi. Chiamano `tp.user.meta_actions`. |
| `dm/` | Campagne, sessioni, missioni, incontri, avventure e one-shot. |
| `dm/Tracciato.md` | Clock e progress track per fronti, missioni, rituali, minacce e viaggi. |
| `fazione/` | Fazioni specializzate. |
| `geografia/` | Continenti, isole e regioni. |
| `luogo/` | Dungeon, insediamenti, rovine, templi e punti di interesse. |
| `personaggio/` | PNG, PG e divinita. |
| `politica/` | Regni, imperi, ducati e altre entita politiche. |
| `wizard/` | Wizard centralizzati sopra i template esistenti. Chiamano `tp.user.wizard_layer`. |

## Regole

- Non rinominare un template senza aggiornare i blocchi `templateFile` nelle dashboard.
- Non rinominare una chiamata `tp.user.*` senza rinominare anche lo script in `z.automazioni/`.
- I template in `azioni/` e `wizard/` devono restare minimi: niente logica duplicata, solo chiamate allo script centrale.
- Mantieni frontmatter e campi coerenti con [[Risorse/Sviluppo Vault]].
- Dopo ogni modifica esegui `npm run check` dal root.
