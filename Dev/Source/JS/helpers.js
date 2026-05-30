const core = require("./data/core.json");

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
  const parts = String(path ?? "").split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(current)) {
      await app.vault.createFolder(current);
    }
  }
}

async function moveCurrentNote(tp, folder, name) {
  await ensureFolder(folder);
  await tp.file.move(`${folder}/${name}`);
}

function frontmatter(data) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${yamlList(value)}`);
    } else {
      lines.push(`${key}: ${yamlScalar(value)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function fileLink(file) {
  return file ? `[[${file.basename}]]` : "";
}

function activeSession() {
  return app.vault.getMarkdownFiles()
    .map(file => ({ file, fm: app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
    .filter(entry => entry.fm.categoria === "sessione" && entry.fm.stato !== "archiviata")
    .sort((a, b) => Number(b.fm.attiva === true) - Number(a.fm.attiva === true)
      || String(b.fm.data ?? "").localeCompare(String(a.fm.data ?? "")))[0]?.file ?? null;
}

async function updateFrontmatter(file, updater) {
  if (!file || !app.fileManager?.processFrontMatter) return;
  await app.fileManager.processFrontMatter(file, updater);
}

module.exports = {
  activeSession,
  choose,
  core,
  ensureFolder,
  fileLink,
  frontmatter,
  moveCurrentNote,
  prompt,
  slugify,
  updateFrontmatter,
  yamlList,
  yamlScalar
};
