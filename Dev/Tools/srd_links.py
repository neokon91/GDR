"""Helper PURI per i collegamenti SRD, condivisi fra i generatori (build_srd, gen_bestiario)
senza dipendenze fra loro (evita l'import circolare: build_srd importa gen_bestiario).

- `norm_ref`: chiave di confronto tollerante fra le convenzioni con cui una voce è citata —
  qualificato `dnd.<tipo>.<slug>`, nudo, con underscore, con path `incantesimi/<slug>`.
- `risolvi_wikilink`: riscrive i wikilink `[[target]]`/`[[target|alias]]` della prosa al Nome
  canonico usando un RESOLVER (target→Nome|None), così ogni consumatore porta il proprio
  indice (build_srd: l'id-index SRD; gen_bestiario: i nomi dall'archivio)."""

from __future__ import annotations

import re
from typing import Callable

# Wikilink `[[target]]` / `[[target|alias]]` — il target è catturato fino a `|` o `]]`.
_WIKILINK_RE = re.compile(r"\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]")


def norm_ref(idv: object) -> str:
    """Ultimo segmento di un id qualificato `dnd.<tipo>.<slug>` (o di un path `x/slug`),
    underscore→trattino, minuscolo. Rende equivalenti qualificato/nudo/underscore/path."""
    return re.split(r"[./]", str(idv or ""))[-1].replace("_", "-").strip().lower()


def risolvi_wikilink(text: object, resolve: Callable[[str], str | None]) -> str:
    """Riscrive i wikilink della prosa che puntano per id/slug/path al Nome canonico
    (`resolve(target)`), così Obsidian li risolve (le pagine sono nominate per Nome).
    Preserva un alias esplicito; lascia intatto ciò che non risolve (può essere prosa)."""
    s = "" if text is None else str(text)
    if "[[" not in s:
        return s

    def repl(m: "re.Match[str]") -> str:
        target, alias = m.group(1).strip(), (m.group(2) or "").strip()
        nome = resolve(target)
        if not nome:
            return m.group(0)
        return f"[[{nome}|{alias}]]" if alias and alias != nome else f"[[{nome}]]"

    return _WIKILINK_RE.sub(repl, s)
