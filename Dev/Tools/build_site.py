#!/usr/bin/env python3
"""Esportatore «sito dei giocatori»: dal vault Obsidian (dist/GDR-vault) genera un
sito statico HTML *spoiler-free* e *read-only* in dist/GDR-site — pubblicabile su
GitHub Pages/Netlify o aperto in locale (index.html). Risponde al gap competitivo
#1 (condivisione coi giocatori) aggirando il limite di Obsidian Publish, che NON
rende i plugin dinamici (Dataview/Meta Bind/JS Engine) su cui poggia il vault.

Modello di contenuto unificato (regge sia note autoriali sia note-esempio):
- le note da template tengono la prosa nel FRONTMATTER (campi `creation.body` con
  `heading`); i `callout: segreto` e i campi «Al tavolo» (uso_al_tavolo/gancio/
  pressione/conseguenza, che sono macro condivise NON in creation.body) restano
  esclusi per costruzione → niente spoiler;
- le note-esempio (read-only) tengono la prosa nel CORPO: lo stripper toglie blocchi
  dinamici, Templater, Meta Bind e callout (incl. quelli GM) e lascia la prosa.
Una nota con `visibilita: dm` (o `pubblico: false`) è esclusa interamente.

Nessuna dipendenza esterna oltre a Jinja2 (già richiesta): il Markdown→HTML è un
convertitore minimale mirato al sottoinsieme usato dalle note lore."""

from __future__ import annotations

import re
import shutil
import unicodedata
from pathlib import Path
from typing import Any, Callable

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

import common

SITE_JINJA_DIR = common.SOURCE / "SiteJinja"
SITE_OUT = common.ROOT / "dist" / "GDR-site"

# Cartella-radice dei contenuti utente nel vault (worldbuilding). SRD/z.* esclusi.
WORLD_DIR = "Mondi"

# Categorie che NON vanno ai giocatori: strumenti/log del DM. Tutto il resto sotto
# Mondi/ è lore condivisibile.
SKIP_CATEGORIES = {"sessione", "incontro", "insidia"}

# Valori di `visibilita` che nascondono la nota (oltre a `pubblico: false`).
HIDE_VISIBILITY = {"dm", "gm", "master", "privato", "segreto"}

# Rivelazione progressiva: l'asse TEMPORALE del portale-giocatori (ortogonale a
# `visibilita`, che è il «mai»). Tier ordinati: una nota è inclusa nel sito se il
# suo tier <= il livello scelto dal build (`--reveal`). Default nota = pubblico.
REVEAL_TIERS = ("pubblico", "incontrato", "segreto")
REVEAL_RANK = {t: i for i, t in enumerate(REVEAL_TIERS)}


def note_reveal_rank(fm: dict[str, Any]) -> int:
    """Tier di rivelazione di una nota (0=pubblico). Assente/ignoto → 0 (sempre
    visibile, retro-compatibile: chi non tagga condivide come prima)."""
    return REVEAL_RANK.get(str(fm.get("rivelazione", "")).strip().lower(), 0)


def build_reveal_rank(reveal: str) -> int:
    """Livello del build: nome-tier → rank; `tutto` (o ignoto verso l'alto) → il
    massimo (mostra tutto ciò che è condivisibile). Default → pubblico."""
    r = str(reveal or "pubblico").strip().lower()
    if r in ("tutto", "all"):
        return len(REVEAL_TIERS) - 1
    return REVEAL_RANK.get(r, 0)

# Etichette leggibili (accenti/plurali) per le categorie lore nel sito-giocatori;
# fallback = categoria capitalizzata.
CATEGORY_LABELS = {
    "luogo": "Luoghi", "fazione": "Fazioni", "cultura": "Culture",
    "divinita": "Divinità", "specie": "Specie", "regno": "Regni",
    "evento": "Eventi", "personaggio": "Personaggi", "creatura": "Creature",
    "oggetto": "Oggetti", "risorsa": "Risorse", "mito": "Miti", "culto": "Culti",
    "profezia": "Profezie", "epoca": "Epoche", "bioma": "Biomi", "lingua": "Lingue",
    "istituzione": "Istituzioni", "cosmologia": "Cosmologia", "piano": "Piani",
    "mondo": "Mondo", "bastione": "Bastioni", "incantesimo": "Incantesimi",
    "classe": "Classi", "sottoclasse": "Sottoclassi", "talento": "Talenti",
    "background": "Background",
}

# Chiavi-frontmatter mai mostrate come «fatti» (meta/motore/spoiler). I fatti veri
# vengono da core.scheda[categoria]; questa è solo una difesa in profondità.
_NEVER_FACT = {"tags", "cssclasses", "stato", "visibilita", "pubblico", "banner",
               "ritratto", "mappa", "coord", "uso_al_tavolo", "gancio",
               "prossima_mossa", "pressione", "conseguenza", "conseguenza_su",
               "clock", "clock_dim", "tensione", "segreto", "player_safe", "nome",
               "categoria", "tipo", "mondo", "rivelazione"}


# --- parsing nota -----------------------------------------------------------
def parse_note(text: str) -> tuple[dict[str, Any], str]:
    """Divide una nota Markdown in (frontmatter dict, corpo). Senza frontmatter
    valido → ({}, testo intero)."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            try:
                fm = yaml.safe_load(parts[1]) or {}
            except yaml.YAMLError:
                fm = {}
            if isinstance(fm, dict):
                return fm, parts[2].lstrip("\n")
    return {}, text


def is_public(fm: dict[str, Any]) -> bool:
    """La nota è condivisibile coi giocatori?"""
    if fm.get("pubblico") is False:
        return False
    vis = str(fm.get("visibilita", "")).strip().lower()
    if vis in HIDE_VISIBILITY:
        return False
    cat = fm.get("categoria")
    return bool(cat) and cat not in SKIP_CATEGORIES


# --- pulizia corpo (note-esempio: prosa inline) -----------------------------
_FENCE = re.compile(r"^(`{3,}|~{3,})")
_TEMPLATER = re.compile(r"<%.*?%>", re.DOTALL)
_METABIND = re.compile(r"`?(?:INPUT|VIEW|BUTTON)\[[^\]]*\][^`\n]*`?")
_DVINLINE = re.compile(r"`=[^`]*`")
# Tiri Dice Roller (`dice:`/`dice-mod:`): strumento del DM → fuori dal sito-giocatori.
_DICE = re.compile(r"`dice(?:-mod)?:[^`]*`")
# Heading di sole sezioni-meccanismo da non riportare nel sito-giocatori.
_DROP_HEADINGS = {"collegamenti", "connessioni", "relazioni", "carattere",
                  "vista", "al tavolo", "viaggio", "mappa"}


def strip_body(body: str) -> str:
    """Rimuove dal corpo tutto ciò che non è prosa player-safe: blocchi recintati
    (dataview/tasks/statblock/encounter/js-engine/tabs…), Templater, Meta Bind,
    Dataview inline, l'H1 del titolo, i callout (incl. infobox/tavolo/gancio/
    segreto) e gli heading di sole sezioni-meccanismo. Lascia paragrafi, liste,
    heading di contenuto."""
    body = _TEMPLATER.sub("", body)
    out: list[str] = []
    lines = body.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        fence = _FENCE.match(line.strip())
        if fence:  # salta l'intero blocco recintato (gestisce fence annidati ```` )
            marker = fence.group(1)
            i += 1
            while i < len(lines) and not lines[i].strip().startswith(marker[0] * len(marker)):
                i += 1
            i += 1
            continue
        stripped = line.strip()
        if stripped.startswith(">"):  # callout / blockquote: scartato per intero
            i += 1
            continue
        if stripped.startswith("# "):  # H1 = titolo della nota (lo rigeneriamo)
            i += 1
            continue
        m = re.match(r"^#{2,6}\s+(.*)$", stripped)
        if m and m.group(1).strip().lower().rstrip(":") in _DROP_HEADINGS:
            i += 1
            continue
        out.append(line)
        i += 1
    text = "\n".join(out)
    text = _METABIND.sub("", text)
    text = _DVINLINE.sub("", text)
    text = _DICE.sub("", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


# --- Markdown → HTML (sottoinsieme mirato) ----------------------------------
# Immagini PRIMA dei link (consumano il '!' iniziale): embed `![[file]]` e
# `![alt](url)`. Solo le estensioni-immagine diventano <img>; gli embed di NOTE
# (`![[Nota]]`) restano inerti (resolver → None).
_WIKIIMG = re.compile(r"!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
_MDIMG = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
_WIKILINK = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
_MDLINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_BOLD = re.compile(r"\*\*([^*]+)\*\*")
_IMG_EXT = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}
_ITALIC = re.compile(r"(?<!\*)\*([^*\n]+)\*(?!\*)|_([^_\n]+)_")
_CODE = re.compile(r"`([^`]+)`")
_OL_ITEM = re.compile(r"^\d+\.\s+")


def _esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def _inline(text: str, link: Callable[[str], str | None],
            image: Callable[[str], str | None] | None = None) -> str:
    """Formattazione inline su una riga già *senza* tag HTML grezzi. `image(name)`
    risolve un embed-immagine nella src web (e registra l'asset per la copia),
    None se non è un'immagine esportabile."""
    image = image or (lambda _name: None)
    codes: list[str] = []
    # HTML grezzo (<img>) messo da parte PRIMA di bold/italic, che altrimenti
    # mangerebbero gli `_`/`*` dentro src/alt (es. media/mercato_di_sale.svg).
    holds: list[str] = []

    def stash_code(m: re.Match) -> str:
        codes.append(_esc(m.group(1)))
        return f"\x00C{len(codes) - 1}\x00"

    def hold(html: str) -> str:
        holds.append(html)
        return f"\x00H{len(holds) - 1}\x00"

    text = _CODE.sub(stash_code, text)
    text = _esc(text)

    # Immagini prima dei link (consumano il '!'): embed risolto → <img> (protetto),
    # altrimenti l'embed di nota sparisce (inerte).
    def wikiimg(m: re.Match) -> str:
        name = m.group(1).strip()
        src = image(name)
        alt = (m.group(2) or Path(name).stem.replace("_", " ")).strip()
        return hold(f'<img src="{_esc(src)}" alt="{_esc(alt)}" loading="lazy">') if src else ""

    def mdimg(m: re.Match) -> str:
        src = image(m.group(2).strip())
        return hold(f'<img src="{_esc(src)}" alt="{_esc(m.group(1).strip())}" loading="lazy">') if src else ""

    text = _WIKIIMG.sub(wikiimg, text)
    text = _MDIMG.sub(mdimg, text)

    def wiki(m: re.Match) -> str:
        target, alias = m.group(1).strip(), (m.group(2) or m.group(1)).strip()
        href = link(target)
        return f'<a href="{href}">{_esc(alias)}</a>' if href else _esc(alias)

    text = _WIKILINK.sub(wiki, text)
    text = _MDLINK.sub(
        lambda m: f'<a href="{_esc(m.group(2))}" rel="noopener">{_esc(m.group(1))}</a>'
        if m.group(2).startswith(("http://", "https://")) else _esc(m.group(1)), text)
    text = _BOLD.sub(r"<strong>\1</strong>", text)
    text = _ITALIC.sub(lambda m: f"<em>{m.group(1) or m.group(2)}</em>", text)
    for idx, code in enumerate(codes):
        text = text.replace(f"\x00C{idx}\x00", f"<code>{code}</code>")
    for idx, html in enumerate(holds):
        text = text.replace(f"\x00H{idx}\x00", html)
    return text


def markdown_to_html(md: str, link: Callable[[str], str | None] | None = None,
                     image: Callable[[str], str | None] | None = None) -> str:
    """Converte un sottoinsieme di Markdown (paragrafi, heading h2-h4, liste,
    grassetto/corsivo/codice, link, [[wikilink]] ed embed-immagine) in HTML.
    `link(nome)` ritorna l'href se la nota destinazione è esportata, altrimenti
    None (link inerte); `image(nome)` la src web dell'immagine (o None)."""
    link = link or (lambda _name: None)
    md = (md or "").strip()
    if not md:
        return ""
    html: list[str] = []
    for block in re.split(r"\n\s*\n", md):
        block = block.strip("\n")
        if not block:
            continue
        first = block.lstrip()
        h = re.match(r"^(#{2,6})\s+(.*)$", first)
        if h and "\n" not in block:
            level = min(len(h.group(1)), 6)
            html.append(f"<h{level}>{_inline(h.group(2).strip(), link, image)}</h{level}>")
            continue
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if lines and all(re.match(r"^[-*]\s+", ln) for ln in lines):
            items = "".join(f"<li>{_inline(ln[2:].strip(), link, image)}</li>" for ln in lines)
            html.append(f"<ul>{items}</ul>")
            continue
        if lines and all(_OL_ITEM.match(ln) for ln in lines):
            items = "".join(f"<li>{_inline(_OL_ITEM.sub('', ln), link, image)}</li>" for ln in lines)
            html.append(f"<ol>{items}</ol>")
            continue
        para = "<br>\n".join(_inline(ln, link, image) for ln in block.splitlines() if ln.strip())
        html.append(f"<p>{para}</p>")
    return "\n".join(html)


# --- modello di pagina ------------------------------------------------------
def _clean_link(value: Any) -> list[str]:
    """Normalizza un valore-relazione (wikilink, lista, stringa) in nomi puliti."""
    out: list[str] = []
    for item in (value if isinstance(value, list) else [value]):
        if not item:
            continue
        for m in _WIKILINK.finditer(str(item)):
            out.append(m.group(1).strip())
        if "[[" not in str(item):
            out.append(str(item).strip())
    return [x for x in out if x]


def slugify(name: str) -> str:
    norm = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode()
    norm = re.sub(r"[^\w\s-]", "", norm).strip().lower()
    return re.sub(r"[\s_-]+", "-", norm) or "nota"


def page_model(core: dict[str, Any], fm: dict[str, Any], body: str,
               name: str, link: Callable[[str], str | None],
               image: Callable[[str], str | None] | None = None) -> dict[str, Any]:
    """Costruisce il modello di pagina player-safe da frontmatter + corpo."""
    cat = fm.get("categoria", "")
    fields = core.get("fields", {})
    img = image or (lambda _name: None)

    # Ritratto (campo `ritratto`): immagine d'intestazione, se esportabile.
    portrait = None
    rit = _clean_link(fm.get("ritratto"))
    if rit:
        portrait = img(rit[0])

    # Fatti: scheda della categoria (scalari) + tipo, escludendo i campi meccanismo.
    facts: list[dict[str, str]] = []
    tipo = fm.get("tipo")
    if tipo:
        facts.append({"label": "Tipo", "value": _esc(str(tipo))})
    for fid in core.get("scheda", {}).get(cat, []) or []:
        val = fm.get(fid)
        if val and fid not in _NEVER_FACT:
            label = (fields.get(fid, {}) or {}).get("label", fid.capitalize())
            facts.append({"label": _esc(label), "value": _esc(str(val))})

    # Sezioni narrative: i campi creation.body con `heading` (NO `callout: segreto`).
    sections: list[dict[str, str]] = []
    if fm.get("player_safe"):
        sections.append({"heading": "", "html": markdown_to_html(str(fm["player_safe"]), link, img)})
    for entry in ((core.get("creation", {}).get(cat) or {}).get("body") or []):
        if entry.get("callout"):  # es. segreto → DM-only
            continue
        fid = entry.get("field")
        val = fm.get(fid)
        if entry.get("heading") and val:
            sections.append({"heading": entry["heading"], "html": markdown_to_html(str(val), link, img)})

    # Prosa dal corpo (note-esempio): aggiunta come sezione introduttiva.
    body_html = markdown_to_html(strip_body(body), link, img)
    if body_html:
        sections.insert(0, {"heading": "", "html": body_html})

    # Relazioni player-safe (core.relazioni[categoria]) → link navigabili.
    rels: list[dict[str, Any]] = []
    for rel in core.get("relazioni", {}).get(cat, []) or []:
        targets = _clean_link(fm.get(rel.get("field")))
        if not targets:
            continue
        links = [{"name": t, "href": link(t)} for t in targets]
        rels.append({"label": rel.get("label", rel.get("field")), "targets": links})

    return {
        "name": name,
        "category": cat,
        "category_label": CATEGORY_LABELS.get(cat, cat.capitalize()),
        "world": (_clean_link(fm.get("mondo")) or [None])[0],
        "portrait": portrait,
        "facts": facts,
        "sections": sections,
        "relations": rels,
    }


# --- orchestrazione ---------------------------------------------------------
def collect_notes(vault_dir: Path) -> list[tuple[str, dict[str, Any], str]]:
    """Tutte le note pubbliche sotto Mondi/, come (nome, frontmatter, corpo)."""
    world = vault_dir / WORLD_DIR
    found: list[tuple[str, dict[str, Any], str]] = []
    if not world.is_dir():
        return found
    for path in sorted(world.rglob("*.md")):
        fm, body = parse_note(path.read_text(encoding="utf-8"))
        if not is_public(fm):
            continue
        found.append((fm.get("nome") or path.stem, fm, body))
    return found


def _site_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(SITE_JINJA_DIR)),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def make_asset_resolver(vault_dir: Path) -> Callable[[str], str | None]:
    """Resolver di asset-immagine per il sito: dato il nome/percorso di un embed,
    trova il file sotto il vault (path relativo → Media/ → ricerca per nome),
    lo registra per la copia in `<out>/media/` e ritorna la src web (`media/<file>`).
    Non-immagini (es. embed di nota) ed esterni → inerti. URL http(s) → passthrough.
    Espone `.copies` ({src_path: dest_name}) per la copia finale."""
    copies: dict[Path, str] = {}
    dests: set[str] = set()
    cache: dict[str, str | None] = {}

    def resolve(name: str) -> str | None:
        if name in cache:
            return cache[name]
        raw = str(name).strip().split("|", 1)[0].strip()
        if raw.startswith(("http://", "https://")):
            cache[name] = raw
            return raw
        result: str | None = None
        if Path(raw).suffix.lower() in _IMG_EXT:
            fname = Path(raw).name
            candidates: list[Path] = []
            if "/" in raw:
                candidates.append(vault_dir / raw)        # percorso vault-relativo
            candidates.append(vault_dir / "Media" / fname)  # cartella allegati
            src = next((c for c in candidates if c.is_file()), None)
            if src is None:                                 # ultima spiaggia: per nome
                src = next((p for p in vault_dir.rglob(fname) if p.is_file()), None)
            if src is not None:
                src = src.resolve()
                if src in copies:
                    result = f"media/{copies[src]}"
                else:
                    dest, stem, suf, i = fname, Path(fname).stem, Path(fname).suffix, 2
                    while dest in dests:
                        dest, i = f"{stem}-{i}{suf}", i + 1
                    dests.add(dest)
                    copies[src] = dest
                    result = f"media/{dest}"
        cache[name] = result
        return result

    resolve.copies = copies  # type: ignore[attr-defined]
    return resolve


def build_site(core: dict[str, Any], vault_dir: Path, out_dir: Path,
               reveal: str = "pubblico") -> int:
    """Genera il sito statico dei giocatori al livello di rivelazione `reveal`
    (pubblico|incontrato|segreto|tutto). Ritorna il numero di pagine scritte."""
    level = build_reveal_rank(reveal)
    shareable = collect_notes(vault_dir)  # già passate il filtro `is_public`
    # Gate progressivo: nota inclusa se il suo tier <= livello del build. Le altre
    # restano «da rivelare» (le contiamo, senza silenziarle, per il portale).
    notes = [n for n in shareable if note_reveal_rank(n[1]) <= level]
    da_rivelare = len(shareable) - len(notes)

    # Mappa nome/filename → slug (per risolvere i [[wikilink]] in href). Slug unici.
    slug_by_name: dict[str, str] = {}
    used: set[str] = set()
    pages: list[dict[str, Any]] = []
    for name, fm, body in notes:
        slug = slugify(name)
        base, n = slug, 2
        while slug in used:
            slug, n = f"{base}-{n}", n + 1
        used.add(slug)
        slug_by_name[name.lower()] = slug
        pages.append({"name": name, "fm": fm, "body": body, "slug": slug})

    def link(target: str) -> str | None:
        slug = slug_by_name.get(str(target).strip().lower())
        return f"{slug}.html" if slug else None

    image = make_asset_resolver(vault_dir)

    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    env = _site_env()
    page_tpl = env.get_template("page.html.j2")
    index_tpl = env.get_template("index.html.j2")

    rendered: list[dict[str, Any]] = []
    for p in pages:
        model = page_model(core, p["fm"], p["body"], p["name"], link, image)
        model["slug"] = p["slug"]
        rendered.append(model)
        (out_dir / f"{p['slug']}.html").write_text(
            page_tpl.render(page=model), encoding="utf-8")

    # Asset-immagine referenziati (mappe/ritratti) → <out>/media/, src riscritte.
    copies: dict[Path, str] = getattr(image, "copies", {})
    if copies:
        (out_dir / "media").mkdir(parents=True, exist_ok=True)
        for src, dest in copies.items():
            shutil.copyfile(src, out_dir / "media" / dest)

    # Indice: mondi → categorie → note.
    worlds: dict[str, dict[str, list[dict[str, Any]]]] = {}
    for m in sorted(rendered, key=lambda x: (x["category_label"], x["name"])):
        wkey = m["world"] or "Senza mondo"
        worlds.setdefault(wkey, {}).setdefault(m["category_label"], []).append(m)
    reveal_label = REVEAL_TIERS[min(level, len(REVEAL_TIERS) - 1)]
    (out_dir / "index.html").write_text(
        index_tpl.render(worlds=worlds, total=len(rendered),
                         reveal=reveal_label, da_rivelare=da_rivelare),
        encoding="utf-8")

    css = SITE_JINJA_DIR / "site.css"
    if css.is_file():
        shutil.copyfile(css, out_dir / "site.css")
    return len(rendered)
