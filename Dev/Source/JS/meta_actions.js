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

// Riscrive il blocco ```encounter``` della nota dalle creature collegate
// (frontmatter 'creature'): rigenera la lista `creatures:` (per nome × quantità,
// le occorrenze ripetute = più creature, coerente con la difficoltà) e allinea
// `name:` al titolo della nota; preserva `players:`. Toglie il copia-incolla.
async function aggiorna_encounter(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const creature = Array.isArray(fm.creature) ? fm.creature : (fm.creature ? [fm.creature] : []);
  const counts = {};
  for (const l of creature) {
    const nome = linkName(l, file.path);
    if (nome) counts[nome] = (counts[nome] || 0) + 1;
  }
  const righe = Object.entries(counts).map(([n, q]) => `  - ${q}: ${n}`);

  const data = await app.vault.read(file);
  const re = /```encounter\r?\n[\s\S]*?\r?\n```/;
  const cur = data.match(re);
  if (!cur) { new Notice("Nessun blocco ```encounter``` in questa nota."); return ""; }
  const pm = cur[0].match(/^players\s*:\s*(.+)$/m);
  const players = pm ? pm[1].trim() : "true";
  const lista = righe.length ? righe.join("\n") : "  # Collega le creature (tab Collegamenti) e ripremi.";
  const blocco = "```encounter\nname: " + file.basename + "\nplayers: " + players + "\ncreatures:\n" + lista + "\n```";
  await app.vault.modify(file, data.replace(re, blocco));
  new Notice(righe.length
    ? `Blocco encounter aggiornato: ${creature.length} creatura/e collegate.`
    : "Blocco encounter aggiornato (nessuna creatura collegata).");
  return "";
}

// Riposo lungo (PG): PF al massimo, PF temporanei e tiri salvezza contro morte
// azzerati, slot incantesimo recuperati (azzera gli slot_uso_* esistenti). Lo slot
// breve in 5.5e si gioca coi dadi vita (manuale), quindi non c'è auto-reset.
async function riposo_lungo(file) {
  await updateFrontmatter(file, fm => {
    if (fm.pf_max != null) fm.pf = Number(fm.pf_max) || 0;
    fm.pf_temp = 0;
    fm.ts_morte_successi = 0;
    fm.ts_morte_fallimenti = 0;
    for (let n = 1; n <= 9; n++) {
      if (fm["slot_uso_" + n] != null) fm["slot_uso_" + n] = 0;
    }
  });
  new Notice("Riposo lungo: PF al massimo, slot e tiri salvezza contro morte recuperati.");
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

  if (action === "aggiorna_encounter") {
    return await aggiorna_encounter(tp, file);
  }

  if (action === "riposo_lungo") {
    return await riposo_lungo(file);
  }

  if (action === "sali_di_livello") {
    // Motore di level-up PG dedicato (script Templater autonomo).
    if (tp.user && tp.user.sali_pg) return await tp.user.sali_pg(tp);
    new Notice("sali_pg non disponibile."); return "";
  }

  new Notice(`Azione non gestita: ${action}`);
  return "";
}

module.exports = meta_actions;
