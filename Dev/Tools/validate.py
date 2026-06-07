#!/usr/bin/env python3
"""Validazione del modello GDR (confine core/system, dup-ID, snake_case, shape,
file-entità) e dei template/Jinja. Estratto da render.py: check() ritorna 0/1 ed
è il cuore di `npm run check` e del test test_check_passes."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from common import (
    JINJA_DIR,
    JS_DIR,
    apply_entities,
    deep_merge,
    js_source,
    load_core_parts,
    load_entities,
    load_pages,
    load_templates,
    load_yaml,
)

# JSON Schema dei payload runtime (contratto Python→JS): vivono accanto a validate.py.
SCHEMA_DIR = Path(__file__).resolve().parent / "schemas"

# Cattura gli id usati nei Jinja come field('id') / field("id").
FIELD_REF_RE = re.compile(r"""field\(\s*['"]([a-z0-9_]+)['"]""")

# Identificatore che diventa chiave di frontmatter / cartella: snake_case.
SNAKE_RE = re.compile(r"^[a-z][a-z0-9_]*$")

# Blocco di codice condiviso fra i marker `// >>>nome` / `// <<<nome` in un .js.
MARKED_BLOCK_RE = r"//\s*>>>{name}\s*\n(.*?)\n\s*//\s*<<<{name}"


def marked_block(text: str, name: str) -> str | None:
    """Estrae il blocco fra `// >>>{name}` e `// <<<{name}` (None se assente)."""
    m = re.search(MARKED_BLOCK_RE.format(name=re.escape(name)), text, re.S)
    return m.group(1).strip() if m else None

# Eccezioni di interoperabilità: chiavi-campo NON snake_case perché un plugin
# terzo le richiede col nome esatto. fc-* = chiavi-evento di Calendarium (ponte
# 'tempo del mondo'): il plugin legge fc-date/fc-calendar/fc-category dal
# frontmatter, quindi i nomi col trattino sono obbligati, non un refuso.
INTEROP_FIELDS = {"fc-date", "fc-end", "fc-calendar", "fc-category"}

# Sezioni "di piano": devono restare nel rispettivo file. tavolo/assi_tematici/
# states (il differenziatore worldbuilding) solo in core.yaml; scheda/statblock/
# caratteristiche (i meccanismi 5.5e) solo in system.yaml.
CORE_ONLY_SECTIONS = ("tavolo", "assi_tematici", "states", "spunti")
SYSTEM_ONLY_SECTIONS = ("scheda", "statblock", "caratteristiche", "abilita")

# Sezioni-mappa (id -> definizione) partizionate fra i due file: gli stessi id
# non devono comparire in entrambi (dup-ID).
PARTITIONED_SECTIONS = ("folders", "fields", "categories", "creation", "relazioni")


def validate_split(core_raw: dict[str, Any], system_raw: dict[str, Any], merged: dict[str, Any]) -> list[str]:
    """Valida il confine core/system + dup-ID + snake_case + shape del modello
    fuso. Ritorna la lista degli errori (vuota = tutto a posto)."""
    errors: list[str] = []

    # 1) Confine: ogni sezione "di piano" vive in un solo file.
    for section in CORE_ONLY_SECTIONS:
        if section in system_raw:
            errors.append(f"confine: '{section}' è worldbuilding -> va in core.yaml, non in system.yaml")
    for section in SYSTEM_ONLY_SECTIONS:
        if section in core_raw:
            errors.append(f"confine: '{section}' è di sistema 5.5e -> va in system.yaml, non in core.yaml")

    # 2) dup-ID: nessun id partizionato compare in entrambi i file.
    for section in PARTITIONED_SECTIONS:
        shared = set(core_raw.get(section, {}) or {}) & set(system_raw.get(section, {}) or {})
        for key in sorted(shared):
            errors.append(f"dup-ID: '{key}' definito sia in core.{section} sia in system.{section}")

    # 3) snake_case: gli identificatori che diventano chiavi di frontmatter/cartelle.
    def snake(scope: str, names: Any) -> None:
        for name in names or []:
            if name is None or (scope == "fields" and name in INTEROP_FIELDS):
                continue
            if not SNAKE_RE.match(str(name)):
                errors.append(f"snake_case: '{name}' in {scope} non è snake_case")

    snake("folders", merged.get("folders", {}))
    snake("fields", merged.get("fields", {}))
    snake("categories", merged.get("categories", {}))
    snake("abilita", merged.get("abilita", {}))
    snake("caratteristiche", [c.get("id") for c in merged.get("caratteristiche", []) or []])
    for cat, assi in (merged.get("assi_tematici", {}) or {}).items():
        snake(f"assi_tematici[{cat}]", [a.get("id") for a in assi or []])
    for cat, rels in (merged.get("relazioni", {}) or {}).items():
        snake(f"relazioni[{cat}]", [r.get("field") for r in rels or []])

    # 4) shape: struttura attesa delle sezioni del modello.
    fields = merged.get("fields", {}) or {}
    folders = merged.get("folders", {}) or {}
    for fid, spec in fields.items():
        if not isinstance(spec, dict) or not spec.get("label") or not spec.get("widget"):
            errors.append(f"shape: campo '{fid}' senza label/widget")
    for cat, spec in (merged.get("categories", {}) or {}).items():
        if not isinstance(spec, dict) or not spec.get("folder") or not spec.get("subtypes"):
            errors.append(f"shape: categoria '{cat}' senza folder/subtypes")
        elif spec.get("folder") not in folders:
            errors.append(f"shape: categoria '{cat}' -> folder '{spec.get('folder')}' non in folders")
    for entry in merged.get("tavolo", []) or []:
        if not all(entry.get(k) for k in ("field", "callout", "title")):
            errors.append(f"shape: voce tavolo {entry} senza field/callout/title")
    for cat, campi in (merged.get("scheda", {}) or {}).items():
        for fid in campi or []:
            if fid not in fields:
                errors.append(f"shape: scheda[{cat}] -> campo '{fid}' non in fields")
    for cat, rels in (merged.get("relazioni", {}) or {}).items():
        for rel in rels or []:
            if not all(rel.get(k) for k in ("field", "label", "category")):
                errors.append(f"shape: relazioni[{cat}] voce {rel} senza field/label/category")
    for entry in merged.get("caratteristiche", []) or []:
        if not entry.get("id") or not entry.get("sigla"):
            errors.append(f"shape: caratteristica {entry} senza id/sigla")
    car_ids = {c.get("id") for c in merged.get("caratteristiche", []) or []}
    for aid, spec in (merged.get("abilita", {}) or {}).items():
        if not isinstance(spec, dict) or not spec.get("label") or spec.get("caratteristica") not in car_ids:
            errors.append(f"shape: abilità '{aid}' senza label o con caratteristica non valida")
    axis_ids: dict[str, set] = {}
    for cat, assi in (merged.get("assi_tematici", {}) or {}).items():
        axis_ids[cat] = {a.get("id") for a in (assi or [])}
        for a in assi or []:
            # Formato RICCO: {id, nome, valori:{n:{etichetta, descrizione}}}.
            if not (a.get("id") and a.get("nome") and a.get("valori")):
                errors.append(f"shape: assi_tematici[{cat}] voce {a} senza id/nome/valori")
            for k, v in (a.get("valori") or {}).items():
                if not isinstance(v, dict) or not v.get("etichetta"):
                    errors.append(f"shape: assi_tematici[{cat}].{a.get('id')} valore {k} senza etichetta")
    # Archetipi: {id, nome, quando:{asse: comparatore}, tag:[...]}. 'quando' deve
    # riferire assi reali della categoria (cattura i typo che spegnerebbero il match).
    for cat, archs in (merged.get("archetipi", {}) or {}).items():
        for a in archs or []:
            if not (a.get("id") and a.get("nome") and a.get("tag")):
                errors.append(f"shape: archetipi[{cat}] voce {a} senza id/nome/tag")
            for axis in (a.get("quando") or {}):
                if axis not in axis_ids.get(cat, set()):
                    errors.append(f"shape: archetipi[{cat}].{a.get('id')} -> asse '{axis}' non in assi_tematici[{cat}]")
    # Famiglie: il preset 'assi' (opzionale) deve riferire assi reali della
    # categoria (anti-typo), valori 1-5; lo usa create_entity.famigliaPreset.
    for cat, spec in (merged.get("categories", {}) or {}).items():
        for fam in (spec or {}).get("famiglie", []) or []:
            for axis, val in (fam.get("assi") or {}).items():
                if axis not in axis_ids.get(cat, set()):
                    errors.append(f"shape: famiglie[{cat}].{fam.get('nome')} -> asse '{axis}' non in assi_tematici[{cat}]")
                elif not (isinstance(val, int) and 1 <= val <= 5):
                    errors.append(f"shape: famiglie[{cat}].{fam.get('nome')}.{axis} = {val} fuori 1-5")
    # Una relazione NON deve collidere con un campo BODY (prosa) della stessa
    # categoria: stessa chiave frontmatter -> doppio bind nella nota (textArea del
    # body + suggester della relazione). La collisione con un creation FIELD (link)
    # è invece intenzionale (è lo stesso legame, chiesto nel wizard e reso una volta).
    creation = merged.get("creation", {}) or {}
    for cat, rels in (merged.get("relazioni", {}) or {}).items():
        body = {q.get("field") for q in (creation.get(cat, {}) or {}).get("body", []) or []}
        for r in rels or []:
            if r.get("field") in body:
                errors.append(f"collisione: relazioni[{cat}].{r.get('field')} coincide con un campo body (doppio bind nella nota)")
    return errors


def validate_entities(core_raw: dict[str, Any], system_raw: dict[str, Any],
                      entities: list[dict[str, Any]], merged: dict[str, Any]) -> list[str]:
    """Valida i file-entità: shape minima + nessuna collisione di id-categoria o
    di campo con core.yaml/system.yaml (un'entità non ridefinisce cose globali)."""
    errors: list[str] = []
    base_cats = set(core_raw.get("categories", {}) or {}) | set(system_raw.get("categories", {}) or {})
    base_fields = set(core_raw.get("fields", {}) or {}) | set(system_raw.get("fields", {}) or {})
    seen_ids: set[str] = set()
    for entity in entities:
        eid = entity.get("id")
        if not eid or not entity.get("folder"):
            errors.append(f"entity {entity.get('id')!r}: manca id o folder")
            continue
        if eid in seen_ids:
            errors.append(f"entity '{eid}': id duplicato fra i file-entità")
        seen_ids.add(eid)
        if eid in base_cats:
            errors.append(f"entity '{eid}': categoria già in core.yaml/system.yaml (dup)")
        for field_id in (entity.get("fields") or {}):
            if field_id in base_fields:
                errors.append(f"entity '{eid}': campo '{field_id}' già in core/system (dup)")
        for template in entity.get("templates", []) or []:
            # 'jinja' è opzionale: assente -> scheletro condiviso _entity_base.j2.
            for key in ("id", "title", "target"):
                if not template.get(key):
                    errors.append(f"entity '{eid}': template senza '{key}'")
    return errors


def validate_entity_schema(entities: list[dict[str, Any]]) -> list[str]:
    """Schema strutturale dei file-entità: tipi e chiavi richieste. Complementa
    validate_entities (collisioni) con un controllo di forma per-file."""
    errors: list[str] = []

    def need(cond: Any, msg: str) -> None:
        if not cond:
            errors.append(msg)

    # `from` ammessi nei wizard (create_entity.js): allinea YAML↔JS. None = prompt
    # testo libero (ramo default). Un valore ignoto degraderebbe in silenzio in-app.
    VALID_FROM = {None, "subtypes", "list", "notes", "number"}
    entity_ids = {e.get("id") for e in entities}

    for entity in entities:
        eid = entity.get("id", "?")
        need(isinstance(entity.get("id"), str), f"entity {eid}: 'id' non è stringa")
        need(isinstance(entity.get("folder"), str) and entity.get("folder"), f"entity {eid}: 'folder' mancante/non stringa")
        need(isinstance(entity.get("order", 0), int), f"entity {eid}: 'order' non è intero")
        need(isinstance(entity.get("subtypes", []), list), f"entity {eid}: 'subtypes' non è lista")
        for fam in entity.get("famiglie", []) or []:
            need(isinstance(fam, dict) and fam.get("nome"), f"entity {eid}: famiglia senza 'nome'")
        for tpl in entity.get("templates", []) or []:
            missing = {"id", "title", "target"} - set(tpl)  # 'jinja' opzionale (default _entity_base.j2)
            need(not missing, f"entity {eid}: template '{tpl.get('id', '?')}' senza {sorted(missing)}")
        for fid, spec in (entity.get("fields") or {}).items():
            need(isinstance(spec, dict) and spec.get("label") and spec.get("widget"),
                 f"entity {eid}: campo '{fid}' senza label/widget")
        for rel in entity.get("relazioni", []) or []:
            missing = {"field", "label", "category"} - set(rel)
            need(not missing, f"entity {eid}: relazione senza {sorted(missing)}")
        for ax in entity.get("assi", []) or []:
            # Formato RICCO: {id, nome, valori:{n:{etichetta, descrizione}}}.
            need(ax.get("id") and ax.get("nome") and isinstance(ax.get("valori"), dict),
                 f"entity {eid}: asse {ax.get('id', '?')} senza id/nome/valori")
            for n, v in (ax.get("valori") or {}).items():
                need(isinstance(v, dict) and v.get("etichetta"),
                     f"entity {eid}: asse {ax.get('id')} valore {n} senza etichetta")
        creation = entity.get("creation") or {}
        need(isinstance(creation, dict), f"entity {eid}: 'creation' non è mappa")
        for question in (creation.get("fields", []) or []) + (creation.get("body", []) or []):
            need("field" in question and "prompt" in question, f"entity {eid}: domanda wizard senza field/prompt")
            fid = question.get("field", "?")
            frm = question.get("from")
            need(frm in VALID_FROM, f"entity {eid}: campo '{fid}' usa from '{frm}' non gestito da create_entity.js")
            need(not (frm == "list" and not question.get("options")),
                 f"entity {eid}: campo '{fid}' from:list senza 'options'")
            need(not (frm == "notes" and question.get("category") not in entity_ids),
                 f"entity {eid}: campo '{fid}' from:notes con category '{question.get('category')}' inesistente")
            need(not ({"required", "optional"} <= set(question)),
                 f"entity {eid}: campo '{fid}' dichiara sia 'required' sia 'optional' (ambiguo)")
    return errors


def validate_reciprocals(core: dict[str, Any]) -> list[str]:
    """Integrità degli inversi ESPLICITI (meta_actions.inverseRelation): se una
    relazione dichiara `reciprocal`, quel campo deve essere una relazione ESISTENTE
    sulla categoria target — simmetrica (luogo.confina_con↔confina_con) o direzionale
    (evento.causato_da↔conseguenze). Un refuso qui farebbe scrivere a Collega un
    inverso fantasma invece del campo giusto; lo intercettiamo a build."""
    errors: list[str] = []
    relazioni = core.get("relazioni", {}) or {}
    for source_cat, rels in relazioni.items():
        for rel in rels or []:
            recip = rel.get("reciprocal")
            if not recip:
                continue
            target = rel.get("category")
            target_fields = {r.get("field") for r in (relazioni.get(target, []) or [])}
            if recip not in target_fields:
                errors.append(
                    f"relazioni[{source_cat}].{rel.get('field')}: reciprocal '{recip}' "
                    f"non è una relazione di '{target}'")
    return errors


def validate_subtype_gates(core: dict[str, Any]) -> list[str]:
    """Coerenza flag-sottotipo ↔ gate-categoria. Un sottotipo che si dichiara Fronte
    (`clock:true`) o evolvente (`evoluzione:true`) DEVE stare in una categoria abilitata
    — clock ⟹ `fronte_categorie`, evoluzione ⟹ `tappe_categorie` — altrimenti
    `renderTipoProfilo` prometterebbe al tavolo un Fronte / una Cronologia che il
    template non emette per quella categoria (la classe-bug calamita/ecosistema, dove
    un sottotipo `evoluzione:true` rinviava a una tab inesistente). Il vincolo è solo
    flag ⟹ gate, NON il viceversa: i gate possono essere più ampi (Fronti curati a
    livello-categoria senza flag per-sottotipo, es. il set cosmo di views.js)."""
    errors: list[str] = []
    fronte = set(core.get("fronte_categorie", []) or [])
    tappe = set(core.get("tappe_categorie", []) or [])
    for cid, cat in (core.get("categories", {}) or {}).items():
        for sub, prof in ((cat or {}).get("subtype_profiles") or {}).items():
            if (prof or {}).get("clock") and cid not in fronte:
                errors.append(f"{cid}/{sub}: clock:true ma '{cid}' non è in fronte_categorie")
            if (prof or {}).get("evoluzione") and cid not in tappe:
                errors.append(f"{cid}/{sub}: evoluzione:true ma '{cid}' non è in tappe_categorie")
    return errors


def validate_aux_yaml() -> list[str]:
    """Shape degli YAML AUSILIARI letti a runtime dai JS/plugin ma non fusi nel
    modello core/system: astrologia (views.renderTemaNatale), generatori (genera.js),
    pg_rules (build_personaggio). Senza questo un refuso qui passa tutto il resto di
    check() e rompe SOLO in-app. Ogni file è opzionale (la pipeline degrada se
    assente): se manca, si salta."""
    errors: list[str] = []

    def load(name: str) -> Any:
        try:
            return load_yaml(name)
        except Exception:
            return None

    # astrologia.yaml -> views.renderTemaNatale (segno -> archetipo/elemento/mbti/ombra).
    astro = load("astrologia.yaml")
    if astro:
        for key in ("segni", "elementi", "arcani"):
            if not isinstance(astro.get(key), list) or not astro.get(key):
                errors.append(f"astrologia: '{key}' assente o vuoto")
        for s in astro.get("segni", []) or []:
            if not (isinstance(s, dict) and s.get("nome") and s.get("elemento") and s.get("archetipo")):
                nome = s.get("nome", "?") if isinstance(s, dict) else s
                errors.append(f"astrologia: segno '{nome}' senza nome/elemento/archetipo")
        for e in astro.get("elementi", []) or []:
            if not (isinstance(e, dict) and e.get("nome")):
                errors.append(f"astrologia: elemento {e} senza nome")
        # Coerenza: ogni segno.elemento deve esistere fra gli elementi (un refuso
        # qui rompe il lookup di renderTemaNatale in silenzio, tema natale parziale).
        elem_names = {e.get("nome") for e in astro.get("elementi", []) or [] if isinstance(e, dict)}
        for s in astro.get("segni", []) or []:
            if isinstance(s, dict) and s.get("elemento") and s.get("elemento") not in elem_names:
                errors.append(f"astrologia: segno '{s.get('nome')}' elemento '{s.get('elemento')}' non fra gli elementi")
        for a in astro.get("arcani", []) or []:
            if not (isinstance(a, dict) and a.get("nome")):
                errors.append(f"astrologia: arcano {a} senza nome")

    # generatori.yaml -> genera.js (l'anti-drift stile_nomi <-> stili è già in check()).
    gen = load("generatori.yaml")
    if gen:
        if not gen.get("stili"):
            errors.append("generatori: 'stili' assente o vuoto")
        for sid, spec in (gen.get("stili") or {}).items():
            persona = (spec or {}).get("persona") or {}
            if not (spec.get("label") and persona.get("inizi") and persona.get("fini_m") and persona.get("fini_f")):
                errors.append(f"generatori: stile '{sid}' senza label o persona.{{inizi,fini_m,fini_f}}")
        top = gen.get("toponimi") or {}
        if not (top.get("prefissi") and top.get("suffissi")):
            errors.append("generatori: toponimi senza prefissi/suffissi")
        faz = gen.get("fazioni") or {}
        for k in ("forme", "sintagma", "nucleo_pl", "aggettivo"):
            if not faz.get(k):
                errors.append(f"generatori: fazioni.{k} assente")
        # Spunti per il tavolo: ogni sezione-generatore (dict con `forme`, oltre a
        # fazioni già validata sopra) — ogni placeholder {chiave} usato (nelle forme o
        # nelle liste) deve avere una lista omonima nella sezione, eccetto i terminali
        # {nome}/{luogo}. Cattura i refusi (lista mancante → output silenziosamente
        # vuoto). Auto-rileva le sezioni: aggiungere un generatore non tocca il check.
        for sec, block in gen.items():
            if sec == "fazioni" or not (isinstance(block, dict) and block.get("forme")):
                continue
            testo = " ".join(str(x) for v in block.values()
                              for x in (v if isinstance(v, list) else [v]))
            missing = (set(re.findall(r"\{(\w+)\}", testo)) - {"nome", "luogo"}) - set(block)
            if missing:
                errors.append(f"generatori: {sec} usa placeholder senza lista: {sorted(missing)}")

    # pg_rules.yaml -> build_personaggio (rules-engine PG: metodi car., ASI bg, CA, lingue).
    pg = load("pg_rules.yaml")
    if pg:
        metodi = (pg.get("generazione_caratteristiche") or {}).get("metodi") or {}
        if not metodi:
            errors.append("pg_rules: generazione_caratteristiche.metodi assente")
        # Chiavi aritmetico-critiche lette dai wizard (pointBuy/assegnaArray): un
        # refuso qui non lancia, dà point-buy "gratis" o array vuoto, in silenzio.
        pb = metodi.get("point_buy") or {}
        if pb and not isinstance(pb.get("costi"), dict):
            errors.append("pg_rules: point_buy.costi assente o non è una mappa")
        arr = metodi.get("array_standard") or {}
        if arr and not isinstance(arr.get("valori"), list):
            errors.append("pg_rules: array_standard.valori assente o non è una lista")
        if not (pg.get("aumento_background") or {}).get("schemi"):
            errors.append("pg_rules: aumento_background.schemi assente")
        for aid, arm in (pg.get("armature") or {}).items():
            if not (isinstance(arm, dict) and arm.get("label") and arm.get("categoria")
                    and "ca_base" in arm and "dex_max" in arm):
                errors.append(f"pg_rules: armatura '{aid}' senza label/categoria/ca_base/dex_max")
        lingue = pg.get("lingue") or {}
        if not (lingue.get("standard") and lingue.get("numero_a_scelta") is not None):
            errors.append("pg_rules: lingue senza standard/numero_a_scelta")

    return errors


def validate_runtime_payloads(core: dict[str, Any], templates: list[dict[str, Any]]) -> list[str]:
    """Valida la SHAPE dei payload runtime (core.json, personaggio.json) contro i loro
    JSON Schema (schemas/): è il contratto Python→JS reso ESPLICITO. Un drift di shape
    — chiave rinominata/rimossa o tipo cambiato dal lato Python che il JS legge — si ferma
    al build invece di rompere muto in-app. Costruisce i payload IN-MEMORY (non scrive file)."""
    import jsonschema  # dev-dep (requirements-dev.txt): serve solo a check-time, non nel vault
    from build_personaggio import build_personaggio_options
    from render import engine_payload  # differito: render importa validate al load (no ciclo a runtime)

    errors: list[str] = []
    casi = [
        ("core.json", engine_payload(core, templates), "core.schema.json"),
        ("personaggio.json", build_personaggio_options(core), "personaggio.schema.json"),
    ]
    for name, data, schema_file in casi:
        schema = json.loads((SCHEMA_DIR / schema_file).read_text(encoding="utf-8"))
        for e in sorted(jsonschema.Draft202012Validator(schema).iter_errors(data),
                        key=lambda e: list(map(str, e.path))):
            loc = "/".join(str(p) for p in e.path) or "(radice)"
            errors.append(f"{name} @ {loc}: {e.message}")
    return errors


def check() -> int:
    errors: list[str] = []
    core_raw, system_raw = load_core_parts()
    entities = load_entities()
    core = apply_entities(deep_merge(core_raw, system_raw), entities)
    errors.extend(validate_split(core_raw, system_raw, core))
    errors.extend(validate_entities(core_raw, system_raw, entities, core))
    errors.extend(validate_entity_schema(entities))
    errors.extend(validate_aux_yaml())
    errors.extend(validate_runtime_payloads(core, load_templates()))
    plugins = load_yaml("plugins.yaml")
    categories = core.get("categories", {})
    folders = core.get("folders", {})
    fields = core.get("fields", {})
    metabind = plugins.get("metabind_inputs") or {}

    # Le categorie dei template (templates.yaml + file-entità) devono essere
    # dichiarate e avere una cartella risolvibile (i bottoni 'Crea ...' creano la
    # nota in quella cartella).
    for template in load_templates():
        category = template.get("category")
        if category not in categories:
            errors.append(f"{template.get('id')}: categoria non dichiarata ({category})")
        else:
            folder_key = (categories.get(category) or {}).get("folder", category)
            if folder_key not in folders:
                errors.append(f"{template.get('id')}: cartella '{folder_key}' non in folders")
        jinja = str(template.get("jinja", ""))
        if not (JINJA_DIR / jinja).exists():
            errors.append(f"{template.get('id')}: Jinja mancante ({jinja})")

    # Tipi Meta Bind INLINE (`INPUT[tipo:prop]`, resi dalla macro field()): non hanno
    # bisogno di un template in metabind_inputs. Gli altri widget DEVONO avere un template.
    inline_widgets = ("text", "number", "toggle", "date", "datePicker", "time")
    # Il placeholder è emesso GREZZO in `INPUT[text(placeholder(...)):prop]`: Meta Bind NON
    # accetta valori-argomento quotati (né '…' né "…"). Vietati i caratteri che spezzano il
    # parser argomenti (MB_PARSINOM): () [] : , ` e gli apici DRITTI ' e ". Per un apostrofo
    # nel testo usa quello tipografico ' (U+2019), che il parser tratta come lettera normale.
    placeholder_vietati = set("()[]:,`'") | {'"'}
    for field_id, spec in fields.items():
        spec = spec or {}
        widget = spec.get("widget")
        if widget and widget not in inline_widgets and widget not in metabind:
            errors.append(f"campo {field_id}: widget '{widget}' assente da metabind_inputs")
        ph = spec.get("placeholder")
        if ph is not None:
            if widget not in ("text", "number"):
                errors.append(f"campo {field_id}: 'placeholder' ammesso solo su widget text/number (è '{widget}')")
            if set(str(ph)) & placeholder_vietati:
                errors.append(f"campo {field_id}: placeholder con caratteri che rompono il parser Meta Bind — ()[]:,` o apici dritti ' \" (usa l'apostrofo tipografico ’)")

    # Anti-drift: gli elenchi-di-categorie di core.yaml (chi riceve il Fronte/clock,
    # le tappe, il motore di coerenza, il ritratto) devono nominare SOLO categorie
    # dichiarate. Un typo qui scollerebbe in silenzio una feature dalle sue entità.
    for key in ("fronte_categorie", "tappe_categorie", "coerenza_categorie", "ritratto_categorie", "banner_categorie"):
        for cat in core.get(key, []) or []:
            if cat not in categories:
                errors.append(f"{key}: categoria non dichiarata ({cat})")

    # infobox_relazioni: mappa categoria → [field di relazioni pinnate nell'infobox]. La
    # categoria deve esistere e ogni field essere una relazione REALE di quella categoria
    # (altrimenti identita_card non pinnerebbe nulla, in silenzio).
    rel_fields = {cat: {r.get("field") for r in (rels or [])}
                  for cat, rels in (core.get("relazioni", {}) or {}).items()}
    for cat, flds in (core.get("infobox_relazioni", {}) or {}).items():
        if cat not in categories:
            errors.append(f"infobox_relazioni: categoria non dichiarata ({cat})")
            continue
        for fid in flds or []:
            if fid not in rel_fields.get(cat, set()):
                errors.append(f"infobox_relazioni[{cat}]: '{fid}' non è una relazione di {cat}")

    # Gruppi: ogni entità dichiara un `gruppo` che deve esistere in core.gruppi.
    gruppi_ids = {g.get("id") for g in core.get("gruppi", []) or []}
    for cid, cat in categories.items():
        grp = (cat or {}).get("gruppo")
        if grp is None:
            errors.append(f"{cid}: manca il campo 'gruppo' (entities/{cid}.yaml)")
        elif grp not in gruppi_ids:
            errors.append(f"{cid}: gruppo '{grp}' non dichiarato in core.gruppi")
        # Profili-sottotipo: i `campi` dichiarati devono essere campi registrati
        # (renderTipoProfilo ne legge la label da core.fields).
        for sub, prof in ((cat or {}).get("subtype_profiles") or {}).items():
            for fid in (prof or {}).get("campi", []) or []:
                if fid not in fields:
                    errors.append(f"{cid}/{sub}: campo-profilo '{fid}' non in core.fields")
    errors.extend(validate_subtype_gates(core))

    # Anti-drift: le opzioni del select 'stile_nomi' (plugins.metabind_inputs)
    # devono combaciare con gli stili di generatori.yaml, che genera.js legge a
    # runtime. Così aggiungere uno stile in un solo posto è un errore esplicito.
    try:
        gen_stili = set((load_yaml("generatori.yaml").get("stili") or {}))
    except Exception:
        gen_stili = set()
    if gen_stili:
        opt_ids = set(re.findall(r"option\(\s*([a-z_]+)", str(metabind.get("stile_nomi", ""))))
        if opt_ids != gen_stili:
            errors.append(f"stile_nomi: opzioni metabind {sorted(opt_ids)} != stili generatori.yaml {sorted(gen_stili)}")

    # Anti-drift: le opzioni del select 'padronanza' (le 8 maestrie d'arma 2024) devono
    # combaciare con system.yaml:maestrie_armi (il quick-ref al tavolo). Un nome che diverge
    # qui mostrerebbe nel picker una maestria diversa da quella documentata.
    maestrie = {m.get("nome") for m in (core.get("maestrie_armi") or []) if isinstance(m, dict)}
    if maestrie and "padronanza" in metabind:
        pad_opts = set(re.findall(r"option\(([^)]+)\)", str(metabind.get("padronanza", ""))))
        if pad_opts != maestrie:
            errors.append(f"padronanza: opzioni metabind {sorted(pad_opts)} != maestrie_armi {sorted(maestrie)}")

    # JS — anti-drift strutturale dei comparatori `quando`: la grammatica matchesCond
    # ha UNA sorgente canonica (_comparators.js); views.js e meta_actions.js (script
    # autonomi, niente require a runtime) ne tengono una copia fra i marker
    # >>>matchesCond/<<<matchesCond. Qui impongo che le copie siano identiche alla
    # canonica: modificarne una sola è un errore di build, non un bug latente.
    canonical_path = JS_DIR / "_comparators.js"
    if canonical_path.is_file():
        canonical = marked_block(canonical_path.read_text(encoding="utf-8"), "matchesCond")
        if canonical is None:
            errors.append("_comparators.js: blocco matchesCond fra i marker mancante")
        else:
            for js_name in ("views.js", "meta_actions.js"):
                block = marked_block(js_source(js_name),"matchesCond")
                if block is None:
                    errors.append(f"{js_name}: blocco matchesCond fra i marker // >>>matchesCond/<<<matchesCond mancante")
                elif block != canonical:
                    errors.append(f"{js_name}: matchesCond diverge da _comparators.js (sorgente unica) — risincronizza")

    # JS — anti-drift del PONTE HOMEBREW: le funzioni condivise (note del vault →
    # opzioni SRD) hanno UNA sorgente canonica (_homebrew_bridge.js); crea_pg.js e
    # sali_pg.js (autonomi, niente require) ne tengono una COPIA fra i marker
    # >>>homebrew-bridge/<<<homebrew-bridge. Impongo l'uguaglianza così creazione e
    # level-up non possono usare regole homebrew divergenti (es. lavorando su sottoclasse).
    bridge_path = JS_DIR / "_homebrew_bridge.js"
    if bridge_path.is_file():
        bridge = marked_block(bridge_path.read_text(encoding="utf-8"), "homebrew-bridge")
        if bridge is None:
            errors.append("_homebrew_bridge.js: blocco homebrew-bridge fra i marker mancante")
        else:
            for js_name in ("crea_pg.js", "sali_pg.js"):
                block = marked_block(js_source(js_name),"homebrew-bridge")
                if block is None:
                    errors.append(f"{js_name}: blocco homebrew-bridge fra i marker // >>>homebrew-bridge/<<<homebrew-bridge mancante")
                elif block != bridge:
                    errors.append(f"{js_name}: ponte homebrew diverge da _homebrew_bridge.js (sorgente unica) — risincronizza")

    # JS — anti-drift della DERIVAZIONE DEGLI INVERSI: reciprocalField/inverseRelation
    # hanno UNA sorgente canonica (_relations.js); meta_actions.js (Collega) e
    # create_entity.js (inversi nel wizard di creazione) ne tengono una COPIA fra i
    # marker >>>relations/<<<relations. Così l'inverso scritto alla creazione e quello
    # scritto da Collega non possono divergere.
    relations_path = JS_DIR / "_relations.js"
    if relations_path.is_file():
        canonical_rel = marked_block(relations_path.read_text(encoding="utf-8"), "relations")
        if canonical_rel is None:
            errors.append("_relations.js: blocco relations fra i marker mancante")
        else:
            for js_name in ("meta_actions.js", "create_entity.js"):
                block = marked_block(js_source(js_name),"relations")
                if block is None:
                    errors.append(f"{js_name}: blocco relations fra i marker // >>>relations/<<<relations mancante")
                elif block != canonical_rel:
                    errors.append(f"{js_name}: inverseRelation/reciprocalField diverge da _relations.js (sorgente unica) — risincronizza")

    # Ogni field('<id>') usato nei Jinja deve esistere nel registro core.fields.
    # I partial (_*.j2) definiscono le macro, non le usano: vanno esclusi.
    for path in sorted(JINJA_DIR.glob("*.j2")):
        if path.name.startswith("_"):
            continue
        for field_id in FIELD_REF_RE.findall(path.read_text(encoding="utf-8")):
            if field_id not in fields:
                errors.append(f"{path.name}: campo '{field_id}' non nel registro core.fields")

    # La superficie giocabile (core.tavolo) è renderizzata da macro: i suoi campi
    # non passano dal controllo field('id') sopra, quindi validali qui.
    for entry in core.get("tavolo", []) or []:
        field_id = entry.get("field")
        if field_id not in fields:
            errors.append(f"tavolo: campo '{field_id}' non nel registro core.fields")

    # Le relazioni tipizzate puntano a una categoria target con cartella risolvibile
    # (la macro relazioni() costruisce un suggester su quella cartella).
    for source_cat, rels in (core.get("relazioni", {}) or {}).items():
        if source_cat not in categories:
            errors.append(f"relazioni: categoria '{source_cat}' non dichiarata")
        for rel in rels or []:
            target = rel.get("category")
            if target not in categories:
                errors.append(f"relazioni[{source_cat}].{rel.get('field')}: target '{target}' non dichiarato")
            elif (categories.get(target) or {}).get("folder", target) not in folders:
                errors.append(f"relazioni[{source_cat}].{rel.get('field')}: cartella di '{target}' non in folders")
    errors.extend(validate_reciprocals(core))

    # Pagine-indice: categoria dichiarata e template index disponibile.
    if load_pages() and not (JINJA_DIR / "index.md.j2").exists():
        errors.append("index.md.j2 mancante (richiesto da pages.yaml)")
    for page in load_pages():
        if page.get("category") not in categories:
            errors.append(f"page {page.get('id')}: categoria non dichiarata ({page.get('category')})")

    if errors:
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    return 0
