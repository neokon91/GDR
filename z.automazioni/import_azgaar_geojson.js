#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "Mondi", "Luoghi");

function usage() {
    console.log("Uso: npm run import:azgaar -- <file.geojson> [--world \"Nome Mondo\"] [--dry-run]");
}

function slugify(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\\/:*?\"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function yamlQuote(value) {
    return JSON.stringify(String(value ?? ""));
}

function parseArgs(argv) {
    const args = { input: "", world: "", dryRun: false };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--world") {
            args.world = argv[++i] ?? "";
        } else if (arg === "--dry-run") {
            args.dryRun = true;
        } else if (!args.input) {
            args.input = arg;
        }
    }

    return args;
}

function getName(feature, index) {
    const props = feature.properties ?? {};
    return props.name || props.Name || props.NAME || props.burg || props.state || props.label || `Luogo Azgaar ${index + 1}`;
}

function inferType(feature) {
    const props = feature.properties ?? {};
    const raw = String(props.type || props.Type || props.kind || props.layer || props.featurecla || "").toLowerCase();
    const geometry = feature.geometry?.type ?? "";

    if (raw.includes("burg") || raw.includes("town") || raw.includes("city") || raw.includes("settlement")) return "insediamento";
    if (raw.includes("state") || raw.includes("country") || raw.includes("province")) return "regione politica";
    if (raw.includes("culture")) return "regione culturale";
    if (raw.includes("religion")) return "regione religiosa";
    if (raw.includes("river")) return "fiume";
    if (raw.includes("route") || raw.includes("road")) return "rotta";
    if (geometry.includes("Polygon")) return "regione";
    if (geometry.includes("Point")) return "luogo";

    return "luogo";
}

function flattenCoords(coords, acc = []) {
    if (!Array.isArray(coords)) return acc;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        acc.push([coords[0], coords[1]]);
        return acc;
    }
    coords.forEach(item => flattenCoords(item, acc));
    return acc;
}

function bbox(feature) {
    const points = flattenCoords(feature.geometry?.coordinates ?? []);
    if (!points.length) return "";

    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys)
    ].map(n => Number(n).toFixed(6)).join(", ");
}

function firstPoint(feature) {
    const point = flattenCoords(feature.geometry?.coordinates ?? [])[0];
    return point ? point.map(n => Number(n).toFixed(6)).join(", ") : "";
}

function renderFrontmatter(profileName, values) {
    return `---\n${Object.entries(values).map(([key, value]) => `${key}: ${value}`).join("\n")}\n---\n`;
}

function noteBody({ feature, index, inputName, world }) {
    const props = feature.properties ?? {};
    const name = getName(feature, index);
    const type = inferType(feature);
    const idSource = props.id ?? props.Id ?? props.ID ?? props.i ?? index + 1;
    const coordinate = firstPoint(feature);
    const bounds = bbox(feature);

    const frontmatter = renderFrontmatter("azgaar_import", {
        id: `azgaar-${slugify(name).toLowerCase().replace(/\s+/g, "-")}`,
        nome: yamlQuote(name),
        categoria: 'luogo',
        tipo: yamlQuote(type),
        stato: 'bozza',
        canonico: 'false',
        mondo: world ? `[[${world}]]` : "",
        fonte: 'azgaar',
        file_import: yamlQuote(inputName),
        azgaar_id: yamlQuote(idSource),
        azgaar_layer: yamlQuote(props.layer ?? props.type ?? props.kind ?? ""),
        geometria: yamlQuote(feature.geometry?.type ?? ""),
        coordinate: yamlQuote(coordinate),
        bbox: yamlQuote(bounds),
        fazioni: '[]',
        culture: '[]',
        religioni: '[]',
        personaggi: '[]',
        missioni: '[]',
        segreti: '[]',
        domande_aperte: '[]'
    });

    return `${frontmatter}

# ${name}

> [!luogo] Importato Da Azgaar
> Questa nota e una bozza. Controlla nome, tipo, mondo e collegamenti prima di renderla canonica.

## Uso Nel Mondo

> [!scena] Perche e importante
>

## Dati Importati

\`\`\`json
${JSON.stringify(props, null, 2)}
\`\`\`
`;
}

function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.input) {
        usage();
        process.exitCode = 1;
        return;
    }

    const inputPath = path.resolve(ROOT, args.input);
    if (!fs.existsSync(inputPath)) {
        console.error(`File non trovato: ${args.input}`);
        process.exitCode = 1;
        return;
    }

    const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        console.error("Formato non supportato: serve un GeoJSON FeatureCollection.");
        process.exitCode = 1;
        return;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    let created = 0;
    let skipped = 0;

    data.features.forEach((feature, index) => {
        const name = slugify(getName(feature, index));
        const filename = `${name}.md`;
        const target = path.join(OUT_DIR, filename);

        if (fs.existsSync(target)) {
            skipped++;
            return;
        }

        if (!args.dryRun) {
            fs.writeFileSync(target, noteBody({
                feature,
                index,
                inputName: path.basename(inputPath),
                world: args.world
            }));
        }

        created++;
    });

    console.log(`${args.dryRun ? "Import simulato" : "Import completato"}: ${created} note, ${skipped} gia esistenti.`);
}

main();
