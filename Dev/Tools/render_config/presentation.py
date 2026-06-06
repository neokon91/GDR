"""Presentazione: snippet CSS (nascondi z.*, accento-colore per categoria, callout) e preset colore Canvas."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from common import (
    HIDDEN_DIRS,
    INDEX_DIR,
    STATBLOCKS_DIR,
    VAULT,
    read_json,
    template_folder,
    write_json,
    write_text,
)

from ._io import union_list_key




# Snippet CSS generato: nasconde le cartelle di sistema (z.*) dall'esploratore.
# Restano indicizzate (data-path presente), quindi Templater/Metadata Menu/Dataview
# continuano a vederle: nascondiamo solo la riga nell'albero dei file.
HIDE_FOLDERS_SNIPPET = """/* GDR — generato. Snippet del vault (nascondi z.* + stile pannelli Vista). */

/* Nasconde le cartelle di sistema (z.*) dall'esploratore. */
.nav-folder.tree-item:has(> .tree-item-self[data-path^="z."]) {
  display: none;
}

/* Card del pannello Vista (views.js: renderEntityPanel). Variabili del tema. */
.gdr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.gdr-card {
  border: 1px solid var(--background-modifier-border);
  border-left: 3px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--background-secondary);
  font-size: var(--font-ui-small);
}
.gdr-card.ready { border-left-color: var(--color-green); }
.gdr-card.missing { border-left-color: var(--color-red); opacity: 0.85; }

/* Radar degli assi tematici (views.js: radarMarkdownFromValues / renderAxesCompare). */
.gdr-radar { display: flex; justify-content: center; margin: 4px 0 14px; }
.gdr-radar-svg { width: 100%; max-width: 400px; height: auto; }  /* in vetrina in cima alla tab Carattere */
.gdr-radar-empty { color: var(--text-muted); font-size: var(--font-ui-small); }

/* Barre risorse PG (views.js: renderRisorsePG). Max variabile calcolato a runtime
   nel JS Engine: il progressBar Meta Bind accetta solo max letterali. */
.gdr-bars { display: grid; gap: 4px; margin: 6px 0; }
.gdr-bar { display: grid; grid-template-columns: 5.5em 1fr auto; align-items: center; gap: 8px; font-size: var(--font-ui-small); }
.gdr-bar-label { color: var(--text-muted); }
.gdr-bar-track { height: 10px; border-radius: 5px; background: var(--background-modifier-border); overflow: hidden; }
.gdr-bar-fill { display: block; height: 100%; border-radius: 5px; }
.gdr-bar-val { font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Timeline grafica (views.js: renderTimeline). Nastro orizzontale di epoche in ordine
   cronologico (larghezza ∝ n. di voci), colorate sul bordo inferiore: overview a colpo
   d'occhio sopra il dettaglio pieghevole. Resa custom (HTML), nessun plugin timeline. */
.gdr-timeline { display: flex; gap: 3px; margin: 0.4em 0 0.9em; align-items: stretch; }
.gdr-tl-era {
  flex: 1; min-width: 66px; padding: 0.35em 0.55em 0.3em;
  background: var(--background-secondary); border-radius: 6px;
  border-bottom: 3px solid var(--background-modifier-border);
  display: flex; flex-direction: column; gap: 1px; overflow: hidden;
}
.gdr-tl-name { font-weight: 600; font-size: var(--font-ui-small); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gdr-tl-span { font-size: var(--font-ui-smaller); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gdr-tl-count { font-size: var(--font-ui-smaller); color: var(--text-faint); }

/* === Feel wiki (rifinitura) — tutto su variabili del tema (chiaro/scuro). === */

/* Infobox (macro identita_card): scheda d'identità in cima alla nota. Box
   distinto + ritratto incorniciato + tabella-fatti compatta (chiave in muted). */
.callout[data-callout="infobox"] {
  border: 1px solid var(--background-modifier-border);
  border-radius: 10px;
  background: var(--background-secondary);
  padding: 0.5em 0.9em 0.7em;
}
.callout[data-callout="infobox"] > .callout-title {
  font-size: var(--font-ui-medium);
  border-bottom: 1px solid var(--background-modifier-border);
  padding-bottom: 0.3em;
  margin-bottom: 0.4em;
}
.callout[data-callout="infobox"] table {
  border-collapse: collapse;
  width: 100%;
  font-size: var(--font-ui-small);
}
.callout[data-callout="infobox"] td {
  border: none;
  padding: 2px 6px;
  vertical-align: top;
}
.callout[data-callout="infobox"] td:first-child {
  color: var(--text-muted);
  white-space: nowrap;
  width: 1%;
}
/* Ritratto (se reso come immagine): incorniciato e centrato, non a tutta pagina. */
.callout[data-callout="infobox"] img {
  display: block;
  margin: 0.2em auto 0.5em;
  max-width: 220px;
  max-height: 260px;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border);
}

/* Tabelle dentro i callout (relazioni/scheda/condizioni): più compatte. */
.callout th, .callout td { padding: 3px 8px; }
.callout table { font-size: var(--font-ui-small); }

/* Pannello Vista: lieve feedback hover per dare profondità alle card. */
.gdr-card { transition: border-left-width 80ms ease; }
.gdr-card:hover { border-left-width: 5px; }

/* === Layout nota: A=infobox sidebar · B=accento categoria · E=tipografia ===== */

/* B — accento di categoria: l'infobox eredita --gdr-accent (impostato dalle regole
   per-categoria generate sotto, su [!infobox|<categoria>]); default = bordo neutro. */
.callout[data-callout="infobox"] {
  --gdr-accent: var(--background-modifier-border);
  border-top: 3px solid var(--gdr-accent);
}
.callout[data-callout="infobox"] > .callout-title { color: var(--gdr-accent); }

/* A — NB: la sidebar flottante con testo che avvolge NON è affidabile in Obsidian:
   in lettura il renderer virtualizza i blocchi (ognuno è una `.markdown-preview-section`
   posizionata), così float/wrap fra blocchi si rompe. L'infobox resta dunque una card
   a tutta larghezza (pulita, robusta), con l'identità data dall'accento di categoria
   (B) e dalla cornice; niente layout fragile. */

/* Banner (macro banner): cover image in testa per le categorie panoramiche (banner_categorie).
   È la versione FATTIBILE dell'idea-sidebar — un blocco SINGOLO a tutta larghezza (≠ float fra
   blocchi), quindi robusto col renderer virtuale. Callout "nudo": niente titolo/bordo/padding,
   immagine ritagliata a fascia (object-fit: cover) sopra il titolo della nota. */
.callout[data-callout="banner"] {
  padding: 0; border: none; background: none; margin: 0.2em 0 0.7em;
}
.callout[data-callout="banner"] > .callout-title { display: none; }
.callout[data-callout="banner"] img {
  width: 100%; height: 200px; object-fit: cover;
  border-radius: 10px; display: block; margin: 0;
  border: 1px solid var(--background-modifier-border);
}

/* E — titolo nota: più respiro + filetto sottile (aria da voce di wiki). */
.markdown-rendered h1 { margin-bottom: 0.4rem; padding-bottom: 0.2rem; border-bottom: 1px solid var(--background-modifier-border); }
/* Header delle tab (Tab Panels): più scandito e leggibile. */
.block-language-tabs .tabs-header { gap: 0.2em; }
/* Callout di classificazione (famiglia): discreto, non compete con l'infobox. */
.callout[data-callout="info"] { font-size: var(--font-ui-small); }

/* === Ritocchi vetrina: callout differenzianti + tabelle dashboard ============ */

/* «Uso al tavolo» (la superficie giocabile = IL differenziatore): look da
   scheda-azione — sfondo + bordo-sinistro accentato, salta all'occhio. */
.callout[data-callout="tavolo"] {
  background: var(--background-secondary);
  border-left: 4px solid var(--callout-color, var(--color-red));
  border-radius: 6px;
}

/* Segreti (lettura DM): bordo tratteggiato = "non spoilerare". */
.callout[data-callout="segreto"] {
  border-left: 4px dashed var(--callout-color, var(--color-purple));
  background: var(--background-secondary);
}

/* Rivelazioni progressive (verità che emergono): bordo-sinistro accentato. */
.callout[data-callout="rivela"] {
  border-left: 4px solid var(--callout-color, var(--color-cyan));
}

/* Tabelle delle dashboard (Dataview/standalone): header marcato + zebra leggera +
   numeri tabulari → leggibili a colpo d'occhio (sono ciò che si vede di più all'inizio). */
.markdown-rendered table { font-variant-numeric: tabular-nums; }
.markdown-rendered table thead th {
  background: var(--background-secondary-alt);
  font-weight: 600;
}
.markdown-rendered .table-view-table tbody tr:nth-child(2n),
.block-language-dataview tbody tr:nth-child(2n) {
  background: var(--background-secondary);
}
/* L'infobox resta una scheda-fatti pulita (niente header/zebra): reset locale. */
.callout[data-callout="infobox"] thead th { background: none; font-weight: inherit; }
.callout[data-callout="infobox"] tbody tr { background: none; }
"""


# Accento-colore per categoria (B): ogni gruppo tematico → un colore-tema Obsidian
# (theme-safe, chiaro/scuro). L'infobox di [!infobox|<categoria>] eredita --gdr-accent.
# Presentazione, non dato: vive qui, non in YAML. Categoria non mappata → bordo neutro.
CATEGORY_ACCENTS = {
    "green":  ["luogo", "regno", "bioma", "ecosistema", "risorsa"],          # mondo fisico / natura / economia
    "red":    ["fazione", "culto"],                                          # potere / fede organizzata
    "pink":   ["cultura", "lingua"],                                         # società / popoli
    "orange": ["personaggio", "creatura"],                                   # persone & creature
    "purple": ["cosmologia", "dominio", "legge_fondamentale",                # metafisica & magia
               "entita_primordiale", "piano", "divinita", "sistema_magico"],
    "cyan":   ["epoca", "evento", "mito", "profezia"],                       # tempo / storia / mito
    "blue":   ["classe", "sottoclasse", "specie", "background", "talento",   # regole & scheda 5e
               "incantesimo", "regola", "oggetto", "bastione"],
    "yellow": ["incontro", "insidia", "sessione"],                          # al tavolo / gioco
}


def category_accent_css() -> str:
    """Regole CSS per-categoria (B): impostano --gdr-accent sull'infobox in base al
    metadato del callout ([!infobox|<categoria>] → data-callout-metadata)."""
    lines = ["", "/* B — accento per categoria (generato da CATEGORY_ACCENTS). */"]
    for color, cats in CATEGORY_ACCENTS.items():
        for cat in cats:
            lines.append(
                f'.callout[data-callout="infobox"][data-callout-metadata="{cat}"]'
                f' {{ --gdr-accent: var(--color-{color}); }}')
    return "\n".join(lines) + "\n"


def callout_appearance_css(plugins: dict[str, Any]) -> str:
    """Aspetto dei callout GDR via CSS NATIVO Obsidian: `--callout-icon` (nome Lucide
    SENZA prefisso, l'unico formato che la variabile accetta) e `--callout-color`.
    Theme-safe, applicato al render, senza dipendere da Callout Manager. L'infobox
    prende il colore dall'accento-categoria (--gdr-accent), qui solo l'icona."""
    lines = ["", "/* Callout GDR: icona + colore nativi (da plugins.yaml:callouts). */"]
    for c in plugins.get("callouts", []) or []:
        decls = [f"--callout-icon: {c['icon']};"]
        if c["id"] != "infobox":
            decls.append(f"--callout-color: {c['color']};")
        lines.append(f'.callout[data-callout="{c["id"]}"] {{ {" ".join(decls)} }}')
    return "\n".join(lines) + "\n"


def write_workspace_chrome(obsidian: Path, plugins: dict[str, Any]) -> None:
    """Pulizia dell'esploratore: snippet CSS che nasconde le z.* + esclusione da
    ricerca/grafo/suggerimenti (userIgnoreFilters). Tutto non distruttivo. Il CSS è
    il base statico + accento per-categoria (B) + aspetto dei callout GDR."""
    write_text(obsidian / "snippets" / "gdr.css",
               HIDE_FOLDERS_SNIPPET + category_accent_css() + callout_appearance_css(plugins))
    union_list_key(obsidian / "appearance.json", "enabledCssSnippets", ["gdr"])
    union_list_key(obsidian / "app.json", "userIgnoreFilters", [f"{d}/" for d in HIDDEN_DIRS])


# --- Accento-colore per categoria → preset JSON Canvas ----------------------
# Colore-categoria → preset JSON Canvas (1 rosso, 2 arancio, 3 giallo, 4 verde,
# 5 ciano, 6 viola). Riusa i gruppi tematici di CATEGORY_ACCENTS (presentazione).
_CANVAS_PRESET = {"green": "4", "red": "1", "pink": "6", "orange": "2",
                  "purple": "6", "cyan": "5", "blue": "5", "yellow": "3"}


def _canvas_color(category: str) -> str:
    for color, cats in CATEGORY_ACCENTS.items():
        if category in cats:
            return _CANVAS_PRESET.get(color, "")
    return ""


def canvas_colors() -> dict[str, str]:
    """Mappa piatta categoria→preset-colore Canvas (1..6), derivata dalla STESSA
    sorgente di `_canvas_color` (CATEGORY_ACCENTS×_CANVAS_PRESET). Esportata in
    core.json così l'azione runtime `world_board` (JS) colora le card dei mondi
    dell'utente IDENTICA al World Board del mondo-esempio (build-time). Sorgente
    unica: il test di parità impone che JS e Python diano lo stesso canvas."""
    return {cat: _CANVAS_PRESET[color]
            for color, cats in CATEGORY_ACCENTS.items()
            for cat in cats if color in _CANVAS_PRESET}
