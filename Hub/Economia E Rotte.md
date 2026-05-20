---
cssclasses:
  - dashboard
  - gdr-economia-rotte
categoria: risorsa
tipo: dashboard economia
stato: pronto
mondo_attivo: ""
---

# Economia E Rotte

> [!luogo] Sistema commerciale
> Rotte, risorse e nodi commerciali devono mostrare chi dipende da cosa, cosa succede se un passaggio viene bloccato e quali pressioni economiche non sono ancora arrivate al tavolo.

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`

```meta-bind-button
label: Nuova Rotta
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Rotta.md"
    folderPath: "Mondi/Rotte"
    open: true
```

```meta-bind-button
label: Nuova Risorsa
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Risorsa.md"
    folderPath: "Mondi/Risorse"
    open: true
```

```meta-bind-button
label: Nuovo Mercato
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Mercato o Nodo Commerciale.md"
    folderPath: "Mondi/Mercati"
    open: true
```

```meta-bind-button
label: Geopolitica
style: default
actions:
  - type: open
    link: "[[Geopolitical Dashboard]]"
```

```meta-bind-button
label: Lore Hub
style: default
actions:
  - type: open
    link: "[[Lore Hub]]"
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
const pages = (source, predicate = () => true) => dv.pages(source).where(p => real(p) && matchesWorld(p) && predicate(p));
const table = (title, columns, rows, empty = "Nessun elemento da mostrare.") => {
  dv.header(2, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
};

const routes = pages('"Mondi/Rotte"', p => p.file.name !== "Rotte");
const resources = pages('"Mondi/Risorse"', p => p.file.name !== "Risorse");
const markets = pages('"Mondi/Mercati"', p => p.file.name !== "Mercati");

const stats = [
  ["Rotte aperte", routes.where(p => p.stato_rotta === "aperta").length, "Passaggi disponibili"],
  ["Rotte bloccate", routes.where(p => ["chiusa", "interrotta", "maledetta"].includes(String(p.stato_rotta ?? ""))).length, "Conseguenze da propagare"],
  ["Rotte contese", routes.where(p => p.stato_rotta === "contesa").length, "Pressione politica o militare"],
  ["Risorse", resources.length, "Leve strategiche"],
  ["Mercati", markets.length, "Nodi e strozzature"]
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
  "Rotte Aperte, Chiuse E Contese",
  ["Rotta", "Stato", "Da", "A", "Risorse", "Controllori", "Pressione", "Prossima mossa"],
  routes
    .sort(p => Number(p.pressione ?? 0), "desc")
    .sort(p => p.stato_rotta ?? "", "asc")
    .limit(30)
    .map(p => [p.file.link, p.stato_rotta ?? "", p.partenza ?? "", p.arrivo ?? "", p.risorse_trasportate ?? p.risorse ?? [], p.fazioni_controllanti ?? p.fazioni ?? [], p.pressione ?? "", p.prossima_mossa ?? ""])
    .array()
);

table(
  "Risorse Strategiche",
  ["Risorsa", "Luoghi", "Controllori", "Uso", "Dipendenze", "Rotte", "Mercati"],
  resources
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(30)
    .map(p => [p.file.link, p.luoghi ?? p.regioni ?? [], p.fazioni_controllanti ?? p.fazioni ?? [], p.uso_narrativo ?? p.usi ?? "", p.luoghi_dipendenti ?? p.dipendenze ?? [], p.rotte ?? [], p.mercati ?? []])
    .array()
);

table(
  "Mercati O Nodi Commerciali",
  ["Nodo", "Luogo", "Risorse", "Rotte", "Controllori", "Rischi", "Prossima mossa"],
  markets
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(30)
    .map(p => [p.file.link, p.luogo ?? p.luoghi ?? [], p.risorse ?? [], p.rotte ?? [], p.fazioni_controllanti ?? p.fazioni ?? [], p.rischi ?? [], p.prossima_mossa ?? ""])
    .array()
);

table(
  "Fazioni Che Controllano Risorse",
  ["Fazione", "Risorse", "Rotte", "Mercati"],
  dv.pages('"Mondi/Fazioni" OR "Mondi/Religioni"')
    .where(p => real(p) && matchesWorld(p))
    .map(f => {
      const key = gdr.linkKey(f.file.link);
      const controlledResources = resources.where(r => asArray(r.fazioni_controllanti ?? r.fazioni).some(x => gdr.linkKey(x) === key)).map(r => r.file.link).array();
      const controlledRoutes = routes.where(r => asArray(r.fazioni_controllanti ?? r.fazioni).some(x => gdr.linkKey(x) === key)).map(r => r.file.link).array();
      const controlledMarkets = markets.where(m => asArray(m.fazioni_controllanti ?? m.fazioni).some(x => gdr.linkKey(x) === key)).map(m => m.file.link).array();
      return [f.file.link, controlledResources, controlledRoutes, controlledMarkets];
    })
    .where(row => row[1].length || row[2].length || row[3].length)
    .array()
);

table(
  "Luoghi Dipendenti Da Una Risorsa",
  ["Luogo", "Risorse dichiarate", "Dipende da", "Rotte collegate"],
  dv.pages('"Mondi/Luoghi"')
    .where(p => real(p) && matchesWorld(p))
    .map(l => {
      const key = gdr.linkKey(l.file.link);
      const deps = resources.where(r => asArray(r.luoghi_dipendenti).some(x => gdr.linkKey(x) === key) || asArray(l.risorse ?? l.risorse_strategiche).some(x => gdr.linkKey(x) === gdr.linkKey(r.file.link) || String(x).includes(r.file.name))).map(r => r.file.link).array();
      const routeDeps = routes.where(r => asArray(r.luoghi).some(x => gdr.linkKey(x) === key) || gdr.linkKey(r.partenza) === key || gdr.linkKey(r.arrivo) === key).map(r => r.file.link).array();
      return [l.file.link, l.risorse ?? l.risorse_strategiche ?? [], deps, routeDeps];
    })
    .where(row => hasLinks(row[1]) || row[2].length || row[3].length)
    .array()
);

table(
  "Conseguenze Economiche Non Propagate",
  ["Nota", "Conseguenze", "Propaga a", "Entità impattate", "Prossima mossa"],
  [...routes.array(), ...resources.array(), ...markets.array()]
    .filter(p => (hasLinks(p.conseguenze) || hasLinks(p.conseguenze_se_bloccata)) && !hasLinks(p.propaga_a) && !hasLinks(p.entita_impattate))
    .map(p => [p.file.link, p.conseguenze ?? p.conseguenze_se_bloccata ?? [], p.propaga_a ?? [], p.entita_impattate ?? [], p.prossima_mossa ?? ""])
);

table(
  "Buchi Di Rotte E Risorse",
  ["Nota", "Problema", "Stato"],
  [
    ...routes.where(p => !hasLinks(p.rischi)).map(p => [p.file.link, "rotta senza rischio", p.stato_rotta ?? p.stato ?? ""]).array(),
    ...routes.where(p => !hasLinks(p.fazioni_controllanti) && !hasLinks(p.fazioni)).map(p => [p.file.link, "rotta senza controllore", p.stato_rotta ?? p.stato ?? ""]).array(),
    ...routes.where(p => !hasLinks(p.risorse_trasportate) && !hasLinks(p.risorse)).map(p => [p.file.link, "rotta senza risorse", p.stato_rotta ?? p.stato ?? ""]).array(),
    ...resources.where(p => !hasLinks(p.luoghi) && !hasLinks(p.regioni)).map(p => [p.file.link, "risorsa senza luogo", p.stato ?? ""]).array(),
    ...resources.where(p => !hasLinks(p.fazioni_controllanti) && !hasLinks(p.fazioni)).map(p => [p.file.link, "risorsa senza controllore", p.stato ?? ""]).array(),
    ...resources.where(p => !has(p.uso_narrativo) && !hasLinks(p.usi)).map(p => [p.file.link, "risorsa senza uso narrativo", p.stato ?? ""]).array()
  ].slice(0, 50),
  "Nessun buco economico evidente con i filtri correnti."
);
```
