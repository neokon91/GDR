# Reference: Calendarium (`calendarium`)

Versione vault: **v2.1.0** (Jeremy Valentine). Doc: https://plugins.javalent.com/calendarium

> **Stato: parsing eventi cablato; calendario per-mondo da creare in-app.** La pipeline
> abilita lo scan automatico (`write_calendarium`: `autoParse`/`parseDates`/`eventFrontmatter`
> + `inlineEventsTag: #cronologia`). La **definizione del calendario** (mesi/ere/lune) è
> contenuto per-mondo: si crea una volta dai preset di Calendarium (opt-in), non la cabla la
> pipeline. ⚠️ Da confermare in-app (l'iniezione di un calendario default è rinviata a una
> sessione con QA Obsidian: lo schema oggetto-calendario v2.1 non è verificabile a secco).

## Cos'è
Crea **calendari fantasy/sci-fi custom** (ere, mesi, settimane irregolari) con eventi
datati e una vista cronologica/agenda. Erede di "Fantasy Calendar".

## Modello (verificare al momento dell'integrazione)
Gli eventi si dichiarano via frontmatter su note normali (chiavi `fc-*`, es.
`fc-calendar`, `fc-date`, `fc-category`) **oppure** dall'editor di eventi del plugin. Il
calendario stesso è un oggetto in `data.json`. La sintassi `fc-*` va **verificata in-app**
sulla v2.1 prima di generarla dalla pipeline (lo schema è cambiato fra major).

## Aggancio previsto (roadmap #4)
- Un **calendario del mondo** per `mondo` (o condiviso) definito una volta.
- `evento` ed `epoca` emettono `fc-date`/`fc-calendar`/`fc-category` nel frontmatter →
  compaiono sulla timeline. `epoca` fornisce ere/epoche; `evento` i punti datati.
- Collegare `quando`/`portata` degli eventi al sistema-date del calendario.

## ⚠️ Gotcha
- **Date non-gregoriane**: con calendari custom le date sono stringhe interpretate dal
  plugin, non `YYYY-MM-DD` core → non confondere con la property `date` di Obsidian.
- Schema `data.json`/`fc-*` **version-sensitive** (v1→v2 ha rotto formati): verificare
  prima di automatizzare.
