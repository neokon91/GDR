#!/usr/bin/env python3
"""Generazione dell'albero SRD/ (sola lettura) dai JSON italiani vendorizzati in
Dev/Source/SRD/. Estratto da render.py: l'orchestratore chiama build_srd(core)."""

from __future__ import annotations

import json
import re
from typing import Any

import yaml

from common import SRD_DIR, VAULT, frontmatter_block, write_text

# --- SRD 5.2.1 (CC-BY-4.0), traduzione italiana ----------------------------
# I JSON tipizzati vendorizzati in Dev/Source/SRD/ (da github massimobarbieri/
# DND-SRD-IT) sono generati in note per-voce in un albero di SOLA LETTURA SRD/,
# separato dall'homebrew. I mostri diventano statblock Fantasy Statblocks.
# Config: { json, dest (sottocartella), cat (categoria), fm (campi -> frontmatter) }.
SRD_GEN = [
    {"json": "srd_5_2_1_spells.json",      "dest": "Incantesimi",     "cat": "srd-incantesimo", "fm": ["livello", "scuola", "classi", "tempo_lancio", "gittata", "componenti", "durata"]},
    {"json": "srd_5_2_1_magic_items.json", "dest": "Oggetti",         "cat": "srd-oggetto",     "fm": ["tipo_base", "rarita", "richiede_sintonia"]},
    {"json": "srd_5_2_1_feats.json",       "dest": "Talenti",         "cat": "srd-talento",     "fm": ["categoria", "prerequisito", "ripetibile"]},
    {"json": "srd_5_2_1_species.json",     "dest": "Specie",          "cat": "srd-specie",      "fm": ["tipo_creatura", "taglia", "velocita"]},
    {"json": "srd_5_2_1_backgrounds.json", "dest": "Background",      "cat": "srd-background",  "fm": ["talento_origine"]},
    {"json": "srd_5_2_1_languages.json",   "dest": "Lingue",          "cat": "srd-lingua",      "fm": []},
    {"json": "srd_5_2_1_equipment.json",   "dest": "Equipaggiamento", "cat": "srd-equipaggiamento", "fm": []},
    {"json": "srd_5_2_1_rules.json",       "dest": "Regole",          "cat": "srd-regola",      "fm": []},
    {"json": "srd_5_2_1_classes.json",     "dest": "Classi",          "cat": "srd-classe",      "fm": []},
]

SRD_ATTRIBUTION = (
    "Quest'opera include materiale tratto dal **System Reference Document 5.2.1** "
    "(\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd. "
    "Il SRD 5.2.1 è concesso in licenza ai sensi della "
    "[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode). "
    "Traduzione italiana: [massimobarbieri/DND-SRD-IT](https://github.com/massimobarbieri/DND-SRD-IT)."
)


def srd_slug(name: str) -> str:
    """Nome file leggibile e sicuro per Obsidian (toglie i caratteri vietati)."""
    cleaned = re.sub(r'[\\/:*?"<>|#\[\]^]', "", str(name)).strip()
    return cleaned or "voce"


def load_srd(name: str) -> list[dict[str, Any]]:
    path = SRD_DIR / name
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


# Rarità SRD -> fascia canonica del generatore `tesoro`. Il JSON mescola genere
# (rara/raro, leggendaria/leggendario) e rarità composte/variabili ("non comune
# (+1)…", "rarità variabile", "manufatto", None) che NON mappiamo: restano fuori
# dal bottino per non confondere il colpo d'occhio al tavolo.
_LOOT_RARITY = {
    "non comune": "non comune",
    "rara": "rara", "raro": "rara",
    "molto rara": "molto rara", "molto raro": "molto rara",
    "leggendaria": "leggendaria", "leggendario": "leggendaria",
}
# Tipi di equipaggiamento che hanno senso come bottino non magico (gli altri —
# vitto/alloggio, servizi, cavalcature, veicoli, monete — non sono "tesoro").
_LOOT_MUNDANE_TIPI = {"equipaggiamento_avventura", "arma", "armatura", "scudo", "strumento"}


def srd_loot_pool() -> dict[str, list[str]]:
    """Nomi di oggetti REALI dell'SRD raggruppati per fascia, per il generatore
    `tesoro` (genera.js: generaTesoro). `mondano` = equipaggiamento non magico;
    le altre fasce = oggetti magici per rarità normalizzata. Iniettato in core.json
    sotto generatori.tesoro._srd così il bottino cita item veri e CC-BY (mai DMG)."""
    pool: dict[str, list[str]] = {"mondano": [], "non comune": [], "rara": [], "molto rara": [], "leggendaria": []}
    for x in load_srd("srd_5_2_1_equipment.json"):
        if isinstance(x, dict) and x.get("nome") and str(x.get("tipo")) in _LOOT_MUNDANE_TIPI:
            pool["mondano"].append(x["nome"])
    for x in load_srd("srd_5_2_1_magic_items.json"):
        if not (isinstance(x, dict) and x.get("nome")):
            continue
        fascia = _LOOT_RARITY.get(str(x.get("rarita") or "").strip().lower())
        if fascia:
            pool[fascia].append(x["nome"])
    return {k: sorted(set(v)) for k, v in pool.items() if v}


def _join(value: Any) -> str:
    return ", ".join(str(v) for v in value) if isinstance(value, list) else str(value or "")


def _blocchi(blocchi: list[Any]) -> str:
    """Sotto-blocchi di una sezione ({nome, descrizione}) -> paragrafi in grassetto.
    È qui che vivono effetti condizioni, tratti di specie, privilegi di classe."""
    out: list[str] = []
    for b in blocchi or []:
        if not isinstance(b, dict):
            continue
        nome = str(b.get("nome", "")).strip()
        desc = str(b.get("descrizione", "")).strip()
        if nome and desc:
            out.append(f"**{nome}** — {desc}")
        elif nome or desc:
            out.append(nome or desc)
    return "\n\n".join(out)


def _cell(value: Any) -> str:
    """Cella di tabella markdown: niente a-capo, pipe escappate."""
    return re.sub(r"\s*\n\s*", " ", str(value if value is not None else "")).replace("|", "\\|").strip()


def _righe(righe: list[Any]) -> str:
    """Righe tabellari (list di dict) -> tabella markdown. È qui che vivono le
    tabelle di progressione classe, i lignaggi di specie, i risultati spell."""
    rows = [r for r in righe or [] if isinstance(r, dict)]
    if not rows:
        return ""
    cols: list[str] = []
    for row in rows:
        for key in row:
            if key not in cols:
                cols.append(key)
    head = "| " + " | ".join(cols) + " |"
    sep = "|" + "|".join(["---"] * len(cols)) + "|"
    body = "\n".join("| " + " | ".join(_cell(row.get(c)) for c in cols) + " |" for row in rows)
    return f"{head}\n{sep}\n{body}"


def _mod(value: Any) -> str:
    """Modificatore di caratteristica come stringa segnata (+3, 0, -4)."""
    try:
        n = int(value)
    except (TypeError, ValueError):
        return str(value)
    return f"+{n}" if n >= 0 else str(n)


# Ordine + sigle delle sei caratteristiche (per gli statblock inline).
_ABILITY = (("forza", "For"), ("destrezza", "Des"), ("costituzione", "Cos"),
            ("intelligenza", "Int"), ("saggezza", "Sag"), ("carisma", "Car"))


def _creatura_evocata(creature: list[Any]) -> str:
    """Statblock delle creature evocate inline da un incantesimo (es. Animare
    oggetti) come callout collassabile: dati di gioco completi senza dipendere da
    Fantasy Statblocks. Salta i tiri_salvezza_base (= ai modificatori, ridondanti)."""
    out: list[str] = []
    for cre in creature or []:
        if not isinstance(cre, dict):
            continue
        sb = cre.get("statblock")
        if not isinstance(sb, dict):
            continue
        nome = str(cre.get("nome", "")).strip()
        righe = [f"> [!example]- Creatura evocata: {nome}" if nome else "> [!example]- Creatura evocata"]
        sub = ", ".join(x for x in (str(sb.get("tipo", "")).strip(), str(sb.get("allineamento", "")).strip()) if x)
        if sub:
            righe.append(f"> *{sub}*")
        meta = " · ".join(f"**{lab}** {sb[k]}" for lab, k in
                          (("CA", "classe_armatura"), ("PF", "punti_ferita"), ("Velocità", "velocita"))
                          if sb.get(k) not in (None, ""))
        if meta:
            righe.append(f"> {meta}")
        car = sb.get("caratteristiche") or {}
        abil = " · ".join(f"**{lab}** {(car.get(k) or {}).get('valore', '?')} ({_mod((car.get(k) or {}).get('modificatore', 0))})"
                          for k, lab in _ABILITY if car.get(k))
        if abil:
            righe.append(f"> {abil}")
        for lab, k in (("Immunità ai danni", "immunita_danni"), ("Immunità alle condizioni", "immunita_condizioni"),
                       ("Sensi", "sensi"), ("Lingue", "lingue"), ("Bonus competenza", "bonus_competenza")):
            if sb.get(k):
                righe.append(f"> **{lab}** {sb[k]}")
        azioni = [a for a in (sb.get("azioni") or []) if isinstance(a, dict) and a.get("nome")]
        if azioni:
            righe.append(">")
            righe.append("> **Azioni**")
            for a in azioni:
                desc = str(a.get("descrizione") or "").strip()
                righe.append(f"> **{a['nome']}** — {desc}" if desc and desc != "---" else f"> **{a['nome']}**")
        out.append("\n".join(righe))
    return "\n\n".join(out)


def _vedi_anche(ids: list[Any], links: dict[str, str]) -> str:
    """Cross-reference 'vedi_anche' del glossario come footer: link [[Nome]] se
    l'id risolve a una voce SRD, altrimenti il termine in chiaro."""
    refs = []
    for rid in ids or []:
        nome = (links or {}).get(str(rid))
        refs.append(f"[[{nome}]]" if nome else str(rid).replace("_", " "))
    return ("> [!info]- Vedi anche\n> " + " · ".join(refs)) if refs else ""


def srd_id_index() -> dict[str, str]:
    """Mappa id->nome su TUTTE le voci SRD (per risolvere i link 'vedi_anche')."""
    idx: dict[str, str] = {}
    for name in [s["json"] for s in SRD_GEN] + ["srd_5_2_1_rules_glossary.json", "srd_5_2_1_monsters.json"]:
        for entry in load_srd(name):
            if isinstance(entry, dict) and entry.get("id") and entry.get("nome"):
                idx.setdefault(str(entry["id"]), str(entry["nome"]))
    return idx


def srd_condizioni() -> list[dict[str, Any]]:
    """Le 15 condizioni 5.5e in forma COMPATTA per il quick-ref a runtime (core.json):
    {nome, descrizione, effetti:[{nome, descrizione}]}. Gli effetti pieni stanno nelle
    note SRD/Condizioni/; qui solo l'essenziale per il richiamo al tavolo. [] se SRD assente."""
    out: list[dict[str, Any]] = []
    for g in load_srd("srd_5_2_1_rules_glossary.json"):
        if not isinstance(g, dict) or g.get("descrittore") != "condizione":
            continue
        effetti = []
        for sez in g.get("sezioni") or []:
            for b in (sez.get("blocchi") or []) if isinstance(sez, dict) else []:
                if isinstance(b, dict) and (b.get("nome") or b.get("descrizione")):
                    effetti.append({"nome": str(b.get("nome", "")).strip(),
                                    "descrizione": str(b.get("descrizione", "")).strip()})
        out.append({"nome": g.get("nome", ""),
                    "descrizione": str(g.get("descrizione", "")).strip(),
                    "effetti": effetti})
    return out


def srd_header(entry: dict[str, Any], cat: str) -> str:
    """Infobox (callout) coi dati salienti, su misura per categoria. '' se nessuno."""
    def parts(*pairs):
        return " · ".join(f"**{lab}** {entry.get(k)}" for lab, k in pairs if entry.get(k))
    if cat == "srd-incantesimo":
        liv = str(entry.get("livello", ""))
        testa = f"Trucchetto · {entry.get('scuola', '')}" if liv in ("0", "") else f"Livello {liv} · {entry.get('scuola', '')}"
        righe = [f"> [!abstract] {testa}"]
        mecc = parts(("Lancio", "tempo_lancio"), ("Gittata", "gittata"), ("Componenti", "componenti"), ("Durata", "durata"))
        if mecc:
            righe.append(f"> {mecc}")
        if entry.get("classi"):
            righe.append(f"> **Classi** {_join(entry['classi'])}")
        return "\n".join(righe)
    if cat == "srd-oggetto":
        sint = entry.get("richiede_sintonia")
        extra = " · richiede sintonia" if sint and sint not in (False, "no", "No", "") else ""
        testa = " · ".join(x for x in (entry.get("tipo_base", ""), str(entry.get("rarita", "") or "")) if x)
        return f"> [!abstract] {testa}{extra}" if testa or extra else ""
    if cat == "srd-talento":
        line = f"> [!abstract] Talento{(' · ' + str(entry.get('categoria'))) if entry.get('categoria') else ''}"
        if entry.get("prerequisito"):
            line += f"\n> **Prerequisito** {entry['prerequisito']}"
        return line
    if cat == "srd-specie":
        return f"> [!abstract] {entry.get('tipo_creatura', '')} · Taglia {entry.get('taglia', '')} · Velocità {entry.get('velocita', '')}"
    if cat == "srd-background" and entry.get("talento_origine"):
        return f"> [!abstract] Background · Talento d'origine: {entry['talento_origine']}"
    if cat == "srd-condizione":
        return "> [!warning] Condizione"
    return ""


# --- Auto-link incrociato delle schede SRD ----------------------------------
# Dove una scheda CITA un'altra entità (un incantesimo nomina una condizione, un
# privilegio nomina un incantesimo…), avvolgiamo il nome in [[ ]]. Conservativo per
# non sporcare la prosa: solo categorie ad alta distintività (condizioni, incantesimi
# multi-parola o lunghi, specie/classi/background/talenti), PRIMA occorrenza per nota,
# niente auto-link, niente omonimi ambigui. Le parole troppo comuni restano escluse.
_AUTOLINK_STOP = {
    # incantesimi il cui nome è anche parola comune (link sbagliati nella prosa)
    "aiuto", "allarme", "benedizione", "capanna", "celare", "clone", "comando",
    "compulsione", "comunione", "confusione", "contagio", "costrizione", "creazione",
    "desiderio", "divinazione", "eroismo", "esilio", "estasiare", "fabbricare", "fatale",
    "ferire", "frantumare", "fulmine", "fuorviare", "guarigione", "guida", "identificare",
    "inaridire", "intralciare", "intermittenza", "inviare", "lentezza", "levitazione",
    "luce", "luminescenza", "messaggio", "oscurità", "paura", "portale", "presagio",
    "previsione", "proibizione", "resistenza", "riparare", "rinascita", "risveglio",
    "salto", "santificare", "santuario", "scassinare", "scrutare", "scudo", "scurovisione",
    "sembrare", "sfocatura", "silenzio", "simbolo", "sogno", "sonno", "suggestione",
    "terremoto", "trasformazione", "unto", "velocità", "volare", "disorientare", "ragnatela",
    # glossario strutturale (compare ovunque: linkarlo è rumore)
    "azione", "reazione", "arma", "armi", "danni", "danno", "magia", "creatura",
    "competenza", "taglia", "mostro", "attacco", "bersaglio", "oggetto", "oggetti",
    "avventura", "campagna", "incontro", "pericolo", "pericoli", "morte", "caduta",
    "studio", "ricerca", "utilizzo", "influenza", "cono", "cubo", "sfera", "linea",
    "cilindro", "emanazione", "portata", "alleato", "nemico", "ostile", "amichevole",
    "indifferente", "atteggiamento", "allineamento", "sorpresa", "stabile", "condizione",
    "incantesimo", "bonus", "prova", "prove", "illusioni", "maledizioni", "immunità",
    "vulnerabilità", "iniziativa", "tiro", "difesa", "abile", "linguaggi", "sapiente",
    # mostri-ruolo generici / parole comuni (gli animali distintivi restano linkabili)
    "ombra", "spia", "guardia", "nobile", "bruto", "incubo", "gladiatore", "bandito",
    "pirata", "sacerdote", "popolano", "cultista", "assassino", "esploratore",
    "cavaliere", "berserker", "arcimago", "fantasma",
}


def _autolink_forme(nome: str, condizione: bool) -> set[str]:
    """Forme di superficie (minuscole) con cui un nome può comparire nella prosa. Le
    condizioni (participi/aggettivi) sono declinate o/a/i/e per genere e numero, così
    «affascinata», «proni»… linkano alla scheda «Affascinato»/«Prono»."""
    nome = str(nome or "").strip()
    if not nome:
        return set()
    if condizione:
        parole = nome.split()
        testa = parole[0]
        coda = (" " + " ".join(parole[1:])) if len(parole) > 1 else ""
        ult = testa[-1:].lower()
        if ult in "oa":
            basi = [testa[:-1] + v for v in "oaie"]
        elif ult == "e":
            basi = [testa[:-1] + v for v in "ei"]
        else:
            basi = [testa]
        return {(b + coda).lower() for b in basi}
    return {nome.lower()}


def autolink_index() -> dict[str, str]:
    """{forma_minuscola: «Nome canonico»} per l'auto-link incrociato. Aggressivo ma
    pulito: incantesimi (anche single-word, meno i comuni in stop-list), condizioni
    declinate, specie/classi/background/talenti, glossario (meno lo strutturale) e
    mostri (per i richiami in prosa e negli statblock). Si SCARTANO: le forme ambigue
    (stesso testo → entità diverse) e gli omonimi cross-categoria (stesso nome in più
    note, es. «Mago» classe vs mostro → in Obsidian [[Mago]] sarebbe irrisolvibile)."""
    forme: dict[str, set[str]] = {}   # forma_lower -> nomi canonici
    fonti: dict[str, set[str]] = {}   # nome canonico -> file-sorgente (per gli omonimi)

    def reg(nome: str, fonte: str, condizione: bool = False) -> None:
        nome = str(nome or "").strip()
        if not nome:
            return
        fonti.setdefault(nome, set()).add(fonte)
        for forma in _autolink_forme(nome, condizione):
            if len(forma) < 4 or forma in _AUTOLINK_STOP:
                continue
            forme.setdefault(forma, set()).add(nome)

    for jf in ("srd_5_2_1_species.json", "srd_5_2_1_backgrounds.json",
               "srd_5_2_1_feats.json", "srd_5_2_1_classes.json",
               "srd_5_2_1_spells.json", "srd_5_2_1_monsters.json"):
        for e in load_srd(jf):
            if isinstance(e, dict) and e.get("nome"):
                reg(e["nome"], jf)
    # Glossario: le CONDIZIONI sempre; degli altri termini SOLO una allowlist di concetti
    # distintivi e NON ubiquitari (linkare «tiro salvezza»/«punti ferita»/«vantaggio»,
    # presenti in ogni scheda, sarebbe puro rumore).
    gloss_allow = {
        "Copertura", "Afferrare", "Schivata", "Disimpegno", "Scatto", "Sintonia",
        "Maestria", "Rituale", "Telepatia", "Possessione", "Mutaforma", "Trucchetto",
        "Nascondersi", "Soffocamento",
    }
    for g in load_srd("srd_5_2_1_rules_glossary.json"):
        if not isinstance(g, dict) or not g.get("nome"):
            continue
        cond = g.get("descrittore") == "condizione"
        if cond or g["nome"] in gloss_allow:
            reg(g["nome"], "glossario", condizione=cond)

    idx: dict[str, str] = {}
    for forma, nomi in forme.items():
        if len(nomi) != 1:
            continue                       # stessa forma → entità diverse: ambigua
        nome = next(iter(nomi))
        if len(fonti.get(nome, ())) != 1:
            continue                       # stesso nome in più note: omonimo, irrisolvibile
        idx[forma] = nome
    return idx


def autolink_regex(idx: dict[str, str]):
    """Regex unica (forme più lunghe prima → greedy) con confini di parola Unicode."""
    if not idx:
        return None
    alt = "|".join(re.escape(f) for f in sorted(idx, key=len, reverse=True))
    return re.compile(rf"(?<![\w'])(?:{alt})(?![\w'])", re.IGNORECASE)


def autolink(text: str, regex, idx: dict[str, str], self_nome: str, seen: set[str]) -> str:
    """Avvolge in [[ ]] la PRIMA occorrenza di ogni entità citata (non sé stessa).
    Conserva il testo originale come alias quando differisce dal nome canonico."""
    if not regex or not text:
        return text
    # Parole del nome proprio della scheda: «Lupo invernale» che dice «il lupo» riferisce
    # a sé, non al mostro [[Lupo]] → niente auto-link su una parola del proprio nome.
    self_parole = set(self_nome.lower().split())

    def repl(m):
        trovato = m.group(0)
        canon = idx.get(trovato.lower())
        if not canon or canon == self_nome or canon in seen or trovato.lower() in self_parole:
            return trovato
        seen.add(canon)
        return f"[[{canon}]]" if trovato == canon else f"[[{canon}|{trovato}]]"

    return regex.sub(repl, text)


def srd_note(entry: dict[str, Any], cat: str, fm_fields: list[str],
             links: dict[str, str] | None = None,
             al_re=None, al_idx: dict[str, str] | None = None) -> str:
    self_nome = str(entry.get("nome", ""))
    seen_links: set[str] = set()

    def link(text: str) -> str:
        return autolink(text, al_re, al_idx or {}, self_nome, seen_links)

    fm: dict[str, Any] = {"nome": entry.get("nome", ""), "categoria": cat, "srd": True, "fonte": "SRD 5.2.1"}
    for key in fm_fields:
        val = entry.get(key)
        if isinstance(val, (str, int, float, bool)) and val != "":
            fm[key] = val
        elif isinstance(val, list) and val:
            fm[key] = val
    parts: list[str] = [f"# {entry.get('nome', '')}"]
    header = srd_header(entry, cat)
    if header:
        parts.append(header)

    # De-duplica le PROSE ripetute: molte voci (es. talenti) ripetono lo stesso
    # testo in descrizione + beneficio + sezione "Beneficio". Tracciamo i blocchi
    # già scritti (normalizzati) e saltiamo i duplicati. Tabelle/blocchi restano.
    seen: set[str] = set()

    def once(text: str) -> bool:
        norm = re.sub(r"\s+", " ", str(text)).strip().lower()
        if not norm or norm in seen:
            return False
        seen.add(norm)
        return True

    for key in ("descrizione", "beneficio"):
        if isinstance(entry.get(key), str) and entry[key].strip() and once(entry[key]):
            parts.append(link(entry[key].strip()))
    for sez in entry.get("sezioni") or []:
        if not isinstance(sez, dict):
            continue
        blocco: list[str] = []
        if sez.get("titolo"):
            blocco.append(f"### {sez['titolo']}")
        desc = str(sez.get("descrizione") or "").strip()
        if desc and once(desc):
            blocco.append(link(desc))
        if sez.get("blocchi"):
            blocco.append(_blocchi(sez["blocchi"]))
        if sez.get("righe"):
            blocco.append(_righe(sez["righe"]))
        contenuto = [b for b in blocco if b]
        # Salta le sezioni col solo titolo (niente heading vuoti).
        if contenuto and not (len(contenuto) == 1 and sez.get("titolo")):
            parts.append("\n\n".join(contenuto))
    scaling = [s for s in (entry.get("scaling") or []) if isinstance(s, dict)]
    if scaling:
        body = "\n>\n".join(f"> **{s.get('nome', '')}** — {s.get('descrizione', '')}" for s in scaling)
        parts.append(f"> [!tip]- Potenziamento\n{body}")
    # Creature evocate inline (incantesimi): statblock di gioco completo.
    evocate = _creatura_evocata(entry.get("creature_evocate_inline") or [])
    if evocate:
        parts.append(evocate)
    # Riferimento a una creatura evocata dal bestiario (se non già mostrata inline).
    # Path-qualificato a SRD/Mostri/ per disambiguare da eventuali omonimi (es. lo
    # stesso incantesimo "Insetto gigante" e il mostro omonimo).
    ref = entry.get("creatura_evocata")
    if isinstance(ref, dict) and ref.get("id") and not (entry.get("creature_evocate_inline")):
        nome_ref = (links or {}).get(str(ref["id"]))
        if nome_ref:
            link = f"SRD/Mostri/{nome_ref}|{nome_ref}" if ref.get("fonte") == "mostri" else nome_ref
            parts.append(f"> [!example] Creatura evocata\n> [[{link}]]")
    # Cross-reference (glossario): footer "Vedi anche".
    vedi = _vedi_anche(entry.get("vedi_anche") or [], links or {})
    if vedi:
        parts.append(vedi)
    return frontmatter_block(fm) + "\n\n".join(parts) + "\n"


def _csv(value: Any) -> str:
    """Lista IT -> stringa 'a, b, c' (per resistenze/immunità/equip)."""
    if isinstance(value, list):
        return ", ".join(str(x) for x in value if x)
    return str(value or "")


def srd_statblock_yaml(monster: dict[str, Any], layout: str, core: dict[str, Any] | None = None,
                       al_re=None, al_idx: dict[str, str] | None = None) -> str:
    """Mappa un mostro JSON IT sul formato statblock di Fantasy Statblocks (5.5e).
    Emette TUTTI i campi 2024 che il layout sa mostrare: iniziativa, tiri salvezza
    competenti, abilità, resistenze/immunità/vulnerabilità, equipaggiamento, azioni
    bonus/reazioni/leggendarie (con descrizione), GS + bonus di competenza. I campi
    vuoti sono omessi (il layout è 'conditioned'). `core` fornisce le label IT delle
    abilità (fallback al titolo dello slug)."""
    car = monster.get("caratteristiche", {}) or {}
    order = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"]
    sigle = dict(_ABILITY)  # forza -> For
    skill_labels = {k: (v.get("label") or k.replace("_", " ").title())
                    for k, v in ((core or {}).get("abilita") or {}).items()}
    hp = monster.get("punti_ferita", {}) or {}
    cr = monster.get("grado_sfida", {}) or {}
    vel = monster.get("velocita", {}) or {}
    sensi = monster.get("sensi", {}) or {}
    ini = monster.get("iniziativa", {}) or {}
    leg = monster.get("azioni_leggendarie", {}) or {}
    lingue = monster.get("lingue", [])

    # Auto-link nelle descrizioni dello statblock (Fantasy Statblocks rende i [[ ]]):
    # una condizione inflitta, un incantesimo lanciato, una creatura evocata diventano
    # navigabili. Una sola occorrenza per statblock (seen), mai un auto-link.
    self_nome = str(monster.get("nome", ""))
    seen_links: set[str] = set()

    def lk(text: str) -> str:
        return autolink(str(text or ""), al_re, al_idx or {}, self_nome, seen_links)

    def actions(key: str) -> list[dict[str, str]]:
        return [{"name": a.get("nome", ""), "desc": lk(a.get("descrizione", ""))}
                for a in (monster.get(key) or []) if isinstance(a, dict)]

    # Tiri salvezza: solo quelli COMPETENTI (ts != modificatore), in formato FS.
    saves = [{sigle.get(k, k): (car.get(k) or {}).get("tiro_salvezza")}
             for k in order
             if (car.get(k) or {}).get("tiro_salvezza") is not None
             and (car.get(k) or {}).get("tiro_salvezza") != (car.get(k) or {}).get("modificatore")]
    skillsaves = [{skill_labels.get(k, k.replace("_", " ").title()): v}
                  for k, v in (monster.get("abilita") or {}).items()]

    sb: dict[str, Any] = {
        "layout": layout,
        "name": monster.get("nome", ""),
        "size": monster.get("dimensione", ""),
        "type": monster.get("tipo", ""),
        "subtype": monster.get("sottotipo", ""),
        "alignment": monster.get("allineamento", ""),
        "ac": monster.get("classe_armatura", ""),
        "hp": hp.get("media", "") if isinstance(hp, dict) else hp,
        "hit_dice": hp.get("formula", "") if isinstance(hp, dict) else "",
        "speed": ", ".join(str(v) if t == "camminata" else f"{t} {v}" for t, v in vel.items()) if isinstance(vel, dict) else str(vel),
        "initiative": (f"{'+' if (ini.get('bonus') or 0) >= 0 else ''}{ini.get('bonus')} ({ini.get('valore')})"
                       if ini.get("bonus") is not None else ""),
        "stats": [int((car.get(k) or {}).get("punteggio", 10)) for k in order],
        "saves": saves,
        "skillsaves": skillsaves,
        "damage_resistances": _csv(monster.get("resistenze")),
        "damage_immunities": _csv(monster.get("immunita_danni")),
        "condition_immunities": _csv(monster.get("immunita_condizione")),
        "damage_vulnerabilities": _csv(monster.get("vulnerabilita")),
        "gear": _csv(monster.get("equipaggiamento")),
        "senses": ", ".join(f"{t.replace('_', ' ')} {v}" for t, v in sensi.items()) if isinstance(sensi, dict) else str(sensi),
        "languages": ", ".join(lingue) if isinstance(lingue, list) else str(lingue),
        "cr": str(cr.get("valore", "")) if isinstance(cr, dict) else str(cr),
        "pb": monster.get("bonus_competenza"),
        "traits": actions("tratti"),
        "actions": actions("azioni"),
        "bonus_actions": actions("azioni_bonus"),
        "reactions": actions("reazioni"),
        "legendary_description": lk(leg.get("descrizione_utilizzi", "")),
        "legendary_actions": [{"name": a.get("nome", ""), "desc": lk(a.get("descrizione", ""))}
                              for a in (leg.get("azioni") or []) if isinstance(a, dict)],
    }
    # Omette i campi vuoti (il layout li nasconderebbe comunque): note più pulite.
    sb = {k: v for k, v in sb.items() if v not in ("", [], None, {})}
    return yaml.safe_dump(sb, allow_unicode=True, sort_keys=False)


def _gs_key(valore: Any) -> str | None:
    """Valore CR del SRD -> chiave-stringa del campo `gs` (widget): frazioni <1
    come '1/8'/'1/4'/'1/2', interi come '5'. None se non mappabile."""
    if valore is None:
        return None
    frac = {"0.125": "1/8", "0.25": "1/4", "0.5": "1/2", "1/8": "1/8", "1/4": "1/4", "1/2": "1/2"}
    s = str(valore).strip()
    if s in frac:
        return frac[s]
    try:
        v = float(s)
    except ValueError:
        return None
    if v in (0.125, 0.25, 0.5):
        return {0.125: "1/8", 0.25: "1/4", 0.5: "1/2"}[v]
    return str(int(v)) if v == int(v) else None


def _median(xs: list[float]) -> float | None:
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


def gs_baselines() -> dict[str, dict[str, Any]]:
    """Tabella GS -> statistiche base, dalle MEDIANE dei mostri SRD di pari GS:
    AC, PF, bonus di competenza, iniziativa, bonus d'attacco, danno medio + formula
    rappresentativa, CD salvezza. **Sorgente SRD** (non la tabella DMG) -> nessun
    vincolo di licenza. Alimenta lo scaffolder di statblock per le creature homebrew
    (meta_actions.scaffold_statblock): un boss con solo `gs` diventa subito giocabile."""
    groups: dict[str, dict[str, list[float]]] = {}
    formulas: dict[str, list[tuple[float, str, str]]] = {}
    for mon in load_srd("srd_5_2_1_monsters.json"):
        if not isinstance(mon, dict):
            continue
        cr = mon.get("grado_sfida") or {}
        key = _gs_key(cr.get("valore") if isinstance(cr, dict) else cr)
        if key is None:
            continue
        g = groups.setdefault(key, {"ac": [], "hp": [], "pb": [], "init": [], "atk": [], "dmg": [], "cd": []})
        ac = mon.get("classe_armatura")
        if isinstance(ac, (int, float)):
            g["ac"].append(ac)
        hp = mon.get("punti_ferita") or {}
        if isinstance(hp, dict) and isinstance(hp.get("media"), (int, float)):
            g["hp"].append(hp["media"])
        if isinstance(mon.get("bonus_competenza"), (int, float)):
            g["pb"].append(mon["bonus_competenza"])
        ini = mon.get("iniziativa") or {}
        if isinstance(ini, dict) and isinstance(ini.get("bonus"), (int, float)):
            g["init"].append(ini["bonus"])
        for az in mon.get("azioni") or []:
            for tiro in (az.get("tiri") or []) if isinstance(az, dict) else []:
                if not isinstance(tiro, dict):
                    continue
                if tiro.get("tipo") == "attacco":
                    if isinstance(tiro.get("bonus"), (int, float)):
                        g["atk"].append(tiro["bonus"])
                    danni = tiro.get("danni") or []
                    tot = sum(d.get("media", 0) for d in danni if isinstance(d, dict) and isinstance(d.get("media"), (int, float)))
                    if tot:
                        g["dmg"].append(tot)
                        d0 = next((d for d in danni if isinstance(d, dict) and d.get("formula")), None)
                        if d0:
                            formulas.setdefault(key, []).append((tot, str(d0["formula"]), str(d0.get("tipo", ""))))
                elif tiro.get("tipo") == "salvezza" and isinstance(tiro.get("cd"), (int, float)):
                    g["cd"].append(tiro["cd"])
    out: dict[str, dict[str, Any]] = {}
    for key, g in groups.items():
        rec: dict[str, Any] = {}
        for src, dst in (("ac", "ac"), ("hp", "hp"), ("pb", "pb"), ("init", "init"), ("atk", "attacco"), ("cd", "cd")):
            m = _median(g[src])
            if m is not None:
                rec[dst] = round(m)
        if g["dmg"]:
            dmed = _median(g["dmg"])
            rec["danno"] = round(dmed)
            fl = formulas.get(key) or []
            if fl:
                best = min(fl, key=lambda t: abs(t[0] - dmed))
                rec["danno_formula"], rec["danno_tipo"] = best[1], best[2]
        out[key] = rec
    return out


def build_srd(core: dict[str, Any]) -> int:
    """Genera l'albero SRD/ (sola lettura) dai JSON IT vendorizzati. Ritorna il
    numero di note scritte. Cartella sorgente assente -> 0 (SRD opzionale)."""
    if not SRD_DIR.is_dir():
        return 0
    write_text(VAULT / "SRD" / "LICENZA.md", f"# Licenza SRD\n\n{SRD_ATTRIBUTION}\n")
    # Indice id->nome su tutte le voci, per risolvere i link 'vedi_anche'/evocate.
    links = srd_id_index()
    # Indice forma->Nome per l'auto-link incrociato della prosa (costruito una volta).
    al_idx = autolink_index()
    al_re = autolink_regex(al_idx)
    written = 0
    for spec in SRD_GEN:
        for entry in load_srd(spec["json"]):
            write_text(VAULT / "SRD" / spec["dest"] / f"{srd_slug(entry.get('nome'))}.md",
                       srd_note(entry, spec["cat"], spec["fm"], links, al_re, al_idx))
            written += 1
    # Glossario: condizioni in una cartella dedicata, il resto in Glossario.
    for entry in load_srd("srd_5_2_1_rules_glossary.json"):
        cond = entry.get("descrittore") == "condizione"
        dest, cat = ("Condizioni", "srd-condizione") if cond else ("Glossario", "srd-glossario")
        write_text(VAULT / "SRD" / dest / f"{srd_slug(entry.get('nome'))}.md",
                   srd_note(entry, cat, ["descrittore"], links, al_re, al_idx))
        written += 1
    # Mostri -> statblock (statblock: inline => entra nel bestiario di Fantasy Statblocks).
    layout = (core.get("statblock", {}) or {}).get("layout", "Basic 5e Layout")
    for monster in load_srd("srd_5_2_1_monsters.json"):
        fm = {"nome": monster.get("nome", ""), "categoria": "srd-mostro", "srd": True,
              "fonte": "SRD 5.2.1", "statblock": "inline"}
        # gs/pe nel frontmatter (interrogabili): servono al calcolo difficoltà incontri.
        gs = monster.get("grado_sfida") or {}
        if isinstance(gs, dict):
            if gs.get("valore") is not None:
                fm["gs"] = str(gs["valore"])
            if gs.get("punti_esperienza") is not None:
                fm["pe"] = gs["punti_esperienza"]
        content = frontmatter_block(fm) + f"# {monster.get('nome', '')}\n\n```statblock\n{srd_statblock_yaml(monster, layout, core, al_re, al_idx)}```\n"
        write_text(VAULT / "SRD" / "Mostri" / f"{srd_slug(monster.get('nome'))}.md", content)
        written += 1
    index = (
        "# 📚 SRD 5.2.1 (italiano)\n\n"
        "Riferimento ufficiale 5.5e in italiano, **sola lettura**: si rigenera a ogni build, "
        "non modificarlo (il tuo homebrew va in `Mondi/`). I mostri sono statblock e popolano "
        "il bestiario di Fantasy Statblocks (richiamabili con `monster: Nome`).\n\n"
        f"> [!quote]- Licenza\n> {SRD_ATTRIBUTION}\n\n"
        "## Contenuto\n"
        '```dataview\ntable without id length(rows) as Voci\nfrom "SRD"\n'
        "where srd\ngroup by categoria as Categoria\nsort Categoria asc\n```\n"
    )
    write_text(VAULT / "SRD" / "Indice.md", index)
    return written
