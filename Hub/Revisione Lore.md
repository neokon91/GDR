---
cssclasses:
  - dashboard
  - gdr-lore-review
categoria: risorsa
tipo: lore review
stato: pronto
mondo_attivo: ""
---

# Revisione Lore

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

`BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`

`BUTTON[lore-capture-z-modelli-lore-capture-md]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const asArray = value => dv.array(value ?? []).array();
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => asArray(value).length > 0;
const real = p => gdr.isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const loreSources = '"Mondi" OR "Inbox"';
const lore = dv.pages(loreSources)
  .where(p => real(p) && matchesWorld(p))
  .where(p => p.stato_canonico || ["lore capture", "evento storico", "segreto", "cultura", "fazione", "religione", "conflitto", "luogo"].includes(String(p.categoria ?? "")));

function table(title, columns, rows, empty = "Nessun elemento da mostrare.") {
  dv.header(2, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
}

table(
  "Da Completare",
  ["Nota", "Tipo", "Stato", "Serve ancora"],
  lore
    .where(p => !has(p.mondo) || !has(p.stato_canonico) || (!hasLinks(p.collegamenti) && !hasLinks(p.luoghi) && !hasLinks(p.fazioni) && !hasLinks(p.personaggi)))
    .sort(p => p.file.mtime, "desc")
    .limit(20)
    .map(p => {
      const missing = [
        !has(p.mondo) ? "mondo" : "",
        !has(p.stato_canonico) ? "verità, voce o leggenda" : "",
        (!hasLinks(p.collegamenti) && !hasLinks(p.luoghi) && !hasLinks(p.fazioni) && !hasLinks(p.personaggi)) ? "collegamenti" : ""
      ].filter(Boolean);
      return [p.file.link, p.categoria ?? "", p.stato ?? "", missing.join(", ")];
    })
    .array()
);

table(
  "Non Arriva Ancora Al Tavolo",
  ["Nota", "Tipo", "Stato", "Scelte", "Rischi", "Indizi", "Cosa succede dopo"],
  lore
    .where(p => p.giocabile !== true && !hasLinks(p.scelte) && !hasLinks(p.rischi) && !hasLinks(p.indizi) && !has(p.prossima_mossa))
    .sort(p => p.file.mtime, "desc")
    .limit(20)
    .map(p => [p.file.link, p.categoria ?? "", p.stato ?? "", p.scelte ?? [], p.rischi ?? [], p.indizi ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Senza Appigli Nel Mondo",
  ["Nota", "Tipo", "Mondo", "Canone", "Sessioni"],
  lore
    .where(p => !hasLinks(p.collegamenti) && !hasLinks(p.luoghi) && !hasLinks(p.fazioni) && !hasLinks(p.personaggi) && !hasLinks(p.missioni))
    .sort(p => p.file.mtime, "desc")
    .limit(20)
    .map(p => [p.file.link, p.categoria ?? "", p.mondo ?? "", p.stato_canonico ?? "", p.sessioni ?? []])
    .array()
);

table(
  "Segreti Senza Indizi",
  ["Nota", "Tipo", "Stato", "Collegamenti"],
  lore
    .where(p => ["segreto", "mistero", "verità nascosta"].includes(String(p.tipo ?? "")) || p.stato_canonico === "segreto")
    .where(p => !hasLinks(p.indizi))
    .sort(p => p.file.mtime, "desc")
    .limit(20)
    .map(p => [p.file.link, p.categoria ?? "", p.stato ?? "", p.collegamenti ?? []])
    .array()
);

table(
  "Storia Senza Effetto Chiaro",
  ["Evento", "Data", "Perché è successo", "Cosa cambia", "Cosa succede dopo"],
  dv.pages('"Mondi/Timeline"')
    .where(p => real(p) && matchesWorld(p) && p.file.name !== "Timeline")
    .where(p => !has(p.causa) || !hasLinks(p.conseguenze) || !has(p.prossima_mossa))
    .sort(p => p.data_mondo ?? p.file.name, "asc")
    .limit(20)
    .map(p => [p.file.link, p.data_mondo ?? "", p.causa ?? "", p.conseguenze ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Pressioni Senza Uso Al Tavolo",
  ["Pressione", "Avanzamento", "Quando avanza", "Fazioni", "Missioni", "Cosa cambia"],
  dv.pages('"Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Conflitti"')
    .where(p => real(p) && matchesWorld(p))
    .where(p => Number(p.progress_max ?? 0) > 0 || Number(p.pressione ?? 0) > 0)
    .where(p => !has(p.innesco) || !has(p.prossima_mossa) || !hasLinks(p.conseguenze))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(20)
    .map(p => [p.file.link, `${Number(p.progress_value ?? 0)}/${Number(p.progress_max ?? 0) || ""}`, p.innesco ?? "", p.fazioni ?? [], p.missioni ?? [], p.conseguenze ?? []])
    .array()
);
```
