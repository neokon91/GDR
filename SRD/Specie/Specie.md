---
cssclasses: [indice]
categoria: srd
tipo: indice specie
fonte: "SRD 5.2.1"
licenza: CC-BY-4.0
generato_da: import_srd
---

# Specie

Totale note generate: 9.

```dataview
TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore
FROM "SRD/Specie"
WHERE file.name != "Specie"
SORT nome ASC
```