---
cssclasses: [indice]
categoria: srd
tipo: indice equipaggiamento
fonte: "SRD 5.2.1"
licenza: CC-BY-4.0
generato_da: import_srd
---

# Equipaggiamento

Totale note generate: 197.

```dataview
TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore
FROM "SRD/Equipaggiamento"
WHERE file.name != "Equipaggiamento"
SORT nome ASC
```