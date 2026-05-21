#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");

const COMMANDS = {
    azgaar: "import_azgaar_geojson.js",
    "watabou-city": "import_watabou_city.js",
    city: "import_watabou_city.js",
    "watabou-dungeon": "import_watabou_dungeon.js",
    dungeon: "import_watabou_dungeon.js"
};

function usage() {
    console.log([
        "Uso: npm run import:map -- <azgaar|watabou-city|watabou-dungeon> <file> [opzioni]",
        "",
        "Esempi:",
        "  npm run import:map -- azgaar export.geojson --world \"Mondo\" --dry-run",
        "  npm run import:map -- watabou-city city.json --session \"Sessione\"",
        "  npm run import:map -- watabou-dungeon dungeon.json --dry-run"
    ].join("\n"));
}

function main(argv) {
    const [kind, ...rest] = argv;
    const script = COMMANDS[kind];

    if (!script) {
        usage();
        process.exitCode = 1;
        return;
    }

    const result = spawnSync(process.execPath, [path.join(__dirname, script), ...rest], {
        cwd: process.cwd(),
        stdio: "inherit"
    });

    process.exitCode = result.status ?? 1;
}

main(process.argv.slice(2));
