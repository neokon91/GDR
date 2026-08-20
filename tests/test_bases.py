"""Test della generazione Bases (.base) per le pagine-indice.

bases_doc(page) è puro (dalla single-source pages.yaml): lo validiamo senza
buildare sul vault. Verifica: schema della vista, colonne, filtro categoria,
sort, e serializzabilità YAML (un .base è un file YAML)."""
import yaml

import render


def test_bases_doc_wellformed():
    for page in render.load_pages():
        doc = render.bases_doc(page)
        assert isinstance(doc.get("views"), list) and doc["views"], page["id"]
        view = doc["views"][0]
        assert view["type"] == "table"
        # 'Nome' (file) + tutte le colonne della pagina (nome nudo nell'order).
        assert view["order"][0] == "file.name"
        for col in page.get("columns", []) or []:
            assert col["field"] in view["order"], (page["id"], col["field"])
            # displayName mappato con la chiave risolta note.<campo>.
            assert doc["properties"][f"note.{col['field']}"]["displayName"] == col["label"]
        # Filtro: categoria della pagina + esclusione archiviate.
        filt = doc["filters"]["and"]
        assert any(f'"{page["category"]}"' in f for f in filt), page["id"]
        assert any("archiviata" in f for f in filt), page["id"]
        # Un .base è YAML: deve fare round-trip identico.
        assert yaml.safe_load(yaml.safe_dump(doc, allow_unicode=True)) == doc


def test_bases_doc_sort_direction():
    pages = {p["id"]: p for p in render.load_pages()}
    # atlante: 'pressione desc' -> DESC; cronologia: 'quando asc' -> ASC.
    desc = render.bases_doc(pages["atlante"])["views"][0]["sort"][0]
    assert desc == {"property": "pressione", "direction": "DESC"}
    asc = render.bases_doc(pages["cronologia"])["views"][0]["sort"][0]
    assert asc == {"property": "quando", "direction": "ASC"}


def test_bases_cards_view_when_cover():
    """Pagina con `cover` (ritratto|banner) → oltre alla table, una vista GALLERIA
    (cards) con `image` = proprietà nuda, imageFit cover. La table resta la PRIMA
    vista (default). Le pagine senza cover restano solo-table. (Niente groupBy: in
    Obsidian 1.12 romperebbe la .base — verificato dal vivo.)"""
    pages = {p["id"]: p for p in render.load_pages()}
    # Bestiario ha cover: ritratto.
    views = render.bases_doc(pages["bestiario"])["views"]
    assert views[0]["type"] == "table"                       # table sempre prima (default)
    cards = [v for v in views if v["type"] == "cards"]
    assert len(cards) == 1
    c = cards[0]
    assert c["image"] == "ritratto"                          # proprietà nuda (non note.ritratto)
    assert c["imageFit"] == "cover"
    assert "groupBy" not in c                                # niente groupBy (rompe 1.12)
    assert c["order"][0] == "file.name"
    # Atlante usa il banner come copertina.
    atl_cards = [v for v in render.bases_doc(pages["atlante"])["views"] if v["type"] == "cards"]
    assert atl_cards and atl_cards[0]["image"] == "banner"
    # Pagine senza cover (es. risorse, cronologia): nessuna vista cards.
    for pid in ("risorse", "cronologia"):
        assert all(v["type"] != "cards" for v in render.bases_doc(pages[pid])["views"]), pid


def test_bases_per_view_filters():
    """Le liste secondarie dell'hub sono ora viste .base con FILTRO PER-VISTA (ritiro
    Dataview): «🔥 Fronti caldi» (pressione >= 5) solo dove la categoria ha `pressione`
    fra le colonne; «Bozze da rifinire» (stato == bozza) ovunque."""
    pages = {p["id"]: p for p in render.load_pages()}
    def named(pid, name):
        return next((v for v in render.bases_doc(pages[pid])["views"] if v["name"] == name), None)
    # Fazioni ha pressione → ha «Fronti caldi» col filtro di vista.
    fc = named("fazioni", "🔥 Fronti caldi")
    assert fc and fc["filters"]["and"] == ["pressione >= 5"]
    assert fc["sort"][0] == {"property": "pressione", "direction": "DESC"}
    # Cronologia (evento) NON ha pressione fra le colonne → niente «Fronti caldi».
    assert named("cronologia", "🔥 Fronti caldi") is None
    # «Bozze» presente ovunque, filtrata su stato == bozza.
    for pid in ("fazioni", "cronologia", "risorse"):
        bz = named(pid, "Bozze da rifinire")
        assert bz and bz["filters"]["and"] == ['stato == "bozza"'], pid
