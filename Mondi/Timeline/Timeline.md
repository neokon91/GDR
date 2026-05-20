---
cssclasses:
  - indice
---

# Timeline

`BUTTON[nuovo-evento-storico-z-modelli-evento-storico-md]`

## Eventi Canonici

```dataview
TABLE data_mondo AS "Data", causa AS "Causa", conseguenze AS "Conseguenze", prossima_mossa AS "Prossima mossa", mondo AS "Mondo", luoghi AS "Luoghi", fazioni AS "Fazioni", sessioni AS "Sessioni"
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico = "canonico" AND !startswith(file.name, "Prova -")
SORT data_mondo ASC, file.name ASC
```

## Timeline Causale

```dataview
TABLE data_mondo AS "Data", cause AS "Cause", causa AS "Causa testuale", effetti AS "Effetti", conseguenze AS "Conseguenze", propaga_a AS "Propaga a", prossima_mossa AS "Prossima mossa", missioni AS "Missioni"
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -")
SORT data_mondo ASC, file.name ASC
```

## Propagazione Storica

```dataview
TABLE data_mondo AS "Data", entita_impattate AS "Entita impattate", propaga_a AS "Propaga a", stato_mondo AS "Stato mondo", tracciati AS "Tracciati"
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -") AND (entita_impattate OR propaga_a OR stato_mondo OR tracciati)
SORT data_mondo ASC, file.name ASC
```

## Rumor, Leggende E Segreti

```dataview
TABLE data_mondo AS "Data", stato_canonico AS "Canone", fonte AS "Fonte", grado_certezza AS "Certezza", mondo AS "Mondo", luoghi AS "Luoghi", fazioni AS "Fazioni"
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "canonico" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -")
SORT data_mondo ASC, file.name ASC
```

## Eventi Da Sessione

```dataview
TABLE stato AS "Stato", stato_canonico AS "Canone", sessioni AS "Sessioni", collegamenti AS "Collegamenti", impatto AS "Impatto"
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
LIMIT 20
```
