"""La copia vendorizzata dell'SRD (`Dev/Source/SRD/`): la build di GDR, che è pubblico,
legge solo lei. Qui si prova che lo specchio è esatto (nuovi, cambiati, spariti), che
non tocca i file propri della copia, che porta solo dati, e — quando l'archivio è
accanto — che la copia non è rimasta indietro."""

from pathlib import Path

import pytest

import sync_srd
from common import ARCHIVIO_SRD, SRD_DIR


def _scrivi(radice: Path, rel: str, testo: str) -> None:
    f = radice / rel
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(testo, encoding="utf-8")


def test_lo_specchio_copia_aggiorna_e_cancella_ma_non_tocca_la_licenza(tmp_path):
    src, dst = tmp_path / "srd", tmp_path / "copia"
    _scrivi(src, "mostro/goblin.yaml", "id: dnd.mostro.goblin\n")
    _scrivi(src, "spells/luce.md", "---\nid: dnd.incantesimo.luce\n---\nLuce.\n")
    _scrivi(src, "immagine.png", "x")
    _scrivi(dst, "mostro/goblin.yaml", "id: vecchio\n")
    _scrivi(dst, "vecchio/sparito.yaml", "id: dnd.mostro.sparito\n")
    _scrivi(dst, "LICENSE_SRD", "CC-BY")

    assert sync_srd.differenze(src, dst) == (["spells/luce.md"], ["mostro/goblin.yaml"], ["vecchio/sparito.yaml"])
    assert sync_srd.sincronizza(src, dst) == (1, 1, 1)
    assert sync_srd.differenze(src, dst) == ([], [], [])
    assert (dst / "mostro/goblin.yaml").read_text() == "id: dnd.mostro.goblin\n"
    assert not (dst / "vecchio").exists()
    assert (dst / "LICENSE_SRD").read_text() == "CC-BY"
    assert not (dst / "immagine.png").exists()
    assert sync_srd.estranei(src) == ["immagine.png"]


def test_la_copia_porta_solo_dati_srd_e_la_licenza():
    file = [p for p in SRD_DIR.rglob("*") if p.is_file()]
    assert len(file) > 1000
    assert {p.suffix for p in file if p.name != "LICENSE_SRD"} <= {".yaml", ".md"}
    assert (SRD_DIR / "LICENSE_SRD").is_file()


@pytest.mark.skipif(not ARCHIVIO_SRD.is_dir(), reason="archivio assente: la deriva la controlla la CI notturna")
def test_la_copia_e_allineata_all_archivio():
    nuovi, cambiati, spariti = sync_srd.differenze()
    assert (nuovi, cambiati, spariti) == ([], [], []), "copia SRD indietro: `npm run sync-srd`"
