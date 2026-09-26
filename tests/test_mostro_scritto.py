"""Uno statblock scritto a mano nel vault arriva al motore in forma canonica.

La tolleranza (alias inglese `ac`, CA in prosa «19 (25 con …)») stava nel motore di regole
finché le due copie del motore non sono state riunificate nel kernel (set 2026): il kernel
legge un canonico solo, e la tolleranza è passata al confine dell'input, in
`plugin/adapters.ts` (`canonizzaMostroScritto`). Questi erano i test del kernel; seguono il
codice che verificano.
"""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ESBUILD = ROOT / "plugin" / "node_modules" / "esbuild"

pytestmark = pytest.mark.skipif(
    not (shutil.which("node") and ESBUILD.is_dir() and (ROOT / "regole").is_dir()),
    reason="serve node, esbuild del plugin e il symlink 'regole'",
)

ENTRATA = """
import { canonizzaMostroScritto } from "%(adapters)s";
import { daMostro } from "%(combattente)s";
const casi = JSON.parse(process.argv[2]);
console.log(JSON.stringify(casi.map((m) => ({ ca: daMostro(canonizzaMostroScritto(m)).ca, dato: canonizzaMostroScritto(m).ca }))));
"""


def _esegui(tmp_path, mostri):
    entrata = tmp_path / "entrata.ts"
    entrata.write_text(ENTRATA % {
        "adapters": str(ROOT / "plugin" / "adapters.ts"),
        "combattente": str(ROOT / "regole" / "src" / "motore" / "combattente.ts"),
    })
    uscita = tmp_path / "entrata.cjs"
    build = (
        f"require({json.dumps(str(ESBUILD))}).buildSync({{entryPoints: [{json.dumps(str(entrata))}], "
        f"bundle: true, platform: 'node', format: 'cjs', outfile: {json.dumps(str(uscita))}, logLevel: 'silent'}})"
    )
    subprocess.run(["node", "-e", build], check=True, cwd=ROOT / "plugin")
    res = subprocess.run(["node", str(uscita), json.dumps(mostri)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    return json.loads(res.stdout)


def test_la_ca_dall_alias_inglese_ac(tmp_path):
    [r] = _esegui(tmp_path, [{"nome": "X", "ac": {"valore": 14}}])
    assert r["ca"] == 14


def test_una_ca_in_prosa_da_il_numero_e_tiene_la_frase_in_nota(tmp_path):
    [r] = _esegui(tmp_path, [{"nome": "X", "ca": {"valore": "19 (25 con Ira della Natura)"}}])
    assert r["ca"] == 19
    assert r["dato"] == {"valore": 19, "variabile": True, "nota": "19 (25 con Ira della Natura)"}


def test_una_ca_canonica_passa_com_e(tmp_path):
    [r] = _esegui(tmp_path, [{"nome": "X", "ca": {"valore": 15, "nota": "armatura naturale"}}])
    assert r["ca"] == 15 and r["dato"] == {"valore": 15, "nota": "armatura naturale"}
