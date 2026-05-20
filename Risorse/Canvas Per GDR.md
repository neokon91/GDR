---
cssclasses:
  - indice
categoria: risorsa
tipo: guida plugin
stato: pronto
plugin:
  - Canvas
  - Advanced Canvas
---

# Canvas Per GDR

Canvas serve quando vuoi vedere note vere collegate tra loro: campagna, mondo, fazioni, PNG, luoghi, missioni, clock e incontri. Excalidraw resta migliore per disegnare, annotare e ragionare liberamente; Canvas resta migliore quando la mappa deve essere una rete di note apribili.



## Regola Operativa

- Usa Canvas per mappe strutturali e durevoli: fronti, fazioni, archi di campagna, indizi gia canonici.
- Usa Excalidraw per schizzi, mappe di scena, diagrammi liberi e investigazioni ancora mobili.
- Ogni nodo importante dovrebbe puntare a una nota canonica, non a testo isolato nel canvas.
- I gruppi devono indicare una domanda di regia: fronte politico, mistero, sessione, conseguenze.

## Canvas Pronti

```dataview
TABLE file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE contains(file.name, "Canvas")
SORT file.mtime DESC
```
