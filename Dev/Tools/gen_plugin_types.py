"""Genera `plugin/core.d.ts`: i tipi TypeScript del plugin `gdr`, DERIVATI dal modello.

Filosofia (come Compendio, come tutto il vault): la sorgente di verità è lo YAML, i
tipi si GENERANO — non si scrivono a mano (che deriva subito: es. i sottotipi creatura).
Qui si emettono i soli tipi che al plugin servono davvero:

  - i VOCABOLARI chiusi come union letterali (Categoria, Stato, AzioneId, TemplateId),
    da `entities/*.yaml`+`core.yaml`, da `model_cfg._PLUGIN_ACTIONS`, da `templates`;
  - i NOMI-PANNELLO (PanelName) da `_panels.mjs` (la stessa mappa che importa il plugin);
  - la SHAPE di `core.json` (`CoreData`/`Template`), tipizzando con precisione i campi che
    `main.ts` legge (templates/folders/…) e lasciando lasco il resto (`unknown`).

NON tipizza le ENTITÀ di dominio intere (creatura/oggetto…): quello è dato, vive nello
YAML ed è validato a runtime (validate.py) — un'interfaccia a mano duplicherebbe e
deriverebbe. Il `core.d.ts` è build-time (typecheck + editor); esbuild strippa i tipi.

Usa solo `common` + `model_cfg` (niente jinja2) → gira col `python3` di sistema.
Rigenera con `npm run gen:types` (dentro plugin/); `test_plugin_types` verifica l'allineamento.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "Dev" / "Tools"))

import common  # noqa: E402
from render_config.model_cfg import _PLUGIN_ACTIONS  # noqa: E402

PANELS_MJS = ROOT / "Dev" / "Source" / "JS" / "_panels.mjs"
OUT = ROOT / "plugin" / "core.d.ts"


def _union(name: str, values: list[str], doc: str) -> str:
    """Un `export type <name> = 'a' | 'b' | …;` (una voce per riga, ordinato/stabile)."""
    if not values:
        return f"/** {doc} */\nexport type {name} = never;\n"
    body = "\n".join(f"  | {_lit(v)}" for v in values)
    return f"/** {doc} */\nexport type {name} =\n{body};\n"


def _lit(v: str) -> str:
    return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"


def _panel_names() -> list[str]:
    """I nomi-pannello registrati in _panels.mjs (stessa regex del test di drift)."""
    src = PANELS_MJS.read_text(encoding="utf-8")
    return sorted(set(re.findall(r"(\w+):\s*\{\s*mode:", src)))


def core_dts() -> str:
    core = common.load_core()
    templates = common.load_templates()
    categorie = sorted((core.get("categories") or {}).keys())
    stati = list(core.get("states") or [])
    template_ids = sorted({t["id"] for t in templates if t.get("id")})
    azioni = sorted(_PLUGIN_ACTIONS)
    pannelli = _panel_names()

    header = (
        "// GENERATO da Dev/Tools/gen_plugin_types.py — NON editare a mano.\n"
        "// Sorgente: il modello fuso (core.yaml + entities/*.yaml), _panels.mjs e\n"
        "// model_cfg._PLUGIN_ACTIONS. Rigenera con `npm run gen:types` (in plugin/).\n"
        "// Un test pytest (test_plugin_types) fallisce se questo file è disallineato.\n"
    )
    types = "\n".join([
        _union("Categoria", categorie, "Le categorie del modello (folders/categories delle entità)."),
        _union("Stato", stati, "Gli stati del ciclo di vita di una nota (core.yaml: states)."),
        _union("PanelName", pannelli, "I pannelli ```gdr resi dal plugin (_panels.mjs: PANELS)."),
        _union("TemplateId", template_ids, "Gli id dei template di creazione (entities/*.yaml)."),
        _union("AzioneId", azioni, "Le azioni del dispatcher esposte come comandi gdr:<azione> (model_cfg._PLUGIN_ACTIONS)."),
    ])
    interfaces = """\
/** Un template di creazione (voce di core.json:templates). */
export interface Template {
  id: TemplateId;
  title: string;
  category: Categoria;
  target: string;
  jinja?: string;
}

/** Metadati di una categoria (core.json:categories[cat]); campi noti + resto libero. */
export interface CategoriaMeta {
  subtypes?: { nome: string; descrizione?: string }[];
  subtype_profiles?: boolean;
  famiglie?: { nome: string }[];
  [k: string]: unknown;
}

/** Un plugin essenziale per la Diagnostica (core.json:plugins). */
export interface PluginInfo {
  id: string;
  name: string;
  rompe: string;
}

/**
 * La forma di `z.automazioni/data/core.json` che il plugin legge (loadCore()).
 * I campi che main.ts usa sono tipizzati con precisione; il resto è `unknown`
 * (dato per views.js/meta_actions.js, non toccato dal plugin) — vedi engine_payload.
 */
export interface CoreData {
  folders: Partial<Record<Categoria, string>>;
  categories: Record<Categoria, CategoriaMeta>;
  states: Stato[];
  templates: Template[];
  canvas_colors: Record<string, string>;
  plugins: PluginInfo[];
  fields: Record<string, unknown>;
  relazioni: Record<string, unknown>;
  archetipi: Record<string, unknown>;
  creation: Record<string, unknown>;
  assi_tematici: Record<string, unknown>;
  generatori: Record<string, unknown>;
  widget_options: Record<string, unknown>;
  xp: Record<string, unknown>;
  astrologia: Record<string, unknown>;
  condizioni: unknown;
  maestrie: unknown;
  gs_baseline: unknown;
  [k: string]: unknown;
}
"""
    return header + "\n" + types + "\n" + interfaces


def main() -> None:
    OUT.write_text(core_dts(), encoding="utf-8")
    print(f"Scritto {OUT.relative_to(ROOT)} "
          f"(Categoria/Stato/PanelName/TemplateId/AzioneId + CoreData).")


if __name__ == "__main__":
    main()
