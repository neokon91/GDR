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
  });
  const coda = esaur != null ? ` Esaurimento → ${esaur}.` : "";
  new Notice(`Riposo lungo: PF al massimo, slot/TS-morte/concentrazione e metà Dadi Vita recuperati.${coda}`);
  return "";
}

// Riposo breve (PG): spende UN Dado Vita per curarsi (tira il dado vita + mod COS,
// min 1 PF, fino a pf_max). Incrementa dadi_vita_spesi. 2024: niente reset di slot.
async function riposo_breve(file) {
  let msg = "Nessun Dado Vita rimasto.";
  await updateFrontmatter(file, fm => {
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
  new Notice(msg);
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

// Turno di bastione (DMG 2024): registra un turno (7 giorni) con un riepilogo
// degli ordini/esiti delle strutture. Append datato al Registro dei turni.
async function turno_bastione(tp, file) {
  const riepilogo = await tp.system.prompt(
    "Turno di bastione: cosa hanno prodotto le strutture (ordini, esiti, eventi)?", "");
  if (riepilogo == null) return "";
  const data = tp.date ? tp.date.now("YYYY-MM-DD") : "";
  const content = await app.vault.read(file);
  await app.vault.modify(file, appendTurnoLog(content, data, riepilogo));
  new Notice(`Turno di bastione registrato (${data}).`);
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
  const azioni = [
    "  - name: Attacco",
    `    desc: "*Tiro per colpire:* ${_sign(atk)}, portata 1,5 m (o gittata). *Colpito:* ${danno}."`,
  ];
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

  new Notice(`Azione non gestita: ${action}`);
  return "";
}

// Esposto per il test-guardia anti-drift: matchesCond deve dare risultati
// identici alla copia in views.js (le due non devono divergere).
meta_actions.matchesCond = matchesCond;
meta_actions.reciprocalField = reciprocalField;  // esposto per i test
meta_actions.inverseRelation = inverseRelation;  // esposto per i test
meta_actions.appendTurnoLog = appendTurnoLog;    // esposto per i test
meta_actions.avanza_fronte = avanza_fronte;      // esposto per i test
meta_actions.scaffold_statblock = scaffold_statblock;  // esposto per i test
module.exports = meta_actions;
