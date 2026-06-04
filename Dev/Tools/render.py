#!/usr/bin/env python3
"""Orchestratore della pipeline GDR: genera il vault Obsidian in dist/GDR-vault
dalle sorgenti YAML/Jinja/JS. Il modello dati e l'IO stanno in common.py, la
generazione SRD in build_srd.py, la validazione in validate.py e la config
.obsidian/presentazione in render_config.py; qui restano la build()/render_notes
(render template + dati JS Engine), clean()/scaffold() e la CLI.

Re-esporta i nomi pubblici dei moduli così i test (e gli usi storici) possono
continuare a riferirli come render.<nome>."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

from common import (  # noqa: F401 (re-export per i test/usi storici)
    GENERATED_DIRS,
    GENERATED_NOTES,
    HIDDEN_DIRS,
    INDEX_DIR,
    JINJA_DIR,
    JS_DIR,
    ROOT,
    SOURCE,
    SRD_DIR,
    STATBLOCKS_DIR,
    VAULT,
    apply_entities,
    deep_merge,
    entity_templates,
    generated_note_names,
    load_core,
    load_core_parts,
    load_entities,
    load_pages,
    load_templates,
    load_yaml,
    read_json,
    template_folder,
    write_json,
    write_text,
)
from build_srd import (  # noqa: F401 (re-export per i test)
    SRD_GEN,
    build_srd,
    gs_baselines,
    load_srd,
    srd_condizioni,
    srd_loot_pool,
    srd_note,
    srd_statblock_yaml,
)
from build_personaggio import build_personaggio_options  # noqa: F401 (re-export)
from build_site import SITE_OUT, build_site  # noqa: F401 (re-export per i test)
from validate import (  # noqa: F401 (re-export per i test)
    CORE_ONLY_SECTIONS,
    PARTITIONED_SECTIONS,
    SYSTEM_ONLY_SECTIONS,
    check,
    validate_aux_yaml,
    validate_entities,
    validate_entity_schema,
    validate_reciprocals,
    validate_split,
)
from render_config import (  # noqa: F401 (re-export per i test/usi storici)
    APP_SETTINGS,
    CATEGORY_ACCENTS,
    CORE_PLUGINS,
    HIDE_FOLDERS_SNIPPET,
    HOMEPAGE_CONFIG,
    MEDIA_FOLDER,
    MEDIA_ICON,
    action_buttons,
    bases_doc,
    callout_appearance_css,
    canvas_colors,
    category_accent_css,
    creation_buttons,
    fileclass_fields,
    fileclass_note,
    initiative_statuses,
    load_statblock_layouts,
    merge_json,
    merge_plugin_config,
    meta_bind_config,
    union_list,
    union_list_key,
    values_list,
    write_bases,
    write_bookmarks,
    write_calendarium,
    write_callout_manager,
    write_core_settings,
    write_folder_notes,
    write_homepage,
    write_iconize,
    write_initiative_tracker,
    write_metadata_menu,
    write_obsidian_config,
    write_statblock_layouts,
    write_tab_panels,
    write_workspace_chrome,
)


def clean() -> None:
    """Rimuove solo gli artefatti puramente generati (z.modelli, z.automazioni,
    z.classi, SRD, Home/LEGGIMI, pagine-indice). NON tocca .obsidian (config e
    plugin dell'utente) ne' i contenuti. Pulisce anche residui legacy in ROOT."""
    notes = generated_note_names() + [f"{INDEX_DIR}/{p['file']}.base" for p in load_pages()]
    # Note-cartella auto-indice (Folder Notes): derivate dal modello, rimosse qui.
    notes += [fp["target"] for fp in folder_index_pages(load_core(), load_yaml("plugins.yaml"))]
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


def crea_wrapper_js(template: dict[str, Any]) -> str:
    """Wizard di creazione per-template generato: `tp.user.crea_<id>` delega al
    motore condiviso create_entity.js. Le entità bespoke hanno un crea_<id>.js
    hand-authored in JS/ (override) e non passano di qui."""
    tid = template["id"]
    return (
        f'// GENERATO da render.py — wizard del template "{tid}" (categoria {template["category"]}).\n'
        f'// Delega al motore create_entity.js; lo schema è in entities/{template["category"]}.yaml.\n'
        f'module.exports = async (tp) => tp.user.create_entity(tp, "{tid}");\n'
    )


def jinja_env() -> Environment:
    """Ambiente Jinja della pipeline. StrictUndefined: un campo mancante è un
    errore (non una stringa vuota); trim/lstrip_blocks tengono pulito l'output."""
    return Environment(
        loader=FileSystemLoader(str(JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def write_engine_data(core: dict[str, Any], templates: list[dict[str, Any]]) -> None:
    """Dati e script che il JS Engine legge a runtime: il payload core.json
    (modello distillato per views.js), le opzioni del rules-engine PG, gli script
    Templater (copia 1:1) e un wizard di creazione per-template (wrapper sul
    motore create_entity.js, salvo override hand-authored crea_<id>.js in JS/)."""
    # generatori homebrew: catalogo da generatori.yaml + iniezione dei nomi-oggetto
    # REALI dell'SRD nel generatore `tesoro` (per fascia/rarità). Vivono qui, non in
    # YAML, così il bottino cita item veri/CC-BY senza ricopiarli a mano.
    generatori = load_yaml("generatori.yaml") if (SOURCE / "YAML" / "generatori.yaml").is_file() else {}
    if isinstance(generatori.get("tesoro"), dict):
        generatori["tesoro"]["_srd"] = srd_loot_pool()
    payload = {
        "folders": core.get("folders", {}),
        "fields": core.get("fields", {}),
        "categories": core.get("categories", {}),
        "states": core.get("states", []),
        # assi_tematici: serve a views.js per disegnare il radar del Carattere e il
        # confronto fra entità (carica gli assi per categoria a runtime).
        "assi_tematici": core.get("assi_tematici", {}),
        # relazioni: usate da meta_actions.collega (link tipizzato reciproco).
        # archetipi: combinazioni di valori-assi -> tag, derivati da views.renderProfilo
        # e applicati da meta_actions.applica_profilo.
        "relazioni": core.get("relazioni", {}),
        "archetipi": core.get("archetipi", {}),
        # canvas_colors: categoria→preset-colore Canvas (1..6), per l'azione runtime
        # world_board (genera il World Board su un mondo dell'utente, colori = esempio).
        "canvas_colors": canvas_colors(),
        # xp: tabelle CR->XP + budget 2024, per views.renderEncounter (difficoltà).
        "xp": core.get("xp", {}),
        # condizioni: le 15 condizioni 5.5e (compatte) per views.renderCondizioni
        # (quick-ref al tavolo: scheda PG + incontro). Dalle note SRD del glossario.
        "condizioni": srd_condizioni(),
        # maestrie: le 8 proprietà di maestria delle armi 2024 (quick-ref al tavolo,
        # views.renderMaestrie). Da system.yaml (il SRD 5.2.1 non le mappa per-arma).
        "maestrie": core.get("maestrie_armi", []),
        # gs_baseline: statistiche-base per GS (mediane dei mostri SRD di pari GS),
        # per lo scaffolder di statblock delle creature homebrew
        # (meta_actions.scaffold_statblock): un boss con solo `gs` diventa giocabile.
        "gs_baseline": gs_baselines(),
        # astrologia: catalogo tema natale (segni/arcani/elementi) per views.renderTemaNatale
        # (profilo personalità dei personaggi, soprattutto PNG). Da astrologia.yaml (opzionale).
        "astrologia": load_yaml("astrologia.yaml") if (SOURCE / "YAML" / "astrologia.yaml").is_file() else {},
        # generatori: catalogo stili/affissi per il generatore homebrew di nomi/spunti
        # (genera.js: nomi persona/toponimi/fazioni in italiano, a tema). Da generatori.yaml,
        # con i nomi-oggetto SRD iniettati in tesoro._srd (vedi sopra).
        "generatori": generatori,
        "creation": core.get("creation", {}),
        "templates": templates,
    }
    # YAML -> JSON che gli script JS leggono a runtime via app.vault.adapter.read.
    write_json(VAULT / "z.automazioni" / "data" / "core.json", payload)
    # Opzioni del rules-engine PG (SRD + pg_rules.yaml) per crea_personaggio.js.
    write_json(VAULT / "z.automazioni" / "data" / "personaggio.json", build_personaggio_options(core))
    # Gli script Templater (.js CommonJS) e il guscio JS Engine (.mjs ESM) sono
    # autonomi (niente require/bundling): copia 1:1. I `_*.js` sono sorgenti di
    # riferimento condivise (es. _comparators.js, sincronizzato via check) — non
    # runtime: non si copiano nel vault, come i partial Jinja `_*.j2`.
    for source in sorted(JS_DIR.glob("*.js")) + sorted(JS_DIR.glob("*.mjs")):
        if source.name.startswith("_"):
            continue
        shutil.copy2(source, VAULT / "z.automazioni" / source.name)
    for template in templates:
        if not (JS_DIR / f"crea_{template['id']}.js").is_file():
            write_text(VAULT / "z.automazioni" / f"crea_{template['id']}.js", crea_wrapper_js(template))


# Categorie senza nota-cartella auto-indice: 'mondo' (la sua cartella è la radice
# Mondi/) e 'nota' (Inbox, scratch). Tutte le altre hanno una sottocartella propria.
FOLDER_NOTE_SKIP = {"mondo", "nota"}


def folder_index_pages(core: dict[str, Any], plugins: dict[str, Any]) -> list[dict[str, Any]]:
    """Per ogni categoria con una sottocartella sotto Mondi/, una 'nota-cartella'
    (convenzione Folder Notes: nota omonima dentro la cartella) che fa da indice
    auto della categoria. Riusa index.md.j2 sintetizzando un `page` minimale; la
    nota appare cliccando la cartella nell'esploratore. Ritorna [{target, page}]."""
    folders = core.get("folders", {})
    icons = plugins.get("folder_icons") or {}
    out: list[dict[str, Any]] = []
    for cat, meta in core.get("categories", {}).items():
        if cat in FOLDER_NOTE_SKIP:
            continue
        folder = folders.get(meta.get("folder", cat)) or folders.get(cat)
        if not folder or "/" not in folder:
            continue  # solo le categorie con sottocartella dedicata
        basename = folder.split("/")[-1]
        icon = icons.get(cat, "")
        out.append({
            "target": f"{folder}/{basename}.md",
            "page": {
                "id": f"cartella_{cat}",
                "file": basename,
                "title": f"{icon} {basename}".strip(),
                "category": cat,
                "intro": "Tutte le voci di questa categoria. Clicca la cartella per tornare qui.",
                "sort": "file.name asc",
                "columns": [{"field": "tipo", "label": "Tipo"}, {"field": "mondo", "label": "Mondo"}],
            },
        })
    return out


def render_notes(env: Environment, core: dict[str, Any], plugins: dict[str, Any],
                 templates: list[dict[str, Any]], actions: list[dict[str, Any]],
                 pages: list[dict[str, Any]]) -> dict[str, str]:
    """Rende tutti i Jinja sul vault e ritorna {target: testo}: le note-modello
    (z.modelli/), le azioni Templater, le note di radice (Home/LEGGIMI/Ponte/
    Fronti) e le pagine-indice per dominio (Indici/, per tenere pulita la radice)."""
    rendered: dict[str, str] = {}
    for template in templates:
        text = env.get_template(template["jinja"]).render(core=core, plugins=plugins, template=template)
        write_text(VAULT / template["target"], text)
        rendered[template["target"]] = text

    action_template = env.get_template("action.md.j2")
    for action in actions:
        text = action_template.render(action=action)
        write_text(VAULT / action["target"], text)
        rendered[action["target"]] = text

    for name, jinja_name in (("Home.md", "home.md.j2"), ("LEGGIMI.md", "leggimi.md.j2"),
                             ("THIRD-PARTY-LICENSES.md", "third_party_licenses.md.j2"),
                             ("Crea il tuo mondo.md", "crea_il_tuo_mondo.md.j2"),
                             (f"{INDEX_DIR}/Ponte Mondo-Sistema.md", "ponte.md.j2"),
                             (f"{INDEX_DIR}/Fronti.md", "fronti.md.j2"),
                             (f"{INDEX_DIR}/Rete del mondo.md", "rete.md.j2"),
                             (f"{INDEX_DIR}/Economia.md", "economia.md.j2"),
                             (f"{INDEX_DIR}/Geografia.md", "geografia.md.j2"),
                             (f"{INDEX_DIR}/Missioni.md", "missioni.md.j2"),
                             (f"{INDEX_DIR}/Occhi del giocatore.md", "occhi_giocatore.md.j2"),
                             (f"{INDEX_DIR}/Guida al combattimento.md", "guida_combattimento.md.j2")):
        text = env.get_template(jinja_name).render(core=core, plugins=plugins, templates=templates, pages=pages)
        write_text(VAULT / name, text)
        rendered[name] = text

    index_template = env.get_template("index.md.j2")
    for page in pages:
        rel = f"{INDEX_DIR}/{page['file']}.md"
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=page)
        write_text(VAULT / rel, text)
        rendered[rel] = text

    # Note-cartella (Folder Notes): un auto-indice per ogni categoria, dentro la
    # sua cartella Mondi/<X>/, reso con lo stesso index.md.j2.
    for fp in folder_index_pages(core, plugins):
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=fp["page"])
        write_text(VAULT / fp["target"], text)
        rendered[fp["target"]] = text
    return rendered


def scaffold_folders(core: dict[str, Any]) -> None:
    """Scaffolding delle cartelle contenuti (idempotente): mostra la struttura
    senza mai sovrascrivere note esistenti."""
    for folder in core.get("folders", {}).values():
        (VAULT / folder).mkdir(parents=True, exist_ok=True)
    # Cartella media utente (ritratti/mappe/immagini): destinazione degli allegati.
    (VAULT / MEDIA_FOLDER).mkdir(parents=True, exist_ok=True)


def build() -> dict[str, str]:
    """Orchestratore della build: carica il modello, scrive dati+script del JS
    Engine, rende tutte le note, genera Bases e SRD, scrive la config .obsidian
    e scaffolda le cartelle contenuti. Ritorna {target: testo} delle note rese."""
    core = load_core()
    plugins = load_yaml("plugins.yaml")
    templates = load_templates()
    actions = load_yaml("templates.yaml").get("actions", [])
    pages = load_pages()

    write_engine_data(core, templates)
    rendered = render_notes(jinja_env(), core, plugins, templates, actions, pages)
    # Bases (core): una vista DB nativa (.base) per pagina, stessa single-source
    # degli hub. Additivo: gli hub Dataview restano come fallback.
    write_bases(pages)

    # SRD 5.2.1 (CC-BY-4.0, IT): albero di sola lettura, separato dall'homebrew.
    # Prima della config .obsidian, che vi appende un bookmark.
    srd_count = build_srd(core)
    if srd_count:
        print(f"SRD: {srd_count} voci generate in SRD/.")

    write_obsidian_config(VAULT / ".obsidian", core, plugins, templates, pages)
    scaffold_folders(core)
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il vault Obsidian GDR in dist/GDR-vault da sorgenti YAML/Jinja/JS.")
    parser.add_argument("--clean", action="store_true", help="Rimuove solo gli artefatti generati (non i contenuti/plugin).")
    parser.add_argument("--check", action="store_true", help="Valida YAML/Jinja senza scrivere output.")
    parser.add_argument("--site", action="store_true", help="Genera il sito statico dei giocatori (spoiler-free, read-only) in dist/GDR-site dal vault.")
    parser.add_argument("--reveal", choices=["pubblico", "incontrato", "segreto", "tutto"],
                        default="pubblico",
                        help="Livello di rivelazione del sito-giocatori: include le note col campo `rivelazione` fino a quel tier (default: pubblico).")
    args = parser.parse_args()

    if args.clean:
        clean()
        print("Artefatti generati rimossi.")
        return 0
    if args.check:
        return check()
    if args.site:
        if not (VAULT / "Mondi").is_dir():
            print("Nessun contenuto in Mondi/: esegui prima `npm run build`.")
            return 1
        pages = build_site(load_core(), VAULT, SITE_OUT, reveal=args.reveal)
        print(f"Sito giocatori: {pages} pagine in {SITE_OUT.relative_to(ROOT)}/ "
              f"(rivelazione: {args.reveal}) — apri index.html o pubblica la cartella.")
        return 0

    clean()
    rendered = build()

    rel = VAULT.relative_to(ROOT)
    js_runtime = len([p for p in JS_DIR.glob('*.js') if not p.name.startswith('_')]) + len(list(JS_DIR.glob('*.mjs')))
    print(f"Build OK: {len(rendered)} note generate, {js_runtime} JS runtime.")
    print(f"Vault: {rel}/  — apri questa cartella in Obsidian.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
