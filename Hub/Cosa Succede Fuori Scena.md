---
cssclasses:
  - dashboard
  - gdr-offscreen-dashboard
categoria: risorsa
tipo: dashboard fuori scena
stato: pronto
mondo_attivo: ""
campagne_attive: []
---

# Cosa Succede Fuori Scena

> [!timer] Motore Fuori Scena
> Questa vista mostra cosa si muove quando i personaggi non intervengono: fazioni, PNG, missioni, clock, segreti e conseguenze aperte. Usala dopo la sessione e prima della preparazione.

> [!scena] Filtro
> Mondo: `INPUT[mondo][:mondo_attivo]`
>
> Campagne: `INPUT[campagne][:campagne_attive]`

> [!regia] Superfici Collegate
> `BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`
>
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> `BUTTON[stato-campagna-mondi-stato-del-mondo]`
>
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`

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
  return !direct.length && (!sessions.length || sessions.some(session => [...asArray(session.campagne), ...asArray(session.campagna)].some(link => campaigns.has(gdr.linkKey(link)))));
};
const pages = (source, predicate = () => true) => dv.pages(source).where(p => real(p) && matchesWorld(p) && matchesCampaign(p) && predicate(p));
const progressText = p => {
  const value = Math.max(0, Number(p.progress_value ?? 0));
  const max = Math.max(1, Number(p.progress_max ?? 6));
  return `${Math.min(value, max)}/${max}`;
};
const urgency = p => {
  const pressure = Number(p.pressione ?? 0);
  const value = Number(p.progress_value ?? 0);
  const max = Math.max(1, Number(p.progress_max ?? 6));
  return pressure * 10 + Math.round((value / max) * 10);
};
const table = (title, columns, rows, empty = "Nessun elemento da mostrare.") => {
  dv.header(2, title);
  if (!rows.length) dv.paragraph(empty);
  else dv.table(columns, rows);
};

const offscreenActors = pages('"Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Personaggi" OR "Mondi/Conflitti"', p =>
  Number(p.pressione ?? 0) >= 5 || has(p.prossima_mossa) || has(p.innesco) || hasLinks(p.conseguenze)
);
const urgentTracks = pages('"Mondi/Tracciati" OR "Mondi/Missioni" OR "Mondi/Conflitti"', p => {
  const value = Number(p.progress_value ?? 0);
  const max = Math.max(1, Number(p.progress_max ?? 6));
  return !["completato", "fallito", "completata", "fallita"].includes(String(p.stato ?? "")) && (Number(p.pressione ?? 0) >= 5 || value / max >= 0.5);
});
const unpropagated = pages('"Mondi" OR "Inbox"', p =>
  (hasLinks(p.conseguenze) || hasLinks(p.entita_impattate) || hasLinks(p.propaga_a) || has(p.prossima_mossa))
  && (
    (!hasLinks(p.entita_impattate) && !hasLinks(p.propaga_a) && !hasLinks(p.applicata_a))
    || !has(p.prossima_mossa)
    || !["applicata", "propagata", "canonizzata"].includes(String(p.propagazione_stato ?? ""))
  )
);
const revealableSecrets = pages('"Mondi" OR "Inbox"', p =>
  hasLinks(p.segreti_rivelabili) || hasLinks(p.segreti) || has(p.segreto) || String(p.stato_canonico ?? "") === "segreto"
);

const stats = [
  ["Attori in moto", offscreenActors.length, "Hanno pressione o prossima mossa"],
  ["Clock urgenti", urgentTracks.length, "Pressione alta o oltre meta"],
  ["Propagazioni aperte", unpropagated.length, "Conseguenze incomplete"],
  ["Segreti rivelabili", revealableSecrets.length, "Materiale da portare al tavolo"]
];
const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
grid.innerHTML = stats.map(([label, value, hint]) => `
  <div class="gdr-stat-card">
    <div class="gdr-stat-value">${gdr.escapeHtml(value)}</div>
    <div class="gdr-stat-label">${gdr.escapeHtml(label)}</div>
    <div class="gdr-stat-hint">${gdr.escapeHtml(hint)}</div>
  </div>
`).join("");

dv.header(2, "Coda Continuita M6");
gdr.renderContinuityGaps(dv, '"Mondi" OR "Inbox"', 24);

dv.header(2, "Bersagli Da Aggiornare");
gdr.renderPropagationTargets(dv, '"Mondi"', 24);

dv.header(2, "Chiudibili Oggi");
gdr.renderClosableContinuity(dv, '"Mondi" OR "Inbox"', 16);

table(
  "Prossime Mosse Fuori Scena",
  ["Nota", "Tipo", "Stato", "Pressione", "Innesco", "Prossima mossa", "Conseguenze"],
  offscreenActors
    .sort(p => urgency(p), "desc")
    .limit(24)
    .map(p => [p.file.link, p.categoria ?? p.tipo ?? "", p.stato ?? "", p.pressione ?? "", p.innesco ?? "", p.prossima_mossa ?? "", p.conseguenze ?? []])
    .array()
);

table(
  "Clock E Missioni Urgenti",
  ["Nota", "Tipo", "Stato", "Avanzamento", "Pressione", "Scadenza", "Innesco", "Prossima mossa"],
  urgentTracks
    .sort(p => urgency(p), "desc")
    .limit(24)
    .map(p => [p.file.link, p.tipo ?? p.categoria ?? "", p.stato ?? "", progressText(p), p.pressione ?? "", p.scadenza_mondo ?? "", p.innesco ?? "", p.prossima_mossa ?? ""])
    .array()
);

table(
  "Conseguenze Non Propagate",
  ["Origine", "Tipo", "Stato", "Propagazione", "Entita impattate", "Propaga a", "Conseguenze", "Prossima mossa"],
  unpropagated
    .sort(p => Number(p.pressione ?? 0), "desc")
    .sort(p => p.file.mtime, "desc")
    .limit(32)
    .map(p => [p.file.link, p.categoria ?? p.tipo ?? "", p.stato ?? p.stato_canonico ?? "", p.propagazione_stato ?? "aperta", p.entita_impattate ?? [], p.propaga_a ?? [], p.conseguenze ?? [], p.prossima_mossa ?? ""])
    .array(),
  "Nessuna conseguenza aperta evidente."
);

table(
  "Segreti Rivelabili Da Collegare",
  ["Nota", "Tipo", "Canone", "Segreto", "Segreti", "Missioni", "Indizi", "Prossima mossa"],
  revealableSecrets
    .where(p => !hasLinks(p.missioni) || (!hasLinks(p.indizi) && !hasLinks(p.collegamenti) && !hasLinks(p.entita_impattate)))
    .sort(p => p.file.mtime, "desc")
    .limit(24)
    .map(p => [p.file.link, p.categoria ?? p.tipo ?? "", p.stato_canonico ?? "", p.segreto ?? "", p.segreti ?? p.segreti_rivelabili ?? [], p.missioni ?? [], p.indizi ?? p.collegamenti ?? [], p.prossima_mossa ?? ""])
    .array(),
  "Nessun segreto scollegato evidente."
);

table(
  "Missioni Ignorate O In Stallo",
  ["Missione", "Stato", "Avanzamento", "Pressione", "Scadenza", "Fazioni", "Conseguenze", "Prossima mossa"],
  pages('"Mondi/Missioni"', p => ["proposta", "accettata", "in corso"].includes(String(p.stato ?? "")) && (Number(p.pressione ?? 0) > 0 || has(p.scadenza_mondo) || hasLinks(p.conseguenze)))
    .sort(p => urgency(p), "desc")
    .limit(20)
    .map(p => [p.file.link, p.stato ?? "", progressText(p), p.pressione ?? "", p.scadenza_mondo ?? "", p.fazioni ?? [], p.conseguenze ?? [], p.prossima_mossa ?? ""])
    .array()
);
```
