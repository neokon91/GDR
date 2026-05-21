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
    console.log("Uso: npm run import:watabou:dungeon -- <file.json> [--world \"Nome Mondo\"] [--session \"Sessione\"] [--dry-run]");
}

function dungeonName(data, inputName) {
    return String(
        data.name
        ?? data.title
        ?? data.dungeon?.name
        ?? data.info?.name
        ?? path.basename(inputName, path.extname(inputName))
        ?? "Dungeon Watabou"
    ).trim();
}

function firstArray(...values) {
    return values.find(value => Array.isArray(value)) ?? [];
}

function rooms(data) {
    return firstArray(data.rooms, data.dungeon?.rooms, data.map?.rooms, data.levels?.[0]?.rooms);
}

function roomLines(data) {
    const entries = rooms(data);
    if (!entries.length) return "- Stanze non strutturate nel JSON o formato non riconosciuto.";

    return entries.map((room, index) => {
        const label = room.name ?? room.title ?? room.id ?? room.number ?? index + 1;
        const note = room.note ?? room.notes ?? room.description ?? "";
        return `- ${label}${note ? `: ${note}` : ""}`;
    }).join("\n");
}

function sessionList(session) {
    return session ? `[[${session}]]` : "";
}

function renderDungeon({ data, inputName, world, session }) {
    const name = dungeonName(data, inputName);
    const roomCount = rooms(data).length;
    const frontmatter = renderFrontmatter("watabou_dungeon_luogo", {
        id: `watabou-dungeon-${slugify(name).toLowerCase().replace(/\s+/g, "-")}`,
        nome: yamlQuote(name),
        categoria: "luogo",
        fileClass: "luogo",
        tipo: "dungeon",
        sottotipo: "dungeon watabou",
        stato: "bozza",
        canonico: "false",
        mondo: world ? `[[${world}]]` : "",
        fonte: "watabou-dungeon",
        file_import: yamlQuote(inputName),
        stanze: roomCount,
        pericolo: "",
        fazioni: "[]",
        personaggi: "[]",
        creature: "[]",
        incontri: "[]",
        missioni: "[]",
        mappe: "[]",
        sessioni: session ? `[${sessionList(session)}]` : "[]",
        segreti: "[]",
        indizi: "[]",
        ricompense: "[]",
        domande_aperte: "[]",
        connessioni: "[]"
    });

    return `${frontmatter}

# ${name}

> [!dungeon] Importato Da Watabou One Page Dungeon
> Bozza di dungeon. Trasforma stanze, indizi e pericoli in incontri o scene prima del tavolo.

## Stanze

${roomLines(data)}

## Incontri Da Preparare

- [ ] Definire almeno un incontro, trappola o scelta.

## Dati Importati

\`\`\`json
${JSON.stringify(data, null, 2)}
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

    const { created, skipped } = writeNotes({
        dryRun: args.dryRun,
        items: [input.data],
        outDir: OUT_DIR,
        targetName: data => dungeonName(data, input.inputName),
        renderItem: data => renderDungeon({ data, inputName: input.inputName, world: args.world, session: args.session })
    });

    console.log(`${args.dryRun ? "Import Watabou Dungeon simulato" : "Import Watabou Dungeon completato"}: ${created} note, ${skipped} gia esistenti.`);
}

main();
