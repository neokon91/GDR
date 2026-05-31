#!/usr/bin/env python3
"""Generazione dell'albero SRD/ (sola lettura) dai JSON italiani vendorizzati in
Dev/Source/SRD/. Estratto da render.py: l'orchestratore chiama build_srd(core)."""

from __future__ import annotations

import json
import re
from typing import Any

import yaml

from common import SRD_DIR, VAULT, frontmatter_block, write_text

# --- SRD 5.2.1 (CC-BY-4.0), traduzione italiana ----------------------------
# I JSON tipizzati vendorizzati in Dev/Source/SRD/ (da github massimobarbieri/
# DND-SRD-IT) sono generati in note per-voce in un albero di SOLA LETTURA SRD/,
# separato dall'homebrew. I mostri diventano statblock Fantasy Statblocks.
# Config: { json, dest (sottocartella), cat (categoria), fm (campi -> frontmatter) }.
SRD_GEN = [
    {"json": "srd_5_2_1_spells.json",      "dest": "Incantesimi",     "cat": "srd-incantesimo", "fm": ["livello", "scuola", "classi", "tempo_lancio", "gittata", "componenti", "durata"]},
    {"json": "srd_5_2_1_magic_items.json", "dest": "Oggetti",         "cat": "srd-oggetto",     "fm": ["tipo_base", "rarita", "richiede_sintonia"]},
    {"json": "srd_5_2_1_feats.json",       "dest": "Talenti",         "cat": "srd-talento",     "fm": ["categoria", "prerequisito", "ripetibile"]},
    {"json": "srd_5_2_1_species.json",     "dest": "Specie",          "cat": "srd-specie",      "fm": ["tipo_creatura", "taglia", "velocita"]},
    {"json": "srd_5_2_1_backgrounds.json", "dest": "Background",      "cat": "srd-background",  "fm": ["talento_origine"]},
    {"json": "srd_5_2_1_languages.json",   "dest": "Lingue",          "cat": "srd-lingua",      "fm": []},
    {"json": "srd_5_2_1_equipment.json",   "dest": "Equipaggiamento", "cat": "srd-equipaggiamento", "fm": []},
    {"json": "srd_5_2_1_rules.json",       "dest": "Regole",          "cat": "srd-regola",      "fm": []},
    {"json": "srd_5_2_1_classes.json",     "dest": "Classi",          "cat": "srd-classe",      "fm": []},
]

SRD_ATTRIBUTION = (
    "Quest'opera include materiale tratto dal **System Reference Document 5.2.1** "
    "(\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd. "
    "Il SRD 5.2.1 è concesso in licenza ai sensi della "
    "[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode). "
    "Traduzione italiana: [massimobarbieri/DND-SRD-IT](https://github.com/massimobarbieri/DND-SRD-IT)."
)


def srd_slug(name: str) -> str:
    """Nome file leggibile e sicuro per Obsidian (toglie i caratteri vietati)."""
    cleaned = re.sub(r'[\\/:*?"<>|#\[\]^]', "", str(name)).strip()
    return cleaned or "voce"


def load_srd(name: str) -> list[dict[str, Any]]:
    path = SRD_DIR / name
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def _join(value: Any) -> str:
    return ", ".join(str(v) for v in value) if isinstance(value, list) else str(value or "")


def _blocchi(blocchi: list[Any]) -> str:
    """Sotto-blocchi di una sezione ({nome, descrizione}) -> paragrafi in grassetto.
    È qui che vivono effetti condizioni, tratti di specie, privilegi di classe."""
    out: list[str] = []
    for b in blocchi or []:
        if not isinstance(b, dict):
            continue
        nome = str(b.get("nome", "")).strip()
        desc = str(b.get("descrizione", "")).strip()
        if nome and desc:
            out.append(f"**{nome}** — {desc}")
        elif nome or desc:
            out.append(nome or desc)
    return "\n\n".join(out)


def _cell(value: Any) -> str:
    """Cella di tabella markdown: niente a-capo, pipe escappate."""
    return re.sub(r"\s*\n\s*", " ", str(value if value is not None else "")).replace("|", "\\|").strip()


def _righe(righe: list[Any]) -> str:
    """Righe tabellari (list di dict) -> tabella markdown. È qui che vivono le
    tabelle di progressione classe, i lignaggi di specie, i risultati spell."""
    rows = [r for r in righe or [] if isinstance(r, dict)]
    if not rows:
        return ""
    cols: list[str] = []
    for row in rows:
        for key in row:
            if key not in cols:
                cols.append(key)
    head = "| " + " | ".join(cols) + " |"
    sep = "|" + "|".join(["---"] * len(cols)) + "|"
    body = "\n".join("| " + " | ".join(_cell(row.get(c)) for c in cols) + " |" for row in rows)
    return f"{head}\n{sep}\n{body}"


def srd_header(entry: dict[str, Any], cat: str) -> str:
    """Infobox (callout) coi dati salienti, su misura per categoria. '' se nessuno."""
    def parts(*pairs):
        return " · ".join(f"**{lab}** {entry.get(k)}" for lab, k in pairs if entry.get(k))
    if cat == "srd-incantesimo":
        liv = str(entry.get("livello", ""))
        testa = f"Trucchetto · {entry.get('scuola', '')}" if liv in ("0", "") else f"Livello {liv} · {entry.get('scuola', '')}"
        righe = [f"> [!abstract] {testa}"]
        mecc = parts(("Lancio", "tempo_lancio"), ("Gittata", "gittata"), ("Componenti", "componenti"), ("Durata", "durata"))
        if mecc:
            righe.append(f"> {mecc}")
        if entry.get("classi"):
            righe.append(f"> **Classi** {_join(entry['classi'])}")
        return "\n".join(righe)
    if cat == "srd-oggetto":
        sint = entry.get("richiede_sintonia")
        extra = " · richiede sintonia" if sint and sint not in (False, "no", "No", "") else ""
        testa = " · ".join(x for x in (entry.get("tipo_base", ""), str(entry.get("rarita", "") or "")) if x)
        return f"> [!abstract] {testa}{extra}" if testa or extra else ""
    if cat == "srd-talento":
        line = f"> [!abstract] Talento{(' · ' + str(entry.get('categoria'))) if entry.get('categoria') else ''}"
        if entry.get("prerequisito"):
            line += f"\n> **Prerequisito** {entry['prerequisito']}"
        return line
    if cat == "srd-specie":
        return f"> [!abstract] {entry.get('tipo_creatura', '')} · Taglia {entry.get('taglia', '')} · Velocità {entry.get('velocita', '')}"
    if cat == "srd-background" and entry.get("talento_origine"):
        return f"> [!abstract] Background · Talento d'origine: {entry['talento_origine']}"
    if cat == "srd-condizione":
        return "> [!warning] Condizione"
    return ""


def srd_note(entry: dict[str, Any], cat: str, fm_fields: list[str]) -> str:
    fm: dict[str, Any] = {"nome": entry.get("nome", ""), "categoria": cat, "srd": True, "fonte": "SRD 5.2.1"}
    for key in fm_fields:
        val = entry.get(key)
        if isinstance(val, (str, int, float, bool)) and val != "":
            fm[key] = val
        elif isinstance(val, list) and val:
            fm[key] = val
    parts: list[str] = [f"# {entry.get('nome', '')}"]
    header = srd_header(entry, cat)
    if header:
        parts.append(header)
    for key in ("descrizione", "beneficio"):
        if isinstance(entry.get(key), str) and entry[key].strip():
            parts.append(entry[key].strip())
    for sez in entry.get("sezioni") or []:
        if not isinstance(sez, dict):
            continue
        blocco: list[str] = []
        if sez.get("titolo"):
            blocco.append(f"### {sez['titolo']}")
        if str(sez.get("descrizione") or "").strip():
            blocco.append(sez["descrizione"].strip())
        if sez.get("blocchi"):
            blocco.append(_blocchi(sez["blocchi"]))
        if sez.get("righe"):
            blocco.append(_righe(sez["righe"]))
        contenuto = [b for b in blocco if b]
        # Salta le sezioni col solo titolo (niente heading vuoti).
        if contenuto and not (len(contenuto) == 1 and sez.get("titolo")):
            parts.append("\n\n".join(contenuto))
    scaling = [s for s in (entry.get("scaling") or []) if isinstance(s, dict)]
    if scaling:
        body = "\n>\n".join(f"> **{s.get('nome', '')}** — {s.get('descrizione', '')}" for s in scaling)
        parts.append(f"> [!tip]- Potenziamento\n{body}")
    return frontmatter_block(fm) + "\n\n".join(parts) + "\n"


def srd_statblock_yaml(monster: dict[str, Any], layout: str) -> str:
    """Mappa un mostro JSON IT sul formato statblock di Fantasy Statblocks."""
    car = monster.get("caratteristiche", {}) or {}
    order = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"]
    hp = monster.get("punti_ferita", {}) or {}
    cr = monster.get("grado_sfida", {}) or {}
    vel = monster.get("velocita", {}) or {}
    sensi = monster.get("sensi", {}) or {}
    lingue = monster.get("lingue", [])

    def actions(key: str) -> list[dict[str, str]]:
        return [{"name": a.get("nome", ""), "desc": a.get("descrizione", "")}
                for a in (monster.get(key) or []) if isinstance(a, dict)]

    sb = {
        "layout": layout,
        "name": monster.get("nome", ""),
        "size": monster.get("dimensione", ""),
        "type": monster.get("tipo", ""),
        "alignment": monster.get("allineamento", ""),
        "ac": monster.get("classe_armatura", ""),
        "hp": hp.get("media", "") if isinstance(hp, dict) else hp,
        "hit_dice": hp.get("formula", "") if isinstance(hp, dict) else "",
        "speed": ", ".join(str(v) if t == "camminata" else f"{t} {v}" for t, v in vel.items()) if isinstance(vel, dict) else str(vel),
        "stats": [int((car.get(k) or {}).get("punteggio", 10)) for k in order],
        "senses": ", ".join(f"{t.replace('_', ' ')} {v}" for t, v in sensi.items()) if isinstance(sensi, dict) else str(sensi),
        "languages": ", ".join(lingue) if isinstance(lingue, list) else str(lingue),
        "cr": str(cr.get("valore", "")) if isinstance(cr, dict) else str(cr),
        "traits": actions("tratti"),
        "actions": actions("azioni"),
        "legendary_actions": actions("azioni_leggendarie"),
    }
    return yaml.safe_dump(sb, allow_unicode=True, sort_keys=False)


def build_srd(core: dict[str, Any]) -> int:
    """Genera l'albero SRD/ (sola lettura) dai JSON IT vendorizzati. Ritorna il
    numero di note scritte. Cartella sorgente assente -> 0 (SRD opzionale)."""
    if not SRD_DIR.is_dir():
        return 0
    write_text(VAULT / "SRD" / "LICENZA.md", f"# Licenza SRD\n\n{SRD_ATTRIBUTION}\n")
    written = 0
    for spec in SRD_GEN:
        for entry in load_srd(spec["json"]):
            write_text(VAULT / "SRD" / spec["dest"] / f"{srd_slug(entry.get('nome'))}.md",
                       srd_note(entry, spec["cat"], spec["fm"]))
            written += 1
    # Glossario: condizioni in una cartella dedicata, il resto in Glossario.
    for entry in load_srd("srd_5_2_1_rules_glossary.json"):
        cond = entry.get("descrittore") == "condizione"
        dest, cat = ("Condizioni", "srd-condizione") if cond else ("Glossario", "srd-glossario")
        write_text(VAULT / "SRD" / dest / f"{srd_slug(entry.get('nome'))}.md",
                   srd_note(entry, cat, ["descrittore"]))
        written += 1
    # Mostri -> statblock (statblock: inline => entra nel bestiario di Fantasy Statblocks).
    layout = (core.get("statblock", {}) or {}).get("layout", "Basic 5e Layout")
    for monster in load_srd("srd_5_2_1_monsters.json"):
        fm = {"nome": monster.get("nome", ""), "categoria": "srd-mostro", "srd": True,
              "fonte": "SRD 5.2.1", "statblock": "inline"}
        content = frontmatter_block(fm) + f"# {monster.get('nome', '')}\n\n```statblock\n{srd_statblock_yaml(monster, layout)}```\n"
        write_text(VAULT / "SRD" / "Mostri" / f"{srd_slug(monster.get('nome'))}.md", content)
        written += 1
    index = (
        "# 📚 SRD 5.2.1 (italiano)\n\n"
        "Riferimento ufficiale 5.5e in italiano, **sola lettura**: si rigenera a ogni build, "
        "non modificarlo (il tuo homebrew va in `Mondi/`). I mostri sono statblock e popolano "
        "il bestiario di Fantasy Statblocks (richiamabili con `monster: Nome`).\n\n"
        f"> [!quote]- Licenza\n> {SRD_ATTRIBUTION}\n\n"
        "## Contenuto\n"
        '```dataview\ntable without id length(rows) as Voci\nfrom "SRD"\n'
        "where srd\ngroup by categoria as Categoria\nsort Categoria asc\n```\n"
    )
    write_text(VAULT / "SRD" / "Indice.md", index)
    return written
