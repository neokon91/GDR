// importa_mappa.js — importa una mappa Watabou nel vault e ne PIAZZA i toponimi.
// Legge un SVG Watabou (Realm/Perilous Shores, City, Village) dal vault: imposta il
// campo `mappa` (+ `mappa_origine` dal JSON gemello), estrae i toponimi dai <text> e
// (1) crea una nota `luogo` per ognuno con le coordinate, (2) genera il sidecar dei
// segnaposto `<immagine>.markers.json` (plugin Jareika/zoom-map) coi pin già linkati.
// Script Templater autonomo (tp.user.importa_mappa), richiamato da meta_actions.
// NB: la convenzione di coordinata dei marker (pixel, origine alto-sx) è la più comune
// per le mappe-immagine; se i pin uscissero specchiati in verticale, vedi FLIP_Y.

const FLIP_Y = false;  // metti true se i pin risultano ribaltati sull'asse verticale

// --- Nucleo PURO (testato isolato) -------------------------------------------
// Da un SVG Watabou: dimensioni della tela, offset del gruppo di centratura e i
// toponimi (i <text> "parola"; saltati barra-scala, numeri e lettere singole delle
// label su curva). Le coordinate dei toponimi sono riportate nello spazio-pixel della
// tela sommando l'offset del <g transform="translate(...)"> che centra il disegno.
function parseSvgMap(svg) {
  const s = String(svg || "");
  const sizeM = s.match(/<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/i);
  const size = sizeM ? { w: Math.round(+sizeM[1]), h: Math.round(+sizeM[2]) } : { w: 1000, h: 1000 };
  const gM = s.match(/<g[^>]*transform="[^"]*translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/i);
  const offset = gM ? { x: +gM[1], y: +gM[2] } : { x: 0, y: 0 };
  const rx = /<text[^>]*translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)[^>]*>([^<]+)<\/text>/gi;
  const byName = new Map();  // dedup (Watabou rende ogni label due volte: outline + fill)
  let m;
  while ((m = rx.exec(s))) {
    const name = m[3].replace(/\s+/g, " ").trim();
    if (name.length < 3 || /^\d+$/.test(name)) continue;             // barra-scala / rumore
    const y = +m[2] + offset.y;
    if (!byName.has(name)) byName.set(name, { name, x: Math.round(+m[1] + offset.x), y: Math.round(FLIP_Y ? size.h - y : y) });
  }
  return { size, offset, places: [...byName.values()] };
}

// Costruisce il sidecar `<immagine>.markers.json` del plugin zoom-map: un marker per
// toponimo (x,y in pixel, etichetta+tooltip = nome, link = [[nota]] via linkFor).
function buildMarkers(imagePath, size, places, linkFor) {
  return {
    size,
    layers: [{ id: "default", name: "Default", visible: true, locked: false }],
    markers: (places || []).map((p, i) => ({
      id: "wb-" + i, x: p.x, y: p.y, label: p.name, tooltip: p.name,
      link: linkFor ? linkFor(p.name) : "", icon: "",
    })),
    bases: [imagePath], overlays: [], activeBase: imagePath,
    measurement: { scales: {}, customUnitPxPerUnit: {}, travelTimePresetIds: [], travelDaysEnabled: false },
    pinSizeOverrides: {}, grids: [], panClamp: true, drawLayers: [], drawings: [], secondScreen: {}, textLayers: [],
  };
}

// Frontmatter minimo di un luogo importato (id stabili; coord nello spazio-mappa).
function luogoFrontmatter(nome, mondo, x, y) {
  const q = (v) => JSON.stringify(String(v == null ? "" : v));
  return `---\nnome: ${q(nome)}\ncategoria: luogo\ntipo: luogo\n`
    + (mondo ? `mondo: "[[${mondo}]]"\n` : "")
    + `coord: ${q(x + ", " + y)}\nstato: bozza\n---\n\n*Importato da mappa Watabou.*\n`;
}

function nomeFileLuogo(nome) {
  return String(nome || "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Luogo";
}

// --- Runtime ------------------------------------------------------------------
async function importa_mappa(tp) {
  if (!app.vault || !app.vault.getFiles) { new Notice("Vault non disponibile."); return ""; }
  // 1) Scegli l'immagine-mappa (SVG/PNG/...) presente nel vault.
  const imgs = app.vault.getFiles().filter((f) => /\.(svg|png|jpe?g|webp|avif)$/i.test(f.path));
  if (!imgs.length) { new Notice("Nessuna immagine nel vault: trascina l'export Watabou (SVG/PNG) in Media/."); return ""; }
  imgs.sort((a, b) => a.path.localeCompare(b.path));
  const img = await tp.system.suggester(imgs.map((f) => f.path), imgs, false, "Quale mappa importare?");
  if (!img) return "";

  // 2) Nota bersaglio: l'attiva se è un mondo/luogo, altrimenti scegli fra i mondi.
  const active = app.workspace.getActiveFile && app.workspace.getActiveFile();
  const aFm = active ? (app.metadataCache.getFileCache(active)?.frontmatter || {}) : {};
  let target = (aFm.categoria === "mondo" || aFm.categoria === "luogo") ? active : null;
  if (!target) {
    const mondi = app.vault.getMarkdownFiles()
      .map((f) => ({ f, fm: app.metadataCache.getFileCache(f)?.frontmatter || {} }))
      .filter((e) => e.fm.categoria === "mondo");
    if (!mondi.length) { new Notice("Apri un Mondo/luogo, o creane uno, poi rilancia."); return ""; }
    const chosen = mondi.length === 1 ? mondi[0]
      : await tp.system.suggester(mondi.map((e) => e.f.basename), mondi, false, "Mappa di quale mondo?");
    if (!chosen) return "";
    target = chosen.f;
  }
  const tFm = app.metadataCache.getFileCache(target)?.frontmatter || {};
  // Mondo a cui agganciare i luoghi importati: il bersaglio se è un mondo, altrimenti il suo `mondo`.
  const mondoNome = tFm.categoria === "mondo" ? target.basename
    : String(tFm.mondo || "").replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();

  // 3) Origine dal JSON gemello (stesso nome, .json): URL del generatore + nome.
  let origine = "";
  const jsonPath = img.path.replace(/\.[^.]+$/, ".json");
  const jf = app.vault.getAbstractFileByPath(jsonPath);
  if (jf) { try { const j = JSON.parse(await app.vault.read(jf)); origine = String(j.origin || j.url || ""); } catch (e) { /* JSON assente/illeggibile */ } }

  // 4) Imposta mappa + origine sul bersaglio.
  await app.fileManager.processFrontMatter(target, (fm) => {
    // Link CON estensione: per i file non-markdown (immagini) Obsidian risolve `[[nome.svg]]`,
    // non `[[nome]]` (che cercherebbe una nota .md) → renderMap entra nel ramo immagine→zoom-map.
    fm.mappa = `[[${img.name}]]`;
    if (origine) fm.mappa_origine = origine;
  });

  // 5) Toponimi (solo SVG): crea i luoghi mancanti + prepara i link dei marker.
  let places = [];
  if (/\.svg$/i.test(img.path)) {
    try { places = parseSvgMap(await app.vault.read(img)).places; } catch (e) { places = []; }
  }
  let creati = 0;
  const linkByName = new Map();
  for (const p of places) {
    const dest = app.metadataCache.getFirstLinkpathDest?.(p.name, target.path);
    if (dest) { linkByName.set(p.name, dest.basename); continue; }  // luogo già esistente
    const path = `Mondi/Luoghi/${nomeFileLuogo(p.name)}.md`;
    if (!app.vault.getAbstractFileByPath(path)) {
      try { await app.vault.create(path, luogoFrontmatter(p.name, mondoNome, p.x, p.y)); creati++; } catch (e) { /* nome collide: salta */ }
    }
    linkByName.set(p.name, nomeFileLuogo(p.name));
  }

  // 6) Sidecar segnaposto: NON sovrascrive uno esistente (protegge i pin già piazzati).
  let pin = 0;
  const markersPath = img.path + ".markers.json";
  if (places.length && !app.vault.getAbstractFileByPath(markersPath)) {
    const { size } = parseSvgMap(await app.vault.read(img));
    const data = buildMarkers(img.path, size, places, (n) => `[[${linkByName.get(n) || n}]]`);
    try { await app.vault.create(markersPath, JSON.stringify(data, null, 2)); pin = places.length; } catch (e) { /* ignora */ }
  }

  const coda = pin ? ` ${pin} segnaposto generati — apri la mappa e verificane la posizione.`
    : (places.length ? " (segnaposto NON toccati: esiste già un .markers.json)." : "");
  new Notice(`Mappa «${img.basename}» impostata su «${target.basename}». ${creati} luoghi creati.${coda}`);
  return "";
}

module.exports = importa_mappa;
// Esposti per i test (nucleo puro).
module.exports.parseSvgMap = parseSvgMap;
module.exports.buildMarkers = buildMarkers;
module.exports.luogoFrontmatter = luogoFrontmatter;
