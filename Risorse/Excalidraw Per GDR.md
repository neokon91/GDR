---
cssclasses:
  - indice
categoria: risorsa
tipo: guida plugin
stato: pronto
---

# Excalidraw Per GDR

Excalidraw nel vault serve per mappe vive: fronti, relazioni, indizi, scene e dungeon. Non deve diventare una cartella di disegni decorativi.

## Quando Usarlo

| Uso | Quando serve | Esempio |
| --- | --- | --- |
| `fronte` | Fazioni, PNG, missioni e pressioni si influenzano. | [[Demo - Fronte Custodi.excalidraw]] |
| `indizi` | Un mistero ha piste, fonti e verita da scoprire. | [[Demo - Rete Indizi Reliquia.excalidraw]] |
| `scena` | Al tavolo servono posizione, ostacoli, entrate e aree. | [[Demo - Scena Ponte.excalidraw]] |
| `relazioni` | Serve una rete generale tra mondo, luoghi, fazioni e missioni. | [[Schema Relazioni GDR.excalidraw]] |

## Regola Operativa

- ogni mappa deve avere `categoria: risorsa`, `tipo: mappa`, `uso`, `stato`;
- collega `mondo`, `luogo`, `fazioni`, `personaggi`, `missioni` quando servono;
- usa link interni dentro il disegno, non solo testo;
- mostra la mappa da [[Risorse/Mappe/Mappe]], [[Worldbuilder Dashboard]] o [[Durante il Gioco]];
- se la mappa contiene segreti, non collegarla a [[Vista Giocatori]].

## Vista Operativa

```dataview
TABLE uso, mondo, luogo, fazioni, personaggi, missioni, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE contains(tags, "excalidraw") AND file.name != "Mappe" AND !startswith(file.name, "Prova -")
SORT uso ASC, mondo ASC, file.name ASC
```

## Creazione

```meta-bind-button
label: Nuova Mappa Fronti
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md"
    folderPath: "Risorse/Mappe"
    open: true
```

Il plugin Excalidraw e configurato per creare nuovi disegni in `Risorse/Mappe` e usare il template fronti come base.
