---
cssclasses:
  - dashboard
  - gdr-canon-control
categoria: risorsa
tipo: canon control
stato: pronto
mondo_attivo: ""
---

# Controllo Canone

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

<!-- workflow:quick_actions:start controllo_canone -->
> [!regia] Azioni rapide
> Separare canone, rumor, retcon e contraddizioni prima che confondano il tavolo.
>
> **Timeline** - una verita deve entrare nella storia del mondo
> `BUTTON[timeline-mondi-timeline-timeline]`
>
> **Revisione lore** - devi ripulire appunti, rumor o contraddizioni
> `BUTTON[revisione-lore-revisione-lore]`
>
> [!regia]- Stabilizza canone
> Portare informazioni in viste dove possono essere verificate.
>
> **Lore hub** - vuoi vedere segnali e materiale canonico collegato
> `BUTTON[lore-hub-lore-hub]`
>
> **Evento lore** - una scoperta deve restare tracciabile ma non ancora assoluta
> `BUTTON[nuovo-evento-lore-z-modelli-lore-capture-md]`
>
> **Controllo worldbuilding** - la contraddizione dipende da schede incomplete
> `BUTTON[controllo-worldbuilding-controllo-worldbuilding]`
>
> **Motore mondo vivo** - una verita produce reazioni tra sessioni
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
<!-- workflow:quick_actions:end controllo_canone -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "controllo_canone", { mode: "simple" });
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const asArray = value => dv.array(value ?? []).array();
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => asArray(value).length > 0;
const real = p => gdr.isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const canonPages = dv.pages('"Mondi" OR "Inbox"')
  .where(p => real(p) && matchesWorld(p) && (p.stato_canonico || p.canonico !== undefined));

function table(title, columns, rows, empty = "Nessun elemento da mostrare.") {
  dv.header(2, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
}

table(
  "Cosa È Vero, Detto O Dubbio",
  ["Nota", "Tipo", "Canone", "Confermato", "Da dove arriva", "Sessioni", "Data nel mondo"],
  canonPages
    .sort(p => p.stato_canonico ?? "", "asc")
    .sort(p => p.file.mtime, "desc")
    .limit(40)
    .map(p => [p.file.link, p.categoria ?? "", p.stato_canonico ?? "", p.canonico ?? "", p.fonte ?? "", p.sessioni ?? [], p.data_mondo ?? ""])
    .array()
);

table(
  "Voci, Leggende E Bugie",
  ["Nota", "Canone", "Da dove arriva", "Quanto è solida", "Collegamenti", "Cosa succede dopo"],
  canonPages
    .where(p => ["rumor", "leggenda", "falso"].includes(String(p.stato_canonico ?? "")))
    .sort(p => p.file.mtime, "desc")
    .limit(30)
    .map(p => [p.file.link, p.stato_canonico ?? "", p.fonte ?? "", p.grado_certezza ?? "", p.collegamenti ?? p.luoghi ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Contraddizioni Da Tenere D'occhio",
  ["Nota", "Cosa smentisce", "Cosa corregge", "Perché", "Da dove arriva"],
  canonPages
    .where(p => hasLinks(p.contraddice) || hasLinks(p.retcon_di) || p.stato_canonico === "retcon")
    .sort(p => p.file.mtime, "desc")
    .limit(30)
    .map(p => [p.file.link, p.contraddice ?? [], p.retcon_di ?? [], p.retcon_motivo ?? "", p.fonte ?? ""])
    .array()
);

table(
  "Verità Senza Provenienza",
  ["Nota", "Tipo", "Da dove arriva", "Sessioni", "Data reale"],
  canonPages
    .where(p => (p.canonico === true || p.stato_canonico === "canonico") && (!has(p.fonte) || (!hasLinks(p.sessioni) && p.fonte === "sessione")))
    .sort(p => p.file.mtime, "desc")
    .limit(30)
    .map(p => [p.file.link, p.categoria ?? "", p.fonte ?? "", p.sessioni ?? [], p.data_reale ?? ""])
    .array()
);

table(
  "Correzioni Non Ancora Sistemate",
  ["Nota", "Cosa corregge", "Perché", "Cosa cambia", "Cosa succede dopo"],
  canonPages
    .where(p => p.stato_canonico === "retcon" || hasLinks(p.retcon_di))
    .where(p => !has(p.retcon_motivo) || !hasLinks(p.conseguenze) || !has(p.prossima_mossa))
    .sort(p => p.file.mtime, "desc")
    .limit(30)
    .map(p => [p.file.link, p.retcon_di ?? [], p.retcon_motivo ?? "", p.conseguenze ?? [], p.prossima_mossa ?? ""])
    .array()
);
```
