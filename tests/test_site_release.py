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
import build_site
import publish_itch
import release
from _common import (
    CORE, PLUGINS, TEMPLATES, PAGES, SNAP_DIR, META_ACTIONS_JS,
    _snapshot, _env, _PG_HARNESS, _run_crea_pg,
)


def test_site_markdown_to_html():
    """Il convertitore Markdown→HTML copre il sottoinsieme delle note lore."""
    md = ("## Titolo\n\nProsa con **grassetto**, *corsivo* e `codice`.\n\n"
          "- uno\n- due\n\nVai a [[Forte Cenere|forte]] o [esterno](https://x.io).")
    links = {"forte cenere": "forte-cenere.html"}
    html = build_site.markdown_to_html(md, lambda n: links.get(n.lower()))
    assert "<h2>Titolo</h2>" in html
    assert "<strong>grassetto</strong>" in html and "<em>corsivo</em>" in html
    assert "<code>codice</code>" in html
    assert "<ul><li>uno</li><li>due</li></ul>" in html
    assert '<a href="forte-cenere.html">forte</a>' in html
    assert '<a href="https://x.io" rel="noopener">esterno</a>' in html


def test_site_strip_body_removes_dynamic_and_callouts():
    """strip_body toglie blocchi recintati, Templater, Meta Bind, callout (incl.
    GM) e l'H1, lasciando la sola prosa player-safe."""
    body = ("# Titolo\n\nProsa visibile.\n\n"
            "> [!segreto]- Segreto\n> contenuto top secret\n\n"
            "> [!tavolo] Uso al tavolo\n> mossa del DM\n\n"
            "```dataview\nlist\n```\n\n"
            "````tabs\n--- T\n```js-engine\nreturn x\n```\n````\n\n"
            "`INPUT[text:foo]` `VIEW[{bar}]`\n")
    out = build_site.strip_body(body)
    assert "Prosa visibile." in out
    for leak in ["top secret", "mossa del DM", "dataview", "js-engine", "INPUT[", "VIEW[", "Titolo"]:
        assert leak not in out, leak


def test_strip_body_extracts_prosa_region():
    """La prosa-giocatore vive in QUALSIASI tab del layout (Lore, ma anche Scheda/Statblock
    per il PG): wizard_body la marca con %%prosa%%…%%/prosa%% e strip_body estrae SOLO quella.
    Così la prosa raggiunge il sito ovunque sia, e tutto il resto fuori dai marcatori
    (statblock, tabelle, righe-etichetta, pannelli) NON trapela — anche se viene PRIMA."""
    body = ("# `=this.nome`\n\n"
            "````tabs\n"
            "--- 📋 Scheda\n\n"                                # tab PRIMA della prosa (come il PG)
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
    out = build_site.strip_body(body)
    assert "## Conflitto centrale" in out                      # heading della prosa marcata
    assert "La marea nera sale sotto i moli di Aster." in out  # prosa → sito
    assert "## Vuota" not in out                               # sezione vuota → droppata
    for leak in ["Caratteristiche", "| Car", "| FOR", "js-engine",   # tab Scheda (fuori marcatori)
                 "⏳ Fronte", "clock", "INPUT[", "spunto del DM", "%%"]:  # chrome / marcatori
        assert leak not in out, leak


def test_strip_body_drops_empty_headings():
    """Una sezione del wizard lasciata in bianco (heading + solo spunto-callout, poi
    strippato) non deve restare come titolo nudo sul sito. Un heading con prosa resta;
    uno con soli sotto-heading vuoti cade; se un discendente ha prosa, l'antenato resta."""
    body = ("## Piena\nHa del contenuto.\n\n"
            "## Vuota\n> [!question]- 💡 mai compilata\n\n"
            "## Genitore\n### Figlia piena\nProsa della figlia.\n\n"
            "## Genitore vuoto\n### Figlia vuota\n\n## Coda vuota\n")
    out = build_site.strip_body(body)
    assert "## Piena" in out and "Ha del contenuto." in out
    assert "## Genitore" in out and "### Figlia piena" in out  # antenato di prosa → resta
    for gone in ["## Vuota", "## Genitore vuoto", "### Figlia vuota", "## Coda vuota"]:
        assert gone not in out, gone


def test_site_is_public():
    assert build_site.is_public({"categoria": "luogo"})
    assert not build_site.is_public({"categoria": "luogo", "visibilita": "dm"})
    assert not build_site.is_public({"categoria": "luogo", "pubblico": False})
    assert not build_site.is_public({"categoria": "sessione"})  # log/strumento DM
    assert not build_site.is_public({})  # senza categoria


def test_build_site_no_spoiler_leak(tmp_path):
    """Integrazione: il sito generato NON contiene mai campi GM (uso_al_tavolo/
    gancio/prossima_mossa/pressione/segreto), esclude le note `visibilita: dm`, e
    scrive index.html + site.css."""
    nd = tmp_path / "vault" / "Mondi" / "Mondo X"
    nd.mkdir(parents=True)
    (nd / "Cripta.md").write_text(
        "---\nnome: Cripta\ncategoria: luogo\ntipo: rovina\nmondo: '[[Mondo X]]'\n"
        "uso_al_tavolo: TRAPPOLA_DM\ngancio: AGGANCIO_DM\nprossima_mossa: MOSSA_DM\n"
        "pressione: 8\nsegreto: VERITA_NASCOSTA\nclima: gelido\n---\n\n"
        "# Cripta\n\nUna cripta antica. Tira `dice: [[Tabella DM]]` ROLL_DM qui.\n\n"
        "> [!segreto]- Segreto\n> ALTRO_SEGRETO\n",
        encoding="utf-8")
    (nd / "Privata.md").write_text(
        "---\nnome: Privata\ncategoria: luogo\nvisibilita: dm\nmondo: '[[Mondo X]]'\n---\n\nNON_DEVE_USCIRE\n",
        encoding="utf-8")
    out = tmp_path / "site"
    n = build_site.build_site(CORE, tmp_path / "vault", out)
    assert n == 1  # Privata (visibilita: dm) esclusa
    blob = "\n".join(p.read_text(encoding="utf-8") for p in out.glob("*.html"))
    assert "Una cripta antica." in blob and "gelido" in blob
    for spoiler in ["TRAPPOLA_DM", "AGGANCIO_DM", "MOSSA_DM", "VERITA_NASCOSTA", "ALTRO_SEGRETO", "NON_DEVE_USCIRE"]:
        assert spoiler not in blob, spoiler
    assert "dice:" not in blob and "Tabella DM" not in blob  # i tiri Dice Roller (DM) non trapelano (P3)
    assert (out / "index.html").is_file() and (out / "site.css").is_file()


# --- Mappa mondo-esempio + asset sito ---------------------------------------
def test_site_image_embed_preserves_underscores():
    """L'embed-immagine diventa `<img>` con la src INTATTA (regressione: il filtro
    corsivo mangiava gli `_` dentro src/alt). Gli embed di NOTE restano inerti."""
    resolved = {}

    def image(name):
        if Path(name).suffix.lower() in build_site._IMG_EXT:
            resolved[name] = f"media/{Path(name).name}"
            return resolved[name]
        return None

    md = "Vedi ![[mappa_del_sale.svg|Mappa]] e ![[Una Nota]] qui."
    html = build_site.markdown_to_html(md, lambda n: None, image)
    assert '<img src="media/mappa_del_sale.svg" alt="Mappa" loading="lazy">' in html
    assert "<em>" not in html and "media/mappa<em>" not in html  # underscore intatti
    assert "Una Nota" not in html  # embed di nota: inerte, sparisce
    assert resolved == {"mappa_del_sale.svg": "media/mappa_del_sale.svg"}


def test_build_site_copies_referenced_assets(tmp_path):
    """Integrazione: mappa embeddata nel corpo e ritratto in frontmatter →
    <img src="media/..."> nelle pagine e i file copiati in <out>/media/."""
    vault = tmp_path / "vault"
    media = vault / "Media"
    media.mkdir(parents=True)
    (media / "mappa_del_borgo.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)
    (media / "sigillo.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)
    nd = vault / "Mondi" / "Mondo Y"
    nd.mkdir(parents=True)
    (nd / "Borgo.md").write_text(
        "---\nnome: Borgo\ncategoria: luogo\ntipo: insediamento\nmondo: '[[Mondo Y]]'\n"
        "ritratto: '[[sigillo.png]]'\n---\n\n# Borgo\n\nUn borgo fluviale.\n\n"
        "## Mappa\n\n![[mappa_del_borgo.png]]\n", encoding="utf-8")
    out = tmp_path / "site"
    n = build_site.build_site(CORE, vault, out)
    assert n == 1
    html = (out / "borgo.html").read_text(encoding="utf-8")
    assert '<img src="media/mappa_del_borgo.png"' in html      # mappa dal corpo
    assert 'class="portrait" src="media/sigillo.png"' in html  # ritratto da frontmatter
    assert (out / "media" / "mappa_del_borgo.png").is_file()
    assert (out / "media" / "sigillo.png").is_file()


# --- Rivelazione progressiva (sito-giocatori v2) ----------------------------
def test_reveal_rank_helpers():
    """Tier ordinati: nota senza/ignoto → pubblico(0); build `tutto` → max."""
    assert build_site.note_reveal_rank({}) == 0
    assert build_site.note_reveal_rank({"rivelazione": "segreto"}) == 2
    assert build_site.note_reveal_rank({"rivelazione": "boh"}) == 0   # ignoto → pubblico
    assert build_site.build_reveal_rank("pubblico") == 0
    assert build_site.build_reveal_rank("incontrato") == 1
    assert build_site.build_reveal_rank("tutto") == 2
    assert build_site.build_reveal_rank(None) == 0


def test_site_reveal_gating(tmp_path):
    """Il gate progressivo include una nota se il suo tier <= livello del build;
    le note non taggate (pubblico) escono sempre (retro-compatibile)."""
    nd = tmp_path / "vault" / "Mondi" / "Mondo Z"
    nd.mkdir(parents=True)
    notes = {"Piazza": "", "Cripta": "incontrato", "Verita": "segreto"}
    for nome, tier in notes.items():
        riv = f"rivelazione: {tier}\n" if tier else ""
        (nd / f"{nome}.md").write_text(
            f"---\nnome: {nome}\ncategoria: luogo\nmondo: '[[Mondo Z]]'\n{riv}---\n\nProsa di {nome}.\n",
            encoding="utf-8")
    out = tmp_path / "site"
    # pubblico (default): solo Piazza; 2 da rivelare.
    assert build_site.build_site(CORE, tmp_path / "vault", out, reveal="pubblico") == 1
    assert "2 voci ancora da rivelare" in (out / "index.html").read_text(encoding="utf-8")
    assert (out / "piazza.html").is_file() and not (out / "cripta.html").is_file()
    # incontrato: Piazza + Cripta; Verita ancora no.
    assert build_site.build_site(CORE, tmp_path / "vault", out, reveal="incontrato") == 2
    assert (out / "cripta.html").is_file() and not (out / "verita.html").is_file()
    # tutto: tutte e tre.
    assert build_site.build_site(CORE, tmp_path / "vault", out, reveal="tutto") == 3
    assert (out / "verita.html").is_file()


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
def test_strip_body_reveal_callout():
    """Un callout `[!rivela|tier]` è svelato (contenuto → prosa) se il suo tier <=
    reveal_level; sotto resta celato. Gli altri callout sono sempre rimossi."""
    body = ("Prosa pubblica.\n\n"
            "> [!rivela|segreto]- Verità\n> IL SEGRETO.\n\n"
            "> [!rivela|incontrato] Scoperta\n> COSA SI SCOPRE.\n\n"
            "> [!nota] Normale\n> callout qualsiasi (sempre fuori).\n")
    # livello pubblico (0): nessun rivela svelato.
    s0 = build_site.strip_body(body, 0)
    assert "Prosa pubblica." in s0
    assert "IL SEGRETO." not in s0 and "COSA SI SCOPRE." not in s0
    # livello incontrato (1): solo l'incontrato.
    s1 = build_site.strip_body(body, 1)
    assert "COSA SI SCOPRE." in s1 and "IL SEGRETO." not in s1
    assert "### Scoperta" in s1                       # il titolo del callout → heading
    # livello segreto (2): entrambi.
    s2 = build_site.strip_body(body, 2)
    assert "IL SEGRETO." in s2 and "COSA SI SCOPRE." in s2
    # i callout non-rivela non trapelano mai.
    for s in (s0, s1, s2):
        assert "callout qualsiasi" not in s


def test_site_section_reveal_integration(tmp_path):
    """Una nota PUBBLICA con un callout `[!rivela|segreto]`: la pagina esce sempre,
    ma il segreto compare solo a --reveal segreto."""
    nd = tmp_path / "vault" / "Mondi" / "Mondo S"
    nd.mkdir(parents=True)
    (nd / "Rocca.md").write_text(
        "---\nnome: Rocca\ncategoria: luogo\nmondo: '[[Mondo S]]'\n---\n\n"
        "# Rocca\n\nUna rocca sul fiume.\n\n> [!rivela|segreto]- Sotto\n> CRIPTA_NASCOSTA.\n",
        encoding="utf-8")
    out = tmp_path / "site"
    build_site.build_site(CORE, tmp_path / "vault", out, reveal="pubblico")
    assert (out / "rocca.html").is_file()
    assert "CRIPTA_NASCOSTA" not in (out / "rocca.html").read_text(encoding="utf-8")
    build_site.build_site(CORE, tmp_path / "vault", out, reveal="segreto")
    assert "CRIPTA_NASCOSTA" in (out / "rocca.html").read_text(encoding="utf-8")


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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_sito_parity(tmp_path):
    """Parità Python↔JS dell'esportatore «sito dei giocatori» (build_site.py ↔
    genera_sito.js, il bottone in-Obsidian): sugli STESSI dati, markdown_to_html e
    page_model danno lo STESSO risultato → le due implementazioni non divergono (come
    il test di parità del World Board). Fixture: player_safe + regione di prosa marcata
    %%prosa%%…%%/prosa%% dentro ````tabs (estratta ovunque viva), sezione vuota (heading
    droppato), callout segreto (escluso) e [!rivela] (svelato), chrome fuori-marcatori
    scartato, relazioni, ritratto, markdown inline."""
    import build_site as bs
    notes = [
        {"name": "Casa Rossa", "fm": {"categoria": "fazione", "tipo": "gilda", "nome": "Casa Rossa",
            "mondo": "[[Astaria]]", "portata": "regionale", "motto": "Niente per niente",
            "ritratto": "rosso.png", "player_safe": "La gilda che tiene i **moli**.",
            "alleati": ["[[Gilda del Sale]]"], "rivali": ["[[Casa Nera]]"]},
         "body": "# Casa Rossa\n\n````tabs\n--- 📖 Lore\n\n%%prosa%%\n"
                 "Una gilda con [[Astaria|sede]] e ![[rosso.png]].\n\n"
                 "## Obiettivo\n> [!question]- 💡 cosa vuole?\n\nControllare i **moli** con *coltelli*.\n\n"
                 "> [!segreto] DM\n> trama riservata\n\n> [!rivela|incontrato] Verità\n> emersa col tempo\n\n"
                 "## Metodo\n> [!question]- 💡 mai compilata\n\n%%/prosa%%\n"
                 "--- 🎲 Al tavolo\n\n**⏳ Fronte** — clock `INPUT[number:clock]`\n\n"
                 "```dataview\nlist\n```\n````"},
        {"name": "Pontebello", "fm": {"categoria": "luogo", "tipo": "insediamento",
            "nome": "Pontebello", "mondo": "[[Astaria]]", "clima": "temperato", "popolazione": "5.000"},
         "body": "Prosa **semplice** di un luogo.\n\n```dataview\nx\n```\n\nRiga finale con [esterno](https://z.io)."},
    ]
    md = ["## Titolo\n\n**b** *i* `c` con [[X|alias]] e link", "- uno\n- due\n\n1. a\n2. b"]
    known = {"astaria", "gilda del sale", "casa nera", "pontebello", "x"}
    IMG = (".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif", ".avif")
    link = lambda n: bs.slugify(n) + ".html" if str(n).lower() in known else None
    image = lambda n: "media/" + str(n).split("/")[-1] if str(n).endswith(IMG) else None
    py = {
        "models": [bs.page_model(CORE, n["fm"], n["body"], n["name"], link, image, 1) for n in notes],
        "md": [bs.markdown_to_html(x, link, image) for x in md],
    }
    harness = tmp_path / "parity.js"
    harness.write_text(
        f'const g=require({json.dumps(str(render.JS_DIR / "genera_sito.js"))});'
        f'const CORE={json.dumps(CORE, ensure_ascii=False)};'
        f'const notes={json.dumps(notes, ensure_ascii=False)};'
        f'const md={json.dumps(md, ensure_ascii=False)};'
        f'const known=new Set({json.dumps(sorted(known))});'
        'const IMG=[".png",".svg",".jpg",".jpeg",".webp",".gif",".avif"];'
        'const link=n=>known.has(String(n).toLowerCase())?g.slugify(n)+".html":null;'
        'const image=n=>IMG.some(e=>String(n).endsWith(e))?"media/"+String(n).split("/").pop():null;'
        'process.stdout.write(JSON.stringify({'
        'models:notes.map(n=>g.pageModel(CORE,n.fm,n.body,n.name,link,image,1)),'
        'md:md.map(x=>g.mdToHtml(x,link,image))}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    js = json.loads(res.stdout)
    norm = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True)
    assert norm(js["md"]) == norm(py["md"]), "markdown_to_html diverge JS↔Python"
    for i, (pm, jm) in enumerate(zip(py["models"], js["models"])):
        assert norm(jm) == norm(pm), f"page_model diverge su «{notes[i]['name']}»\nPY {norm(pm)}\nJS {norm(jm)}"


def test_third_party_licenses_complete():
    """Attribuzione plugin: ogni plugin bundlato (plugins.yaml) ha author/repo/
    license e compare in THIRD-PARTY-LICENSES con licenza e link al repo. Se aggiungi
    un plugin senza questi campi, il test fallisce → ti forza a verificarne la licenza."""
    out = _env().get_template("third_party_licenses.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    plugins = PLUGINS["plugins"]
    assert len(plugins) >= 18
    for p in plugins:
        for field in ("author", "repo", "license"):
            assert p.get(field), f"{p['id']}: manca '{field}' (attribuzione)"
        assert p["name"] in out and p["license"] in out
        assert f"https://github.com/{p['repo']}" in out
    assert "mera aggregazione" in out                         # base legale dichiarata
    for lic in ("MIT", "GPL-3.0", "AGPL-3.0"):
        assert lic in out, lic


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
def test_inizia_incontro_e2e(tmp_path):
    """meta_actions.inizia_incontro (ponte Initiative Tracker, mock plugin): auto-popola
    il Party IT dai PG (personaggio · tipo pg) — `playerFromPg` mappa nome/PF/CA/init-mod;
    aggiunge solo i PG MANCANTI al roster (`savePlayer`), unisce i nomi al party di
    default e persiste (`saveSettings`); i non-PG e i PG già presenti sono esclusi."""
    harness = tmp_path / "it.js"
    harness.write_text(
        'const saved=[];\n'
        'const it={data:{players:[{name:"Esistente"}], parties:[{name:"Gruppo",players:["Esistente"]}], defaultParty:"Gruppo"},\n'
        '  savePlayer:async function(p){this.data.players.push(p); saved.push(p.name);},\n'
        '  saveSettings:async function(){this.data._saved=(this.data._saved||0)+1;}};\n'
        'const files=[\n'
        '  {basename:"Vera", path:"Mondi/Personaggi/Vera.md"},\n'
        '  {basename:"Renzo", path:"Mondi/Personaggi/Renzo.md"},\n'
        '  {basename:"Goblin", path:"x/Goblin.md"},\n'
        '  {basename:"Esistente", path:"Mondi/Personaggi/Esistente.md"},\n'
        '];\n'
        'const fmByPath={\n'
        '  "Mondi/Personaggi/Vera.md":{categoria:"personaggio", tipo:"pg", nome:"Vera Sabbialesta", pf_max:25, ca:16, destrezza:14, livello:3},\n'
        '  "Mondi/Personaggi/Renzo.md":{categoria:"personaggio", tipo:"pg", nome:"Renzo", pf_max:18, ca:14, destrezza:16, livello:2},\n'
        '  "x/Goblin.md":{categoria:"creatura", tipo:"mostro"},\n'
        '  "Mondi/Personaggi/Esistente.md":{categoria:"personaggio", tipo:"pg", nome:"Esistente", pf_max:10, ca:12},\n'
        '};\n'
        'global.Notice=class{constructor(m){}};\n'
        'global.app={\n'
        '  vault:{getMarkdownFiles:()=>files},\n'
        '  metadataCache:{getFileCache:(f)=>({frontmatter:fmByPath[f.path]||{}})},\n'
        '  plugins:{plugins:{"initiative-tracker":it}},\n'
        '  commands:{executeCommandById:()=>{}},\n'
        '};\n'
        f'const meta=require({json.dumps(META_ACTIONS_JS)});\n'
        'const pf=meta.playerFromPg({basename:"Vera"},fmByPath["Mondi/Personaggi/Vera.md"]);\n'
        'meta.inizia_incontro({}).then(()=>process.stdout.write(JSON.stringify({\n'
        '  pf, saved, party: it.data.parties.find(p=>p.name==="Gruppo").players,\n'
        '  roster: it.data.players.map(p=>p.name), savedCount: it.data._saved})));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["pf"] == {"name": "Vera Sabbialesta", "player": True, "hp": 25, "ac": 16, "modifier": 2, "level": 3}
    assert out["saved"] == ["Renzo", "Vera Sabbialesta"]        # solo i PG MANCANTI (Esistente già nel roster)
    assert set(out["party"]) == {"Esistente", "Renzo", "Vera Sabbialesta"}  # union col party esistente
    assert "Goblin" not in out["party"]                          # i non-PG esclusi
    assert out["savedCount"] >= 1                                # persistito (saveSettings)


# --- Pubblicazione itch (publish_itch.py) -----------------------------------
import publish_itch  # noqa: E402


def test_publish_itch_helpers(monkeypatch):
    """resolve_target(): env ITCH_TARGET ha precedenza; version() da package.json."""
    monkeypatch.setenv("ITCH_TARGET", "tizio/gdr")
    assert publish_itch.resolve_target() == "tizio/gdr"
    import json as _json
    pkg = _json.loads((render.ROOT / "package.json").read_text(encoding="utf-8"))
    assert publish_itch.version() == pkg["version"]
    # canali attesi (vault + sito)
    assert {c for c, _ in publish_itch.CHANNELS} == {"vault", "site"}


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
