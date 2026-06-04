#!/usr/bin/env python3
"""Mondo-esempio (demo precaricata) e World Board (Obsidian Canvas). Estratto da
render.py: genera le note READ-ONLY del mondo dimostrativo (`Mondi/_Esempio — <X>/`),
la nota guidata «Inizia da qui» e il `.canvas` del World Board build-time. Le note
sono Markdown/Dataview puro (niente Templater) così rendono sempre.

Dipende solo da common.py (IO/modello) e da render_config.py (MEDIA_FOLDER +
_canvas_color, la presentazione colore-categoria): example_world → render_config →
common, una sola direzione, nessun ciclo. render.py re-esporta i nomi per i test."""

from __future__ import annotations

import json
import math
import shutil
from typing import Any

import yaml

from common import ESEMPIO_DIR, VAULT, load_example_manifests, write_text
from render_config import MEDIA_FOLDER, _canvas_color


# Cartella riservata del mondo dimostrativo: prefisso fisso, MAI toccato altrove
# (un utente crea i propri mondi nelle cartelle di categoria, non qui). Il writer
# la riscrive a ogni build; l'utente la cancella in un clic per partire da vuoto.
EXAMPLE_FOLDER_PREFIX = "Mondi/_Esempio — "


def pressione_label(pressione: Any) -> str:
    """Etichetta della pressione (come la macro tavolo): Crisi/Tensione/Calma."""
    try:
        p = int(pressione)
    except (TypeError, ValueError):
        return ""
    return "🔴 Crisi" if p >= 7 else "🟠 Tensione" if p >= 4 else "🟢 Calma"


def example_carattere_block(fm: dict[str, Any], category: str, core: dict[str, Any]) -> list[str]:
    """Blocco «Carattere» degli assi tematici per una nota-esempio: un callout
    read-only con `valore · etichetta` per ogni asse valorizzato nel frontmatter
    (dalle etichette in core.assi_tematici) + il radar (js-engine, come la macro
    grafico_assi: rende dal frontmatter con JS Engine). Vuoto se la categoria non
    ha assi o ne ha <3 valorizzati. Sul sito-giocatori callout e fence js-engine
    sono rimossi (il Carattere è lettura da DM)."""
    assi = (core.get("assi_tematici", {}) or {}).get(category) or []
    righe: list[str] = []
    for a in assi:
        val = fm.get(a["id"])
        if val is None:
            continue
        valori = a.get("valori", {}) or {}
        voce = valori.get(val)
        if voce is None:
            try:
                voce = valori.get(int(val))
            except (TypeError, ValueError):
                voce = None
        etichetta = (voce or {}).get("etichetta", "")
        righe.append(f"> **{a.get('nome', a['id'])}** — {val} · {etichetta}")
    if len(righe) < 3:
        return []
    return ["## Carattere", "", "> [!abstract] Carattere", *righe, "",
            "```js-engine",
            f'return (await engine.importJs("z.automazioni/boot.mjs"))'
            f'.radar(engine, app, "{category}", component);',
            "```", ""]


def example_note_text(note: dict[str, Any], world: str, core: dict[str, Any]) -> str:
    """Una nota del mondo-esempio: frontmatter pre-popolato + corpo READ-ONLY in
    Markdown/Dataview puro (infobox, lore, superficie giocabile, collegamenti).
    Assi tematici → callout Carattere + radar (js-engine). Le dashboard la trovano
    per `categoria`."""
    fm: dict[str, Any] = {
        "nome": note["nome"],
        "categoria": note["categoria"],
        "tipo": note.get("tipo", ""),
        "mondo": f"[[{world}]]",
        "stato": note.get("stato", "pronto"),
    }
    fm.update(note.get("fm", {}) or {})
    for key in ("uso_al_tavolo", "gancio", "prossima_mossa"):
        if note.get(key):
            fm[key] = note[key]
    if note.get("pressione") is not None:
        fm["pressione"] = note["pressione"]
    fm["tags"] = ["gdr/esempio"]
    front = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False)

    lines = [f"---\n{front}---", "", f"# {note['nome']}", ""]
    # Infobox (callout CSS): tabella-fatti d'identità. Il metadato = categoria →
    # accento-colore per categoria (gdr.css), come nelle note da template.
    lines.append(f"> [!infobox|{note.get('categoria', '')}] {note['nome']}")
    lines.append("> | | |")
    lines.append("> |:--|:--|")
    lines.append(f"> | **Mondo** | [[{world}]] |")
    for label, value in note.get("fatti", []) or []:
        lines.append(f"> | **{label}** | {value} |")
    lines.append("")
    if note.get("lore"):
        lines += [note["lore"].strip(), ""]
    # Rivelazione PER-SEZIONE: callout `[!rivela|tier]` — verità che emergono col
    # procedere della campagna. Player-facing ma gated dal build del sito (compare
    # al `--reveal` >= tier); in Obsidian è un callout pieghevole. Dalla lista `rivela`.
    for r in note.get("rivela", []) or []:
        tier = r.get("tier", "incontrato")
        titolo = str(r.get("titolo", "")).strip()
        testo = str(r.get("testo", "") or "").strip()
        lines.append(f"> [!rivela|{tier}]-" + (f" {titolo}" if titolo else ""))
        if testo:
            lines.append(f"> {testo}")
        lines.append("")
    # Mappa (campo `mappa`): embed dell'immagine collegata, come views.renderMap
    # (`![[..]]` rende SEMPRE, senza plugin). L'asset vive in Media/ (copiato a build
    # da copy_example_media). Sul sito-giocatori l'embed diventa `<img>` (zoommap è
    # solo-Obsidian). Target derivato dal wikilink del campo.
    mappa = fm.get("mappa")
    if mappa:
        target = str(mappa).strip()
        if target.startswith("[["):
            target = target[2:].split("]]", 1)[0]
        target = target.split("|", 1)[0].strip()
        if target:
            lines += ["## Mappa", "", f"![[{target}]]", ""]
    # Carattere (assi tematici): callout read-only + radar (js-engine), come la
    # macro carattere/grafico_assi. Solo per le categorie con assi valorizzati.
    lines += example_carattere_block(fm, note.get("categoria", ""), core)
    # Superficie giocabile (IL differenziatore), come la macro tavolo().
    if note.get("uso_al_tavolo"):
        lines += [f"> [!tavolo] Uso al tavolo\n> {note['uso_al_tavolo'].strip()}", ""]
    if note.get("gancio"):
        lines += [f"> [!gancio]- Gancio\n> {note['gancio'].strip()}", ""]
    if note.get("pressione") is not None:
        etichetta = pressione_label(note["pressione"])
        blocco = [f"> [!warning] Pressione {note['pressione']} · {etichetta}"]
        if note.get("prossima_mossa"):
            blocco.append(f"> **Prossima mossa**: {note['prossima_mossa'].strip()}")
        clock_dim = (note.get("fm", {}) or {}).get("clock_dim")
        if clock_dim:
            clock = (note.get("fm", {}) or {}).get("clock", 0)
            conseg = (note.get("fm", {}) or {}).get("conseguenza", "")
            blocco.append(f"> **Clock**: {clock}/{clock_dim} → {conseg}")
        lines += ["\n".join(blocco), ""]
    # Cronologia (mondo-che-cambia): la linea di vita dell'entità attraverso le
    # epoche, come la macro cronologia()/renderTappe (split sul primo '|').
    tappe = (note.get("fm", {}) or {}).get("tappe") or []
    if tappe:
        crono = ["> [!abstract]- 📜 Cronologia (come cambia attraverso le epoche)"]
        for riga in tappe:
            quando, _, stato = str(riga).partition("|")
            crono.append(f"> - **{quando.strip()}**" + (f" — {stato.strip()}" if stato.strip() else ""))
        lines += ["\n".join(crono), ""]
    # Collegamenti (Dataview): note del mondo legate a questa, in entrambe le
    # direzioni del grafo. Scoped a Mondi/ (esclude le 1300+ note SRD).
    lines += ["## Collegamenti", "```dataview",
              "list from \"Mondi\"",
              "where contains(file.outlinks, this.file.link) or contains(this.file.outlinks, file.link)",
              "```"]
    return "\n".join(lines)


def example_world_notes(manifest: dict[str, Any], core: dict[str, Any]) -> list[tuple[str, str]]:
    """Le note di un mondo-esempio come [(relpath, testo)]. Salta le note di
    categoria sconosciuta (robustezza). Tutte sotto un'unica cartella riservata."""
    world = manifest["mondo"]
    folder = f"{EXAMPLE_FOLDER_PREFIX}{world}"
    categories = core.get("categories", {})
    out: list[tuple[str, str]] = []
    for note in manifest.get("note", []) or []:
        if note.get("categoria") not in categories or not note.get("nome"):
            continue
        out.append((f"{folder}/{note['nome']}.md", example_note_text(note, world, core)))
    return out


def onboarding_note_text(manifest: dict[str, Any]) -> str:
    """Nota guidata "Inizia da qui" (UX-1, momento-aha): in 3 passi mostra IL WEDGE —
    scrivi lore (pressione/prossima mossa) su una nota → la superficie giocabile (il
    cruscotto Fronti) si popola da sé. Read-only; il BUTTON è Meta Bind (rende in
    Lettura), non Templater. `visibilita: dm` → fuori dal sito dei giocatori."""
    world = manifest["mondo"]
    # Luogo rappresentativo: quello che PREME di più (pressione max fra i luoghi con
    # pressione E prossima mossa) — il miglior esempio di "la lore accende la superficie
    # giocabile". Fallback robusto se nessuno qualifica.
    candidati = [n for n in manifest.get("note", []) or []
                 if n.get("categoria") == "luogo" and n.get("pressione") is not None
                 and n.get("prossima_mossa")]
    rep = max(candidati, key=lambda n: int(n.get("pressione") or 0)) if candidati else None
    if rep:
        passo1 = (f"Apri **[[{rep['nome']}]]**. Oltre alla prosa ha dei campi *da tavolo*: "
                  f"una **Pressione {rep['pressione']}** e una **Prossima mossa**. Non sono "
                  f"decorazione — dicono che questo luogo *preme* sulla storia.")
    else:
        passo1 = ("Apri una nota di luogo del mondo-esempio: ha campi *da tavolo* "
                  "(Pressione, Prossima mossa) oltre alla prosa.")
    fm = {"nome": "Inizia da qui", "visibilita": "dm", "tags": ["gdr/esempio"]}
    front = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False)
    lines = [
        f"---\n{front}---", "",
        f"# 👋 Inizia da qui — {world}", "",
        "> [!tip] 3 minuti per capire cos'ha di speciale questo vault",
        "> Non è uno schedario di lore: è un **mondo che si calcola**. Quando scrivi la lore di",
        "> una nota, la *superficie giocabile* (cosa preme al tavolo) si accende **da sola**.",
        "> Seguiamolo in 3 passi, sul mondo-esempio già pronto.", "",
        "## 1 · Guarda una nota di mondo",
        passo1, "",
        "## 2 · Guarda dove quel segnale riemerge **da solo**",
        "Apri il cruscotto **[[Fronti]]** (callout *⚡ Stato del Mondo* in cima). Non l'hai",
        "compilato tu: è **calcolato dal grafo**. Il luogo di prima — e gli altri fronti —",
        "compaiono lì **ordinati per imminenza** (riempimento del clock + spinte dalle note",
        "collegate). Hai scritto lore in *una* nota → il cruscotto di prep-sessione si è",
        "popolato da sé. **Questo è il punto: il mondo si calcola.**", "",
        "## 3 · Provalo tu (30 secondi)",
        "> [!example] Crea il tuo primo luogo",
        "> `BUTTON[crea-luogo]`",
        ">",
        "> Nel wizard scegli un **mondo**, poi compila **Pressione** (prova 6-7) e una",
        "> **Prossima mossa**. Riapri **[[Fronti]]**: il tuo luogo è ora fra i fronti, in",
        "> classifica. Niente database da gestire — la tua lore *è* il motore.", "",
        "---",
        "> [!info] E poi?",
        "> - Esplora gli indici dalla **[[Home]]**: 🗺️ [[Atlante]], ⏳ [[Fronti]], 💰 [[Economia]], 🧭 [[Geografia]].",
        f"> - Vedi il mondo **a colpo d'occhio**: apri il **[[{world} — Board.canvas|🗺 World Board]]** (Obsidian Canvas) — ogni card una nota, ogni linea una relazione.",
        "> - Crea fazioni, divinità, eventi: ognuno aggiunge spinte al grafo (alleati/rivali, rotte, clock).",
        f"> - Per partire da un mondo **vuoto**, cancella la cartella `_Esempio — {world}`.",
        "> - Guida completa: **[[LEGGIMI]]**.",
    ]
    return "\n".join(lines)


def copy_example_media() -> int:
    """Copia gli asset (mappe/immagini) dei mondi-esempio da Dev/Source/esempio/Media/
    nella cartella allegati del vault (`Media/`). Gli embed `![[file]]` delle note
    li risolvono per nome. Ritorna il n. di file copiati."""
    src_dir = ESEMPIO_DIR / "Media"
    if not src_dir.is_dir():
        return 0
    dest_dir = VAULT / MEDIA_FOLDER
    dest_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for f in sorted(src_dir.iterdir()):
        if f.is_file() and not f.name.startswith("."):
            shutil.copy2(f, dest_dir / f.name)
            copied += 1
    return copied


def _link_names(value: Any) -> list[str]:
    """Nomi-nota estratti da un valore-relazione (wikilink, lista, stringa)."""
    names: list[str] = []
    for item in (value if isinstance(value, list) else [value]):
        if not item:
            continue
        s = str(item).strip()
        if s.startswith("[[") and s.endswith("]]"):
            inner = s[2:-2].split("|")[0].strip()
            if inner:
                names.append(inner)
        elif "[[" not in s:
            names.append(s)
    return names


def world_board_canvas(manifest: dict[str, Any], core: dict[str, Any]) -> dict[str, Any]:
    """«World Board» (Obsidian Canvas) di un mondo-esempio: una card per entità,
    in colonne raggruppate per categoria, e gli archi delle relazioni tipizzate
    (dedotti dal grafo). Vista a colpo d'occhio del mondo — alternativa visiva alla
    dashboard Rete. Ritorna il dict JSON Canvas 1.0."""
    world = manifest["mondo"]
    folder = f"{EXAMPLE_FOLDER_PREFIX}{world}"
    categories = core.get("categories", {})
    relazioni = core.get("relazioni", {})
    notes = [n for n in manifest.get("note", []) or []
             if n.get("categoria") in categories and n.get("nome")]

    # Raggruppa per categoria, in un ordine di lettura stabile (ordine di prima
    # apparizione nel manifest → deterministico per i test).
    cats_in_order: list[str] = []
    by_cat: dict[str, list[dict[str, Any]]] = {}
    for n in notes:
        c = n["categoria"]
        if c not in by_cat:
            by_cat[c] = []
            cats_in_order.append(c)
        by_cat[c].append(n)

    # Layout a GRIGLIA: le colonne-categoria vanno a capo in "scaffali" (shelf)
    # invece di stare in un'unica fila larghissima (illeggibile con molte categorie).
    # Card più grandi e più spaziate → vetrina leggibile a colpo d'occhio. Numero di
    # colonne per scaffale ≈ √(n. categorie) → griglia quasi quadrata (math.ceil:
    # identico in Python e JS, per la parità). Cambiare i parametri qui SENZA
    # riallinearli in world_board.js (buildCanvas) romperebbe il test di parità.
    NODE_W, NODE_H = 300, 130
    COL_GAP, ROW_GAP, SHELF_GAP = 90, 36, 150
    TOP, PAD, LABEL = 40, 22, 48
    cols = max(3, math.ceil(math.sqrt(len(cats_in_order)))) if cats_in_order else 1
    col_pitch, row_pitch = NODE_W + COL_GAP, NODE_H + ROW_GAP
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    node_by_name: dict[str, str] = {}

    # Header (text node) in alto, largo quanto uno scaffale.
    nodes.append({"id": "header", "type": "text", "x": -PAD, "y": TOP - 120,
                  "width": cols * col_pitch - COL_GAP, "height": 80,
                  "text": f"# 🗺 {world} — World Board\nIl mondo a colpo d'occhio: ogni card è una nota, ogni linea una relazione."})

    y_cursor = TOP
    for shelf_start in range(0, len(cats_in_order), cols):
        shelf = cats_in_order[shelf_start:shelf_start + cols]
        shelf_h = 0
        for ci, cat in enumerate(shelf):
            items = by_cat[cat]
            col_x = ci * col_pitch
            grp_h = LABEL + (len(items) - 1) * row_pitch + NODE_H + PAD
            # Gruppo (sfondo + etichetta) della colonna-categoria.
            nodes.append({"id": f"grp-{cat}", "type": "group", "label": cat.capitalize(),
                          "x": col_x - PAD, "y": y_cursor - LABEL,
                          "width": NODE_W + 2 * PAD, "height": grp_h})
            for i, n in enumerate(items):
                nid = f"n{len(node_by_name)}"
                node_by_name[n["nome"]] = nid
                node: dict[str, Any] = {
                    "id": nid, "type": "file",
                    "file": f"{folder}/{n['nome']}.md",
                    "x": col_x, "y": y_cursor + i * row_pitch,
                    "width": NODE_W, "height": NODE_H,
                }
                color = _canvas_color(cat)
                if color:
                    node["color"] = color
                nodes.append(node)
            shelf_h = max(shelf_h, grp_h)
        y_cursor += shelf_h + SHELF_GAP

    # Archi: relazioni tipizzate fra entità del mondo (una per coppia non orientata).
    seen_pairs: set[frozenset] = set()
    for n in notes:
        src = node_by_name[n["nome"]]
        fm = n.get("fm", {}) or {}
        for rel in relazioni.get(n["categoria"], []) or []:
            for target in _link_names(fm.get(rel.get("field"))):
                tgt = node_by_name.get(target)
                if not tgt or tgt == src:
                    continue
                pair = frozenset((src, tgt))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                edges.append({"id": f"e{len(edges)}", "fromNode": src,
                              "toNode": tgt, "label": rel.get("label", rel.get("field", ""))})
    return {"nodes": nodes, "edges": edges}


def example_board_text(manifest: dict[str, Any], core: dict[str, Any]) -> str:
    """Testo del World Board (.canvas) del mondo-esempio. Se esiste una versione
    SORGENTE disposta a mano in `Dev/Source/esempio/<Mondo> — Board.canvas`, la usa
    verbatim: è la vetrina curata dall'utente — versionata, inclusa nello ZIP e
    PRESERVATA dai rebuild (la build non la sovrascrive con l'auto-layout). Se manca,
    auto-genera dal grafo (bozza riordinabile in Canvas). Così «risistemarla a mano»
    è permanente: arrangi la canvas, la si cattura come sorgente, e resta quella."""
    source_board = ESEMPIO_DIR / f"{manifest['mondo']} — Board.canvas"
    if source_board.is_file():
        return source_board.read_text(encoding="utf-8")
    return json.dumps(world_board_canvas(manifest, core), ensure_ascii=False, indent=2)


def write_example_world(core: dict[str, Any]) -> int:
    """Genera i mondi-esempio (Dev/Source/esempio/*.yaml) in cartelle riservate
    `Mondi/_Esempio — <Mondo>/`. Riscrittura pulita: azzera SOLO la propria cartella
    (namespace riservato, mai contenuti utente). Ritorna il n. di note scritte."""
    written = 0
    for manifest in load_example_manifests():
        folder = VAULT / f"{EXAMPLE_FOLDER_PREFIX}{manifest['mondo']}"
        if folder.is_dir():
            shutil.rmtree(folder)
        for rel, text in example_world_notes(manifest, core):
            write_text(VAULT / rel, text)
            written += 1
        # Nota guidata "Inizia da qui" (UX-1): vive e muore con l'esempio; rende il
        # wedge nei primi minuti (lore → superficie giocabile calcolata).
        write_text(folder / "Inizia da qui.md", onboarding_note_text(manifest))
        written += 1
        # World Board (Obsidian Canvas): il mondo a colpo d'occhio (card per nota +
        # archi delle relazioni). Vista visiva alternativa alla dashboard Rete.
        write_text(folder / f"{manifest['mondo']} — Board.canvas",
                   example_board_text(manifest, core))
    # Asset condivisi (mappe/immagini) delle note-esempio nella cartella allegati.
    media = copy_example_media()
    if media:
        print(f"Mondo-esempio: {media} asset copiati in {MEDIA_FOLDER}/.")
    return written
