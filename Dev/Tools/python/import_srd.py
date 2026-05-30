#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import ssl
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

SOURCE_REPOSITORY = "neokon91/DND-SRD-IT"
SOURCE_REF = "dea45ab38ddc7679f8c1080117f22bcc6dca3154"
SOURCE_REPO_URL = f"https://github.com/{SOURCE_REPOSITORY}"
SOURCE_TREE_URL = f"{SOURCE_REPO_URL}/tree/{SOURCE_REF}"
REPO_RAW = f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}"
VERSION = "5.2.1"
BASE = f"srd/{VERSION}/json"
OUT = Path("SRD")
GENERATED_BY = "import_srd"

SOURCES = [
    {"key": "backgrounds", "file": "srd_5_2_1_backgrounds.json", "dir": "Background", "tipo": "background", "title": "Background"},
    {"key": "classes", "file": "srd_5_2_1_classes.json", "dir": "Classi", "tipo": "classe", "title": "Classi"},
    {"key": "equipment", "file": "srd_5_2_1_equipment.json", "dir": "Equipaggiamento", "tipo": "equipaggiamento", "title": "Equipaggiamento"},
    {"key": "feats", "file": "srd_5_2_1_feats.json", "dir": "Talenti", "tipo": "talento", "title": "Talenti"},
    {"key": "languages", "file": "srd_5_2_1_languages.json", "dir": "Lingue", "tipo": "lingua", "title": "Lingue"},
    {"key": "spells", "file": "srd_5_2_1_spells.json", "dir": "Incantesimi", "tipo": "incantesimo", "title": "Incantesimi"},
    {"key": "monsters", "file": "srd_5_2_1_monsters.json", "dir": "Mostri", "tipo": "mostro", "title": "Mostri"},
    {"key": "magic_items", "file": "srd_5_2_1_magic_items.json", "dir": "Oggetti Magici", "tipo": "oggetto magico", "title": "Oggetti Magici"},
    {"key": "rules", "file": "srd_5_2_1_rules.json", "dir": "Regole", "tipo": "regola", "title": "Regole"},
    {"key": "rules_glossary", "file": "srd_5_2_1_rules_glossary.json", "dir": "Glossario", "tipo": "glossario", "title": "Glossario"},
    {"key": "species", "file": "srd_5_2_1_species.json", "dir": "Specie", "tipo": "specie", "title": "Specie"},
]

DIR_BY_TIPO = {source["tipo"]: source["dir"] for source in SOURCES}


def ssl_context() -> ssl.SSLContext:
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def validate_source_pin() -> None:
    if not re.fullmatch(r"[0-9a-f]{40}", SOURCE_REF, flags=re.IGNORECASE):
        raise RuntimeError(f"SOURCE_REF SRD non pinnato a commit SHA valido: {SOURCE_REF}")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_generated_file(path: Path, content: str) -> bool:
    if path.exists():
        existing = path.read_text(encoding="utf-8")
        if f"generato_da: {GENERATED_BY}" not in existing and f'generato_da: "{GENERATED_BY}"' not in existing:
            print(f"Salto nota modificata manualmente: {path}", file=sys.stderr)
            return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def slugify(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r'[\\/:*?"<>|#^[\]]', "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def block_slug(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or "").lower())
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r"[^a-z0-9_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "blocco"


def block_id(item: dict[str, Any], name: Any) -> str:
    return f"srd-{block_slug(item.get('id'))}-{block_slug(name)}"


def wikilink(target: str) -> str:
    return f"[[{target}]]"


def srd_target(item: dict[str, Any], tipo: str) -> str:
    directory = DIR_BY_TIPO.get(tipo, "")
    filename = slugify(item.get("nome") or item.get("id"))
    return f"{OUT.as_posix()}/{directory}/{filename}" if directory else filename


def yaml_scalar(value: Any) -> str:
    if value is None or value == "":
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return json.dumps(str(value), ensure_ascii=False)


def yaml_list(values: Any) -> str:
    items = [value for value in values if value is not None and value != ""] if isinstance(values, list) else []
    return f"[{', '.join(yaml_scalar(item) for item in items)}]" if items else "[]"


def yaml_key(key: Any) -> str:
    text = str(key)
    return text if re.fullmatch(r"[A-Za-z0-9_-]+", text) else json.dumps(text, ensure_ascii=False)


def yaml_block(value: Any, indent: int = 0) -> str:
    pad = " " * indent
    if value is None or value == "":
        return ""
    if not isinstance(value, (dict, list)):
        return yaml_scalar(value)

    if isinstance(value, list):
        items = [item for item in value if item is not None and item != ""]
        if not items:
            return "[]"
        if all(not isinstance(item, (dict, list)) for item in items):
            return yaml_list(items)
        lines: list[str] = []
        for item in items:
            if not isinstance(item, dict):
                lines.append(f"{pad}- {yaml_scalar(item)}")
                continue
            entries = [(key, val) for key, val in item.items() if val is not None and val != ""]
            if not entries:
                lines.append(f"{pad}- {{}}")
                continue
            item_lines: list[str] = []
            for index, (key, val) in enumerate(entries):
                prefix = f"{pad}- {yaml_key(key)}:" if index == 0 else f"{pad}  {yaml_key(key)}:"
                if isinstance(val, (dict, list)):
                    rendered = yaml_block(val, indent + 4)
                    item_lines.append(f"{prefix}{rendered}" if rendered.startswith("\n") else f"{prefix} {rendered}")
                else:
                    item_lines.append(f"{prefix} {yaml_scalar(val)}")
            lines.append("\n".join(item_lines))
        return "\n" + "\n".join(lines)

    entries = [(key, val) for key, val in value.items() if val is not None and val != ""]
    if not entries:
        return "{}"
    lines = []
    for key, val in entries:
        prefix = f"{pad}{yaml_key(key)}:"
        if isinstance(val, (dict, list)):
            rendered = yaml_block(val, indent + 2)
            lines.append(f"{prefix}{rendered}" if rendered.startswith("\n") else f"{prefix} {rendered}")
        else:
            lines.append(f"{prefix} {yaml_scalar(val)}")
    return "\n" + "\n".join(lines)


def frontmatter(fields: dict[str, Any]) -> str:
    lines = ["---"]
    for key, value in fields.items():
        indent = 2 if isinstance(value, dict) else 0
        rendered = yaml_block(value, indent)
        lines.append(f"{key}:" if rendered == "" else f"{key}: {rendered}")
    lines.extend(["---", ""])
    return "\n".join(lines)


def paragraph(value: Any) -> str:
    return re.sub(r"\n{3,}", "\n\n", str(value or "").strip())


def table_from_rows(rows: Any) -> str:
    if not isinstance(rows, list) or not rows:
        return ""
    headers = list(rows[0].keys())

    def escape_cell(value: Any) -> str:
        return str(value or "").replace("\n", "<br>").replace("|", "\\|")

    return "\n".join(
        [
            f"| {' | '.join(headers)} |",
            f"| {' | '.join('---' for _ in headers)} |",
            *[f"| {' | '.join(escape_cell(row.get(header)) for header in headers)} |" for row in rows],
        ]
    )


def sections_to_markdown(item: dict[str, Any], sections: Any = None) -> str:
    rendered_sections: list[str] = []
    for section in sections if isinstance(sections, list) else []:
        title = f"## {section.get('titolo')}\n\n" if section.get("titolo") else ""
        if isinstance(section.get("righe"), list):
            rendered_sections.append(f"{title}{table_from_rows(section.get('righe'))}\n^{block_id(item, section.get('titolo') or 'tabella')}")
        elif isinstance(section.get("blocchi"), list):
            blocks = "\n\n".join(
                f"### {block.get('nome')}\n\n{paragraph(block.get('descrizione'))}\n^{block_id(item, block.get('nome'))}"
                for block in section.get("blocchi")
            )
            rendered_sections.append(f"{title}{blocks}")
        elif section.get("descrizione"):
            rendered_sections.append(f"{title}{paragraph(section.get('descrizione'))}")
        else:
            rendered_sections.append(title.strip())
    return "\n\n".join(section for section in rendered_sections if section)


def named_blocks(item: dict[str, Any], title: str, blocks: Any) -> str:
    if not isinstance(blocks, list) or not blocks:
        return ""
    body = "\n\n".join(
        f"### {block.get('nome')}\n\n{paragraph(block.get('descrizione'))}\n^{block_id(item, block.get('nome'))}"
        for block in blocks
    )
    return f"## {title}\n\n{body}"


def stat_table(monster: dict[str, Any]) -> str:
    c = monster.get("caratteristiche") or {}
    rows = [
        ("Forza", c.get("forza")),
        ("Destrezza", c.get("destrezza")),
        ("Costituzione", c.get("costituzione")),
        ("Intelligenza", c.get("intelligenza")),
        ("Saggezza", c.get("saggezza")),
        ("Carisma", c.get("carisma")),
    ]
    return table_from_rows(
        [
            {
                "Caratteristica": name,
                "Punteggio": (stat or {}).get("punteggio", ""),
                "Modificatore": (stat or {}).get("modificatore", ""),
                "Tiro Salvezza": (stat or {}).get("tiro_salvezza", ""),
            }
            for name, stat in rows
        ]
    )


def speed_text(speed: Any = None) -> str:
    if isinstance(speed, str):
        return speed
    if isinstance(speed, dict):
        return ", ".join(f"{key}: {value}" for key, value in speed.items())
    return ""


def object_text(value: Any) -> str:
    if not value:
        return ""
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    if isinstance(value, dict):
        return ", ".join(f"{key}: {val}" for key, val in value.items())
    return str(value)


def stat_array(monster: dict[str, Any]) -> list[Any]:
    c = monster.get("caratteristiche") or {}
    return [
        (c.get("forza") or {}).get("punteggio", 10),
        (c.get("destrezza") or {}).get("punteggio", 10),
        (c.get("costituzione") or {}).get("punteggio", 10),
        (c.get("intelligenza") or {}).get("punteggio", 10),
        (c.get("saggezza") or {}).get("punteggio", 10),
        (c.get("carisma") or {}).get("punteggio", 10),
    ]


def save_object(monster: dict[str, Any]) -> dict[str, Any]:
    c = monster.get("caratteristiche") or {}
    saves: dict[str, Any] = {}
    for key, stat in [
        ("str", c.get("forza")),
        ("dex", c.get("destrezza")),
        ("con", c.get("costituzione")),
        ("int", c.get("intelligenza")),
        ("wis", c.get("saggezza")),
        ("cha", c.get("carisma")),
    ]:
        if isinstance(stat, dict) and stat.get("tiro_salvezza") is not None and stat.get("tiro_salvezza") != stat.get("modificatore"):
            saves[key] = stat.get("tiro_salvezza")
    return saves


def statblock_blocks(blocks: Any) -> list[dict[str, str]]:
    if not isinstance(blocks, list):
        return []
    rendered = [{"name": block.get("nome"), "desc": paragraph(block.get("descrizione"))} for block in blocks if isinstance(block, dict)]
    return [block for block in rendered if block.get("name") or block.get("desc")]


def srd_tags(tipo: str) -> list[str]:
    tags = ["dnd55/srd"]
    if tipo == "incantesimo":
        tags.append("dnd55/incantesimo")
    if tipo == "mostro":
        tags.append("dnd55/creatura")
    if tipo == "oggetto magico":
        tags.append("dnd55/oggetto-magico")
    if tipo in {"regola", "glossario"}:
        tags.append("dnd55/regola")
    return tags


def section_links(item: dict[str, Any], tipo: str) -> list[str]:
    target = srd_target(item, tipo)
    return [wikilink(f"{target}#{section.get('titolo')}") for section in item.get("sezioni") or [] if section.get("titolo")]


def table_links(item: dict[str, Any], tipo: str) -> list[str]:
    target = srd_target(item, tipo)
    return [
        wikilink(f"{target}#^{block_id(item, section.get('titolo') or 'tabella')}")
        for section in item.get("sezioni") or []
        if isinstance(section.get("righe"), list) and section.get("righe")
    ]


def content_block_links(item: dict[str, Any], tipo: str, groups: list[Any]) -> list[str]:
    target = srd_target(item, tipo)
    links: list[str] = []
    for group in groups:
        for block in group or []:
            if isinstance(block, dict) and block.get("nome"):
                links.append(wikilink(f"{target}#^{block_id(item, block.get('nome'))}"))
    return links


def base_fields(item: dict[str, Any], tipo: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    riferimenti = [wikilink(srd_target(item, tipo))]
    fields = {
        "id": f"srd-{item.get('id')}",
        "srd_id": item.get("id"),
        "nome": item.get("nome"),
        "categoria": "srd",
        "tipo": tipo,
        "stato": "pronto",
        "canonico": False,
        "fonte": f"SRD {VERSION}",
        "licenza": "CC-BY-4.0",
        "repository": SOURCE_REPOSITORY,
        "repository_ref": SOURCE_REF,
        "generato_da": GENERATED_BY,
        "fonti": [wikilink("SRD/Licenza SRD"), *riferimenti],
        "riferimenti_srd": riferimenti,
        "riferimenti_regola": [],
        "sezioni_collegate": section_links(item, tipo),
        "blocchi_collegati": [],
        "tabelle_collegate": table_links(item, tipo),
        "tags": srd_tags(tipo),
    }
    fields.update(extra or {})
    return fields


def attribution() -> str:
    return "> [!info] Licenza\n> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0."


def render_background(item: dict[str, Any]) -> str:
    competenze = item.get("competenze") or {}
    fields = base_fields(
        item,
        "background",
        {
            "capitolo": item.get("capitolo"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "punteggi_caratteristica": item.get("punteggi_caratteristica") or [],
            "talento_origine": item.get("talento_origine"),
            "competenze_abilita": competenze.get("abilita") or [],
            "competenze_strumenti": competenze.get("strumenti"),
            "equipaggiamento_alternativo": item.get("equipaggiamento_alternativo"),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Background\n> Caratteristiche: {', '.join(item.get('punteggi_caratteristica') or [])}\n> Talento: {item.get('talento_origine') or ''}\n> Equipaggiamento alternativo: {item.get('equipaggiamento_alternativo') or ''}",
            paragraph(item.get("descrizione")),
            sections_to_markdown(item, item.get("sezioni")),
            attribution(),
        ]
        if part
    )


def render_class(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "classe",
        {
            "capitolo": item.get("capitolo"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "caratteristica_primaria": item.get("caratteristica_primaria") or [],
            "dado_vita": item.get("dado_vita"),
            "tiri_salvezza": item.get("tiri_salvezza") or [],
        },
    )
    competenze = (
        "## Competenze\n\n" + "\n".join(f"- **{key}**: {value}" for key, value in item.get("competenze").items())
        if isinstance(item.get("competenze"), dict)
        else ""
    )
    sottoclasse = item.get("sottoclasse_srd") or {}
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            paragraph(item.get("descrizione")),
            competenze,
            f"## Equipaggiamento Iniziale\n\n{paragraph(item.get('equipaggiamento_iniziale'))}" if item.get("equipaggiamento_iniziale") else "",
            sections_to_markdown(item, item.get("sezioni")),
            f"## Progressione\n\n{table_from_rows(item.get('progressione'))}" if isinstance(item.get("progressione"), list) else "",
            f"## Sottoclasse SRD\n\n{sottoclasse.get('nome')}" if sottoclasse.get("nome") else "",
            attribution(),
        ]
        if part
    )


def render_equipment(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "equipaggiamento",
        {
            "capitolo": item.get("capitolo"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "tipo_oggetto": item.get("tipo"),
            "categoria_oggetto": item.get("categoria"),
            "costo": item.get("costo"),
            "peso": item.get("peso"),
            "danni": item.get("danni"),
            "proprieta": item.get("proprieta") or [],
            "padronanza": item.get("padronanza"),
            "classe_armatura": item.get("classe_armatura"),
            "forza": item.get("forza"),
            "furtivita": item.get("furtivita"),
            "velocita": item.get("velocita"),
            "punti_ferita": item.get("punti_ferita"),
            "soglia_danno": item.get("soglia_danno"),
            "valore_in_mo": item.get("valore_in_mo"),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Equipaggiamento\n> Tipo: {item.get('tipo') or ''}\n> Categoria: {item.get('categoria') or ''}\n> Costo: {item.get('costo') or ''}\n> Peso: {item.get('peso') or ''}",
            paragraph(item.get("descrizione")),
            sections_to_markdown(item, item.get("sezioni")),
            attribution(),
        ]
        if part
    )


def render_feat(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "talento",
        {
            "capitolo": item.get("capitolo"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "categoria_talento": item.get("categoria"),
            "prerequisito": item.get("prerequisito"),
            "ripetibile": item.get("ripetibile"),
            "beneficio": item.get("beneficio"),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Talento\n> Categoria: {item.get('categoria') or ''}\n> Prerequisito: {item.get('prerequisito') or ''}\n> Ripetibile: {'si' if item.get('ripetibile') else 'no'}",
            paragraph(item.get("descrizione")),
            sections_to_markdown(item, item.get("sezioni")),
            attribution(),
        ]
        if part
    )


def render_language(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "lingua",
        {
            "capitolo": item.get("capitolo"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "categoria_lingua": item.get("categoria"),
            "tiro_casuale": item.get("tiro_casuale"),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Lingua\n> Categoria: {item.get('categoria') or ''}\n> Tiro casuale: {item.get('tiro_casuale') or ''}",
            paragraph(item.get("descrizione")),
            sections_to_markdown(item, item.get("sezioni")),
            attribution(),
        ]
        if part
    )


def render_spell(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "incantesimo",
        {
            "livello": item.get("livello"),
            "scuola": item.get("scuola"),
            "classi": item.get("classi") or [],
            "tempo_lancio": item.get("tempo_lancio"),
            "gittata": item.get("gittata"),
            "componenti": item.get("componenti"),
            "durata": item.get("durata"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "blocchi_collegati": content_block_links(item, "incantesimo", [item.get("scaling")]),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Incantesimo\n> Livello: {item.get('livello')}\n> Scuola: {item.get('scuola')}\n> Tempo di lancio: {item.get('tempo_lancio')}\n> Gittata: {item.get('gittata')}\n> Componenti: {item.get('componenti')}\n> Durata: {item.get('durata')}",
            paragraph(item.get("descrizione")),
            named_blocks(item, "Slot Di Livello Superiore", item.get("scaling")),
            attribution(),
        ]
        if part
    )


def render_species(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "specie",
        {
            "capitolo": item.get("capitolo"),
            "pagine_sorgente": item.get("pagine_sorgente"),
            "tipo_creatura": item.get("tipo_creatura"),
            "taglia": item.get("taglia"),
            "velocita": item.get("velocita"),
            "tratti_sintesi": item.get("tratti_sintesi"),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Specie\n> Tipo creatura: {item.get('tipo_creatura') or ''}\n> Taglia: {item.get('taglia') or ''}\n> Velocita: {item.get('velocita') or ''}",
            paragraph(item.get("descrizione")),
            sections_to_markdown(item, item.get("sezioni")),
            attribution(),
        ]
        if part
    )


def render_legendary(item: dict[str, Any], legendary: dict[str, Any]) -> str:
    return "\n\n".join(
        part
        for part in [
            "## Azioni Leggendarie",
            paragraph(legendary.get("descrizione_utilizzi")),
            named_blocks(item, "Opzioni", legendary.get("azioni")),
        ]
        if part
    )


def render_monster(item: dict[str, Any]) -> str:
    cr = item.get("grado_sfida") or {}
    hp = item.get("punti_ferita") or {}
    init = item.get("iniziativa") or {}
    legendary = item.get("azioni_leggendarie") if isinstance(item.get("azioni_leggendarie"), dict) else {}
    fields = base_fields(
        item,
        "mostro",
        {
            "name": item.get("nome"),
            "type": item.get("tipo"),
            "size": str(item.get("dimensione") or "").lower(),
            "alignment": item.get("allineamento"),
            "ac": item.get("classe_armatura"),
            "stats": stat_array(item),
            "saves": save_object(item),
            "skillsaves": item.get("abilita") or {},
            "damage_vulnerabilities": "",
            "damage_resistances": "",
            "damage_immunities": "",
            "condition_immunities": "",
            "senses": object_text(item.get("sensi")),
            "languages": ", ".join(item.get("lingue")) if isinstance(item.get("lingue"), list) else item.get("lingue"),
            "cr": cr.get("valore"),
            "traits": statblock_blocks(item.get("tratti")),
            "actions": statblock_blocks(item.get("azioni")),
            "bonus_actions": statblock_blocks(item.get("azioni_bonus")),
            "reactions": statblock_blocks(item.get("reazioni")),
            "legendary_actions": statblock_blocks(legendary.get("azioni")),
            "lair_actions": statblock_blocks(item.get("azioni_tana")),
            "tipo_creatura": item.get("tipo"),
            "dimensione": item.get("dimensione"),
            "allineamento": item.get("allineamento"),
            "classe_armatura": item.get("classe_armatura"),
            "iniziativa": init.get("bonus") or init.get("valore") or "",
            "hp": hp.get("media"),
            "hit_dice": hp.get("formula"),
            "speed": speed_text(item.get("velocita")),
            "xp": cr.get("punti_esperienza"),
            "bonus_competenza": item.get("bonus_competenza"),
            "statblock": True,
            "blocchi_collegati": content_block_links(
                item,
                "mostro",
                [
                    item.get("tratti"),
                    item.get("azioni"),
                    item.get("azioni_bonus"),
                    item.get("reazioni"),
                    legendary.get("azioni"),
                    item.get("azioni_tana"),
                ],
            ),
        },
    )
    tabs = "\n".join(
        part
        for part in [
            "````tabs",
            "tab: Scheda",
            "",
            f"```statblock\nmonster: {item.get('nome')}\n```",
            "",
            "tab: Dettagli",
            "",
            f"> [!infobox|wiki]- Mostro SRD\n> Tipo: {item.get('dimensione')} {item.get('tipo')}, {item.get('allineamento')}\n> CA: {item.get('classe_armatura')}\n> PF: {hp.get('media') or ''} ({hp.get('formula') or ''})\n> Velocita: {speed_text(item.get('velocita'))}\n> GS: {cr.get('raw') or cr.get('valore') or ''}",
            "## Caratteristiche",
            stat_table(item),
            f"## Abilita\n\n{object_text(item.get('abilita'))}" if item.get("abilita") else "",
            f"## Sensi\n\n{object_text(item.get('sensi'))}" if item.get("sensi") else "",
            f"## Lingue\n\n{', '.join(item.get('lingue'))}" if isinstance(item.get("lingue"), list) and item.get("lingue") else "",
            "",
            "tab: Azioni",
            "",
            named_blocks(item, "Tratti", item.get("tratti")),
            named_blocks(item, "Azioni", item.get("azioni")),
            render_legendary(item, legendary) if legendary else "",
            "````",
        ]
        if part
    )
    return frontmatter(fields) + "\n\n".join(part for part in [f"# {item.get('nome')}", tabs, attribution()] if part)


def render_magic_item(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "oggetto magico",
        {
            "tipo_oggetto": item.get("tipo"),
            "tipo_base": item.get("tipo_base"),
            "rarita": item.get("rarita"),
            "richiede_sintonia": item.get("richiede_sintonia"),
        },
    )
    return frontmatter(fields) + "\n\n".join(
        part
        for part in [
            f"# {item.get('nome')}",
            f"> [!infobox|wiki]- Oggetto Magico\n> Tipo: {item.get('tipo')}\n> Rarita: {item.get('rarita')}\n> Sintonia: {'si' if item.get('richiede_sintonia') else 'no'}",
            paragraph(item.get("descrizione")),
            sections_to_markdown(item, item.get("sezioni")),
            attribution(),
        ]
        if part
    )


def render_rule(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "regola",
        {"capitolo": item.get("capitolo"), "categoria_regola": item.get("categoria"), "pagine_sorgente": item.get("pagine_sorgente")},
    )
    return frontmatter(fields) + "\n\n".join(
        part for part in [f"# {item.get('nome')}", paragraph(item.get("descrizione")), sections_to_markdown(item, item.get("sezioni")), attribution()] if part
    )


def render_glossary(item: dict[str, Any]) -> str:
    fields = base_fields(
        item,
        "glossario",
        {"lettera": item.get("lettera"), "descrittore": item.get("descrittore"), "pagine_sorgente": item.get("pagine_sorgente")},
    )
    return frontmatter(fields) + "\n\n".join(
        part for part in [f"# {item.get('nome')}", paragraph(item.get("descrizione")), sections_to_markdown(item, item.get("sezioni")), attribution()] if part
    )


RENDERERS = {
    "backgrounds": render_background,
    "classes": render_class,
    "equipment": render_equipment,
    "feats": render_feat,
    "languages": render_language,
    "spells": render_spell,
    "monsters": render_monster,
    "magic_items": render_magic_item,
    "rules": render_rule,
    "rules_glossary": render_glossary,
    "species": render_species,
}


def fetch_json(source: dict[str, str]) -> list[dict[str, Any]]:
    url = f"{REPO_RAW}/{BASE}/{source['file']}"
    request = urllib.request.Request(url, headers={"User-Agent": "vault-gdr-import-srd"})
    try:
        with urllib.request.urlopen(request, timeout=60, context=ssl_context()) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Impossibile scaricare {url}: {error.code}") from error


def write_index(source: dict[str, str], count: int) -> None:
    file = OUT / source["dir"] / f"{source['dir']}.md"
    content = "\n".join(
        [
            "---",
            "cssclasses: [indice]",
            "categoria: srd",
            f"tipo: indice {source['tipo']}",
            f'fonte: "SRD {VERSION}"',
            "licenza: CC-BY-4.0",
            f"generato_da: {GENERATED_BY}",
            "---",
            "",
            f"# {source['title']}",
            "",
            f"Totale note generate: {count}.",
            "",
            "```dataview",
            "TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore",
            f'FROM "SRD/{source["dir"]}"',
            f'WHERE file.name != "{source["dir"]}"',
            "SORT nome ASC",
            "```",
        ]
    )
    write_generated_file(file, content)


def write_root_index(counts: dict[str, int]) -> None:
    rows = "\n".join(f"| [[SRD/{source['dir']}/{source['dir']}|{source['title']}]] | {counts.get(source['key'], 0)} |" for source in SOURCES)
    content = "\n".join(
        [
            "---",
            "cssclasses: [indice]",
            "categoria: srd",
            "tipo: indice",
            f'fonte: "SRD {VERSION}"',
            "licenza: CC-BY-4.0",
            f"generato_da: {GENERATED_BY}",
            "---",
            "",
            "# SRD",
            "",
            f"Archivio separato di note generate dalla fork [{SOURCE_REPOSITORY}]({SOURCE_TREE_URL}) del System Reference Document 5.2.1 in italiano.",
            "",
            "| Sezione | Note |",
            "| --- | ---: |",
            rows,
            "",
            "## Attribuzione",
            "",
            "Quest'opera include materiale tratto dal System Reference Document 5.2.1 (\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile all'indirizzo https://www.dndbeyond.com/srd. Il SRD 5.2.1 e concesso in licenza ai sensi della licenza di attribuzione 4.0 Internazionale di Creative Commons, disponibile all'indirizzo https://creativecommons.org/licenses/by/4.0/legalcode.",
            "",
            "Vedi anche [[SRD/Licenza SRD]].",
            "",
            "## Note",
            "",
            f"- Sorgente SRD pinnata: {SOURCE_REPOSITORY}@{SOURCE_REF}.",
            "- Le note SRD non sono contenuto canonico del mondo.",
            "- Usa link verso queste note come riferimento regolamentare.",
            "- Se modifichi una nota generata, rimuovi o cambia `generato_da` prima di rigenerare.",
        ]
    )
    write_generated_file(OUT / "SRD.md", content)


def write_license_note() -> None:
    content = "\n".join(
        [
            "---",
            "cssclasses: [indice]",
            "categoria: srd",
            "tipo: licenza",
            f'fonte: "SRD {VERSION}"',
            "licenza: CC-BY-4.0",
            f"generato_da: {GENERATED_BY}",
            "---",
            "",
            "# Licenza SRD",
            "",
            "Il System Reference Document 5.2.1 (\"SRD 5.2.1\") e fornito gratuitamente da Wizards of the Coast LLC (\"Wizards\") in base ai termini della licenza di attribuzione 4.0 Internazionale di Creative Commons (\"CC-BY-4.0\").",
            "",
            "Quest'opera include materiale tratto dal System Reference Document 5.2.1 (\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile all'indirizzo https://www.dndbeyond.com/srd. Il SRD 5.2.1 e concesso in licenza ai sensi della licenza di attribuzione 4.0 Internazionale di Creative Commons, disponibile all'indirizzo https://creativecommons.org/licenses/by/4.0/legalcode.",
            "",
            "Non includere altre attribuzioni a Wizards o alla sua societa madre o alle sue affiliate diverse da quella sopra indicata. Puoi pero includere una dichiarazione sulla tua opera che indichi che essa e \"compatibile con la quinta edizione\" o \"compatibile con 5E\".",
            "",
            f"La repo sorgente e [{SOURCE_REPOSITORY}]({SOURCE_TREE_URL}), pinnata al commit `{SOURCE_REF}`.",
        ]
    )
    write_generated_file(OUT / "Licenza SRD.md", content)


def main() -> int:
    validate_source_pin()
    ensure_dir(OUT)
    counts: dict[str, int] = {}

    for source in SOURCES:
        data = fetch_json(source)
        directory = OUT / source["dir"]
        ensure_dir(directory)
        render = RENDERERS[source["key"]]
        for item in data:
            filename = f"{slugify(item.get('nome') or item.get('id'))}.md"
            write_generated_file(directory / filename, render(item))
        counts[source["key"]] = len(data)
        write_index(source, len(data))
        print(f"{source['title']}: {len(data)}")

    write_root_index(counts)
    write_license_note()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
