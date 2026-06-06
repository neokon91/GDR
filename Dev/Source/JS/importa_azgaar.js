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

function parseAzgaar(json) {
  const d = typeof json === "string" ? JSON.parse(json) : (json || {});
  const info = d.info || {}, pack = d.pack || {};
  const cultura = {}; for (const c of _vivi(pack.cultures)) cultura[c.i] = _nome(c.name);
  const stato = {}; for (const s of _vivi(pack.states)) stato[s.i] = _nome(s.name);
  const legenda = {}; for (const n of (Array.isArray(d.notes) ? d.notes : [])) if (n && n.id) legenda[n.id] = String(n.legend || "");
  return {
    info: {
      nome: _nome(info.mapName), width: Math.round(Number(info.width) || 1000),
      height: Math.round(Number(info.height) || 1000), seed: String(info.seed || ""),
    },
    culture: _vivi(pack.cultures).map((c) => ({ nome: _nome(c.name) })),
    culti: _vivi(pack.religions).map((r) => ({ nome: _nome(r.name), cultura: cultura[r.culture] || "" })),
    regni: _vivi(pack.states).map((s) => ({ nome: _nome(s.name), fullName: _nome(s.fullName), cultura: cultura[s.culture] || "" })),
    burgs: _vivi(pack.burgs).map((b) => ({
      nome: _nome(b.name), x: Math.round(Number(b.x) || 0), y: Math.round(Number(b.y) || 0),
      capitale: !!b.capital, porto: !!b.port, popolazione: Number(b.population) || 0,
      regno: stato[b.state] || "", cultura: cultura[b.culture] || "",
    })),
    // I marker hanno spesso nome vuoto → ricadi su tipo; la legenda (HTML) va nel corpo.
    markers: (Array.isArray(pack.markers) ? pack.markers : [])
      .filter((m) => m && !m.removed && (Number.isFinite(Number(m.x))))
      .map((m) => ({
        nome: _nome(m.name) || _nome(m.type) || "Segnaposto", x: Math.round(Number(m.x) || 0),
        y: Math.round(Number(m.y) || 0), tipo: _nome(m.type), legenda: legenda["marker" + m.i] || String(m.legend || ""),
      })),
  };
}

// Sidecar `<immagine>.markers.json` del plugin zoom-map dai punti (burgs+markers).
function buildMarkers(imagePath, size, punti) {
  return {
    size,
    layers: [{ id: "default", name: "Default", visible: true, locked: false }],
    markers: (punti || []).map((p, i) => ({
      id: "az-" + i, x: p.x, y: p.y, label: p.nome, tooltip: p.nome,
      link: p.link || `[[${p.nome}]]`, icon: "",
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
  const conta = { cultura: 0, culto: 0, regno: 0, luogo: 0 };
  const crea = async (cat, nome, corpo, extra) => {
    if (!nome) return;
    const path = `${cartella(cat)}/${_file(nome)}.md`;
    if (app.metadataCache.getFirstLinkpathDest?.(nome, mondoFile.path) || app.vault.getAbstractFileByPath(path)) return;
    try { await app.vault.create(path, notaEntita(cat, tipoDi(cat), nome, mondo, corpo, extra)); conta[cat]++; } catch (e) { /* collisione/cartella: salta */ }
  };

  for (const c of data.culture) await crea("cultura", c.nome, "");
  for (const r of data.culti) await crea("culto", r.nome, r.cultura ? `Religione legata alla cultura [[${r.cultura}]].\n` : "");
  for (const s of data.regni) await crea("regno", s.nome, (s.fullName && s.fullName !== s.nome ? `**${s.fullName}**.\n` : "") + (s.cultura ? `Cultura dominante: [[${s.cultura}]].\n` : ""));
  for (const b of data.burgs) {
    const righe = [b.capitale ? "Capitale" : "Insediamento", b.regno ? `di [[${b.regno}]]` : "", b.cultura ? `· cultura [[${b.cultura}]]` : ""].filter(Boolean).join(" ");
    await crea("luogo", b.nome, `${righe}.${b.popolazione ? ` Popolazione ~${b.popolazione}.` : ""}\n`, `coord: ${_q(b.x + ", " + b.y)}\n`);
  }
  for (const m of data.markers) await crea("luogo", m.nome, `${m.tipo ? `*${m.tipo}.* ` : ""}${m.legenda || ""}\n`, `coord: ${_q(m.x + ", " + m.y)}\n`);

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
      await app.fileManager.processFrontMatter(mondoFile, (fm) => { fm.mappa = `[[${img.basename}]]`; });
      const markersPath = img.path + ".markers.json";
      if (!app.vault.getAbstractFileByPath(markersPath)) {
        const punti = [...data.burgs, ...data.markers].map((p) => ({ nome: p.nome, x: p.x, y: p.y, link: `[[${_file(p.nome)}]]` }));
        try { await app.vault.create(markersPath, JSON.stringify(buildMarkers(img.path, { w: data.info.width, h: data.info.height }, punti), null, 2)); pin = punti.length; } catch (e) { /* ignora */ }
      }
    }
  }

  new Notice(`Azgaar «${data.info.nome || jf.basename}» → ${mondo}: ${conta.regno} regni, ${conta.cultura} culture, ${conta.culto} culti, ${conta.luogo} luoghi.${pin ? ` ${pin} segnaposto (verifica la posizione).` : ""}`);
  return "";
}

module.exports = importa_azgaar;
// Esposti per i test (nucleo puro).
module.exports.parseAzgaar = parseAzgaar;
module.exports.buildMarkers = buildMarkers;
