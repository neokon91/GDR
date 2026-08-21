"""Anti-drift dei tipi TS generati del plugin (`plugin/core.d.ts`).

`gen_plugin_types.core_dts()` deriva i tipi dal modello (vocabolari + shape di core.json).
Il file committato DEVE combaciare col rigenerato: se il modello cambia (una categoria, uno
stato, un pannello, un'azione, un template) e non si rigenera, il plugin resta con tipi
stantii. Rigenera con `npm run gen:types` (o `npm run build:plugin`)."""
from __future__ import annotations

from pathlib import Path

import pytest

import gen_plugin_types

CORE_DTS = Path(gen_plugin_types.OUT)


def test_core_dts_up_to_date():
    """`plugin/core.d.ts` combacia con l'output fresco del generatore (nessuna deriva)."""
    assert CORE_DTS.is_file(), "plugin/core.d.ts mancante — esegui `npm run gen:types`"
    atteso = gen_plugin_types.core_dts()
    trovato = CORE_DTS.read_text(encoding="utf-8")
    assert trovato == atteso, (
        "plugin/core.d.ts è disallineato dal modello — rigeneralo con `npm run gen:types`")


def test_core_dts_covers_vocabularies():
    """I vocabolari chiave finiscono davvero nei tipi (guardia contro un generatore rotto
    che emette union vuote): Categoria, Stato, PanelName, TemplateId, AzioneId."""
    dts = gen_plugin_types.core_dts()
    for t in ("Categoria", "Stato", "PanelName", "TemplateId", "AzioneId", "CoreData"):
        assert f"export type {t} " in dts or f"export interface {t} " in dts, f"manca {t}"
    # Alcune voci concrete note del modello (se spariscono, il modello o il generatore è rotto).
    for lit in ("'creatura'", "'bozza'", "'renderEntityPanel'", "'pg'", "'marca_canonico'"):
        assert lit in dts, f"vocabolo atteso assente dai tipi: {lit}"
