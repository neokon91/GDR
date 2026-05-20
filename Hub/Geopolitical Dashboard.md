---
cssclasses:
  - dashboard
  - gdr-geopolitical-dashboard
categoria: risorsa
tipo: dashboard geopolitica
stato: pronto
mondo_attivo: ""
---

# Geopolitical Dashboard

> [!luogo] Geopolitica operativa
> Stati, confini, risorse, relazioni diplomatiche e crisi devono produrre pressioni giocabili, non solo descrizione.

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`

```meta-bind-button
label: Nuovo Territorio Politico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Luogo Router.md"
    folderPath: "Mondi/Luoghi"
    open: true
```

```meta-bind-button
label: Nuova Relazione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Relazione.md"
    folderPath: "Mondi/Relazioni"
    open: true
```

```meta-bind-button
label: Motore Mondo Vivo
style: primary
actions:
  - type: open
    link: "[[Motore Mondo Vivo]]"
```

```meta-bind-button
label: Economia E Rotte
style: primary
actions:
  - type: open
    link: "[[Economia E Rotte]]"
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const asArray = value => dv.array(value ?? []).array();
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => asArray(value).length > 0;
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const politicalTypes = new Set(["regno", "impero", "repubblica", "oligarchia", "ducato", "contea", "baronia", "protettorato", "marca"]);
const pages = (source, predicate = () => true) => dv.pages(source).where(p => real(p) && matchesWorld(p) && predicate(p));
const table = (title, columns, rows, empty = "Nessun elemento da mostrare.") => {
  dv.header(2, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
};
const territories = pages('"Mondi/Luoghi"', p => politicalTypes.has(String(p.tipo ?? p.tipologia ?? p.sottotipo ?? "")) || has(p.legittimita) || hasLinks(p.vassalli) || hasLinks(p.confini));

const stats = [
  ["Territori", territories.length, "Stati e domini politici"],
  ["Relazioni", pages('"Mondi/Relazioni"', p => p.file.name !== "Relazioni").length, "Patti, rivalita, trattati"],
  ["Crisi", territories.where(p => Number(p.pressione ?? 0) > 0 || hasLinks(p.crisi_interne)).length, "Pressioni territoriali"],
  ["Risorse", territories.where(p => hasLinks(p.risorse_strategiche) || hasLinks(p.risorse)).length, "Leve economiche o rituali"],
  ["Rotte", pages('"Mondi/Rotte"', p => p.file.name !== "Rotte").length, "Vie commerciali e confini"],
  ["Mercati", pages('"Mondi/Mercati"', p => p.file.name !== "Mercati").length, "Nodi di potere economico"]
];
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = stats.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
  </div>
`).join("");

table(
  "Potenze E Territori",
  ["Territorio", "Tipo", "Stabilità", "Pressione", "Legittimità", "Capitale", "Governante", "Prossima mossa"],
  territories
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(30)
    .map(p => [p.file.link, p.tipo ?? p.tipologia ?? "", p.stabilita ?? "", p.pressione ?? "", p.legittimita ?? "", p.capitale ?? "", p.governante ?? "", p.prossima_mossa ?? ""])
    .array()
);

table(
  "Confini, Vassalli E Dipendenze",
  ["Territorio", "Confini", "Vassalli", "Luogo padre", "Relazioni", "Rivali"],
  territories
    .where(p => hasLinks(p.confini) || hasLinks(p.vassalli) || has(p.luogo_padre) || hasLinks(p.relazioni) || hasLinks(p.rivali))
    .sort(p => p.file.name, "asc")
    .limit(30)
    .map(p => [p.file.link, p.confini ?? [], p.vassalli ?? [], p.luogo_padre ?? "", p.relazioni ?? [], p.rivali ?? []])
    .array()
);

table(
  "Risorse Strategiche",
  ["Territorio", "Risorse", "Fazioni", "Culture", "Religioni", "Crisi"],
  territories
    .where(p => hasLinks(p.risorse_strategiche) || hasLinks(p.risorse) || hasLinks(p.crisi_interne))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(30)
    .map(p => [p.file.link, p.risorse_strategiche ?? p.risorse ?? [], p.fazioni ?? [], p.culture ?? [], p.religioni ?? [], p.crisi_interne ?? []])
    .array()
);

table(
  "Rotte E Nodi Commerciali",
  ["Elemento", "Tipo", "Stato", "Luoghi", "Controllori", "Risorse", "Pressione"],
  [
    ...pages('"Mondi/Rotte"', p => p.file.name !== "Rotte")
      .map(p => [p.file.link, "rotta", p.stato_rotta ?? p.stato ?? "", [p.partenza, p.arrivo, ...(asArray(p.regioni))].filter(Boolean), p.fazioni_controllanti ?? p.fazioni ?? [], p.risorse_trasportate ?? p.risorse ?? [], p.pressione ?? ""])
      .array(),
    ...pages('"Mondi/Mercati"', p => p.file.name !== "Mercati")
      .map(p => [p.file.link, "mercato", p.stato ?? "", p.luogo ?? p.luoghi ?? [], p.fazioni_controllanti ?? p.fazioni ?? [], p.risorse ?? [], p.pressione ?? ""])
      .array()
  ].sort((a, b) => Number(b[6] || 0) - Number(a[6] || 0)).slice(0, 30)
);

table(
  "Relazioni Diplomatiche",
  ["Relazione", "Tipo", "Soggetti", "Intensità", "Pressione", "Posta", "Conseguenze", "Prossima mossa"],
  pages('"Mondi/Relazioni"', p => p.file.name !== "Relazioni")
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(30)
    .map(p => [p.file.link, p.tipo ?? "", p.soggetti ?? [], p.intensita ?? "", p.pressione ?? "", p.posta ?? "", p.conseguenze ?? [], p.prossima_mossa ?? ""])
    .array()
);

const issues = [
  ...territories.where(p => !has(p.capitale) && ["regno", "impero", "repubblica", "oligarchia"].includes(String(p.tipo ?? "")))
    .map(p => [p.file.link, "territorio maggiore senza capitale", p.tipo ?? "", p.stato ?? ""]).array(),
  ...territories.where(p => !has(p.governante) && !hasLinks(p.fazioni))
    .map(p => [p.file.link, "territorio senza governante o fazioni di potere", p.tipo ?? "", p.stato ?? ""]).array(),
  ...territories.where(p => !hasLinks(p.confini) && !has(p.luogo_padre))
    .map(p => [p.file.link, "territorio senza confini o contesto superiore", p.tipo ?? "", p.stato ?? ""]).array(),
  ...territories.where(p => !hasLinks(p.risorse_strategiche) && !hasLinks(p.risorse))
    .map(p => [p.file.link, "territorio senza risorse strategiche", p.tipo ?? "", p.stato ?? ""]).array(),
  ...pages('"Mondi/Relazioni"', p => p.file.name !== "Relazioni")
    .where(p => Number(p.pressione ?? 0) >= 6 && !has(p.prossima_mossa))
    .map(p => [p.file.link, "relazione ad alta pressione senza prossima mossa", p.tipo ?? "", p.stato ?? ""]).array()
];

table(
  "Buchi Geopolitici",
  ["Nota", "Problema", "Tipo", "Stato"],
  issues.slice(0, 30),
  "Nessun buco geopolitico evidente con i filtri correnti."
);
```
