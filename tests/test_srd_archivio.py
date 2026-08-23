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


def test_norm_ref_equivalenza_convenzioni():
    """`_norm_ref` rende equivalenti le forme con cui una voce può essere citata:
    id qualificato `dnd.<tipo>.<slug>`, nudo, o con underscore."""
    assert bs._norm_ref("dnd.mostro.insetto-gigante") == "insetto-gigante"
    assert bs._norm_ref("insetto_gigante") == "insetto-gigante"
    assert bs._norm_ref("Insetto-Gigante") == "insetto-gigante"
    assert bs._norm_ref(None) == ""


def test_risolvi_id_tollerante_qualificato_e_nudo():
    """`_risolvi_id` risolve un riferimento in QUALSIASI convenzione contro un indice
    che tiene sia l'id completo sia la forma normalizzata. Il match esatto ha priorità."""
    links = {"dnd.glossario.armature": "Armature", "insetto-gigante": "Insetto gigante"}
    # forma normalizzata iniettata dall'indice (simula srd_id_index)
    links["armature"] = "Armature"
    assert bs._risolvi_id(links, "dnd.glossario.armature") == "Armature"  # qualificato esatto
    assert bs._risolvi_id(links, "dnd.regole.armature") == "Armature"     # tipo diverso → via norm
    assert bs._risolvi_id(links, "insetto_gigante") == "Insetto gigante"  # underscore → norm
    assert bs._risolvi_id(links, "dnd.mostro.inesistente") is None        # nessuna voce
    assert bs._risolvi_id(None, "x") is None


def test_srd_id_index_indicizza_qualificato_e_normalizzato():
    """L'indice id espone ogni voce SIA per id completo SIA per forma normalizzata
    (se non ambigua): un `vedi_anche`/`creatura_evocata` in forma qualificata, nuda o
    con underscore risolve alla stessa scheda."""
    idx = bs.srd_id_index()
    if not idx:
        import pytest
        pytest.skip("archivio/JSON SRD assenti")
    # 'Insetto gigante' è un mostro citato da un incantesimo come `insetto_gigante`.
    assert bs._risolvi_id(idx, "insetto_gigante") == "Insetto gigante"
    assert bs._risolvi_id(idx, "dnd.mostro.insetto-gigante") == "Insetto gigante"


def test_vedi_anche_risolve_forme_miste():
    """Il footer «Vedi anche» linka [[Nome]] anche quando il riferimento usa una
    convenzione diversa da quella con cui la voce è indicizzata."""
    links = {"salto-in-alto": "Salto in alto"}
    out = bs._vedi_anche(["dnd.glossario.salto-in-alto"], links)
    assert "[[Salto in alto]]" in out
    # riferimento irrisolvibile → termine in chiaro (underscore→spazio), niente wikilink
    out2 = bs._vedi_anche(["termine_ignoto"], links)
    assert "[[" not in out2 and "termine ignoto" in out2


def test_risolvi_wikilink_id_slug_in_prosa():
    """I wikilink della prosa che puntano per ID/slug/path diventano `[[Nome]]` canonico
    (le pagine sono nominate per Nome). Forme dell'archivio: qualificato, nudo, con path,
    con underscore. Alias esplicito preservato; non-risolvibili e parentesi singole intatti."""
    links = {"dnd.condizione.prono": "Prono", "prono": "Prono",
             "luce-intensa": "Luce intensa", "costrizione": "Costrizione"}
    r = lambda t: bs._risolvi_wikilink(t, links)
    assert r("è [[dnd.condizione.prono]] a terra") == "è [[Prono]] a terra"
    assert r("proietta [[luce-intensa]]") == "proietta [[Luce intensa]]"
    assert r("[[incantesimi/costrizione]]") == "[[Costrizione]]"           # forma path
    assert r("[[dnd.condizione.prono|proni]]") == "[[Prono|proni]]"        # alias preservato
    assert r("[[dnd.condizione.prono|Prono]]") == "[[Prono]]"              # alias==Nome → collassa
    assert r("[[Ignoto]] e [singola]") == "[[Ignoto]] e [singola]"         # irrisolvibile + bracket singolo


def test_srd_note_converte_wikilink_qualificati_della_prosa():
    """`srd_note` rende i `[[dnd.tipo.slug]]` della prosa come link per Nome, usando l'indice id."""
    links = {"dnd.condizione.accecato": "Accecato", "accecato": "Accecato"}
    entry = {"nome": "Condizione", "descrizione": "Vedi [[dnd.condizione.accecato]]."}
    out = bs.srd_note(entry, "srd-glossario", [], links)
    assert "[[Accecato]]" in out
    assert "[[dnd.condizione.accecato]]" not in out
    assert "[[[[" not in out  # nessun annidamento con l'autolink


def test_magic_items_da_archivio_con_sintonia():
    """La categoria oggetti magici è mappata su archivio: >200 voci, con prosa e la
    sintonia derivata da `richiede_sintonia`."""
    items = bs.load_srd("srd_5_2_1_magic_items.json")
    if not items:
        import pytest
        pytest.skip("archivio/JSON magic_items assenti")
    assert len(items) > 200
    baston = next((x for x in items if str(x.get("nome")).lower() == "bastone del fuoco"), None)
    assert baston and baston.get("richiede_sintonia") is True
    assert isinstance(baston.get("descrizione"), str) and baston["descrizione"].strip()
