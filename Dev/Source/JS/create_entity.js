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

async function chooseNotes(tp, question) {
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
    const typed = await prompt(tp, `${question.prompt} (nessuna nota: digita il nome)`);
    return typed ? `[[${typed}]]` : "";
  }
  const items = question.optional ? ["(nessuno)", ...files.map(f => f.basename)] : files.map(f => f.basename);
  const values = question.optional ? [null, ...files] : files;
  const choice = await tp.system.suggester(items, values, false, question.prompt);
  return choice ? `[[${choice.basename}]]` : "";
}

async function ask(tp, question, template, core) {
  switch (question.from) {
    case "subtypes": {
      const subs = core.categories[template.category]?.subtypes ?? [template.default_type];
      return choose(tp, subs, question.prompt, template.default_type);
    }
    case "list":
      return choose(tp, question.options ?? [], question.prompt);
    case "notes":
      return chooseNotes(tp, question);
    default:
      return prompt(tp, question.prompt, question.default ?? "");
  }
}

async function create_entity(tp, templateId = "") {
  const core = await loadCore();
  const template = core.templates.find(item => item.id === templateId);
  if (!template) throw new Error(`Template non dichiarato: ${templateId}`);

  const category = template.category;
  const categorySpec = core.categories[category] ?? {};
  const wizard = (core.creation ?? {})[category] ?? {};

  const name = await prompt(tp, `Nome ${template.title}`);

  const captured = {};
  for (const question of [...(wizard.fields ?? []), ...(wizard.body ?? [])]) {
    captured[question.field] = await ask(tp, question, template, core);
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
  if (category === "sessione") {
    data.attiva = false;
    data.data = tp.date.now("YYYY-MM-DD");
  }

  return frontmatter(data);
}

module.exports = create_entity;
