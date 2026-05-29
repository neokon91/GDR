const { execFileSync } = require("child_process");
const { repoPath } = require("./node_utils");

const BOUNDARY = "Dev/Source/YAML/quality/release_boundary.yaml";
const RELEASE_FOLDER_NOTES_RENDERER = "Dev/Tools/python/render_release_folder_notes.py";
const renderedCache = new Map();

function loadYaml(root, relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(root, relPath)], {
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function loadReleaseBoundary(root) {
    return loadYaml(root, BOUNDARY);
}

function materializedUserFiles(root) {
    return loadReleaseBoundary(root).materialized_user_files ?? [];
}

function materializedUserFileMap(root) {
    return new Map(materializedUserFiles(root).map(file => [String(file.path ?? "").replace(/\\/g, "/"), file]));
}

function renderedMaterializedUserFiles(root) {
    if (renderedCache.has(root)) return renderedCache.get(root);
    const stdout = execFileSync("python3", [RELEASE_FOLDER_NOTES_RENDERER, "--json"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
        maxBuffer: 4 * 1024 * 1024
    });
    const rendered = JSON.parse(stdout);
    renderedCache.set(root, rendered);
    return rendered;
}

function renderMaterializedUserFile(file, workflows = {}) {
    void workflows;
    const root = process.cwd();
    const relPath = String(file.path ?? "").replace(/\\/g, "/");
    return renderedMaterializedUserFiles(root)[relPath] ?? "";
}

module.exports = {
    loadReleaseBoundary,
    materializedUserFileMap,
    materializedUserFiles,
    renderedMaterializedUserFiles,
    renderMaterializedUserFile
};
