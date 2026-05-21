---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: pronto
---

# Materiali Al Tavolo

Questa pagina controlla cosa e pronto per la sessione attiva: dispense, mappe, immagini, audio, incontri e creature.

````tabs
tab: Pronto Ora

> [!regia] Sessione Attiva
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderLiveCommandCenter(dv);
> ```

tab: Materiali

> [!lettura] Dispense E Media
> ```dataviewjs
> const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true).first();
> const rows = [
>   ...dv.array(active?.dispense ?? []).array().map(x => [x, "Dispensa"]),
>   ...dv.array(active?.audio ?? []).array().map(x => [x, "Audio"]),
>   ...dv.array(active?.immagini ?? []).array().map(x => [x, "Immagine"]),
>   ...dv.array(active?.video ?? []).array().map(x => [x, "Video"])
> ];
> if (!active) dv.paragraph("Nessuna sessione attiva.");
> else if (!rows.length) dv.paragraph("Nessun materiale collegato alla sessione attiva.");
> else dv.table(["Materiale", "Tipo"], rows);
> ```

> [!encounter] Pipeline D&D 5.5
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderDnd55MaterialPipeline(dv);
> ```

tab: Mappe

> [!mappa] Mappe Sessione
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderSessionMapCards(dv);
> ```

tab: Azioni

> [!todo] Controllo Finale
> - [ ] Una sessione e attiva. #task
> - [ ] Le dispense da mostrare sono collegate. #task
> - [ ] Mappe e schemi sono apribili. #task
> - [ ] Incontri e creature sono pronti. #task
> - [ ] Audio, immagini o video sono collegati solo se servono davvero. #task
````

## Fallback Markdown

| Area | Controllo |
| --- | --- |
| Sessione | Una sola sessione attiva |
| Mappe | Collegate alla sessione o agli incontri |
| Dispense | Player-safe se consegnate |

## Sessione Attiva

```dataview
TABLE data, data_mondo, stato, dispense, mappe, immagini, audio, incontri
FROM "Mondi/Sessioni"
WHERE attiva = true
SORT data DESC
LIMIT 1
```

## Dispense Da Consegnare

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true).first();
const links = dv.array(active?.dispense ?? []).array();
if (!active) {
  dv.paragraph("Nessuna sessione attiva.");
} else if (!links.length) {
  dv.paragraph("Nessuna dispensa collegata alla sessione attiva.");
} else {
  dv.table(["Dispensa"], links.map(x => [x]));
}
```

## Mappe E Schemi

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true).first();
const links = dv.array(active?.mappe ?? []).array();
if (!active) {
  dv.paragraph("Nessuna sessione attiva.");
} else if (!links.length) {
  dv.paragraph("Nessuna mappa collegata alla sessione attiva.");
} else {
  dv.table(["Mappa o schema"], links.map(x => [x]));
}
```

## Media E Scene

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true).first();
const rows = [
  ...dv.array(active?.audio ?? []).array().map(x => [x, "Audio"]),
  ...dv.array(active?.immagini ?? []).array().map(x => [x, "Immagine"]),
  ...dv.array(active?.video ?? []).array().map(x => [x, "Video"])
];
if (!active) {
  dv.paragraph("Nessuna sessione attiva.");
} else if (!rows.length) {
  dv.paragraph("Nessun media collegato alla sessione attiva.");
} else {
  dv.table(["Materiale", "Tipo"], rows);
}
```

## Incontri E Creature

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderDnd55MaterialPipeline(dv);
```

## Controllo Finale

- [ ] Una sessione e attiva.
- [ ] Le dispense da mostrare sono collegate.
- [ ] Mappe e schemi sono apribili.
- [ ] Incontri e creature sono pronti.
- [ ] Audio, immagini o video sono collegati solo se servono davvero.
