---
cssclasses:
  - indice
---

# Mondi

`BUTTON[worldbuilder-worldbuilder-dashboard]`

`BUTTON[dm-dashboard-1-dm-dashboard]`

`BUTTON[nuovo-mondo-z-modelli-mondo-md]`

`BUTTON[timeline-mondi-timeline-timeline]`

`BUTTON[stato-mondo-mondi-stato-del-mondo]`

`BUTTON[mondo-vivo-motore-mondo-vivo]`

`BUTTON[geopolitica-geopolitical-dashboard-2]`

## Tutti I Mondi

```dataview
TABLE stato, tono, tema, tecnologia, magia, campagne
FROM "Mondi"
WHERE categoria = "mondo" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```

## Mondi Da Completare

```dataview
TABLE tono, tema, tecnologia, magia
FROM "Mondi"
WHERE categoria = "mondo" AND stato = "bozza" AND !startswith(file.name, "Prova -")
SORT nome ASC
```

## Mondi Pronti

```dataview
TABLE tono, tema, campagne, canonico
FROM "Mondi"
WHERE categoria = "mondo" AND stato = "pronto" AND !startswith(file.name, "Prova -")
SORT nome ASC
```

## Contenuti Collegati

### Luoghi

```dataview
TABLE mondo, tipo, stato, bioma, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, nome ASC
LIMIT 16
```

### Personaggi

```dataview
TABLE mondo, tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE file.name != "Personaggi" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, nome ASC
LIMIT 16
```

### Fazioni e Religioni

```dataview
TABLE mondo, categoria, tipo, stato
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE file.name != "Fazioni" AND file.name != "Religioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, categoria ASC, nome ASC
LIMIT 16
```

### Relazioni

```dataview
TABLE mondo, tipo, stato, soggetti, pressione, prossima_mossa
FROM "Mondi/Relazioni"
WHERE file.name != "Relazioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, pressione DESC, nome ASC
LIMIT 16
```

### Creature

```dataview
TABLE mondo, tipo, stato, cr, luoghi
FROM "Mondi/Creature"
WHERE file.name != "Creature" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, nome ASC
LIMIT 16
```

### Oggetti e Dispense

```dataview
TABLE mondo, categoria, tipo, stato, luogo
FROM "Mondi/Oggetti" OR "Mondi/Dispense"
WHERE file.name != "Oggetti" AND file.name != "Dispense" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, categoria ASC, nome ASC
LIMIT 16
```

### Missioni

```dataview
TABLE mondo, stato, committente, luoghi, personaggi
FROM "Mondi/Missioni"
WHERE file.name != "Missioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, stato ASC, nome ASC
LIMIT 16
```

### Timeline

```dataview
TABLE mondo, data_mondo, stato_canonico, luoghi, fazioni, sessioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -")
SORT mondo ASC, data_mondo ASC, nome ASC
LIMIT 16
```

## Archivi

- [[Mondi/Personaggi/Personaggi]]
- [[Mondi/Luoghi/Luoghi]]
- [[Mondi/Creature/Creature]]
- [[Mondi/Fazioni/Fazioni]]
- [[Mondi/Religioni/Religioni]]
- [[Mondi/Relazioni/Relazioni]]
- [[Mondi/Oggetti/Oggetti]]
- [[Mondi/Missioni/Missioni]]
- [[Mondi/Incontri/Incontri]]
- [[Mondi/Dispense/Dispense]]
- [[Mondi/Sessioni/Sessioni]]
- [[Mondi/Timeline/Timeline]]
- [[Mondi/Stato del Mondo]]
- [[Mondi/Calendario]]
- [[Inbox/Inbox]]
