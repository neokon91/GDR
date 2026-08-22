"""Test GDR — gen_bestiario. Il reader del bestiario SRD deve seguire la migrazione
dell'archivio (cartella `srd/monsters/`→`srd/mostro/`, file `<slug>.monster.yaml`→
`<slug>.yaml`) senza rompersi: è nello step `gen:bestiario` della build del plugin."""

from pathlib import Path

import pytest

import gen_bestiario


def test_carica_mostri_dai_dati_reali():
    """Sui dati reali dell'archivio: ~334 mostri, tutti con id, nessun duplicato,
    id qualificati (`dnd.mostro.*`) preservati dal frontmatter."""
    src = gen_bestiario.SRD_MONSTERS
    if not src.is_dir():
        pytest.skip(f"archivio non presente ({src})")
    mostri = gen_bestiario.carica_mostri(src)
    assert len(mostri) > 300
    ids = [m["id"] for m in mostri]
    assert all(ids), "ogni mostro deve avere un id (frontmatter o slug)"
    assert len(ids) == len(set(ids)), "nessun id duplicato"
    # La migrazione qualifica gli id `dnd.mostro.<slug>`: se ce ne sono, restano intatti.
    assert all("." not in i or i.startswith("dnd.mostro.") for i in ids)


def test_qualificato_vince_sul_legacy(tmp_path: Path):
    """A parità di slug, `<slug>.yaml` (qualificato) scavalca `<slug>.monster.yaml`."""
    (tmp_path / "goblin.monster.yaml").write_text(
        "nome: Goblin\ngenerata: true\ngs: 1\n", encoding="utf-8"
    )
    (tmp_path / "goblin.yaml").write_text(
        "id: dnd.mostro.goblin\nnome: Goblin\ngs: 1\n", encoding="utf-8"
    )
    mostri = gen_bestiario.carica_mostri(tmp_path)
    assert len(mostri) == 1
    assert mostri[0]["id"] == "dnd.mostro.goblin"
    assert "generata" not in mostri[0], "deve vincere il file qualificato, non il legacy"


def test_id_dallo_slug_quando_manca_nel_frontmatter(tmp_path: Path):
    """Un legacy senza `id` lo prende dallo slug del file (senza suffisso `.monster`)."""
    (tmp_path / "arpia.monster.yaml").write_text(
        "nome: Arpia\ngenerata: true\ngs: 1\n", encoding="utf-8"
    )
    mostri = gen_bestiario.carica_mostri(tmp_path)
    assert mostri[0]["id"] == "arpia"
