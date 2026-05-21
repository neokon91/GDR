---
cssclasses:
  - indice
---

# Calendario

Questa e la pagina del tempo del mondo: mostra cosa e gia successo, cosa sta per succedere e quali note hanno una data scritta ma non sono ancora entrate nel calendario.

Per usarla basta compilare nelle note una data leggibile:

- nelle sessioni: `data_mondo`, per esempio "Seconda notte di nebbia";
- nelle missioni o nei pericoli: `scadenza_mondo`, per esempio "Entro il prossimo plenilunio".

Il vault segnala sotto cosa manca da sistemare. Non serve capire gli strumenti interni per usare questa pagina al tavolo.

`BUTTON[nuova-ricorrenza-z-modelli-worldbuilding-ricorrenza-calendario-md]`

## Calendari Selezionati

```dataview
TABLE calendario, stato, campagne
FROM "Mondi"
WHERE categoria = "mondo" AND file.name != "Mondi"
SORT calendario ASC, file.name ASC
```

```dataview
TABLE calendario, mondo, stato
FROM "Campagne"
WHERE categoria = "campagna"
SORT calendario ASC, file.name ASC
```

Lascia `calendario` vuoto per usare il default di Calendarium. Compilalo su un mondo o su una campagna quando quella linea di gioco usa un calendario diverso; i template generati propongono quel valore in `fc-calendar`, ma puoi cambiarlo sulla singola nota.

## Oggi Nel Mondo

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;

const active = dv.pages('"Mondi/Sessioni"')
  .where(p => p.attiva === true && p.stato !== "archiviata")
  .sort(p => p.data ?? "", "desc")
  .limit(1)
  .array();

if (!active.length) {
  dv.paragraph("Nessuna sessione attiva. Apri una sessione e imposta `attiva: true` per usarla come riferimento.");
} else {
  const s = active[0];
  dv.table(
    ["Sessione", "Data del mondo", "Stato", "Campagna"],
    [[
      s.file.link,
      hasText(s.data_mondo) ? s.data_mondo : "Da decidere",
      s.stato ?? "",
      (s.campagne ?? []).join(", ")
    ]]
  );
}
```

## Prossime Sessioni

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto")
SORT data ASC
LIMIT 10
```

## Prossima Scadenza Narrativa

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa, luoghi, fazioni
FROM "Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni"
WHERE stato != "archiviata" AND (scadenza_mondo OR fc-date OR pressione >= 6)
SORT fc-date ASC, pressione DESC, file.mtime DESC
LIMIT 8
```

> [!timer] Uso al tavolo
> La prossima scadenza deve diventare una scelta, una pressione o una conseguenza nella preparazione. Se resta solo una data, non sta producendo gioco.

## Missioni Con Pressione

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa, luoghi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso")
SORT pressione DESC, scadenza_mondo ASC, stato ASC, nome ASC
```

## Calendario Narrativo

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;

const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Sessioni" OR "Mondi/Timeline" OR "Mondi/Calendario Diegetico"')
  .where(p => hasText(p["fc-date"]) && p.stato !== "archiviata")
  .sort(p => `${p["fc-calendar"] ?? ""} ${p["fc-date"] ?? ""}`, "asc");

if (!pages.length) {
  dv.paragraph("Nessun evento pronto per la vista calendario.");
} else {
  dv.table(
    ["Evento", "Quando", "Tipo", "Nel mondo", "Stato"],
    pages.map(p => [
      p.file.link,
      p["fc-display-name"] ?? p["fc-date"],
      p["fc-category"] ?? "evento",
      p.scadenza_mondo ?? p.data_mondo ?? "",
      p.stato ?? ""
    ])
  );
}
```

## Calendarium Plugin

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;
let data = null;
try {
  data = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/calendarium/data.json"));
} catch (error) {
  dv.paragraph("Configurazione Calendarium non leggibile.");
}

if (data) {
  const calendars = Array.isArray(data.calendars) ? data.calendars : Object.values(data.calendars ?? {});
  if (!calendars.length) {
    dv.paragraph("Calendarium e installato, ma nessun calendario risulta salvato nella configurazione attiva del plugin.");
  } else {
    dv.table(
      ["Calendario", "Default", "Mesi", "Categorie", "Eventi interni", "Data corrente"],
      calendars.map(c => [
        c.name ?? c.id ?? "",
        data.defaultCalendar === c.id ? "sì" : "",
        c.static?.months?.length ?? "",
        c.categories?.length ?? 0,
        c.events?.length ?? 0,
        c.current ? `${c.current.year}-${Number(c.current.month ?? 0) + 1}-${c.current.day}` : ""
      ])
    );
  }

  const names = new Set(calendars.flatMap(c => [c.name, c.id]).filter(Boolean).map(x => String(x).toLowerCase()));
  const events = dv.pages('"Mondi" OR "Campagne" OR "Inbox"')
    .where(p => p.stato !== "archiviata" && hasText(p["fc-date"]));
  const selectors = dv.pages('"Mondi" OR "Campagne"')
    .where(p => hasText(p.calendario));
  const unmatched = calendars.length
    ? events.where(p => hasText(p["fc-calendar"]) && !names.has(String(p["fc-calendar"]).toLowerCase()))
      .map(p => [p.file.link, p["fc-calendar"], p["fc-date"], p["fc-category"] ?? ""])
      .array()
    : [];
  const unmatchedSelectors = calendars.length
    ? selectors.where(p => !names.has(String(p.calendario).toLowerCase()))
      .map(p => [p.file.link, p.calendario, p.categoria ?? ""])
      .array()
    : [];

  if (unmatched.length) {
    dv.header(3, "Eventi Con Calendario Non Configurato");
    dv.table(["Nota", "fc-calendar", "fc-date", "Categoria"], unmatched);
  }

  if (unmatchedSelectors.length) {
    dv.header(3, "Mondi O Campagne Con Calendario Non Configurato");
    dv.table(["Nota", "calendario", "Categoria"], unmatchedSelectors);
  }
}
```

## Struttura Del Calendario

```dataviewjs
const rows = dv.pages('"Mondi/Calendario Diegetico"')
  .where(p => p.file.name !== "Calendario Diegetico" && p.stato !== "archiviata")
  .sort(p => `${p.mese ?? ""} ${p.data_mondo ?? ""}`, "asc")
  .map(p => [p.file.link, p.data_mondo ?? "", p.mese ?? "", p.stagione ?? "", p.culture ?? [], p.religioni ?? [], p.luoghi ?? []]);

if (!rows.length) {
  dv.paragraph("Nessuna ricorrenza diegetica creata.");
} else {
  dv.table(["Ricorrenza", "Data", "Mese", "Stagione", "Culture", "Religioni", "Luoghi"], rows);
}
```

## Pressioni Legate Alle Date

```dataview
TABLE data_mondo, mese, stagione, conseguenze_data_passata, pressioni_da_avanzare, prossima_mossa
FROM "Mondi/Calendario Diegetico"
WHERE file.name != "Calendario Diegetico" AND stato != "archiviata" AND (pressione > 0 OR conseguenze_data_passata OR pressioni_da_avanzare)
SORT mese ASC, data_mondo ASC
```

## Da Sistemare

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;

const pages = [
  ...dv.pages('"Mondi/Sessioni"')
    .where(p => p.stato !== "archiviata" && hasText(p.data_mondo) && !hasText(p["fc-date"]))
    .map(p => [p.file.link, "sessione", p.data_mondo, p.stato ?? ""]).array(),
  ...dv.pages('"Mondi/Missioni"')
    .where(p => p.stato !== "archiviata" && hasText(p.scadenza_mondo) && !hasText(p["fc-date"]))
    .map(p => [p.file.link, p["fc-category"] ?? "scadenza", p.scadenza_mondo, p.stato ?? ""]).array()
];

if (!pages.length) {
  dv.paragraph("Tutte le date leggibili sono gia pronte per il calendario.");
} else {
  dv.table(["Nota", "Tipo", "Data scritta", "Stato"], pages);
}
```

## Timeline Sessioni

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondi/Sessioni"
WHERE file.name != "Sessioni" AND stato != "archiviata"
SORT data DESC
LIMIT 20
```

## Eventi Del Mondo

> [!timer] Scadenze e pressioni
> - [ ] 
> - [ ] 
> - [ ] 

> [!scena] Feste, ricorrenze e date note
> - 

## Cronologia Canonica

> [!indizio] Eventi confermati
> - 

## Per Chi Cura Il Calendario

Questa sezione serve solo a chi prepara il vault. Il DM puo ignorarla.

| Campo | A cosa serve |
| --- | --- |
| `data_mondo` | Data leggibile al tavolo per sessioni, eventi e timeline. |
| `scadenza_mondo` | Scadenza leggibile per missioni, pericoli e conseguenze. |
| `calendario` | Calendario preferito di mondo o campagna; i template lo propongono come `fc-calendar`. |
| `fc-calendar` | Nome del calendario interno. |
| `fc-date` | Data tecnica per la vista calendario. |
| `fc-category` | Tipo di evento: `sessione`, `scadenza`, `festa`, `pericolo`, `conseguenza`. |
| `fc-display-name` | Nome breve da mostrare nella vista calendario. |
| `fc-end` | Fine evento, solo se dura piu giorni. |
| `fc-ignore` | Se `true`, Calendarium ignora la nota. |
| `mese` | Mese diegetico leggibile anche senza Calendarium. |
| `stagione` | Stagione o periodo sociale/rituale. |
| `tabu_stagionali` | Divieti, usanze o paure legate alla stagione. |
| `scadenze_rituali` | Date che obbligano fazioni, culti o comunità a muoversi. |
| `pressioni_da_avanzare` | Fazioni, rotte, missioni o tracciati da aggiornare se la data passa. |
