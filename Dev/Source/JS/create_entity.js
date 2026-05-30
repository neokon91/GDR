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

// req = obbligatorio: throw_on_cancel=true, premere X (Escape) lancia un'eccezione
// che ferma il wizard. Per i facoltativi (req=false) X salta solo quel campo.
async function chooseNotes(tp, question, req) {
  const files = notesByCategory(question.category);
  if (question.multi) {
    const picked = [];
    const pool = [...files];
    while (pool.length) {
      const label = `${question.prompt}${picked.length ? ` — scelti ${picked.length}` : ""}`;
      const choice = await tp.system.suggester(["(fine)", ...pool.map(f => f.basename)], [null, ...pool], false, label);
      if (!choice) break;
      picked.push(`[[${choice.basename}]]`);
      pool.splice(pool.indexOf(choice), 1);
    }
    return picked;
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
      const v = await tp.system.suggester(opts, opts, req, question.prompt);
      return String(v ?? "");
    }
    case "notes":
      return chooseNotes(tp, question, req);
    default: {
      const v = await tp.system.prompt(question.prompt, question.default ?? "", req);
      return String(v ?? "").trim();
    }
  }
}

function emptyFor(question) {
  return question.multi ? [] : "";
}

async function runWizard(tp, template, core) {
  const category = template.category;
  const categorySpec = core.categories[category] ?? {};
  const wizard = (core.creation ?? {})[category] ?? {};

  // Il nome è sempre obbligatorio: X qui annulla la creazione.
  const name = String(await tp.system.prompt(`Nome ${template.title}`, "", true)).trim();

  const questions = [...(wizard.fields ?? []), ...(wizard.body ?? [])];
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

  const folderKey = categorySpec.folder ?? category;
  const folder = core.folders[folderKey] ?? core.folders[category] ?? "Inbox";
  await ensureFolder(folder);
  await tp.file.move(`${folder}/${name}`);

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
    tags: ["gdr/bozza"],
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

module.exports = create_entity;
