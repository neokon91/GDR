---
cssclasses:
  - indice
categoria: risorsa
tipo: stato mondo
stato: pronto
mondo_attivo:
campagne_attive: []
---

# Stato Campagna

Questa vista raccoglie cio che deve influenzare il tavolo: missioni aperte, fazioni sotto pressione, clock attivi, PNG mossi fuori scena, conseguenze recenti e lore da rendere canonica.

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`
>
> Campagne:
> `INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial)):campagne_attive]`

```meta-bind-button
label: Durante Il Gioco
style: primary
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

```meta-bind-button
label: Timeline
style: primary
actions:
  - type: open
    link: "[[Mondi/Timeline/Timeline]]"
```

```meta-bind-button
label: Worldbuilder
style: primary
actions:
  - type: open
    link: "[[Worldbuilder Dashboard]]"
```

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
const current = dv.current();
const world = gdr.linkKey(current.mondo_attivo);
const campaigns = new Set(dv.array(current.campagne_attive ?? []).map(gdr.linkKey).array());
const real = p => gdr.isReal(p) && p.stato !== "archiviata" && p.stato !== "ignorata";
const asArray = value => dv.array(value ?? []).array();
const hasValue = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const hasLinks = value => asArray(value).length > 0;
const matchesAny = (value, set) => asArray(value).some(link => set.has(gdr.linkKey(link)));
const linkedPages = value => asArray(value).map(link => dv.page(gdr.linkKey(link))).filter(Boolean);

function matchesWorld(p) {
  return !world || gdr.linkKey(p.mondo) === world || p.file.path === world;
}

function matchesCampaign(p) {
  if (!campaigns.size) return true;
  if (hasLinks(p.campagne) || hasLinks(p.campagna) || hasLinks(p.campagne_attive)) {
    return matchesAny(p.campagne, campaigns) || matchesAny(p.campagna, campaigns) || matchesAny(p.campagne_attive, campaigns);
  }
  const sessions = linkedPages(p.sessioni);
  if (sessions.length) {
    return sessions.some(session => matchesAny(session.campagne, campaigns) || matchesAny(session.campagna, campaigns));
  }
  return true;
}

function pages(source, predicate = () => true) {
  return dv.pages(source).where(p => real(p) && matchesWorld(p) && matchesCampaign(p) && predicate(p));
}

function table(title, columns, rows, empty = "Nessun elemento da mostrare.") {
  dv.header(2, title);
  if (!rows.length) {
    dv.paragraph(empty);
  } else {
    dv.table(columns, rows);
  }
}

function issueRows(source, checks) {
  return pages(source).array().flatMap(p => checks
    .filter(check => check.test(p))
    .map(check => [p.file.link, check.label, p.mondo ?? "", p.stato ?? ""])
  );
}

function progressText(p) {
  const value = Math.max(0, Number(p.progress_value ?? 0));
  const max = Math.max(1, Number(p.progress_max ?? 6));
  return `${Math.min(value, max)}/${max}`;
}

table(
  "Missioni Aperte",
  ["Missione", "Stato", "Avanzamento", "Pressione", "Scadenza", "Prossima mossa", "Fazioni"],
  pages('"Mondi/Missioni"', p => ["proposta", "accettata", "in corso", "pronto"].includes(p.stato))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(16)
    .map(p => [p.file.link, p.stato ?? "", progressText(p), p.pressione ?? "", p.scadenza_mondo ?? "", p.prossima_mossa ?? "", p.fazioni ?? []])
    .array()
);

table(
  "Clock E Progress Track Attivi",
  ["Tracciato", "Tipo", "Stato", "Avanzamento", "Pressione", "Innesco", "Prossima mossa", "Collegamenti"],
  pages('"Mondi/Tracciati"', p => !["archiviata", "completato", "fallito"].includes(p.stato))
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(20)
    .map(p => [p.file.link, p.tipo ?? "", p.stato ?? "", progressText(p), p.pressione ?? "", p.innesco ?? "", p.prossima_mossa ?? "", [...asArray(p.missioni), ...asArray(p.fazioni), ...asArray(p.luoghi)]])
    .array()
);

table(
  "PNG Mossi Fuori Scena",
  ["PNG", "Stato", "Luogo", "Fazioni", "Prossima mossa", "Missioni", "Relazioni"],
  pages('"Mondi/Personaggi"', p => p.tipo === "png" && (hasValue(p.prossima_mossa) || ["scomparso", "ostile", "morto", "in gioco"].includes(String(p.stato ?? ""))))
    .sort(p => p.file.mtime, "desc")
    .limit(16)
    .map(p => [p.file.link, p.stato ?? "", p.luogo ?? "", p.fazioni ?? [], p.prossima_mossa ?? "", p.missioni ?? [], p.relazioni ?? []])
    .array()
);

table(
  "Eventi Canonici Recenti",
  ["Evento", "Data mondo", "Stato", "Sessioni", "Collegamenti", "Impatto"],
  pages('"Inbox" OR "Mondi/Timeline"', p =>
    ["lore capture", "evento storico"].includes(p.categoria)
    && (p.canonico === true || p.stato === "canonica" || p.stato_canonico === "canonico")
  )
    .sort(p => p.file.mtime, "desc")
    .limit(20)
    .map(p => [p.file.link, p.data_mondo ?? "", p.stato_canonico ?? p.stato ?? "", p.sessioni ?? [], p.collegamenti ?? p.luoghi ?? [], p.impatto ?? p.conseguenze ?? []])
    .array()
);

table(
  "Atlante Del Mondo",
  ["Luogo", "Tipo", "Mondo", "Padre", "Fazioni", "Pericolo", "Stabilita", "Pressione"],
  pages('"Mondi/Luoghi"', p => p.file.name !== "Luoghi")
    .sort(p => p.tipo ?? "", "asc")
    .limit(24)
    .map(p => [p.file.link, p.tipo ?? "", p.mondo ?? "", p.luogo_padre ?? "", p.fazioni ?? [], p.pericolo ?? "", p.stabilita ?? "", p.pressione ?? ""])
    .array()
);

table(
  "Poteri In Movimento",
  ["Fazione", "Tipo", "Pressione", "Prossima mossa", "Leader", "Rivali", "Luoghi", "Missioni"],
  pages('"Mondi/Fazioni" OR "Mondi/Religioni"', p => p.file.name !== "Fazioni" && p.file.name !== "Religioni")
    .sort(p => Number(p.pressione ?? 0), "desc")
    .limit(24)
    .map(p => [p.file.link, p.tipo ?? "", p.pressione ?? "", p.prossima_mossa ?? "", p.leader ?? [], p.rivali ?? [], p.luoghi ?? [], p.missioni ?? []])
    .array()
);

table(
  "Relazioni PNG",
  ["PNG", "Luogo", "Fazioni", "Atteggiamento", "Relazioni", "Segreto", "Prossima mossa"],
  pages('"Mondi/Personaggi"', p => p.tipo === "png")
    .sort(p => p.stato ?? "", "asc")
    .limit(24)
    .map(p => [p.file.link, p.luogo ?? "", p.fazioni ?? [], p.atteggiamento ?? "", p.relazioni ?? [], p.segreto ?? p.segreti ?? "", p.prossima_mossa ?? ""])
    .array()
);

table(
  "Timeline Causale",
  ["Evento", "Data mondo", "Causa", "Conseguenze", "Luoghi", "Fazioni", "Missioni"],
  pages('"Mondi/Timeline"', p => p.file.name !== "Timeline")
    .sort(p => p.data_mondo ?? p.file.name, "asc")
    .limit(24)
    .map(p => [p.file.link, p.data_mondo ?? "", p.causa ?? p.cause ?? "", p.conseguenze ?? [], p.luoghi ?? [], p.fazioni ?? [], p.missioni ?? []])
    .array()
);

table(
  "Conseguenze Aperte",
  ["Lore", "Tipo", "Data mondo", "Stato", "Collegamenti", "Impatto", "Azioni"],
  pages('"Inbox"', p => p.categoria === "lore capture")
    .sort(p => p.file.mtime, "desc")
    .limit(20)
    .map(p => [p.file.link, p.tipo ?? "", p.data_mondo ?? "", p.stato ?? "", p.collegamenti ?? [], p.impatto ?? [], p.azioni ?? []])
    .array()
);

const worldChecks = [
  ...issueRows('"Mondi"', [
    { label: "mondo senza tono", test: p => p.categoria === "mondo" && !hasValue(p.tono) },
    { label: "mondo senza tema", test: p => p.categoria === "mondo" && !hasValue(p.tema) },
    { label: "mondo senza fazioni", test: p => p.categoria === "mondo" && !hasLinks(p.fazioni) }
  ]),
  ...issueRows('"Mondi/Luoghi"', [
    { label: "luogo senza mondo", test: p => !hasValue(p.mondo) },
    { label: "luogo senza padre", test: p => !["continente", "isola", "regione", "regione naturale", "regno", "impero"].includes(String(p.tipo ?? "")) && !hasValue(p.luogo_padre) },
    { label: "luogo senza fazioni", test: p => !hasLinks(p.fazioni) },
    { label: "luogo pronto senza pericolo", test: p => p.stato === "pronto" && !hasValue(p.pericolo) },
    { label: "luogo pronto senza stabilita", test: p => p.stato === "pronto" && !hasValue(p.stabilita) },
    { label: "luogo pronto senza pressione", test: p => p.stato === "pronto" && !hasValue(p.pressione) }
  ]),
  ...issueRows('"Mondi/Fazioni" OR "Mondi/Religioni"', [
    { label: "pressione senza prossima_mossa", test: p => Number(p.pressione ?? 0) > 0 && !hasValue(p.prossima_mossa) },
    { label: "fazione senza leader", test: p => !hasLinks(p.leader) && !hasValue(p.divinita) },
    { label: "fazione senza luoghi", test: p => !hasLinks(p.luoghi) },
    { label: "fazione senza obiettivo o pressione", test: p => !hasValue(p.obiettivo) && !hasValue(p.pressione) }
  ]),
  ...issueRows('"Mondi/Missioni"', [
    { label: "missione senza fazioni", test: p => !hasLinks(p.fazioni) }
  ]),
  ...issueRows('"Mondi/Tracciati"', [
    { label: "tracciato senza innesco", test: p => p.categoria === "tracciato" && !hasValue(p.innesco) },
    { label: "tracciato senza prossima_mossa", test: p => p.categoria === "tracciato" && !hasValue(p.prossima_mossa) },
    { label: "tracciato senza collegamenti", test: p => p.categoria === "tracciato" && !hasLinks(p.missioni) && !hasLinks(p.fazioni) && !hasLinks(p.luoghi) }
  ]),
  ...issueRows('"Mondi/Timeline"', [
    { label: "evento canonico senza conseguenze", test: p => (p.canonico === true || p.stato_canonico === "canonico") && !hasLinks(p.conseguenze) },
    { label: "conseguenza aperta senza collegamenti", test: p => p.tipo === "conseguenza" && !hasLinks(p.luoghi) && !hasLinks(p.fazioni) && !hasLinks(p.missioni) }
  ]),
  ...issueRows('"Mondi/Personaggi"', [
    { label: "PNG in gioco senza luogo", test: p => p.tipo === "png" && p.stato === "in gioco" && !hasValue(p.luogo) },
    { label: "PNG senza fazione o relazione", test: p => p.tipo === "png" && !hasLinks(p.fazioni) && !hasLinks(p.relazioni) },
    { label: "PNG con segreto non collegato a missioni/eventi", test: p => p.tipo === "png" && (hasValue(p.segreto) || hasLinks(p.segreti)) && !hasLinks(p.missioni) && !hasLinks(p.eventi) }
  ]),
  ...issueRows('"Inbox"', [
    { label: "lore canonica non storicizzata", test: p => p.categoria === "lore capture" && (p.canonico === true || p.stato === "canonica") && !hasValue(p.timeline) },
    { label: "lore vecchia da smistare o non collegata", test: p => p.categoria === "lore capture" && (p.stato === "da smistare" || !hasLinks(p.collegamenti)) }
  ])
];

table(
  "Buchi Di Mondo",
  ["Nota", "Problema", "Mondo", "Stato"],
  worldChecks.slice(0, 32),
  "Nessun buco pratico evidente con i filtri correnti."
);
```
