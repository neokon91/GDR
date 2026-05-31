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
