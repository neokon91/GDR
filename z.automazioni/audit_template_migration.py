#!/usr/bin/env python3

from __future__ import annotations

import argparse
import difflib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import yaml


ROOT = Path.cwd()
FACTORY = ROOT / "Dev" / "TemplateFactory"
MODULES = FACTORY / "modules"
GENERATED = FACTORY / "examples" / "generated"
DEFAULT_REPORT = FACTORY / "examples" / "generated" / "migration_audit.md"

MARKERS = {
    "templater": r"<%\s*await\s+tp\.user\.",
    "templater_multiline": r"<%\*",
    "meta_bind_input": r"INPUT\[",
    "meta_bind_button": r"BUTTON\[",
    "dataview": r"```dataview\b",
    "dataviewjs": r"```dataviewjs\b",
    "tabs": r"````tabs",
    "callout": r">\s*\[!",
    "statblock": r"```statblock\b",
    "encounter": r"```encounter\b",
    "dice": r"dice:",
    "fallback": r"\bFallback\b|fallback",
    "session_views": r"z\.engine/session_views\.js",
    "legacy_session_context": r"z\.automazioni/session_context\.js",
}


def load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non e un oggetto")
    return data


def count_markers(text: str) -> dict[str, int]:
    return {name: len(re.findall(pattern, text)) for name, pattern in MARKERS.items()}


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a.splitlines(), b.splitlines()).ratio()


def recommendation(preview: str, target: str, ratio: float, preview_markers: dict[str, int], target_markers: dict[str, int]) -> tuple[str, str]:
    if target_markers["templater_multiline"]:
        return "migrare router", "Target contiene blocchi Templater multilinea."
    if ratio >= 0.82 and preview_markers["fallback"] >= target_markers["fallback"]:
        return "candidato merge", "Preview molto vicina al target e fallback presente."
    if len(preview.splitlines()) < len(target.splitlines()) * 0.45:
        return "non sostituire", "Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare."
    if preview_markers["session_views"] and target_markers["legacy_session_context"]:
        return "migrare parziale", "Preview usa z.engine/session_views.js; target usa ancora z.automazioni/session_context.js."
    return "migrare parziale", "Serve confronto manuale di sezioni e marker plugin."


def audit_target(blueprint: str, preview_path: Path, target_path: Path) -> dict:
    preview = preview_path.read_text(encoding="utf-8")
    target = target_path.read_text(encoding="utf-8") if target_path.exists() else ""
    ratio = similarity(preview, target) if target else 0.0
    preview_markers = count_markers(preview)
    target_markers = count_markers(target)
    action, reason = recommendation(preview, target, ratio, preview_markers, target_markers)

    missing_in_preview = [
        name for name, count in target_markers.items()
        if count > 0 and preview_markers.get(name, 0) == 0 and name not in {"legacy_session_context"}
    ]
    new_in_preview = [
        name for name, count in preview_markers.items()
        if count > 0 and target_markers.get(name, 0) == 0
    ]

    return {
        "blueprint": blueprint,
        "preview": str(preview_path.relative_to(ROOT)),
        "target": str(target_path.relative_to(ROOT)),
        "target_exists": target_path.exists(),
        "preview_lines": len(preview.splitlines()),
        "target_lines": len(target.splitlines()),
        "similarity": round(ratio, 3),
        "recommendation": action,
        "reason": reason,
        "missing_in_preview": missing_in_preview,
        "new_in_preview": new_in_preview,
        "preview_markers": preview_markers,
        "target_markers": target_markers,
    }


def render_markdown(rows: list[dict]) -> str:
    lines = [
        "# TemplateFactory Migration Audit",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "Questo report confronta le preview generate da `Dev/TemplateFactory` con i template reali in `z.modelli`. Non modifica i template reali.",
        "",
        "## Sintesi",
        "",
        "| Blueprint | Target | Similarita | Preview/Target righe | Raccomandazione | Motivo |",
        "| --- | --- | ---: | ---: | --- | --- |",
    ]

    for row in rows:
        lines.append(
            "| {blueprint} | `{target}` | {similarity:.3f} | {preview_lines}/{target_lines} | {recommendation} | {reason} |".format(**row)
        )

    lines.extend(["", "## Dettaglio", ""])

    for row in rows:
        lines.extend([
            f"### {row['blueprint']} -> `{row['target']}`",
            "",
            f"- Preview: `{row['preview']}`",
            f"- Target esiste: `{row['target_exists']}`",
            f"- Similarita: `{row['similarity']}`",
            f"- Raccomandazione: **{row['recommendation']}**",
            f"- Motivo: {row['reason']}",
            f"- Marker presenti solo nel target: {', '.join(row['missing_in_preview']) if row['missing_in_preview'] else 'nessuno'}",
            f"- Marker nuovi nella preview: {', '.join(row['new_in_preview']) if row['new_in_preview'] else 'nessuno'}",
            "",
            "| Marker | Preview | Target |",
            "| --- | ---: | ---: |",
        ])
        for marker in MARKERS:
            lines.append(f"| `{marker}` | {row['preview_markers'][marker]} | {row['target_markers'][marker]} |")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita preview TemplateFactory contro template reali.")
    parser.add_argument("--report", default=str(DEFAULT_REPORT), help="Path report Markdown.")
    parser.add_argument("--json", default="", help="Path opzionale report JSON.")
    args = parser.parse_args()

    blueprints = load_yaml(MODULES / "template_blueprints.yaml")["blueprints"]
    rows: list[dict] = []

    for name, blueprint in blueprints.items():
        preview_path = GENERATED / f"{name}.preview.md"
        if not preview_path.exists():
            raise SystemExit(f"Preview mancante per {name}: eseguire npm run render:templates")

        for target in blueprint.get("comparison_targets", []):
            rows.append(audit_target(name, preview_path, ROOT / target))

    report_path = Path(args.report)
    if not report_path.is_absolute():
        report_path = ROOT / report_path
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(render_markdown(rows), encoding="utf-8")

    if args.json:
        json_path = Path(args.json)
        if not json_path.is_absolute():
            json_path = ROOT / json_path
        json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"TemplateFactory migration audit OK: {len(rows)} confronti in {report_path.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
