---
cssclasses: [indice]
categoria: srd
tipo: indice lingua
fonte: "SRD 5.2.1"
licenza: CC-BY-4.0
generato_da: import_srd
---

# Lingue

Totale note generate: 19.

```dataview
TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore
FROM "SRD/Lingue"
WHERE file.name != "Lingue"
SORT nome ASC
```