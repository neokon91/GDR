from __future__ import annotations

import re

from template_factory_utils import FACTORY, ROOT, known_frontmatter_fields


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def metabind_input_field(input_body: str) -> str:
    body = input_body.strip()
    if not body:
        return ""
    if ":" in body:
        return body.rsplit(":", 1)[-1].strip()
    return ""


def validate_plugin_surface_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    """Valida che le superfici plugin restino dichiarate in YAML e non nascoste nei Jinja."""
    jinja_text_by_path = {
        path: path.read_text(encoding="utf-8")
        for path in sorted((FACTORY / "jinja").glob("**/*.j2"))
    }
    all_text = "\n".join(jinja_text_by_path.values())

    known_fields = known_frontmatter_fields(modules)
    button_ids = {
        str(button.get("id"))
        for button in modules["metabind_buttons"].get("buttons", {}).values()
        if button.get("id")
    }
    callout_types = {
        str(callout.get("type"))
        for callout in modules["callouts"].get("callouts", {}).values()
        if callout.get("type")
    }
    runtime_views = {
        str(block.get("runtime_view"))
        for block in modules["dataview_blocks"].get("blocks", {}).values()
        if block.get("runtime_view")
    }
    for block in modules["dataview_blocks"].get("blocks", {}).values():
        code = str(block.get("code", ""))
        for match in re.finditer(r"gdr\.([A-Za-z0-9_]+)\(", code):
            runtime_views.add(match.group(1))
    base_files = {
        str(view.get("file"))
        for view in modules["bases_views"].get("views", {}).values()
        if view.get("file")
    }

    for path, text in jinja_text_by_path.items():
        rel_path = path.relative_to(ROOT)
        if "jinja/macros/" in rel_path.as_posix():
            continue
        for match in re.finditer(r"INPUT\[([^\]]+)\]", text):
            field = metabind_input_field(match.group(1))
            if field and field not in known_fields:
                fail(f"{rel_path}: Meta Bind INPUT non dichiarato nei campi YAML ({field})", errors)

        for match in re.finditer(r"BUTTON\[([^\]]+)\]", text):
            button_id = match.group(1).strip()
            if button_id not in button_ids:
                fail(f"{rel_path}: Meta Bind BUTTON non dichiarato in metabind_buttons.yaml ({button_id})", errors)

        for match in re.finditer(r"(?m)^> \[!([^\]\-]+)[^\]]*\]", text):
            callout_type = match.group(1).strip()
            if callout_type not in callout_types:
                fail(f"{rel_path}: callout non dichiarato in callouts.yaml ({callout_type})", errors)

        for match in re.finditer(r"gdr\.([A-Za-z0-9_]+)\(", text):
            view = match.group(1)
            if view not in runtime_views:
                fail(f"{rel_path}: runtime DataviewJS non dichiarato in dataview_blocks.yaml ({view})", errors)

        for match in re.finditer(r"\[\[(z\.bases/[^]|#]+\.base)", text):
            base = match.group(1)
            if base not in base_files:
                fail(f"{rel_path}: Base linkata non dichiarata in bases_views.yaml ({base})", errors)

    if "````tabs" in all_text and "tabs" not in modules:
        fail("TemplateFactory: Tabs usato dai Jinja ma modulo tabs mancante", errors)


def validate_workflow_quick_actions(modules: dict[str, dict], errors: list[str]) -> None:
    """Valida che le azioni rapide dei flussi puntino a pulsanti Meta Bind reali."""
    workflow_map = modules["workflows"].get("workflows", {}) or {}
    button_ids = {
        str(button.get("id"))
        for button in modules["metabind_buttons"].get("buttons", {}).values()
        if button.get("id")
    }

    if not workflow_map:
        fail("workflows: nessun flusso operativo definito", errors)
        return

    for workflow_id, workflow in workflow_map.items():
        actions = workflow.get("quick_actions", []) or []
        if workflow_id in {"prepara_sessione", "gioca_live", "post_sessione"} and not actions:
            fail(f"workflows.{workflow_id}: quick_actions mancanti", errors)
        for index, action in enumerate(actions):
            button = str((action or {}).get("button", ""))
            if not button:
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: button mancante", errors)
            elif button not in button_ids:
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: pulsante non dichiarato ({button})", errors)
            if not (action or {}).get("label"):
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: label mancante", errors)
            if not (action or {}).get("use_when"):
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: use_when mancante", errors)
