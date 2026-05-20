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
WHERE (stato = "preparazione" OR stato = "pronto") AND !startswith(file.name, "Prova -")
SORT data ASC
LIMIT 10
```

## Missioni Con Pressione

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa, luoghi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT pressione DESC, scadenza_mondo ASC, stato ASC, nome ASC
```

## Calendario Narrativo

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;

const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Sessioni" OR "Mondi/Timeline"')
  .where(p => !String(p.file.name).startsWith("Prova -") && hasText(p["fc-date"]) && p.stato !== "archiviata")
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

## Da Sistemare

```dataviewjs
const hasText = value => String(value ?? "").trim().length > 0;

const pages = [
  ...dv.pages('"Mondi/Sessioni"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata" && hasText(p.data_mondo) && !hasText(p["fc-date"]))
    .map(p => [p.file.link, "sessione", p.data_mondo, p.stato ?? ""]).array(),
  ...dv.pages('"Mondi/Missioni"')
    .where(p => !String(p.file.name).startsWith("Prova -") && p.stato !== "archiviata" && hasText(p.scadenza_mondo) && !hasText(p["fc-date"]))
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
WHERE file.name != "Sessioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
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
| `fc-calendar` | Nome del calendario interno. |
| `fc-date` | Data tecnica per la vista calendario. |
| `fc-category` | Tipo di evento: `sessione`, `scadenza`, `festa`, `pericolo`, `conseguenza`. |
| `fc-display-name` | Nome breve da mostrare nella vista calendario. |
| `fc-end` | Fine evento, solo se dura piu giorni. |
