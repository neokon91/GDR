---
cssclasses:
  - dashboard
  - gdr-compendium-dashboard
categoria: risorsa
tipo: compendium mondo
stato: pronto
mondo_attivo: ""
---

# Compendium Del Mondo

> [!scena] Originale, non-SRD
> Materiali, piante, malattie, monete, tecnologie, cibi, superstizioni, professioni e creature regionali vanno trattati come elementi di ambientazione: devono collegarsi a culture, regioni, risorse, fazioni, missioni ed eventi storici.

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

`BUTTON[nuovo-elemento-z-modelli-worldbuilding-compendium-del-mondo-md]`

`BUTTON[lore-hub-lore-hub]`

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const real = p => gdr.isReal(p) && p.stato !== "archiviata";
const matchesWorld = p => !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
const pages = dv.pages('"Mondi/Compendium"').where(p => real(p) && p.file.name !== "Compendium" && matchesWorld(p));
const types = ["materiale", "pianta", "malattia", "moneta", "tecnologia", "cibo", "superstizione", "professione", "creatura regionale"];
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = types.map(type => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${pages.where(p => p.tipo === type).length}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(type)}</div>
    <div class="gdr-stat-hint">Elementi originali</div>
  </div>
`).join("");
```

````tabs
tab: Archivio

```dataview
TABLE tipo, culture, regioni, risorse, fazioni, missioni, uso_narrativo
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, file.name ASC
```

tab: Senza Uso

```dataview
TABLE tipo, culture, regioni, risorse, fazioni, missioni
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (!uso_narrativo AND (!missioni OR length(missioni) = 0)) AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, file.name ASC
```

tab: Collegamenti Storici

```dataview
TABLE tipo, eventi_storici, conseguenze, segreti
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (eventi_storici OR eventi OR conseguenze OR segreti) AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
```
````
