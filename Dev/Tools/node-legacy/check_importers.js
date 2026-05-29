#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const { execFileSync, spawnSync } = require("child_process");
const path = require("path");

const ROOT = process.cwd();
const FIXTURE_SOURCE = path.join("Dev", "Source", "YAML", "quality", "importer_fixtures.yaml");
const errors = [];

function loadYamlFixture() {
    try {
        const script = [
            "import json, sys, yaml",
            "with open(sys.argv[1], encoding='utf-8') as handle:",
            "    data = yaml.safe_load(handle) or {}",
            "print(json.dumps(data, ensure_ascii=False))"
        ].join("\n");
        const stdout = execFileSync("python3", ["-c", script, path.join(ROOT, FIXTURE_SOURCE)], {
            encoding: "utf8",
            maxBuffer: 1024 * 1024
        });
        return JSON.parse(stdout);
    } catch (error) {
        errors.push(`${FIXTURE_SOURCE}: YAML fixture importer non leggibile (${error.message})`);
        return {};
    }
}

function writeJsonFixture(tempDir, filename, data, key) {
    if (data === undefined) {
        errors.push(`${FIXTURE_SOURCE}: fixture mancante (${key})`);
        return null;
    }
    const target = path.join(tempDir, filename);
    fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    return target;
}

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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gdr-importers-"));

try {
    const source = loadYamlFixture();
    const fixtures = source.fixtures ?? {};
    const azgaarFixture = writeJsonFixture(tempDir, "azgaar_sample.geojson", fixtures.azgaar, "azgaar");
    const watabouCityFixture = writeJsonFixture(tempDir, "watabou_city_sample.json", fixtures.watabou_city, "watabou_city");
    const watabouDungeonFixture = writeJsonFixture(tempDir, "watabou_dungeon_sample.json", fixtures.watabou_dungeon, "watabou_dungeon");

    if (!errors.length) {
        const azgaar = run("node", [
            "Dev/Tools/node-legacy/import_azgaar_geojson.js",
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
            "Dev/Tools/node-legacy/import_watabou_city.js",
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
            "Dev/Tools/node-legacy/import_watabou_dungeon.js",
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

        const dispatch = run("node", [
            "Dev/Tools/node-legacy/import_map.js",
            "azgaar",
            azgaarFixture,
            "--world",
            "Mondo Test",
            "--dry-run"
        ]);

        if (dispatch.status !== 0) {
            errors.push(`import:map dry-run fallito (${dispatch.stderr || dispatch.stdout})`);
        } else if (!dispatch.stdout.includes("Import simulato: 2 note")) {
            errors.push(`import:map dry-run output inatteso (${dispatch.stdout.trim()})`);
        }
    }
} finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
}

if (errors.length) {
    console.error("Errori importer:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Importer OK: dry-run Azgaar, Watabou e dispatch import:map verificati.");
