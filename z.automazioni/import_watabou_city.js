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
const LUOGHI_DIR = path.join(ROOT, "Mondi", "Luoghi");
const MAPPE_DIR = path.join(ROOT, "Risorse", "Mappe");

function usage() {
    console.log("Uso: npm run import:watabou:city -- <file.json> [--world \"Nome Mondo\"] [--session \"Sessione\"] [--dry-run]");
}

function cityName(data, inputName) {
    return String(
        data.name
        ?? data.title
        ?? data.city?.name
        ?? data.info?.name
        ?? path.basename(inputName, path.extname(inputName))
        ?? "Citta Watabou"
    ).trim();
}

function firstNumber(...values) {
    return values.find(value => Number.isFinite(Number(value))) ?? "";
}

function countArray(...values) {
    const array = values.find(value => Array.isArray(value));
    return array ? array.length : "";
}

function firstCoordinate(data) {
    const point = data.center ?? data.position ?? data.coords ?? data.coordinates ?? data.city?.center;
    if (!Array.isArray(point) || point.length < 2) return "";
    return point.slice(0, 2).map(value => Number(value).toFixed(6)).join(", ");
}

function sessionList(session) {
    return session ? `[[${session}]]` : "";
}

function renderCityPlace({ data, inputName, world, session }) {
    const name = cityName(data, inputName);
    const wards = countArray(data.wards, data.districts, data.city?.wards, data.city?.districts);
    const buildings = countArray(data.buildings, data.houses, data.city?.buildings);
    const population = firstNumber(data.population, data.info?.population, data.city?.population);
    const mapLink = `[[${name} - Mappa]]`;
    const frontmatter = renderFrontmatter("watabou_city_luogo", {
        id: `watabou-city-${slugify(name).toLowerCase().replace(/\s+/g, "-")}`,
        nome: yamlQuote(name),
        categoria: "luogo",
        fileClass: "luogo",
        tipo: "insediamento",
        sottotipo: "citta watabou",
        stato: "bozza",
        canonico: "false",
        mondo: world ? `[[${world}]]` : "",
        fonte: "watabou-city",
        file_import: yamlQuote(inputName),
        popolazione: population,
        distretti: wards,
        edifici: buildings,
        coordinate: yamlQuote(firstCoordinate(data)),
        mappa: mapLink,
        mappe: `[${mapLink}]`,
        sessioni: session ? `[${sessionList(session)}]` : "[]",
        fazioni: "[]",
        personaggi: "[]",
        missioni: "[]",
        segreti: "[]",
        domande_aperte: "[]",
        connessioni: `[${mapLink}]`
    });

    return `${frontmatter}

# ${name}

> [!luogo] Importato Da Watabou City
> Bozza di insediamento. Controlla nome, mondo, quartieri, poteri locali e collegamenti prima di renderla canonica.

## Uso Al Tavolo

> [!scena] Primo uso
>

## Dati Importati

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`;
}

function renderCityMap({ data, inputName, world, session }) {
    const name = cityName(data, inputName);
    const placeLink = `[[${name}]]`;
    const frontmatter = renderFrontmatter("watabou_city_mappa", {
        id: `watabou-city-map-${slugify(name).toLowerCase().replace(/\s+/g, "-")}`,
        nome: yamlQuote(`${name} - Mappa`),
        categoria: "mappa",
        tipo: "watabou city",
        uso: "mappa insediamento",
        stato: "bozza",
        mondo: world ? `[[${world}]]` : "",
        luogo: placeLink,
        luoghi: `[${placeLink}]`,
        fonte: "watabou-city",
        file_import: yamlQuote(inputName),
        sessioni: session ? `[${sessionList(session)}]` : "[]",
        coordinate: yamlQuote(firstCoordinate(data)),
        layer_mappa: "insediamenti",
        tipo_mappa: "citta",
        pubblico: "false",
        player_safe: "",
        segreto: "",
        connessioni: `[${placeLink}]`
    });

    return `${frontmatter}

# ${name} - Mappa

> [!mappa] Importata Da Watabou City
> Collega qui PNG, fazioni, missioni e immagini/SVG esportati da Watabou.
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

    const placeResult = writeNotes({
        dryRun: args.dryRun,
        items: [input.data],
        outDir: LUOGHI_DIR,
        targetName: data => cityName(data, input.inputName),
        renderItem: data => renderCityPlace({ data, inputName: input.inputName, world: args.world, session: args.session })
    });
    const mapResult = writeNotes({
        dryRun: args.dryRun,
        items: [input.data],
        outDir: MAPPE_DIR,
        targetName: data => `${cityName(data, input.inputName)} - Mappa`,
        renderItem: data => renderCityMap({ data, inputName: input.inputName, world: args.world, session: args.session })
    });
    const created = placeResult.created + mapResult.created;
    const skipped = placeResult.skipped + mapResult.skipped;

    console.log(`${args.dryRun ? "Import Watabou City simulato" : "Import Watabou City completato"}: ${created} note, ${skipped} gia esistenti.`);
}

main();
