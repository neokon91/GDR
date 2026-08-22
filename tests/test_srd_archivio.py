"""Test della migrazione SRD → archivio (audit A1): la redirezione di `load_srd`,
la prosa dell'archivio nell'auto-link (già coi propri `[[ ]]`) e lo `scaling` come
stringa. Categorie mappate in `build_srd._ARCHIVIO_SUBDIR`."""

import re

import build_srd as bs


def test_autolink_preserva_i_collegamenti_gia_presenti():
    """La prosa dell'archivio porta già `[[wikilink]]` e `[termine]`: l'auto-link non
    deve annidarli (`[[[[…]]]]`) ma può linkare le parole FUORI dalle parentesi."""
    idx = {"invisibile": "Invisibile", "cubo": "Cubo", "nascondersi": "Nascondersi"}
    rx = bs.autolink_regex(idx)
    out = bs.autolink("se è [[invisibile]] non può [cubo] ma prova a nascondersi", rx, idx, "X", set())
    assert "[[invisibile]]" in out          # wikilink esistente intatto
    assert "[cubo]" in out                  # bracket singolo intatto
    assert "[[[[" not in out and "[[[" not in out  # nessun annidamento
    assert "[[Nascondersi|nascondersi]]" in out    # parola fuori-parentesi linkata


def test_scaling_stringa_reso_come_callout():
    """`srd_note` accetta lo `scaling` come STRINGA (forma archivio), non solo lista."""
    entry = {"nome": "X", "descrizione": "Un incantesimo.",
             "scaling": "**Slot superiore**\nDanni +1d8 per slot."}
    out = bs.srd_note(entry, "srd-incantesimo", [])
    assert "> [!tip]- Potenziamento" in out
    assert "**Slot superiore**" in out
    assert "`dice: 1d8`" in out  # i dadi restano cliccabili


def test_spells_arrivano_dallarchivio():
    """La categoria spells è mappata su archivio: >300 voci e i nomi CLASSICI
    dell'archivio (non i generici del JSON)."""
    spells = bs.load_srd("srd_5_2_1_spells.json")
    if not spells:
        import pytest
        pytest.skip("archivio/JSON spells assenti")
    assert len(spells) > 300
    nomi = {str(s.get("nome")) for s in spells}
    assert "Tocco Vampirico" in nomi          # nome classico dell'archivio
    assert "Tocco del vampiro" not in nomi     # generico del JSON, ritirato
