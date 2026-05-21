---
cssclasses:
  - indice
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Task DM

Questa vista raccoglie solo le checklist operative marcate `#task`. Tasks usa `#task` come filtro globale; Dataview resta come fallback leggibile.

## Post-Sessione Adesso

```tasks
not done
path includes z.bacheche/Post Sessione.md
sort by priority
sort by urgency
sort by description
```

## Preparazione Adesso

```tasks
not done
path includes z.bacheche/Preparazione Sessioni.md
sort by priority
sort by urgency
sort by description
```

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

Le bacheche utili ogni giorno sono [[z.bacheche/Preparazione Sessioni]] prima del tavolo e [[z.bacheche/Post Sessione]] dopo il tavolo. La vista qui sopra serve solo a non cercarle a mano.
