#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path.cwd()
FACTORY = ROOT / "Dev" / "TemplateFactory"
MODULES = FACTORY / "modules"
JINJA = FACTORY / "jinja"
DEFAULT_OUTPUT = FACTORY / "examples" / "generated"
EXAMPLES = FACTORY / "examples"


def load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non e un oggetto")
    return data


def load_modules() -> dict[str, dict]:
    modules: dict[str, dict] = {}
    for path in sorted(MODULES.glob("*.yaml")):
        data = load_yaml(path)
        modules[str(data.get("id", path.stem))] = data
    return modules


def templater_function(entry: str) -> str:
    match = re.search(r"tp\.user\.([A-Za-z0-9_]+)\(", entry)
    return match.group(1) if match else "world_entity"


def load_context(name: str) -> dict:
    path = EXAMPLES / f"{name}.context.yaml"
    if not path.exists():
        return {}
    return load_yaml(path)


def render_blueprint(env: Environment, name: str, blueprint: dict, modules: dict[str, dict]) -> str:
    template_ref = Path(str(blueprint["jinja_template"])).name
    template = env.get_template(template_ref)
    entry = str(blueprint.get("templater_entry", ""))
    context = load_context(name)
    render_context = {
        "blueprint_id": name,
        "blueprint": blueprint,
        "templater_entry": entry,
        "templater_function": templater_function(entry),
        "label": name.replace("_", " ").title(),
        "monster": "Creatura",
        "modules": modules,
    }
    render_context.update(context)
    return template.render(**render_context)


def validate_rendered(name: str, rendered: str) -> list[str]:
    errors: list[str] = []
    stripped = rendered.lstrip()
    templater_tags = re.findall(r"<%[\s\S]*?%>", rendered)

    if not stripped.startswith("<% await tp.user."):
        errors.append(f"{name}: output senza entry Templater iniziale")
    if "<%*" in rendered:
        errors.append(f"{name}: output contiene blocco Templater multilinea")
    if len(templater_tags) != 1:
        errors.append(f"{name}: output contiene {len(templater_tags)} tag Templater invece di 1")
    if "Fallback" not in rendered and "fallback" not in rendered:
        errors.append(f"{name}: output senza fallback Markdown esplicito")

    return errors


def write_rendered(output_dir: Path, rendered_by_name: dict[str, str], clean: bool) -> None:
    if clean and output_dir.exists():
        for path in output_dir.glob("*.preview.md"):
            path.unlink()
        manifest_path = output_dir / "manifest.json"
        if manifest_path.exists():
            manifest_path.unlink()
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Dev/TemplateFactory",
        "mode": "preview",
        "files": [],
    }

    for name, rendered in sorted(rendered_by_name.items()):
        target = output_dir / f"{name}.preview.md"
        target.write_text(rendered, encoding="utf-8")
        manifest["files"].append({
            "blueprint": name,
            "path": str(target.relative_to(ROOT)),
            "bytes": len(rendered.encode("utf-8")),
        })

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def materialized_targets(name: str, blueprint: dict) -> list[Path]:
    output = blueprint.get("output", {})
    folder = output.get("folder")
    files = output.get("files") or []
    if not folder:
        raise ValueError(f"{name}: output.folder mancante")
    if not files:
        raise ValueError(f"{name}: output.files mancante")

    base = (ROOT / str(folder)).resolve()
    targets: list[Path] = []
    for file_name in files:
        target = (base / str(file_name)).resolve()
        if not target.is_relative_to(ROOT):
            raise ValueError(f"{name}: output fuori repository ({target})")
        targets.append(target)
    return targets


def write_materialized(rendered_by_name: dict[str, str], blueprints: dict[str, dict]) -> None:
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Dev/TemplateFactory",
        "mode": "materialized",
        "files": [],
    }

    for name, rendered in sorted(rendered_by_name.items()):
        for target in materialized_targets(name, blueprints[name]):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(rendered, encoding="utf-8")
            manifest["files"].append({
                "blueprint": name,
                "path": str(target.relative_to(ROOT)),
                "bytes": len(rendered.encode("utf-8")),
            })

    manifest_path = ROOT / "z.modelli" / ".templatefactory-manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza anteprime TemplateFactory da YAML/Jinja.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Cartella output preview.")
    parser.add_argument("--no-clean", action="store_true", help="Non pulire la cartella output prima di scrivere.")
    parser.add_argument("--materialize", action="store_true", help="Scrive gli output generati in z.modelli.")
    args = parser.parse_args()

    modules = load_modules()
    blueprints = modules["template_blueprints"]["blueprints"]
    env = Environment(
        loader=FileSystemLoader(str(JINJA)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
    )

    rendered_by_name: dict[str, str] = {}
    errors: list[str] = []

    for name, blueprint in blueprints.items():
        rendered = render_blueprint(env, name, blueprint, modules)
        errors.extend(validate_rendered(name, rendered))
        rendered_by_name[name] = rendered

    if errors:
        print("Render TemplateFactory fallito:")
        for error in errors:
            print(f"- {error}")
        return 1

    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = ROOT / output_dir
    write_rendered(output_dir, rendered_by_name, clean=not args.no_clean)
    message = f"TemplateFactory render OK: {len(rendered_by_name)} preview in {output_dir.relative_to(ROOT)}"
    if args.materialize:
        write_materialized(rendered_by_name, blueprints)
        message += " e output materializzati in z.modelli"
    print(f"{message}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
