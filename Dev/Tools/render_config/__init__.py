"""Configurazione `.obsidian` e presentazione (CSS/Canvas), derivata dal modello.
Estratto da render.py, che re-esporta i nomi pubblici per i test/usi storici.
Sottomoduli: `_io` (merge non distruttivo) · `presentation` (CSS + Canvas) ·
`model_cfg` (bottoni/fileClass/Meta Bind/Bases) · `writers` (settings + un writer
per plugin + orchestratore `write_obsidian_config`)."""

from ._io import merge_json, merge_plugin_config, union_list, union_list_key
from .presentation import (
    HIDE_FOLDERS_SNIPPET,
    CATEGORY_ACCENTS,
    category_accent_css,
    callout_appearance_css,
    write_workspace_chrome,
    canvas_colors,
)
from .model_cfg import (
    load_statblock_layouts,
    creation_buttons,
    action_buttons,
    values_list,
    fileclass_fields,
    fileclass_note,
    meta_bind_config,
    bases_doc,
    write_bases,
)
from .writers import (
    MEDIA_FOLDER,
    MEDIA_ICON,
    APP_SETTINGS,
    CORE_PLUGINS,
    HOMEPAGE_CONFIG,
    write_core_settings,
    write_homepage,
    write_folder_notes,
    write_tab_panels,
    write_calendarium,
    write_metadata_menu,
    write_iconize,
    write_callout_manager,
    write_statblock_layouts,
    initiative_statuses,
    write_initiative_tracker,
    write_bookmarks,
    write_obsidian_config,
)
