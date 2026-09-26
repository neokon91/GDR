"""I generatori dei sidecar del plugin leggono DAVVERO l'archivio.

Dopo le migrazioni dell'archivio di set 2026 (id puntati, `.md` per le note, niente più
suffissi `*.spell.yaml`) i generatori globbavano i vecchi nomi e leggevano 0 file: il plugin
usciva senza condizioni, incantesimi, sottoclassi né oggetti magici, e la build era verde.
Qui le soglie stanno sotto i conteggi reali (17, 339, 12, 256): scendere a zero è un errore.
"""

from pathlib import Path

import pytest

import archivio_io

SRD = Path(__file__).resolve().parents[1] / "archivio" / "srd"

pytestmark = pytest.mark.skipif(not SRD.is_dir(), reason="archivio assente (symlink/checkout fratello)")


@pytest.mark.parametrize(
    ("cartella", "tipo", "minimo"),
    [
        ("glossario/condizioni", "condizione", 15),
        ("spells", "incantesimo", 300),
        ("subclasses", "sottoclasse", 12),
        ("magic_items", "oggetto-magico", 200),
        ("classi", "classe", 12),
    ],
)
def test_ogni_tipo_ha_le_sue_voci(cartella, tipo, minimo):
    assert len(archivio_io.voci(SRD / cartella, tipo)) >= minimo


def test_una_nota_md_porta_il_corpo_in_descrizione():
    [(_, benedetto)] = [v for v in archivio_io.voci(SRD / "glossario" / "condizioni", "condizione") if v[1]["id"] == "dnd.condizione.benedetto"]
    assert benedetto["nome"] == "Benedetto" and "1d4" in benedetto["descrizione"]


def test_il_tipo_si_legge_dall_id_non_dalla_cartella():
    # nella cartella degli incantesimi non c'è nessuna condizione
    assert archivio_io.voci(SRD / "spells", "condizione") == []
