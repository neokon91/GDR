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


def test_indice_nomi_e_risoluzione_wikilink(tmp_path: Path):
    """indice_nomi + _risolvi_prosa: i wikilink id/slug/path della prosa mostro diventano
    `[[Nome]]` (le pagine SRD sono per Nome). Accento preservato (dal `nome` dell'archivio)."""
    srd = tmp_path / "srd"
    (srd / "spells").mkdir(parents=True)
    (srd / "spells" / "invisibilita.spell.yaml").write_text(
        "id: dnd.incantesimo.invisibilita\nnome: Invisibilità\n", encoding="utf-8")
    idx = gen_bestiario.indice_nomi(srd)
    m = {"nome": "Rakshasa", "azioni": [{"nome": "X", "testo": "Lancia [[incantesimi/invisibilita]]."}]}
    out = gen_bestiario._risolvi_prosa(m, idx)
    assert out["azioni"][0]["testo"] == "Lancia [[Invisibilità]]."
    # id qualificato e forma nuda risolvono uguale; ciò che non c'è resta intatto.
    assert gen_bestiario._risolvi_prosa("[[dnd.incantesimo.invisibilita]]", idx) == "[[Invisibilità]]"
    assert gen_bestiario._risolvi_prosa("[[ignoto]]", idx) == "[[ignoto]]"


def test_bestiario_reale_senza_wikilink_legacy():
    """Sui dati reali: dopo la risoluzione, nessun wikilink legacy `[[incantesimi/…]]`/`[[dnd.…]]`
    nella prosa (tutti risolti a Nome)."""
    src = gen_bestiario.SRD_MONSTERS
    if not src.is_dir():
        pytest.skip("archivio non presente")
    import json, re
    idx = gen_bestiario.indice_nomi(src.parent)
    mostri = [gen_bestiario._risolvi_prosa(m, idx) for m in gen_bestiario.carica_mostri(src)]
    blob = json.dumps(mostri, ensure_ascii=False)
    assert not re.search(r"\[\[incantesimi/", blob)
    assert not re.search(r"\[\[dnd\.", blob)
