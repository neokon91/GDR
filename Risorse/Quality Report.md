---
cssclasses:
  - dashboard
  - gdr-quality-report
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Quality Report

Report visuale per capire cosa rende il vault pronto da giocare, da condividere e da mostrare in screenshot.

<!-- workflow:quick_actions:start quality_report -->
> [!regia] Azioni rapide
> Capire quali buchi rendono il vault meno giocabile, condivisibile o player-safe.
>
> **Controllo vault** - vuoi passare dal report visuale alla coda operativa
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> **Vista giocatori** - devi verificare materiale mostrabile senza segreti DM
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> **Atlante del mondo** - vuoi controllare copertura di luoghi, mappe e coordinate
> `BUTTON[atlante-del-mondo-atlante-del-mondo]`
>
> [!regia]- Correzione rapida
> Aprire le superfici dove i buchi del report diventano lavoro concreto.
>
> **Worldbuilder** - mancano collegamenti o fondamenta di mondo
> `BUTTON[worldbuilder-worldbuilder-dashboard]`
>
> **Stato campagna** - il problema riguarda pressioni, missioni o conseguenze
> `BUTTON[stato-campagna-mondi-stato-del-mondo]`
>
> **Smista bozze** - il problema deriva da materiale generato non deciso
> `BUTTON[smistamento-bozze-generate-risorse-smistamento-bozze-generate-2]`
<!-- workflow:quick_actions:end quality_report -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "quality_report");
```

## Copertura

```dataviewjs
const count = (source, pred = () => true) => dv.pages(source).where(p => p.stato !== "archiviata" && pred(p)).length;
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const cards = [
  ["Mondi", count('"Mondi"', p => p.categoria === "mondo"), "ambientazioni"],
  ["Luoghi", count('"Mondi/Luoghi"'), "geografia giocabile"],
  ["PNG", count('"Mondi/Personaggi"', p => p.tipo === "png"), "personaggi non giocanti"],
  ["Missioni", count('"Mondi/Missioni"'), "obiettivi e archi"],
  ["Sessioni", count('"Mondi/Sessioni"'), "preparazione e diario"],
  ["Mappe", count('"Risorse/Mappe"'), "asset e atlanti"],
  ["Pubblico", count('"Mondi" OR "Risorse/Mappe"', p => p.pubblico === true), "condivisibile"],
  ["Pressioni", count('"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni" OR "Mondi/Conflitti"', p => Number(p.pressione ?? 0) > 0), "mondo vivo"]
];
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = cards.map(([label, value, hint]) => `<div class="gdr-stat-card"><div class="gdr-stat-value">${esc(value)}</div><div class="gdr-stat-label">${esc(label)}</div><div class="gdr-stat-hint">${esc(hint)}</div></div>`).join("");
```

## Buchi Operativi

```dataviewjs
const hasText = v => String(v ?? "").trim().length > 0;
const hasLinks = v => dv.array(v ?? []).length > 0;
const rows = [];
const real = p => p.stato !== "archiviata";
const add = (source, label, pred) => dv.pages(source).where(p => real(p) && pred(p)).forEach(p => rows.push([p.file.link, label, p.stato ?? ""]));
add('"Mondi/Personaggi"', "PNG senza scena/luogo", p => p.tipo === "png" && !hasText(p.luogo) && !hasLinks(p.luoghi) && !hasText(p.ruolo));
add('"Mondi/Luoghi"', "Luogo senza mappa o parent", p => !hasLinks(p.mappe) && !hasText(p.luogo_padre) && p.tipo !== "continente");
add('"Mondi/Missioni"', "Missione senza conseguenze", p => !hasLinks(p.conseguenze) && !hasText(p.prossima_mossa));
add('"Mondi/Sessioni"', "Sessione senza obiettivo", p => !hasText(p.obiettivo));
add('"Risorse/Mappe"', "Mappa non collegata", p => p.file.name !== "Mappe" && !hasLinks(p.luoghi) && !hasText(p.luogo) && !hasText(p.mondo));
add('"Mondi/Fazioni"', "Fazione senza pressione", p => !hasText(p.prossima_mossa) && Number(p.pressione ?? 0) === 0);
if (!rows.length) dv.paragraph("Nessun buco operativo evidente.");
else dv.table(["Nota", "Problema", "Stato"], rows.slice(0, 40));
```

## Pubblicazione Giocatori

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPublicSafety(dv);
```

## Materiale Screenshot-Ready

```dataview
TABLE tipo, uso, pubblico, stato, mondo, luogo
FROM "Risorse/Mappe" OR "Mondi/Dispense" OR "Campagne" OR "Hub"
SORT pubblico DESC, file.name ASC
LIMIT 30
```
