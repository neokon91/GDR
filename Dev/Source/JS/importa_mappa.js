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
// Matrici affini SVG [a,b,c,d,e,f] = [[a,c,e],[b,d,f]]. Servono perché Watabou rende le
// label "su curva" lettera-per-lettera dentro gruppi annidati ruotati/scalati: solo
// componendo l'intera catena di transform si ottiene la posizione vera del toponimo.
function mulMat(m, n) {                                   // m ∘ n (applica prima n)
  return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3],
          m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
}
function applyMat(m, x, y) { return [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]]; }
function parseTransform(str) {                            // "translate(..) rotate(..) ..." → matrice
  let m = [1,0,0,1,0,0];
  const rx = /(translate|rotate|scale|matrix)\s*\(([^)]*)\)/gi;
  let t;
  while ((t = rx.exec(String(str || "")))) {
    const a = t[2].split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
    let n = [1,0,0,1,0,0];
    if (t[1] === "translate") n = [1,0,0,1, a[0]||0, a[1]||0];
    else if (t[1] === "scale") n = [a[0]||1, 0, 0, (a.length>1?a[1]:a[0])||1, 0, 0];
    else if (t[1] === "rotate") {
      const r = (a[0]||0)*Math.PI/180, c = Math.cos(r), sn = Math.sin(r);
      n = [c, sn, -sn, c, 0, 0];
      if (a.length >= 3) n = mulMat(mulMat([1,0,0,1,a[1],a[2]], n), [1,0,0,1,-a[1],-a[2]]);
    } else if (t[1] === "matrix" && a.length === 6) n = a;
    m = mulMat(m, n);
  }
  return m;
}

// Da un SVG Watabou: dimensioni della tela e i toponimi nello spazio-pixel. Scansione con
// stack di CTM (ogni <g> spinge la sua matrice composta, </g> la toglie); ogni <text> è
// posizionato in assoluto. Testi multi-carattere = label intere; sequenze di lettere singole
// consecutive = una label "su curva" (posizione = prima lettera). Dedup outline+fill; saltati
// barra-scala/numeri. Lo spazio glifo separa le parole della stessa label (es. "Artiglio Nero").
function parseSvgMap(svg) {
  const s = String(svg || "");
  const sizeM = s.match(/<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/i);
  const size = sizeM ? { w: Math.round(+sizeM[1]), h: Math.round(+sizeM[2]) } : { w: 1000, h: 1000 };
  const offM = s.match(/<g[^>]*transform="[^"]*translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/i);
  const offset = offM ? { x: +offM[1], y: +offM[2] } : { x: 0, y: 0 };

  const tok = /<g\b([^>]*)>|<\/g>|<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  const stack = [[1,0,0,1,0,0]];
  const texts = [];
  let m;
  while ((m = tok.exec(s))) {
    if (m[0].charAt(1) === "/") { if (stack.length > 1) stack.pop(); continue; }   // </g>
    if (m[1] !== undefined) {                                                      // <g ...>
      const ctm = stack[stack.length - 1];
      const tM = (m[1].match(/transform="([^"]*)"/i) || [])[1];
      if (!/\/\s*$/.test(m[1])) stack.push(tM ? mulMat(ctm, parseTransform(tM)) : ctm);
      continue;
    }
    const ctm = stack[stack.length - 1];                                           // <text>
    let lx = 0, ly = 0;
    const tt = (m[2].match(/transform="([^"]*)"/i) || [])[1];
    if (tt) { const tm = parseTransform(tt); lx = tm[4]; ly = tm[5]; }
    else { const ax = m[2].match(/\bx="([-\d.]+)"/i), ay = m[2].match(/\by="([-\d.]+)"/i); if (ax) lx = +ax[1]; if (ay) ly = +ay[1]; }
    const [px, py] = applyMat(ctm, lx, ly);
    // Label multi-riga = <text> con <tspan>: concatena il testo dei figli (es. "Artiglio Nero").
    const raw = m[3].indexOf("<") >= 0 ? m[3].replace(/<[^>]*>/g, "") : m[3];
    const fM = m[2].match(/font(?:-size)?:\s*([\d.]+)/i);    // px del font (spazio LOCALE)
    const scale = Math.hypot(ctm[0], ctm[1]) || 1;          // scala del CTM (gruppi ruotati/scalati)
    texts.push({ raw, x: px, y: py, fs: (fM ? +fM[1] : 26) * scale });  // altezza-font in spazio-TELA
  }

  const byName = new Map();                                  // dedup (outline+fill)
  const addPlace = (name, x, y) => {
    if (name.length < 3 || /^\d+$/.test(name)) return;       // barra-scala / rumore
    if (!byName.has(name)) byName.set(name, { name, x: Math.round(x), y: Math.round(FLIP_Y ? size.h - y : y) });
  };
  // Soglia di "salto" RELATIVA al FONT (in spazio-tela), non un 80px fisso: regge sia le mappe
  // regionali grandi (font grande) sia le città piccole (font piccolo), dove un valore fisso
  // fondeva le label (CASTELLOCASTELLO, PEARL MILLPORTO). Dentro una parola le lettere distano
  // ~1 font; un salto > ~1.6 font = duplicato outline+fill o label adiacente → spezza. Il
  // collasso-doppioni è una rete di sicurezza per gli outline+fill che sfuggono.
  let run = null;
  const collapseDouble = (s) => {                            // "CASTELLOCASTELLO" → "CASTELLO"
    const h = s.length / 2;
    return (s.length % 2 === 0 && s.slice(0, h) === s.slice(h)) ? s.slice(0, h) : s;
  };
  const flush = () => {
    if (run) { addPlace(collapseDouble(run.chars.join("").replace(/\s+/g, " ").trim()), run.x, run.y); run = null; }
  };
  for (const t of texts) {
    const c = t.raw;
    const wordChar = /^[\p{L}'’\-]$/u.test(c), space = /^\s$/.test(c);
    if (run && (wordChar || space)) {                        // salto di posizione → spezza il run
      const d = Math.hypot(t.x - run.lx, t.y - run.ly);
      if (d > Math.max(20, run.fs * 1.6)) flush();
    }
    if (wordChar) {                                          // lettera/apostrofo → label su curva
      if (!run) run = { chars: [], x: t.x, y: t.y, lx: t.x, ly: t.y, fs: t.fs };
      run.chars.push(c); run.lx = t.x; run.ly = t.y;
    } else if (space && run) {                               // spazio dentro la label
      run.chars.push(" "); run.lx = t.x; run.ly = t.y;
    } else {                                                 // parola intera / numero / fine
      flush();
      const name = c.replace(/\s+/g, " ").trim();
      if (name.length >= 2) addPlace(name, t.x, t.y);
    }
  }
  flush();
  return { size, offset, places: [...byName.values()] };
}

// Costruisce il sidecar `<immagine>.markers.json` del plugin zoom-map: un marker per
// toponimo. Schema VERIFICATO in-app contro «TTRPG Tools - Maps» v2.0.2 (QA 2026-06-07):
// type "pin"; x/y NORMALIZZATE 0..1 (frazione delle dimensioni, NON pixel); `layer`
// (non layerId); `iconKey` (es. "pinRed"); `link` SENZA `[[ ]]`; `tooltipLabelAlways`
// rende il nome come etichetta sulla mappa. Lo schema vecchio (label/icon""/pixel) NON
// veniva renderizzato: i marker erano filtrati via.
function buildMarkers(imagePath, size, places, linkFor) {
  const w = (size && size.w) || 1, h = (size && size.h) || 1;
  return {
    size,
    layers: [{ id: "default", name: "Default", visible: true, locked: false }],
    markers: (places || []).map((p, i) => ({
      type: "pin", id: "wb-" + i,
      x: p.x / w, y: p.y / h,
      layer: "default", iconKey: "pinRed",
      link: linkFor ? linkFor(p.name) : "", tooltip: p.name, tooltipLabelAlways: true,
    })),
    bases: [imagePath], overlays: [], activeBase: imagePath,
    measurement: { scales: {}, customUnitPxPerUnit: {}, travelTimePresetIds: [], travelDaysEnabled: false },
    pinSizeOverrides: {}, grids: [], panClamp: true, drawLayers: [], drawings: [], secondScreen: {}, textLayers: [],
  };
}

// Slug per l'id (stesso schema di create_entity → id stabili e coerenti col wizard).
function slugify(value) {
  return String(value == null ? "" : value).trim().toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "nota";
}

// Frontmatter di un luogo importato, ALLINEATO a create_entity (id/connessioni/sessioni/tags),
// così la nota è un'entità di PRIMA classe e il corpo-modello (luogoBody) la completa con
// infobox, tab, relazioni e tab Mappa — non più uno stub. coord nello spazio-mappa.
function luogoFrontmatter(nome, mondo, x, y) {
  const q = (v) => JSON.stringify(String(v == null ? "" : v));
  return `---\nid: ${q(slugify(nome))}\nnome: ${q(nome)}\ncategoria: luogo\ntipo: luogo\nstato: bozza\n`
    + `mondo: ${mondo ? `"[[${mondo}]]"` : '""'}\n`
    + `coord: ${q(x + ", " + y)}\nconnessioni: []\nsessioni: []\ntags: [gdr/bozza]\n---\n`;
}

function nomeFileLuogo(nome) {
  return String(nome || "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ") || "Luogo";
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
  let origine = "", mapName = "";
  const jsonPath = img.path.replace(/\.[^.]+$/, ".json");
  const jf = app.vault.getAbstractFileByPath(jsonPath);
  if (jf) { try { const j = JSON.parse(await app.vault.read(jf)); origine = String(j.origin || j.url || ""); mapName = String(j.name || ""); } catch (e) { /* JSON assente/illeggibile */ } }

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
    // Scarta il TITOLO della mappa (nome del mondo dal JSON gemello): è una label, non un luogo.
    const norm = (x) => String(x || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (mapName) places = places.filter((p) => norm(p.name) !== norm(mapName));
  }
  // Corpo-modello del Luogo (z.modelli/Luogo.md, salto la riga 1 = tag Templater): i luoghi
  // importati nascono col TEMPLATE completo (infobox, tab, relazioni, tab Mappa) come da
  // «Crea → Luogo», non come stub. Fallback minimale se il modello manca.
  let luogoBody = "\n*Importato da mappa Watabou.*\n";
  try {
    const mf = app.vault.getAbstractFileByPath("z.modelli/Luogo.md");
    if (mf) luogoBody = "\n" + (await app.vault.read(mf)).replace(/^[^\n]*\n/, "");
  } catch (e) { /* usa il fallback */ }

  let creati = 0;
  const linkByName = new Map();
  for (const p of places) {
    const dest = app.metadataCache.getFirstLinkpathDest?.(p.name, target.path);
    if (dest) { linkByName.set(p.name, dest.basename); continue; }  // luogo già esistente
    const path = `Mondi/Luoghi/${nomeFileLuogo(p.name)}.md`;
    if (!app.vault.getAbstractFileByPath(path)) {
      try { await app.vault.create(path, luogoFrontmatter(p.name, mondoNome, p.x, p.y) + luogoBody); creati++; } catch (e) { /* nome collide: salta */ }
    }
    linkByName.set(p.name, nomeFileLuogo(p.name));
  }

  // 6) Sidecar segnaposto: NON sovrascrive uno esistente (protegge i pin già piazzati).
  let pin = 0;
  const markersPath = img.path + ".markers.json";
  if (places.length && !app.vault.getAbstractFileByPath(markersPath)) {
    const { size } = parseSvgMap(await app.vault.read(img));
    const data = buildMarkers(img.path, size, places, (n) => linkByName.get(n) || n);
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
