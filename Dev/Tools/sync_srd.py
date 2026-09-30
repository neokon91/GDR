#!/usr/bin/env python3
"""Aggiorna la copia VENDORIZZATA dell'SRD (`Dev/Source/SRD/`) da `archivio/srd/`.

Perché esiste: GDR è pubblico, l'archivio no. La build legge solo la copia qui dentro
(SRD 5.2.1, CC-BY-4.0), così chiunque cloni GDR costruisce il vault senza l'archivio
privato. L'archivio resta la fonte: si scrive lì, e questo script riporta qui SOLO
`srd/` — nessun altro percorso dell'archivio (books/, mondi/…) può finire nel repo.

Specchio esatto: copia i file nuovi o cambiati, cancella quelli spariti dall'archivio.
I file propri della copia (`PROPRI`: la licenza) non si toccano.

    python3 Dev/Tools/sync_srd.py           # aggiorna la copia
    python3 Dev/Tools/sync_srd.py --check   # esce 1 se la copia è rimasta indietro (CI notturna)
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from common import ARCHIVIO_SRD, SRD_DIR

# File della copia che non vengono dall'archivio.
PROPRI = {"LICENSE_SRD"}
# Solo dati: un file d'altro tipo in srd/ è un'anomalia da guardare, non da copiare.
ESTENSIONI = {".yaml", ".md"}


def _file(radice: Path) -> dict[str, Path]:
    return {p.relative_to(radice).as_posix(): p
            for p in sorted(radice.rglob("*")) if p.is_file()}


def differenze(origine: Path = ARCHIVIO_SRD, copia: Path = SRD_DIR) -> tuple[list[str], list[str], list[str]]:
    """(nuovi, cambiati, spariti) della copia rispetto all'archivio."""
    src = {k: v for k, v in _file(origine).items() if v.suffix in ESTENSIONI}
    dst = {k: v for k, v in _file(copia).items() if k not in PROPRI}
    nuovi = [k for k in src if k not in dst]
    cambiati = [k for k in src if k in dst and src[k].read_bytes() != dst[k].read_bytes()]
    spariti = [k for k in dst if k not in src]
    return nuovi, cambiati, spariti


def estranei(origine: Path = ARCHIVIO_SRD) -> list[str]:
    """File di srd/ che non sono dati (.yaml/.md): non si copiano, si segnalano."""
    return [k for k, v in _file(origine).items() if v.suffix not in ESTENSIONI]


def sincronizza(origine: Path = ARCHIVIO_SRD, copia: Path = SRD_DIR) -> tuple[int, int, int]:
    nuovi, cambiati, spariti = differenze(origine, copia)
    for rel in nuovi + cambiati:
        dest = copia / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(origine / rel, dest)
    for rel in spariti:
        (copia / rel).unlink()
    for d in sorted((p for p in copia.rglob("*") if p.is_dir()), reverse=True):
        if not any(d.iterdir()):
            d.rmdir()
    return len(nuovi), len(cambiati), len(spariti)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true",
                        help="Non scrive: esce 1 se la copia differisce da archivio/srd.")
    args = parser.parse_args(argv)
    if not ARCHIVIO_SRD.is_dir():
        print(f"archivio/srd non trovato ({ARCHIVIO_SRD}): serve l'archivio accanto "
              "(symlink `archivio` o checkout fratello).", file=sys.stderr)
        return 2
    for rel in estranei():
        print(f"ATTENZIONE srd/{rel}: non è .yaml/.md, non copiato", file=sys.stderr)
    if args.check:
        nuovi, cambiati, spariti = differenze()
        if nuovi or cambiati or spariti:
            for etichetta, voci in (("nuovo", nuovi), ("cambiato", cambiati), ("sparito", spariti)):
                for rel in voci[:20]:
                    print(f"  {etichetta}: {rel}")
            print(f"Copia SRD indietro: {len(nuovi)} nuovi, {len(cambiati)} cambiati, "
                  f"{len(spariti)} spariti. Aggiorna con `npm run sync-srd`.", file=sys.stderr)
            return 1
        print("Copia SRD allineata ad archivio/srd.")
        return 0
    n, c, s = sincronizza()
    print(f"Copia SRD aggiornata: {n} nuovi, {c} cambiati, {s} rimossi → {SRD_DIR.relative_to(SRD_DIR.parents[2])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
