---
cssclasses:
  - indice
categoria: risorsa
tipo: media
stato: pronto
---

# Media Scene

Questa pagina raccoglie i materiali con timestamp pronti per scene, recap, reference video o musica al tavolo.

## Cue Pronti

```dataview
TABLE uso, tono, campagna, scena, timestamp, stato
FROM "Risorse/Audio" OR "Risorse/Video"
WHERE file.name != "Audio" AND file.name != "Video" AND !startswith(file.name, "Prova -")
SORT campagna ASC, uso ASC, scena ASC, file.name ASC
```

## Sintassi Media Extended

- Link a un momento: wikilink al file media con `#t=70`
- Clip con loop: embed del file media con `#t=70,95&loop`
- Embed dimensionato: embed del file media con larghezza o dimensioni, per esempio `640x360`

Regola di release: i media indispensabili alla sessione devono essere locali o sostituibili. I link remoti sono reference, non dipendenze critiche.
