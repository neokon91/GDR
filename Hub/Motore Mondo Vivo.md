---
cssclasses:
  - dashboard
  - gdr-living-world-engine
categoria: risorsa
tipo: motore mondo vivo
stato: pronto
mondo_attivo: ""
campagne_attive: []
---

# Motore Mondo Vivo

> [!timeline] Campaign + living world engine
> Questa vista collega canone, fazioni, stati del mondo, causalita storica e conseguenze da sessione. Non sostituisce la preparazione: decide cosa deve cambiare nel mondo prima della prossima sessione.

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`
>
> Campagne:
> `INPUT[campagne][:campagne_attive]`

`BUTTON[stato-campagna-mondi-stato-del-mondo]`

`BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

`BUTTON[worldbuilder-worldbuilder-dashboard]`

`BUTTON[timeline-mondi-timeline-timeline]`

`BUTTON[controllo-canone-controllo-canone]`

`BUTTON[economia-e-rotte-economia-e-rotte-2]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const campaigns = new Set(dv.array(current.campagne_attive ?? []).map(gdr.linkKey).array());
const asArray = value => dv.array(value ?? []).array();
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => asArray(value).length > 0;
const real = p => gdr.isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const matchesCampaign = p => {
  if (!campaigns.size) return true;
  const direct = [...asArray(p.campagne), ...asArray(p.campagna), ...asArray(p.campagne_attive)];
  if (direct.some(link => campaigns.has(gdr.linkKey(link)))) return true;
  const sessions = asArray(p.sessioni).map(link => dv.page(gdr.linkKey(link))).filter(Boolean);
  return !direct.length && (!sessions.length || sessions.some(session => [...asArray(session.campagne), ...asArray(session.campagne)].some(link => campaigns.has(gdr.linkKey(link)))));
};
const pages = (source, predicate = () => true) => dv.pages(source).where(p => real(p) && matchesWorld(p) && matchesCampaign(p) && predicate(p));
const table = (title, columns, rows, empty = "Nessun elemento da mostrare.") => {
  dv.header(2, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
};
const progress = p => `${Number(p.progress_value ?? 0)}/${Number(p.progress_max ?? 0) || ""}`;

const statRows = [
  ["Canone vivo", pages('"Mondi" OR "Inbox"', p => p.canonico === true || p.stato_canonico === "canonico").length, "Verita che vincolano il mondo"],
  ["Pressioni", pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti" OR "Mondi/Tracciati"', p => Number(p.pressione ?? 0) > 0 || Number(p.progress_value ?? 0) > 0).length, "Attori che possono muoversi"],
  ["Pressioni economiche", pages('"Mondi/Rotte" OR "Mondi/Risorse" OR "Mondi/Mercati"', p => Number(p.pressione ?? 0) > 0 || has(p.prossima_mossa)).length, "Rotte, risorse e nodi"],
  ["Eventi causali", pages('"Mondi/Timeline"', p => p.file.name !== "Timeline" && (has(p.causa) || hasLinks(p.cause) || hasLinks(p.effetti))).length, "Storia con causa o effetto"],
  ["Propagazioni aperte", pages('"Mondi" OR "Inbox"', p => hasLinks(p.propaga_a) || hasLinks(p.entita_impattate) || hasLinks(p.conseguenze)).length, "Cambiamenti da riflettere"]
];
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = statRows.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
  </div>
`).join("");

table(
  "Event Propagation",
  ["Origine", "Tipo", "Stato", "Propaga a", "Entita impattate", "Conseguenze", "Prossima mossa"],
  pages('"Mondi" OR "Inbox"', p => hasLinks(p.propaga_a) || hasLinks(p.entita_impattate) || hasLinks(p.conseguenze) || has(p.prossima_mossa))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .sort(p => p.file.mtime, "desc")
    .limit(24)
    .map(p => [p.file.link, p.categoria ?? p.tipo ?? "", p.stato ?? p.stato_canonico ?? "", p.propaga_a ?? [], p.entita_impattate ?? p.collegamenti ?? [], p.conseguenze ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Faction Dynamics",
  ["Potere", "Pressione", "Clock", "Agenda", "Alleati", "Rivali", "Trattati", "Prossima mossa"],
  pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti"', p => p.file.name !== "Fazioni" && p.file.name !== "Religioni" && p.file.name !== "Conflitti")
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(24)
    .map(p => [p.file.link, p.pressione ?? "", progress(p), p.agenda ?? p.obiettivo ?? p.posta ?? "", p.alleati ?? [], p.rivali ?? [], p.trattati ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Economic Pressure",
  ["Nodo", "Tipo", "Stato", "Pressione", "Controllori", "Risorse", "Conseguenze", "Prossima mossa"],
  pages('"Mondi/Rotte" OR "Mondi/Risorse" OR "Mondi/Mercati"', p => p.file.name !== "Rotte" && p.file.name !== "Risorse" && p.file.name !== "Mercati")
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(24)
    .map(p => [p.file.link, p.tipo ?? "", p.stato_rotta ?? p.stato ?? "", p.pressione ?? "", p.fazioni_controllanti ?? p.fazioni ?? [], p.risorse_trasportate ?? p.risorse ?? [], p.conseguenze ?? p.conseguenze_se_bloccata ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Relationship Graph",
  ["Nodo", "Categoria", "Soggetti", "Relazioni", "Alleati", "Rivali", "Fazioni", "Luoghi", "Missioni"],
  pages('"Mondi/Personaggi" OR "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Luoghi" OR "Mondi/Relazioni"', p =>
    hasLinks(p.soggetti) || hasLinks(p.relazioni) || hasLinks(p.alleati) || hasLinks(p.rivali) || hasLinks(p.fazioni) || hasLinks(p.luoghi) || hasLinks(p.missioni)
  )
    .sort(p => p.categoria ?? "", "asc")
    .limit(32)
    .map(p => [p.file.link, p.categoria ?? p.tipo ?? "", p.soggetti ?? [], p.relazioni ?? [], p.alleati ?? [], p.rivali ?? [], p.fazioni ?? [], p.luoghi ?? [], p.missioni ?? []])
    .array()
);

table(
  "Historical Causality",
  ["Evento", "Data", "Cause", "Effetti", "Fazioni", "Luoghi", "Missioni", "Stato mondo"],
  pages('"Mondi/Timeline"', p => p.file.name !== "Timeline")
    .sort(p => p.data_mondo ?? p.file.name, "asc")
    .limit(32)
    .map(p => [p.file.link, p.data_mondo ?? "", p.cause ?? p.causa ?? "", p.effetti ?? p.conseguenze ?? [], p.fazioni ?? [], p.luoghi ?? [], p.missioni ?? [], p.stato_mondo ?? []])
    .array()
);

table(
  "Continuita Da Chiudere Prima Della Prossima Sessione",
  ["Nota", "Problema", "Stato", "Sessioni", "Collegamenti"],
  [
    ...pages('"Inbox"', p => p.categoria === "lore capture" && (p.stato === "da smistare" || p.canonico === true || p.stato === "canonica"))
      .where(p => !hasLinks(p.collegamenti) || !hasLinks(p.entita_impattate) || (!hasLinks(p.conseguenze) && !has(p.prossima_mossa)))
      .map(p => [p.file.link, "lore da propagare o storicizzare", p.stato ?? "", p.sessioni ?? [], p.collegamenti ?? []])
      .array(),
    ...pages('"Mondi/Timeline"', p => p.file.name !== "Timeline" && (p.canonico === true || p.stato_canonico === "canonico"))
      .where(p => (!has(p.causa) && !hasLinks(p.cause)) || (!hasLinks(p.conseguenze) && !hasLinks(p.effetti)))
      .map(p => [p.file.link, "evento canonico senza causa o effetto", p.stato_canonico ?? "", p.sessioni ?? [], [...asArray(p.luoghi), ...asArray(p.fazioni)]])
      .array(),
    ...pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Conflitti"', p => Number(p.pressione ?? 0) > 0)
      .where(p => !has(p.prossima_mossa) || !has(p.innesco))
      .map(p => [p.file.link, "potere in movimento senza innesco o prossima mossa", p.stato ?? "", p.sessioni ?? [], [...asArray(p.luoghi), ...asArray(p.missioni)]])
      .array()
  ].slice(0, 32),
  "Nessuna continuita aperta evidente con i filtri correnti."
);
```
