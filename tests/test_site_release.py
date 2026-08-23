"""Test GDR — site_release. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

import render
import publish_itch
import release
from _common import (
    CORE, PLUGINS, TEMPLATES, PAGES, SNAP_DIR, META_ACTIONS_JS,
    _snapshot, _env, _PG_HARNESS, _run_crea_pg,
)

# Sito dei giocatori: l'UNICO esportatore è genera_sito.js (bottone in-app; la via
# Python build_site.py è stata RITIRATA). I test guidano le sue funzioni PURE via node
# — niente filesystem: anti-spoiler e gating di rivelazione sono tutti a livello di funzione.
_GS = str(render.JS_DIR / "genera_sito.js")


def _gs(js_body):
    """Esegue `js_body` contro genera_sito.js (richiesto come `g`); ritorna il JSON su stdout."""
    src = f"const g=require({json.dumps(_GS)});\n{js_body}"
    res = subprocess.run(["node", "-e", src], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    return json.loads(res.stdout)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_site_markdown_to_html():
    """mdToHtml copre il sottoinsieme markdown delle note lore (link interni/esterni)."""
    md = ("## Titolo\n\nProsa con **grassetto**, *corsivo* e `codice`.\n\n"
          "- uno\n- due\n\nVai a [[Forte Cenere|forte]] o [esterno](https://x.io).")
    html = _gs(
        f"const md={json.dumps(md)};"
        'const link=n=>({"forte cenere":"forte-cenere.html"})[String(n).toLowerCase()]||null;'
        "process.stdout.write(JSON.stringify(g.mdToHtml(md, link, ()=>null)));")
    assert "<h2>Titolo</h2>" in html
    assert "<strong>grassetto</strong>" in html and "<em>corsivo</em>" in html
    assert "<code>codice</code>" in html
    assert "<ul><li>uno</li><li>due</li></ul>" in html
    assert '<a href="forte-cenere.html">forte</a>' in html
    assert '<a href="https://x.io" rel="noopener">esterno</a>' in html


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_site_strip_body_removes_dynamic_and_callouts():
    """stripBody toglie blocchi recintati, Templater, Meta Bind, callout (incl. GM) e
    l'H1, lasciando la sola prosa player-safe."""
    body = ("# Titolo\n\nProsa visibile.\n\n"
            "> [!segreto]- Segreto\n> contenuto top secret\n\n"
            "> [!tavolo] Uso al tavolo\n> mossa del DM\n\n"
            "```dataview\nlist\n```\n\n"
            "```gdr\nrenderEncounter\n```\n\n"
            "````tabs\n--- T\n```js-engine\nreturn x\n```\n````\n\n"
            "`INPUT[text:foo]` `VIEW[{bar}]`\n")
    out = _gs(f"process.stdout.write(JSON.stringify(g.stripBody({json.dumps(body)})));")
    assert "Prosa visibile." in out
    # `gdr` è ora IL linguaggio dei pannelli DM (blocchi ```gdr): il sito-giocatori
    # NON deve emetterne il codice grezzo (RE_FENCE spoglia ogni blocco recintato).
    for leak in ["top secret", "mossa del DM", "dataview", "js-engine", "renderEncounter",
                 "INPUT[", "VIEW[", "Titolo"]:
        assert leak not in out, leak


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_strip_body_extracts_prosa_region():
    """La prosa-giocatore vive in QUALSIASI tab (Lore, ma anche Scheda/Statblock per il
    PG): wizard_body la marca con %%prosa%%…%%/prosa%% e stripBody estrae SOLO quella.
    Tutto il resto fuori dai marcatori (statblock, tabelle, pannelli) NON trapela."""
    body = ("# `=this.nome`\n\n"
            "````tabs\n"
            "--- 📋 Scheda\n\n"
            "**Caratteristiche**\n\n| Car | Val |\n|:--|:-:|\n| FOR | 8 |\n\n```js-engine\nx\n```\n\n"
            "--- 📖 Lore\n\n"
            "%%prosa%%\n"
            "## Conflitto centrale\n> [!question]- 💡 spunto del DM\n\n"
            "La marea nera sale sotto i moli di Aster.\n\n"
            "## Vuota\n> [!question]- 💡 mai compilata\n\n"
            "%%/prosa%%\n"
            "--- 🎲 Al tavolo\n\n"
            "**⏳ Fronte** — clock `INPUT[number:clock]`\n"
            "````\n")
    out = _gs(f"process.stdout.write(JSON.stringify(g.stripBody({json.dumps(body)})));")
    assert "## Conflitto centrale" in out
    assert "La marea nera sale sotto i moli di Aster." in out
    assert "## Vuota" not in out
    for leak in ["Caratteristiche", "| Car", "| FOR", "js-engine",
                 "⏳ Fronte", "clock", "INPUT[", "spunto del DM", "%%"]:
        assert leak not in out, leak


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_strip_body_drops_empty_headings():
    """Una sezione del wizard lasciata in bianco non deve restare come titolo nudo sul
    sito. Un heading con prosa resta; uno con soli sotto-heading vuoti cade; se un
    discendente ha prosa, l'antenato resta."""
    body = ("## Piena\nHa del contenuto.\n\n"
            "## Vuota\n> [!question]- 💡 mai compilata\n\n"
            "## Genitore\n### Figlia piena\nProsa della figlia.\n\n"
            "## Genitore vuoto\n### Figlia vuota\n\n## Coda vuota\n")
    out = _gs(f"process.stdout.write(JSON.stringify(g.stripBody({json.dumps(body)})));")
    assert "## Piena" in out and "Ha del contenuto." in out
    assert "## Genitore" in out and "### Figlia piena" in out
    for gone in ["## Vuota", "## Genitore vuoto", "### Figlia vuota", "## Coda vuota"]:
        assert gone not in out, gone


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_site_is_public():
    """isPublic: le note lore sono pubbliche; `visibilita: dm`, `pubblico: false`, le
    categorie-strumento (sessione) e le note senza categoria NON escono sul sito."""
    r = _gs(
        'const c=x=>g.isPublic(x);'
        'process.stdout.write(JSON.stringify([c({categoria:"luogo"}),'
        ' c({categoria:"luogo",visibilita:"dm"}), c({categoria:"luogo",pubblico:false}),'
        ' c({categoria:"sessione"}), c({})]));')
    assert r == [True, False, False, False, False]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_page_model_no_spoiler_leak():
    """Il MODELLO di pagina (pageModel) non contiene mai i campi GM (uso_al_tavolo/
    gancio/prossima_mossa/segreto) né i tiri Dice Roller: l'anti-spoiler è a livello di
    funzione, prima ancora del rendering HTML."""
    fm = {"nome": "Cripta", "categoria": "luogo", "tipo": "rovina", "mondo": "[[Mondo X]]",
          "uso_al_tavolo": "TRAPPOLA_DM", "gancio": "AGGANCIO_DM", "prossima_mossa": "MOSSA_DM",
          "pressione": 8, "segreto": "VERITA_NASCOSTA", "clima": "gelido"}
    body = ("# Cripta\n\nUna cripta antica. Tira `dice: [[Tabella DM]]` ROLL_DM qui.\n\n"
            "> [!segreto]- Segreto\n> ALTRO_SEGRETO\n")
    model = _gs(
        f"const CORE={json.dumps(CORE)};const fm={json.dumps(fm)};const body={json.dumps(body)};"
        'process.stdout.write(JSON.stringify(g.pageModel(CORE, fm, body, "Cripta", ()=>null, ()=>null, 0)));')
    blob = json.dumps(model, ensure_ascii=False)
    assert "Una cripta antica." in blob and "gelido" in blob     # prosa e fatti player-safe presenti
    for spoiler in ["TRAPPOLA_DM", "AGGANCIO_DM", "MOSSA_DM", "VERITA_NASCOSTA", "ALTRO_SEGRETO"]:
        assert spoiler not in blob, spoiler
    assert "dice:" not in blob and "Tabella DM" not in blob


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_site_image_embed_preserves_underscores():
    """L'embed-immagine diventa `<img>` con la src INTATTA (regressione: il corsivo
    mangiava gli `_`). Gli embed di NOTE restano inerti."""
    md = "Vedi ![[mappa_del_sale.svg|Mappa]] e ![[Una Nota]] qui."
    html = _gs(
        f"const md={json.dumps(md)};"
        "const IMG=['.png','.svg','.jpg','.jpeg','.webp','.gif','.avif'];"
        "const image=n=>IMG.some(e=>String(n).toLowerCase().endsWith(e))?('media/'+String(n).split('/').pop()):null;"
        "process.stdout.write(JSON.stringify(g.mdToHtml(md, ()=>null, image)));")
    assert '<img src="media/mappa_del_sale.svg" alt="Mappa" loading="lazy">' in html
    assert "<em>" not in html                                    # underscore intatti (niente corsivo)
    assert "Una Nota" not in html                                # embed di nota: inerte, sparisce


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_reveal_rank_and_gating():
    """Tier di rivelazione ordinati (noteRevealRank/buildRevealRank): nota senza/ignoto
    → pubblico(0); build `tutto` → max. Il gate include una nota se isPublic e il suo
    tier <= livello del build (equivalente al vecchio conteggio, senza filesystem)."""
    r = _gs(
        'process.stdout.write(JSON.stringify({'
        ' n0:g.noteRevealRank({}), nS:g.noteRevealRank({rivelazione:"segreto"}),'
        ' nB:g.noteRevealRank({rivelazione:"boh"}), nI:g.noteRevealRank({rivelazione:"incontrato"}),'
        ' b0:g.buildRevealRank("pubblico"), b1:g.buildRevealRank("incontrato"),'
        ' b2:g.buildRevealRank("tutto"), bN:g.buildRevealRank(null)}));')
    assert r["n0"] == 0 and r["nS"] == 2 and r["nB"] == 0 and r["nI"] == 1
    assert r["b0"] == 0 and r["b1"] == 1 and r["b2"] == 2 and r["bN"] == 0
    # Gate progressivo: una nota di tier T esce se T <= tier del build.
    assert r["n0"] <= r["b0"] and not (r["nI"] <= r["b0"])        # pubblico: solo tier 0
    assert r["nI"] <= r["b1"] and not (r["nS"] <= r["b1"])        # incontrato: 0-1
    assert r["nS"] <= r["b2"]                                     # tutto: tutti


def test_occhi_giocatore_dashboard():
    """La dashboard «Occhi del giocatore» raggruppa per tier di rivelazione e
    rispecchia la logica di build_site (esclude visibilita-DM dai tier condivisi,
    isola il solo-DM, esclude le categorie-strumento)."""
    out = _env().get_template("occhi_giocatore.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    for header in ("Noto da subito", "Da scoprire", "Colpi di scena", "Solo DM"):
        assert header in out, header
    assert 'rivelazione = "incontrato"' in out and 'rivelazione = "segreto"' in out
    assert '!rivelazione or rivelazione = "pubblico"' in out      # untagged = pubblico
    # i tier condivisi escludono il solo-DM; il gruppo DM lo isola.
    assert '!visibilita or !contains(list("dm", "gm", "master", "privato", "segreto")' in out
    assert 'visibilita and contains(list("dm", "gm", "master", "privato", "segreto")' in out
    assert 'where !contains(list("sessione", "incontro", "insidia"), categoria)' in out
    assert "BUTTON[genera-sito]" in out                            # esporta dentro Obsidian (no terminale)


# --- Rivelazione PER-SEZIONE (callout [!rivela|tier]) ------------------------
@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_strip_body_reveal_callout():
    """Un callout `[!rivela|tier]` è svelato (contenuto → prosa) se il suo tier <=
    revealLevel; sotto resta celato. Gli altri callout sono sempre rimossi."""
    body = ("Prosa pubblica.\n\n"
            "> [!rivela|segreto]- Verità\n> IL SEGRETO.\n\n"
            "> [!rivela|incontrato] Scoperta\n> COSA SI SCOPRE.\n\n"
            "> [!nota] Normale\n> callout qualsiasi (sempre fuori).\n")
    r = _gs(
        f"const body={json.dumps(body)};"
        "process.stdout.write(JSON.stringify({s0:g.stripBody(body,0), s1:g.stripBody(body,1), s2:g.stripBody(body,2)}));")
    assert "Prosa pubblica." in r["s0"]
    assert "IL SEGRETO." not in r["s0"] and "COSA SI SCOPRE." not in r["s0"]   # livello 0: niente
    assert "COSA SI SCOPRE." in r["s1"] and "IL SEGRETO." not in r["s1"]        # livello 1: solo incontrato
    assert "### Scoperta" in r["s1"]                                            # titolo callout → heading
    assert "IL SEGRETO." in r["s2"] and "COSA SI SCOPRE." in r["s2"]            # livello 2: entrambi
    for s in (r["s0"], r["s1"], r["s2"]):
        assert "callout qualsiasi" not in s                                    # non-rivela: mai


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_page_model_section_reveal():
    """Una nota PUBBLICA con `[!rivela|segreto]`: nel modello di pagina il segreto compare
    solo a revealLevel >= 2 (la pagina esce comunque)."""
    fm = {"nome": "Rocca", "categoria": "luogo", "mondo": "[[Mondo S]]"}
    body = "# Rocca\n\nUna rocca sul fiume.\n\n> [!rivela|segreto]- Sotto\n> CRIPTA_NASCOSTA.\n"
    r = _gs(
        f"const CORE={json.dumps(CORE)};const fm={json.dumps(fm)};const body={json.dumps(body)};"
        'const at=lv=>JSON.stringify(g.pageModel(CORE, fm, body, "Rocca", ()=>null, ()=>null, lv));'
        'process.stdout.write(JSON.stringify({pub:at(0), seg:at(2)}));')
    assert "Una rocca sul fiume." in r["pub"]                 # la pagina esce sempre
    assert "CRIPTA_NASCOSTA" not in r["pub"]                  # segreto celato a livello pubblico
    assert "CRIPTA_NASCOSTA" in r["seg"]                      # svelato a livello segreto


# --- Release / distribuzione (release.py) ------------------------------------
import release  # noqa: E402


def test_release_version_matches_package():
    """release.version() legge la versione da package.json (single source)."""
    import json
    pkg = json.loads((render.ROOT / "package.json").read_text(encoding="utf-8"))
    assert release.version() == pkg["version"]


def test_release_zip_tree_excludes_local_state(tmp_path):
    """zip_tree mette tutto sotto un'unica cartella-radice ed esclude lo stato
    locale (workspace/.DS_Store/.trash) → zip pulito e riproducibile."""
    import zipfile
    src = tmp_path / "vault"
    (src / ".obsidian").mkdir(parents=True)
    (src / ".trash").mkdir()
    (src / "nota.md").write_text("x", encoding="utf-8")
    (src / ".obsidian" / "app.json").write_text("{}", encoding="utf-8")
    (src / ".obsidian" / "workspace.json").write_text("{}", encoding="utf-8")
    (src / ".DS_Store").write_text("", encoding="utf-8")
    (src / ".trash" / "vecchia.md").write_text("y", encoding="utf-8")
    zpath = tmp_path / "out.zip"
    n = release.zip_tree(src, zpath, "GDR-vault")
    names = zipfile.ZipFile(zpath).namelist()
    assert "GDR-vault/nota.md" in names and "GDR-vault/.obsidian/app.json" in names
    assert all(name.startswith("GDR-vault/") for name in names)        # radice unica
    for excl in ("workspace.json", ".DS_Store", ".trash"):
        assert not any(excl in name for name in names), excl
    assert n == 2                                                      # nota + app.json


def test_release_excludes_qa_artifacts(tmp_path):
    """Lo zip di release NON deve contenere artefatti QA/test (es. un PG di prova
    `QA_Barbaro.md`): un file di test spedito agli utenti erode fiducia. `_included` li
    scarta per pattern (case-insensitive); le note vere restano. Non distruttivo: filtra
    solo cosa si confeziona, non tocca il vault locale."""
    import zipfile
    # gate _included: scarta i pattern QA/test, tiene il resto
    for excl in ("QA_Barbaro.md", "qa_scratch.md", "tmp_appunti.md", "scena_test.md"):
        assert release._included(("Mondi", "Personaggi"), excl) is False, excl
    for keep in ("Pontebello.md", "Astaria.md", "Casa_Rossa.md"):
        assert release._included(("Mondi",), keep) is True, keep
    # integrazione: zip_tree esclude davvero il file QA dal pacchetto, tiene la nota vera
    src = tmp_path / "vault"
    (src / "Mondi" / "Personaggi").mkdir(parents=True)
    (src / "Mondi" / "Personaggi" / "QA_Barbaro.md").write_text("test", encoding="utf-8")
    (src / "Mondi" / "Personaggi" / "Eroe.md").write_text("vero", encoding="utf-8")
    zpath = tmp_path / "out.zip"
    release.zip_tree(src, zpath, "GDR-vault")
    names = zipfile.ZipFile(zpath).namelist()
    assert not any("QA_Barbaro" in name for name in names), names
    assert "GDR-vault/Mondi/Personaggi/Eroe.md" in names, names


def test_third_party_licenses_complete():
    """Attribuzione plugin: ogni plugin TERZO (plugins.yaml, non autoriale) ha
    author/repo/license e compare in THIRD-PARTY-LICENSES con licenza e link al repo. Se
    aggiungi un plugin senza questi campi, il test fallisce → ti forza a verificarne la
    licenza. I plugin AUTORIALI (autoriale:true, es. `gdr`) sono nostri → esclusi dall'elenco."""
    out = _env().get_template("third_party_licenses.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    third_party = [p for p in PLUGINS["plugins"] if not p.get("autoriale")]
    assert len(third_party) >= 18
    for p in third_party:
        for field in ("author", "repo", "license"):
            assert p.get(field), f"{p['id']}: manca '{field}' (attribuzione)"
        assert p["name"] in out and p["license"] in out
        assert f"https://github.com/{p['repo']}" in out
    # I plugin autoriali NON devono comparire in THIRD-PARTY (non sono di terzi).
    for p in PLUGINS["plugins"]:
        if p.get("autoriale"):
            assert p["name"] not in out, f"{p['id']} autoriale non deve stare in THIRD-PARTY-LICENSES"
    assert "mera aggregazione" in out                         # base legale dichiarata
    for lic in ("MIT", "GPL-3.0", "AGPL-3.0"):
        assert lic in out, lic


# --- Turnkey riproducibile: bundling dei plugin pinnati (fetch_plugins) ------
def test_critical_plugins_are_pinned():
    """Ogni plugin CRITICO da fetchare ha `repo`+`version` (bundlabile in modo
    riproducibile): senza il pin, `npm run dist` produrrebbe in silenzio uno zip senza i
    plugin essenziali. Rispecchia il gate di validate.check() e di fetch_plugins. I plugin
    AUTORIALI (autoriale:true, es. `gdr`) sono esenti: li build+installa la pipeline, non si
    fetchano."""
    import fetch_plugins
    plugins = PLUGINS["plugins"]
    fetchable_critical = [p for p in fetch_plugins.critical(plugins) if not p.get("autoriale")]
    for p in fetchable_critical:
        assert p.get("repo"), f"{p['id']}: plugin critico senza 'repo'"
        assert p.get("version"), f"{p['id']}: plugin critico senza pin 'version'"
    # I critici NON autoriali sono un sottoinsieme dei bundlati (quelli con repo+version).
    bundled_ids = {p["id"] for p in fetch_plugins.bundled(plugins)}
    assert {p["id"] for p in fetchable_critical} <= bundled_ids


def test_fetch_bundled_requires_repo_and_version():
    """bundled() seleziona SOLO i plugin con repo E version; senza version un plugin
    non è bundlato (si installa via BRAT/community al primo avvio)."""
    import fetch_plugins
    sample = [
        {"id": "pinned", "repo": "a/b", "version": "1.2.3"},
        {"id": "no-version", "repo": "a/c"},
        {"id": "no-repo", "version": "1.0.0"},
    ]
    assert [p["id"] for p in fetch_plugins.bundled(sample)] == ["pinned"]


def test_assert_critical_present_gate(tmp_path, monkeypatch):
    """assert_critical_present(): fallisce se manca il main.js di un plugin critico
    nel vault (gate pre-zip), passa quando tutti i critici hanno il codice. Senza rete."""
    import fetch_plugins
    plugins = [
        {"id": "core-a", "repo": "a/a", "version": "1", "critico": True},
        {"id": "core-b", "repo": "b/b", "version": "1", "critico": True},
        {"id": "extra", "repo": "c/c", "version": "1"},
    ]
    monkeypatch.setattr(fetch_plugins, "all_plugins", lambda: plugins)
    vault = tmp_path / "GDR-vault"
    # Solo core-a presente → manca core-b: il gate deve fallire e nominarlo.
    (vault / ".obsidian" / "plugins" / "core-a").mkdir(parents=True)
    (vault / ".obsidian" / "plugins" / "core-a" / "main.js").write_text("x", encoding="utf-8")
    assert fetch_plugins.missing_critical(vault) == ["core-b"]
    with pytest.raises(fetch_plugins.FetchError, match="core-b"):
        fetch_plugins.assert_critical_present(vault)
    # Aggiungi core-b → il gate passa.
    (vault / ".obsidian" / "plugins" / "core-b").mkdir(parents=True)
    (vault / ".obsidian" / "plugins" / "core-b" / "main.js").write_text("y", encoding="utf-8")
    assert fetch_plugins.missing_critical(vault) == []
    fetch_plugins.assert_critical_present(vault)  # non solleva


def test_prune_retired_plugins(tmp_path, monkeypatch):
    """prune_retired_plugins(): rimuove dal vault i community-plugin NON più dichiarati in
    plugins.yaml — la cartella .obsidian/plugins/<id>/ E l'id in community-plugins.json —
    lasciando intatti quelli dichiarati (incl. `gdr`). Garanzia di riproducibilità: un dist
    già costruito non tiene un plugin ritirato all'infinito (clean() preserva .obsidian)."""
    import json as _json
    import render
    vault = tmp_path / "GDR-vault"
    pdir = vault / ".obsidian" / "plugins"
    for pid in ("gdr", "dataview", "obsidian-5e-statblocks", "initiative-tracker"):
        (pdir / pid).mkdir(parents=True)
        (pdir / pid / "main.js").write_text("x", encoding="utf-8")
    cp = vault / ".obsidian" / "community-plugins.json"
    cp.write_text(_json.dumps(
        ["gdr", "dataview", "obsidian-5e-statblocks", "initiative-tracker"]), encoding="utf-8")
    monkeypatch.setattr(render, "VAULT", vault)
    plugins = {"plugins": [{"id": "gdr"}, {"id": "dataview"}]}  # FS/IT NON dichiarati

    removed = render.prune_retired_plugins(plugins)

    assert set(removed) == {"obsidian-5e-statblocks", "initiative-tracker"}
    assert (pdir / "gdr").is_dir() and (pdir / "dataview").is_dir()
    assert not (pdir / "obsidian-5e-statblocks").exists()
    assert not (pdir / "initiative-tracker").exists()
    assert _json.loads(cp.read_text(encoding="utf-8")) == ["gdr", "dataview"]
    # Idempotente: una seconda passata non ha nulla da rimuovere.
    assert render.prune_retired_plugins(plugins) == []


def test_fetch_one_idempotent_and_pin_check(tmp_path, monkeypatch):
    """fetch_one(): salta se il manifest su disco è già alla versione pinnata
    ("presente"); su versione diversa riscarica; se il manifest scaricato non
    combacia col pin (id/version) fallisce invece di bundlare il file sbagliato.
    La rete è stubata (nessun download reale)."""
    import fetch_plugins
    vault = tmp_path / "GDR-vault"
    pdir = vault / ".obsidian" / "plugins" / "demo"
    pdir.mkdir(parents=True)
    (pdir / "manifest.json").write_text('{"id":"demo","version":"1.0.0"}', encoding="utf-8")
    plugin = {"id": "demo", "repo": "a/demo", "version": "1.0.0"}
    # Già alla versione pinnata → nessuna rete, "presente".
    assert fetch_plugins.fetch_one(plugin, vault) == "presente"

    # Pin bump a 2.0.0: stub della rete che restituisce un manifest COERENTE.
    def fake_ok(url):
        if url.endswith("manifest.json"):
            return b'{"id":"demo","version":"2.0.0"}'
        if url.endswith("main.js"):
            return b"// code"
        return None  # styles.css assente (404) → opzionale
    monkeypatch.setattr(fetch_plugins, "_fetch", fake_ok)
    plugin2 = {"id": "demo", "repo": "a/demo", "version": "2.0.0"}
    assert fetch_plugins.fetch_one(plugin2, vault) == "scaricato"
    assert json.loads((pdir / "manifest.json").read_text())["version"] == "2.0.0"
    assert (pdir / "main.js").is_file() and not (pdir / "styles.css").is_file()

    # Manifest scaricato NON combacia col pin → FetchError (tag punta altrove).
    monkeypatch.setattr(fetch_plugins, "_fetch",
                        lambda url: b'{"id":"demo","version":"9.9.9"}' if url.endswith("manifest.json")
                        else b"// code")
    with pytest.raises(fetch_plugins.FetchError, match="non combacia"):
        fetch_plugins.fetch_one({"id": "demo", "repo": "a/demo", "version": "3.0.0"}, vault, force=True)


# --- Onboarding tour «Crea il tuo mondo» + libreria spunti ------------------
def test_spunti_library():
    """La libreria spunti (core.spunti) copre le categorie d'avvio, ognuna con
    almeno 3 domande-stimolo."""
    spunti = CORE.get("spunti", {})
    for cat in ("mondo", "luogo", "fazione", "cultura", "divinita", "regno",
                "specie", "evento", "personaggio"):
        assert spunti.get(cat) and len(spunti[cat]) >= 3, cat


def test_tour_crea_il_tuo_mondo():
    """Il tour «Crea il tuo mondo»: 5 tappe, bottoni Crea, spunti reali pescati
    da core.spunti, e i link ai cruscotti (lore→tavolo)."""
    tour = _env().get_template("crea_il_tuo_mondo.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    for b in ("crea-mondo", "crea-luogo", "crea-fazione"):
        assert f"BUTTON[{b}]" in tour, b
    assert CORE["spunti"]["mondo"][0] in tour          # pesca davvero gli spunti
    for link in ("[[Fronti]]", "[[Rete del mondo]]", "[[Occhi del giocatore]]"):
        assert link in tour, link
    for step in ("1 ·", "2 ·", "3 ·", "4 ·", "5 ·"):
        assert step in tour, step


# --- World Board (Obsidian Canvas) ------------------------------------------
@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_world_board_runtime_e2e(tmp_path):
    """world_board (azione runtime, mock Obsidian): enumera le note del mondo scelto
    (la nota-mondo + ogni nota col suo `mondo`), costruisce il canvas e lo SCRIVE
    accanto alla nota-mondo. Con un solo mondo non serve il suggester. Verifica
    card-per-nota, archi tipizzati e percorso del file."""
    core = {
        "categories": {"mondo": {}, "luogo": {}, "fazione": {}},
        "relazioni": {"luogo": [{"field": "controllata_da", "label": "Controllata da", "category": "fazione"}]},
        "canvas_colors": {"luogo": "4", "fazione": "1"},
    }
    harness = tmp_path / "wb_rt.js"
    harness.write_text(
        f'const CORE={json.dumps(core, ensure_ascii=False)};\n'
        'const files=[\n'
        '  {basename:"Eldoria", path:"Mondi/Eldoria/Eldoria.md", parent:{path:"Mondi/Eldoria"}},\n'
        '  {basename:"Capitale", path:"Mondi/Eldoria/Capitale.md", parent:{path:"Mondi/Eldoria"}},\n'
        '  {basename:"Gilda", path:"Mondi/Eldoria/Gilda.md", parent:{path:"Mondi/Eldoria"}},\n'
        '  {basename:"Estraneo", path:"Mondi/Altro/Estraneo.md", parent:{path:"Mondi/Altro"}},\n'
        '];\n'
        'const fmByPath={\n'
        '  "Mondi/Eldoria/Eldoria.md":{categoria:"mondo"},\n'
        '  "Mondi/Eldoria/Capitale.md":{categoria:"luogo", mondo:"[[Eldoria]]", controllata_da:"[[Gilda]]"},\n'
        '  "Mondi/Eldoria/Gilda.md":{categoria:"fazione", mondo:"[[Eldoria]]"},\n'
        '  "Mondi/Altro/Estraneo.md":{categoria:"luogo", mondo:"[[Altro]]"},\n'
        '};\n'
        'let saved=null, savedPath=null;\n'
        'global.Notice=class{constructor(m){}};\n'
        'global.app={\n'
        '  vault:{\n'
        '    getMarkdownFiles:()=>files,\n'
        '    adapter:{read:async()=>JSON.stringify(CORE)},\n'
        '    getAbstractFileByPath:()=>null,\n'
        '    create:async(p,t)=>{savedPath=p; saved=t; return {path:p};},\n'
        '    modify:async()=>{},\n'
        '  },\n'
        '  metadataCache:{\n'
        '    getFileCache:(f)=>({frontmatter:fmByPath[f.path]||{}}),\n'
        '    getFirstLinkpathDest:(name)=>({basename:String(name).split("/").pop()}),\n'
        '  },\n'
        '  workspace:{getActiveFile:()=>null, getLeaf:()=>({openFile:async()=>{}})},\n'
        '};\n'
        f'const wb=require({json.dumps(str(render.JS_DIR / "world_board.js"))});\n'
        'wb({config:{}}).then(()=>process.stdout.write(JSON.stringify({path:savedPath, board:JSON.parse(saved)})));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["path"] == "Mondi/Eldoria/Eldoria — Board.canvas"   # accanto alla nota-mondo
    files_nodes = [n for n in out["board"]["nodes"] if n["type"] == "file"]
    names = {n["file"].split("/")[-1] for n in files_nodes}
    assert names == {"Eldoria.md", "Capitale.md", "Gilda.md"}      # mondo + sue note, NON l'estraneo
    edges = out["board"]["edges"]
    assert len(edges) == 1 and edges[0]["label"] == "Controllata da"  # relazione tipizzata


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_bastione_resolver_puro(tmp_path):
    """meta_actions.rollInline tira i dadi inline (NdM, ×K, ±B) lasciando l'etichetta;
    resolveTurno parsa «Struttura | Ordine | esito» e risolve gli esiti. RNG iniettato
    → deterministico. License-safe: ordini/esiti sono autoriali, l'azione fa i conti."""
    harness = tmp_path / "bast.js"
    harness.write_text(
        f'const meta=require({json.dumps(META_ACTIONS_JS)});\n'
        'const zero=()=>0, hi=()=>0.99;\n'
        'const out={\n'
        '  min:meta.rollInline("1d6 lingotti", zero),\n'           # 1 -> "1 lingotti"
        '  mult:meta.rollInline("1d4×10 mo", hi),\n'               # (3+1)*10 -> "40 mo"
        '  modd:meta.rollInline("2d6+1 difensori", zero),\n'       # (1+1)+1 -> "3 difensori"
        '  nodice:meta.rollInline("un appunto sul nemico", zero),\n'
        '  turno:meta.resolveTurno(["Fucina | Fabbricare | 1d6 lingotti","Biblioteca | Ricercare | appunto"], zero),\n'
        '};\n'
        'process.stdout.write(JSON.stringify(out));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["min"] == "1 lingotti"
    assert out["mult"] == "40 mo"
    assert out["modd"] == "3 difensori"
    assert out["nodice"] == "un appunto sul nemico"          # nessun dado -> invariato
    assert out["turno"] == [
        {"struttura": "Fucina", "ordine": "Fabbricare", "esito": "1 lingotti"},
        {"struttura": "Biblioteca", "ordine": "Ricercare", "esito": "appunto"}]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_bastione_turno_e2e(tmp_path):
    """meta_actions.turno_bastione risolve un turno dalle `ordini` dichiarate (mock
    Obsidian): numera il turno (turni+1), tira gli esiti e scrive un blocco datato
    nel *Registro dei turni*, aggiornando il frontmatter `turni`/`ultimo_turno`."""
    harness = tmp_path / "turno.js"
    harness.write_text(
        'const body="# Forte Cenere\\n\\n## Registro dei turni\\n";\n'
        'const fm={categoria:"bastione", turni:2, ordini:["Fucina | Fabbricare | 1d6 lingotti","Caserma | Reclutare | 1d4 difensori"]};\n'
        'let saved=null;\n'
        'global.Notice=class{constructor(m){}};\n'
        'const file={basename:"Forte Cenere", path:"Mondi/Bastioni/Forte Cenere.md"};\n'
        'global.app={\n'
        '  workspace:{getActiveFile:()=>file},\n'
        '  metadataCache:{getFileCache:()=>({frontmatter:fm})},\n'
        '  vault:{read:async()=>body, modify:async(f,d)=>{saved=d;}},\n'
        '  fileManager:{processFrontMatter:async(f,fn)=>{fn(fm);}},\n'
        '};\n'
        'const tp={date:{now:()=>"2026-06-04"}};\n'
        f'const meta=require({json.dumps(META_ACTIONS_JS)});\n'
        'meta(tp,"turno_bastione").then(()=>process.stdout.write(JSON.stringify({saved, turni:fm.turni, ultimo:fm.ultimo_turno})));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["turni"] == 3 and out["ultimo"] == "2026-06-04"   # turno numerato + datato
    saved = out["saved"]
    assert "**Turno 3**" in saved
    assert "**Fucina** → *Fabbricare*" in saved
    assert "**Caserma** → *Reclutare*" in saved
    assert "- **2026-06-04** — **Turno 3**" in saved            # voce datata nel Registro
    assert saved.count("## Registro dei turni") == 1            # niente heading duplicato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_publish_itch_helpers(monkeypatch):
    """resolve_target(): env ITCH_TARGET ha precedenza; version() da package.json."""
    monkeypatch.setenv("ITCH_TARGET", "tizio/gdr")
    assert publish_itch.resolve_target() == "tizio/gdr"
    import json as _json
    pkg = _json.loads((render.ROOT / "package.json").read_text(encoding="utf-8"))
    assert publish_itch.version() == pkg["version"]
    # Solo il canale vault: il sito non è più un artefatto di release (in-app via genera_sito.js).
    assert {c for c, _ in publish_itch.CHANNELS} == {"vault"}


def test_callout_appearance_css_bare_icons():
    """Aspetto callout in gdr.css: --callout-icon col nome Lucide NUDO (senza
    'lucide-'), l'unico formato accettato dalla variabile CSS nativa (verificato
    in-app). L'infobox: solo icona (il colore viene dall'accento-categoria)."""
    css = render.callout_appearance_css(PLUGINS)
    assert '.callout[data-callout="tavolo"] {' in css
    assert "--callout-icon: swords;" in css
    assert "lucide-" not in css                          # mai il prefisso nella CSS var
    assert "--callout-color: 201, 64, 64;" in css
    assert "--callout-icon: scroll-text;" in css         # infobox
    assert '--callout-color' not in css.split('data-callout="infobox"')[1].split('}')[0]


# --- Note modulari: catalogo componenti a richiesta + inserimento ------------
def test_componenti_catalog_generation():
    """Catalogo componenti (componenti.yaml → render.write_componenti): applicabilità
    corretta per categoria — 'tavolo'/'vista' sempre, 'clock' solo ai fronti,
    'carattere' solo con assi, 'cronologia' solo alle tappe — e ogni blocco reso non
    è vuoto e porta il contenuto atteso della sua macro."""
    catalog = render.load_yaml("componenti.yaml")["componenti"]
    by_id = {c["id"]: c for c in catalog}
    assert {"tavolo", "clock", "carattere", "cronologia", "vista"} <= set(by_id)
    # Applicabilità (segnali di core): fazione è fronte, bioma no; luogo è tappe.
    assert render._component_applies(by_id["clock"], "fazione", CORE)
    assert not render._component_applies(by_id["clock"], "bioma", CORE)
    assert render._component_applies(by_id["cronologia"], "luogo", CORE)
    assert not render._component_applies(by_id["cronologia"], "bioma", CORE)
    assert render._component_applies(by_id["tavolo"], "bioma", CORE)      # sempre
    # 'mappa' via `categorie` esplicite: geografiche che non la bakeano (regno/bioma sì,
    # luogo no — la incorpora nel suo tab Spazio).
    assert render._component_applies(by_id["mappa"], "regno", CORE)
    assert render._component_applies(by_id["mappa"], "bioma", CORE)
    assert not render._component_applies(by_id["mappa"], "luogo", CORE)
    # Ogni componente ha una `desc` (mostrata nel picker "label — desc").
    for c in catalog:
        assert c.get("desc"), c["id"]
    # Rendering non vuoto + marker della macro.
    env = render.jinja_env()
    tav = render._render_component(env, by_id["tavolo"], CORE, PLUGINS, "fazione")
    assert tav.strip() and "Condivisione coi giocatori" in tav
    clk = render._render_component(env, by_id["clock"], CORE, PLUGINS, "fazione")
    assert "renderClock" in clk
    # 'mappa' rende il pannello renderMap per una categoria geografica.
    mp = render._render_component(env, by_id["mappa"], CORE, PLUGINS, "regno")
    assert "renderMap" in mp


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_apply_component_idempotent(tmp_path):
    """meta_actions.applyComponent: appende il blocco in fondo alla nota; se il marker
    (l'heading del componente) è già presente NON duplica (idempotente)."""
    harness = tmp_path / "comp.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(META_ACTIONS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const A=m.exports.applyComponent;'
        'const base="# Nota\\n\\ncorpo\\n";'
        'const once=A(base,"## AT\\nblocco","## AT");'
        'const twice=A(once,"## AT\\nblocco","## AT");'
        'process.stdout.write(JSON.stringify({once,eq:once===twice,'
        ' count:(once.match(/## AT/g)||[]).length}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "## AT" in out["once"] and "corpo" in out["once"]   # append, non sovrascrive
    assert out["eq"] is True                                   # secondo insert = no-op
    assert out["count"] == 1                                   # nessun doppione
