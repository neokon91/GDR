---
cssclasses:
  - dashboard
  - gdr-world-bible
categoria: risorsa
tipo: codex mondo
stato: pronto
mondo_attivo: ""
---

# Codex Del Mondo

> [!scena] World Anvil locale
> Qui consulti il mondo come prodotto: gancio, tono, conflitto, luoghi, fazioni, misteri e articoli collegati. Se devi creare un mondo, compila prima i 6 campi del template.

Mondo:
`INPUT[mondo][:mondo_attivo]`

`BUTTON[nuovo-mondo-homebrew]`

`BUTTON[atlante-del-mondo-atlante-del-mondo]`

## Identità

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const worldPath = gdr.linkKey(dv.current().mondo_attivo);
const worlds = dv.pages('"Mondi"')
  .where(p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
  .where(p => !worldPath || p.file.path === worldPath)
  .sort(p => p.file.name, "asc")
  .array();

if (!worlds.length) {
  dv.paragraph("Seleziona o crea un mondo.");
} else {
  const esc = gdr.escapeHtml;
  const fmt = value => Array.isArray(value)
    ? value.map(item => item?.path ? item.path.split("/").pop().replace(/\.md$/, "") : String(item ?? "")).filter(Boolean).join(", ")
    : value?.path ? value.path.split("/").pop().replace(/\.md$/, "") : String(value ?? "");
  const grid = dv.el("div", "", { cls: "gdr-card-grid" });
  grid.innerHTML = worlds.map(p => `
    <div class="gdr-info-card gdr-kind-mondo">
      <div class="gdr-card-title">${gdr.internalLink(p.file)}</div>
      <div class="gdr-card-meta">${esc([p.tono, p.tema, p.stato].filter(Boolean).join(" · "))}</div>
      <div class="gdr-card-line"><strong>Gancio:</strong> ${esc(p.gancio ?? p.premessa ?? "")}</div>
      <div class="gdr-card-line"><strong>Conflitto:</strong> ${esc(p.conflitto_centrale ?? "")}</div>
      <div class="gdr-card-line"><strong>Luoghi:</strong> ${esc(fmt(p.luoghi_iconici))}</div>
      <div class="gdr-card-line"><strong>Fazioni:</strong> ${esc(fmt(p.fazioni_principali))}</div>
      <div class="gdr-card-line"><strong>Misteri:</strong> ${esc(fmt(p.misteri_pubblici))}</div>
    </div>
  `).join("");
}

dv.header(2, "Articoli Del Mondo");
gdr.renderCodexEditorial(dv, dv.current().mondo_attivo);

dv.header(2, "Pronti Da Mostrare");
gdr.renderCodexReadyShowcase(dv, dv.current().mondo_attivo);

dv.header(2, "Pronti Da Giocare");
gdr.renderCodexReadyToPlay(dv, dv.current().mondo_attivo);

dv.header(2, "Buchi Del Codex");
const codexWorldPath = gdr.linkKey(dv.current().mondo_attivo);
const has = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const rows = [];
dv.pages('"Mondi"')
  .where(p => gdr.isReal(p) && p.categoria === "mondo" && p.stato !== "archiviata")
  .where(p => !codexWorldPath || p.file.path === codexWorldPath)
  .forEach(p => {
    [
      ["gancio", p.gancio ?? p.premessa],
      ["tono", p.tono],
      ["conflitto centrale", p.conflitto_centrale],
      ["luoghi iconici", p.luoghi_iconici],
      ["fazioni principali", p.fazioni_principali],
      ["misteri pubblici", p.misteri_pubblici]
    ].forEach(([label, value]) => {
      if (!has(value)) rows.push([p.file.link, label]);
    });
  });

dv.pages('"Mondi/Luoghi" OR "Mondi/Fazioni" OR "Mondi/Personaggi" OR "Mondi/Culture" OR "Mondi/Religioni" OR "Mondi/Timeline"')
  .where(p => gdr.isReal(p) && p.stato !== "archiviata")
  .where(p => !codexWorldPath || gdr.linkKey(p.mondo) === codexWorldPath)
  .forEach(p => {
    const title = p.file.link;
    const links = [
      ...(Array.isArray(p.luoghi) ? p.luoghi : []),
      ...(Array.isArray(p.fazioni) ? p.fazioni : []),
      ...(Array.isArray(p.personaggi) ? p.personaggi : []),
      ...(Array.isArray(p.missioni) ? p.missioni : []),
      ...(Array.isArray(p.sessioni) ? p.sessioni : []),
      ...(Array.isArray(p.connessioni) ? p.connessioni : [])
    ];
    if (!has(p.gancio) && !has(p.impressione) && !has(p.vuole) && !has(p.obiettivo) && !has(p.causa)) rows.push([title, "senza gancio o uso narrativo"]);
    if (!links.length && p.categoria !== "mondo") rows.push([title, "senza collegamenti operativi"]);
    if (!has(p.uso_al_tavolo) && !has(p.promessa_al_tavolo) && !has(p.prossima_mossa) && !has(p.scene)) rows.push([title, "senza uso al tavolo"]);
  });

if (!rows.length) dv.paragraph("Codex essenziale completo.");
else dv.table(["Mondo", "Manca"], rows);
```
