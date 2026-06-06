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

