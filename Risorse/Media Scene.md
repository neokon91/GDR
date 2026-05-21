---
cssclasses:
  - indice
categoria: risorsa
tipo: media
stato: pronto
---

# Media Scene

Questa pagina raccoglie i materiali con timestamp pronti per scene, recap, reference video o musica al tavolo.

## Media Per La Sessione Attiva

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true).first();
if (!active) {
  dv.paragraph("Nessuna sessione attiva. Collega media quando una sessione entra in preparazione o va al tavolo.");
} else {
  const links = [
    ...(active.audio ?? []),
    ...(active.immagini ?? []),
    ...(active.video ?? [])
  ];
  const rows = dv.array(links).map(link => dv.page(link.path ?? link)).where(Boolean)
    .map(p => [p.file.link, p.uso ?? "", p.scena ?? "", p.timestamp ?? "", p.stato ?? ""]);
  if (!rows.length) {
    dv.paragraph("Sessione attiva senza media collegati. Va bene: aggiungili solo se servono davvero al tavolo.");
  } else {
    dv.table(["Media", "Uso", "Scena", "Timestamp", "Stato"], rows);
  }
}
```

> [!regia] Regola pratica
> Un media e pronto solo se sai in quale scena aprirlo. Altrimenti resta reference, non materiale al tavolo.

## Cue Pronti

```dataview
TABLE uso, tono, campagna, scena, timestamp, stato
FROM "Risorse/Audio" OR "Risorse/Video"
WHERE file.name != "Audio" AND file.name != "Video"
SORT campagna ASC, uso ASC, scena ASC, file.name ASC
```

## Sintassi Media Extended

- Link a un momento: wikilink al file media con `#t=70`
- Clip con loop: embed del file media con `#t=70,95&loop`
- Embed dimensionato: embed del file media con larghezza o dimensioni, per esempio `640x360`

Regola di release: i media indispensabili alla sessione devono essere locali o sostituibili. I link remoti sono reference, non dipendenze critiche.
