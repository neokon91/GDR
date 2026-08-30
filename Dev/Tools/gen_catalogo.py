"""Genera il CATALOGO del creatore PG che il plugin `gdr` carica per chiamare il kernel condiviso.

Tier 3 Fase B. Il kernel di creazione PG (`regole/src/creatore`, `assembla(pg, fonti)`) lavora su un
`Catalogo` — i dati "magri" (soli campi meccanici, niente prosa) di classi/specie/background/
sottoclassi/talenti/lingue/incantesimi/oggetti. Oggi quel catalogo lo costruisce SOLO Astro
(`Compendio/src/creatore/caricatore.ts`) a build con `import.meta.glob`. Questo script fa lo STESSO
lavoro in Python — replica i costruttori del caricatore — e ne scrive un `plugin/data/srd_catalogo.json`
che il plugin (`loadCatalogo`) legge a runtime, così può chiamare `assembla` come fa `gen_bestiario`
per il combattimento.

FONTE: solo il CORE SRD di archivio, letto PER CARTELLA (`srd/classi`, `srd/specie`, `srd/background`,
`srd/subclasses`, `srd/talenti`, `srd/lingue`, `srd/spells`, `srd/equipaggiamento`, `srd/magic_items`).
⚠️ Il naming di archivio è incoerente (il core SRD usa cartella+slug piano — `classi/barbaro.yaml` —
mentre `books/` e gli spell usano suffissi puntati — `.subclass.yaml`); il caricatore Compendio globba i
suffissi puntati e col reorg NON pesca più il core. Qui leggo per cartella, che è dove il core vive
davvero. Ignoro i contenuti `books/` (homebrew/licenziati, non condivisibili nel bundle).

Il DATO vive in ARCHIVIO; qui c'è solo il meccanismo che lo normalizza per il motore. La forma di output
è il tipo `Catalogo` di `regole/src/creatore/catalogo.ts` — se quel tipo cambia, aggiorna qui.

Uso: python3 Dev/Tools/gen_catalogo.py   (oppure `npm run gen:catalogo`, incluso nella build)
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD = ROOT / "archivio" / "srd"
OUT = ROOT / "plugin" / "data" / "srd_catalogo.json"


def _d(x: Any) -> dict:
    """`x` se è un dict, altrimenti {} — i dati sporchi non devono far crashare (un campo
    strutturato può arrivare come stringa/None: lo trattiamo come assente, non un errore)."""
    return x if isinstance(x, dict) else {}


# --- Normalizzatori (la "rete di sicurezza" del caricatore) ------------------

def caratt(x: Any) -> str:
    """Nome di caratteristica → chiave minuscola (`Forza` → `forza`)."""
    return str(x).strip().lower()


def slug_abilita(x: Any) -> str:
    """Nome di abilità → slug: minuscolo, senza accenti, spazi come trattini."""
    s = str(x).strip().lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c))
    return re.sub(r"\s+", "-", s)


def facce_dado(x: Any) -> int:
    """Facce del dado vita: accetta `10` o `"d10"` → `10`."""
    if isinstance(x, (int, float)):
        return int(x)
    m = re.search(r"(\d+)", str(x))
    return int(m.group(1)) if m else 0


def velocita_norm(x: Any) -> dict:
    """Velocità: oggetto `{camminata: 9}`, o `"9 m"`, o `9` → sempre oggetto."""
    if isinstance(x, dict):
        return x
    m = re.search(r"(\d+)", str(x))
    return {"camminata": int(m.group(1)) if m else 0}


def taglia_norm(x: Any) -> Any:
    """Taglia: minuscola; resta stringa o array com'è nei dati."""
    if isinstance(x, list):
        return [str(t).lower() for t in x]
    return str(x).lower()


def effetti_passivi(d: dict) -> list:
    """Gli EFFETTI PASSIVI di una voce, da entrambe le forme: `effetti` top-level
    e `attivita` con `tipo: passivo` (la condizione dell'attività scende sugli effetti)."""
    da_top = d.get("effetti") or []
    da_attivita = []
    for a in d.get("attivita") or []:
        if isinstance(a, dict) and a.get("tipo") == "passivo":
            for e in a.get("effetti") or []:
                e = dict(e)
                e.setdefault("condizione", a.get("condizione"))
                if e["condizione"] is None:
                    del e["condizione"]
                da_attivita.append(e)
    return [*da_top, *da_attivita]


def attivabili_di(d: dict) -> list:
    """Le attività ATTIVABILI (l'Ira): non passive, si accendono — tenute a parte."""
    out = []
    for a in d.get("attivita") or []:
        if isinstance(a, dict) and a.get("tipo") == "attivabile":
            voce = {"effetti": a.get("effetti") or []}
            if a.get("durata") is not None:
                voce["durata"] = a["durata"]
            if a.get("condizione") is not None:
                voce["condizione"] = a["condizione"]
            out.append(voce)
    return out


def opzioni_equip(opzioni: Any) -> list:
    """Le opzioni di equipaggiamento iniziale, dalle due forme (`scelte`/`oggetti`) → `voci`."""
    if not isinstance(opzioni, list):
        return []
    out = []
    for o in opzioni:
        if not isinstance(o, dict):
            continue
        raw = o.get("scelte") if isinstance(o.get("scelte"), list) else (
            o.get("oggetti") if isinstance(o.get("oggetti"), list) else []
        )
        voci = []
        for v in raw:
            v = v if isinstance(v, dict) else {}
            art = v.get("articolo")
            voce = {
                "articolo": [str(x) for x in art] if isinstance(art, list) else str(art or "")
            }
            if v.get("quantita") is not None:
                voce["quantita"] = v["quantita"]
            voci.append(voce)
        out.append({"nome": str(o.get("nome") or ""), "voci": voci})
    return out


def arma_di(d: dict) -> dict:
    """I dati d'arma per l'attacco. La categoria sta in `categoria` o in `tipo`."""
    cat = str(d.get("categoria") or d.get("tipo") or "")
    danno = _d(d.get("danno"))
    prop = d.get("proprieta")
    return {
        "dado": str(danno.get("dado") or ""),
        "distanza": bool(re.search(r"distanza", cat, re.I)),
        "guerra": bool(re.search(r"guerra", cat, re.I)),
        "proprieta": prop if isinstance(prop, list) else [],
    }


def comp_armi(lista: Any) -> list:
    """Le competenze in armi: stringa (`armi-da-guerra`) o {categoria, proprieta} → CompArma."""
    if not isinstance(lista, list):
        return []
    out = []
    for e in lista:
        grezzo = e if isinstance(e, str) else str((e or {}).get("categoria") or "")
        categoria = "guerra" if re.search(r"guerra", grezzo, re.I) else "semplice"
        if isinstance(e, str):
            out.append({"categoria": categoria})
        else:
            voce = {"categoria": categoria}
            if e.get("proprieta") is not None:
                voce["proprieta"] = e["proprieta"]
            out.append(voce)
    return out


def caratteristica_incantatore(d: dict) -> str | None:
    """La caratteristica da incantatore, dall'attività `incantatore` di un privilegio."""
    for priv in d.get("privilegi") or []:
        for a in (priv or {}).get("attivita") or []:
            if isinstance(a, dict) and a.get("tipo") == "incantatore" and a.get("caratteristica"):
                return caratt(a["caratteristica"])
    return None


_NON_COLONNE = {
    "livello", "privilegi", "trucchetti_conosciuti", "incantesimi_preparati", "slot_incantesimo",
}


def colonne_di(riga: dict) -> dict | None:
    """Le colonne extra NUMERICHE di una riga di progressione (danni_ira, numero_ira…)."""
    out = {}
    for k, v in (riga or {}).items():
        if k not in _NON_COLONNE and isinstance(v, (int, float)) and not isinstance(v, bool):
            out[k] = v
    return out or None


def slot_di(riga: dict) -> list | None:
    """Gli slot incantesimo di una riga: da `{livello1: 2, …}` a un array indicizzato da 0."""
    s = (riga or {}).get("slot_incantesimo")
    if not isinstance(s, dict):
        return None
    return [int(s.get(f"livello{i + 1}") or 0) for i in range(9)]


# --- Costruttori: dato grezzo YAML → Fonte magra -----------------------------

def costruisci_classe(d: dict) -> dict:
    ca = d.get("competenze_abilita")
    comp_armature = d.get("competenze_armature")
    car_inc = caratteristica_incantatore(d)
    voce = {
        "id": d["id"],
        "nome": d["nome"],
        "dado_vita": facce_dado(d.get("dado_vita")),
        "tiri_salvezza": [caratt(x) for x in d.get("tiri_salvezza") or []],
        "competenze_abilita": (
            {"quantita": ca.get("quantita") or 0, "scelte": [slug_abilita(x) for x in ca.get("scelte") or []]}
            if isinstance(ca, dict) else None
        ),
        "competenze_armi": comp_armi(d.get("competenze_armi")),
        "competenze_armature": [x for x in comp_armature if isinstance(x, str)] if isinstance(comp_armature, list) else [],
        "equipaggiamento": opzioni_equip(d.get("equipaggiamento_iniziale")),
        "progressione": [
            {
                "livello": b.get("livello"),
                "privilegi": b.get("privilegi") or [],
                "trucchetti": b.get("trucchetti_conosciuti"),
                "preparati": b.get("incantesimi_preparati"),
                "slot": slot_di(b),
                "colonne": colonne_di(b),
            }
            for b in (_d(d.get("tabella_progressione")).get("benefici") or [])
        ],
        "definizioni_privilegi": {
            defn["id"]: {
                "nome": defn.get("nome") or defn["id"],
                "effetti": effetti_passivi(defn),
                **({"attivabili": attivabili_di(defn)} if attivabili_di(defn) else {}),
            }
            for defn in (d.get("privilegi") or [])
            if isinstance(defn, dict) and defn.get("id")
        },
    }
    if car_inc:
        voce["incantesimi"] = {"caratteristica": car_inc}
    return voce


def costruisci_background(d: dict) -> dict:
    comp = _d(d.get("competenze"))
    strumenti = comp.get("strumenti")
    voce = {
        "id": d["id"],
        "nome": d["nome"],
        "punteggi_caratteristica": [caratt(x) for x in d.get("punteggi_caratteristica") or []],
        "competenze": {
            "abilita": [slug_abilita(x) for x in comp.get("abilita") or []],
        },
        "equipaggiamento": opzioni_equip(_d(d.get("equipaggiamento_alternativo")).get("scelte")),
    }
    if d.get("talento_origine"):
        voce["talento_origine"] = slug_abilita(d["talento_origine"])
    if strumenti is not None:
        lista = strumenti if isinstance(strumenti, list) else [strumenti]
        voce["competenze"]["strumenti"] = [str(x) for x in lista]
    return voce


def costruisci_specie(d: dict) -> dict:
    return {
        "id": d["id"],
        "nome": d["nome"],
        "taglia": taglia_norm(d.get("taglia")),
        "velocita": velocita_norm(d.get("velocita")),
        "tratti": [
            {"id": t.get("id"), "nome": t.get("nome"), "effetti": effetti_passivi(t)}
            for t in d.get("tratti") or []
            if isinstance(t, dict)
        ],
    }


def costruisci_sottoclasse(d: dict) -> dict:
    prep = []
    for g in d.get("incantesimi") or []:
        if not isinstance(g, dict):
            continue
        ids = [x for x in g.get("incantesimi_preparati") or [] if isinstance(x, str)]
        if ids:
            prep.append({"livello": g.get("livello") if isinstance(g.get("livello"), int) else 0, "ids": ids})
    voce = {
        "id": d["id"],
        "nome": d["nome"],
        "classe": d.get("classe"),
        "privilegi": [
            {"livello": p.get("livello"), "id": p.get("id"), "nome": p.get("nome")}
            for p in d.get("privilegi") or []
            if isinstance(p, dict)
        ],
    }
    if prep:
        voce["incantesimi_preparati"] = prep
    return voce


# --- Lettura per cartella → Catalogo -----------------------------------------

# Cartella oggetti → sezione del compendio (per linkarlo dalla scheda; irrilevante al motore).
_CARTELLA_A_SEZIONE = {
    "armi": "armi",
    "armature": "armature",
    "item": "oggetti",
    "tool": "strumenti",
    "cavalcature": "cavalcature",
    "veicoli": "veicoli",
    "magic_items": "oggetti",
}


def _leggi(path: Path) -> dict | None:
    d = yaml.safe_load(path.read_text(encoding="utf-8"))
    return d if isinstance(d, dict) else None


def _id_da_file(path: Path) -> str:
    """L'id dal nome-file: primo segmento prima del punto (`aculeo-mentale.spell.yaml`)."""
    return path.name.split(".")[0]


def _da_cartella(sub: str, glob: str, costruisci) -> list:
    """Legge srd/<sub>/<glob>, costruisce con `costruisci` le voci con `id`, ordina per nome."""
    voci = []
    for f in sorted((SRD / sub).glob(glob)):
        d = _leggi(f)
        if d and d.get("id") and d.get("nome"):
            voci.append(costruisci(d))
    return voci


def _lingue() -> list:
    """Le lingue: dal singolo file aggregato srd/lingue/lingue.yaml, appiattendo le liste."""
    d = _leggi(SRD / "lingue" / "lingue.yaml") or {}
    out = []
    for chiave in ("lingue_standard", "lingue_rare"):
        for l in d.get(chiave) or []:
            if isinstance(l, dict) and l.get("id"):
                out.append({"id": str(l["id"]), "nome": str(l.get("nome") or l["id"])})
    return out


def _incantesimi() -> list:
    out = []
    for f in sorted((SRD / "spells").glob("*.spell.yaml")):
        d = _leggi(f)
        if not d:
            continue
        iid = str(d.get("id") or _id_da_file(f))
        voce = {
            "id": iid,
            "nome": str(d.get("nome") or iid),
            "livello": int(d.get("livello") or 0),
            "classi": [str(c) for c in d.get("classi") or []] if isinstance(d.get("classi"), list) else [],
        }
        if d.get("tempo_lancio"):
            voce["tempo_lancio"] = str(d["tempo_lancio"])
        if isinstance(d.get("attivita"), list):
            voce["attivita"] = d["attivita"]
        if d.get("concentrazione") is True:
            voce["concentrazione"] = True
        if d.get("scaling"):
            voce["scaling"] = d["scaling"]
        out.append(voce)
    return out


def _oggetti() -> list:
    """Gli oggetti magri (id→nome; per le armi dado/tipo/proprietà; effetti per le armature).
    Letti per cartella dentro srd/equipaggiamento/* più srd/magic_items."""
    out = []
    fonti = [(f, _CARTELLA_A_SEZIONE.get(sub)) for sub in
             ("armi", "armature", "item", "tool", "cavalcature", "veicoli", "valute")
             for f in sorted((SRD / "equipaggiamento" / sub).glob("*.yaml"))]
    fonti += [(f, _CARTELLA_A_SEZIONE["magic_items"])
              for f in sorted((SRD / "magic_items").glob("*.oggetto-magico.yaml"))]
    for f, sezione in fonti:
        d = _leggi(f)
        if not d:
            continue
        oid = str(d.get("id") or _id_da_file(f))
        voce = {"id": oid, "nome": str(d.get("nome") or oid)}
        if sezione:
            voce["sezione"] = sezione
        if d.get("famiglia"):
            voce["famiglia"] = str(d["famiglia"])
        if _d(d.get("danno")).get("dado"):
            voce["arma"] = arma_di(d)
        eff = effetti_passivi(d)
        if eff:
            voce["effetti"] = eff
        out.append(voce)
    return out


def costruisci_catalogo() -> dict:
    return {
        "classi": _da_cartella("classi", "*.yaml", costruisci_classe),
        "specie": _da_cartella("specie", "*.yaml", costruisci_specie),
        "background": _da_cartella("background", "*.yaml", costruisci_background),
        "sottoclassi": _da_cartella("subclasses", "*.subclass.yaml", costruisci_sottoclasse),
        "talenti": [
            {"id": d.get("id") or _id_da_file(f), "nome": d.get("nome") or _id_da_file(f), "effetti": effetti_passivi(d)}
            for f in sorted((SRD / "talenti").glob("*.yaml"))
            if (d := _leggi(f))
        ],
        "lingue": _lingue(),
        "incantesimi": _incantesimi(),
        "oggetti": _oggetti(),
    }


def main() -> None:
    if not SRD.is_dir():
        raise SystemExit(f"archivio/srd non trovato ({SRD}). Manca il symlink/submodule 'archivio'?")
    cat = costruisci_catalogo()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(cat, ensure_ascii=False), encoding="utf-8")
    conteggi = ", ".join(f"{len(cat[k])} {k}" for k in
                         ("classi", "specie", "background", "sottoclassi", "talenti", "lingue", "incantesimi", "oggetti"))
    print(f"[ok] catalogo SRD → {OUT.relative_to(ROOT)} ({conteggi})")


if __name__ == "__main__":
    main()
