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

// Aggiunge un valore a una lista del frontmatter senza duplicati.
function pushUnique(fm, key, value) {
  const list = Array.isArray(fm[key]) ? fm[key] : (fm[key] ? [fm[key]] : []);
  if (!list.includes(value)) list.push(value);
  fm[key] = list;
}

// Collega la nota attiva a un'altra in modo TIPIZZATO e RECIPROCO:
// 1) scegli il tipo di relazione (da core.relazioni della categoria, o generico),
// 2) scegli la nota target (suggester sulle note della categoria giusta),
// 3) scrive il link tipizzato qui e un link inverso in 'connessioni' del target.
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
  const back = `[[${file.basename}]]`;
  await updateFrontmatter(target, f => pushUnique(f, "connessioni", back));
  new Notice(`Collegato: ${rel.label} → ${target.basename}`);
  return "";
}

// --- Profilo: tag coerenti derivati dalle combinazioni di valori-assi --------
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

  new Notice(`Azione non gestita: ${action}`);
  return "";
}

module.exports = meta_actions;
