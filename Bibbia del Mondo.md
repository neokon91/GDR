---
cssclasses:
  - dashboard
  - gdr-world-bible
categoria: risorsa
tipo: bibbia del mondo
stato: pronto
mondo_attivo:
---

# Bibbia Del Mondo

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`

```meta-bind-button
label: Nuovo Mondo
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Mondo.md"
    folderPath: "Mondi"
    open: true
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const worlds = dv.pages('"Mondi"')
  .where(p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
  .where(p => !world || p.file.path === world)
  .sort(p => p.file.name, "asc");

if (!worlds.length) {
  dv.paragraph("Seleziona o crea un mondo.");
} else {
  dv.table(
    ["Mondo", "Tono", "Tema", "Promessa", "Temi", "Limiti", "Ispirazioni"],
    worlds.map(p => [p.file.link, p.tono ?? "", p.tema ?? "", p.premessa ?? "", p.temi ?? [], p.limiti ?? [], p.ispirazioni ?? []])
  );
}
```

## Verità, Rumor E Domande

```dataview
TABLE verita, rumor_attivi, domande_aperte, tensioni
FROM "Mondi"
WHERE categoria = "mondo" AND stato != "archiviata" AND (!this.mondo_attivo OR file.link = this.mondo_attivo)
SORT nome ASC
```

## Promesse Narrative

```dataview
TABLE promesse_narrative, non_vogliamo, domande_guida
FROM "Mondi"
WHERE categoria = "mondo" AND stato != "archiviata" AND (!this.mondo_attivo OR file.link = this.mondo_attivo)
SORT nome ASC
```
