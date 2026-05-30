#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Any

import yaml

from release_plugin_profile import release_plugin_profile

sys.dont_write_bytecode = True

ROOT = Path.cwd()
BOUNDARY = ROOT / "Dev" / "Source" / "YAML" / "quality" / "release_boundary.yaml"
TEMPLATE_FACTORY_RENDERER = ROOT / "Dev" / "Tools" / "python" / "render_template_factory.py"
RELEASE_FOLDER_NOTES_RENDERER = ROOT / "Dev" / "Tools" / "python" / "render_release_folder_notes.py"

GENERATED_RELEASE_NOTES = {
    "LEGGIMI.md": """# Vault GDR

Questa cartella contiene il vault pronto per l'utente finale.

Apri questa cartella in Obsidian come vault e parti da `Inizia Qui.md`.

## Cosa Include

- dashboard operative per preparazione, sessione, post-sessione e worldbuilding;
- `Vista Giocatori` per recap, handout, mappe pubbliche e materiale condivisibile;
- `Party Control` per PG, HP, missioni, inventario e flags;
- `Quality Report` per copertura, buchi operativi e controllo anti-segreti;
- atlante, mappe, template, automazioni e configurazioni gia inclusi;
- `Risorse/Regione Giocabile.md` per trasformare un territorio in materiale giocabile;
- SRD 5.2.1 italiano come modulo regolamentare separato.

Le cartelle tecniche e il compendio SRD sono inclusi per far funzionare automazioni, template e riferimenti, ma sono nascosti dalla navigazione normale del vault.

## Primo Avvio

1. Apri Obsidian.
2. Scegli `Apri cartella come vault`.
3. Se Obsidian chiede conferma per i plugin inclusi, abilitali solo se hai scaricato il vault dalla release ufficiale.
4. Apri `Inizia Qui.md`.
5. Usa `Risorse/Setup Guidato.md` solo se pulsanti, tabelle o pagina iniziale non rispondono.

## Cosa Non Include

Questa copia contiene solo il vault pronto da aprire in Obsidian. Non include roadmap interne, strumenti di sviluppo o materiali sorgente non necessari al gioco.

Non e una app standalone, non e un rules engine completo e non ripubblica l'intero regolamento 5.5e. Il materiale SRD resta un riferimento separato; mondo, campagne e homebrew restano contenuto dell'utente.
"""
}

GENERATED_RELEASE_JSON = {
    ".obsidian/workspace.json": {
        "main": {
            "id": "gdr-release-main",
            "type": "split",
            "children": [
                {
                    "id": "gdr-release-tabs",
                    "type": "tabs",
                    "children": [
                        {
                            "id": "gdr-release-start",
                            "type": "leaf",
                            "state": {
                                "type": "markdown",
                                "state": {"file": "Inizia Qui.md", "mode": "preview", "source": False},
                                "icon": "lucide-file",
                                "title": "Inizia Qui",
                            },
                        }
                    ],
                    "currentTab": 0,
                }
            ],
            "direction": "vertical",
        },
        "left": {
            "id": "gdr-release-left",
            "type": "split",
            "children": [
                {
                    "id": "gdr-release-left-tabs",
                    "type": "tabs",
                    "children": [
                        {
                            "id": "gdr-release-bookmarks",
                            "type": "leaf",
                            "state": {"type": "bookmarks", "state": {}, "icon": "lucide-bookmark", "title": "Percorsi"},
                        },
                        {
                            "id": "gdr-release-files",
                            "type": "leaf",
                            "state": {
                                "type": "file-explorer",
                                "state": {"sortOrder": "alphabetical", "autoReveal": False},
                                "icon": "lucide-folder-closed",
                                "title": "File",
                            },
                        },
                    ],
                    "currentTab": 0,
                }
            ],
            "direction": "horizontal",
            "width": 300,
        },
        "right": {"id": "gdr-release-right", "type": "split", "children": [], "direction": "horizontal", "collapsed": True},
        "active": "gdr-release-start",
        "lastOpenFiles": ["Inizia Qui.md"],
    },
    ".obsidian/bookmarks.json": {
        "items": [
            {
                "type": "group",
                "title": "Primo utilizzo",
                "items": [
                    {"type": "file", "path": "Inizia Qui.md", "title": "Inizia Qui"},
                    {"type": "file", "path": "Risorse/Prima Sessione In 15 Minuti.md", "title": "Prima Sessione In 15 Minuti"},
                    {"type": "file", "path": "Risorse/Setup Guidato.md", "title": "Setup Guidato"},
                ],
            },
            {
                "type": "group",
                "title": "Ciclo di gioco",
                "items": [
                    {"type": "file", "path": "Risorse/Preparazione Sessione.md", "title": "Preparazione Sessione"},
                    {"type": "file", "path": "Hub/Durante il Gioco.md", "title": "Durante il Gioco"},
                    {"type": "file", "path": "Risorse/Post Sessione Guidato.md", "title": "Post Sessione Guidato"},
                    {"type": "file", "path": "Hub/Cosa Succede Fuori Scena.md", "title": "Cosa Succede Fuori Scena"},
                ],
            },
            {
                "type": "group",
                "title": "Mondo e giocatori",
                "items": [
                    {"type": "file", "path": "Hub/Worldbuilder Dashboard.md", "title": "Worldbuilder"},
                    {"type": "file", "path": "Hub/Atlante del Mondo.md", "title": "Atlante del Mondo"},
                    {"type": "file", "path": "Hub/Campagna da Ambientazione.md", "title": "Campagna da Ambientazione"},
                    {"type": "file", "path": "Hub/Vista Giocatori.md", "title": "Vista Giocatori"},
                ],
            },
        ]
    },
}


def load_yaml(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise SystemExit(f"{path.relative_to(ROOT)}: root YAML non valida")
    return data


def read_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def as_array(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def top_segment(rel_path: str) -> str:
    return rel_path.split("/", 1)[0]


class ReleaseBuilder:
    def __init__(self, out: Path, quiet: bool) -> None:
        self.out = out.resolve()
        self.dist = self.out.parent
        self.zip_path = Path(f"{self.out}.zip")
        self.quiet = quiet
        self.release_boundary = load_yaml(BOUNDARY)
        self.release_plugin_profile = release_plugin_profile(ROOT, self.release_boundary)

        copy_policy = self.release_boundary.get("copy_policy") or {}
        self.included_roots = set(as_array(copy_policy.get("included_roots")))
        self.included_root_files = set(as_array(copy_policy.get("included_root_files")))
        self.excluded_dirs = set(as_array(copy_policy.get("excluded_dirs")))
        self.excluded_root_files = set(as_array(copy_policy.get("excluded_root_files")))
        self.excluded_risorse = set(as_array(copy_policy.get("excluded_risorse")))
        self.excluded_automazioni = set(as_array(copy_policy.get("excluded_automazioni")))
        self.excluded_automazioni_prefixes = as_array(self.release_boundary.get("forbidden_automation_prefixes"))
        self.excluded_files = set(as_array(copy_policy.get("excluded_files")))
        self.required_release_files = as_array(self.release_boundary.get("required_files"))
        self.required_user_ignore_filters = as_array(copy_policy.get("required_user_ignore_filters"))
        self.runtime_template_modules = as_array(self.release_boundary.get("runtime_template_modules"))
        self.bridge_runtime_modules = as_array(self.release_boundary.get("bridge_runtime_modules"))
        self.forbidden_text_markers = as_array(self.release_boundary.get("forbidden_text_markers"))
        self.generated_release_roots = set(as_array(self.release_boundary.get("generated_release_roots")))
        self.enabled_plugins = self.release_plugin_profile.enabled_plugin_set

    def should_include_root(self, rel_path: str, is_dir: bool) -> bool:
        top = top_segment(rel_path)
        if top in self.included_roots and top not in self.excluded_dirs:
            return True
        if is_dir:
            return False
        return rel_path in self.included_root_files and rel_path not in self.excluded_root_files

    def should_skip(self, rel_path: str, source: Path) -> bool:
        is_dir = source.is_dir()
        name = source.name
        if is_dir and name == "__pycache__":
            return True
        if name in self.excluded_files:
            return True
        top = top_segment(rel_path)
        if top in self.excluded_dirs:
            return True
        if top in self.generated_release_roots:
            return True
        if not self.should_include_root(rel_path, is_dir):
            return True

        if rel_path.startswith(".obsidian/plugins/"):
            parts = rel_path.split("/")
            plugin_id = parts[2] if len(parts) > 2 else ""
            if plugin_id and plugin_id not in self.enabled_plugins:
                return True

        if rel_path == ".obsidian/workspace.json":
            return True

        if rel_path.startswith("Risorse/"):
            first = rel_path.removeprefix("Risorse/").split("/", 1)[0]
            if first in self.excluded_risorse:
                return True

        if rel_path.startswith("z.automazioni/"):
            first = rel_path.removeprefix("z.automazioni/").split("/", 1)[0]
            if first in self.excluded_automazioni:
                return True
            if any(first.startswith(prefix) for prefix in self.excluded_automazioni_prefixes):
                return True

        return rel_path in {"z.modelli/README.md", "z.bacheche/README.md"}

    def copy_dir(self, source: Path, target: Path, base: Path) -> None:
        target.mkdir(parents=True, exist_ok=True)
        for entry in source.iterdir():
            rel_path = entry.relative_to(base).as_posix()
            if self.should_skip(rel_path, entry):
                continue
            target_path = target / entry.name
            if entry.is_dir():
                self.copy_dir(entry, target_path, base)
            elif entry.is_file():
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(entry, target_path)

    def copy_tree(self, source: Path, target: Path) -> None:
        if not source.exists():
            return
        target.mkdir(parents=True, exist_ok=True)
        for entry in source.iterdir():
            target_path = target / entry.name
            if entry.is_dir():
                self.copy_tree(entry, target_path)
            elif entry.is_file():
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(entry, target_path)

    def materialize_obsidian_sources(self) -> None:
        self.copy_tree(ROOT / "Dev" / "Source" / "Obsidian" / ".obsidian", self.out / ".obsidian")

    def materialize_runtime_sources(self) -> None:
        self.copy_tree(ROOT / "Dev" / "Source" / "JS" / "z.automazioni", self.out / "z.automazioni")
        self.copy_tree(ROOT / "Dev" / "Source" / "JS" / "z.engine", self.out / "z.engine")

    def rendered_materialized_user_files(self) -> dict[str, str]:
        result = subprocess.run(
            ["python3", str(RELEASE_FOLDER_NOTES_RENDERER), "--json"],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
        if result.returncode != 0:
            sys.stderr.write(result.stderr)
            raise SystemExit(result.returncode)
        rendered = json.loads(result.stdout)
        return rendered if isinstance(rendered, dict) else {}

    def write_generated_release_notes(self) -> None:
        for file, text in GENERATED_RELEASE_NOTES.items():
            target = self.out / file
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")

        obsidian = self.out / ".obsidian"
        obsidian.mkdir(parents=True, exist_ok=True)
        (obsidian / "community-plugins.json").write_text(
            json.dumps(self.release_plugin_profile.enabled_plugins, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        for file, data in GENERATED_RELEASE_JSON.items():
            target = self.out / file
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        for rel_path, text in self.rendered_materialized_user_files().items():
            target = self.out / rel_path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")

    def walk_release(self) -> list[str]:
        entries: list[str] = []
        if not self.out.exists():
            return entries
        for path in self.out.rglob("*"):
            entries.append(path.relative_to(self.out).as_posix())
        return entries

    @staticmethod
    def spec_path(spec: Any) -> str:
        if not isinstance(spec, dict):
            return ""
        return str(spec.get("path") or "").replace("\\", "/").strip()

    def runtime_module_paths(self, manifest: dict[str, Any]) -> set[str]:
        paths: set[str] = set()
        modules = manifest.get("runtime_modules") if isinstance(manifest.get("runtime_modules"), dict) else {}
        for group in modules.values():
            for spec in as_array(group):
                module_path = self.spec_path(spec)
                if module_path:
                    paths.add(module_path)
        return paths

    def commonjs_runtime_paths(self, manifest: dict[str, Any], errors: list[str]) -> list[str]:
        runtime = manifest.get("commonjs_runtime") if isinstance(manifest.get("commonjs_runtime"), dict) else {}
        entrypoints = [self.spec_path(spec) for spec in as_array(runtime.get("entrypoints"))]
        local_dependencies = [self.spec_path(spec) for spec in as_array(runtime.get("local_dependencies"))]
        data_dependencies = [self.spec_path(spec) for spec in as_array(runtime.get("data_dependencies"))]
        entrypoints = [item for item in entrypoints if item]
        local_dependencies = [item for item in local_dependencies if item]
        data_dependencies = [item for item in data_dependencies if item]
        if not entrypoints:
            errors.append("runtime_exports.json senza commonjs_runtime.entrypoints")
        if not local_dependencies:
            errors.append("runtime_exports.json senza commonjs_runtime.local_dependencies")
        return [*entrypoints, *local_dependencies, *data_dependencies]

    @staticmethod
    def resolve_js_require(source_file: Path, request: str) -> Path:
        raw = (source_file.parent / request).resolve()
        candidates = [raw, Path(f"{raw}.js"), raw / "index.js"]
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return candidates[1]

    def validate_release_links(self, release_entries: list[str], errors: list[str]) -> None:
        file_entries = [entry for entry in release_entries if (self.out / entry).is_file()]
        exact_targets = set(file_entries)
        extensionless_targets = {re.sub(r"\.[^.]+$", "", entry) for entry in file_entries}
        stem_targets = {Path(entry).stem for entry in file_entries}
        wiki_link_pattern = re.compile(r"\[\[([^\]]+)\]\]")

        for entry in [file for file in file_entries if file.endswith(".md")]:
            text = (self.out / entry).read_text(encoding="utf-8")
            for match in wiki_link_pattern.finditer(text):
                target = match.group(1).split("|", 1)[0].split("#", 1)[0].strip()
                if not target or target.startswith(("http://", "https://")):
                    continue
                without_markdown = re.sub(r"\.md$", "", target)
                matches_target = (
                    target in exact_targets
                    or without_markdown in extensionless_targets
                    or without_markdown in stem_targets
                    or any(candidate.endswith(f"/{without_markdown}") for candidate in extensionless_targets)
                )
                if not matches_target:
                    errors.append(f"wikilink mancante nella release: {entry} -> [[{match.group(1)}]]")

    def validate_release_text(self, release_entries: list[str], errors: list[str]) -> None:
        extensions = {".md", ".yaml", ".yml", ".json", ".js"}
        for entry in release_entries:
            file = self.out / entry
            if not file.is_file() or file.suffix.lower() not in extensions:
                continue
            text = file.read_text(encoding="utf-8")
            for marker in self.forbidden_text_markers:
                if str(marker) in text:
                    errors.append(f"{entry}: marker riservato/dev-only nella release ({marker})")

    def validate_release_runtime(self, release_entries: list[str], errors: list[str]) -> None:
        manifest = read_json(self.out / "z.automazioni/data/runtime/runtime_exports.json", {"runtime_modules": {}, "commonjs_runtime": {}})
        runtime_paths = self.runtime_module_paths(manifest)

        for rel_path in self.commonjs_runtime_paths(manifest, errors):
            if not (self.out / rel_path).exists():
                errors.append(f"dipendenza runtime dichiarata mancante: {rel_path}")

        for module_name in self.bridge_runtime_modules:
            module_path = f"z.engine/{module_name}"
            if module_path not in runtime_paths:
                errors.append(f"runtime_exports.json non dichiara {module_path}")
            if not (self.out / module_path).exists():
                errors.append(f"modulo bridge mancante: {module_path}")

        release_set = set(release_entries)
        require_pattern = re.compile(r"\b(?:require|optionalRequire)\s*\(\s*[\"'](\.{1,2}/[^\"']+)[\"']\s*\)")
        adapter_read_pattern = re.compile(r"app\.vault\.adapter\.read\(\s*[\"']([^\"']+)[\"']\s*\)")
        js_entries = [
            entry
            for entry in release_entries
            if entry.endswith(".js") and (entry.startswith("z.automazioni/") or entry.startswith("z.engine/"))
        ]
        for entry in js_entries:
            file = self.out / entry
            if not file.is_file():
                continue
            source = file.read_text(encoding="utf-8")
            for match in require_pattern.finditer(source):
                resolved = self.resolve_js_require(file, match.group(1))
                if not resolved.exists():
                    errors.append(f"require locale mancante in {entry} -> {match.group(1)}")
            for match in adapter_read_pattern.finditer(source):
                target = match.group(1).replace("\\", "/")
                if target not in release_set:
                    errors.append(f"app.vault.adapter.read punta a file assente in {entry} -> {target}")

    def validate_release(self) -> None:
        errors: list[str] = []

        for file in self.required_release_files:
            if not (self.out / str(file)).exists():
                errors.append(f"file release obbligatorio mancante: {file}")

        for module_name in self.runtime_template_modules:
            runtime_module = f"z.automazioni/runtime_modules/{module_name}"
            runtime_module_json = re.sub(r"\.ya?ml$", ".json", runtime_module)
            if not (self.out / runtime_module).exists():
                errors.append(f"modulo YAML runtime release mancante: {runtime_module}")
            if not (self.out / runtime_module_json).exists():
                errors.append(f"modulo JSON runtime release mancante: {runtime_module_json}")

        for root in self.generated_release_roots:
            if not (self.out / str(root)).exists():
                errors.append(f"root generata release mancante: {root}")

        release_entries = self.walk_release()
        release_app_config = read_json(self.out / ".obsidian/app.json", {})
        ignored_filters = set(release_app_config.get("userIgnoreFilters") or []) if isinstance(release_app_config, dict) else set()
        for filter_value in self.required_user_ignore_filters:
            if filter_value not in ignored_filters:
                errors.append(f"filtro navigazione utente mancante in .obsidian/app.json: {filter_value}")

        for forbidden in [*self.excluded_dirs, *self.excluded_root_files]:
            if any(entry == forbidden or entry.startswith(f"{forbidden}/") for entry in release_entries):
                errors.append(f"percorso non ammesso nella release pulita: {forbidden}")

        for entry in release_entries:
            if not entry.startswith("z.automazioni/"):
                continue
            file = Path(entry).name
            if file in self.excluded_automazioni or any(file.startswith(prefix) for prefix in self.excluded_automazioni_prefixes):
                errors.append(f"script di manutenzione non ammesso nella release pulita: {entry}")

        self.validate_release_links(release_entries, errors)
        self.validate_release_text(release_entries, errors)
        self.validate_release_runtime(release_entries, errors)

        release_community_plugins = read_json(self.out / ".obsidian/community-plugins.json", [])
        expected_plugin_list = sorted(self.release_plugin_profile.enabled_plugins)
        release_plugin_list = sorted(release_community_plugins if isinstance(release_community_plugins, list) else [])
        if release_plugin_list != expected_plugin_list:
            errors.append(
                f"profilo plugin release non allineato: attesi {', '.join(expected_plugin_list)}, "
                f"trovati {', '.join(release_plugin_list)}"
            )

        homepage_config = read_json(self.out / ".obsidian/plugins/homepage/data.json", {})
        homepage = ((homepage_config.get("homepages") or {}).get("Main Homepage") if isinstance(homepage_config, dict) else None) or {}
        if homepage.get("value") != "Inizia Qui" or homepage.get("openOnStartup") is not True:
            errors.append("homepage non configurata per aprire Inizia Qui all'avvio")

        appearance_config = read_json(self.out / ".obsidian/appearance.json", {})
        snippets = appearance_config.get("enabledCssSnippets") if isinstance(appearance_config, dict) else []
        if not isinstance(snippets, list) or "gdr-vault" not in snippets:
            errors.append("snippet gdr-vault non abilitato nella release")

        templater_config = read_json(self.out / ".obsidian/plugins/templater-obsidian/data.json", {})
        if (
            not isinstance(templater_config, dict)
            or templater_config.get("templates_folder") != "z.modelli"
            or templater_config.get("user_scripts_folder") != "z.automazioni/templater"
        ):
            errors.append("Templater non configurato su z.modelli e z.automazioni/templater nella release")

        dataview_config = read_json(self.out / ".obsidian/plugins/dataview/data.json", {})
        if not isinstance(dataview_config, dict) or dataview_config.get("enableDataviewJs") is not True:
            errors.append("DataviewJS non abilitato nella release")

        workspace_config = read_json(self.out / ".obsidian/workspace.json", {})
        try:
            first_leaf = workspace_config["main"]["children"][0]["children"][0]["state"]
        except Exception:
            first_leaf = {}
        if first_leaf.get("state", {}).get("file") != "Inizia Qui.md" or first_leaf.get("state", {}).get("mode") != "preview":
            errors.append("workspace release non apre Inizia Qui in modalita lettura")

        release_set = set(release_entries)
        bookmarks_config = read_json(self.out / ".obsidian/bookmarks.json", {})

        def collect_bookmarks(items: Any) -> None:
            for item in as_array(items):
                if not isinstance(item, dict):
                    continue
                if item.get("type") == "group":
                    collect_bookmarks(item.get("items"))
                if item.get("type") == "file":
                    path = str(item.get("path") or "")
                    if path.startswith("z."):
                        errors.append(f"bookmark tecnico nella release: {path}")
                    if path not in release_set:
                        errors.append(f"bookmark verso file mancante nella release: {path}")

        if isinstance(bookmarks_config, dict):
            collect_bookmarks(bookmarks_config.get("items"))

        if errors:
            print("Release pulita non valida:", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            raise SystemExit(1)

        if not self.quiet:
            print(f"Release pulita pronta: {len(release_entries)} percorsi materializzati.")

    def run_command(self, command: list[str], cwd: Path | None = None, quiet: bool | None = None) -> None:
        use_quiet = self.quiet if quiet is None else quiet
        result = subprocess.run(
            command,
            cwd=cwd or ROOT,
            text=True,
            stdout=subprocess.PIPE if use_quiet else None,
            stderr=subprocess.PIPE if use_quiet else None,
            check=False,
        )
        if result.returncode != 0:
            if use_quiet:
                if result.stdout:
                    sys.stdout.write(result.stdout)
                if result.stderr:
                    sys.stderr.write(result.stderr)
            raise SystemExit(result.returncode)

    def zip_release(self) -> bool:
        if self.zip_path.exists():
            self.zip_path.unlink()
        with zipfile.ZipFile(self.zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for file in sorted(path for path in self.out.rglob("*") if path.is_file()):
                archive.write(file, file.relative_to(self.dist))
        return True

    def materialize_templates(self) -> None:
        command = [
            "python3",
            str(TEMPLATE_FACTORY_RENDERER),
            "--materialize-only",
            "--target-root",
            str(self.out),
        ]
        if self.quiet:
            command.append("--quiet")
        self.run_command(command)

    @staticmethod
    def yaml_to_json_text(source: Path) -> str:
        data = yaml.safe_load(source.read_text(encoding="utf-8")) or {}
        return json.dumps(data, ensure_ascii=False, indent=2)

    @staticmethod
    def find_source_yaml_module(module_name: str) -> Path | None:
        yaml_root = ROOT / "Dev" / "Source" / "YAML"
        for path in yaml_root.rglob(module_name):
            if path.is_file():
                return path
        return None

    def copy_runtime_template_modules(self) -> None:
        target_dir = self.out / "z.automazioni" / "runtime_modules"
        target_dir.mkdir(parents=True, exist_ok=True)
        for module_name in self.runtime_template_modules:
            source = self.find_source_yaml_module(str(module_name))
            if not source or not source.exists():
                print(f"Modulo runtime release mancante: {module_name}", file=sys.stderr)
                raise SystemExit(1)
            yaml_target = target_dir / str(module_name)
            json_target = target_dir / re.sub(r"\.ya?ml$", ".json", str(module_name))
            shutil.copy2(source, yaml_target)
            json_target.write_text(self.yaml_to_json_text(source).rstrip() + "\n", encoding="utf-8")

    def materialize_generated_release_roots(self) -> None:
        if "z.bases" in self.generated_release_roots or "z.fileclass" in self.generated_release_roots:
            self.run_command(
                [
                    "python3",
                    str(ROOT / "Dev" / "Tools" / "python" / "render_metadata_surfaces.py"),
                    "--target-root",
                    str(self.out),
                ],
                quiet=self.quiet,
            )
        if "SRD" in self.generated_release_roots:
            self.run_command(
                ["python3", str(ROOT / "Dev" / "Tools" / "python" / "import_srd.py")],
                cwd=self.out,
                quiet=self.quiet,
            )

    def build(self) -> None:
        shutil.rmtree(self.out, ignore_errors=True)
        self.dist.mkdir(parents=True, exist_ok=True)
        self.copy_dir(ROOT, self.out, ROOT)
        self.materialize_obsidian_sources()
        self.materialize_runtime_sources()
        self.materialize_templates()
        self.copy_runtime_template_modules()
        self.materialize_generated_release_roots()
        self.write_generated_release_notes()
        self.validate_release()

        zipped = self.zip_release()
        if not self.quiet:
            print(f"Release utente creata: {rel(self.out)}")
        if zipped and not self.quiet:
            print(f"Zip utente creato: {rel(self.zip_path)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Crea il vault release pulito in dist.")
    parser.add_argument("--out", default="dist/vault-gdr-clean")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    ReleaseBuilder(ROOT / args.out, args.quiet).build()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
