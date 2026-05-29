from __future__ import annotations

import re

from template_factory_utils import JINJA, ROOT, known_frontmatter_fields


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


BUTTON_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")
FENCED_CODE_PATTERN = re.compile(r"(?ms)^[ >]*```(?!`).*?^[ >]*```(?!`)")
INLINE_CODE_PATTERN = re.compile(r"`[^`\n]+`")
NAKED_META_BIND_PATTERN = re.compile(r"\b(INPUT|BUTTON)\[([^\]\n]+)\]")


def validate_workflow_button_id(workflow_id: str, context: str, button: str, errors: list[str]) -> None:
    """I workflow dichiarano id Meta Bind puliti; il renderer aggiunge BUTTON[...]."""
    if "BUTTON[" in button or "]" in button:
        fail(f"workflows.{workflow_id}.{context}: usare id Meta Bind pulito, non {button}", errors)
    if button and not BUTTON_ID_PATTERN.match(button):
        fail(f"workflows.{workflow_id}.{context}: id pulsante Meta Bind non valido ({button})", errors)


def metabind_input_field(input_body: str) -> str:
    body = input_body.strip()
    if not body:
        return ""
    if ":" in body:
        return body.rsplit(":", 1)[-1].strip()
    return ""


def strip_plugin_code_surfaces(text: str) -> str:
    """Rimuove inline code e code fence: Meta Bind monta i controlli solo li."""
    without_fences = FENCED_CODE_PATTERN.sub("", text)
    return INLINE_CODE_PATTERN.sub("", without_fences)


def validate_plugin_surface_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    """Valida che le superfici plugin restino dichiarate in YAML e non nascoste nei Jinja."""
    jinja_text_by_path = {
        path: path.read_text(encoding="utf-8")
        for path in sorted(JINJA.glob("**/*.j2"))
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
    declared_runtime_views = {
        str(block.get("runtime_view"))
        for block in modules["dataview_blocks"].get("blocks", {}).values()
        if block.get("runtime_view")
    }
    runtime_views = set(declared_runtime_views)
    for block in modules["dataview_blocks"].get("blocks", {}).values():
        code = str(block.get("code", ""))
        for match in re.finditer(r"gdr\.([A-Za-z0-9_]+)\(", code):
            runtime_views.add(match.group(1))
    base_files = {
        str(view.get("file"))
        for view in modules["bases_views"].get("views", {}).values()
        if view.get("file")
    }
    required_exports = set(modules.get("runtime_exports", {}).get("required_exports", []) or [])

    for view in sorted(declared_runtime_views):
        if view not in required_exports:
            fail(f"dataview_blocks: runtime_view non dichiarata in runtime_exports.yaml ({view})", errors)

    for path, text in jinja_text_by_path.items():
        rel_path = path.relative_to(ROOT)
        normalized_path = rel_path.as_posix().lower()
        if "/jinja/macros/" in normalized_path:
            continue
        if 'app.vault.adapter.read("z.engine/session_views.js")' in text:
            fail(f"{rel_path}: usare macros/dataview_blocks.j2 per il bridge DataviewJS runtime", errors)
        if re.search(r"modules\.dataview_blocks\.blocks\.[A-Za-z0-9_]+\.code", text):
            fail(f"{rel_path}: usare macros/dataview_blocks.j2 invece di leggere .code direttamente", errors)
        for match in NAKED_META_BIND_PATTERN.finditer(strip_plugin_code_surfaces(text)):
            fail(f"{rel_path}: {match.group(1)}[{match.group(2)}] non e in inline code o blocco meta-bind", errors)
        for match in re.finditer(r"INPUT\[([^\]]+)\]", text):
            field = metabind_input_field(match.group(1))
            if field and field not in known_fields:
                fail(f"{rel_path}: Meta Bind INPUT non dichiarato nei campi YAML ({field})", errors)

        for match in re.finditer(r"BUTTON\[([^\]]+)\]", text):
            button_id = match.group(1).strip()
            # I template di release possono interpolare id gia validati da workflows.yaml.
            if "{{" in button_id or "{%" in button_id:
                continue
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
    generated_button_ids = button_ids

    if not workflow_map:
        fail("workflows: nessun flusso operativo definito", errors)
        return

    for workflow_id, workflow in workflow_map.items():
        actions = workflow.get("quick_actions", []) or []
        action_groups = workflow.get("action_groups", {}) or {}
        grouped_actions = [
            action
            for group in action_groups.values()
            for action in (group or {}).get("actions", []) or []
        ]
        required_plugins = workflow.get("required_plugins", []) or []
        if workflow_id in {"prepara_sessione", "gioca_live", "post_sessione"} and not actions:
            fail(f"workflows.{workflow_id}: quick_actions mancanti", errors)
        if actions and not required_plugins:
            fail(f"workflows.{workflow_id}: required_plugins mancanti per flusso con quick_actions", errors)
        for index, action in enumerate(actions):
            button = str((action or {}).get("button", ""))
            if not button:
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: button mancante", errors)
            else:
                validate_workflow_button_id(workflow_id, f"quick_actions[{index}]", button, errors)
                if button not in button_ids and button not in generated_button_ids:
                    fail(f"workflows.{workflow_id}.quick_actions[{index}]: pulsante non dichiarato ({button})", errors)
            if not (action or {}).get("label"):
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: label mancante", errors)
            if not (action or {}).get("use_when"):
                fail(f"workflows.{workflow_id}.quick_actions[{index}]: use_when mancante", errors)

        for group_id, group in action_groups.items():
            if not (group or {}).get("label"):
                fail(f"workflows.{workflow_id}.action_groups.{group_id}: label mancante", errors)
            if not (group or {}).get("purpose"):
                fail(f"workflows.{workflow_id}.action_groups.{group_id}: purpose mancante", errors)
            if not ((group or {}).get("actions") or []):
                fail(f"workflows.{workflow_id}.action_groups.{group_id}: actions mancanti", errors)

        for index, action in enumerate(grouped_actions):
            button = str((action or {}).get("button", ""))
            if not button:
                fail(f"workflows.{workflow_id}.action_groups[{index}]: button mancante", errors)
            else:
                validate_workflow_button_id(workflow_id, f"action_groups[{index}]", button, errors)
                if button not in generated_button_ids:
                    fail(f"workflows.{workflow_id}.action_groups[{index}]: pulsante non configurato in Meta Bind ({button})", errors)
            if not (action or {}).get("label"):
                fail(f"workflows.{workflow_id}.action_groups[{index}]: label mancante", errors)
            if not (action or {}).get("use_when"):
                fail(f"workflows.{workflow_id}.action_groups[{index}]: use_when mancante", errors)
