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

<!-- workflow:quick_actions:start compendium_mondo -->
> [!regia] Azioni rapide
> Creare elementi originali del mondo e collegarli a culture, risorse, missioni o storia.
>
> **Nuovo elemento** - vuoi creare materiale originale non-SRD con uso narrativo
> `BUTTON[nuovo-elemento-z-modelli-worldbuilding-compendium-del-mondo-md]`
>
> **Lore hub** - devi collegare l'elemento a segnali, misteri o canone
> `BUTTON[lore-hub-lore-hub]`
>
> [!regia]- Collega al gioco
> Evitare elementi decorativi senza impatto.
>
> **Nuova risorsa** - l'elemento e merce, dipendenza o leva economica
> `BUTTON[nuova-risorsa-z-modelli-worldbuilding-risorsa-md]`
>
> **Nuova cultura** - l'elemento definisce pratiche, tabu o identita
> `BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`
>
> **Nuovo mistero** - l'elemento deve essere scoperto gradualmente
> `BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`
>
> **Nuova missione** - l'elemento genera obiettivo, rischio o ricompensa
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
<!-- workflow:quick_actions:end compendium_mondo -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "compendium_mondo", { mode: "simple" });
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
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
WHERE file.name != "Compendium" AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, file.name ASC
```

tab: Senza Uso

```dataview
TABLE tipo, culture, regioni, risorse, fazioni, missioni
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND stato != "archiviata" AND (!uso_narrativo AND (!missioni OR length(missioni) = 0)) AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT tipo ASC, file.name ASC
```

tab: Collegamenti Storici

```dataview
TABLE tipo, eventi_storici, conseguenze, segreti
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND stato != "archiviata" AND (eventi_storici OR eventi OR conseguenze OR segreti) AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
```
````
