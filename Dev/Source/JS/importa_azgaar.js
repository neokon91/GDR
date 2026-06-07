// importa_azgaar.js — import PROFONDO di una mappa Azgaar (Fantasy Map Generator).
// Legge il FULL JSON export (Menu → Export → "Export to JSON / Full"): crea le note del
// vault dai dati strutturati — `cultura` (cultures), `culto` (religions), `regno`
// (states), `luogo` (burgs + markers) — con i collegamenti incrociati e le coordinate.
// Se scegli anche l'SVG, imposta il campo `mappa` del Mondo e genera il sidecar dei
// segnaposto `<immagine>.markers.json` (plugin zoom-map) coi pin di burgs/marker.
// FMG è MIT: schema dei campi ricavato dal modello dati ufficiale. Script Templater
// autonomo (tp.user.importa_azgaar). NB: burg.x/marker.x sono GIÀ in pixel su
// info.width×info.height → nessuna proiezione, coord pronte per i marker.

async function loadCore() {
  try { return JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json")); }
  catch (e) { return {}; }
}

// --- Nucleo PURO (testato isolato): FULL JSON Azgaar → entità del vault ----------
function _nome(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
// Gli array Azgaar sono 1-based con un placeholder in [0]; gli elementi cancellati
// hanno `removed`. Tieni solo quelli reali e con un nome.
function _vivi(arr) {
  return (Array.isArray(arr) ? arr : []).filter((e) => e && Number(e.i) > 0 && !e.removed && _nome(e.name));
}

// URL del City/Village Generator di Watabou per un burg (catena mondo→città): link
// custom se presente, altrimenti l'URL MFCG dal seed + parametri del burg. Watabou
// usa City Generator per i centri, Village per i piccoli (soglia ~1000 abitanti).
function cityLink(b, mapSeed, popRate) {
  if (b.link) return String(b.link);
  const seed = b.MFCG || (String(mapSeed || "") + String(b.i || 0).padStart(4, "0"));
  const pop = Math.round((Number(b.population) || 0) * (Number(popRate) || 1000));
  const f = (v) => (v ? 1 : 0);
  const tool = pop >= 1000 ? "city-generator" : "village-generator";
  return `https://watabou.github.io/${tool}/?name=${encodeURIComponent(_nome(b.name))}&population=${pop}&seed=${seed}`
    + `&citadel=${f(b.citadel)}&walls=${f(b.walls)}&plaza=${f(b.plaza)}&temple=${f(b.temple)}&shantytown=${f(b.shanty)}`;
}

// Diplomazia (FMG: diplomacy[j] = rapporto verso lo stato j; 'x' = sé/neutrali).
const _OSTILI = new Set(["Enemy", "Rival"]);
const _ALLEATI = new Set(["Ally", "Friendly", "Suzerain", "Vassal"]);

function parseAzgaar(json) {
  const d = typeof json === "string" ? JSON.parse(json) : (json || {});
  const info = d.info || {}, pack = d.pack || {}, settings = d.settings || {};
  const mapSeed = String(info.seed || ""), popRate = Number(settings.populationRate) || 1000;
  const cultura = {}; for (const c of _vivi(pack.cultures)) cultura[c.i] = _nome(c.name);
  const stato = {}; for (const s of _vivi(pack.states)) stato[s.i] = _nome(s.name);
  const legenda = {}; for (const n of (Array.isArray(d.notes) ? d.notes : [])) if (n && n.id) legenda[n.id] = String(n.legend || "");
  // cella → nome burg (per rotte/eserciti). Biomi: array parallelo cells.biome → nome.
  const cellBurg = {}; for (const b of _vivi(pack.burgs)) cellBurg[b.cell] = _nome(b.name);
  const biomeName = Array.isArray((d.biomesData || pack.biomesData || {}).name) ? (d.biomesData || pack.biomesData).name : [];
  const cellsBiome = pack.cells && Array.isArray(pack.cells.biome) ? pack.cells.biome : [];
  const diplo = (s, ok) => (Array.isArray(s.diplomacy) ? s.diplomacy : []).map((rel, j) => (ok.has(rel) ? stato[j] : "")).filter(Boolean);
  return {
    info: { nome: _nome(info.mapName), width: Math.round(Number(info.width) || 1000), height: Math.round(Number(info.height) || 1000), seed: mapSeed },
    culture: _vivi(pack.cultures).map((c) => ({ nome: _nome(c.name) })),
    culti: _vivi(pack.religions).map((r) => ({ nome: _nome(r.name), cultura: cultura[r.culture] || "" })),
    regni: _vivi(pack.states).map((s) => ({
      nome: _nome(s.name), fullName: _nome(s.fullName), cultura: cultura[s.culture] || "",
      nemici: diplo(s, _OSTILI), alleati: diplo(s, _ALLEATI),
    })),
    burgs: _vivi(pack.burgs).map((b) => ({
      nome: _nome(b.name), x: Math.round(Number(b.x) || 0), y: Math.round(Number(b.y) || 0),
      capitale: !!b.capital, porto: !!b.port, popolazione: Number(b.population) || 0,
      regno: stato[b.state] || "", cultura: cultura[b.culture] || "",
      citta_url: cityLink(b, mapSeed, popRate), bioma: _nome(biomeName[cellsBiome[b.cell]] || ""),
    })),
    // I marker hanno spesso nome vuoto → ricadi su tipo; la legenda (HTML) va nel corpo.
    markers: (Array.isArray(pack.markers) ? pack.markers : []).filter((m) => m && !m.removed && Number.isFinite(Number(m.x)))
      .map((m) => ({ nome: _nome(m.name) || _nome(m.type) || "Segnaposto", x: Math.round(Number(m.x) || 0), y: Math.round(Number(m.y) || 0), tipo: _nome(m.type), legenda: legenda["marker" + m.i] || String(m.legend || "") })),
    // Eserciti: i reggimenti di tutti gli stati (state.military[]) → entità `esercito`.
    eserciti: _vivi(pack.states).flatMap((s) => (Array.isArray(s.military) ? s.military : [])
      .filter((r) => r && _nome(r.name)).map((r) => ({ nome: _nome(r.name), x: Math.round(Number(r.x) || 0), y: Math.round(Number(r.y) || 0), regno: _nome(s.name), schierato: cellBurg[r.cell] || "" }))),
    // Rotte NOMINATE (roads/trails/searoutes): estremi = burg ai due capi (dalla cella).
    rotte: (Array.isArray(pack.routes) ? pack.routes : []).filter((r) => r && _nome(r.name)).map((r) => {
      const pts = Array.isArray(r.points) ? r.points : [], capo = (p) => (p && cellBurg[p[2]]) || "";
      return { nome: _nome(r.name), tipo: _nome(r.group), estremi: Array.from(new Set([capo(pts[0]), capo(pts[pts.length - 1])].filter(Boolean))) };
    }),
    // Zone (eventi/aree) visibili e nominate → entità `evento`.
    zone: (Array.isArray(pack.zones) ? pack.zones : []).filter((z) => z && !z.hidden && _nome(z.name)).map((z) => ({ nome: _nome(z.name), tipo: _nome(z.type) })),
    // Province → sotto-regioni di uno stato.
    province: _vivi(pack.provinces).map((p) => ({ nome: _nome(p.name), fullName: _nome(p.fullName), regno: stato[p.state] || "" })),
    // Fiumi NOMINATI → luoghi (feature geografica).
    fiumi: (Array.isArray(pack.rivers) ? pack.rivers : []).filter((r) => r && _nome(r.name)).map((r) => ({ nome: _nome(r.name) })),
    // Biomi PRESENTI (tipi, non per-cella): le note `bioma` del mondo.
    biomi: [...new Set(cellsBiome)].map((i) => _nome(biomeName[i])).filter((n) => n && n !== "Marine").map((nome) => ({ nome })),
  };
}

// Sidecar `<immagine>.markers.json` del plugin zoom-map dai punti (burgs+markers).
// Schema VERIFICATO in-app contro «TTRPG Tools - Maps» v2.0.2 (vedi importa_mappa.buildMarkers):
// type "pin"; x/y NORMALIZZATE 0..1; `layer`+`iconKey`; `link` SENZA `[[ ]]`; `tooltipLabelAlways`.
function buildMarkers(imagePath, size, punti) {
  const w = (size && size.w) || 1, h = (size && size.h) || 1;
  return {
    size,
    layers: [{ id: "default", name: "Default", visible: true, locked: false }],
    markers: (punti || []).map((p, i) => ({
      type: "pin", id: "az-" + i,
      x: p.x / w, y: p.y / h,
      layer: "default", iconKey: "pinRed",
      link: p.link || p.nome, tooltip: p.nome, tooltipLabelAlways: true,
    })),
    bases: [imagePath], overlays: [], activeBase: imagePath,
    measurement: { scales: {}, customUnitPxPerUnit: {}, travelTimePresetIds: [], travelDaysEnabled: false },
    pinSizeOverrides: {}, grids: [], panClamp: true, drawLayers: [], drawings: [], secondScreen: {}, textLayers: [],
  };
}

function _file(nome) {
  return String(nome || "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Nota";
}
function _q(v) { return JSON.stringify(String(v == null ? "" : v)); }
// Frontmatter minimo-VALIDO (id stabili) + corpo coi link incrociati (così il grafo si
// connette senza inventare campi-relazione). `extra` = righe frontmatter aggiuntive.
function notaEntita(categoria, tipo, nome, mondo, corpo, extra) {
  return `---\nnome: ${_q(nome)}\ncategoria: ${categoria}\ntipo: ${tipo}\n`
    + (mondo ? `mondo: "[[${mondo}]]"\n` : "") + (extra || "")
    + `stato: bozza\n---\n\n${corpo || ""}\n*Importato da Azgaar.*\n`;
}

// --- Runtime ------------------------------------------------------------------
async function importa_azgaar(tp) {
  const core = await loadCore();
  const folders = core.folders || {}, categories = core.categories || {};
  const tipoDi = (cat) => ((categories[cat] || {}).subtypes || [])[0] || cat;  // primo sottotipo come default
  const cartella = (cat) => folders[cat] || `Mondi/${cat}`;

  // 1) Scegli il FULL JSON di Azgaar (file .json del vault).
  const jsons = app.vault.getFiles().filter((f) => /\.json$/i.test(f.path) && !f.path.startsWith("z.automazioni/"));
  if (!jsons.length) { new Notice("Nessun .json nel vault: esporta da Azgaar (Export → Full JSON) e trascinalo in Media/."); return ""; }
  jsons.sort((a, b) => a.path.localeCompare(b.path));
  const jf = await tp.system.suggester(jsons.map((f) => f.path), jsons, false, "Quale FULL JSON di Azgaar importare?");
  if (!jf) return "";
  let data;
  try { data = parseAzgaar(await app.vault.read(jf)); }
  catch (e) { new Notice("JSON Azgaar illeggibile o non valido."); return ""; }

  // 2) Mondo bersaglio (l'attivo se è un mondo, altrimenti scegli/crea-prima).
  const active = app.workspace.getActiveFile && app.workspace.getActiveFile();
  const aFm = active ? (app.metadataCache.getFileCache(active)?.frontmatter || {}) : {};
  let mondoFile = aFm.categoria === "mondo" ? active : null;
  if (!mondoFile) {
    const mondi = app.vault.getMarkdownFiles()
      .map((f) => ({ f, fm: app.metadataCache.getFileCache(f)?.frontmatter || {} }))
      .filter((e) => e.fm.categoria === "mondo");
    if (!mondi.length) { new Notice("Crea prima un Mondo, poi rilancia l'import."); return ""; }
    const ch = mondi.length === 1 ? mondi[0]
      : await tp.system.suggester(mondi.map((e) => e.f.basename), mondi, false, "In quale mondo importo?");
    if (!ch) return "";
    mondoFile = ch.f;
  }
  const mondo = mondoFile.basename;

  // 3) Crea le note (salta gli omonimi già esistenti). Ordine: cultura → culto → regno
  // → luogo, così i link incrociati nel corpo trovano le note appena create.
  const conta = { cultura: 0, culto: 0, regno: 0, luogo: 0, esercito: 0, rotta: 0, evento: 0, bioma: 0 };
  const crea = async (cat, nome, corpo, extra) => {
    if (!nome) return;
    const path = `${cartella(cat)}/${_file(nome)}.md`;
    if (app.metadataCache.getFirstLinkpathDest?.(nome, mondoFile.path) || app.vault.getAbstractFileByPath(path)) return;
    try { await app.vault.create(path, notaEntita(cat, tipoDi(cat), nome, mondo, corpo, extra)); conta[cat]++; } catch (e) { /* collisione/cartella: salta */ }
  };

  for (const c of data.culture) await crea("cultura", c.nome, "");
  for (const r of data.culti) await crea("culto", r.nome, r.cultura ? `Religione legata alla cultura [[${r.cultura}]].\n` : "");
  for (const s of data.regni) {
    const dipl = [s.nemici.length ? `Nemici: ${s.nemici.map((n) => `[[${n}]]`).join(", ")}.` : "",
      s.alleati.length ? `Alleati: ${s.alleati.map((n) => `[[${n}]]`).join(", ")}.` : ""].filter(Boolean).join(" ");
    await crea("regno", s.nome, (s.fullName && s.fullName !== s.nome ? `**${s.fullName}**.\n` : "")
      + (s.cultura ? `Cultura dominante: [[${s.cultura}]].\n` : "") + (dipl ? dipl + "\n" : ""));
  }
  for (const b of data.burgs) {
    const righe = [b.capitale ? "Capitale" : "Insediamento", b.regno ? `di [[${b.regno}]]` : "",
      b.cultura ? `· cultura [[${b.cultura}]]` : "", b.bioma ? `· bioma [[${b.bioma}]]` : ""].filter(Boolean).join(" ");
    // mappa_origine = link Watabou City/Village del burg → un clic apre la città dettagliata.
    const extra = `coord: ${_q(b.x + ", " + b.y)}\n` + (b.citta_url ? `mappa_origine: ${_q(b.citta_url)}\n` : "");
    await crea("luogo", b.nome, `${righe}.${b.popolazione ? ` Popolazione ~${Math.round(b.popolazione * 1000)}.` : ""}\n`, extra);
  }
  for (const m of data.markers) await crea("luogo", m.nome, `${m.tipo ? `*${m.tipo}.* ` : ""}${m.legenda || ""}\n`, `coord: ${_q(m.x + ", " + m.y)}\n`);
  // Eserciti → esercito (relazioni regno/schierato_in nel frontmatter).
  for (const a of data.eserciti) {
    const extra = (a.regno ? `regno: "[[${a.regno}]]"\n` : "") + (a.schierato ? `schierato_in: "[[${a.schierato}]]"\n` : "");
    await crea("esercito", a.nome, `Esercito${a.regno ? ` di [[${a.regno}]]` : ""}${a.schierato ? `, schierato a [[${a.schierato}]]` : ""}.\n`, extra);
  }
  // Rotte → rotta (estremi = burg ai capi, come relazione multipla).
  for (const r of data.rotte) {
    const extra = r.estremi.length ? `estremi:\n${r.estremi.map((n) => `  - "[[${n}]]"`).join("\n")}\n` : "";
    await crea("rotta", r.nome, `${r.tipo ? `*${r.tipo}.* ` : ""}${r.estremi.length ? `Collega ${r.estremi.map((n) => `[[${n}]]`).join(" ↔ ")}.` : ""}\n`, extra);
  }
  // Zone → evento (eventi/aree del mondo: invasioni, pestilenze, disastri…).
  for (const z of data.zone) await crea("evento", z.nome, `${z.tipo ? `*${z.tipo}.*` : ""}\n`);
  // Province → luogo (sotto-regioni di uno stato).
  for (const p of data.province) await crea("luogo", p.nome, `Provincia${p.regno ? ` di [[${p.regno}]]` : ""}.\n`);
  // Fiumi nominati → luogo (feature geografica).
  for (const fi of data.fiumi) await crea("luogo", fi.nome, "Fiume.\n");
  // Biomi PRESENTI (tipi) → bioma del mondo.
  for (const bi of data.biomi) await crea("bioma", bi.nome, "");

  // 4) Origine mappa sul Mondo (URL FMG col seed, rigenerabile).
  if (data.info.seed) {
    await app.fileManager.processFrontMatter(mondoFile, (fm) => {
      if (!fm.mappa_origine) fm.mappa_origine = `https://azgaar.github.io/Fantasy-Map-Generator/?seed=${data.info.seed}`;
    });
  }

  // 5) Opzionale: scegli l'SVG → imposta `mappa` + genera i segnaposto (burgs+markers).
  let pin = 0;
  const svgs = app.vault.getFiles().filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f.path));
  if (svgs.length) {
    svgs.sort((a, b) => a.path.localeCompare(b.path));
    const img = await tp.system.suggester(
      ["— nessuna immagine, solo le note —", ...svgs.map((f) => f.path)],
      [null, ...svgs], false, "Immagine-mappa Azgaar (SVG/PNG) per i segnaposto?");
    if (img) {
      await app.fileManager.processFrontMatter(mondoFile, (fm) => { fm.mappa = `[[${img.name}]]`; });
      const markersPath = img.path + ".markers.json";
      if (!app.vault.getAbstractFileByPath(markersPath)) {
        const punti = [...data.burgs, ...data.markers].map((p) => ({ nome: p.nome, x: p.x, y: p.y, link: _file(p.nome) }));
        try { await app.vault.create(markersPath, JSON.stringify(buildMarkers(img.path, { w: data.info.width, h: data.info.height }, punti), null, 2)); pin = punti.length; } catch (e) { /* ignora */ }
      }
    }
  }

  new Notice(`Azgaar «${data.info.nome || jf.basename}» → ${mondo}: ${conta.regno} regni · ${conta.cultura} culture · ${conta.culto} culti · ${conta.luogo} luoghi · ${conta.esercito} eserciti · ${conta.rotta} rotte · ${conta.evento} eventi · ${conta.bioma} biomi.${pin ? ` ${pin} segnaposto (verifica la posizione).` : ""}`);
  return "";
}

module.exports = importa_azgaar;
// Esposti per i test (nucleo puro).
module.exports.parseAzgaar = parseAzgaar;
module.exports.buildMarkers = buildMarkers;
