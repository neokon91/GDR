#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = process.cwd();
const errors = [];

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        encoding: "utf8"
    });

    return {
        status: result.status,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? ""
    };
}

const azgaarFixture = path.join("Dev", "TemplateFactory", "examples", "importers", "azgaar_sample.geojson");
const watabouCityFixture = path.join("Dev", "TemplateFactory", "examples", "importers", "watabou_city_sample.json");
const watabouDungeonFixture = path.join("Dev", "TemplateFactory", "examples", "importers", "watabou_dungeon_sample.json");
const azgaar = run("node", [
    "z.automazioni/import_azgaar_geojson.js",
    azgaarFixture,
    "--world",
    "Mondo Test",
    "--dry-run"
]);

if (azgaar.status !== 0) {
    errors.push(`import:azgaar dry-run fallito (${azgaar.stderr || azgaar.stdout})`);
} else if (!azgaar.stdout.includes("Import simulato: 2 note")) {
    errors.push(`import:azgaar dry-run output inatteso (${azgaar.stdout.trim()})`);
}

const watabouCity = run("node", [
    "z.automazioni/import_watabou_city.js",
    watabouCityFixture,
    "--world",
    "Mondo Test",
    "--dry-run"
]);

if (watabouCity.status !== 0) {
    errors.push(`import:watabou:city dry-run fallito (${watabouCity.stderr || watabouCity.stdout})`);
} else if (!watabouCity.stdout.includes("Import Watabou City simulato: 2 note")) {
    errors.push(`import:watabou:city dry-run output inatteso (${watabouCity.stdout.trim()})`);
}

const watabouDungeon = run("node", [
    "z.automazioni/import_watabou_dungeon.js",
    watabouDungeonFixture,
    "--world",
    "Mondo Test",
    "--dry-run"
]);

if (watabouDungeon.status !== 0) {
    errors.push(`import:watabou:dungeon dry-run fallito (${watabouDungeon.stderr || watabouDungeon.stdout})`);
} else if (!watabouDungeon.stdout.includes("Import Watabou Dungeon simulato: 1 note")) {
    errors.push(`import:watabou:dungeon dry-run output inatteso (${watabouDungeon.stdout.trim()})`);
}

if (errors.length) {
    console.error("Errori importer:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Importer OK: dry-run Azgaar e Watabou verificati.");
