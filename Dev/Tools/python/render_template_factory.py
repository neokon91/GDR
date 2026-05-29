#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True

from template_factory_utils import (
    GENERATED,
    ROOT,
    build_jinja_env,
    display_path,
    load_modules,
    render_context,
    resolved_blueprints,
    validate_rendered,
)


DEFAULT_OUTPUT = GENERATED


def render_blueprint(env, name: str, blueprint: dict, modules: dict[str, dict]) -> str:
    template_ref = Path(str(blueprint["jinja_template"])).name
    template = env.get_template(template_ref)
    return template.render(**render_context(name, blueprint, modules))


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
        "source": "Dev/Source",
        "mode": "preview",
        "files": [],
    }

    for name, rendered in sorted(rendered_by_name.items()):
        target = output_dir / f"{name}.preview.md"
        target.write_text(rendered, encoding="utf-8")
        manifest["files"].append({
            "blueprint": name,
            "path": display_path(target),
            "bytes": len(rendered.encode("utf-8")),
        })

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def materialized_targets(name: str, blueprint: dict, target_root: Path = ROOT) -> list[Path]:
    output = blueprint.get("output", {})
    folder = output.get("folder")
    files = output.get("files") or []
    if not folder:
        raise ValueError(f"{name}: output.folder mancante")
    if not files:
        raise ValueError(f"{name}: output.files mancante")

    base = (target_root / str(folder)).resolve()
    targets: list[Path] = []
    for file_name in files:
        target = (base / str(file_name)).resolve()
        if not target.is_relative_to(target_root):
            raise ValueError(f"{name}: output fuori repository ({target})")
        targets.append(target)
    return targets


def write_materialized(rendered_by_name: dict[str, str], blueprints: dict[str, dict], target_root: Path = ROOT) -> None:
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Dev/Source",
        "mode": "materialized",
        "files": [],
    }

    for name, rendered in sorted(rendered_by_name.items()):
        for target in materialized_targets(name, blueprints[name], target_root):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(rendered, encoding="utf-8")
            manifest["files"].append({
                "blueprint": name,
                "path": str(target.relative_to(target_root)),
                "bytes": len(rendered.encode("utf-8")),
            })

    manifest_path = target_root / "z.modelli" / ".templatefactory-manifest.json"
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
    parser.add_argument("--materialize-only", action="store_true", help="Scrive solo gli output in z.modelli senza aggiornare le preview.")
    parser.add_argument("--target-root", default=str(ROOT), help="Radice in cui materializzare z.modelli.")
    parser.add_argument("--quiet", action="store_true", help="Non stampa messaggi OK; gli errori restano visibili.")
    args = parser.parse_args()

    modules = load_modules()
    blueprints = resolved_blueprints(modules)
    env = build_jinja_env()

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

    target_root = Path(args.target_root)
    if not target_root.is_absolute():
        target_root = ROOT / target_root
    target_root = target_root.resolve()

    if args.materialize_only:
        write_materialized(rendered_by_name, blueprints, target_root)
        if not args.quiet:
            print(f"TemplateFactory materialize OK: {len(rendered_by_name)} output in {display_path(target_root / 'z.modelli')}.")
        return 0

    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = ROOT / output_dir
    write_rendered(output_dir, rendered_by_name, clean=not args.no_clean)
    message = f"TemplateFactory render OK: {len(rendered_by_name)} preview in {display_path(output_dir)}"
    if args.materialize:
        write_materialized(rendered_by_name, blueprints, target_root)
        message += " e output materializzati in z.modelli"
    if not args.quiet:
        print(f"{message}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
