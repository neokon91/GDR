---
cssclasses:
  - indice
---

# Calendario

Usa questa nota con Calendarium per tenere insieme calendario reale, date del mondo, feste, scadenze narrative e continuità tra sessioni.

## Regole Minime

- `data_mondo`: testo leggibile al tavolo, per esempio "3 Brumaio 1491".
- `fc-calendar`: nome del calendario Calendarium; se vuoto usa il calendario predefinito.
- `fc-date`: data nel formato impostato in Calendarium.
- `fc-category`: categoria evento. Usa valori semplici: `sessione`, `scadenza`, `festa`, `pericolo`, `conseguenza`.
- `fc-display-name`: nome breve mostrato nel calendario.
- `fc-end`: opzionale, solo per eventi su piu giorni.

## Categorie Eventi

| Categoria | Uso |
| --- | --- |
| sessione | Sessioni preparate o giocate |
| scadenza | Missioni con una pressione temporale |
| festa | Ricorrenze, feste, mercati, rituali |
| pericolo | Eventi ostili che avanzano se ignorati |
| conseguenza | Esiti emersi dopo una sessione |

## Prossime Sessioni

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto") AND !startswith(file.name, "Prova -")
SORT data ASC
LIMIT 10
```

## Timeline Sessioni

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondi/Sessioni"
WHERE file.name != "Sessioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT data DESC
LIMIT 20
```

## Missioni Con Pressione

```dataview
TABLE stato, scadenza_mondo, committente, luoghi, personaggi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT scadenza_mondo ASC, stato ASC, nome ASC
```

## Scadenze Narrative

```dataviewjs
const pages = dv.pages('"Mondi/Missioni" OR "Mondi/Sessioni"')
  .where(p => !String(p.file.name).startsWith("Prova -") && p["fc-date"] && p.stato !== "archiviata")
  .sort(p => `${p["fc-calendar"] ?? ""} ${p["fc-date"] ?? ""}`, "asc");

if (!pages.length) {
  dv.paragraph("Nessuna scadenza narrativa registrata.");
} else {
  dv.table(
    ["Nota", "Calendario", "Data", "Categoria", "Nel mondo", "Stato"],
    pages.map(p => [
      p.file.link,
      p["fc-calendar"] ?? "predefinito",
      p["fc-date"],
      p["fc-category"] ?? "evento",
      p.scadenza_mondo ?? p.data_mondo ?? "",
      p.stato ?? ""
    ])
  );
}
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
