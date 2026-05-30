# Reference: Templater (`templater-obsidian`)

Doc: https://silentvoid13.github.io/Templater/

## Sintassi
- `<% expr %>` — **interpolazione**: inserisce il valore.
- `<%* code %>` — **esecuzione**: JS senza output (usa `tR += "..."` per emettere).
- Commento: `<%# ... %>`.

## Moduli `tp.*`
- **tp.file**: `create_new(template, filename?, open_new?, folder?)`, `move(new_path)`,
  `rename(new_name)`, `title`, `path(relative?)`, `folder(relative?)`, `find_tfile(name)`,
  `exists(path)`, `tags`, `cursor(order?)`.
- **tp.system**: `prompt(prompt_text, default?, throw_on_cancel?, multiline?)`,
  `suggester(text_items, items, throw_on_cancel?, placeholder?, limit?)`, `clipboard()`.
  (`text_items` può essere `string[]` o `(item)=>string`.)
- **tp.date**: `now(format?, offset?, reference?, reference_format?)`, `tomorrow`, `yesterday`.
- **tp.frontmatter.<campo>** — legge il frontmatter della nota.
- **tp.user.<script>(...)** — script utente da `user_scripts_folder`.

## User scripts (IMPORTANTE per questo progetto)
Ogni file `.js` in `user_scripts_folder` esporta una funzione: `module.exports = async function(tp, ...) {}`
→ richiamabile come `tp.user.<nomefile>(tp, ...)`.
- ⚠️ **Gli user script NON possono `require()` tra loro** ("Cannot find module"). Devono
  essere **autonomi**. Per condividere dati: leggere JSON a runtime con
  `await app.vault.adapter.read("z.automazioni/data/core.json")` poi `JSON.parse`.
- La funzione di solito **ritorna il frontmatter** (stringa `---...---`); il resto del
  corpo della nota lo fornisce il template (Jinja → MD).

## Config (`data.json`)
`templates_folder`, `user_scripts_folder`, `trigger_on_file_creation`, `syntax_highlighting`.
