"""Test di PARITÀ: gli helper-regola condivisi del wizard PG del vault
(`_pg_shared.js`: `mod`/`maxAtLevel`/`risorseAtLevel`) devono restare identici alla
SPEC in `regole/creatore/risorse.ts` (`modPunteggio`/`maxAlLivello`/`risorseAlLivello`).

`regole` è la sorgente di verità delle regole; `_pg_shared.js` ne tiene una copia JS
perché i wizard sono script autonomi (niente require a runtime). Questo test lega la
copia alla spec su una batteria di input: se una delle due deriva, diventa rosso.
`sigla`/`scegliMulti` restano fuori (formato/UI, non regole).
"""

import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ESBUILD_DIR = ROOT / "plugin" / "node_modules"
RISORSE_TS = ROOT / "regole" / "src" / "creatore" / "risorse.ts"
PG_SHARED = ROOT / "Dev" / "Source" / "JS" / "_pg_shared.js"

DRIVER = r"""
const fs = require("fs");
const path = require("path");
const [, , esbuildDir, risorseTs, pgShared, outFile] = process.argv;
const esbuild = require(path.join(esbuildDir, "esbuild"));

// Batteria di input condivisa dalle due implementazioni.
const scoresBattery = [16, "16", 8, 10, 20, 7, 30, undefined, "", "abc", 0];
const tables = [
  { "1": 2, "3": 3, "6": 4 },
  { "2": 1, "5": 2 },
  {},
];
const specBattery = [
  [{ id: "ispirazione", label: "Ispirazione", caratteristica: "carisma", ricarica: "lungo" }],
  [{ id: "ira", valori: { "1": 2, "3": 3 }, ricarica: "lungo" }],
  [{ id: "ki", valori: { "2": 2 }, ricarica: "lungo", ricarica_breve_da_livello: 2 }],
  [{ id: "fisso", max: 4, icona: "star" }, { id: "vuoto", valori: { "5": 2 } }],
  [],
];

function fail(msg) { console.error("PARITY FAIL ✗ " + msg); process.exit(1); }

esbuild.build({
  entryPoints: [risorseTs], bundle: true, platform: "node", format: "cjs", outfile: outFile, logLevel: "silent",
}).then(() => {
  const R = require(outFile); // spec regole
  const src = fs.readFileSync(pgShared, "utf8");
  const m = src.match(/\/\/\s*>>>pg-shared\s*\n([\s\S]*?)\n\s*\/\/\s*<<<pg-shared/);
  if (!m) fail("blocco >>>pg-shared non trovato in _pg_shared.js");
  const J = new Function(m[1] + "\n; return { mod, maxAtLevel, risorseAtLevel };")();

  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // mod ↔ modPunteggio
  for (const v of scoresBattery) {
    if (!eq(J.mod(v), R.modPunteggio(v))) fail(`mod(${JSON.stringify(v)}): js=${J.mod(v)} regole=${R.modPunteggio(v)}`);
  }
  // maxAtLevel ↔ maxAlLivello
  for (const t of tables) for (let liv = 0; liv <= 8; liv++) {
    if (!eq(J.maxAtLevel(t, liv), R.maxAlLivello(t, liv)))
      fail(`maxAtLevel(${JSON.stringify(t)}, ${liv}): js=${J.maxAtLevel(t, liv)} regole=${R.maxAlLivello(t, liv)}`);
  }
  // risorseAtLevel ↔ risorseAlLivello
  const scoreObjs = [{ carisma: 16 }, { carisma: 8 }, {}, { carisma: "abc" }];
  for (const spec of specBattery) for (let liv = 1; liv <= 6; liv++) for (const s of scoreObjs) {
    const a = J.risorseAtLevel(spec, liv, s), b = R.risorseAlLivello(spec, liv, s);
    if (!eq(a, b)) fail(`risorseAtLevel(spec=${JSON.stringify(spec)}, liv=${liv}, scores=${JSON.stringify(s)}):\n js=${JSON.stringify(a)}\n regole=${JSON.stringify(b)}`);
  }
  console.log("PARITY OK ✓");
}).catch((e) => fail(String(e && e.message || e)));
"""


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_pg_shared_combacia_con_regole(tmp_path):
    if not ESBUILD_DIR.joinpath("esbuild").exists():
        pytest.skip("esbuild non installato (plugin/node_modules) — build del plugin non eseguita")
    if not RISORSE_TS.is_file():
        pytest.skip(f"regole/creatore/risorse.ts assente ({RISORSE_TS}) — symlink 'regole'?")
    driver = tmp_path / "parity.js"
    driver.write_text(DRIVER, encoding="utf-8")
    out = tmp_path / "risorse.cjs"
    res = subprocess.run(
        ["node", str(driver), str(ESBUILD_DIR), str(RISORSE_TS), str(PG_SHARED), str(out)],
        capture_output=True, text=True,
    )
    assert res.returncode == 0, (res.stdout + res.stderr)
    assert "PARITY OK" in res.stdout
