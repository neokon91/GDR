---
cssclasses:
  - indice
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Fronti Di Campagna

Questa pagina mostra le cose che avanzano se i personaggi non intervengono.

## Fronti Attivi

```dataview
TABLE categoria, tipo, pressione, prossima_mossa, scadenza_mondo, fazioni, luoghi
FROM "Mondi/Conflitti" OR "Mondi/Missioni" OR "Mondi/Fazioni"
WHERE stato != "archiviata" AND pressione > 0
SORT pressione DESC, scadenza_mondo ASC, nome ASC
LIMIT 30
```

## Senza Prossima Mossa

```dataview
TABLE categoria, tipo, pressione, fazioni, luoghi
FROM "Mondi/Conflitti" OR "Mondi/Missioni" OR "Mondi/Fazioni"
WHERE stato != "archiviata" AND pressione > 0 AND !prossima_mossa
SORT pressione DESC, nome ASC
```

## Scadenze Narrative

```dataview
TABLE categoria, tipo, pressione, scadenza_mondo, prossima_mossa
FROM "Mondi/Conflitti" OR "Mondi/Missioni"
WHERE stato != "archiviata" AND scadenza_mondo
SORT scadenza_mondo ASC, pressione DESC
```
