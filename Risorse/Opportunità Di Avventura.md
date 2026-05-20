---
cssclasses:
  - indice
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Opportunità Di Avventura

Questa pagina mostra cosa dell'ambientazione può diventare una missione, un arco o una sessione.

## Luoghi Che Chiedono Gioco

```dataview
TABLE mondo, tipo, pericolo, tensione, problemi, segreti, fazioni
FROM "Mondi/Luoghi"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pericolo > 0 OR tensione OR problemi OR segreti)
SORT pericolo DESC, nome ASC
LIMIT 20
```

## Culture Con Tensioni

```dataview
TABLE mondo, luoghi, lingue, religioni, fazioni, tensioni, segreti
FROM "Mondi/Culture"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (tensioni OR segreti)
SORT mondo ASC, nome ASC
LIMIT 20
```

## Conflitti Pronti

```dataview
TABLE mondo, pressione, posta, prossima_mossa, fazioni, luoghi
FROM "Mondi/Conflitti"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT pressione DESC, nome ASC
LIMIT 20
```

## Segreti Spendibili

```dataview
TABLE categoria, tipo, mondo, segreti, indizi, luoghi, fazioni
FROM "Mondi"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (segreti OR indizi)
SORT file.mtime DESC
LIMIT 20
```
