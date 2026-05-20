---
cssclasses: [indice]
categoria: srd
tipo: indice talento
fonte: "SRD 5.2.1"
licenza: CC-BY-4.0
generato_da: import_srd
---

# Talenti

Totale note generate: 17.

```dataview
TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore
FROM "SRD/Talenti"
WHERE file.name != "Talenti"
SORT nome ASC
```