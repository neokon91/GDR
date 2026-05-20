---
cssclasses: [indice]
categoria: srd
tipo: indice background
fonte: "SRD 5.2.1"
licenza: CC-BY-4.0
generato_da: import_srd
---

# Background

Totale note generate: 4.

```dataview
TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore
FROM "SRD/Background"
WHERE file.name != "Background"
SORT nome ASC
```