// Azioni sulla nota attiva (marca canonico / archivia / collega). Autonomo: nessun require.

async function updateFrontmatter(file, updater) {
  if (!file || !app.fileManager?.processFrontMatter) return;
  await app.fileManager.processFrontMatter(file, updater);
}

async function loadCore() {
  try {
    return JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json"));
  } catch (e) {
    return {};
  }
}

// Nome di una creatura da un link del frontmatter: risolve [[Nota]] al basename
// reale (così combacia con lo statblock del bestiario); fallback all'alias o
// all'ultimo segmento se il link non risolve.
function linkName(link, sourcePath) {
  const raw = String(link ?? "").trim();
  const m = raw.match(/\[\[([^\]]+)\]\]/);
  const inner = m ? m[1] : raw;
  const target = inner.split("|")[0].split("#")[0].trim();
  const dest = app.metadataCache?.getFirstLinkpathDest?.(target, sourcePath || "");
  if (dest && dest.basename) return dest.basename;
  const alias = inner.includes("|") ? inner.split("|").slice(1).join("|").trim() : "";
  return alias || target.split("/").pop() || "";
}

// Aggiunge un valore a una lista del frontmatter senza duplicati.
function pushUnique(fm, key, value) {
  const list = Array.isArray(fm[key]) ? fm[key] : (fm[key] ? [fm[key]] : []);
  if (!list.includes(value)) list.push(value);
  fm[key] = list;
}

// Campo-relazione RECIPROCO sul target: se la categoria target ha ESATTAMENTE
// una relazione che punta alla categoria sorgente, è l'inverso tipizzato (es.
// luogo.cultura → cultura ha solo 'regioni'→luogo). Zero o più di una (ambiguo,
// es. personaggio.fazione ↔ figure/fondatori) → null: si usa il generico
// 'connessioni'. Auto-derivato: niente authoring di inverse nello schema.
// Copia della sorgente canonica _relations.js: check() ne impone l'uguaglianza
// (anti-drift con create_entity). Modifica _relations.js e risincronizza qui.
// >>>relations
function reciprocalField(relazioni, targetCat, sourceCat) {
  const cands = ((relazioni ?? {})[targetCat] ?? []).filter((s) => s && s.category === sourceCat);
  return cands.length === 1 ? cands[0] : null;
}

// Relazione INVERSA da scrivere sul target collegando con `rel`. Tre vie, in ordine:
//  1) ESPLICITA — `rel.reciprocal` nomina il campo inverso, risolto nello schema del
//     target per ereditarne 'multi'/'label'. Serve quando l'auto-derivazione è
//     ambigua: coppie simmetriche (luogo.confina_con↔confina_con) o direzionali
//     (evento.causato_da↔conseguenze), dove il target ha più relazioni alla sorgente;
//  2) AUTO-DERIVATA — la coppia è univoca (reciprocalField), per le relazioni
//     tipizzate senza override esplicito;
//  3) null — relazione generica o ambigua senza override: il chiamante usa 'connessioni'.
function inverseRelation(core, rel, sourceCat, targetCat) {
  if (rel && rel.reciprocal) {
    const rels = (core.relazioni ?? {})[targetCat] ?? [];
    return rels.find((r) => r && r.field === rel.reciprocal) ?? { field: rel.reciprocal, multi: !!rel.multi };
  }
  return rel && rel.category ? reciprocalField(core.relazioni, targetCat, sourceCat) : null;
}
// <<<relations

// Collega la nota attiva a un'altra in modo TIPIZZATO e RECIPROCO:
// 1) scegli il tipo di relazione (da core.relazioni della categoria, o generico),
// 2) scegli la nota target (suggester sulle note della categoria giusta),
// 3) scrive il link tipizzato qui e l'INVERSO sul target: tipizzato se la coppia
//    è univoca (reciprocalField), altrimenti il generico 'connessioni'.
async function collega(tp, file) {
  const core = await loadCore();
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const rels = (core.relazioni ?? {})[fm.categoria] ?? [];
  const options = [...rels, { field: "connessioni", label: "Collegamento generico", category: null, multi: true }];

  const rel = await tp.system.suggester(options.map(r => r.label), options, true, "Tipo di relazione");
  if (!rel) return "";

  const targets = app.vault.getMarkdownFiles()
    .map(f => ({ f, fm: app.metadataCache.getFileCache(f)?.frontmatter ?? {} }))
    .filter(e => e.f.path !== file.path && e.fm.categoria && (!rel.category || e.fm.categoria === rel.category))
    .map(e => e.f)
    .sort((a, b) => a.basename.localeCompare(b.basename));
  if (!targets.length) {
    new Notice(`Nessuna nota di categoria "${rel.category ?? "qualsiasi"}" da collegare.`);
    return "";
  }
  const target = await tp.system.suggester(targets.map(f => f.basename), targets, false, `${rel.label}: scegli la nota`);
  if (!target) return "";

  const linkTo = `[[${target.basename}]]`;
  await updateFrontmatter(file, f => {
    if (rel.multi) pushUnique(f, rel.field, linkTo);
    else f[rel.field] = linkTo;
  });
  // Inverso: esplicito (rel.reciprocal) > tipizzato auto (coppia univoca) > generico.
  const back = `[[${file.basename}]]`;
  const targetCat = (app.metadataCache.getFileCache(target)?.frontmatter ?? {}).categoria;
  const recip = inverseRelation(core, rel, fm.categoria, targetCat);
  await updateFrontmatter(target, f => {
    if (recip) { if (recip.multi) pushUnique(f, recip.field, back); else f[recip.field] = back; }
    else pushUnique(f, "connessioni", back);
  });
  new Notice(`Collegato: ${rel.label} → ${target.basename}${recip ? ` (↔ ${recip.label ?? recip.field})` : ""}`);
  return "";
}

// --- Profilo: tag coerenti derivati dalle combinazioni di valori-assi --------
// Copia della sorgente canonica _comparators.js: check() ne impone l'uguaglianza
// (anti-drift). Modifica _comparators.js e risincronizza qui (stesso testo).
// >>>matchesCond
function matchesCond(value, cond) {
  const v = Number(value);
  if (!Number.isFinite(v)) return false;
  const c = String(cond).trim();
  let m;
  if ((m = c.match(/^(>=|<=|>|<|==|=)\s*(\d+)$/))) {
    const n = Number(m[2]);
    return m[1] === ">=" ? v >= n : m[1] === "<=" ? v <= n
         : m[1] === ">" ? v > n : m[1] === "<" ? v < n : v === n;
  }
  if ((m = c.match(/^(\d+)\s*-\s*(\d+)$/))) return v >= Number(m[1]) && v <= Number(m[2]);
  if (/^\d+$/.test(c)) return v === Number(c);
  return false;
}
// <<<matchesCond

// Riscrive i tag 'profilo/*' del frontmatter dai valori-assi correnti: RIMUOVE i
// vecchi profilo/* (niente residui se cambi gli assi) e aggiunge quelli attuali.
async function applica_profilo(tp, file) {
  const core = await loadCore();
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const archetipi = (core.archetipi ?? {})[fm.categoria] ?? [];
  if (!archetipi.length) {
    new Notice("Nessun archetipo per questa categoria.");
    return "";
  }
  const matches = archetipi.filter(a =>
    Object.entries(a.quando ?? {}).every(([axis, cond]) => matchesCond(fm[axis], cond)));
  const derived = [...new Set(matches.flatMap(a => (a.tag ?? []).map(t => `profilo/${t}`)))];
  await updateFrontmatter(file, f => {
    const cur = Array.isArray(f.tags) ? f.tags : (f.tags ? [f.tags] : []);
    const kept = cur.filter(t => !String(t).startsWith("profilo/"));
    f.tags = [...new Set([...kept, ...derived])];
  });
  new Notice(derived.length
    ? `Profilo applicato: ${matches.map(a => a.nome).join(", ")}`
    : "Nessun archetipo combacia: tag profilo/* rimossi.");
  return "";
}

async function ensureFolder(path) {
  let cur = "";
  for (const part of String(path || "").split("/").filter(Boolean)) {
    cur = cur ? `${cur}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(cur)) { try { await app.vault.createFolder(cur); } catch (e) { /* esiste */ } }
  }
}

// Scatena la conseguenza di un fronte: crea un EVENTO collegato che documenta
// l'esito (la giocata diventa storia del mondo) e AZZERA il clock del fronte.
// È il ponte gioco -> worldbuilding.
async function scatena_conseguenza(tp, file) {
  const core = await loadCore();
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const conseguenza = String(fm.conseguenza ?? "").trim();
  if (!conseguenza) { new Notice("Nessuna conseguenza descritta su questo fronte."); return ""; }
  const fronte = file.basename;
  const folder = (core.folders ?? {})["evento"] ?? "Mondi/Eventi";
  await ensureFolder(folder);
  const title = `Conseguenza — ${fronte}`;
  let path = `${folder}/${title}.md`;
  for (let i = 2; app.vault.getAbstractFileByPath(path); i++) path = `${folder}/${title} (${i}).md`;
  const su = fm.conseguenza_su ? String(fm.conseguenza_su) : "";
  const when = tp.date ? tp.date.now("YYYY-MM-DD") : "";
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
  await updateFrontmatter(file, f => { f.clock = 0; pushUnique(f, "connessioni", `[[${title}]]`); });
  new Notice(`Conseguenza scatenata → evento "${title}"; clock azzerato.`);
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
function parseVarianti(varianti, sourcePath) {
  const list = Array.isArray(varianti) ? varianti : (varianti ? [varianti] : []);
  const out = {};
  for (const raw of list) {
    const s = String(raw ?? "");
    const i = s.indexOf(":");
    if (i < 0) continue;
    const nome = linkName(s.slice(0, i), sourcePath);
    if (!nome) continue;
    const spec = {};
    for (const part of s.slice(i + 1).split(",")) {
      const m = part.trim().match(/^(pf|hp|ca|init|iniz(?:iativa)?)\s*[:=]?\s*(-?\d+)$/i);
      if (!m) continue;
      const k = m[1].toLowerCase();
      const v = Number(m[2]);
      if (k === "pf" || k === "hp") spec.hp = v;
      else if (k === "ca") spec.ca = v;
      else spec.init = v;
    }
    out[nome] = spec;
  }
  return out;
}

// Riga `creatures:` per una creatura. Con override hp emette la sintassi posizionale
// IT (count: name, hp[, ca[, init]]); ca/init solo se contigui a partire da hp (così
// indicare l'hp impedisce il tiro casuale → incontro ripetibile).
function rigaCreatura(nome, q, spec) {
  if (spec && Number.isFinite(spec.hp)) {
    const extra = [spec.hp];
    if (Number.isFinite(spec.ca)) {
      extra.push(spec.ca);
      if (Number.isFinite(spec.init)) extra.push(spec.init);
    }
    return `  - ${q}: ${nome}, ${extra.join(", ")}`;
  }
  return `  - ${q}: ${nome}`;
}

// Riscrive il blocco ```encounter``` della nota dalle creature collegate
// (frontmatter 'creature'): rigenera la lista `creatures:` (per nome × quantità,
// le occorrenze ripetute = più creature, coerente con la difficoltà), applica gli
// override `varianti` e allinea `name:` al titolo della nota; preserva `players:`.
async function aggiorna_encounter(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const creature = Array.isArray(fm.creature) ? fm.creature : (fm.creature ? [fm.creature] : []);
  const counts = {};
  for (const l of creature) {
    const nome = linkName(l, file.path);
    if (nome) counts[nome] = (counts[nome] || 0) + 1;
  }
  const varianti = parseVarianti(fm.varianti, file.path);
  const righe = Object.entries(counts).map(([n, q]) => rigaCreatura(n, q, varianti[n]));
  // Alleati (PNG/evocazioni schierati col gruppo): flag `, ally` → Initiative Tracker
  // li separa dai nemici nel conteggio difficoltà. Una riga per occorrenza.
  const alleati = Array.isArray(fm.alleati) ? fm.alleati : (fm.alleati ? [fm.alleati] : []);
  const righeAll = alleati.map(l => linkName(l, file.path)).filter(Boolean).map(n => `  - ${n}, ally`);

  const data = await app.vault.read(file);
  const re = /```encounter\r?\n[\s\S]*?\r?\n```/;
  const cur = data.match(re);
  if (!cur) { new Notice("Nessun blocco ```encounter``` in questa nota."); return ""; }
  const pm = cur[0].match(/^players\s*:\s*(.+)$/m);
  const players = pm ? pm[1].trim() : "true";
  const tutte = [...righe, ...righeAll];
  const lista = tutte.length ? tutte.join("\n") : "  # Collega le creature (tab Collegamenti) e ripremi.";
  const blocco = "```encounter\nname: " + file.basename + "\nplayers: " + players + "\ncreatures:\n" + lista + "\n```";
  await app.vault.modify(file, data.replace(re, blocco));
  new Notice(righe.length
    ? `Blocco encounter aggiornato: ${creature.length} creatura/e collegate.`
    : "Blocco encounter aggiornato (nessuna creatura collegata).");
  return "";
}

// Riposo lungo (PG): PF al massimo, PF temporanei e tiri salvezza contro morte
// azzerati, slot incantesimo recuperati (azzera gli slot_uso_* esistenti),
// concentrazione conclusa, metà dei Dadi Vita recuperati (2024: floor(max/2),
// min 1) e un livello di Esaurimento (Indebolimento) rimosso (−1, NON azzerato).
async function riposo_lungo(file) {
  let esaur = null;
  await updateFrontmatter(file, fm => {
    if (fm.pf_max != null) fm.pf = Number(fm.pf_max) || 0;
    fm.pf_temp = 0;
    fm.ts_morte_successi = 0;
    fm.ts_morte_fallimenti = 0;
    fm.concentrazione_su = "";
    for (let n = 1; n <= 9; n++) {
      if (fm["slot_uso_" + n] != null) fm["slot_uso_" + n] = 0;
    }
    if (fm.dadi_vita_max != null) {
      const rec = Math.max(1, Math.floor((Number(fm.dadi_vita_max) || 0) / 2));
      fm.dadi_vita_spesi = Math.max(0, (Number(fm.dadi_vita_spesi) || 0) - rec);
    }
    if (fm.esaurimento != null) {
      fm.esaurimento = Math.max(0, (Number(fm.esaurimento) || 0) - 1);
      esaur = fm.esaurimento;
    }
    // Risorse di classe (Ki/Ira/Incanalare/...): il riposo lungo le ricarica TUTTE.
    for (const r of (Array.isArray(fm.risorse_pg) ? fm.risorse_pg : [])) {
      if (r && r.id) fm["usi_" + r.id] = 0;
    }
  });
  const coda = esaur != null ? ` Esaurimento → ${esaur}.` : "";
  new Notice(`Riposo lungo: PF al massimo, slot/TS-morte/concentrazione, risorse di classe e metà Dadi Vita recuperati.${coda}`);
  return "";
}

// Riposo breve (PG): ricarica le risorse di classe a riposo BREVE (e gli slot del Patto
// del Warlock, 2024) e spende UN Dado Vita per curarsi (tira il dado vita + mod COS, min 1
// PF, fino a pf_max). La ricarica avviene SEMPRE, anche senza Dadi Vita da spendere.
async function riposo_breve(file) {
  let msg = "Riposo breve: nessun Dado Vita rimasto.";
  const ric = [];
  await updateFrontmatter(file, fm => {
    // Ricarica BREVE: risorse di classe con ric:breve + slot del Patto (slot_ricarica:breve).
    for (const r of (Array.isArray(fm.risorse_pg) ? fm.risorse_pg : [])) {
      if (r && r.ric === "breve" && (Number(fm["usi_" + r.id]) || 0) > 0) { fm["usi_" + r.id] = 0; ric.push(r.label); }
    }
    if (fm.slot_ricarica === "breve") {
      let any = false;
      for (let n = 1; n <= 9; n++) if (fm["slot_uso_" + n] != null && (Number(fm["slot_uso_" + n]) || 0) > 0) { fm["slot_uso_" + n] = 0; any = true; }
      if (any) ric.push("slot del Patto");
    }
    // Cura: spende 1 Dado Vita, se disponibile.
    const max = Number(fm.dadi_vita_max) || 0;
    const spesi = Number(fm.dadi_vita_spesi) || 0;
    if (max - spesi <= 0) return;
    const die = Number((String(fm.dado_vita).match(/\d+/) || [8])[0]) || 8;
    const conMod = Math.floor(((Number(fm.costituzione) || 10) - 10) / 2);
    const roll = Math.floor(Math.random() * die) + 1;
    const cura = Math.max(1, roll + conMod);
    const pf = (Number(fm.pf) || 0) + cura;
    fm.pf = fm.pf_max != null ? Math.min(Number(fm.pf_max) || pf, pf) : pf;
    fm.dadi_vita_spesi = spesi + 1;
    msg = `Riposo breve: speso 1 Dado Vita (d${die}: ${roll}${conMod >= 0 ? "+" : ""}${conMod}) → +${cura} PF.`;
  });
  new Notice(msg + (ric.length ? ` Ricaricati: ${ric.join(", ")}.` : ""));
  return "";
}

// «Usa risorsa»: spende 1 uso di una risorsa di classe a ricarica (incrementa usi_<id>
// fino al max). Suggester sulle risorse della scheda PG (risorse_pg). I riposi le azzerano.
async function usa_risorsa(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const risorse = (Array.isArray(fm.risorse_pg) ? fm.risorse_pg : []).filter(r => r && (Number(r.max) || 0) > 0);
  if (!risorse.length) { new Notice("Nessuna risorsa di classe da spendere su questa scheda."); return ""; }
  const labels = risorse.map(r => {
    const rem = Math.max(0, (Number(r.max) || 0) - (Number(fm["usi_" + r.id]) || 0));
    return `${r.label} — ${rem}/${Number(r.max) || 0}`;
  });
  const r = await tp.system.suggester(labels, risorse, false, "Quale risorsa spendere?");
  if (!r) return "";
  let ok = false;
  await updateFrontmatter(file, f => {
    const max = Number(r.max) || 0, spent = Number(f["usi_" + r.id]) || 0;
    if (spent >= max) return;
    f["usi_" + r.id] = spent + 1;
    ok = true;
  });
  new Notice(ok ? `Speso 1 · ${r.label}.` : `${r.label}: già esaurita (riposa per ricaricarla).`);
  return "";
}

// Aggiunge un'entrata datata al "Registro dei turni" del bastione (la sezione è
// creata se assente). Pura/testabile: ritorna il nuovo contenuto. Le voci nuove
// vanno in cima al registro (più recente prima).
function appendTurnoLog(content, data, riepilogo) {
  const voce = `- **${data}** — ${String(riepilogo || "").trim() || "(turno senza note)"}`;
  const re = /(^|\n)(##+\s*Registro dei turni\s*\n)/;
  const m = content.match(re);
  if (m) {
    const at = m.index + m[0].length;
    return content.slice(0, at) + voce + "\n" + content.slice(at);
  }
  const sep = content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}\n## Registro dei turni\n${voce}\n`;
}

// Tira inline i dadi dentro un testo-esito: sostituisce il PRIMO gettone NdM
// (con ×K/*K e ±B opzionali) col risultato, lasciando il resto come etichetta.
// "1d6 lingotti" → "4 lingotti"; "1d4×10 mo" → "30 mo"; "2d6+1 difensori" → "9 difensori".
// rng()∈[0,1) iniettabile (test deterministici). Niente dado → testo invariato.
function rollInline(text, rng) {
  const r = rng || Math.random;
  const re = /(\d*)d(\d+)(?:\s*[×x*]\s*(\d+))?(?:\s*([+-])\s*(\d+))?/i;
  return String(text ?? "").replace(re, (_m, count, faces, mult, sign, mod) => {
    const n = Math.max(1, parseInt(count || "1", 10));
    const f = parseInt(faces, 10);
    let tot = 0;
    for (let i = 0; i < n; i++) tot += Math.floor(r() * f) + 1;
    if (mult) tot *= parseInt(mult, 10);
    if (sign) tot += (sign === "-" ? -1 : 1) * parseInt(mod, 10);
    return String(tot);
  });
}

// Una riga-ordine "Struttura | Ordine | esito" → {struttura, ordine, esito}.
function parseOrdine(line) {
  const parts = String(line ?? "").split("|").map((p) => p.trim());
  return { struttura: parts[0] || "", ordine: parts[1] || "", esito: parts.slice(2).join(" | ") || "" };
}

// Normalizza il campo `ordini` (lista YAML o stringa multilinea) in righe non vuote.
function ordiniLines(ordini) {
  const arr = Array.isArray(ordini) ? ordini : String(ordini ?? "").split(/\r?\n/);
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean);
}

// Risolve un turno di bastione dalle strutture dichiarate: per ciascuna, tira i
// dadi dell'esito. Ritorna [{struttura, ordine, esito}]. License-safe: gli ordini
// e gli esiti sono AUTORIALI (nessuna tabella DMG riprodotta) — l'azione tira e logga.
function resolveTurno(ordini, rng) {
  return ordiniLines(ordini).map((line) => {
    const o = parseOrdine(line);
    return { ...o, esito: rollInline(o.esito, rng) };
  });
}

// Una voce-esito risolta → riga di log markdown ("    - **Struttura** → *Ordine*: esito").
function rigaTurno(o) {
  let s = `    - **${o.struttura || "Struttura"}**`;
  if (o.ordine) s += ` → *${o.ordine}*`;
  if (o.esito) s += `: ${o.esito}`;
  return s;
}

// Turno di bastione (2024): se la scheda dichiara le `ordini` (lista "Struttura |
// Ordine | esito", esito con dadi opzionali), RISOLVE il turno (tira i dadi, conta
// il turno, scrive un blocco datato nel Registro dei turni e aggiorna `turni`).
// Senza strutture dichiarate, ricade nel prompt libero (compat). I dadi sono tirati,
// non simulati: il GM autora ordini/esiti, l'azione fa i conti.
async function turno_bastione(tp, file) {
  const data = tp.date ? tp.date.now("YYYY-MM-DD") : "";
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const righe = ordiniLines(fm.ordini);
  let riepilogo;
  if (righe.length) {
    const turno = (Number(fm.turni) || 0) + 1;
    const esiti = resolveTurno(fm.ordini, Math.random);
    riepilogo = `**Turno ${turno}**\n` + esiti.map(rigaTurno).join("\n");
    await updateFrontmatter(file, (f) => { f.turni = turno; f.ultimo_turno = data; });
  } else {
    riepilogo = await tp.system.prompt(
      "Nessuna struttura in `ordini`. Turno di bastione: cosa hanno prodotto le strutture?", "");
    if (riepilogo == null) return "";
  }
  const content = await app.vault.read(file);
  await app.vault.modify(file, appendTurnoLog(content, data, riepilogo));
  new Notice(righe.length
    ? `Turno di bastione risolto: ${righe.length} strutture (${data}).`
    : `Turno di bastione registrato (${data}).`);
  return "";
}

// --- Scaffolder statblock dal GS (DM) ---------------------------------------
// Per una creatura con `gs` impostato, RIGENERA il blocco ```statblock con valori
// base = mediane dei mostri SRD di pari GS (core.json gs_baseline): AC/PF/BC/
// iniziativa + un'azione d'attacco col bonus e il danno tipici (+ un'azione-
// salvezza se quel GS la prevede). Un boss con solo `gs` diventa SUBITO giocabile;
// il DM rifinisce a mano. Re-eseguibile. Preserva il `layout` esistente.
function _sign(n) { return (Number(n) >= 0 ? "+" : "") + Number(n); }
function _gsNum(k) {
  if (typeof k === "string" && k.includes("/")) { const [a, b] = k.split("/").map(Number); return b ? a / b : NaN; }
  return Number(k);
}
function nearestBaseline(table, gs) {
  if (table[gs]) return { rec: table[gs], gs };
  const target = _gsNum(gs);
  if (!Number.isFinite(target)) return null;
  let best = null, bestD = Infinity;
  for (const k of Object.keys(table)) {
    const v = _gsNum(k);
    if (Number.isFinite(v) && Math.abs(v - target) < bestD) { bestD = Math.abs(v - target); best = k; }
  }
  return best ? { rec: table[best], gs: best } : null;
}

async function scaffold_statblock(file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const gs = fm.gs != null ? String(fm.gs).trim() : "";
  if (!gs) { new Notice("Imposta il Grado di sfida (GS) nella scheda e ripremi."); return ""; }
  const core = await loadCore();
  const hit = nearestBaseline(core.gs_baseline || {}, gs);
  if (!hit) { new Notice(`Nessuna statistica base per GS ${gs}.`); return ""; }
  const base = hit.rec;
  const data = await app.vault.read(file);
  const re = /```statblock\r?\n[\s\S]*?\r?\n```/;
  const cur = data.match(re);
  if (!cur) { new Notice("Nessun blocco ```statblock``` in questa nota."); return ""; }
  const layout = (cur[0].match(/^layout:\s*(.+)$/m) || [])[1] || "5-5e-ita";

  const pb = base.pb != null ? base.pb : 2;
  const atk = base.attacco != null ? base.attacco : pb;
  const mod = atk - pb;
  const forza = Math.max(1, 10 + 2 * mod);
  const cos = Math.max(8, 10 + 2 * Math.round(mod / 2));
  const danno = base.danno != null
    ? `${base.danno}${base.danno_formula ? ` (${base.danno_formula})` : ""} danni${base.danno_tipo ? ` ${base.danno_tipo}` : ""}`
    : "danni a scelta";
  // Multiattacco: i mostri di GS medio-alto attaccano più volte per turno. Lo
  // scaffold lo riflette (1 attacco fino a GS 1; 2 da GS 2; 3 da GS 11) così un boss
  // homebrew "picchia" come la sua fascia. Ogni attacco fa il danno-base del GS.
  const gsN = _gsNum(gs);
  const nAtt = !Number.isFinite(gsN) ? 1 : (gsN >= 11 ? 3 : (gsN >= 2 ? 2 : 1));
  const azioni = [];
  if (nAtt > 1) {
    azioni.push("  - name: Multiattacco");
    azioni.push(`    desc: "${file.basename} effettua ${nAtt} attacchi."`);
  }
  azioni.push("  - name: Attacco");
  azioni.push(`    desc: "*Tiro per colpire:* ${_sign(atk)}, portata 1,5 m (o gittata). *Colpito:* ${danno}."`);
  if (base.cd != null) {
    azioni.push(`  - name: Azione speciale (CD ${base.cd})`);
    azioni.push(`    desc: "*Tiro salvezza:* CD ${base.cd}. Personalizza l'effetto (area, condizione, danno)."`);
  }
  const sb = [
    "```statblock",
    `layout: ${layout}`,
    `name: ${file.basename}`,
    `size: ${fm.taglia || "Medio"}`,
    `type: ${fm.tipo || "umanoide"}`,
    "alignment: neutrale",
    `ac: ${base.ac != null ? base.ac : 12}`,
    `hp: ${base.hp != null ? base.hp : 10}`,
    "speed: 9 m",
    `initiative: "${_sign(base.init != null ? base.init : 0)}"`,
    `stats: [${forza}, 12, ${cos}, 10, 12, 10]`,
    `cr: "${gs}"`,
    `pb: "${_sign(pb)}"`,
    // TS competenti sulle caratteristiche potenziate (FOR/COS): rollabili, e danno
    // alla creatura una difesa coerente col GS. Il DM rifinisce le altre a mano.
    `saves: [{FOR: ${mod + pb}}, {COS: ${Math.round(mod / 2) + pb}}]`,
    "traits:",
    `  - name: Generato dal GS ${gs}`,
    `    desc: "Valori base = mediane dei mostri SRD di pari GS${hit.gs !== gs ? ` (≈ GS ${hit.gs})` : ""}. Rifinisci a mano: multiattacco, tratti, resistenze, leggendarie."`,
    "actions:",
    ...azioni,
    "```",
  ].join("\n");
  await app.vault.modify(file, data.replace(re, sb));
  new Notice(`Statblock generato dal GS ${gs} (AC ${base.ac}, PF ${base.hp}). Rifinisci a mano.`);
  return "";
}

// --- Ponte Initiative Tracker: schiera il gruppo (DM) ------------------------
// Un PG (nota personaggio, tipo pg) → oggetto-player Initiative Tracker: nome, PF
// (pf_max), CA (ca), modificatore d'iniziativa (mod DES da `destrezza`), livello.
// `je.from(t)` di IT accetta questi campi (player:true lo marca come giocatore).
// Esposto per i test.
function playerFromPg(file, fm) {
  const dex = Number(fm.destrezza);
  return {
    name: String(fm.nome || file.basename),
    player: true,
    hp: Number(fm.pf_max) || Number(fm.pf) || undefined,
    ac: Number(fm.ca) || undefined,
    modifier: Number.isFinite(dex) ? Math.floor((dex - 10) / 2) : 0,
    level: Number(fm.livello) || 1,
  };
}

// «Prepara il gruppo (IT)»: auto-inietta il PARTY di Initiative Tracker dai PG del
// vault (note personaggio · tipo pg), così il blocco `players: true` risolve senza
// configurazione manuale — chiude il residuo documentato del ponte IT. NON duplica
// IT (il tracker resta il motore del combattimento): aggiunge solo i PG mancanti al
// roster (`savePlayer`, non distruttivo) e li unisce al party di default. I mostri
// li risolve già il blocco encounter al «Avvia incontro». Best-effort + graceful se
// IT assente o l'API interna cambia.
async function inizia_incontro(tp) {
  const it = app.plugins?.plugins?.["initiative-tracker"];
  if (!it || !it.data) {
    new Notice("Initiative Tracker non è installato (o non attivo): installalo per schierare il gruppo.");
    return "";
  }
  const pgs = app.vault.getMarkdownFiles()
    .map((f) => ({ f, fm: app.metadataCache.getFileCache(f)?.frontmatter || {} }))
    .filter((e) => e.fm.categoria === "personaggio" && String(e.fm.tipo).toLowerCase() === "pg")
    .map((e) => playerFromPg(e.f, e.fm))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!pgs.length) {
    new Notice("Nessun PG nel vault (nota personaggio · tipo pg). Crea i PG col bottone «Crea PG».");
    return "";
  }
  // Roster IT: aggiungi solo i PG mancanti (non distruttivo: preserva i player utente).
  const existing = new Set((it.data.players || []).map((p) => p && p.name));
  for (const pg of pgs) {
    if (existing.has(pg.name)) continue;
    try { await it.savePlayer(pg); } catch (e) { /* best-effort */ }
  }
  // Party di default: crealo se assente e unisci i PG (non distruttivo).
  try {
    const pname = it.data.defaultParty || "Gruppo";
    if (!Array.isArray(it.data.parties)) it.data.parties = [];
    let party = it.data.parties.find((p) => p && p.name === pname);
    if (!party) { party = { name: pname, players: [] }; it.data.parties.push(party); }
    const names = new Set(party.players || []);
    for (const pg of pgs) names.add(pg.name);
    party.players = [...names];
    if (!it.data.defaultParty) it.data.defaultParty = pname;
    await (it.saveSettings ? it.saveSettings() : Promise.resolve());
  } catch (e) { /* best-effort */ }
  const nomi = pgs.map((p) => p.name);
  new Notice(`Gruppo IT pronto: ${pgs.length} PG nel party (${nomi.slice(0, 4).join(", ")}${nomi.length > 4 ? "…" : ""}). Ora «Avvia incontro» sul blocco include il gruppo.`);
  try { app.commands?.executeCommandById?.("initiative-tracker:open"); } catch (e) { /* opzionale */ }
  return "";
}

async function meta_actions(tp, action = "") {
  const file = app.workspace.getActiveFile?.() ?? tp.config?.target_file;
  if (!file) {
    new Notice("Nessuna nota attiva.");
    return "";
  }

  if (action === "marca_canonico") {
    await updateFrontmatter(file, fm => {
      fm.canonico = true;
      if (fm.stato === "bozza") fm.stato = "pronto";
    });
    new Notice("Nota marcata canonica.");
    return "";
  }

  if (action === "archivia") {
    await updateFrontmatter(file, fm => {
      fm.stato = "archiviata";
      fm.archiviata_il = tp.date.now("YYYY-MM-DD");
    });
    new Notice("Nota archiviata.");
    return "";
  }

  if (action === "collega") {
    return await collega(tp, file);
  }

  if (action === "applica_profilo") {
    return await applica_profilo(tp, file);
  }

  if (action === "scatena_conseguenza") {
    return await scatena_conseguenza(tp, file);
  }

  if (action === "avanza_fronte") {
    return await avanza_fronte(file);
  }

  if (action === "aggiorna_encounter") {
    return await aggiorna_encounter(tp, file);
  }

  if (action === "scaffold_statblock") {
    return await scaffold_statblock(file);
  }

  if (action === "riposo_lungo") {
    return await riposo_lungo(file);
  }

  if (action === "riposo_breve") {
    return await riposo_breve(file);
  }

  if (action === "usa_risorsa") {
    return await usa_risorsa(tp, file);
  }

  if (action === "sali_di_livello") {
    // Motore di level-up PG dedicato (script Templater autonomo).
    if (tp.user && tp.user.sali_pg) return await tp.user.sali_pg(tp);
    new Notice("sali_pg non disponibile."); return "";
  }

  if (action === "genera") {
    // Generatore homebrew di nomi/spunti (script Templater autonomo).
    if (tp.user && tp.user.genera) return await tp.user.genera(tp);
    new Notice("genera non disponibile."); return "";
  }

  if (action === "turno_bastione") {
    return await turno_bastione(tp, file);
  }

  if (action === "world_board") {
    // Genera il World Board (Obsidian Canvas) di un mondo dell'utente (script autonomo).
    if (tp.user && tp.user.world_board) return await tp.user.world_board(tp);
    new Notice("world_board non disponibile."); return "";
  }

  if (action === "inizia_incontro") {
    // Schiera il gruppo: auto-inietta il Party di Initiative Tracker dai PG (non serve file attivo).
    return await inizia_incontro(tp);
  }

  new Notice(`Azione non gestita: ${action}`);
  return "";
}

// Esposto per il test-guardia anti-drift: matchesCond deve dare risultati
// identici alla copia in views.js (le due non devono divergere).
meta_actions.matchesCond = matchesCond;
meta_actions.reciprocalField = reciprocalField;  // esposto per i test
meta_actions.inverseRelation = inverseRelation;  // esposto per i test
meta_actions.appendTurnoLog = appendTurnoLog;    // esposto per i test
meta_actions.rollInline = rollInline;            // esposto per i test
meta_actions.resolveTurno = resolveTurno;        // esposto per i test
meta_actions.playerFromPg = playerFromPg;        // esposto per i test
meta_actions.inizia_incontro = inizia_incontro;  // esposto per i test
meta_actions.avanza_fronte = avanza_fronte;      // esposto per i test
meta_actions.scaffold_statblock = scaffold_statblock;  // esposto per i test
module.exports = meta_actions;
