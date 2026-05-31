#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

# Cattura gli id usati nei Jinja come field('id') / field("id").
FIELD_REF_RE = re.compile(r"""field\(\s*['"]([a-z0-9_]+)['"]""")

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Dev" / "Source"
YAML_DIR = SOURCE / "YAML"
JINJA_DIR = SOURCE / "Jinja"
JS_DIR = SOURCE / "JS"
SAMPLES_DIR = SOURCE / "Samples"
SRD_DIR = SOURCE / "SRD"  # SRD 5.2.1 vendorizzata (markdown, CC-BY-4.0)

# Unico target di output: il vault Obsidian vivo. Si apre questa cartella in
# Obsidian e si rilancia `build` per vedere i cambiamenti dal vivo. Il repo di
# sviluppo (ROOT) resta pulito: nessun artefatto generato fuori da qui.
VAULT = ROOT / "dist" / "GDR-vault"

# Sottocartelle interamente generate: sicure da azzerare a ogni build. Il prefisso
# 'z.' le tiene in fondo; uno snippet CSS le nasconde dall'esploratore (vedi
# write_workspace_chrome). Restano indicizzate, quindi i plugin funzionano.
# z.* = cartelle di SISTEMA (nascoste dall'esploratore + escluse da ricerca).
# SRD = generata ma USER-FACING (navigabile/cercabile): in GENERATED_DIRS solo
# per il wipe-and-regen del clean, NON tra le nascoste.
HIDDEN_DIRS = ("z.modelli", "z.automazioni", "z.classi")
GENERATED_DIRS = (*HIDDEN_DIRS, "SRD")

# Cartella delle pagine-indice (hub): tiene la radice pulita.
INDEX_DIR = "Indici"

# Note generate alla radice del vault (non contenuti utente).
GENERATED_NOTES = ("Home.md", "LEGGIMI.md")


def load_yaml(name: str) -> dict[str, Any]:
    path = YAML_DIR / name
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non mappa")
    return data


# Lo schema delle entità 5.5e vive in system.yaml, separato dall'ontologia
# worldbuilding di core.yaml. I due si fondono in un unico 'core': i template,
# i JS (core.json) e i test consumano il modello unificato senza sapere dello
# split. Il confine (chi sta dove) è validato da check() (vedi validate_split).
SYSTEM_YAML = "system.yaml"


def deep_merge(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    """Fonde 'overlay' dentro 'base': i dict si fondono ricorsivamente per chiave,
    gli altri valori (liste/scalari) li sovrascrive overlay. Lo split è lossless,
    quindi in pratica i due file non condividono chiavi (lo garantisce check)."""
    merged = dict(base)
    for key, value in overlay.items():
        current = merged.get(key)
        if isinstance(current, dict) and isinstance(value, dict):
            merged[key] = deep_merge(current, value)
        else:
            merged[key] = value
    return merged


def load_core_parts() -> tuple[dict[str, Any], dict[str, Any]]:
    """Le due metà del modello: core.yaml (worldbuilding) e system.yaml (5.5e).
    system.yaml assente -> {} (lo split è opzionale, per retrocompatibilità)."""
    core = load_yaml("core.yaml")
    system = load_yaml(SYSTEM_YAML) if (YAML_DIR / SYSTEM_YAML).is_file() else {}
    return core, system


def load_core() -> dict[str, Any]:
    """Modello unificato (core.yaml + system.yaml fusi). Unico ingresso per
    build()/check()/test: i consumatori vedono un solo 'core' completo."""
    core, system = load_core_parts()
    return deep_merge(core, system)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def load_pages() -> list[dict[str, Any]]:
    """Pagine-indice (hub per dominio). Assenti = lista vuota (opzionali)."""
    path = YAML_DIR / "pages.yaml"
    if not path.is_file():
        return []
    return (yaml.safe_load(path.read_text(encoding="utf-8")) or {}).get("pages", []) or []


def generated_note_names() -> list[str]:
    """Note generate: Home/LEGGIMI alla radice + una pagina-indice per voce di
    pages.yaml (in INDEX_DIR/). Cosi' clean() le rimuove senza nomi hard-coded."""
    return [*GENERATED_NOTES, *(f"{INDEX_DIR}/{p['file']}.md" for p in load_pages())]


def clean() -> None:
    """Rimuove solo gli artefatti puramente generati (z.modelli, z.automazioni,
    z.classi, Home/LEGGIMI, pagine-indice). NON tocca .obsidian (config e plugin
    installati dall'utente) ne' i contenuti. Pulisce anche residui legacy in ROOT."""
    notes = generated_note_names()
    for base in (VAULT, ROOT):
        for name in GENERATED_DIRS:
            path = base / name
            if path.is_dir():
                shutil.rmtree(path)
        for rel in notes:
            path = base / rel
            if path.is_file():
                path.unlink()
    legacy_build = ROOT / "Dev" / "Build"
    if legacy_build.is_dir():
        shutil.rmtree(legacy_build)


def read_json(path: Path) -> Any:
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            return None
    return None


def merge_json(path: Path, updates: dict[str, Any]) -> None:
    """Aggiorna solo le chiavi gestite dalla pipeline, preservando il resto
    della config (impostazioni utente). Scrive solo se qualcosa cambia."""
    data = read_json(path)
    data = data if isinstance(data, dict) else {}
    merged = {**data, **updates}
    if merged != data:
        write_json(path, merged)


def merge_plugin_config(obsidian: Path, plugin_id: str, updates: dict[str, Any]) -> None:
    """Inietta la config generata solo se il plugin e' gia' installato: non
    crea cartelle plugin fittizie (romperebbero Obsidian)."""
    plugin_dir = obsidian / "plugins" / plugin_id
    if plugin_dir.is_dir():
        merge_json(plugin_dir / "data.json", updates)


def union_list(path: Path, values: list[str]) -> None:
    """Unione ordinata: garantisce le voci della pipeline senza rimuovere
    quelle aggiunte dall'utente."""
    existing = read_json(path)
    existing = existing if isinstance(existing, list) else []
    merged = list(dict.fromkeys([*existing, *values]))
    if merged != existing:
        write_json(path, merged)


def union_list_key(path: Path, key: str, values: list[str]) -> None:
    """Come union_list ma per una lista DENTRO una chiave di un JSON-oggetto
    (preserva le altre chiavi e le voci utente). Per app.json/appearance.json."""
    data = read_json(path)
    data = data if isinstance(data, dict) else {}
    existing = data.get(key) if isinstance(data.get(key), list) else []
    merged = list(dict.fromkeys([*existing, *values]))
    if merged != existing:
        data[key] = merged
        write_json(path, data)


# Snippet CSS generato: nasconde le cartelle di sistema (z.*) dall'esploratore.
# Restano indicizzate (data-path presente), quindi Templater/Metadata Menu/Dataview
# continuano a vederle: nascondiamo solo la riga nell'albero dei file.
HIDE_FOLDERS_SNIPPET = """/* GDR — generato. Nasconde le cartelle di sistema (z.*) dall'esploratore. */
.nav-folder.tree-item:has(> .tree-item-self[data-path^="z."]) {
  display: none;
}
"""


def write_workspace_chrome(obsidian: Path) -> None:
    """Pulizia dell'esploratore: snippet CSS che nasconde le z.* + esclusione da
    ricerca/grafo/suggerimenti (userIgnoreFilters). Tutto non distruttivo."""
    write_text(obsidian / "snippets" / "gdr.css", HIDE_FOLDERS_SNIPPET)
    union_list_key(obsidian / "appearance.json", "enabledCssSnippets", ["gdr"])
    union_list_key(obsidian / "app.json", "userIgnoreFilters", [f"{d}/" for d in HIDDEN_DIRS])


def template_folder(core: dict[str, Any], category: str) -> str:
    folders = core.get("folders", {})
    folder_key = (core.get("categories", {}).get(category) or {}).get("folder", category)
    return folders.get(folder_key) or folders.get(category) or "Inbox"


def creation_buttons(core: dict[str, Any], templates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Un bottone 'Crea <Titolo>' per ogni template, derivato da templates.yaml."""
    buttons = []
    for template in templates:
        buttons.append({
            "id": f"crea-{template['id']}",
            "label": f"Crea {template['title']}",
            "style": "primary",
            "actions": [{
                "type": "templaterCreateNote",
                "templateFile": template["target"],
                "folderPath": template_folder(core, template["category"]),
                "openNote": True,
            }],
        })
    return buttons


def action_buttons(plugins: dict[str, Any]) -> list[dict[str, Any]]:
    """Bottoni che eseguono un'azione Templater (marca canonico, archivia, ...)."""
    buttons = []
    for button in plugins.get("buttons", []):
        target = f"z.modelli/azioni/{button['label']}.md"
        buttons.append({
            "id": button["id"],
            "label": button["label"],
            "style": "destructive" if button["id"] == "archivia-nota" else "primary",
            "actions": [{"type": "runTemplaterFile", "templateFile": target}],
        })
    return buttons


def values_list(values: list[str]) -> dict[str, str]:
    """Opzioni di un Select Metadata Menu: oggetto con chiavi intere da "1"
    (formato del plugin, verificato in main.js: options.valuesList)."""
    return {str(i + 1): value for i, value in enumerate(values)}


def fileclass_fields(core: dict[str, Any], category: str) -> list[dict[str, Any]]:
    """Campi tipizzati Metadata Menu per una categoria, derivati dal wizard YAML.
    Mapping: stato/tipo->Select (opzioni da states/subtypes), notes->File/MultiFile,
    pressione/number->Number, resto->Input."""
    fields: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add(field_id: str, ftype: str, options: dict[str, Any] | None = None) -> None:
        if field_id in seen:
            return
        seen.add(field_id)
        fields.append({"name": field_id, "type": ftype, "options": options or {}, "path": "", "id": field_id})

    def select(field_id: str, choices: list[str]) -> None:
        add(field_id, "Select", {"sourceType": "ValuesList", "valuesList": values_list(choices)})

    select("stato", core.get("states", []) or [])
    subtypes = (core.get("categories", {}).get(category) or {}).get("subtypes", []) or []
    if subtypes:
        select("tipo", subtypes)
    if category != "mondo":
        add("mondo", "File")
    creation = (core.get("creation", {}) or {}).get(category, {})
    for question in (creation.get("fields", []) or []) + (creation.get("body", []) or []):
        field_id = question["field"]
        if field_id in seen:
            continue
        if question.get("from") == "notes":
            add(field_id, "MultiFile" if question.get("multi") else "File")
        elif field_id == "pressione" or question.get("from") == "number":
            add(field_id, "Number")
        else:
            add(field_id, "Input")
    # Campi strutturati della scheda (worldbuilding/sistema): tipizzati in Properties.
    for field_id in (core.get("scheda", {}) or {}).get(category, []) or []:
        add(field_id, "Number" if field_id == "livello" else "Input")
    for rel in (core.get("relazioni", {}) or {}).get(category, []) or []:
        add(rel["field"], "MultiFile" if rel.get("multi") else "File")
    add("connessioni", "MultiFile")
    add("sessioni", "MultiFile")
    return fields


def fileclass_note(core: dict[str, Any], category: str) -> str:
    frontmatter = {
        "fields": fileclass_fields(core, category),
        "filesPaths": [template_folder(core, category)],
        "mapWithTag": False,
        "tagNames": [],
    }
    dumped = yaml.safe_dump(frontmatter, allow_unicode=True, sort_keys=False)
    return f"---\n{dumped}---\n\n# fileClass: {category}\n"


def meta_bind_config(plugins: dict[str, Any], core: dict[str, Any], templates: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "enableJs": True,
        "inputFieldTemplates": [
            {"name": name, "declaration": declaration}
            for name, declaration in sorted((plugins.get("metabind_inputs") or {}).items())
        ],
        "buttonTemplates": creation_buttons(core, templates) + action_buttons(plugins),
    }


# --- SRD 5.2.1 (CC-BY-4.0), traduzione italiana ----------------------------
# I JSON tipizzati vendorizzati in Dev/Source/SRD/ (da github massimobarbieri/
# DND-SRD-IT) sono generati in note per-voce in un albero di SOLA LETTURA SRD/,
# separato dall'homebrew. I mostri diventano statblock Fantasy Statblocks.
# Config: { json, dest (sottocartella), cat (categoria), fm (campi -> frontmatter) }.
SRD_GEN = [
    {"json": "srd_5_2_1_spells.json",      "dest": "Incantesimi",     "cat": "srd-incantesimo", "fm": ["livello", "scuola", "classi", "tempo_lancio", "gittata", "componenti", "durata"]},
    {"json": "srd_5_2_1_magic_items.json", "dest": "Oggetti",         "cat": "srd-oggetto",     "fm": ["tipo_base", "rarita", "richiede_sintonia"]},
    {"json": "srd_5_2_1_feats.json",       "dest": "Talenti",         "cat": "srd-talento",     "fm": ["categoria", "prerequisito", "ripetibile"]},
    {"json": "srd_5_2_1_species.json",     "dest": "Specie",          "cat": "srd-specie",      "fm": ["tipo_creatura", "taglia", "velocita"]},
    {"json": "srd_5_2_1_backgrounds.json", "dest": "Background",      "cat": "srd-background",  "fm": ["talento_origine"]},
    {"json": "srd_5_2_1_languages.json",   "dest": "Lingue",          "cat": "srd-lingua",      "fm": []},
    {"json": "srd_5_2_1_equipment.json",   "dest": "Equipaggiamento", "cat": "srd-equipaggiamento", "fm": []},
    {"json": "srd_5_2_1_rules.json",       "dest": "Regole",          "cat": "srd-regola",      "fm": []},
    {"json": "srd_5_2_1_classes.json",     "dest": "Classi",          "cat": "srd-classe",      "fm": []},
]

SRD_ATTRIBUTION = (
    "Quest'opera include materiale tratto dal **System Reference Document 5.2.1** "
    "(\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd. "
    "Il SRD 5.2.1 è concesso in licenza ai sensi della "
    "[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode). "
    "Traduzione italiana: [massimobarbieri/DND-SRD-IT](https://github.com/massimobarbieri/DND-SRD-IT)."
)


def srd_slug(name: str) -> str:
    """Nome file leggibile e sicuro per Obsidian (toglie i caratteri vietati)."""
    cleaned = re.sub(r'[\\/:*?"<>|#\[\]^]', "", str(name)).strip()
    return cleaned or "voce"


def frontmatter_block(data: dict[str, Any]) -> str:
    dumped = yaml.safe_dump(data, allow_unicode=True, sort_keys=False)
    return f"---\n{dumped}---\n\n"


def load_srd(name: str) -> list[dict[str, Any]]:
    path = SRD_DIR / name
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def _join(value: Any) -> str:
    return ", ".join(str(v) for v in value) if isinstance(value, list) else str(value or "")


def srd_header(entry: dict[str, Any], cat: str) -> str:
    """Infobox (callout) coi dati salienti, su misura per categoria. '' se nessuno."""
    def parts(*pairs):
        return " · ".join(f"**{lab}** {entry.get(k)}" for lab, k in pairs if entry.get(k))
    if cat == "srd-incantesimo":
        liv = str(entry.get("livello", ""))
        testa = f"Trucchetto · {entry.get('scuola', '')}" if liv in ("0", "") else f"Livello {liv} · {entry.get('scuola', '')}"
        righe = [f"> [!abstract] {testa}"]
        mecc = parts(("Lancio", "tempo_lancio"), ("Gittata", "gittata"), ("Componenti", "componenti"), ("Durata", "durata"))
        if mecc:
            righe.append(f"> {mecc}")
        if entry.get("classi"):
            righe.append(f"> **Classi** {_join(entry['classi'])}")
        return "\n".join(righe)
    if cat == "srd-oggetto":
        sint = entry.get("richiede_sintonia")
        extra = " · richiede sintonia" if sint and sint not in (False, "no", "No", "") else ""
        testa = " · ".join(x for x in (entry.get("tipo_base", ""), str(entry.get("rarita", "") or "")) if x)
        return f"> [!abstract] {testa}{extra}" if testa or extra else ""
    if cat == "srd-talento":
        line = f"> [!abstract] Talento{(' · ' + str(entry.get('categoria'))) if entry.get('categoria') else ''}"
        if entry.get("prerequisito"):
            line += f"\n> **Prerequisito** {entry['prerequisito']}"
        return line
    if cat == "srd-specie":
        return f"> [!abstract] {entry.get('tipo_creatura', '')} · Taglia {entry.get('taglia', '')} · Velocità {entry.get('velocita', '')}"
    if cat == "srd-background" and entry.get("talento_origine"):
        return f"> [!abstract] Background · Talento d'origine: {entry['talento_origine']}"
    if cat == "srd-condizione":
        return "> [!warning] Condizione"
    return ""


def srd_note(entry: dict[str, Any], cat: str, fm_fields: list[str]) -> str:
    fm: dict[str, Any] = {"nome": entry.get("nome", ""), "categoria": cat, "srd": True, "fonte": "SRD 5.2.1"}
    for key in fm_fields:
        val = entry.get(key)
        if isinstance(val, (str, int, float, bool)) and val != "":
            fm[key] = val
        elif isinstance(val, list) and val:
            fm[key] = val
    parts: list[str] = [f"# {entry.get('nome', '')}"]
    header = srd_header(entry, cat)
    if header:
        parts.append(header)
    for key in ("descrizione", "beneficio"):
        if isinstance(entry.get(key), str) and entry[key].strip():
            parts.append(entry[key].strip())
    for sez in entry.get("sezioni") or []:
        if isinstance(sez, dict) and (sez.get("titolo") or sez.get("descrizione")):
            parts.append(f"### {sez.get('titolo', '')}\n\n{sez.get('descrizione', '')}".strip())
    scaling = [s for s in (entry.get("scaling") or []) if isinstance(s, dict)]
    if scaling:
        body = "\n>\n".join(f"> **{s.get('nome', '')}** — {s.get('descrizione', '')}" for s in scaling)
        parts.append(f"> [!tip]- Potenziamento\n{body}")
    return frontmatter_block(fm) + "\n\n".join(parts) + "\n"


def srd_statblock_yaml(monster: dict[str, Any], layout: str) -> str:
    """Mappa un mostro JSON IT sul formato statblock di Fantasy Statblocks."""
    car = monster.get("caratteristiche", {}) or {}
    order = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"]
    hp = monster.get("punti_ferita", {}) or {}
    cr = monster.get("grado_sfida", {}) or {}
    vel = monster.get("velocita", {}) or {}
    sensi = monster.get("sensi", {}) or {}
    lingue = monster.get("lingue", [])

    def actions(key: str) -> list[dict[str, str]]:
        return [{"name": a.get("nome", ""), "desc": a.get("descrizione", "")}
                for a in (monster.get(key) or []) if isinstance(a, dict)]

    sb = {
        "layout": layout,
        "name": monster.get("nome", ""),
        "size": monster.get("dimensione", ""),
        "type": monster.get("tipo", ""),
        "alignment": monster.get("allineamento", ""),
        "ac": monster.get("classe_armatura", ""),
        "hp": hp.get("media", "") if isinstance(hp, dict) else hp,
        "hit_dice": hp.get("formula", "") if isinstance(hp, dict) else "",
        "speed": ", ".join(str(v) if t == "camminata" else f"{t} {v}" for t, v in vel.items()) if isinstance(vel, dict) else str(vel),
        "stats": [int((car.get(k) or {}).get("punteggio", 10)) for k in order],
        "senses": ", ".join(f"{t.replace('_', ' ')} {v}" for t, v in sensi.items()) if isinstance(sensi, dict) else str(sensi),
        "languages": ", ".join(lingue) if isinstance(lingue, list) else str(lingue),
        "cr": str(cr.get("valore", "")) if isinstance(cr, dict) else str(cr),
        "traits": actions("tratti"),
        "actions": actions("azioni"),
        "legendary_actions": actions("azioni_leggendarie"),
    }
    return yaml.safe_dump(sb, allow_unicode=True, sort_keys=False)


def build_srd(core: dict[str, Any]) -> int:
    """Genera l'albero SRD/ (sola lettura) dai JSON IT vendorizzati. Ritorna il
    numero di note scritte. Cartella sorgente assente -> 0 (SRD opzionale)."""
    if not SRD_DIR.is_dir():
        return 0
    write_text(VAULT / "SRD" / "LICENZA.md", f"# Licenza SRD\n\n{SRD_ATTRIBUTION}\n")
    written = 0
    for spec in SRD_GEN:
        for entry in load_srd(spec["json"]):
            write_text(VAULT / "SRD" / spec["dest"] / f"{srd_slug(entry.get('nome'))}.md",
                       srd_note(entry, spec["cat"], spec["fm"]))
            written += 1
    # Glossario: condizioni in una cartella dedicata, il resto in Glossario.
    for entry in load_srd("srd_5_2_1_rules_glossary.json"):
        cond = entry.get("descrittore") == "condizione"
        dest, cat = ("Condizioni", "srd-condizione") if cond else ("Glossario", "srd-glossario")
        write_text(VAULT / "SRD" / dest / f"{srd_slug(entry.get('nome'))}.md",
                   srd_note(entry, cat, ["descrittore"]))
        written += 1
    # Mostri -> statblock (statblock: inline => entra nel bestiario di Fantasy Statblocks).
    layout = (core.get("statblock", {}) or {}).get("layout", "Basic 5e Layout")
    for monster in load_srd("srd_5_2_1_monsters.json"):
        fm = {"nome": monster.get("nome", ""), "categoria": "srd-mostro", "srd": True,
              "fonte": "SRD 5.2.1", "statblock": "inline"}
        content = frontmatter_block(fm) + f"# {monster.get('nome', '')}\n\n```statblock\n{srd_statblock_yaml(monster, layout)}```\n"
        write_text(VAULT / "SRD" / "Mostri" / f"{srd_slug(monster.get('nome'))}.md", content)
        written += 1
    index = (
        "# 📚 SRD 5.2.1 (italiano)\n\n"
        "Riferimento ufficiale 5.5e in italiano, **sola lettura**: si rigenera a ogni build, "
        "non modificarlo (il tuo homebrew va in `Mondi/`). I mostri sono statblock e popolano "
        "il bestiario di Fantasy Statblocks (richiamabili con `monster: Nome`).\n\n"
        f"> [!quote]- Licenza\n> {SRD_ATTRIBUTION}\n\n"
        "## Contenuto\n"
        '```dataview\ntable without id length(rows) as Voci\nfrom "SRD"\n'
        "where srd\ngroup by categoria as Categoria\nsort Categoria asc\n```\n"
    )
    write_text(VAULT / "SRD" / "Indice.md", index)
    return written


def build() -> dict[str, str]:
    core = load_core()
    plugins = load_yaml("plugins.yaml")
    template_data = load_yaml("templates.yaml")
    templates = template_data.get("templates", [])
    actions = template_data.get("actions", [])

    payload = {
        "folders": core.get("folders", {}),
        "fields": core.get("fields", {}),
        "categories": core.get("categories", {}),
        "states": core.get("states", []),
        "creation": core.get("creation", {}),
        "templates": templates,
    }

    # YAML -> JSON che gli script JS leggono a runtime via app.vault.adapter.read.
    write_json(VAULT / "z.automazioni" / "data" / "core.json", payload)
    # Gli script Templater sono autonomi (niente require/bundling): copia 1:1.
    for source in sorted(JS_DIR.glob("*.js")):
        shutil.copy2(source, VAULT / "z.automazioni" / source.name)

    env = Environment(
        loader=FileSystemLoader(str(JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    rendered: dict[str, str] = {}
    for template in templates:
        jinja = env.get_template(template["jinja"])
        text = jinja.render(core=core, plugins=plugins, template=template)
        write_text(VAULT / template["target"], text)
        rendered[template["target"]] = text

    action_template = env.get_template("action.md.j2")
    for action in actions:
        text = action_template.render(action=action)
        write_text(VAULT / action["target"], text)
        rendered[action["target"]] = text

    # Config .obsidian: merge non distruttivo. Le impostazioni e i plugin
    # installati dall'utente sono preservati; si aggiornano solo le chiavi che
    # la pipeline possiede (cartelle Templater, dataviewjs, pulsanti Meta Bind).
    obsidian = VAULT / ".obsidian"
    union_list(obsidian / "community-plugins.json", [p["id"] for p in plugins.get("plugins", [])])
    merge_plugin_config(obsidian, "templater-obsidian", {
        "templates_folder": "z.modelli",
        "user_scripts_folder": "z.automazioni",
    })
    merge_plugin_config(obsidian, "dataview", {"enableDataviewJs": True})
    merge_plugin_config(obsidian, "obsidian-meta-bind-plugin", meta_bind_config(plugins, core, templates))

    # Metadata Menu: uno fileClass per categoria (schema campi tipizzati).
    for category in core.get("categories", {}):
        write_text(VAULT / "z.classi" / f"{category}.md", fileclass_note(core, category))
    merge_plugin_config(obsidian, "metadata-menu", {"classFilesPath": "z.classi/"})

    # Iconize: icona (emoji) per cartella di categoria. Chiavi top-level
    # percorso->emoji nel data.json (emojiStyle native); 'settings' preservato.
    folders = core.get("folders", {})
    icons = {folders[key]: emoji for key, emoji in (plugins.get("folder_icons") or {}).items() if key in folders}
    if icons:
        merge_plugin_config(obsidian, "obsidian-icon-folder", icons)

    # Callout Manager: callout GDR custom (id/color/icon) in callouts.custom,
    # preservando settings/detection. Degradano a callout standard se assenti.
    cm_dir = obsidian / "plugins" / "callout-manager"
    if cm_dir.is_dir() and plugins.get("callouts"):
        cm = read_json(cm_dir / "data.json")
        cm = cm if isinstance(cm, dict) else {}
        callouts_cfg = cm.get("callouts") if isinstance(cm.get("callouts"), dict) else {}
        custom = callouts_cfg.get("custom") if isinstance(callouts_cfg.get("custom"), list) else []
        known = {c.get("id") for c in custom if isinstance(c, dict)}
        changed = False
        for callout in plugins["callouts"]:
            if callout["id"] not in known:
                custom.append({"id": callout["id"], "color": callout["color"], "icon": callout["icon"]})
                changed = True
        if changed:
            callouts_cfg["custom"] = custom
            cm["callouts"] = callouts_cfg
            write_json(cm_dir / "data.json", cm)

    # Fantasy Statblocks: rende disponibile un layout 2024 (NON default: lo
    # selezioni tu in FS). Union per id, preserva default e layout esistenti.
    fs_layout = read_json(SOURCE / "statblock-2024.json")
    fs_dir = obsidian / "plugins" / "obsidian-5e-statblocks"
    if isinstance(fs_layout, dict) and fs_dir.is_dir():
        fs_data = read_json(fs_dir / "data.json")
        if isinstance(fs_data, dict):
            layouts = fs_data.get("layouts") if isinstance(fs_data.get("layouts"), list) else []
            if not any(isinstance(l, dict) and l.get("id") == fs_layout.get("id") for l in layouts):
                layouts.append(fs_layout)
                fs_data["layouts"] = layouts
                write_json(fs_dir / "data.json", fs_data)

    pages = load_pages()
    for name, jinja_name in (("Home.md", "home.md.j2"), ("LEGGIMI.md", "leggimi.md.j2")):
        text = env.get_template(jinja_name).render(core=core, plugins=plugins, templates=templates, pages=pages)
        write_text(VAULT / name, text)
        rendered[name] = text

    # Pagine-indice per dominio (hub navigabili) in INDEX_DIR/, radice pulita.
    index_template = env.get_template("index.md.j2")
    for page in pages:
        rel = f"{INDEX_DIR}/{page['file']}.md"
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=page)
        write_text(VAULT / rel, text)
        rendered[rel] = text

    # SRD 5.2.1 (CC-BY-4.0, IT): albero di sola lettura, separato dall'homebrew.
    srd_count = build_srd(core)
    if srd_count:
        print(f"SRD: {srd_count} voci generate in SRD/.")

    # Bookmarks (core): le poche pagine di riferimento a un clic. Non distruttivo:
    # aggiunge solo le voci mancanti, preservando i bookmark dell'utente.
    bookmark_targets = [("Home.md", "🏠 Home"), *((f"{INDEX_DIR}/{p['file']}.md", p["title"]) for p in pages)]
    if (VAULT / "SRD" / "Indice.md").is_file():
        bookmark_targets.append(("SRD/Indice.md", "📚 SRD"))
    bookmarks = read_json(obsidian / "bookmarks.json")
    bookmarks = bookmarks if isinstance(bookmarks, dict) else {}
    items = bookmarks.get("items") if isinstance(bookmarks.get("items"), list) else []
    known = {it.get("path") for it in items if isinstance(it, dict)}
    added = False
    for path, title in bookmark_targets:
        if path not in known:
            items.append({"type": "file", "path": path, "title": title})
            added = True
    if added:
        bookmarks["items"] = items
        write_json(obsidian / "bookmarks.json", bookmarks)

    # Pulizia esploratore: nasconde le cartelle z.* + le esclude da ricerca/grafo.
    write_workspace_chrome(obsidian)

    # Scaffolding delle cartelle contenuti (idempotente): mostra la struttura
    # senza mai sovrascrivere note esistenti.
    for folder in core.get("folders", {}).values():
        (VAULT / folder).mkdir(parents=True, exist_ok=True)

    return rendered


def seed_samples() -> int:
    """Copia i contenuti di esempio nel vault, senza sovrascrivere note gia'
    presenti (non distrugge il lavoro dell'utente)."""
    if not SAMPLES_DIR.exists():
        return 0
    copied = 0
    for sample in sorted(SAMPLES_DIR.rglob("*.md")):
        dest = VAULT / sample.relative_to(SAMPLES_DIR)
        if dest.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(sample, dest)
        copied += 1
    return copied


# Identificatore che diventa chiave di frontmatter / cartella: snake_case.
SNAKE_RE = re.compile(r"^[a-z][a-z0-9_]*$")

# Sezioni "di piano": devono restare nel rispettivo file. tavolo/assi_tematici/
# states (il differenziatore worldbuilding) solo in core.yaml; scheda/statblock/
# caratteristiche (i meccanismi 5.5e) solo in system.yaml.
CORE_ONLY_SECTIONS = ("tavolo", "assi_tematici", "states")
SYSTEM_ONLY_SECTIONS = ("scheda", "statblock", "caratteristiche")

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
            if name is not None and not SNAKE_RE.match(str(name)):
                errors.append(f"snake_case: '{name}' in {scope} non è snake_case")

    snake("folders", merged.get("folders", {}))
    snake("fields", merged.get("fields", {}))
    snake("categories", merged.get("categories", {}))
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
    for cat, assi in (merged.get("assi_tematici", {}) or {}).items():
        for a in assi or []:
            if not all(a.get(k) for k in ("id", "sinistra", "destra")):
                errors.append(f"shape: assi_tematici[{cat}] voce {a} senza id/sinistra/destra")
    return errors


def check() -> int:
    errors: list[str] = []
    core_raw, system_raw = load_core_parts()
    core = deep_merge(core_raw, system_raw)
    errors.extend(validate_split(core_raw, system_raw, core))
    plugins = load_yaml("plugins.yaml")
    template_data = load_yaml("templates.yaml")
    categories = core.get("categories", {})
    folders = core.get("folders", {})
    fields = core.get("fields", {})
    metabind = plugins.get("metabind_inputs") or {}

    # Le categorie dei template devono essere dichiarate e avere una cartella
    # risolvibile (i bottoni 'Crea ...' creano la nota in quella cartella).
    for template in template_data.get("templates", []):
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

    # Ogni widget non-text/number del registro deve avere un template Meta Bind.
    for field_id, spec in fields.items():
        widget = (spec or {}).get("widget")
        if widget and widget not in ("text", "number") and widget not in metabind:
            errors.append(f"campo {field_id}: widget '{widget}' assente da metabind_inputs")

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


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il vault Obsidian GDR in dist/GDR-vault da sorgenti YAML/Jinja/JS.")
    parser.add_argument("--clean", action="store_true", help="Rimuove solo gli artefatti generati (non i contenuti/plugin).")
    parser.add_argument("--check", action="store_true", help="Valida YAML/Jinja senza scrivere output.")
    parser.add_argument("--seed", action="store_true", help="Copia i contenuti di esempio (senza sovrascrivere note esistenti).")
    args = parser.parse_args()

    if args.clean:
        clean()
        print("Artefatti generati rimossi.")
        return 0
    if args.check:
        return check()

    first_run = not VAULT.exists()
    clean()
    rendered = build()
    seeded = seed_samples() if (args.seed or first_run) else 0

    rel = VAULT.relative_to(ROOT)
    print(f"Build OK: {len(rendered)} note generate, {len(list(JS_DIR.glob('*.js')))} JS runtime.")
    if seeded:
        print(f"Esempi copiati: {seeded}.")
    print(f"Vault: {rel}/  — apri questa cartella in Obsidian.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
