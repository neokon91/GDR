---
cssclasses:
  - indice
---

# Mondo

```meta-bind-button
label: Dashboard
style: primary
actions:
  - type: open
    link: "[[1. DM Dashboard]]"
```

```meta-bind-button
label: Durante Il Gioco
style: primary
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

## Stato Del Mondo

```dataview
TABLE WITHOUT ID
  length(filter(rows.file, (f) => contains(f.path, "Mondo/Personaggi/"))) AS personaggi,
  length(filter(rows.file, (f) => contains(f.path, "Mondo/Luoghi/"))) AS luoghi,
  length(filter(rows.file, (f) => contains(f.path, "Mondo/Missioni/"))) AS missioni,
  length(filter(rows.file, (f) => contains(f.path, "Mondo/Incontri/"))) AS incontri
FROM "Mondo"
WHERE file.name != "Mondo"
GROUP BY true
```

## Sessioni Recenti

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondo/Sessioni"
WHERE file.name != "Sessioni"
SORT data DESC
LIMIT 6
```

## Missioni Aperte

```dataview
TABLE stato, committente, luoghi, personaggi
FROM "Mondo/Missioni"
WHERE stato = "proposta" OR stato = "accettata" OR stato = "in corso"
SORT stato ASC, nome ASC
```

## Luoghi In Gioco

```dataview
TABLE tipo, stato, pericolo, luogo_padre
FROM "Mondo/Luoghi"
WHERE stato = "pronto" OR stato = "in gioco" OR canonico = true
SORT stato ASC, nome ASC
LIMIT 12
```

## PNG In Gioco

```dataview
TABLE ruolo, luogo, atteggiamento
FROM "Mondo/Personaggi"
WHERE tipo = "png" AND stato = "in gioco"
SORT nome ASC
```

## Archivi

- [[Mondo/Personaggi/Personaggi]]
- [[Mondo/Luoghi/Luoghi]]
- [[Mondo/Creature/Creature]]
- [[Mondo/Fazioni/Fazioni]]
- [[Mondo/Religioni/Religioni]]
- [[Mondo/Oggetti/Oggetti]]
- [[Mondo/Missioni/Missioni]]
- [[Mondo/Incontri/Incontri]]
- [[Mondo/Dispense/Dispense]]
- [[Mondo/Sessioni/Sessioni]]
- [[Mondo/Calendario]]
- [[z.bacheche/Post Sessione]]
- [[Inbox/Inbox]]
