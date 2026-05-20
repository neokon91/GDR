---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: pronto
---

# Materiali Al Tavolo

Questa pagina controlla cosa e pronto per la sessione attiva: dispense, mappe, immagini, audio, incontri e creature.

## Sessione Attiva

```dataview
TABLE data, data_mondo, stato, dispense, mappe, immagini, audio, incontri
FROM "Mondi/Sessioni"
WHERE attiva = true AND !startswith(file.name, "Prova -")
SORT data DESC
LIMIT 1
```

## Dispense Da Consegnare

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true && !String(p.file.name).startsWith("Prova -")).first();
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
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true && !String(p.file.name).startsWith("Prova -")).first();
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
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true && !String(p.file.name).startsWith("Prova -")).first();
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
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true && !String(p.file.name).startsWith("Prova -")).first();
const encounterLinks = dv.array(active?.incontri ?? []).array();
const encounterNames = new Set(encounterLinks.map(l => String(l.path ?? l).replace(/\.md$/, "").split("/").pop()));
const encounters = dv.pages('"Mondi/Incontri"').where(p => encounterNames.has(p.file.name)).array();
const rows = encounters.map(p => [p.file.link, p.stato ?? "", dv.array(p.creature ?? []).join(", "), p.pericolo ?? ""]);

if (!active) {
  dv.paragraph("Nessuna sessione attiva.");
} else if (!rows.length) {
  dv.paragraph("Nessun incontro collegato alla sessione attiva.");
} else {
  dv.table(["Incontro", "Stato", "Creature", "Pericolo"], rows);
}
```

## Controllo Finale

- [ ] Una sessione e attiva.
- [ ] Le dispense da mostrare sono collegate.
- [ ] Mappe e schemi sono apribili.
- [ ] Incontri e creature sono pronti.
- [ ] Audio, immagini o video sono collegati solo se servono davvero.
