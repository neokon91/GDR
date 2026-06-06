"""Test GDR — wizard_gen. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

import render
from _common import (
    CORE, PLUGINS, TEMPLATES, PAGES, SNAP_DIR, VIEWS_JS, VIEWS_SRC, META_ACTIONS_JS,
    _snapshot, _env, _PG_HARNESS, _run_crea_pg,
)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_talento_ammesso(tmp_path):
    """sali_pg.talentoAmmesso: gating talenti 2024 a un ASI — solo GENERALE; i DONI
    EPICI dal livello 19; ORIGINE/STILE esclusi; categoria ignota (homebrew non
    marcato) = permesso (non blocca)."""
    harness = tmp_path / "ta.js"
    harness.write_text(
        f'const s=require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});'
        'const f=(cat,liv)=>s.talentoAmmesso({categoria:cat},liv);'
        'process.stdout.write(JSON.stringify({'
        'gen:f("Generale",4), ori:f("Origini",4), stile:f("Stile di combattimento",4),'
        'epic8:f("Dono epico",8), epic19:f("Dono epico",19),'
        'hb:f("generale",8), vuoto:f("",4)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    assert json.loads(res.stdout) == {
        "gen": True, "ori": False, "stile": False,
        "epic8": False, "epic19": True, "hb": True, "vuoto": True}


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD non vendorizzata")
def test_srd_counts_and_statblock():
    """Conteggi attesi + il mostro si mappa su uno statblock Fantasy Statblocks."""
    assert len(render.load_srd("srd_5_2_1_spells.json")) > 300
    monsters = render.load_srd("srd_5_2_1_monsters.json")
    assert len(monsters) > 300
    glossary = render.load_srd("srd_5_2_1_rules_glossary.json")
    assert sum(1 for g in glossary if g.get("descrittore") == "condizione") == 15
    sb = render.srd_statblock_yaml(monsters[0], "Basic 5e Layout", CORE)
    assert "name:" in sb and "stats:" in sb and "actions:" in sb
    # Mappatura 5.5e completa: un mostro ricco espone i campi 2024.
    vampiro = next((m for m in monsters if m.get("nome") == "Vampiro"), None)
    if vampiro:
        vsb = render.srd_statblock_yaml(vampiro, "x", CORE)
        for field in ("initiative:", "saves:", "skillsaves:", "bonus_actions:",
                      "legendary_description:", "pb:"):
            assert field in vsb, f"campo 5.5e mancante: {field}"


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD non vendorizzata")
def test_srd_condizioni():
    """srd_condizioni: le 15 condizioni 5.5e in forma compatta (nome + effetti) per
    il quick-ref runtime; gli effetti pieni stanno nelle note SRD/Condizioni/."""
    cond = render.srd_condizioni()
    assert len(cond) == 15
    nomi = {c["nome"] for c in cond}
    assert {"Accecato", "Afferrato", "Spaventato"} <= nomi
    acc = next(c for c in cond if c["nome"] == "Accecato")
    assert acc["effetti"] and all(e.get("descrizione") for e in acc["effetti"])


def test_srd_note_dedup_and_extras():
    """srd_note (funzione pura): de-duplica le prose ripetute (descrizione/
    beneficio/sezione, tipico dei talenti), rende lo statblock delle creature
    evocate inline e il footer 'Vedi anche' coi link risolti."""
    entry = {
        "nome": "Prova",
        "descrizione": "Stesso testo benefico.",
        "beneficio": "Stesso testo benefico.",
        "sezioni": [
            {"titolo": "Beneficio", "descrizione": "Stesso testo benefico."},
            {"titolo": "Extra", "descrizione": "Testo diverso."},
        ],
        "creature_evocate_inline": [{"nome": "Famiglio", "statblock": {
            "tipo": "Bestia Minuscola", "allineamento": "neutrale",
            "classe_armatura": 12, "punti_ferita": "5", "velocita": "3 m",
            "caratteristiche": {"forza": {"valore": 3, "modificatore": "-4"},
                                "destrezza": {"valore": 15, "modificatore": 2}},
            "azioni": [{"nome": "Morso", "descrizione": "1 danno perforante."}],
        }}],
        "vedi_anche": ["afferrato", "id_inesistente"],
    }
    out = render.srd_note(entry, "srd-talento", [], {"afferrato": "Afferrato"})
    assert out.count("Stesso testo benefico.") == 1   # de-dup: una sola volta
    assert "Testo diverso." in out                     # sezione distinta preservata
    assert "### Beneficio" not in out                  # sezione svuotata dal dedup -> niente heading vuoto
    assert "[!example]- Creatura evocata: Famiglio" in out
    assert "**CA** 12" in out
    assert "**For** 3 (-4)" in out and "**Des** 15 (+2)" in out
    assert "**Morso** — 1 danno perforante." in out
    assert "[[Afferrato]]" in out                       # vedi_anche risolto a link
    assert "id inesistente" in out                      # id non risolto -> testo in chiaro


def test_generatori_catalog():
    """generatori.yaml (generatore homebrew): stili con parti-nome complete +
    affissi toponimi + forme fazioni; le opzioni del select stile_nomi combaciano
    con gli stili (anti-drift, stesso check di validate)."""
    import re as _re
    g = render.load_yaml("generatori.yaml")
    stili = g["stili"]
    assert len(stili) >= 4
    for sid, s in stili.items():
        p = s["persona"]
        assert p["inizi"] and p["fini_m"] and p["fini_f"], sid
        assert s.get("label"), sid
    assert g["toponimi"]["prefissi"] and g["toponimi"]["suffissi"]
    faz = g["fazioni"]
    assert faz["forme"] and faz["sintagma"] and faz["nucleo_pl"] and faz["aggettivo"]
    for sec in ("png", "taverna", "gancio",                          # spunti Stage 1
                "diceria", "bottino", "insediamento", "oggetto",     # spunti Stage 2
                "meteo", "dungeon_stanza", "bevanda"):               # spunti Stage 3
        assert g[sec]["forme"], f"{sec}.forme assente"
    # tesoro (SRD): generatore dedicato (niente `forme`, lo salta il validatore) —
    # le sue parti italiane vivono in YAML, i nomi-oggetto li inietta render.py.
    tes = g["tesoro"]
    assert tes["fasce"] and tes["monete"] and tes["importi"], "tesoro: scaffolding incompleto"
    assert set(tes["fasce"]) <= set(tes["monete"]) and set(tes["fasce"]) <= set(tes["importi"]), \
        "tesoro: ogni fascia deve avere monete e importi"
    decl = (render.load_yaml("plugins.yaml").get("metabind_inputs") or {}).get("stile_nomi", "")
    assert set(_re.findall(r"option\(\s*([a-z_]+)", decl)) == set(stili)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_e2e(tmp_path):
    """genera.js: per ogni stile compone persona/toponimo/fazione non vuoti; le
    fazioni risolvono tutti i placeholder ({..}); generaLista dà opzioni distinte."""
    gen = render.load_yaml("generatori.yaml")
    harness = tmp_path / "g.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const genera=require({json.dumps(str(render.JS_DIR / "genera.js"))});'
        f'const gen={json.dumps(gen, ensure_ascii=False)};'
        'let s=7;const rng=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;'
        'const out={};'
        'for(const st of Object.keys(gen.stili)){'
        '  out[st]={p:genera.generaPersona(gen,st,rng),t:genera.generaToponimo(gen,st,rng),f:genera.generaFazione(gen,st,rng)};'
        '}'
        'out.__lista=genera.generaLista(gen,"persona",Object.keys(gen.stili)[0],8,rng);'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    for st in gen["stili"]:
        assert out[st]["p"] and out[st]["t"] and out[st]["f"], st
        assert "{" not in out[st]["f"], f"placeholder non risolto ({st}): {out[st]['f']}"
        assert out[st]["f"][0].isupper()
    assert len(set(out["__lista"])) >= 6   # generaLista: opzioni distinte


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_spunti_e2e(tmp_path):
    """genera.js: i generatori-spunto (png/taverna/gancio, via generaDaForme) producono
    opzioni distinte, non vuote e con TUTTI i placeholder risolti (nessun {..} residuo)."""
    gen = render.load_yaml("generatori.yaml")
    harness = tmp_path / "gs.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const genera=require({json.dumps(str(render.JS_DIR / "genera.js"))});'
        f'const gen={json.dumps(gen, ensure_ascii=False)};'
        'let s=11;const rng=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;'
        'const st=Object.keys(gen.stili)[0];const out={};'
        'for(const tipo of ["png","taverna","gancio","diceria","bottino","insediamento","oggetto","meteo","dungeon_stanza","bevanda"]){out[tipo]=genera.generaLista(gen,tipo,st,6,rng);}'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    for tipo in ("png", "taverna", "gancio", "diceria", "bottino", "insediamento", "oggetto",
                 "meteo", "dungeon_stanza", "bevanda"):
        lst = out[tipo]
        assert len(lst) >= 4, f"{tipo}: troppe poche opzioni distinte: {lst}"
        for v in lst:
            assert v and "{" not in v, f"{tipo}: placeholder non risolto o vuoto: {v!r}"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_tesoro_e2e(tmp_path):
    """genera.js: il tesoro SRD (generaTesoro) lega monete a fascia + un oggetto/equip
    REALE dell'SRD. Verifica che render inietti i nomi, che ogni opzione citi un item
    vero, riporti le monete, e che gli oggetti magici (non mondani) portino la rarità."""
    gen = render.load_yaml("generatori.yaml")
    pool = render.srd_loot_pool()
    assert pool.get("mondano") and pool.get("rara"), "loot pool SRD vuoto o incompleto"
    gen["tesoro"]["_srd"] = pool                                      # iniezione (come in core.json)
    all_names = {n for names in pool.values() for n in names}
    mondani = set(pool["mondano"])
    harness = tmp_path / "gt.js"
    harness.write_text(
        f'const genera=require({json.dumps(str(render.JS_DIR / "genera.js"))});'
        f'const gen={json.dumps(gen, ensure_ascii=False)};'
        'let s=3;const rng=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;'
        'const st=Object.keys(gen.stili)[0];'
        'process.stdout.write(JSON.stringify(genera.generaLista(gen,"tesoro",st,8,rng)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    lst = json.loads(res.stdout)
    assert len(lst) >= 4, f"tesoro: troppe poche opzioni distinte: {lst}"
    for v in lst:
        assert v and "{" not in v, f"tesoro: vuoto o placeholder residuo: {v!r}"
        cited = [n for n in all_names if n in v]
        assert cited, f"tesoro: nessun oggetto SRD reale citato: {v!r}"     # NON è item-soup
        assert any(c.isdigit() for c in v) or "rame" in v, f"tesoro: monete assenti: {v!r}"
        # Oggetto magico -> riporta la rarità; oggetto mondano -> niente tag.
        if "(rarità " in v:
            assert any(n in v and n not in mondani for n in cited), f"tesoro: tag rarità su item mondano: {v!r}"


def test_validate_aux_yaml_real_files_pass():
    """Regressione: il validatore degli YAML ausiliari concorda con i file spediti
    (astrologia/generatori/pg_rules)."""
    assert render.validate_aux_yaml() == []


def test_validate_aux_yaml_catches_breakage(monkeypatch):
    """Fail-fast: un refuso negli YAML ausiliari è un errore di check(), non solo
    un crash in-app — qui un segno senza 'archetipo' viene segnalato."""
    import validate as _v
    real = _v.load_yaml

    def fake(name):
        if name == "astrologia.yaml":
            return {"segni": [{"nome": "Ariete", "elemento": "Fuoco"}],  # manca archetipo
                    "elementi": [{"nome": "Fuoco"}], "arcani": [{"nome": "Il Matto"}]}
        if name in ("generatori.yaml", "pg_rules.yaml"):
            raise FileNotFoundError(name)  # opzionali: assenti -> saltati
        return real(name)

    monkeypatch.setattr(_v, "load_yaml", fake)
    errors = _v.validate_aux_yaml()
    assert any("archetipo" in e for e in errors), errors


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_preset_satisfies_matchescond(tmp_path):
    """Invariante preset↔match: per ogni archetipo reale i valori-assi derivati da
    create_entity.presetValori soddisfano matchesCond sul suo 'quando'. (La parità
    BYTE di matchesCond fra views.js/meta_actions.js, sorgente unica _comparators.js,
    è imposta da check()/test_check_passes — qui resta solo l'invariante semantica.)"""
    archetipi = [a for lst in (CORE.get("archetipi") or {}).values() for a in lst]
    harness = tmp_path / "preset.js"
    harness.write_text(
        'const fs=require("fs");'
        'function load(p){const s=fs.readFileSync(p,"utf8");const m={exports:{}};'
        'new Function("module","exports",s)(m,m.exports);return m.exports;}'
        f'const views=load({json.dumps(VIEWS_JS)});'
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const archs={json.dumps(archetipi, ensure_ascii=False)};'
        'const inv=[];'
        'for(const a of archs){const vals=crea.presetValori(a);'
        'for(const [ax,cond] of Object.entries(a.quando||{})){'
        'if((ax in vals)&&!views.matchesCond(vals[ax],cond)) inv.push((a.nome||"?")+":"+ax);}}'
        'process.stdout.write(JSON.stringify({inv}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["inv"] == [], f"preset non soddisfa matchesCond: {out['inv']}"
    assert archetipi, "nessun archetipo: l'invariante preset↔match non è stata esercitata"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_wizard_writes_inverse(tmp_path):
    """create_entity.writeInverses: il wizard scrive l'inverso reciproco sul target (come
    Collega, ma ALLA CREAZIONE). `personaggio.fazione=[[Corvi]]` → sul target Corvi compare
    `figure: [[Mira]]` (coppia univoca, multi)."""
    core = {"relazioni": {
        "personaggio": [{"field": "fazione", "label": "Fazione", "category": "fazione"}],
        "fazione": [{"field": "figure", "label": "Figure", "category": "personaggio", "multi": True}],
    }}
    harness = tmp_path / "wizinv.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "create_entity.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports","require",src)(m,m.exports,require);'
        f'const core={json.dumps(core, ensure_ascii=False)};'
        'let saved=null;'
        'const target={path:"Mondi/Fazioni/Corvi.md", basename:"Corvi"};'
        'global.app={'
        '  metadataCache:{'
        '    getFirstLinkpathDest:(n)=>(n==="Corvi"?target:null),'
        '    getFileCache:()=>({frontmatter:{categoria:"fazione"}}),'
        '  },'
        '  fileManager:{processFrontMatter:async(f,fn)=>{const fm={};fn(fm);saved=fm;}},'
        '};'
        'm.exports.writeInverses(core,"personaggio","Mira",{fazione:"[[Corvi]]"})'
        '.then(()=>process.stdout.write(JSON.stringify(saved)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out == {"figure": ["[[Mira]]"]}   # inverso tipizzato scritto sul target (coppia univoca, multi)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_pick_multi(tmp_path):
    """create_entity.pickMulti: usa tp.system.multi_suggester (Templater >= 2.16) in un
    solo modale quando c'è; fallback al suggester ripetuto con "(fine)" quando manca."""
    harness = tmp_path / "pm.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        'const items=["a","b","c"];'
        # con multi_suggester: ritorna direttamente il sottoinsieme scelto
        'const tpA={system:{multi_suggester:async(lf,its)=>its.slice(0,2)}};'
        # senza multi_suggester: suggester ripetuto, [null,...pool] -> vals[1]=primo del pool; null=(fine)
        'let calls=0;'
        'const tpB={system:{suggester:async(labels,vals)=>{calls++; return calls<=2?vals[1]:null;}}};'
        'Promise.all([crea.pickMulti(tpA,"L",items),crea.pickMulti(tpB,"L",[...items])])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == ["a", "b"]   # multi_suggester: sottoinsieme in un colpo
    assert out["b"] == ["a", "b"]   # fallback: due scelte poi "(fine)"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_famiglia_preset(tmp_path):
    """create_entity.famigliaPreset: la famiglia col campo 'assi' pre-compila i
    valori-assi (cultura/guerriera); famiglia senza preset o inesistente -> {}.
    Gli id-asse dei preset sono validati da validate (shape: famiglie)."""
    cats = CORE.get("categories") or {}
    spec = cats.get("cultura") or {}
    assert spec.get("famiglie"), "cultura senza famiglie"
    harness = tmp_path / "fam.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const spec={json.dumps(spec, ensure_ascii=False)};'
        f'const faz={json.dumps(cats.get("fazione") or {}, ensure_ascii=False)};'
        f'const div={json.dumps(cats.get("divinita") or {}, ensure_ascii=False)};'
        'process.stdout.write(JSON.stringify({'
        'guer:crea.famigliaPreset(spec,"guerriera"),'
        'nom:crea.famigliaPreset(spec,"nomadica"),'
        'x:crea.famigliaPreset(spec,"inesistente"),'
        'mil:crea.famigliaPreset(faz,"militare"),'
        'prim:crea.famigliaPreset(div,"primordiale")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["guer"] == {"valori_dominanti": 3, "relazione_morte": 2, "ritualizzazione_vita": 4}
    assert out["nom"] == {}      # famiglia senza preset
    assert out["x"] == {}        # famiglia inesistente
    assert out["mil"] == {"struttura": 5, "etica_conflitto": 4, "coesione": 4}   # preset fazione
    assert out["prim"] == {"presenza_cosmica": 1, "incarnazione": 1, "volonta": 1}  # preset divinità


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_with_desc(tmp_path):
    """create_entity.withDesc: arricchisce l'etichetta del suggester con la descrizione
    («nome — descrizione») così si sceglie il sottotipo/famiglia CON contesto, non alla
    cieca; senza descrizione resta il solo nome; descrizione lunga troncata a parola con «…»."""
    harness = tmp_path / "withdesc.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        'const lungo="Fratellanza votata a un credo: cavalieri, monaci e custodi, con voti e riti di iniziazione e una gerarchia rigida";'
        'process.stdout.write(JSON.stringify({'
        'plain:crea.withDesc("gilda",""),'
        'full:crea.withDesc("gilda","Corporazione di mestiere"),'
        'trunc:crea.withDesc("ordine",lungo)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["plain"] == "gilda"                              # niente descrizione -> solo nome (valore invariato)
    assert out["full"] == "gilda — Corporazione di mestiere"    # nome — descrizione
    assert out["trunc"].startswith("ordine — ") and out["trunc"].endswith("…")  # lunga -> troncata
    assert len(out["trunc"]) <= len("ordine — ") + 90           # entro il cap (modale scorrevole)


def test_enum_widgets_conversi():
    """Campi prima a TESTO LIBERO ora hanno un widget ENUMERABILE → picker su nota e (via
    widget_options) nel wizard: padronanza (8 maestrie d'arma), tipo_creatura (14 tipi 5e,
    incl. il valore SRD «Umanoide»), car_primaria (6 caratteristiche). Anti-drift: le opzioni
    di padronanza coincidono coi nomi di system.yaml:maestrie_armi (lo impone anche check())."""
    wo = render.widget_options()
    fields = CORE.get("fields", {})
    assert fields["padronanza"]["widget"] == "padronanza" and len(wo["padronanza"]["options"]) == 8
    assert fields["tipo_creatura"]["widget"] == "tipo_creatura" and "Umanoide" in wo["tipo_creatura"]["options"]
    assert fields["car_primaria"]["widget"] == "car_primaria" and "Forza" in wo["car_primaria"]["options"]
    # classi (incantesimo): multi-pick dei 12 nomi-classe SRD in CHIARO (no link → SRD/JS-safe).
    assert fields["classi"]["widget"] == "classi" and wo["classi"]["multi"] is True
    assert {"Mago", "Chierico", "Warlock"} <= set(wo["classi"]["options"]) and len(wo["classi"]["options"]) == 12
    maestrie = {m["nome"] for m in CORE.get("maestrie_armi", [])}
    assert set(wo["padronanza"]["options"]) == maestrie     # anti-drift padronanza ↔ maestrie_armi


def test_widget_options():
    """render.widget_options distilla le opzioni dei select Meta Bind (per il wizard
    subtype-aware): inlineSelect -> singolo, inlineListSuggester -> multi; query/slider
    esclusi. Guard anti-drift: OGNI widget usato da un campo-sottotipo dev'essere
    chiedibile dal wizard (text/number/testo_area/legame oppure enumerato in
    widget_options), altrimenti quel campo del tipo resterebbe muto in creazione."""
    wo = render.widget_options()
    assert wo["prosperita"]["options"] == ["misera", "modesta", "agiata", "ricca", "opulenta"]
    assert wo["prosperita"]["multi"] is False
    assert wo["servizi"]["multi"] is True                 # inlineListSuggester -> multi
    assert "mondo" not in wo and "connessioni" not in wo  # optionQuery -> niente opzioni enumerate
    askable = set(wo) | {"text", "number", "testo_area", "legame"}
    fields = CORE.get("fields", {})
    for cat, meta in CORE.get("categories", {}).items():
        for tname, prof in (meta.get("subtype_profiles") or {}).items():
            for fid in (prof.get("campi") or []):
                w = (fields.get(fid) or {}).get("widget")
                assert w in askable, f"{cat}/{tname}: campo '{fid}' widget '{w}' non chiedibile dal wizard"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_subtype_field_question(tmp_path):
    """create_entity.subtypeFieldQuestion mappa il widget del campo-sottotipo al modo
    giusto di chiederlo: number->numero, select Meta Bind->lista (multi se ListSuggester),
    text/testo_area->prompt (multiline per testo_area); legame -> null (passo Collega)."""
    core = {
        "fields": {
            "pop": {"label": "Popolazione", "widget": "text"},
            "liv": {"label": "Livelli", "widget": "number"},
            "pr": {"label": "Prosperità", "widget": "prosperita"},
            "srv": {"label": "Servizi", "widget": "servizi"},
            "cap": {"label": "Capoluogo", "widget": "legame"},
            "note": {"label": "Note", "widget": "testo_area"},
        },
        "widget_options": {
            "prosperita": {"options": ["misera", "ricca"], "multi": False},
            "servizi": {"options": ["mercato", "tempio"], "multi": True},
        },
    }
    harness = tmp_path / "sfq.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const core={json.dumps(core, ensure_ascii=False)};'
        'const q=(f)=>crea.subtypeFieldQuestion(f,core);'
        'process.stdout.write(JSON.stringify({'
        'pop:q("pop"),liv:q("liv"),pr:q("pr"),srv:q("srv"),cap:q("cap"),note:q("note")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["liv"]["from"] == "number"
    assert out["pr"]["from"] == "list" and out["pr"]["options"] == ["misera", "ricca"] and out["pr"]["multi"] is False
    assert out["srv"]["from"] == "list" and out["srv"]["multi"] is True
    assert out["pop"].get("from") is None and out["pop"]["multiline"] is False   # text -> prompt
    assert out["note"]["multiline"] is True                                      # testo_area -> multiline
    assert out["cap"] is None                                                    # legame -> passo Collega


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_relations_to_ask(tmp_path):
    """create_entity.relationsToAsk: il wizard offre le relazioni della categoria
    escludendo quelle già chieste come creation.fields (no doppio-prompt).
    personaggio: fazione/luogo (in creation) esclusi, parenti/alleati/rivali inclusi;
    luogo: tutte le relazioni (creation = solo tipo+mondo)."""
    def asked(cat):
        cr = (CORE.get("creation") or {}).get(cat) or {}
        return [q["field"] for q in (cr.get("fields") or []) + (cr.get("body") or [])]
    rel = CORE.get("relazioni") or {}

    def expected(cat):
        return {r["field"] for r in rel.get(cat, [])} - set(asked(cat))

    harness = tmp_path / "rta.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const rel={json.dumps(rel, ensure_ascii=False)};'
        f'const asked={json.dumps({"personaggio": asked("personaggio"), "luogo": asked("luogo")}, ensure_ascii=False)};'
        'const f=(c)=>crea.relationsToAsk(rel[c], asked[c]).map(r=>r.field);'
        'process.stdout.write(JSON.stringify({png:f("personaggio"), luogo:f("luogo")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    # Esclude le relazioni già chieste come creation.fields/body (no doppio-prompt).
    assert set(out["png"]) == expected("personaggio")
    assert set(out["luogo"]) == expected("luogo")
    assert "fazione" not in out["png"] and "luogo" not in out["png"]   # già in creation.fields
    assert {"parenti", "alleati", "rivali"} <= set(out["png"])


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_reciprocal_field(tmp_path):
    """meta_actions.reciprocalField: inverso TIPIZZATO quando la coppia è univoca
    (linkando luogo→cultura, cultura ha solo 'regioni'→luogo); null (→ generico
    connessioni) se ambiguo (personaggio→fazione: fazione ha figure E fondatori)."""
    rel = CORE.get("relazioni") or {}
    harness = tmp_path / "rf.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(META_ACTIONS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",s)(m,m.exports);'
        f'const rel={json.dumps(rel, ensure_ascii=False)};'
        'const rf=m.exports.reciprocalField;'
        'process.stdout.write(JSON.stringify({'
        'cultura:(rf(rel,"cultura","luogo")||{}).field||null,'
        'fazione:(rf(rel,"fazione","personaggio")||{}).field||null,'
        'epoca:(rf(rel,"epoca","evento")||{}).field||null}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["cultura"] == "regioni"   # coppia univoca -> inverso tipizzato
    assert out["fazione"] is None        # ambiguo (figure+fondatori) -> generico
    assert out["epoca"] == "eventi"      # univoca


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_inverse_relation(tmp_path):
    """meta_actions.inverseRelation: inverso ESPLICITO (rel.reciprocal) quando
    dichiarato — simmetrico (luogo.confina_con↔confina_con) o direzionale
    (evento.causato_da↔conseguenze); altrimenti ricade su reciprocalField (auto)
    o null. L'esplicito è ciò che rende corretto Collega dove l'auto è ambiguo."""
    rel = CORE.get("relazioni") or {}
    harness = tmp_path / "ir.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(META_ACTIONS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",s)(m,m.exports);'
        f'const core={json.dumps({"relazioni": rel}, ensure_ascii=False)};'
        'const find=(c,f)=>core.relazioni[c].find(r=>r.field===f);'
        'const ir=m.exports.inverseRelation;'
        'const r=(rel,sc,tc)=>{const x=ir(core,rel,sc,tc);return x?x.field:null;};'
        'process.stdout.write(JSON.stringify({'
        'confina:r(find("luogo","confina_con"),"luogo","luogo"),'        # simmetrico esplicito
        'causa:r(find("evento","causato_da"),"evento","evento"),'        # direzionale esplicito
        'conseg:r(find("evento","conseguenze"),"evento","evento"),'      # direzionale esplicito (inverso)
        'cultura:r(find("luogo","cultura"),"luogo","cultura"),'          # niente reciprocal -> auto
        'fazione:r(find("personaggio","fazione"),"personaggio","fazione")}));',  # ambiguo -> null
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["confina"] == "confina_con"   # esplicito simmetrico (sé stesso)
    assert out["causa"] == "conseguenze"     # esplicito direzionale
    assert out["conseg"] == "causato_da"     # esplicito direzionale (lato inverso)
    assert out["cultura"] == "regioni"       # nessun reciprocal -> auto-derivato
    assert out["fazione"] is None            # ambiguo, nessun reciprocal -> generico (connessioni)


def test_validate_reciprocals():
    """validate_reciprocals: il modello reale è pulito; un reciprocal che nomina un
    campo inesistente sul target è intercettato (fail-fast a build, non in-app)."""
    core = render.load_core()
    assert render.validate_reciprocals(core) == []
    broken = {"relazioni": {
        "luogo": [{"field": "confina_con", "label": "Confina con", "category": "luogo", "reciprocal": "nonesiste"}],
    }}
    errs = render.validate_reciprocals(broken)
    assert errs and "reciprocal 'nonesiste'" in errs[0]


def test_validate_subtype_gates():
    """validate_subtype_gates: il modello reale è coerente (i flag clock/evoluzione dei
    sottotipi stanno tutti in fronte_categorie/tappe_categorie); un sottotipo che si
    dichiara Fronte/evolvente in una categoria FUORI dal gate è intercettato a build —
    altrimenti renderTipoProfilo prometterebbe una macchina che il template non emette.
    Il vincolo è uni-direzionale: i gate possono essere più ampi dei flag (no errori)."""
    core = render.load_core()
    assert render.validate_subtype_gates(core) == []
    # clock:true in una categoria NON in fronte_categorie, e evoluzione:true fuori da
    # tappe_categorie → due errori. 'incantesimo' non è né Fronte né tappe.
    broken = {
        "fronte_categorie": ["luogo"], "tappe_categorie": ["luogo"],
        "categories": {"incantesimo": {"subtype_profiles": {
            "rituale": {"clock": True, "evoluzione": True}}}},
    }
    errs = render.validate_subtype_gates(broken)
    assert any("clock:true" in e and "fronte_categorie" in e for e in errs)
    assert any("evoluzione:true" in e and "tappe_categorie" in e for e in errs)
    # Gate più ampio del flag (categoria-Fronte curata senza flag) = nessun errore.
    assert render.validate_subtype_gates(
        {"fronte_categorie": ["piano"], "categories": {"piano": {"subtype_profiles": {
            "elementale": {"descrizione": "x"}}}}}) == []


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_homebrew_bridge(tmp_path):
    """Ponte homebrew→motore (crea_pg/sali_pg): incantesimiHomebrew filtra le note
    categoria=incantesimo per classe (classi cita la classe, o vuote = tutti),
    raggruppa per livello (mancante→1), esclude archiviate; fondiPool unisce SRD+
    homebrew senza duplicati; talentiHomebrew raccoglie le note categoria=talento.
    Degrada a vuoto senza app.vault.getMarkdownFiles (verificato dai test PG e2e)."""
    import build_personaggio
    full = build_personaggio.build_personaggio_options(CORE)
    opt = {"caratteristiche": full["caratteristiche"],
           "abilita": {k: {"label": v.get("label", k)} for k, v in full["abilita"].items()},
           "slot_incantatore": full["slot_incantatore"]}
    harness = tmp_path / "hb.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "crea_pg.js"))});'
        f'const sali=require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});'
        f'const opt={json.dumps(opt, ensure_ascii=False)};'
        'const F=(basename,fm)=>({f:{basename,path:basename+".md"},fm});'
        'const files=[F("Dardo arcano",{categoria:"incantesimo",livello:1,classi:"Mago, Stregone"}),'
        ' F("Tocco gelido",{categoria:"incantesimo",livello:0,classi:"Mago"}),'
        ' F("Cura ferite",{categoria:"incantesimo",livello:1,classi:"Chierico"}),'
        ' F("Eco senza scuola",{categoria:"incantesimo",livello:2}),'              # niente classi = a tutti
        ' F("Spell vecchio",{categoria:"incantesimo",livello:1,classi:"Mago",stato:"archiviata"}),'  # esclusa
        ' F("Maestro ombre",{categoria:"talento"}),'
        ' F("Talento vecchio",{categoria:"talento",stato:"archiviata"}),'          # esclusa
        ' F("Cenerino",{categoria:"background",car_background:"Forza, Costituzione, Saggezza",'
        '   abilita_background:"Atletica, Sopravvivenza",talento_origine:"Robusto",strumento:"Strumenti da fabbro"}),'
        ' F("Ceneride",{categoria:"specie",taglia:"Media",velocita:"9 m",tratti:"Vedono al buio: scurovisione a 18 m."}),'
        ' F("Lama del Vuoto",{categoria:"classe",dado_vita:"d10",ts_competenze:"Forza, Costituzione",'
        '   tipo_incantatore:"mezzo",competenze_armature:"Armature leggere e medie; scudi",abilita_numero:2,'
        '   privilegi_l1:"Colpo del vuoto; Lama spettrale",livello_sottoclasse:3}),'
        ' F("Bruto",{categoria:"classe",dado_vita:"d12",ts_competenze:"Forza, Costituzione",tipo_incantatore:"nessuno"}),'
        ' F("Setta del Nulla",{categoria:"sottoclasse",classe:"[[Lama del Vuoto]]"}),'  # sottoclasse homebrew
        ' F("Un luogo",{categoria:"luogo"})];'                                     # esclusa
        'global.app={vault:{getMarkdownFiles:()=>files.map(x=>x.f)},'
        ' metadataCache:{getFileCache:(f)=>({frontmatter:(files.find(x=>x.f===f)||{}).fm})}};'
        'const out={'
        ' mago:crea.incantesimiHomebrew("mago","Mago"),'
        ' chierico:crea.incantesimiHomebrew("chierico","Chierico"),'
        ' fusione:crea.fondiPool({"1":["Palla di fuoco"]},{"1":["Dardo arcano"],"0":["Tocco gelido"]}),'
        ' talenti:Object.keys(sali.talentiHomebrew()),'
        ' bg:crea.backgroundHomebrew(opt).Cenerino,'
        ' sp:crea.specieHomebrew().Ceneride,'
        ' cl:crea.classeHomebrew(opt)["Lama del Vuoto"],'
        ' clMartial:crea.classeHomebrew(opt).Bruto,'
        ' clSali:sali.classeHomebrew(opt)["Lama del Vuoto"],'
        ' sub:Object.keys(sali.sottoclasseHomebrew("Lama del Vuoto","Lama del Vuoto"))};'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["mago"] == {"0": ["Tocco gelido"], "1": ["Dardo arcano"], "2": ["Eco senza scuola"]}  # Mago + senza-classi, no Chierico/archiviata
    assert out["chierico"] == {"1": ["Cura ferite"], "2": ["Eco senza scuola"]}
    assert out["fusione"]["1"] == ["Palla di fuoco", "Dardo arcano"] and out["fusione"]["0"] == ["Tocco gelido"]
    assert out["talenti"] == ["Maestro ombre"]                                     # talento attivo, no archiviata/luogo
    # Background homebrew: label umane → id del motore (tollerante).
    assert out["bg"]["punteggi_caratteristica"] == ["forza", "costituzione", "saggezza"]
    assert out["bg"]["competenze_abilita"] == ["atletica", "sopravvivenza"]
    assert out["bg"]["talento_origine"] == "Robusto" and out["bg"]["strumenti"] == "Strumenti da fabbro"
    # Specie homebrew: taglia/velocità parsate, scurovisione dedotta dai tratti.
    assert out["sp"]["taglia"] == "Media" and out["sp"]["velocita"] == 9 and out["sp"]["scurovisione"] is True
    # Classe homebrew CASTER (mezzo): dado vita, TS→id, categorie armatura, slot L1 dalla tabella SRD.
    cl = out["cl"]
    assert cl["dado_vita"] == 10 and cl["tiri_salvezza"] == ["forza", "costituzione"]
    assert cl["incantatore"] is True and cl["tipo_incantatore"] == "mezzo"
    assert cl["competenze_armature_cat"] == ["leggera", "media", "scudo"]
    assert cl["slot_l1"] == {"1": 2} and cl["abilita"]["scelte"] == 2 and len(cl["abilita"]["opzioni"]) == 18
    # Privilegi di 1º livello (lista, split su ";") + livello sottoclasse (default 3).
    assert cl["privilegi_l1"] == ["Colpo del vuoto", "Lama spettrale"] and cl["livello_sottoclasse"] == 3
    assert out["clMartial"]["incantatore"] is False and out["clMartial"]["slot_l1"] == {}  # marziale: niente slot
    assert out["clMartial"]["livello_sottoclasse"] == 3 and out["clMartial"]["privilegi_l1"] == []  # default/vuoto
    assert out["clSali"]["dado_vita"] == 10 and out["clSali"]["tipo_incantatore"] == "mezzo"  # twin crea/sali coerenti
    assert out["sub"] == ["Setta del Nulla"]  # sottoclasse homebrew legata alla classe (sali_pg)


