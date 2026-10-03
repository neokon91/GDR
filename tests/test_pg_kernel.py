"""Il PG col LIBRETTO (Tier 3), il catalogo del kernel e la Board, headless.

Due script TypeScript del plugin, impacchettati con esbuild e lanciati con node:
`gen_catalogo.ts` costruisce il catalogo con `catalogoDa` del kernel dalla copia SRD, e
`smoke_pg.ts` crea e fa salire un PG per ogni classe con la guida del kernel, ne scrive la
nota, lo monta per la Board, fa andare e tornare le risorse, e fa lo stesso con l'homebrew. Senza node o senza esbuild
(dipendenza del plugin) i test si saltano da soli.
"""

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugin"
ESBUILD = PLUGIN / "node_modules" / ".bin" / "esbuild"

pytestmark = pytest.mark.skipif(
    not shutil.which("node") or not ESBUILD.exists() or not (ROOT / "regole").exists(),
    reason="node, esbuild del plugin o regole assenti",
)


def _lancia(script: str, tmp_path: Path, *args: str, esm: bool = False, obsidian_finto: bool = False) -> str:
    out = tmp_path / f"{Path(script).stem}.{'mjs' if esm else 'cjs'}"
    env = {**os.environ, "NODE_PATH": str(PLUGIN / "node_modules")}
    # La Board importa `obsidian`: nella prova lo sostituisce il modulo finto (DOM con jsdom).
    extra = ["--alias:obsidian=../Dev/Tools/obsidian-finto.ts", "--external:jsdom"] if esm else []
    if obsidian_finto and not esm:
        extra = ["--alias:obsidian=../Dev/Tools/obsidian-finto.ts"]
    subprocess.run([str(ESBUILD), str(ROOT / "Dev" / "Tools" / script), "--bundle", "--platform=node",
                    f"--format={'esm' if esm else 'cjs'}", "--log-level=warning", f"--outfile={out}", *extra],
                   cwd=PLUGIN, env=env, check=True, capture_output=True, text=True)
    if esm:  # jsdom si risolve dal plugin: il bundle sta in tmp, quindi un link ai suoi node_modules
        (tmp_path / "node_modules").symlink_to(PLUGIN / "node_modules")
    res = subprocess.run(["node", str(out), *args], cwd=PLUGIN, capture_output=True, text=True)
    assert res.returncode == 0, res.stderr or res.stdout
    return res.stdout


@pytest.fixture(scope="module")
def catalogo(tmp_path_factory) -> Path:
    tmp = tmp_path_factory.mktemp("catalogo")
    dest = tmp / "srd_catalogo.json"
    _lancia("gen_catalogo.ts", tmp, str(ROOT / "Dev" / "Source" / "SRD"), str(dest))
    return dest


def test_il_catalogo_del_kernel_ha_tutto_lsrd(catalogo):
    cat = json.loads(catalogo.read_text(encoding="utf-8"))
    conta = {k: len(v) for k, v in cat.items()}
    assert conta["classi"] == 12 and conta["sottoclassi"] == 12 and conta["specie"] == 9
    # Anche i talenti scritti come NOTA (.md: Abile, Allerta…): il vecchio costruttore li perdeva.
    ids = {t["id"] for t in cat["talenti"]}
    assert {"dnd.talento.abile", "dnd.talento.allerta", "dnd.talento.aggressore-selvaggio"} <= ids
    assert conta["talenti"] == 17
    # Le varianti e i parametri dei talenti, e le lingue con id corto come nel Compendio.
    iniziato = next(t for t in cat["talenti"] if t["id"] == "dnd.talento.iniziato-alla-magia")
    assert iniziato.get("scelte")
    assert "comune" in {l["id"] for l in cat["lingue"]}
    # Il prerequisito di multiclasse viene dai dati della classe.
    assert all(c.get("caratteristica_primaria") for c in cat["classi"])


def test_il_pg_col_libretto_regge_tutta_la_catena(catalogo, tmp_path):
    out = _lancia("smoke_pg.ts", tmp_path, str(catalogo))
    assert "12 classi create e salite al 5º senza mancanze" in out
    assert "multiclasse: guerriero 2 / mago 1" in out
    # L'homebrew del vault (classe, specie, background, talento, sottoclasse, incantesimi)
    # tradotto nel catalogo del kernel: si crea e sale come l'SRD.
    assert "homebrew: Lama del Vento 4, Des 17" in out


def test_la_board_e_alla_pari_con_la_plancia(catalogo, tmp_path):
    """La Board VERA del plugin (jsdom + `obsidian` finto) con un barbaro col libretto contro un
    goblin: l'Ira si accende coi suoi usi, la mischia si dichiara e offre l'attacco
    d'opportunità, a 0 PF compaiono i tiri contro morte, le risorse spese tornano sulla nota."""
    subprocess.run(["python3", str(ROOT / "Dev" / "Tools" / "gen_bestiario.py")], check=True, capture_output=True)
    dati = tmp_path / "dati"
    dati.mkdir()
    shutil.copy(catalogo, dati / "srd_catalogo.json")
    shutil.copy(PLUGIN / "data" / "srd_bestiario.json", dati / "srd_bestiario.json")
    out = _lancia("smoke_board.ts", tmp_path, str(dati), esm=True)
    assert "Ira accesa" in out and "usi 1/2" in out
    assert "attacco d'opportunità offerto" in out
    assert "tiri contro morte" in out
    assert '"usi_ira":1' in out


def test_il_ponte_con_atlas_porta_la_mappa_nel_tiro(catalogo, tmp_path):
    """Il ponte con Atlas VTT, su scene scritte dal codice vero di Atlas 0.5.0 (store e
    salvataggio suoi, `tests/fixtures/atlas/`): i token si abbinano ai combattenti per nome,
    le posizioni diventano metri (anche dalla griglia in piedi che Atlas usa di default), il
    contesto arriva al tiro: scimitarra oltre portata rifiutata, arco con un nemico addosso in
    svantaggio. Un formato più nuovo si rifiuta come fa Atlas."""
    subprocess.run(["python3", str(ROOT / "Dev" / "Tools" / "gen_bestiario.py")], check=True, capture_output=True)
    dati = tmp_path / "dati"
    dati.mkdir()
    shutil.copy(catalogo, dati / "srd_catalogo.json")
    shutil.copy(PLUGIN / "data" / "srd_bestiario.json", dati / "srd_bestiario.json")
    out = _lancia("smoke_atlas.ts", tmp_path, str(dati), str(ROOT / "tests" / "fixtures" / "atlas"), esm=False, obsidian_finto=True)
    assert "3 token abbinati per nome, da schierare: Ogre" in out
    assert "goblin 1 a 1.5 m, goblin 2 a 9 m" in out
    assert "svantaggio col nemico addosso" in out
    assert "goblin a 6 m in diagonale" in out
    assert "formati più nuovi e file estranei rifiutati" in out
