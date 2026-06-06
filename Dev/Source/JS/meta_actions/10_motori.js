// --- Motori del MONDO VIVO: cascata (B) + giro del mondo (A) ----------------------
// Finora i Fronti si muovevano solo a mano (avanza +1, scatena). Questi due motori li
// fanno MUOVERE da sé: una conseguenza si propaga lungo le relazioni di tensione (cascata),
// e un'azione avanza TUTTI i Fronti di un passo in proporzione al loro calore (giro del
// mondo). Scrivono stato (clock/pressione/eventi) ma producono un DIGEST e lasciano i nuovi
// eventi in bozza: il GM rivede, non subisce (autonomia + agency).

// Relazioni che PORTANO TENSIONE: lungo queste una conseguenza si fa sentire (bersaglio,
// confini, rivalità, alleanze, controllo). NON tutte (si spargerebbe ovunque, perdendo senso).
const TENSION_FIELDS = ["conseguenza_su", "confina_con", "rivali", "alleati", "controllata_da", "fazioni"];

// Quanto avanza il clock di un Fronte in un GIRO DEL MONDO, dal suo CALORE (pressione):
// Crisi (≥7) → +2, Tensione (4-6) → +1, Calma (<4) → 0. La pressione = quanto scotta = quanto
// in fretta brucia (coerente con la dottrina pressione/clock). Pura/testabile.
function avanzamentoDaPressione(pressione) {
  const p = Number(pressione) || 0;
  return p >= 7 ? 2 : p >= 4 ? 1 : 0;
}

// CASCATA — nucleo puro: da un Fronte sorgente propaga uno shock di pressione nel grafo in
// ampiezza (BFS), decadendo con la distanza (gradi[dist]). vicini(nome) → [{nome, via}] (i
// collegati risolti + l'etichetta-relazione). Ritorna Map(nome → {delta, via}). Cicli gestiti
// (seen): la sorgente non si auto-colpisce. Esposto per i test.
function propagaShock(sorgente, vicini, gradi) {
  const out = new Map();
  const seen = new Set([sorgente]);
  let frontiera = [{ nome: sorgente, dist: 0 }];
  while (frontiera.length) {
    const prossima = [];
    for (const { nome, dist } of frontiera) {
      if (dist >= gradi.length) continue;
      for (const v of (vicini(nome) || [])) {
        if (!v || !v.nome || seen.has(v.nome)) continue;
        seen.add(v.nome);
        out.set(v.nome, { delta: gradi[dist], via: v.via });
        prossima.push({ nome: v.nome, dist: dist + 1 });
      }
    }
    frontiera = prossima;
  }
  return out;
}

// CASCATA — wrapper I/O: costruisce i `vicini` dal grafo reale (metadataCache) e APPLICA gli
// shock (pressione += delta, cap 10) sui collegati. Ritorna il digest [{nome, da, a, via}].
async function cascata(file, fm, gradi) {
  const passi = gradi || [2, 1];
  const byName = new Map();
  for (const f of app.vault.getMarkdownFiles())
    byName.set(f.basename, { file: f, fm: app.metadataCache.getFileCache(f)?.frontmatter ?? {} });
  const vicini = (nome) => {
    const e = byName.get(nome);
    if (!e) return [];
    const out = [];
    for (const campo of TENSION_FIELDS) {
      const raw = e.fm[campo];
      const list = Array.isArray(raw) ? raw : (raw != null && raw !== "" ? [raw] : []);
      for (const link of list) {
        const n = linkName(link, e.file.path);
        if (n && n !== nome && byName.has(n)) out.push({ nome: n, via: campo });
      }
    }
    return out;
  };
  const shock = propagaShock(file.basename, vicini, passi);
  const digest = [];
  for (const [nome, info] of shock) {
    const e = byName.get(nome);
    if (!e) continue;
    let da = 0, a = 0;
    await updateFrontmatter(e.file, (f) => { da = Number(f.pressione) || 0; a = Math.min(10, da + info.delta); f.pressione = a; });
    if (a !== da) digest.push({ nome, da, a, via: info.via });
  }
  return digest;
}

// Crea l'EVENTO-conseguenza in bozza (la giocata → storia del mondo). Estratto da
// scatena_conseguenza per il riuso dal giro del mondo. Ritorna {title, path}.
async function creaEventoConseguenza(file, fm, core, when) {
  const fronte = file.basename;
  const folder = (core.folders ?? {})["evento"] ?? "Mondi/Eventi";
  await ensureFolder(folder);
  const title = `Conseguenza — ${fronte}`;
  let path = `${folder}/${title}.md`;
  for (let i = 2; app.vault.getAbstractFileByPath(path); i++) path = `${folder}/${title} (${i}).md`;
  const conseguenza = String(fm.conseguenza ?? "").trim();
  const su = fm.conseguenza_su ? String(fm.conseguenza_su) : "";
  const conn = [`"[[${fronte}]]"`, ...(su ? [JSON.stringify(su)] : [])].join(", ");
  const content = `---
nome: ${JSON.stringify(title)}
categoria: evento
tipo: conseguenza
mondo: ${fm.mondo ? JSON.stringify(String(fm.mondo)) : "''"}
quando: ${JSON.stringify(when)}
stato: bozza
connessioni: [${conn}]
tags: ["gdr/bozza"]
---
# ${title}

## Cosa accade
${conseguenza}

> Fronte d'origine: [[${fronte}]]${su ? `\n> Colpisce: ${su}` : ""}
`;
  await app.vault.create(path, content);
  return { title, path };
}

// GIRO DEL MONDO (A): avanza TUTTI i Fronti di un passo per calore (avanzamentoDaPressione).
// Due fasi: (1) calcola gli avanzamenti dallo stato PRE-giro — deterministico, le onde non
// ri-avanzano nello stesso giro; (2) applica — i clock che si RIEMPIONO scattano (evento in
// bozza + cascata + clock azzerato, ricorrente di default nel giro), i pieni SENZA conseguenza
// restano pieni e vengono segnalati. Scrive una cronaca «Giro del mondo — <data>» e la apre.
async function giro_del_mondo(tp) {
  const core = await loadCore();
  const when = tp.date ? tp.date.now("YYYY-MM-DD") : "";
  const fronti = app.vault.getMarkdownFiles()
    .map((f) => ({ f, fm: app.metadataCache.getFileCache(f)?.frontmatter ?? {} }))
    .filter((e) => Number(e.fm.clock_dim) > 0 && String(e.fm.stato ?? "") !== "archiviata");
  if (!fronti.length) { new Notice("Nessun Fronte attivo (imposta un clock) da far avanzare."); return ""; }
  // Fase 1 — calcola sullo stato pre-giro.
  const piani = [];
  for (const { f, fm } of fronti) {
    const adv = avanzamentoDaPressione(fm.pressione);
    const dim = Math.floor(Number(fm.clock_dim) || 0);
    const da = Math.max(0, Math.min(dim, Math.floor(Number(fm.clock) || 0)));
    const a = Math.min(dim, da + adv);
    // Scadenza (motore I): conto alla rovescia in GIRI; a 0 il Fronte scatta comunque, col
    // clock non pieno (la deadline è arrivata). Un Fronte con SOLA scadenza (clock fermo)
    // entra comunque nel giro per scalarla.
    const hasScad = fm.scadenza != null && Number.isFinite(Number(fm.scadenza));
    const scadA = hasScad ? Math.floor(Number(fm.scadenza)) - 1 : null;
    if (a === da && !hasScad) continue;   // niente avanzamento clock né deadline → fermo
    const scaduto = hasScad && scadA <= 0;
    piani.push({ f, fm, dim, da, a, scadA, scaduto, pieno: a >= dim || scaduto, haConseguenza: !!String(fm.conseguenza ?? "").trim() });
  }
  if (!piani.length) { new Notice("Nessun Fronte abbastanza caldo per avanzare (serve pressione ≥4)."); return ""; }
  // Fase 2 — applica.
  const avanzati = [], scattati = [], onde = [], sospesi = [];
  for (const p of piani) {
    const scatta = p.pieno && p.haConseguenza;
    await updateFrontmatter(p.f, (f) => {
      f.clock = scatta ? 0 : p.a;
      if (p.scadA != null) { if (scatta) delete f.scadenza; else f.scadenza = p.scadA; }
    });
    if (scatta) {
      const ev = await creaEventoConseguenza(p.f, p.fm, core, when);
      const d = await cascata(p.f, p.fm);
      scattati.push({ nome: p.f.basename, title: ev.title, perche: (p.scaduto && p.a < p.dim) ? "scadenza" : "clock" });
      for (const x of d) onde.push({ nome: x.nome, da: x.da, a: x.a, via: x.via, da_fronte: p.f.basename });
    } else if (p.pieno) {
      sospesi.push(p.f.basename);
    } else {
      avanzati.push({ nome: p.f.basename, da: p.da, a: p.a, dim: p.dim, scadA: p.scadA });
    }
  }
  // Cronaca: «cosa è cambiato nel mondo» (record rivedibile; i nuovi eventi sono in bozza).
  const R = [`# 📖 Giro del mondo — ${when}`, "",
    `> [!info] Un passo del mondo: **${avanzati.length}** avanzati · **${scattati.length}** scattati · **${onde.length}** onde di pressione.`, ""];
  if (scattati.length) { R.push("## 🔴 Scattati — conseguenza in bozza"); for (const s of scattati) R.push(`- [[${s.nome}]] → [[${s.title}]]${s.perche === "scadenza" ? " *(deadline scaduta)*" : ""}`); R.push(""); }
  if (avanzati.length) { R.push("## ⏳ Avanzati"); for (const a of avanzati) R.push(`- [[${a.nome}]] — clock ${a.da}→${a.a}/${a.dim}${a.scadA != null ? ` · scadenza ${Math.max(0, a.scadA)} giri` : ""}`); R.push(""); }
  if (onde.length) { R.push("## 🌊 Onde di pressione (cascata dal grafo)"); for (const o of onde) R.push(`- [[${o.nome}]] pressione ${o.da}→${o.a} *(da [[${o.da_fronte}]] · ${o.via})*`); R.push(""); }
  if (sospesi.length) { R.push("## ⚠️ Pieni senza conseguenza — scrivila, poi «Scatena conseguenza»"); for (const n of sospesi) R.push(`- [[${n}]]`); R.push(""); }
  const folder = "Mondi/Cronache";
  await ensureFolder(folder);
  let path = `${folder}/Giro del mondo — ${when}.md`;
  for (let i = 2; app.vault.getAbstractFileByPath(path); i++) path = `${folder}/Giro del mondo — ${when} (${i}).md`;
  await app.vault.create(path, R.join("\n"));
  new Notice(`Giro del mondo: ${avanzati.length} avanzati, ${scattati.length} scattati, ${onde.length} onde. Cronaca creata.`);
  try { await app.workspace.openLinkText(path, "", false); } catch (e) { /* opzionale */ }
  return "";
}

// Scatena la conseguenza di un fronte: crea l'EVENTO collegato (la giocata diventa storia),
// chiude o rilancia il fronte, e ne PROPAGA l'onda nel grafo (motore B, cascata).
async function scatena_conseguenza(tp, file) {
  const core = await loadCore();
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const conseguenza = String(fm.conseguenza ?? "").trim();
  if (!conseguenza) { new Notice("Nessuna conseguenza descritta su questo fronte."); return ""; }
  const fronte = file.basename;
  const when = tp.date ? tp.date.now("YYYY-MM-DD") : "";
  const { title } = await creaEventoConseguenza(file, fm, core, when);
  // Risolto o ricorrente? One-shot SI CHIUDE (archiviato → esce dai cruscotti, resta storia);
  // ciclico RIPARTE (clock azzerato). Default ricorrente (compat e su annullo).
  const opzioni = ["Ricorrente — riparte (clock azzerato)", "Risolto — si chiude (archiviato)"];
  const scelta = tp.system?.suggester
    ? await tp.system.suggester(opzioni, ["ricorrente", "risolto"], false, `«${fronte}» dopo la conseguenza è…`)
    : "ricorrente";
  const risolto = scelta === "risolto";
  await updateFrontmatter(file, (f) => {
    pushUnique(f, "connessioni", `[[${title}]]`);
    if (risolto) { f.stato = "archiviata"; f.archiviata_il = when; }
    else f.clock = 0;
  });
  // Motore B — CASCATA: la conseguenza si propaga (onda di pressione sui collegati di tensione).
  const onde = await cascata(file, fm);
  const coda = onde.length ? ` Onda: ${onde.length} collegati sotto pressione.` : "";
  new Notice((risolto
    ? `Conseguenza scatenata e fronte RISOLTO (archiviato) → "${title}".`
    : `Conseguenza scatenata → "${title}"; clock azzerato.`) + coda);
  return "";
}

// Avanza il clock del fronte di un segmento (cap a clock_dim): una mossa o una
// SPINTA dal grafo (vedi views.renderPressioni) si traduce in progresso del fronte.
// A clock pieno suggerisce di scatenare la conseguenza. Niente clock_dim → non è un fronte.
async function avanza_fronte(file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const dim = Number(fm.clock_dim);
  if (!Number.isFinite(dim) || dim <= 0) { new Notice("Non è un fronte (manca clock_dim)."); return ""; }
  let nuovo = 0;
  await updateFrontmatter(file, f => { nuovo = Math.min(dim, (Number(f.clock) || 0) + 1); f.clock = nuovo; });
  new Notice(nuovo >= dim ? `Clock pieno (${nuovo}/${dim})! Scatena la conseguenza.` : `Fronte avanzato: ${nuovo}/${dim}.`);
  return "";
}

// Override HP/CA/iniziativa per-creatura: frontmatter `varianti`, una stringa per
// creatura nella forma "[[Nome]]: hp 60, ca 12, init 20" (alias IT: pf→hp, iniz→init).
// Mappa nome→{hp,ca,init}. Serve a potenziare un boss o indebolire un gregario senza
// creare una nota apposta. hp è l'ancora: Initiative Tracker è POSIZIONALE
// (count: name, hp, ca, init), quindi ca/init valgono solo se preceduti da hp.
