// === Sync inverso pin → coord =================================================
// «La mappa è la fonte della geografia»: piazzati i segnaposto A MANO sulla mappa
// (Shift+clic in zoom-map) e linkati ai [[Luoghi]], questa azione legge il sidecar
// <immagine>.markers.json e riscrive il `coord` di ogni nota linkata da un pin.
// Coord in PIXEL nello spazio-immagine (come gli import) → renderDintorni e la distanza
// in linea d'aria (× scala_mappa) funzionano. Idempotente e non distruttivo (tocca solo
// `coord`). È l'opzione (a) della roadmap: non elimina il primo clic, ma chiude il giro
// mappa→grafo per le immagini caricate a mano — le coord astratte non sono auto-piazzabili
// sui pixel di quella figura, il pin manuale dà la posizione, il sync la rende DATO.

// Nome-nota da un campo link ("[[Nome|alias]]" o "Nome") → "Nome".
function _pinLink(value) {
  return String(value == null ? "" : value)
    .replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
}

// Nucleo PURO (testabile headless): un marker zoom-map con x/y NORMALIZZATI 0..1 (frazione
// delle dimensioni) × le dimensioni dell'immagine → coord-pixel "x, y". null se non valido.
function pinToCoord(marker, size) {
  const w = Number(size && size.w), h = Number(size && size.h);
  const mx = Number(marker && marker.x), my = Number(marker && marker.y);
  if (!(w > 0) || !(h > 0) || !Number.isFinite(mx) || !Number.isFinite(my)) return null;
  return `${Math.round(mx * w)}, ${Math.round(my * h)}`;
}

// Azione: dal sidecar dei pin → scrive il coord delle note linkate. La nota attiva porta
// la mappa (campo `mappa`); ogni pin la cui `link` risolve a una nota .md ne aggiorna il `coord`.
async function sincronizza_pin(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter || {};
  const imgName = _pinLink(fm.mappa);
  if (!imgName) { new Notice("Questa nota non ha una mappa (campo Mappa)."); return ""; }
  const img = app.metadataCache.getFirstLinkpathDest?.(imgName, file.path)
    || app.vault.getAbstractFileByPath(imgName);
  if (!img) { new Notice(`Immagine-mappa non trovata: ${imgName}`); return ""; }

  const mf = app.vault.getAbstractFileByPath(img.path + ".markers.json");
  if (!mf) { new Notice("Nessun segnaposto: piazza prima i pin (Shift+clic) e linkali alle note."); return ""; }
  let data;
  try { data = JSON.parse(await app.vault.read(mf)); }
  catch (e) { new Notice("Il file dei segnaposto non è leggibile (.markers.json)."); return ""; }
  const size = data && data.size;

  let synced = 0, senzaNota = 0, senzaCoord = 0;
  for (const m of ((data && data.markers) || [])) {
    const name = _pinLink(m && m.link);
    if (!name) continue;                                       // pin senza nota: salta
    const dest = app.metadataCache.getFirstLinkpathDest?.(name, file.path);
    if (!dest || dest.extension !== "md") { senzaNota++; continue; }
    const coord = pinToCoord(m, size);
    if (!coord) { senzaCoord++; continue; }
    await updateFrontmatter(dest, (f) => { f.coord = coord; });
    synced++;
  }
  const coda = [senzaNota && `${senzaNota} senza nota`, senzaCoord && `${senzaCoord} senza coord`]
    .filter(Boolean).join(", ");
  new Notice(`Sincronizzati ${synced} pin → coord${coda ? ` (${coda})` : ""}.`);
  return "";
}
