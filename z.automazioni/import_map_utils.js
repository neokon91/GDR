const fs = require("fs");
const path = require("path");

function parseImportArgs(argv) {
    const args = { input: "", world: "", session: "", dryRun: false };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--world") {
            args.world = argv[index + 1] ?? "";
            index += 1;
        } else if (arg === "--session") {
            args.session = argv[index + 1] ?? "";
            index += 1;
        } else if (arg === "--dry-run") {
            args.dryRun = true;
        } else if (!args.input) {
            args.input = arg;
        }
    }

    return args;
}

function slugify(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function yamlQuote(value) {
    return JSON.stringify(String(value ?? ""));
}

function renderFrontmatter(profileNameOrValues, maybeValues) {
    const values = maybeValues ?? profileNameOrValues;
    return `---\n${Object.entries(values).map(([key, value]) => `${key}: ${value}`).join("\n")}\n---\n`;
}

function readJsonInput(root, input) {
    const inputPath = path.resolve(root, input);

    if (!fs.existsSync(inputPath)) {
        throw new Error(`File non trovato: ${input}`);
    }

    return {
        inputPath,
        inputName: path.basename(inputPath),
        data: JSON.parse(fs.readFileSync(inputPath, "utf8"))
    };
}

function writeNotes({ dryRun, items, outDir, renderItem, targetName }) {
    if (!dryRun) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    let created = 0;
    let skipped = 0;

    items.forEach((item, index) => {
        const filename = `${slugify(targetName(item, index))}.md`;
        const target = path.join(outDir, filename);

        if (fs.existsSync(target)) {
            skipped += 1;
            return;
        }

        if (!dryRun) {
            fs.writeFileSync(target, renderItem(item, index));
        }

        created += 1;
    });

    return { created, skipped };
}

module.exports = {
    parseImportArgs,
    readJsonInput,
    renderFrontmatter,
    slugify,
    writeNotes,
    yamlQuote
};
