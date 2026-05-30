# Reference: Tasks (`obsidian-tasks-plugin`)

Doc: https://publish.obsidian.md/tasks/

## Formato task
`- [ ] descrizione` (aperto) / `- [x]` (fatto). Emoji metadata:
🛫 start, ⏳ scheduled, 📅 due, ✅ done (data), 🔁 recurrence, ⏫/🔼/🔽 priorità, 🆔 id, ⛔ dipende.
Es: `- [ ] Preparare incontro 📅 2026-06-01 ⏫`

## Query — ` ```tasks `
Filtri (una per riga): `not done`, `done`, `due before 2026-06-01`, `due after today`,
`path includes Mondi/Sessioni`, `tags include #gdr`, `heading includes`, `description includes`.
Output: `sort by due`, `group by filename`, `limit 20`, `hide backlink`, `short mode`.
```tasks
not done
path includes Mondi/Sessioni
sort by due
```

## Note pipeline
Plugin installato in dist/GDR-vault → i blocchi ` ```tasks ` rendono. Usato nel template
sessione per i task aperti delle sessioni.
