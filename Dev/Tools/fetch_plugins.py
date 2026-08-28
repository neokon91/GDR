#!/usr/bin/env python3
"""Scarica i plugin Obsidian PINNATI (plugins.yaml: `repo` + `version`) dentro
dist/GDR-vault/.obsidian/plugins/<id>/ PRIMA dello zip di release, così il vault
turnkey è RIPRODUCIBILE da un clone pulito e non dipende più dai plugin installati
a mano sulla macchina del maintainer.

Un plugin è «bundlato» se dichiara sia `repo` sia `version`: si scaricano i tre
asset della GitHub release `<version>` — main.js e manifest.json (obbligatori),
styles.css (opzionale). Obsidian impone che il tag della release combaci con la
`version` del manifest (niente prefisso `v`), quindi l'URL è deterministico:
  https://github.com/<repo>/releases/download/<version>/<asset>

Idempotente: salta un plugin già presente alla versione pinnata (confronto sul
manifest su disco). Verifica che il manifest scaricato dichiari id/version attesi
(pin integro: se il tag puntasse a un plugin diverso, fallisce invece di bundlare
il file sbagliato). Ogni plugin `critico` DEVE essere pinnato e presente:
assert_critical_present() è il gate che impedisce a `npm run dist` di produrre in
silenzio uno zip senza i plugin essenziali (l'utente vedrebbe codice grezzo).

Solo stdlib (urllib) + il loader YAML condiviso: nessuna dipendenza nuova.
`python3 Dev/Tools/fetch_plugins.py` (invocato anche da release.py)."""

from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import common

# Obsidian: il tag della release == `version` del manifest, senza prefisso `v`.
RELEASE_URL = "https://github.com/{repo}/releases/download/{version}/{asset}"
# main.js + manifest.json sono obbligatori; styles.css è opzionale (non tutti i
# plugin lo pubblicano) → un 404 su styles.css si salta senza errore.
REQUIRED_ASSETS = ("manifest.json", "main.js")
OPTIONAL_ASSETS = ("styles.css",)
_TIMEOUT = 30  # secondi per richiesta


class FetchError(RuntimeError):
    """Errore azionabile della fase di fetch (pin errato, asset mancante, gate)."""


def _ssl_context() -> ssl.SSLContext:
    """Contesto TLS che verifica i certificati. Usa il bundle CA di `certifi` se
    presente: i build Python di python.org su macOS spesso non hanno lo store CA
    di sistema configurato (CERTIFICATE_VERIFY_FAILED) — certifi lo aggira SENZA
    disabilitare la verifica. Altrove ricade sullo store di sistema (create_default)."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def all_plugins() -> list[dict[str, Any]]:
    return common.load_yaml("plugins.yaml").get("plugins", []) or []


def bundled(plugins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """I plugin da scaricare: quelli con `repo` E `version` pinnati. Un plugin
    senza `version` non è bundlato (si installa via BRAT/community al primo avvio)."""
    return [p for p in plugins if p.get("repo") and p.get("version")]


def critical(plugins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """I plugin ESSENZIALI (plugins.yaml: `critico`): il vault non funziona senza."""
    return [p for p in plugins if p.get("critico")]


def _plugin_dir(vault: Path, pid: str) -> Path:
    return vault / ".obsidian" / "plugins" / pid


def _fetch(url: str) -> bytes | None:
    """Scarica `url` (segue i redirect di GitHub verso il CDN). Ritorna i byte, o
    None su 404 (asset assente). Ogni altro errore HTTP/di rete si propaga."""
    req = urllib.request.Request(url, headers={"User-Agent": "GDR-release/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT, context=_ssl_context()) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def fetch_one(plugin: dict[str, Any], vault: Path, *, force: bool = False) -> str:
    """Scarica un plugin bundlato nel vault. Ritorna "presente" (già alla versione
    pinnata, saltato) o "scaricato". Scarica in memoria e valida il manifest PRIMA
    di scrivere, così una release col tag errato non lascia una cartella corrotta."""
    pid, repo, ver = plugin["id"], plugin["repo"], str(plugin["version"])
    dest = _plugin_dir(vault, pid)
    manifest_path = dest / "manifest.json"
    if not force and manifest_path.is_file():
        current = common.read_json(manifest_path) or {}
        if str(current.get("version")) == ver:
            return "presente"

    blobs: dict[str, bytes] = {}
    for asset in REQUIRED_ASSETS:
        url = RELEASE_URL.format(repo=repo, version=ver, asset=asset)
        data = _fetch(url)
        if data is None:
            raise FetchError(
                f"{pid}: asset '{asset}' assente nella release {repo}@{ver} ({url}). "
                f"Controlla il pin `version` in plugins.yaml — il tag della release DEVE combaciare.")
        blobs[asset] = data

    # Pin integro: il manifest scaricato deve dichiarare l'id e la versione attesi.
    try:
        manifest = json.loads(blobs["manifest.json"].decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as e:
        raise FetchError(f"{pid}: manifest.json scaricato non è JSON valido ({repo}@{ver}): {e}")
    if str(manifest.get("id")) != pid or str(manifest.get("version")) != ver:
        raise FetchError(
            f"{pid}: il manifest scaricato non combacia col pin "
            f"(id={manifest.get('id')} version={manifest.get('version')}, attesi id={pid} version={ver}). "
            f"Il tag della release {repo}@{ver} punta a un plugin/versione diversi?")

    for asset in OPTIONAL_ASSETS:
        data = _fetch(RELEASE_URL.format(repo=repo, version=ver, asset=asset))
        if data is not None:
            blobs[asset] = data

    dest.mkdir(parents=True, exist_ok=True)
    for asset, data in blobs.items():
        (dest / asset).write_bytes(data)
    return "scaricato"


def _assert_critical_pinned(plugins: list[dict[str, Any]]) -> None:
    """Ogni plugin critico DA SCARICARE deve avere `repo`+`version` (bundlabile in modo
    riproducibile). Il plugin AUTORIALE (`autoriale: true`, es. `gdr`) è escluso: non si
    scarica da una release GitHub, lo installa render.py (install_authored_plugins) dal
    codice buildato — la sua presenza è comunque garantita da assert_critical_present,
    che gira DOPO la build."""
    unpinned = [p["id"] for p in critical(plugins)
                if not p.get("autoriale") and not (p.get("repo") and p.get("version"))]
    if unpinned:
        raise FetchError(
            "Plugin CRITICI senza pin `repo`+`version` in plugins.yaml "
            "(non bundlabili in modo riproducibile): " + ", ".join(unpinned))


def fetch_all(vault: Path, *, force: bool = False, verbose: bool = True) -> list[tuple[str, str, str]]:
    """Scarica tutti i plugin bundlati nel vault. Ritorna [(id, version, status)]."""
    plugins = all_plugins()
    _assert_critical_pinned(plugins)
    results: list[tuple[str, str, str]] = []
    for plugin in bundled(plugins):
        status = fetch_one(plugin, vault, force=force)
        results.append((plugin["id"], str(plugin["version"]), status))
        if verbose:
            print(f"  {plugin['id']} @ {plugin['version']} — {status}")
    return results


def missing_critical(vault: Path, plugins: list[dict[str, Any]] | None = None) -> list[str]:
    """Gli id dei plugin critici il cui `main.js` NON è nel vault (zip rotto)."""
    plugins = plugins if plugins is not None else all_plugins()
    return [p["id"] for p in critical(plugins)
            if not (_plugin_dir(vault, p["id"]) / "main.js").is_file()]


def assert_critical_present(vault: Path, plugins: list[dict[str, Any]] | None = None) -> None:
    """Gate pre-zip: fallisce se manca il codice di un plugin critico nel vault →
    `npm run dist` non confeziona mai in silenzio uno zip senza i plugin essenziali."""
    missing = missing_critical(vault, plugins)
    if missing:
        raise FetchError(
            "Manca il codice dei plugin CRITICI nel vault: " + ", ".join(missing) + ".\n"
            "Lo zip turnkey sarebbe rotto (l'utente vedrebbe codice grezzo al posto di "
            "pulsanti/schede/tabelle). Esegui `python3 Dev/Tools/fetch_plugins.py` con rete "
            "disponibile, oppure verifica i pin in Dev/Source/YAML/plugins.yaml.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Scarica i plugin Obsidian pinnati (plugins.yaml) in dist/GDR-vault/.obsidian/plugins/.")
    parser.add_argument("--force", action="store_true",
                        help="Riscarica anche i plugin già presenti alla versione pinnata.")
    parser.add_argument("--check", action="store_true",
                        help="Non scarica: verifica solo che i plugin critici siano già presenti nel vault.")
    args = parser.parse_args(argv)
    try:
        if args.check:
            assert_critical_present(common.VAULT)
            print("Plugin critici presenti nel vault.")
            return 0
        print("Plugin bundlati (pinnati) → dist/GDR-vault/.obsidian/plugins/:")
        fetch_all(common.VAULT, force=args.force)
        assert_critical_present(common.VAULT)
        return 0
    except FetchError as e:
        print(f"ERRORE fetch plugin: {e}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"ERRORE di rete scaricando i plugin: {e}. Serve connessione a github.com.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
