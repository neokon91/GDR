// Pannelli dinamici GDR per JS Engine. Importato a runtime dal blocco js-engine
// (engine.importJs("z.automazioni/views.js")). Ogni funzione pubblica RITORNA
// markdown (con HTML inline per le card .gdr-card dello snippet gdr.css); il
// blocco lo rende con engine.markdown.create(...). Le query (backlink/fronti)
// usano la Dataview API passata come 'dv'. La logica vive QUI: aggiornarla si
// propaga alle note senza ricrearle (il corpo nota è un thin import+call).

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function text(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "").trim();
}

// Card come HTML inline (stile .gdr-card / .gdr-grid dello snippet del vault).
function card(title, body, cls = "") {
  return `<div class="gdr-card ${cls}"><strong>${title}</strong><br>${body || "Da compilare."}</div>`;
}

// Etichetta di rischio dalla pressione 0-10 (coerente con la macro tavolo()).
function pressureLabel(value) {
  const p = Number(value);
  if (!Number.isFinite(p)) return "—";
  if (p >= 7) return `🔴 Crisi (${p})`;
  if (p >= 4) return `🟠 Tensione (${p})`;
  return `🟢 Calma (${p})`;
}

// Wikilink robusto dal nome file (un Link Dataview non si rende in stringa md).
function noteLink(p) {
  return p && p.file ? `[[${p.file.name}]]` : "—";
}

// Risolve un link (path o oggetto Link) alla pagina Dataview, null se fallisce.
function resolve(dv, link) {
  try {
    return dv.page(link && link.path ? link.path : link);
  } catch (e) {
    return null;
  }
}

// Coordinata 2D dal campo `coord` ("x, y", anche "x y" o "(x,y)") → {x, y} | null.
// Primi due numeri trovati; serve alla distanza metrica in renderDintorni.
function parseCoord(value) {
  const m = String(value == null ? "" : value).match(/-?\d+(?:\.\d+)?/g);
  return m && m.length >= 2 ? { x: Number(m[0]), y: Number(m[1]) } : null;
}

// Reciprocità: chi cita questa nota (i link in frontmatter sono unidirezionali;
// i backlink danno il senso inverso). Per categoria + pressione: "chi dipende da
// me e quanto scotta". Ritorna markdown (tabella) o stringa vuota.
function renderBacklinks(dv, page) {
  if (!dv || !page) return "";
  const links = asArray(page.file && page.file.inlinks).map((l) => resolve(dv, l)).filter(Boolean);
  if (!links.length) return "*Nessuna nota lo cita ancora.*";
  const rows = links
    .map((p) => ({
      key: text(p.categoria) || "—",
      row: `| ${noteLink(p)} | ${text(p.categoria) || "—"} | ${pressureLabel(p.pressione)} |`,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((x) => x.row);
  return ["**Citato da:**", "", "| Nota | Categoria | Pressione |", "|:--|:--|:--|", ...rows].join("\n");
}

// Pannello "pronto al tavolo?": stato della superficie giocabile a colpo
// d'occhio + reciprocità. Non duplica i tab di input. Ritorna markdown.
function renderEntityPanel(dv, page) {
  if (!page) return "*Apri la nota per vedere il pannello.*";
  const cards = [
    card("Uso al tavolo", text(page.uso_al_tavolo), page.uso_al_tavolo ? "ready" : "missing"),
    card("Gancio", text(page.gancio), page.gancio ? "ready" : "missing"),
    card("Pressione", pressureLabel(page.pressione), Number(page.pressione) >= 7 ? "missing" : "ready"),
    card("Prossima mossa", text(page.prossima_mossa), page.prossima_mossa ? "ready" : "missing"),
  ].join("");
  const backlinks = renderBacklinks(dv, page);
  return `<div class="gdr-grid">${cards}</div>` + (backlinks ? `\n\n${backlinks}` : "");
}

// Risolve i link di una pagina ed estrae i "fronti": pressione + prossima mossa,
// ordinati per pressione decrescente (cosa preme di più).
function frontsFromLinks(dv, links) {
  return asArray(links)
    .map((l) => resolve(dv, l))
    .filter((p) => p && p.prossima_mossa)
    .map((p) => ({ link: noteLink(p), pressione: Number(p.pressione) || 0, mossa: text(p.prossima_mossa) }))
    .sort((a, b) => b.pressione - a.pressione);
}

// Pannello sessione: obiettivo/scena + i FRONTI delle entità collegate, così il
// DM vede in un colpo d'occhio cosa preme questa sessione. Ritorna markdown.
function renderSessionPanel(dv, page) {
  if (!page) return "*Apri la sessione per vedere il pannello.*";
  const cards = [
    card("Obiettivo", text(page.obiettivo), page.obiettivo ? "ready" : "missing"),
    card("Scena corrente", text(page.scena_corrente || page.apertura), "ready"),
  ].join("");
  let md = `<div class="gdr-grid">${cards}</div>`;
  const fronts = dv ? frontsFromLinks(dv, page.connessioni) : [];
  if (fronts.length) {
    const rows = fronts.map((f) => `| ${f.link} | ${pressureLabel(f.pressione)} | ${f.mossa} |`);
    md += "\n\n**Fronti collegati** — cosa preme adesso:\n\n";
    md += ["| Entità | Pressione | Prossima mossa |", "|:--|:--|:--|", ...rows].join("\n");
  }
  return md;
}

// === Radar degli assi tematici =============================================
// Disegna gli assi come radar SVG inline (niente dipendenze esterne). Asse nel
// formato ricco (vedi macro carattere): {id, nome, valori:{1..5:{etichetta}}}
// -> scala 1-5. La definizione per categoria sta in core.json (render.py la scrive
// nel payload) -> il componente la carica a runtime e così funziona per QUALSIASI
// categoria, abilitando il confronto fra entità. axisMax resta parametrico per
// non incrostare la scala nel disegno.

const RADAR_PALETTE = [
  "var(--text-accent)", "var(--color-red)", "var(--color-green)",
  "var(--color-orange)", "var(--color-purple)", "var(--color-cyan)",
];

// Scala massima di un asse (valori 1-5 -> 5). Parametrico via il numero di valori.
function axisMax(axis) {
  return axis && axis.valori ? Object.keys(axis.valori).length : 5;
}

// Etichetta del vertice: il nome dell'asse.
function axisLabel(axis) {
  return (axis && (axis.nome || axis.id)) || "";
}

// Valore numerico di un asse clampato a [0, max]; vuoto/non numerico -> centro.
function clampAxis(value, max = 10) {
  const n = Number(value);
  if (!Number.isFinite(n)) return max / 2;
  return Math.max(0, Math.min(max, n));
}

function polarPoint(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function svgEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// SVG (stringa) di un radar. axes = [{id, nome|destra, valori?}]; series =
// [{name, values:[raw], color}]. I valori grezzi sono clampati per-asse alla sua
// scala (5 ricco / 10 polare). <3 assi -> "" (un radar ha bisogno di 3 raggi).
function radarSvg(axes, series) {
  const N = (axes || []).length;
  if (N < 3) return "";
  const W = 260, H = 220, cx = 130, cy = 108, R = 70, step = 360 / N;
  const ring = (frac) =>
    axes.map((_, i) => polarPoint(cx, cy, R * frac, i * step).map((n) => n.toFixed(1)).join(",")).join(" ");
  let g = "";
  for (const frac of [0.25, 0.5, 0.75, 1]) {
    g += `<polygon points="${ring(frac)}" fill="none" stroke="var(--background-modifier-border)" stroke-width="0.5"/>`;
  }
  axes.forEach((a, i) => {
    const [ex, ey] = polarPoint(cx, cy, R, i * step);
    g += `<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="var(--background-modifier-border)" stroke-width="0.5"/>`;
    const [lx, ly] = polarPoint(cx, cy, R + 13, i * step);
    const anchor = lx > cx + 1 ? "start" : (lx < cx - 1 ? "end" : "middle");
    g += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="8" fill="var(--text-muted)" text-anchor="${anchor}" dominant-baseline="middle">${svgEscape(axisLabel(a))}</text>`;
  });
  series.forEach((s) => {
    const poly = axes.map((a, i) => {
      const m = axisMax(a);
      return polarPoint(cx, cy, R * clampAxis(s.values[i], m) / m, i * step).map((n) => n.toFixed(1)).join(",");
    }).join(" ");
    g += `<polygon points="${poly}" fill="${s.color}" fill-opacity="0.18" stroke="${s.color}" stroke-width="1.5"/>`;
  });
  series.forEach((s, i) => {
    g += `<text x="6" y="${12 + i * 12}" font-size="8" fill="${s.color}">■ ${svgEscape(s.name)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="gdr-radar-svg" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}

// core.json è immutabile a runtime (lo riscrive solo render.py a build): lo
// leggiamo una volta sola per sessione (cache per-modulo). I pannelli si
// ri-renderizzano spesso e prima rileggevano il file ad ogni render. Dopo una
// rebuild basta riaprire/ricaricare la nota (come già per views.js stesso).
let _coreCache = null;
async function loadCoreData(app) {
  if (_coreCache) return _coreCache;
  try {
    _coreCache = JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json"));
    return _coreCache;
  } catch (e) {
    return {};
  }
}

function axesFor(core, category) {
  return ((core.assi_tematici || {})[category]) || [];
}

function injectSvg(container, svg, emptyMsg) {
  if (!svg) {
    container.createEl("p", { text: emptyMsg, cls: "gdr-radar-empty" });
    return;
  }
  const wrap = container.createEl("div", { cls: "gdr-radar" });
  wrap.innerHTML = svg;
}

// Radar della SOLA nota corrente (usato dal tab Carattere via la macro grafico_assi).
async function renderAxesRadar(container, app, page) {
  if (!page) {
    container.createEl("p", { text: "Apri la nota per vedere il radar.", cls: "gdr-radar-empty" });
    return;
  }
  const core = await loadCoreData(app);
  const axes = axesFor(core, page.categoria);
  const values = axes.map((a) => page[a.id]);
  const name = page.nome || (page.file && page.file.name) || "—";
  injectSvg(container, radarSvg(axes, [{ name, values, color: RADAR_PALETTE[0] }]),
    "Servono almeno 3 assi tematici per il radar.");
}

// Radar come MARKDOWN (SVG inline) dai valori-assi passati, per il pannello
// REATTIVO meta-bind-js-view: i valori arrivano dai binding Meta Bind e si
// aggiornano live mentre muovi gli slider. 'valori' = {asseId: valore}.
function radarMarkdownFromValues(core, category, valori, name) {
  const axes = axesFor(core, category);
  const values = axes.map((a) => (valori || {})[a.id]);
  const svg = radarSvg(axes, [{ name: name || "—", values, color: RADAR_PALETTE[0] }]);
  return svg ? `<div class="gdr-radar">${svg}</div>` : "*Servono almeno 3 assi tematici per il radar.*";
}

// Radar di CONFRONTO fra entità: skin riusabile, richiamabile in qualsiasi nota.
// Sovrappone gli assi delle note elencate nel frontmatter `confronta` (lista di
// link); usa la categoria della prima entità risolta (devono condividere gli assi).
async function renderAxesCompare(container, app, dv, page) {
  if (!dv || !page) {
    container.createEl("p", { text: "Dataview non attivo o nessuna nota.", cls: "gdr-radar-empty" });
    return;
  }
  const entities = asArray(page.confronta).map((l) => resolve(dv, l)).filter(Boolean);
  if (!entities.length) {
    container.createEl("p", { text: "Aggiungi `confronta: [[A]], [[B]]` nel frontmatter.", cls: "gdr-radar-empty" });
    return;
  }
  const core = await loadCoreData(app);
  const category = entities[0].categoria;
  const axes = axesFor(core, category);
  const series = entities
    .filter((p) => p.categoria === category)
    .map((p, i) => ({
      name: p.file ? p.file.name : (p.nome || "—"),
      values: axes.map((a) => p[a.id]),
      color: RADAR_PALETTE[i % RADAR_PALETTE.length],
    }));
  injectSvg(container, radarSvg(axes, series),
    `Confronto: servono ≥3 assi e ≥1 entità di categoria "${category}".`);
}

// --- Profilo: tag coerenti derivati dalle combinazioni di valori-assi ---------
// Un archetipo combacia se TUTTE le sue condizioni `quando` (per-asse) sono vere.
// Comparatori: ">=N" "<=N" ">N" "<N" "==N"/"N" (uguaglianza) "N-M" (intervallo).
// Copia della sorgente canonica _comparators.js: check() ne impone l'uguaglianza
// (anti-drift). Modifica _comparators.js e risincronizza qui (stesso testo).
// >>>matchesCond
function matchesCond(value, cond) {
  const v = Number(value);
  if (!Number.isFinite(v)) return false;
  const c = String(cond).trim();
  let m;
  if ((m = c.match(/^(>=|<=|>|<|==|=)\s*(\d+)$/))) {
    const n = Number(m[2]);
    return m[1] === ">=" ? v >= n : m[1] === "<=" ? v <= n
         : m[1] === ">" ? v > n : m[1] === "<" ? v < n : v === n;
  }
  if ((m = c.match(/^(\d+)\s*-\s*(\d+)$/))) return v >= Number(m[1]) && v <= Number(m[2]);
  if (/^\d+$/.test(c)) return v === Number(c);
  return false;
}
// <<<matchesCond

function archetipiMatch(archetipi, page) {
  return (archetipi || []).filter((a) =>
    Object.entries(a.quando || {}).every(([axis, cond]) => matchesCond(page[axis], cond)));
}

// Tag derivati (namespaced 'profilo/<tag>') dagli archetipi che combaciano.
function profiloTags(matches) {
  const tags = matches.flatMap((a) => (a.tag || []).map((t) => `profilo/${t}`));
  return [...new Set(tags)];
}

// Pannello "Profilo" (markdown): archetipi che combaciano coi valori-assi correnti
// + i tag coerenti. Si ri-deriva live al variare degli slider. Il bottone
// 'Applica profilo' (meta_actions) li scrive in frontmatter senza residui.
async function renderProfilo(app, page) {
  if (!page) return "*Apri la nota per il profilo.*";
  const core = await loadCoreData(app);
  const archetipi = (core.archetipi || {})[page.categoria] || [];
  if (!archetipi.length) return "*Nessun archetipo definito per questa categoria.*";
  const matches = archetipiMatch(archetipi, page);
  if (!matches.length) {
    return "> [!abstract] Profilo\n> Nessun archetipo combacia con i valori attuali — regola gli assi o lascia un profilo libero.";
  }
  const nomi = matches.map((a) => `**${a.nome}**`).join(" · ");
  const tags = profiloTags(matches).map((t) => `#${t}`).join(" ");
  return `> [!abstract] Profilo (derivato dagli assi)\n> ${nomi}\n>\n> ${tags}`;
}

// --- Clock & conseguenze: orologio a segmenti (progress-clock) ---------------
// SVG di un orologio a N segmenti, i primi `filled` pieni. Nessuna dipendenza.
function clockSvg(n, filled) {
  n = Math.max(1, Math.floor(Number(n) || 0));
  filled = Math.max(0, Math.min(n, Math.floor(Number(filled) || 0)));
  const R = 34, cx = 40, cy = 40, sectors = [];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = polarPoint(cx, cy, R, (360 / n) * i);
    const [x1, y1] = polarPoint(cx, cy, R, (360 / n) * (i + 1));
    const large = 360 / n > 180 ? 1 : 0;
    const col = i < filled ? "var(--color-red, #c94040)" : "var(--background-modifier-border, #d0d0d0)";
    sectors.push(`<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${col}" stroke="var(--background-primary,#fff)" stroke-width="1.5"/>`);
  }
  return `<svg viewBox="0 0 80 80" class="gdr-clock-svg" width="88" height="88" xmlns="http://www.w3.org/2000/svg">${sectors.join("")}</svg>`;
}

// Disegna l'orologio del fronte corrente (clock_dim segmenti, clock pieni).
async function renderClock(container, app, page) {
  if (!page) { container.createEl("p", { text: "Apri la nota per il clock.", cls: "gdr-radar-empty" }); return; }
  const n = Math.floor(Number(page.clock_dim) || 0);
  if (!n) {
    container.createEl("p", { text: "Imposta i segmenti del clock per tracciare questo fronte.", cls: "gdr-radar-empty" });
    return;
  }
  const filled = Math.max(0, Math.min(n, Math.floor(Number(page.clock) || 0)));
  const wrap = container.createEl("div", { cls: "gdr-clock" });
  wrap.innerHTML = clockSvg(n, filled);
  container.createEl("p", { cls: "gdr-clock-label",
    text: filled >= n ? `⚠️ Clock PIENO (${filled}/${n}) — scatena la conseguenza` : `Clock ${filled}/${n}` });
}

// --- Difficoltà incontri (DMG 2024) ------------------------------------------
// XP di una creatura: 'pe' diretto (mostri SRD) o derivato dal 'gs' via cr_xp.
function xpForCreature(p, core) {
  if (p && p.pe != null && Number(p.pe) > 0) return Number(p.pe);
  const cr = (core.xp || {}).cr_xp || {};
  const gs = p && p.gs != null ? String(p.gs) : "";
  return Number(cr[gs] || 0);
}

// Pannello difficoltà (markdown): budget del gruppo vs XP totale delle creature
// collegate + la lista pronta per il blocco `encounter` (Initiative Tracker).
async function renderEncounter(app, dv, page) {
  if (!page || !dv) return "*Dataview non attivo o nessuna nota.*";
  const core = await loadCoreData(app);
  const xp = core.xp || {};
  const liv = Math.max(0, Math.min(20, Math.floor(Number(page.pg_livello) || 0)));
  const num = Math.max(0, Math.floor(Number(page.pg_numero) || 0));
  const creature = asArray(page.creature).map((l) => resolve(dv, l)).filter(Boolean);
  let totale = 0;
  const counts = {};
  const righe = [];
  for (const c of creature) {
    const x = xpForCreature(c, core);
    totale += x;
    const nome = c.file ? c.file.name : (c.nome || "—");
    counts[nome] = (counts[nome] || 0) + 1;
    righe.push(`- ${nome}: GS ${c.gs != null ? c.gs : "?"} · ${x} PE`);
  }
  let out = "> [!abstract] Difficoltà incontro\n";
  if (!liv || !num) {
    out += "> Imposta **Livello del gruppo** e **Numero di PG** (tab Scena / Proprietà) per la stima.\n";
  } else {
    const b = (xp.budget_2024 || {})[String(liv)] || [0, 0, 0];
    const bassa = b[0] * num, mod = b[1] * num, alta = b[2] * num;
    // Difficoltà 2024 (DMG): solo Bassa/Moderata/Alta (niente tier "Mortale", abolito
    // nel 2024). Oltre il budget Alta non è un tier: lo segnaliamo come avviso.
    let label = "Banale";
    if (totale >= alta) label = totale > alta * 1.5 ? "Alta ⚠️ (oltre budget)" : "Alta";
    else if (totale >= mod) label = "Moderata";
    else if (totale >= bassa) label = "Bassa";
    out += `> Gruppo: **${num}× liv ${liv}** · XP nemici: **${totale}**\n>\n`;
    out += `> Budget: Bassa ${bassa} · Moderata ${mod} · Alta ${alta}\n>\n`;
    out += `> → **Difficoltà: ${label}**\n`;
  }
  const dettaglio = righe.length ? "\n\n" + righe.join("\n")
    : "\n\n*Collega le creature (tab Collegamenti) per la stima.*";
  const blocco = Object.keys(counts).length
    ? "\n\n**Per il blocco `encounter`** (copia sotto `creatures:`):\n```\n"
      + Object.entries(counts).map(([n, q]) => `  - ${q}: ${n}`).join("\n") + "\n```"
    : "";
  return out + dettaglio + blocco;
}

// --- Progressione PG: riepilogo del livello + anteprima del prossimo ----------
async function loadPersonaggio(app) {
  try { return JSON.parse(await app.vault.adapter.read("z.automazioni/data/personaggio.json")); }
  catch (e) { return {}; }
}

// Pannello (markdown) per la scheda PG: privilegi acquisiti fino al livello +
// anteprima del livello successivo (privilegi/slot). La tabella 1-20 completa è
// nella nota SRD della classe. Usa personaggio.json (progressione per classe).
async function renderProgressione(app, page) {
  if (!page) return "*Apri la scheda PG.*";
  const opt = await loadPersonaggio(app);
  const classe = (opt.classi || {})[page.classe];
  if (!classe || !Array.isArray(classe.progressione)) return "*Classe senza progressione.*";
  const liv = Math.max(1, Math.min(20, Math.floor(Number(page.livello) || 1)));
  const rows = classe.progressione;
  const noASI = (p) => !/aumento dei punteggi/i.test(p);
  const acquisiti = rows.slice(0, liv).flatMap((r) => r.privilegi || []).filter(noASI);
  let out = `> [!abstract] Progressione — ${classe.label} · livello ${liv}\n`;
  out += `> **Privilegi**: ${acquisiti.length ? acquisiti.join(", ") : "—"}\n`;
  if (liv < 20) {
    const next = rows[liv] || {};
    const np = (next.privilegi || []).join(", ") || "—";
    const sl = Object.entries(next.slot || {}).map(([n, q]) => `${n}º×${q}`).join(" ");
    out += `>\n> **Al livello ${liv + 1}**: ${np}${sl ? ` · slot ${sl}` : ""}\n`;
  } else {
    out += `>\n> Livello massimo raggiunto.\n`;
  }
  return out;
}

// --- Timeline / cronologia ---------------------------------------------------
// Estrae il primo intero da una data del mondo testuale ("anno 1234", "1200 PE")
// per ordinare; null se non c'è un numero (allora si ordina per stringa).
function quandoNum(value) {
  const m = String(value == null ? "" : value).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function cmpQuando(a, b) {
  const na = quandoNum(a), nb = quandoNum(b);
  if (na != null && nb != null) return na - nb;
  if (na != null) return -1;
  if (nb != null) return 1;
  return String(a == null ? "" : a).localeCompare(String(b == null ? "" : b));
}

// Nome dell'epoca da un link del frontmatter (oggetto Link Dataview o stringa).
function epocaLabel(dv, link) {
  if (!link) return "";
  const p = resolve(dv, link);
  if (p && p.file) return p.file.name;
  if (link.path) return String(link.path).split("/").pop().replace(/\.md$/, "");
  return text(link).replace(/\[\[|\]\]/g, "").split("|")[0].trim();
}

// Linea del tempo navigabile: tutti gli eventi raggruppati per epoca (callout
// pieghevole), ordinati per 'quando'; le epoche si ordinano per 'inizio' (poi per
// primo evento), "Senza epoca" in fondo. Ritorna markdown (i [[link]] si rendono).
// La pagina Cronologia la mostra in cima, con la tabella sotto come dettaglio.
async function renderTimeline(app, dv, page) {
  if (!dv) return "*Dataview non attivo.*";
  const eventi = dv.pages()
    .where((p) => p && text(p.categoria) === "evento" && text(p.stato) !== "archiviata")
    .array();
  if (!eventi.length) {
    return "> [!info] Nessun evento\n> Crea un **Evento** (campo *Quando* + un'*Epoca*) per popolare la linea del tempo.";
  }
  const eraInfo = {};
  for (const ep of dv.pages().where((p) => p && text(p.categoria) === "epoca").array()) {
    if (ep.file) eraInfo[ep.file.name] = { inizio: ep.inizio, fine: ep.fine };
  }
  const SENZA = "Senza epoca";
  const groups = new Map();
  for (const e of eventi) {
    const key = epocaLabel(dv, e.epoca) || SENZA;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const sortKey = (name) => {
    if (name === SENZA) return [1, Infinity];
    const ini = quandoNum((eraInfo[name] || {}).inizio);
    if (ini != null) return [0, ini];
    const first = groups.get(name).map((e) => quandoNum(e.quando)).filter((n) => n != null).sort((a, b) => a - b)[0];
    return [0, first == null ? Infinity : first];
  };
  const ordered = [...groups.keys()].sort((a, b) => {
    const ka = sortKey(a), kb = sortKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || a.localeCompare(b);
  });
  const blocchi = [];
  for (const name of ordered) {
    const evs = groups.get(name).slice().sort((a, b) => cmpQuando(a.quando, b.quando));
    const info = eraInfo[name] || {};
    const span = [text(info.inizio), text(info.fine)].filter(Boolean).join(" – ");
    const testa = name === SENZA ? `🌫 ${SENZA}` : `🏛 ${name}`;
    const righe = [`> [!abstract]- ${testa}${span ? ` · ${span}` : ""} (${evs.length})`];
    for (const e of evs) {
      const meta = [text(e.portata), text(e.tipo)].filter(Boolean).join(" · ");
      righe.push(`> - **${text(e.quando) || "—"}** ${noteLink(e)}${meta ? ` · ${meta}` : ""}`);
    }
    blocchi.push(righe.join("\n"));
  }
  const eras = ordered.filter((n) => n !== SENZA).length;
  return `**${eventi.length} eventi** · ${eras} ${eras === 1 ? "epoca" : "epoche"}\n\n` + blocchi.join("\n\n");
}

// --- Quick-ref condizioni 5.5e -----------------------------------------------
// Callout pieghevole con le 15 condizioni (nome linkato alla nota SRD + effetti
// compatti): richiamo rapido al tavolo. Pure (riceve la lista da core.condizioni).
function condizioniMarkdown(condizioni) {
  const lista = condizioni || [];
  if (!lista.length) return "*Condizioni SRD non disponibili (genera l'SRD).*";
  const righe = lista.map((c) => {
    const eff = (c.effetti || []).map((e) => text(e.descrizione)).filter(Boolean).join(" ");
    return `> **[[${text(c.nome)}]]** — ${eff || text(c.descrizione)}`;
  });
  return `> [!quote]- 📋 Condizioni 5.5e (quick-ref)\n${righe.join("\n>\n")}`;
}

async function renderCondizioni(app) {
  const core = await loadCoreData(app);
  return condizioniMarkdown(core.condizioni);
}

// Quick-ref delle 8 proprietà di maestria delle armi (2024): callout pieghevole
// nome + effetto. Da core.maestrie (system.yaml). L'applicazione PER-ARMA (tiro per
// colpire + danni + effetto, dalle armi di cui il PG ha padronanza) è in renderAttacchi.
function maestrieMarkdown(maestrie) {
  const lista = maestrie || [];
  if (!lista.length) return "*Maestrie delle armi non disponibili.*";
  const righe = lista.map((m) => `> **${text(m.nome)}** *(${text(m.en)})* — ${text(m.effetto)}`);
  return `> [!quote]- ⚔️ Maestria delle armi 2024 (quick-ref)\n${righe.join("\n>\n")}`;
}

async function renderMaestrie(app) {
  const core = await loadCoreData(app);
  return maestrieMarkdown(core.maestrie);
}

// --- Attacchi con maestria (scheda PG) --------------------------------------
// Caratteristica d'attacco di un'arma (2024): a distanza → Destrezza; accurata
// (finesse) → la migliore fra Forza e Destrezza del PG; mischia → Forza.
function abilitaArma(arma, page) {
  const props = ((arma && arma.proprieta) || []).map((p) => String(p).toLowerCase());
  if (props.some((p) => p.startsWith("accurata"))) {
    const f = Number(page && page.mod_forza) || 0;
    const d = Number(page && page.mod_destrezza) || 0;
    return d > f ? "destrezza" : "forza";
  }
  return /distanza/i.test((arma && arma.categoria) || "") ? "destrezza" : "forza";
}

// Dado di danno dalla stringa SRD "1d6 taglienti" → { dado:"1d6", tipo:"taglienti" }.
function danniArma(danni) {
  const s = String(danni || "");
  const m = s.match(/(\d+d\d+)/i);
  return { dado: m ? m[1] : "", tipo: s.replace(/\d+d\d+/i, "").trim() };
}

// Nome-arma da una voce padronanze_armi del PG ("Ascia — Vessazione" → "Ascia").
function nomeArma(voce) {
  return String(voce == null ? "" : voce).split("—")[0].trim();
}

// Riga d'attacco per un'arma con maestria: tiro per colpire (mod arma + competenza,
// sintassi Dice Roller che legge il frontmatter), danni (dado + mod) ed effetto della
// padronanza. maestrieByName: mappa nome-padronanza(minuscolo)→voce maestrie. Esposto.
function attaccoArma(arma, page, maestrieByName) {
  const abil = abilitaArma(arma, page);
  const { dado, tipo } = danniArma(arma && arma.danni);
  const mast = String((arma && arma.padronanza) || "");
  const eff = ((maestrieByName || {})[mast.toLowerCase()] || {}).effetto || "";
  return {
    nome: (arma && arma.nome) || "",
    sigla: abil.slice(0, 3).toUpperCase(),
    colpire: `1d20 + mod_${abil} + competenza`,
    danni: dado ? `${dado} + mod_${abil}` : "",
    tipo,
    padronanza: mast,
    effetto: eff,
  };
}

// Pannello "Attacchi con maestria" della scheda PG: per ogni arma di cui il PG ha
// padronanza (frontmatter padronanze_armi) emette tiro per colpire + danni + effetto
// della maestria. Le armi vengono dal catalogo di personaggio.json (opt.armi). I
// `dice:` restano coerenti con la Scheda (Dice Roller legge mod_<car> e competenza).
async function renderAttacchi(app, page) {
  if (!page) return "*Apri la scheda PG.*";
  const scelte = asArray(page.padronanze_armi).map(nomeArma).filter(Boolean);
  if (!scelte.length) {
    return "> [!tip]- ⚔️ Attacchi con maestria\n> Nessuna padronanza d'arma: la tua classe non la concede. Le 8 proprietà di maestria sono nel quick-ref sotto.";
  }
  const opt = await loadPersonaggio(app);
  const armi = opt.armi || {};
  const core = await loadCoreData(app);
  const maestrieByName = {};
  for (const mm of core.maestrie || []) maestrieByName[String(mm.nome || "").toLowerCase()] = mm;
  const righe = scelte.map((nome) => {
    const arma = armi[nome];
    if (!arma) return `> **${nome}** — *(non nel catalogo SRD; tira con il d20 della Scheda)*`;
    const a = attaccoArma(arma, page, maestrieByName);
    const danni = a.danni ? ` · danni \`dice: ${a.danni}\`${a.tipo ? " " + a.tipo : ""}` : "";
    return `> **${a.nome}** (${a.sigla}) — colpire \`dice: ${a.colpire}\`${danni}\n>\n> ⚔️ *${a.padronanza}* — ${a.effetto}`;
  });
  return `> [!tip]- ⚔️ Attacchi con maestria\n${righe.join("\n>\n")}`;
}

// --- Tema natale (personalità psico-astrale, recupero #9) --------------------
// Profilo di personalità di un personaggio (soprattutto PNG): scelto un SEGNO si
// deriva elemento/modalità/archetipo/MBTI; l'ARCANO è la carta del destino
// opzionale; l'allineamento D&D resta accanto come bussola morale. Dal catalogo
// core.astrologia. Pure (riceve astrologia + i valori del personaggio).
function temaNataleMarkdown(astro, p) {
  const segnoNome = text(p && p.segno);
  if (!segnoNome) {
    return "> [!tip] Tema natale\n> Scegli un **Segno** qui sopra per generare il profilo: archetipo, temperamento (elemento), MBTI e *ombra*.";
  }
  const s = ((astro || {}).segni || []).find((x) => text(x.nome) === segnoNome);
  if (!s) return "*Segno non riconosciuto.*";
  const mbti = Array.isArray(s.mbti) && s.mbti.length ? ` · MBTI ${s.mbti.join("/")}` : "";
  const out = [
    `> [!quote] ${s.nome} · ${s.elemento} ${s.modalita} · *${s.archetipo}* — «${s.parola_chiave}»`,
    `> ${s.funzione_archetipica}${mbti}`,
  ];
  if (Array.isArray(s.manifestazioni) && s.manifestazioni.length) out.push(`> **In scena**: ${s.manifestazioni.join(" · ")}`);
  if (Array.isArray(s.ombra) && s.ombra.length) out.push(`> **⚠ Ombra**: ${s.ombra.join(", ")}`);
  const arcNome = text(p && p.arcano);
  if (arcNome) {
    const a = ((astro || {}).arcani || []).find((x) => text(x.nome) === arcNome);
    if (a) out.push(`>\n> **🔮 Arcano ${a.numero} · ${a.nome}** — ${a.ruolo}${a.ombra ? ` *(ombra: ${a.ombra})*` : ""}`);
  }
  if (p && p.allineamento) out.push(`>\n> **⚖ Allineamento**: ${text(p.allineamento)}`);
  return out.join("\n");
}

async function renderTemaNatale(app, page) {
  if (!page) return "*Apri una scheda personaggio.*";
  const core = await loadCoreData(app);
  return temaNataleMarkdown(core.astrologia, page);
}

// --- Rete di collegamenti (tabella) ------------------------------------------
// Le relazioni TIPIZZATE forward della nota (core.relazioni[categoria]) risolte
// → tabella | Relazione | Nota | Tipo | Pressione |. Complementa "Citato da"
// (backlink, in uscita ↔ in entrata). "" se la nota non ha ancora collegamenti.
async function renderConnessioni(app, dv, page) {
  if (!dv || !page) return "";
  const core = await loadCoreData(app);
  const rels = (core.relazioni || {})[text(page.categoria)] || [];
  const rows = [];
  for (const r of rels) {
    for (const link of asArray(page[r.field])) {
      const p = resolve(dv, link);
      if (p) rows.push(`| ${r.label} | ${noteLink(p)} | ${text(p.categoria) || "—"} | ${pressureLabel(p.pressione)} |`);
    }
  }
  if (!rows.length) return "";
  return ["**🕸 Rete di collegamenti**", "", "| Relazione | Nota | Tipo | Pressione |",
          "|:--|:--|:--|:--|", ...rows].join("\n");
}

// --- Mappa (luogo/mondo) -----------------------------------------------------
// Embed della mappa collegata (campo 'mappa'): un disegno Excalidraw, un'immagine
// o una nota. Se vuoto, un suggerimento su come crearne una. Ritorna markdown
// (l'embed ![[..]] si rende; gestisce Link Dataview o stringa).
async function renderMap(app, dv, page) {
  if (!page) return "*Apri una nota.*";
  const raw = page.mappa;
  let name = "";
  if (raw && raw.path) name = String(raw.path).split("/").pop().replace(/\.md$/, "");
  else if (raw) name = text(raw).replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
  if (!name) {
    return "> [!tip] Nessuna mappa\n> Imposta il campo **Mappa** qui sopra: disegnala con **Excalidraw** (mappa a mano), usa **Zoom Map** per immagini grandi, o trascina un'immagine nel vault e collegala.";
  }
  return `![[${name}]]`;
}

// --- Dintorni (geografia spaziale) -------------------------------------------
// Vista locale del luogo, due nozioni complementari di distanza: (1) per CONFINI
// (BFS su confina_con — quante aree attraversi, "come ci si muove via terra") e
// (2) IN LINEA D'ARIA (euclidea sulle coord × scala del mondo, in km — "quanto
// dista davvero"). Più la REGIONE contenitore, i luoghi CONTENUTI e le ROTTE.
// L'adiacenza è non orientata (i link sono già reciproci, ma uniamo le due
// direzioni per robustezza). Ritorna markdown (i [[link]] si rendono).
async function renderDintorni(app, dv, page) {
  if (!dv || !page || !page.file) return "*Apri una scheda luogo.*";
  const luoghi = dv.pages()
    .where((p) => p && p.file && text(p.categoria) === "luogo" && text(p.stato) !== "archiviata")
    .array();
  const self = page.file.name;
  // Grafo di adiacenza non orientato da confina_con (unione delle due direzioni).
  const adj = new Map(luoghi.map((p) => [p.file.name, new Set()]));
  for (const p of luoghi) {
    for (const link of asArray(p.confina_con)) {
      const q = resolve(dv, link);
      const qn = q && q.file ? q.file.name : null;
      if (qn && adj.has(qn) && adj.has(p.file.name)) {
        adj.get(p.file.name).add(qn);
        adj.get(qn).add(p.file.name);
      }
    }
  }
  // BFS dei confini dal luogo corrente → distanza in salti (anelli).
  const dist = new Map([[self, 0]]);
  let frontier = [self];
  while (frontier.length) {
    const next = [];
    for (const n of frontier) {
      for (const m of adj.get(n) ?? []) {
        if (!dist.has(m)) { dist.set(m, dist.get(n) + 1); next.push(m); }
      }
    }
    frontier = next;
  }
  const out = [];
  const regione = resolve(dv, page.regione);
  if (regione && regione.file) out.push(`**📍 Regione**: ${noteLink(regione)}`);
  const contiene = luoghi.filter((p) => {
    const r = resolve(dv, p.regione);
    return r && r.file && r.file.name === self;
  });
  if (contiene.length) out.push(`**🗺 Contiene** (${contiene.length}): ` + contiene.map(noteLink).join(", "));
  const rings = new Map();
  for (const [name, d] of dist) {
    if (d === 0) continue;
    if (!rings.has(d)) rings.set(d, []);
    rings.get(d).push(name);
  }
  for (const d of [...rings.keys()].sort((a, b) => a - b)) {
    const names = rings.get(d).sort((a, b) => a.localeCompare(b)).map((n) => `[[${n}]]`);
    const label = d === 1 ? "🧭 Confina con" : `↔ A ${d} confini`;
    out.push(`**${label}** (${names.length}): ${names.join(", ")}`);
  }
  // Distanza IN LINEA D'ARIA (metrica): euclidea sulle coord × scala del mondo
  // (mondo.scala_mappa = km per unità; assente → unità "u"). I più vicini in cima.
  const selfCoord = parseCoord(page.coord);
  if (selfCoord) {
    const mondo = resolve(dv, page.mondo);
    const s = mondo ? Number(mondo.scala_mappa) : NaN;
    const scala = Number.isFinite(s) && s > 0 ? s : null;
    const unit = scala ? "km" : "u";
    const fmt = (d) => ` ~${d >= 10 ? Math.round(d) : Math.round(d * 10) / 10} ${unit}`;
    const vicini = luoghi
      .map((p) => ({ p, c: parseCoord(p.coord) }))
      .filter((e) => e.c && e.p.file.name !== self)
      .map((e) => ({ name: e.p.file.name, d: Math.hypot(e.c.x - selfCoord.x, e.c.y - selfCoord.y) * (scala || 1) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
    if (vicini.length) out.push(`**📐 In linea d'aria**: ` + vicini.map((v) => `[[${v.name}]]${fmt(v.d)}`).join(" · "));
  }
  const rotte = asArray(page.rotta_con).map((l) => resolve(dv, l)).filter((p) => p && p.file);
  if (rotte.length) out.push(`**🛣 Rotte di viaggio** (${rotte.length}): ` + rotte.map(noteLink).join(", "));
  if (!out.length) {
    return "> [!tip] Nessun dintorno\n> Collega questo luogo: imposta **Regione** (l'area che lo contiene), **Confina con** (i luoghi adiacenti), **Rotta commerciale con** (i viaggi) e **Coordinate** (`x, y`, per la distanza in km). Le distanze si calcolano da sé.";
  }
  return "> [!abstract] 🧭 Dintorni — *per confini (terra) e in linea d'aria (km)*\n" + out.map((r) => "> " + r).join("\n>\n");
}

// --- Viaggio (sistema di viaggio: rotte × tempo × pericolo) -------------------
// Pianificazione dal luogo corrente: le DESTINAZIONI dirette (rotte 🛣 + confinanti
// 🧭) con TEMPO stimato (distanza metrica ÷ passo del mondo) e RISCHIO (pressione
// della destinazione), più COSA PUÒ SUCCEDERE qui (incontri con luogo==qui + insidie
// che includono qui). Lega geografia (coord/rotte/confini) a bestiario/incontri.
// Pace e scala dal mondo (passo_viaggio km/g, default 30); senza coord il tempo è
// "—" ma la tabella resta utile. Ritorna markdown (tabella + callout).
async function renderViaggio(app, dv, page) {
  if (!dv || !page || !page.file) return "*Apri una scheda luogo.*";
  const self = page.file.name;
  const rn = (l) => { const p = resolve(dv, l); return p && p.file ? p.file.name : null; };
  const mondo = resolve(dv, page.mondo);
  const scala = mondo && Number(mondo.scala_mappa) > 0 ? Number(mondo.scala_mappa) : null;
  const pace = mondo && Number(mondo.passo_viaggio) > 0 ? Number(mondo.passo_viaggio) : 30;
  const selfC = parseCoord(page.coord);
  const tempo = (p) => {
    const c = parseCoord(p.coord);
    if (!selfC || !c || !scala) return "—";
    const days = (Math.hypot(c.x - selfC.x, c.y - selfC.y) * scala) / pace;
    return days >= 1 ? `~${Math.round(days)} g` : `~${Math.max(1, Math.round(days * 8))} h`;
  };
  // Destinazioni dirette: rotte (🛣) + confinanti (🧭), dedup per nome con i 'via'.
  const dests = new Map();
  const add = (link, via) => {
    const p = resolve(dv, link);
    if (p && p.file && p.file.name !== self) {
      if (!dests.has(p.file.name)) dests.set(p.file.name, { p, via: new Set() });
      dests.get(p.file.name).via.add(via);
    }
  };
  for (const l of asArray(page.rotta_con)) add(l, "🛣 rotta");
  for (const l of asArray(page.confina_con)) add(l, "🧭 terra");
  const out = [];
  if (dests.size) {
    const rows = [...dests.values()]
      .sort((a, b) => a.p.file.name.localeCompare(b.p.file.name))
      .map(({ p, via }) => `| ${noteLink(p)} | ${[...via].join(", ")} | ${tempo(p)} | ${pressureLabel(p.pressione)} |`);
    out.push([`**🧳 Partenze da qui** *(a piedi, ${pace} km/g)*`, "",
      "| Verso | Via | Tempo | Rischio |", "|:--|:--|:--|:--|", ...rows].join("\n"));
  }
  // Cosa può succedere qui: incontri (luogo==self) + insidie (self ∈ luoghi).
  const pericoli = dv.pages()
    .where((p) => p && p.file && text(p.stato) !== "archiviata"
      && ((text(p.categoria) === "incontro" && rn(p.luogo) === self)
        || (text(p.categoria) === "insidia" && asArray(p.luoghi).some((l) => rn(l) === self))))
    .array();
  if (pericoli.length) {
    const righe = pericoli.map((p) => `> - ${noteLink(p)} *(${text(p.categoria)}${p.tipo ? " · " + text(p.tipo) : ""})*`);
    out.push([`> [!warning]- ⚔ Cosa può succedere qui (${pericoli.length})`, ...righe].join("\n"));
  }
  if (!out.length) {
    return "> [!tip] Nessuna via\n> Collega **Rotte** o **Confina con** per pianificare i viaggi; crea **Incontri**/**Insidie** in questo luogo per popolare i pericoli.";
  }
  return out.join("\n\n");
}

// --- Fronti reattivi al grafo ------------------------------------------------
// Per un FRONTE (entità con clock_dim) deriva dal grafo economico/geografico le
// SPINTE che giustificano un avanzamento del clock: dipendenze da risorse contese
// o in mano a terzi (tagliarle stringe), risorse prodotte e contese (chi le vuole
// preme), rotte verso luoghi in crisi, rivali in ascesa. Rende VISIBILE come il
// mondo preme sul fronte — il GM avanza poi col bottone (meta_actions.avanza_fronte).
// "" se non è un fronte; tip se nessuna spinta. Ritorna markdown (i [[link]] rendono).
async function renderPressioni(app, dv, page) {
  if (!dv || !page || !page.file) return "";
  if (page.clock_dim == null) return "";
  const hot = (p) => (Number(p && p.pressione) || 0);
  const out = [];
  for (const link of asArray(page.dipende_da)) {
    const r = resolve(dv, link); if (!r || !r.file) continue;
    const ctrl = resolve(dv, r.controllata_da);
    const why = [];
    if (hot(r) >= 5) why.push(pressureLabel(r.pressione));
    if (ctrl && ctrl.file) why.push(`in mano a ${noteLink(ctrl)}`);
    if (why.length) out.push(`⛓ Dipendi da ${noteLink(r)} — ${why.join(", ")}: tagliarla ti stringe`);
  }
  for (const link of asArray(page.produce)) {
    const r = resolve(dv, link); if (!r || !r.file) continue;
    if (hot(r) >= 5) out.push(`💎 Produci ${noteLink(r)} (${pressureLabel(r.pressione)}): chi la vuole preme qui`);
  }
  for (const link of asArray(page.rotta_con)) {
    const o = resolve(dv, link); if (!o || !o.file) continue;
    if (hot(o) >= 7) out.push(`🛣 Rotta con ${noteLink(o)} a rischio (${pressureLabel(o.pressione)})`);
  }
  for (const link of asArray(page.rivali)) {
    const o = resolve(dv, link); if (!o || !o.file) continue;
    if (hot(o) >= 7) out.push(`⚔ Rivale ${noteLink(o)} in ascesa (${pressureLabel(o.pressione)})`);
  }
  if (!out.length) {
    return "> [!tip] Fronte stabile\n> Nessuna spinta dal grafo per ora: il clock avanza solo per le tue mosse.";
  }
  return "> [!danger]- ⚡ Spinte dal grafo (il mondo preme su questo fronte)\n"
    + out.map((r) => "> - " + r).join("\n")
    + "\n>\n> Una spinta giustifica un segmento: premi **Avanza fronte** o gioca la mossa.";
}

// --- Catena causale (timeline causale) ---------------------------------------
// Per un evento ricostruisce PERCHÉ è successo (risalendo causato_da) e COSA NE È
// DERIVATO (scendendo per conseguenze). Le due direzioni sono complementari: con
// la macro Collega l'inverso è scritto automaticamente, ma qui le uniamo (causa =
// causato_da ∪ eventi-che-mi-elencano-in-conseguenze) così la catena si
// ricostruisce anche se solo un lato è stato compilato a mano. Cicli protetti
// (visited condiviso). Ritorna markdown (liste annidate, i [[link]] si rendono).
async function renderCausalita(app, dv, page) {
  if (!dv || !page || !page.file) return "*Apri una scheda evento.*";
  const eventi = dv.pages()
    .where((p) => p && p.file && text(p.categoria) === "evento" && text(p.stato) !== "archiviata")
    .array();
  const byName = new Map(eventi.map((p) => [p.file.name, p]));
  const nameOf = (link) => { const p = resolve(dv, link); return p && p.file ? p.file.name : null; };
  const causes = new Map(), effects = new Map();
  const link = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); if (v) m.get(k).add(v); };
  for (const e of eventi) {
    const en = e.file.name;
    for (const l of asArray(e.causato_da)) { const c = nameOf(l); if (c) { link(causes, en, c); link(effects, c, en); } }
    for (const l of asArray(e.conseguenze)) { const c = nameOf(l); if (c) { link(effects, en, c); link(causes, c, en); } }
  }
  const self = page.file.name;
  const tree = (map, root) => {
    const lines = [], seen = new Set([root]);
    const walk = (name, depth) => {
      const kids = [...(map.get(name) ?? [])].sort((a, b) =>
        cmpQuando((byName.get(a) || {}).quando, (byName.get(b) || {}).quando));
      for (const k of kids) {
        if (seen.has(k)) continue;
        seen.add(k);
        const quando = text((byName.get(k) || {}).quando);
        lines.push(`${"  ".repeat(depth)}- ${quando ? `**${quando}** ` : ""}[[${k}]]`);
        walk(k, depth + 1);
      }
    };
    walk(root, 0);
    return lines;
  };
  const su = tree(causes, self), giu = tree(effects, self);
  if (!su.length && !giu.length) {
    return "> [!tip] Nessuna catena causale\n> Collega questo evento ad altri con **Causato da** (le cause a monte) o **Conseguenze** (cosa ha innescato). La catena si ricostruisce in entrambe le direzioni da sé.";
  }
  const blocks = [];
  if (su.length) blocks.push("**⬆ Perché è successo** *(cause a monte)*\n" + su.join("\n"));
  if (giu.length) blocks.push("**⬇ Cosa ne è derivato** *(conseguenze a valle)*\n" + giu.join("\n"));
  return blocks.join("\n\n");
}

// --- Tratti di specie (rules-engine): dettagli SRD strutturati nella scheda PG -
// Dal campo `specie` del PG rende le sezioni SRD della specie (descrizioni +
// tabelle, es. soffio / antenati draconici) in un callout pieghevole, così la
// scheda espone i dettagli giocabili senza saltare alla nota SRD. Usa
// personaggio.json (build_personaggio porta le `sezioni` complete). Vuoto -> "".
function sezioniMarkdown(sezioni) {
  const parti = [];
  for (const sez of sezioni || []) {
    const titolo = String((sez && sez.titolo) || "").trim();
    const righe = Array.isArray(sez && sez.righe) ? sez.righe : null;
    if (righe && righe.length) {
      const cols = Object.keys(righe[0]);
      const tabella = [`| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`,
        ...righe.map((r) => `| ${cols.map((c) => r[c] != null ? r[c] : "").join(" | ")} |`)];
      parti.push((titolo ? `**${titolo}**\n\n` : "") + tabella.join("\n"));
    } else if (sez && sez.descrizione) {
      parti.push((titolo ? `**${titolo}** — ` : "") + String(sez.descrizione).trim());
    }
  }
  return parti;
}

async function renderSpecieTratti(app, page) {
  if (!page) return "";
  const id = String(page.specie != null ? page.specie : "").trim();
  if (!id) return "";
  const data = await loadPersonaggio(app);
  const sp = (data.specie || {})[id];
  if (!sp) return "";
  const parti = sezioniMarkdown(sp.sezioni);
  if (!parti.length) return "";
  const body = parti.map((p) => "> " + p.replace(/\n/g, "\n> ")).join("\n>\n");
  return `> [!note]- Tratti di ${sp.label || id}\n${body}`;
}

// --- Incantesimi del PG (gestione inline, scala 1-20) ------------------------
// Raggruppa i trucchetti (liv 0) + gli incantesimi noti/preparati del PG per
// LIVELLO, leggendo il livello di ciascuno dal pool della classe (personaggio.json:
// classi[c].incantesimi_pool = {livello:[nomi]}, stessi nomi delle note SRD →
// `[[..]]` risolve). Ogni intestazione di livello mostra gli slot residui
// (slot_N − slot_uso_N). Sostituisce il vecchio callout inchiodato al "1º livello":
// per un caster di livello alto vedi l'intero spellbook, non solo il 1º. Non
// incantatore / nessun incantesimo → "" (niente callout). Pure-ish (usa loadPersonaggio).
async function renderIncantesimi(app, dv, page) {
  if (!page) return "*Apri una scheda PG.*";
  const trucchetti = asArray(page.trucchetti), incantesimi = asArray(page.incantesimi);
  const data = await loadPersonaggio(app);
  const classe = (data.classi || {})[text(page.classe)] || {};
  if (!classe.incantatore && !trucchetti.length && !incantesimi.length) return "";  // non caster
  // nome → livello, invertendo il pool della classe (SRD).
  const levelOf = new Map();
  for (const [L, names] of Object.entries(classe.incantesimi_pool || {}))
    for (const n of names || []) levelOf.set(n, Number(L));
  // Homebrew: il livello dalla nota stessa (categoria incantesimo) se non nel pool
  // della classe — così gli incantesimi homebrew si raggruppano bene, non sotto "ignoto".
  // Stessa passata raccoglie chi richiede CONCENTRAZIONE (durata SRD) → 🌀.
  const concentra = new Set();
  if (dv) {
    try {
      const cat = (p) => p && p.file && (text(p.categoria) === "incantesimo" || text(p.categoria) === "srd-incantesimo");
      for (const sp of dv.pages().where(cat).array()) {
        const L = Number(sp.livello);
        if (!levelOf.has(sp.file.name) && Number.isFinite(L)) levelOf.set(sp.file.name, L);
        if (sp.durata && /concentr/i.test(text(sp.durata))) concentra.add(sp.file.name);
      }
    } catch (e) { /* dv assente o query fallita: niente livelli homebrew né 🌀 */ }
  }
  const groups = new Map();  // livello → [nomi]
  const push = (L, n) => { if (!groups.has(L)) groups.set(L, []); groups.get(L).push(n); };
  for (const t of trucchetti) push(0, text(t));
  for (const s of incantesimi) { const n = text(s); push(levelOf.has(n) ? levelOf.get(n) : -1, n); }
  if (!groups.size) return "";
  const slotInfo = (L) => {
    const max = Number(page["slot_" + L]);
    if (!Number.isFinite(max) || max <= 0) return "";
    const used = Number(page["slot_uso_" + L]) || 0;
    return ` · slot ${Math.max(0, max - used)}/${max}`;
  };
  const out = [];
  for (const L of [...groups.keys()].sort((a, b) => a - b)) {
    const titolo = L === 0 ? "Trucchetti" : L === -1 ? "Livello ignoto" : `${L}º livello`;
    const names = groups.get(L).slice().sort((a, b) => a.localeCompare(b)).map((n) => `${concentra.has(n) ? "🌀 " : ""}[[${n}]]`);
    out.push(`> **${titolo}**${L > 0 ? slotInfo(L) : ""} (${names.length})\n> ${names.join(" · ")}`);
  }
  const legenda = concentra.size ? "\n>\n> 🌀 = concentrazione" : "";
  return "> [!note]- 🪄 Incantesimi\n" + out.join("\n>\n") + legenda;
}

module.exports = {
  renderEntityPanel, renderSessionPanel, renderBacklinks,
  renderAxesRadar, renderAxesCompare, radarSvg, clampAxis,
  renderProfilo, archetipiMatch, profiloTags, matchesCond,
  renderClock, clockSvg,
  renderEncounter, xpForCreature,
  renderProgressione,
  renderSpecieTratti, sezioniMarkdown,
  renderIncantesimi,
  renderTimeline, quandoNum, epocaLabel,
  renderCausalita,
  renderMap, renderDintorni, renderViaggio, parseCoord,
  renderPressioni,
  renderCondizioni, condizioniMarkdown,
  renderMaestrie, maestrieMarkdown,
  renderAttacchi, attaccoArma, abilitaArma, danniArma, nomeArma,
  radarMarkdownFromValues,
  renderTemaNatale, temaNataleMarkdown,
  renderConnessioni,
};
