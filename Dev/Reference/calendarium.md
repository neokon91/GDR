# Reference: Calendarium (`calendarium`)

Versione vault: **v2.1.0** (Jeremy Valentine). Doc: https://plugins.javalent.com/calendarium

> **Stato: ponte evento→calendario cablato; calendario per-mondo da creare in-app.** La
> pipeline abilita lo scan automatico (`write_calendarium`: `autoParse`/`parseDates`/
> `eventFrontmatter` + `inlineEventsTag: #cronologia`) **e** l'entità `evento` emette le
> chiavi-evento `fc-*` (campo `fc-date` nel wizard + callout *Calendario* editabile con
> `fc-date`/`fc-calendar`/`fc-category`, macro `calendario()`). Compilando *Data* l'evento
> compare sul calendario. La **definizione del calendario** (mesi/ere/lune) resta contenuto
> per-mondo: si crea una volta dai preset di Calendarium (opt-in, scelta utente), non la cabla
> la pipeline — l'iniezione di un default è stata valutata e **non** fatta (schema oggetto-
> calendario v2.1 complesso/version-sensitive; hai già importato il Gregorian a mano).

## Cos'è
Crea **calendari fantasy/sci-fi custom** (ere, mesi, settimane irregolari) con eventi
datati e una vista cronologica/agenda. Erede di "Fantasy Calendar".

## Modello (verificare al momento dell'integrazione)
Gli eventi si dichiarano via frontmatter su note normali (chiavi `fc-*`, es.
`fc-calendar`, `fc-date`, `fc-category`) **oppure** dall'editor di eventi del plugin. Il
calendario stesso è un oggetto in `data.json`. La sintassi `fc-*` va **verificata in-app**
sulla v2.1 prima di generarla dalla pipeline (lo schema è cambiato fra major).

## Aggancio (roadmap #4) — fatto
- **`evento` emette `fc-date`** (+ `fc-calendar`/`fc-category` opzionali) nel frontmatter →
  compare sul calendario/agenda. `quando` resta l'etichetta in prosa (e alimenta la nostra
  `renderTimeline`); `fc-date` è la data **macchina** nel formato del calendario attivo.
- Un **calendario del mondo** si definisce una volta in-app dai preset (opt-in). Senza
  `fc-calendar` l'evento va al calendario di default (i `paths` lo assegnano).
- ⚠️ **Trattino nei field-id**: `fc-*` è whitelisted in `validate.INTEROP_FIELDS`
  (non snake_case di proposito: chiavi richieste dal plugin). Meta Bind 1.4.x ammette il
  trattino negli identificatori → `INPUT[text:fc-date]` bind-a correttamente.
- *Residuo*: `epoca` potrebbe emettere ere come `fc-date` con `fc-end` (range) per disegnare
  le epoche sul calendario; non fatto (le epoche vivono già nella nostra timeline).

## ⚠️ Gotcha
- **Date non-gregoriane**: con calendari custom le date sono stringhe interpretate dal
  plugin, non `YYYY-MM-DD` core → non confondere con la property `date` di Obsidian.
- Schema `data.json`/`fc-*` **version-sensitive** (v1→v2 ha rotto formati): verificare
  prima di automatizzare.
