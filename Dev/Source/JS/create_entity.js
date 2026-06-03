// Wizard generico per le entità di worldbuilding (categorie semplici).
// Autonomo: legge core.json a runtime via adapter, ritorna SOLO il frontmatter.
// Il corpo della nota è renderizzato da Jinja (source of truth: YAML).

async function loadCore() {
  const raw = await app.vault.adapter.read("z.automazioni/data/core.json");
  return JSON.parse(raw);
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "nota";
}

function yamlScalar(value) {
  if (value === null || value === undefined || value === "") return "''";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(String(value));
}

function yamlList(values = []) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [values].filter(Boolean);
  return list.length ? `[${list.map(yamlScalar).join(", ")}]` : "[]";
}

function frontmatter(data) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}: ${Array.isArray(value) ? yamlList(value) : yamlScalar(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

async function prompt(tp, message, fallback = "") {
  const value = await tp.system.prompt(message, fallback);
  return String(value ?? fallback ?? "").trim();
}

async function choose(tp, values, message, fallback = "") {
  const items = values?.length ? values : [fallback].filter(Boolean);
  if (!items.length) return "";
  const selected = await tp.system.suggester(items, items, false, message);
  return String(selected ?? fallback ?? "").trim();
}

async function ensureFolder(path) {
  let current = "";
  for (const part of String(path ?? "").split("/").filter(Boolean)) {
    current = current ? `${current}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current);
  }
}

function activeSession() {
  return app.vault.getMarkdownFiles()
    .map(file => ({ file, fm: app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
    .filter(entry => entry.fm.categoria === "sessione" && entry.fm.stato !== "archiviata")
    .sort((a, b) => Number(b.fm.attiva === true) - Number(a.fm.attiva === true)
      || String(b.fm.data ?? "").localeCompare(String(a.fm.data ?? "")))[0]?.file ?? null;
}

// Suggester sulle note esistenti di una categoria -> link [[..]].
function notesByCategory(category) {
  return app.vault.getMarkdownFiles()
    .map(file => ({ file, fm: app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
    .filter(entry => entry.fm.categoria === category && entry.fm.stato !== "archiviata")
    .map(entry => entry.file)
    .sort((a, b) => a.basename.localeCompare(b.basename));
}

// Selezione MULTIPLA in un solo modale: tp.system.multi_suggester (Templater >= 2.16,
// uno solo modale invece del loop "(fine)"); fallback al suggester ripetuto sui
// Templater più vecchi. `labelFn` etichetta gli item; ritorna l'array scelto (mai null).
async function pickMulti(tp, label, items, labelFn) {
  const lf = labelFn || ((x) => String(x));
  if (typeof tp.system.multi_suggester === "function") {
    return (await tp.system.multi_suggester(lf, items, false, label)) || [];
  }
  const picked = [];
  const pool = [...items];
  while (pool.length) {
    const title = `${label}${picked.length ? ` — scelti ${picked.length}` : ""}`;
    const choice = await tp.system.suggester(["(fine)", ...pool.map(lf)], [null, ...pool], false, title);
    if (!choice) break;
    picked.push(choice);
    pool.splice(pool.indexOf(choice), 1);
  }
  return picked;
}

// req = obbligatorio: throw_on_cancel=true, premere X (Escape) lancia un'eccezione
// che ferma il wizard. Per i facoltativi (req=false) X salta solo quel campo.
async function chooseNotes(tp, question, req) {
  const files = notesByCategory(question.category);
  if (question.multi) {
    const picked = await pickMulti(tp, question.prompt, files, (f) => f.basename);
    return picked.map((f) => `[[${f.basename}]]`);
  }
  if (!files.length) {
    const typed = await tp.system.prompt(`${question.prompt} (digita il nome)`, "", req);
    return typed ? `[[${String(typed).trim()}]]` : "";
  }
  const names = files.map(f => f.basename);
  const items = req ? names : ["(nessuno)", ...names];
  const values = req ? files : [null, ...files];
  const choice = await tp.system.suggester(items, values, req, question.prompt);
  return choice ? `[[${choice.basename}]]` : "";
}

async function ask(tp, question, template, core) {
  const req = Boolean(question.required);
  switch (question.from) {
    case "subtypes": {
      const subs = core.categories[template.category]?.subtypes ?? [template.default_type];
      const v = await tp.system.suggester(subs, subs, req, question.prompt);
      return String(v ?? template.default_type);
    }
    case "list": {
      const opts = question.options ?? [];
      // multi: una sola scelta multipla (multi_suggester) -> array.
      if (question.multi) {
        return await pickMulti(tp, question.prompt, opts);
      }
      const v = await tp.system.suggester(opts, opts, req, question.prompt);
      return String(v ?? "");
    }
    case "notes":
      return chooseNotes(tp, question, req);
    case "number": {
      // Campo numerico: prompt + coercizione (virgola decimale ammessa). Valore non
      // numerico -> default se numerico, altrimenti "" (mai una stringa libera).
      const raw = await tp.system.prompt(question.prompt, String(question.default ?? ""), req);
      const n = Number(String(raw ?? "").trim().replace(",", "."));
      return Number.isFinite(n) ? n : (Number.isFinite(Number(question.default)) ? Number(question.default) : "");
    }
    default: {
      // I campi del corpo (body) sono prosa lunga (descrizione/atmosfera/storia…):
      // multiline → textarea nel prompt invece della riga singola.
      const v = await tp.system.prompt(question.prompt, question.default ?? "", req, !!question.multiline);
      return String(v ?? "").trim();
    }
  }
}

function emptyFor(question) {
  return question.multi ? [] : "";
}

// --- Archetipi (preset): valore-asse rappresentativo da un comparatore `quando`.
// ">=N"/"N"/"==N" -> N ; ">N" -> N+1 ; "<N" -> N-1 ; "<=N" -> N ; "N-M" -> media.
function presetValore(cond) {
  const c = String(cond).trim();
  let m;
  if ((m = c.match(/^(>=|<=|>|<|==|=)\s*(\d+)$/))) {
    const n = Number(m[2]);
    return m[1] === ">" ? n + 1 : m[1] === "<" ? n - 1 : n;
  }
  if ((m = c.match(/^(\d+)\s*-\s*(\d+)$/))) return Math.round((Number(m[1]) + Number(m[2])) / 2);
  if (/^\d+$/.test(c)) return Number(c);
  return null;
}

// Relazioni della categoria da offrire nel wizard: tutte quelle NON già chieste
// come creation.fields (evita il doppio-prompt per i pochi link hand-aggiunti
// al wizard, es. personaggio.fazione/luogo). Le altre restano post-creazione.
function relationsToAsk(relazioni, askedFields) {
  const asked = new Set(askedFields || []);
  return (relazioni || []).filter((r) => r && r.field && !asked.has(r.field));
}

// Valori-assi di preset di una FAMIGLIA: la famiglia scelta (classificazione a 2
// livelli) può pre-compilare gli assi tematici col campo opzionale `assi`
// (mappa asseId -> valore 1-5). Stile archetipi, ma a partire dalla famiglia.
function famigliaPreset(categorySpec, nome) {
  const fam = (categorySpec.famiglie || []).find((f) => f.nome === nome);
  return (fam && fam.assi) || {};
}

// Valori-assi di preset di un archetipo: 'valori' esplicito se presente, altrimenti
// derivati da 'quando' (gli assi non citati restano al default dell'utente).
function presetValori(arch) {
  if (arch.valori) return arch.valori;
  const out = {};
  for (const [axis, cond] of Object.entries(arch.quando || {})) {
    const v = presetValore(cond);
    if (v != null) out[axis] = Math.max(1, Math.min(5, v));
  }
  return out;
}

// Copia della sorgente canonica _relations.js: check() ne impone l'uguaglianza
// (anti-drift con meta_actions). Modifica _relations.js e risincronizza qui.
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

// Scrive l'inverso reciproco sui target collegati — come "Collega", ma ALLA CREAZIONE.
// Per ogni relazione tipizzata compilata (creation.fields o passo "collega ora"), aggiunge
// sul target il campo inverso (inverseRelation) che punta alla nuova nota: l'entità nasce
// agganciata al grafo in ENTRAMBE le direzioni, non solo forward. Inverso generico
// 'connessioni' se la coppia non è univoca. Salta i link che non risolvono.
async function writeInverses(core, category, name, captured) {
  const back = `[[${name}]]`;
  const add = (f, field, multi) => {
    if (multi) {
      const cur = Array.isArray(f[field]) ? f[field] : (f[field] ? [f[field]] : []);
      if (!cur.includes(back)) f[field] = [...cur, back];
    } else {
      f[field] = back;
    }
  };
  for (const rel of (core.relazioni ?? {})[category] ?? []) {
    const val = captured[rel.field];
    const links = Array.isArray(val) ? val : (val ? [val] : []);
    for (const link of links) {
      const targetName = String(link).replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0].trim();
      const tfile = app.metadataCache.getFirstLinkpathDest?.(targetName, "");
      if (!tfile || !app.fileManager?.processFrontMatter) continue;
      const targetCat = (app.metadataCache.getFileCache(tfile)?.frontmatter ?? {}).categoria;
      const recip = inverseRelation(core, rel, category, targetCat);
      await app.fileManager.processFrontMatter(tfile, (f) => {
        if (recip) add(f, recip.field, recip.multi);
        else add(f, "connessioni", true);
      });
    }
  }
}

async function runWizard(tp, template, core) {
  const category = template.category;
  const categorySpec = core.categories[category] ?? {};
  const wizard = (core.creation ?? {})[category] ?? {};

  // Il nome è sempre obbligatorio e NON vuoto: X (Escape) o invio vuoto ripetuto
  // annulla. Senza questo guard un nome vuoto creava "<cartella>/.md".
  let name = "";
  for (let attempt = 0; attempt < 3 && !name; attempt++) {
    const label = attempt ? `Nome ${template.title} — obbligatorio` : `Nome ${template.title}`;
    name = String(await tp.system.prompt(label, "", true)).trim();
  }
  if (!name) throw new Error("Nome vuoto");

  // I campi del corpo (body) sono prosa: marcali multiline (textarea nel prompt).
  const questions = [
    ...(wizard.fields ?? []),
    ...(wizard.body ?? []).map((q) => ({ ...q, multiline: true })),
  ];
  const captured = {};

  // Campi obbligatori: X annulla l'intero wizard.
  for (const q of questions.filter(q => q.required)) {
    captured[q.field] = await ask(tp, q, template, core);
  }

  // Facoltativi: l'utente sceglie se compilarli ora o dopo nella nota.
  const optional = questions.filter(q => !q.required);
  let fillNow = false;
  if (optional.length) {
    fillNow = await tp.system.suggester(
      ["Sì, compila ora", "No, li compilo dopo nella nota"],
      [true, false], false, "Compilare i campi facoltativi ora?"
    ) === true;
  }
  for (const q of optional) {
    captured[q.field] = fillNow ? await ask(tp, q, template, core) : emptyFor(q);
  }

  // Collegamenti tipizzati (relazioni della categoria): il wizard li offre ALLA
  // CREAZIONE, così l'entità nasce agganciata al grafo invece che isola (prima
  // i legami erano solo un passo manuale post-creazione: macro Collegamenti /
  // bottone Collega). Opzionali e skippabili; salta quelli già chiesti come
  // creation.fields (es. personaggio.fazione/luogo). Scrive solo i non vuoti.
  const relsToAsk = relationsToAsk((core.relazioni ?? {})[category], questions.map((q) => q.field));
  if (relsToAsk.length) {
    const connect = await tp.system.suggester(
      ["Sì, collega ora", "No, collego dopo (tab Collegamenti / Collega)"],
      [true, false], false, `Collegare ${template.title} ad altre note ora?`
    ) === true;
    if (connect) {
      for (const r of relsToAsk) {
        const val = await chooseNotes(tp, { field: r.field, prompt: r.label, category: r.category, multi: r.multi }, false);
        if (Array.isArray(val) ? val.length : val) captured[r.field] = val;
      }
    }
  }

  // Famiglia (classificazione a 2 livelli, opzionale): se la categoria ha famiglie,
  // chiedila; la famiglia scelta può pre-compilare gli assi (campo `assi`). È il
  // livello tematico "ampio"; l'archetipo sotto la rifinisce (e ha la precedenza).
  const famiglie = categorySpec.famiglie ?? [];
  let famiglia = "";
  let preFamiglia = {};
  if (famiglie.length) {
    const chosen = await tp.system.suggester(
      ["(nessuna)", ...famiglie.map((f) => f.nome)],
      [null, ...famiglie], false,
      `${categorySpec.famiglia_label ?? "Famiglia"} di ${template.title} (opzionale)`);
    if (chosen) { famiglia = chosen.nome; preFamiglia = famigliaPreset(categorySpec, chosen.nome); }
  }

  // Archetipo (opzionale): se la categoria ha un catalogo, pre-compila i valori
  // degli assi tematici + i tag 'profilo/*' coerenti. "(personalizzato)" salta.
  const archetipi = (core.archetipi ?? {})[category] ?? [];
  let preset = {};
  let profiloTags = [];
  if (archetipi.length) {
    const chosen = await tp.system.suggester(
      ["(personalizzato)", ...archetipi.map(a => a.nome)],
      [null, ...archetipi], false, `Archetipo di ${template.title} (opzionale)`);
    if (chosen) {
      preset = presetValori(chosen);
      profiloTags = (chosen.tag ?? []).map(t => `profilo/${t}`);
    }
  }

  const folderKey = categorySpec.folder ?? category;
  const folder = core.folders[folderKey] ?? core.folders[category] ?? "Inbox";
  await ensureFolder(folder);
  await tp.file.move(`${folder}/${name}`);
  // Inverso reciproco sui target (link bidirezionale alla creazione, come Collega):
  // l'entità nasce agganciata al grafo in entrambe le direzioni.
  await writeInverses(core, category, name, captured);

  const session = activeSession();
  const data = {
    id: slugify(name),
    nome: name,
    categoria: category,
    tipo: captured.tipo ?? template.default_type,
    stato: "bozza",
    mondo: captured.mondo ?? "",
    connessioni: [],
    sessioni: session ? [`[[${session.basename}]]`] : [],
    tags: ["gdr/bozza", ...profiloTags],
    ...(famiglia ? { famiglia } : {}),
    ...preFamiglia,
    ...preset,
    ...captured,
  };
  if (category === "creatura") data.statblock = "inline";
  if (category === "sessione") {
    data.attiva = false;
    data.data = tp.date.now("YYYY-MM-DD");
  }
  return frontmatter(data);
}

async function create_entity(tp, templateId = "") {
  const core = await loadCore();
  const template = core.templates.find(item => item.id === templateId);
  if (!template) throw new Error(`Template non dichiarato: ${templateId}`);
  try {
    return await runWizard(tp, template, core);
  } catch (e) {
    // X su un campo obbligatorio (throw_on_cancel) -> annulla in modo pulito.
    new Notice("Creazione annullata.");
    return frontmatter({ categoria: template.category, stato: "bozza", tags: ["gdr/bozza"] });
  }
}

create_entity.presetValori = presetValori;      // esposto per i test
create_entity.famigliaPreset = famigliaPreset;  // esposto per i test
create_entity.relationsToAsk = relationsToAsk;  // esposto per i test
create_entity.writeInverses = writeInverses;    // esposto per i test
create_entity.inverseRelation = inverseRelation; // esposto per i test
create_entity.pickMulti = pickMulti;             // esposto per i test
module.exports = create_entity;
