#!/usr/bin/env node

const path = require("path");
const {
    parseImportArgs,
    readJsonInput,
    renderFrontmatter,
    slugify,
    writeNotes,
    yamlQuote
} = require("./import_map_utils");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "Mondi", "Luoghi");

function usage() {
    console.log("Uso: npm run import:azgaar -- <file.geojson> [--world \"Nome Mondo\"] [--dry-run]");
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
    const args = parseImportArgs(process.argv.slice(2));

    if (!args.input) {
        usage();
        process.exitCode = 1;
        return;
    }

    let input;
    try {
        input = readJsonInput(ROOT, args.input);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
        return;
    }

    const data = input.data;
    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        console.error("Formato non supportato: serve un GeoJSON FeatureCollection.");
        process.exitCode = 1;
        return;
    }

    const { created, skipped } = writeNotes({
        dryRun: args.dryRun,
        items: data.features,
        outDir: OUT_DIR,
        targetName: getName,
        renderItem: (feature, index) => noteBody({
            feature,
            index,
            inputName: input.inputName,
            world: args.world
        })
    });

    console.log(`${args.dryRun ? "Import simulato" : "Import completato"}: ${created} note, ${skipped} gia esistenti.`);
}

main();
