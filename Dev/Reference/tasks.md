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

## Convenzione GDR (fili narrativi + prep)
Tag per dare senso ai task, interrogati da Home:
- `#gancio` — un gancio da seminare al tavolo. `#trama` — un filo/trama aperto.
  → Home *Al tavolo* → **🧵 Fili narrativi** (`(tags include #gancio) OR (tags include #trama)`, sort by due).
- `#prep` — voce della checklist di prep di sessione (template `sessione`, tab *Prepara*).
Es: `- [ ] Il duca scopre il tradimento #trama 📅 2025-01-30`.

## Note pipeline
Plugin installato in dist/GDR-vault → i blocchi ` ```tasks ` rendono. Usato in: template
**sessione** (checklist *Prep di sessione* + task della sessione) e **Home** (🧵 Fili
narrativi taggati + ✅ Da fare, che esclude #gancio/#trama per non duplicare).
