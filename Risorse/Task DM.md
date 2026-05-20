---
cssclasses:
  - indice
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Task DM

Questa vista raccoglie solo le checklist operative marcate `#task`. Tasks usa `#task` come filtro globale; Dataview resta come fallback leggibile.

## Aperte Tasks

```tasks
not done
path includes z.bacheche
group by due
sort by urgency
sort by due
sort by description
```

## Priorita Tasks

```tasks
not done
path includes z.bacheche
sort by priority
sort by urgency
sort by path
```

## Completate Tasks

```tasks
done
path includes z.bacheche
sort by done reverse
sort by path
```

## Aperte Dataview

```dataview
TASK
FROM "z.bacheche"
WHERE !completed AND contains(text, "#task")
GROUP BY file.link
```

## Completate Dataview

```dataview
TASK
FROM "z.bacheche"
WHERE completed AND contains(text, "#task")
GROUP BY file.link
```

## Regola

Usa `#task` solo per lavoro reale del DM: preparare, smistare, aggiornare, chiudere sessione. Non usarlo per missioni narrative, clock, conseguenze o checklist di documentazione.
