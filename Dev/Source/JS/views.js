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

// --- Coerenza tematica: tensioni fra entità collegate sugli assi condivisi -----
// Confronta i valori-assi di due entità sugli assi con lo STESSO id presenti in
// entrambe (stesso tipo → tutti; cross-tipo → quelli che coincidono, es. culto e
// fazione condividono struttura/legalità). Ritorna, per asse condiviso con valore
// numerico in entrambe, distanza ed etichette (dalle valori dell'asse sorgente).
function confrontoAssi(page, target, axesPage, axesTarget) {
  const idsTarget = new Set((axesTarget || []).map((a) => a.id));
  const out = [];
  for (const a of axesPage || []) {
    if (!idsTarget.has(a.id)) continue;
    const va = Number(page[a.id]); const vb = Number(target[a.id]);
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    out.push({
      id: a.id, nome: a.nome, dist: Math.abs(va - vb),
      etA: ((a.valori || {})[va] || {}).etichetta || String(va),
      etB: ((a.valori || {})[vb] || {}).etichetta || String(vb),
    });
  }
  return out;
}

// Note di coerenza (PROMPT, non errori) da un confronto e dal tipo di relazione:
// - contrasto forte: un asse condiviso a distanza ≥3 = opposizione netta (top 2);
// - specchio: un `rivali` dal profilo quasi identico (tutti gli assi ≤1). Esposto.
function coerenzaNote(rel, target, cmp) {
  if (!cmp.length) return [];
  const note = [];
  const forti = cmp.filter((c) => c.dist >= 3).sort((a, b) => b.dist - a.dist).slice(0, 2);
  for (const c of forti) {
    const frame = rel.field === "alleati" ? "alleati ma lontani" : "tensione";
    note.push(`🎭 ${noteLink(target)} — ${c.nome}: ${c.etA} ↔ ${c.etB} *(${frame})*`);
  }
  if (rel.field === "rivali" && cmp.every((c) => c.dist <= 1)) {
    note.push(`🪞 ${noteLink(target)} — rivale dal profilo quasi identico: l'attrito è di potere o territorio, non di natura?`);
  }
  return note;
}

// Pannello "Coerenza tematica": per i collegamenti tipizzati dell'entità, fa
// emergere le tensioni notevoli sugli assi condivisi (contrasti forti, rivali-
// specchio). Spunti narrativi, non lint rigido: le tensioni sono il sale del mondo.
async function renderCoerenza(app, dv, page) {
  if (!dv || !page || !page.categoria) return "";
  const core = await loadCoreData(app);
  const axesPage = axesFor(core, text(page.categoria));
  if (!axesPage.length) return "";
  const rels = (core.relazioni || {})[text(page.categoria)] || [];
  const note = [];
  const seen = new Set();
  for (const rel of rels) {
    for (const link of asArray(page[rel.field])) {
      const target = resolve(dv, link);
      if (!target || !target.file || seen.has(target.file.path)) continue;
      const cmp = confrontoAssi(page, target, axesPage, axesFor(core, text(target.categoria)));
      const n = coerenzaNote(rel, target, cmp);
      if (n.length) { seen.add(target.file.path); note.push(...n); }
    }
  }
  if (!note.length) {
    return "> [!check]- 🎭 Coerenza tematica\n> Nessuna tensione notevole coi collegamenti (profili compatibili o assi non condivisi).";
  }
  const MAX = 8;                                   // cap anti-rumore (SYS-3)
  const extra = note.length - MAX;
  const righe = note.slice(0, MAX).map((n) => "> - " + n);
  if (extra > 0) righe.push(`> - *…e altri ${extra} spunti dai collegamenti.*`);
  return "> [!check]- 🎭 Coerenza tematica (spunti, non errori)\n" + righe.join("\n");
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

// --- Risorse del PG (colpo d'occhio): barre proporzionali dal frontmatter --------
// Gli INPUT editabili restano i campi Meta Bind della scheda; queste barre sono solo
// DISPLAY. Il max è VARIABILE per-nota (pf_max, dadi_vita_max): il progressBar nativo
// di Meta Bind accetta solo max LETTERALI (issue #323, chiusa), quindi le barre a max
// variabile passano per il layer JS Engine (qui). Esaurimento ha max FISSO 6 (2024).
function barPct(cur, max) {
  const c = Number(cur), m = Number(max);
  if (!Number.isFinite(m) || m <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((100 * (Number.isFinite(c) ? c : 0)) / m)));
}

function barRow(label, cur, max, color, extra) {
  const pct = barPct(cur, max);
  const c = Number.isFinite(Number(cur)) ? Number(cur) : 0;
  const val = pct == null ? String(c) : `${c}/${Number(max)}`;
  const fill = pct == null ? "" : `<span class="gdr-bar-fill" style="width:${pct}%;background:var(--color-${color})"></span>`;
  return `<div class="gdr-bar"><span class="gdr-bar-label">${label}</span>`
    + `<span class="gdr-bar-track">${fill}</span>`
    + `<span class="gdr-bar-val">${val}${extra || ""}</span></div>`;
}

// Pannello "Risorse": PF (+ PF temp), Dadi Vita rimasti, Esaurimento (0-6). Stringa
// vuota se la nota non è una scheda PG compilata (niente pf_max/dadi vita/esaurimento).
async function renderRisorsePG(page) {
  if (!page) return "*Apri la scheda PG.*";
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const pfMax = num(page.pf_max), esa = num(page.esaurimento), dvMax = num(page.dadi_vita_max);
  if (!pfMax && !dvMax && !esa && !page.dado_vita) return "";
  const rows = [barRow("PF", num(page.pf), pfMax, "green", num(page.pf_temp) ? ` (+${num(page.pf_temp)} temp)` : "")];
  if (dvMax) rows.push(barRow("Dadi Vita", dvMax - num(page.dadi_vita_spesi), dvMax, "blue"));
  rows.push(barRow("Esaurimento", esa, 6, esa >= 5 ? "red" : (esa >= 3 ? "orange" : "purple")));
  // Risorse di classe a ricarica (Ki/Ira/Incanalare/...): barra rimasti/max + icona della
  // ricarica (🌙 riposo breve · ☀ riposo lungo). Da risorse_pg (scritto da crea_pg/sali_pg)
  // e dal contatore usi_<id> (spesi). I riposi le azzerano (meta_actions); «Usa risorsa» ne spende.
  for (const r of (Array.isArray(page.risorse_pg) ? page.risorse_pg : [])) {
    const max = num(r && r.max);
    if (max <= 0) continue;
    const rem = Math.max(0, max - num(page["usi_" + r.id]));
    const ric = r.ric === "breve" ? "🌙" : "☀";
    rows.push(barRow(`${r.icona ? r.icona + " " : ""}${r.label} ${ric}`, rem, max, "cyan"));
  }
  return `**🩸 Risorse**\n\n<div class="gdr-bars">${rows.join("")}</div>`;
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

// --- Cronologia dell'entità: stati epoch-stamped (mondo-che-cambia) ----------
// Una tappa "quando | stato" → { quando, stato }. Senza '|' tutto è 'quando'. Il
// 'quando' può essere un'epoca testuale o un [[link]] a una nota epoca/evento.
function parseTappa(riga) {
  const s = String(riga == null ? "" : riga);
  const i = s.indexOf("|");
  return i < 0
    ? { quando: s.trim(), stato: "" }
    : { quando: s.slice(0, i).trim(), stato: s.slice(i + 1).trim() };
}

// Pannello "🧩 Dettagli del tipo": il PROFILO del sottotipo scelto (`tipo`) —
// descrizione + i suoi campi (valore dal frontmatter) + se è un Fronte (clock) / se
// evolve. Reattivo: cambia se cambi `tipo`. I campi si editano dal pannello Proprietà
// (sono chiavi di frontmatter). "" se il sottotipo non ha un profilo dedicato.
async function renderTipoProfilo(app, page) {
  if (!page) return "";
  const cat = text(page.categoria), tipo = text(page.tipo);
  if (!cat || !tipo) return "";
  const core = await loadCoreData(app);
  const prof = (((core.categories || {})[cat] || {}).subtype_profiles || {})[tipo];
  if (!prof) return "";
  const fields = core.fields || {};
  const fmt = (v) => {
    if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
    return (v == null || v === "") ? "—" : String(v);
  };
  const out = ["> [!note]- 🧩 " + tipo + " — dettagli del tipo"];
  if (prof.descrizione) out.push("> " + prof.descrizione);
  const campi = asArray(prof.campi);
  if (campi.length) {
    out.push(">");
    for (const id of campi) out.push("> **" + ((fields[id] || {}).label || id) + "**: " + fmt(page[id]));
  }
  const tags = [];
  if (prof.clock) tags.push("⏳ è un **Fronte** — usa il clock nell'*Al tavolo*");
  // «vedi Cronologia» SOLO se la categoria ha davvero quella tab (è in tappe_categorie):
  // altrimenti il riferimento penzolerebbe verso una tab inesistente.
  if (prof.evoluzione) {
    const inTappe = asArray(core.tappe_categorie).includes(cat);
    tags.push("🕰 **evolve** tra le epoche" + (inTappe ? " — vedi *Cronologia*" : ""));
  }
  if (tags.length) { out.push(">"); out.push("> " + tags.join(" · ")); }
  // Il promemoria «edita dal pannello Proprietà» ha senso SOLO se il tipo porta campi
  // propri: un sottotipo senza `campi` (es. 'evento storico') non deve mostrarlo — il
  // pannello resta un compatto richiamo di cosa significa il tipo scelto.
  if (campi.length) out.push(">", "> *I campi del tipo si modificano dal pannello **Proprietà**.*");
  // Spunti del tipo: le domande-guida del profilo (campo `wizard`), prima orfane (non
  // chieste nel modale per scelta di design — la prosa non si digita lì). Qui diventano
  // suggerimenti su cosa sviluppare creando una nota di QUESTO sottotipo.
  const spunti = asArray(prof.wizard);
  if (spunti.length) out.push(">", "> 💡 *Per un* «" + tipo + "» *chiediti:* " + spunti.join(" · "));
  return out.join("\n");
}

// Pannello "Cronologia": il percorso dell'entità attraverso le epoche (proprietà
// `tappe`), reso in ordine d'autore come una linea di vita (fondazione → ascesa →
// crisi). Vuoto → guida col formato. Le entità durature cambiano: il mondo non è
// statico. Esposto parseTappa per i test.
async function renderTappe(app, page) {
  if (!page) return "";
  const tappe = asArray(page.tappe).map(parseTappa).filter((t) => t.quando || t.stato);
  if (!tappe.length) {
    return "> [!tip]- 📜 Cronologia\n> Racconta come questa entità cambia nel tempo: aggiungi la proprietà `tappe`, una riga per tappa in ordine cronologico:\n> `quando | stato` — es. `[[Era della Fondazione]] | Fondato dai coloni del nord`.";
  }
  const righe = tappe.map((t) => `> - **${t.quando || "—"}**${t.stato ? " — " + t.stato : ""}`);
  return "> [!abstract]- 📜 Cronologia (come cambia attraverso le epoche)\n" + righe.join("\n");
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

// Linea del tempo navigabile: eventi E tappe delle entità durature (📜, il mondo
// che evolve) raggruppati per epoca (callout pieghevole), ordinati per 'quando';
// le epoche si ordinano per 'inizio' (poi per primo item), "Senza epoca" in fondo.
// Ritorna markdown (i [[link]] si rendono). La pagina Cronologia la mostra in cima.
async function renderTimeline(app, dv, page) {
  if (!dv) return "*Dataview non attivo.*";
  const eraInfo = {};
  for (const ep of dv.pages().where((p) => p && text(p.categoria) === "epoca").array()) {
    if (ep.file) eraInfo[ep.file.name] = { inizio: ep.inizio, fine: ep.fine };
  }
  const SENZA = "Senza epoca";
  const groups = new Map();
  const push = (key, item) => { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); };
  // Eventi: ogni evento è un punto, raggruppato per la sua epoca (link).
  const eventi = dv.pages()
    .where((p) => p && text(p.categoria) === "evento" && text(p.stato) !== "archiviata").array();
  for (const e of eventi) push(epocaLabel(dv, e.epoca) || SENZA, e);
  // Tappe: le linee di vita delle entità durature entrano nella STESSA timeline —
  // il mondo che evolve accanto agli eventi. Ogni tappa è raggruppata per epoca se
  // il suo 'quando' nomina un'epoca esistente, altrimenti in fondo (Senza epoca).
  let nTappe = 0;
  for (const p of dv.pages().where((q) => q && asArray(q.tappe).length && text(q.stato) !== "archiviata").array()) {
    for (const riga of asArray(p.tappe)) {
      const t = parseTappa(riga);
      const eraName = String(t.quando).replace(/\[\[|\]\]/g, "").split("|")[0].trim();
      push(eraInfo[eraName] ? eraName : SENZA, { __tappa: true, quando: t.quando, link: noteLink(p), stato: t.stato });
      nTappe++;
    }
  }
  if (!groups.size) {
    return "> [!info] Nessun evento\n> Crea un **Evento** (campo *Quando* + un'*Epoca*) o aggiungi le *tappe* a un'entità per popolare la linea del tempo.";
  }
  const sortKey = (name) => {
    if (name === SENZA) return [1, Infinity];
    const ini = quandoNum((eraInfo[name] || {}).inizio);
    if (ini != null) return [0, ini];
    const first = groups.get(name).map((it) => quandoNum(it.quando)).filter((n) => n != null).sort((a, b) => a - b)[0];
    return [0, first == null ? Infinity : first];
  };
  const ordered = [...groups.keys()].sort((a, b) => {
    const ka = sortKey(a), kb = sortKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || a.localeCompare(b);
  });
  const blocchi = [];
  for (const name of ordered) {
    const its = groups.get(name).slice().sort((a, b) => cmpQuando(a.quando, b.quando));
    const info = eraInfo[name] || {};
    const span = [text(info.inizio), text(info.fine)].filter(Boolean).join(" – ");
    const testa = name === SENZA ? `🌫 ${SENZA}` : `🏛 ${name}`;
    const righe = [`> [!abstract]- ${testa}${span ? ` · ${span}` : ""} (${its.length})`];
    for (const it of its) {
      if (it.__tappa) {
        righe.push(`> - 📜 **${text(it.quando) || "—"}** ${it.link}${it.stato ? ` — ${it.stato}` : ""}`);
      } else {
        const meta = [text(it.portata), text(it.tipo)].filter(Boolean).join(" · ");
        righe.push(`> - **${text(it.quando) || "—"}** ${noteLink(it)}${meta ? ` · ${meta}` : ""}`);
      }
    }
    blocchi.push(righe.join("\n"));
  }
  const eras = ordered.filter((n) => n !== SENZA).length;
  const head = `**${eventi.length} eventi**` + (nTappe ? ` · **${nTappe} tappe**` : "")
    + ` · ${eras} ${eras === 1 ? "epoca" : "epoche"}`;
  // Nastro grafico delle epoche (resa "a colpo d'occhio"): un segmento per epoca in ordine
  // cronologico, largo ∝ al n. di voci, colorato; sotto resta il dettaglio pieghevole. HTML
  // (reso da engine.markdown.create, come le barre-risorsa) → nessun plugin timeline dedicato.
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const palette = ["green", "blue", "purple", "cyan", "orange", "pink", "red", "yellow"];
  let ci = 0;
  const seg = ordered.map((name) => {
    const its = groups.get(name);
    const info = eraInfo[name] || {};
    const span = [text(info.inizio), text(info.fine)].filter(Boolean).join("–");
    const isS = name === SENZA;
    const color = isS ? "var(--text-faint)" : `var(--color-${palette[ci++ % palette.length]})`;
    return `<div class="gdr-tl-era" style="flex:${Math.max(1, its.length)};border-bottom-color:${color}">`
      + `<span class="gdr-tl-name">${isS ? "🌫" : "🏛"} ${esc(isS ? SENZA : name)}</span>`
      + (span ? `<span class="gdr-tl-span">${esc(span)}</span>` : "")
      + `<span class="gdr-tl-count">${its.length} voci</span></div>`;
  }).join("");
  const ribbon = `<div class="gdr-timeline">${seg}</div>`;
  return `${head}\n\n${ribbon}\n\n` + blocchi.join("\n\n");
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
// --- Albero evolutivo (progressione ramificata, lore) -----------------------
// Parsing di un nodo "grado | nome | prerequisito | effetto" → {grado, nome, prereq,
// effetto}. Campi mancanti = vuoti; grado non numerico → 0 ("Senza grado"). Esposto.
function parseNodo(riga) {
  const parts = String(riga == null ? "" : riga).split("|").map((s) => s.trim());
  const grado = parseInt(parts[0], 10);
  return {
    grado: Number.isFinite(grado) ? grado : 0,
    nome: parts[1] || "",
    prereq: parts[2] && parts[2] !== "—" ? parts[2] : "",
    effetto: parts[3] || "",
  };
}

// Pannello "Albero evolutivo": legge page.nodi (lista "grado | nome | prereq |
// effetto"), raggruppa per grado crescente e rende ogni nodo con prerequisito ed
// effetto. Vuoto → guida col formato (i nodi si editano nella proprietà `nodi`).
async function renderAlbero(app, page) {
  if (!page) return "*Apri una scheda Albero evolutivo.*";
  const nodi = asArray(page.nodi).map(parseNodo).filter((n) => n.nome);
  if (!nodi.length) {
    return "> [!tip]- 🌳 Albero evolutivo\n> Aggiungi i nodi nella proprietà `nodi`, una riga per nodo:\n> `grado | nome | prerequisito | effetto` — es. `1 | Tocco di Cenere | — | +1 danno da fuoco`.";
  }
  const perGrado = {};
  for (const n of nodi) (perGrado[n.grado] = perGrado[n.grado] || []).push(n);
  const gradi = Object.keys(perGrado).map(Number).sort((a, b) => a - b);
  const blocchi = gradi.map((g) => {
    const righe = perGrado[g].map((n) => {
      const pre = n.prereq ? ` *(richiede ${n.prereq})*` : "";
      const eff = n.effetto ? ` — ${n.effetto}` : "";
      return `> - **${n.nome}**${pre}${eff}`;
    });
    return `> **${g > 0 ? "Grado " + g : "Senza grado"}**\n${righe.join("\n")}`;
  });
  return `> [!tip]- 🌳 Albero evolutivo\n${blocchi.join("\n>\n")}`;
}

// Armi HOMEBREW dal vault (note `oggetto` con tipo=arma): stesso shape del catalogo
// SRD {nome:{nome,danni,proprieta,categoria,padronanza}}, grazie alla parità di campi
// (system.yaml usa gli stessi nomi dell'equip SRD). Così un'arma homebrew, se il PG
// ne ha padronanza, è giocabile in renderAttacchi come quelle ufficiali. Best-effort:
// se l'app non espone il vault (test headless), torna {} e si usa solo il catalogo SRD.
function armiHomebrew(app) {
  const out = {};
  try {
    for (const f of app.vault.getMarkdownFiles()) {
      const fm = app.metadataCache.getFileCache(f) && app.metadataCache.getFileCache(f).frontmatter;
      if (!fm || fm.categoria !== "oggetto" || String(fm.tipo || "").toLowerCase() !== "arma") continue;
      const nome = (fm.nome || f.basename || "").toString();
      if (!nome) continue;
      const proprieta = Array.isArray(fm.proprieta)
        ? fm.proprieta
        : String(fm.proprieta || "").split(",").map((s) => s.trim()).filter(Boolean);
      out[nome] = { nome, danni: fm.danni || "", proprieta, categoria: fm.categoria_arma || "", padronanza: fm.padronanza || "" };
    }
  } catch (e) { /* vault non disponibile (headless): solo catalogo SRD */ }
  return out;
}

async function renderAttacchi(app, page) {
  if (!page) return "*Apri la scheda PG.*";
  const scelte = asArray(page.padronanze_armi).map(nomeArma).filter(Boolean);
  if (!scelte.length) {
    return "> [!tip]- ⚔️ Attacchi con maestria\n> Nessuna padronanza d'arma: la tua classe non la concede. Le 8 proprietà di maestria sono nel quick-ref sotto.";
  }
  const opt = await loadPersonaggio(app);
  // Catalogo SRD + armi homebrew dal vault (parità di campi → stesse colonne).
  const armi = { ...armiHomebrew(app), ...(opt.armi || {}) };
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
  // Risolvi mappa → path nel vault: Link Dataview ({path}) o stringa "[[..]]" (risolta
  // al path reale via metadataCache, fallback al nome del link).
  let path = "", nameStr = "";
  if (raw && raw.path) {
    path = String(raw.path);
  } else if (raw) {
    nameStr = text(raw).replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
    const dest = nameStr && app && app.metadataCache && app.metadataCache.getFirstLinkpathDest
      ? app.metadataCache.getFirstLinkpathDest(nameStr, (page.file && page.file.path) || "")
      : null;
    path = dest ? dest.path : nameStr;
  }
  if (!path) {
    return "> [!tip] Nessuna mappa\n> Imposta il campo **Mappa** qui sopra: collega un'**immagine** (mappa interattiva con zoom/pan e segnaposto che linkano le note), un disegno **Excalidraw**, o una nota.";
  }
  // Immagine raster/SVG → mappa INTERATTIVA zoom-map (pan/zoom, righello distanze→tempi,
  // pin con [[link]] alle note). Verificato in-app: zoom-map processa il blocco anche se
  // iniettato da JS Engine (engine.markdown.create). I marker si piazzano a mano (Shift+clic).
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(path)) {
    return "```zoommap\nimage: " + path + "\nheight: 480px\nminZoom: 0.3\nmaxZoom: 8\n```";
  }
  // Nota o disegno Excalidraw → embed (zone cliccabili disegnate a mano).
  const base = (nameStr || path.split("/").pop()).replace(/\.md$/, "");
  return `![[${base}]]`;
}

// --- Dintorni (geografia spaziale) -------------------------------------------
// Vista locale del luogo, due nozioni complementari di distanza: (1) per CONFINI
// (BFS su confina_con — quante aree attraversi, "come ci si muove via terra") e
// (2) IN LINEA D'ARIA (euclidea sulle coord × scala del mondo, in km — "quanto
// dista davvero"). Più la REGIONE contenitore e i luoghi CONTENUTI (le rotte di
// viaggio vivono nel pannello Viaggio, con tempo e rischio — niente doppione).
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
  // (Le rotte di viaggio non si elencano qui: sono nel pannello Viaggio, con tempo
  //  e rischio per destinazione — niente doppione sulla stessa tab "Spazio".)
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
// Categorie cosmologiche: un principio cosmico può essere un Fronte le cui spinte
// vengono dal GRAFO COSMICO, non da quello economico (collega lo strato più
// modellato alla superficie giocabile).
const COSMO = new Set(["legge_fondamentale", "divinita", "entita_primordiale", "dominio", "piano", "cosmologia", "sistema_magico"]);
// Campi-manifestazione: outlink di un principio verso il mondo mortale (un loro
// target "caldo" = il cosmico si fa crisi lì). I dipendenti che POGGIANO sul
// principio arrivano invece dagli inlink.
const MANIF_FIELDS = ["luoghi", "luoghi_nodo", "soglie", "culti", "abitanti"];

// Una spinta cosmica da un'entità linkata: vale se è "calda" (pressione ≥ 5) o un
// Fronte a metà o oltre. `role` = prefisso (es. "Si manifesta in"). Ritorna la
// riga markdown o null. Esposto per i test.
function cosmicPush(o, role) {
  if (!o || !o.file) return null;
  const p = Number(o.pressione) || 0;
  const dim = Number(o.clock_dim) || 0;
  const adv = dim > 0 && (Number(o.clock) || 0) >= Math.ceil(dim / 2);
  if (p < 5 && !adv) return null;
  const why = adv ? `fronte in corsa (${Number(o.clock) || 0}/${dim})` : pressureLabel(o.pressione);
  return `🌌 ${role} ${noteLink(o)} — ${why}`;
}

// Per un FRONTE (entità con clock_dim) deriva dal grafo le SPINTE che giustificano
// un avanzamento del clock. Grafo ECONOMICO/GEOGRAFICO: dipendenze da risorse
// contese o in mano a terzi (tagliarle stringe), risorse prodotte e contese, rotte
// verso luoghi in crisi, rivali in ascesa. Grafo COSMICO (per i principi): siti di
// manifestazione in crisi + dipendenti (inlink) che vacillano. Rende VISIBILE come
// il mondo preme sul fronte — il GM avanza col bottone (meta_actions.avanza_fronte).
// "" se non è un fronte; tip se nessuna spinta. Ritorna markdown (i [[link]] rendono).
// Le SPINTE dal grafo su un Fronte (entità con clock_dim): grafo economico/
// geografico (dipendenze contese, produzione contesa, rotte a rischio, rivali in
// ascesa) + grafo cosmico (manifestazioni in crisi + dipendenti che vacillano).
// Ritorna l'array di righe-spinta (vuoto = stabile). Sorgente UNICA, riusata da
// renderPressioni (callout per-nota) e renderStatoMondo (cruscotto globale).
async function spinteFronte(app, dv, page) {
  if (!dv || !page || !page.file || page.clock_dim == null) return [];
  const hot = (p) => (Number(p && p.pressione) || 0);
  const out = [];
  // Un Fronte è "religioso" (categoria culto o tipo culto): i suoi rivali-culto e
  // il sacro che serve li tratta il GRAFO TEOLOGICO sotto, non quello economico.
  const religioso = text(page.categoria) === "culto" || text(page.tipo) === "culto";
  // Scarsità come driver economico: una risorsa SCARSA è contesa anche se la sua
  // pressione è bassa (la rarità stessa fa gola). Legge il campo `scarsita` (select).
  const scarsaR = (r) => ["scarsa", "rara", "esaurita"].includes(text(r.scarsita));
  for (const link of asArray(page.dipende_da)) {
    const r = resolve(dv, link); if (!r || !r.file) continue;
    const ctrl = resolve(dv, r.controllata_da);
    const why = [];
    if (hot(r) >= 5) why.push(pressureLabel(r.pressione));
    if (scarsaR(r)) why.push(`risorsa ${text(r.scarsita)}`);
    if (ctrl && ctrl.file) why.push(`in mano a ${noteLink(ctrl)}`);
    if (why.length) out.push(`⛓ Dipendi da ${noteLink(r)} — ${why.join(", ")}: tagliarla ti stringe`);
  }
  for (const link of asArray(page.produce)) {
    const r = resolve(dv, link); if (!r || !r.file) continue;
    if (hot(r) >= 5 || scarsaR(r)) {
      const why = hot(r) >= 5 ? pressureLabel(r.pressione) : `risorsa ${text(r.scarsita)}`;
      out.push(`💎 Produci ${noteLink(r)} (${why}): chi la vuole preme qui`);
    }
  }
  for (const link of asArray(page.rotta_con)) {
    const o = resolve(dv, link); if (!o || !o.file) continue;
    if (hot(o) >= 7) out.push(`🛣 Rotta con ${noteLink(o)} a rischio (${pressureLabel(o.pressione)})`);
  }
  for (const link of asArray(page.rivali)) {
    const o = resolve(dv, link); if (!o || !o.file) continue;
    // I culti-rivali di un Fronte religioso li tratta il grafo teologico (sotto).
    if (religioso && (text(o.categoria) === "culto" || text(o.tipo) === "culto")) continue;
    if (hot(o) >= 7) out.push(`⚔ Rivale ${noteLink(o)} in ascesa (${pressureLabel(o.pressione)})`);
  }
  // Grafo cosmico: un principio cosmico-Fronte è spinto dai suoi siti di
  // manifestazione in crisi (outlink) e dai dipendenti che vacillano (inlink).
  if (COSMO.has(text(page.categoria))) {
    const seen = new Set();
    const add = (o, role) => {
      const r = cosmicPush(o, role);
      if (r && o.file && !seen.has(o.file.path)) { seen.add(o.file.path); out.push(r); }
    };
    for (const fld of MANIF_FIELDS)
      for (const link of asArray(page[fld])) add(resolve(dv, link), "Si manifesta in");
    for (const link of asArray(page.file.inlinks)) add(resolve(dv, link), "Dipende da te");
  }
  // Grafo degli ASSI: il CARATTERE di una divinità preme sul tavolo — gli assi che
  // SCENDONO (il ritratto cosmico diventa spinta, non solo descrizione). Volontà alta →
  // interviene; intransigente e schierata → i fedeli si fanno crociata; ancorata e
  // incarnata → la sua presenza si fa crisi tangibile. Legge i valori-assi dal frontmatter.
  if (text(page.categoria) === "divinita") {
    const ax = (k) => Number(page[k]) || 0;
    if (ax("volonta") >= 4)
      out.push(`🌌 Volontà ${ax("volonta") >= 5 ? "interventista" : "attiva"}: interviene negli eventi, non resta a guardare`);
    if (ax("etica_divina") >= 4 && ax("polarita_cosmica") >= 4)
      out.push(`⚔ Dio intransigente e schierato (etica ${ax("etica_divina")}/5 · polarità ${ax("polarita_cosmica")}/5): i suoi fedeli si fanno crociata`);
    if (ax("presenza_cosmica") >= 4 && ax("incarnazione") >= 4)
      out.push(`👁 Presenza ancorata e quasi incarnata: la sua mano si fa tangibile nel mondo`);
  }
  // Grafo TEOLOGICO: un Fronte religioso è spinto dalla metafisica — il dio/dominio
  // cosmico che venera si desta o freme, un culto rivale sale, una profezia che lo
  // riguarda matura. La fede genera trame come l'economia genera tensioni materiali
  // (il wedge: cosmologia → tavolo, dal lato dei mortali che la servono).
  if (religioso) {
    const cdim = (o) => Number(o && o.clock_dim) || 0;
    const adv = (o) => cdim(o) > 0 && (Number(o.clock) || 0) >= Math.ceil(cdim(o) / 2);
    const seenT = new Set();
    const push = (o, line) => { if (o && o.file && !seenT.has(o.file.path)) { seenT.add(o.file.path); out.push(line); } };
    // 1) Il dio / dominio cosmico che servi (divinita, domini) si desta o freme.
    for (const fld of ["divinita", "domini"])
      for (const link of asArray(page[fld])) {
        const o = resolve(dv, link); if (!o || !o.file) continue;
        if (!COSMO.has(text(o.categoria)) || (hot(o) < 5 && !adv(o))) continue;
        const stato = adv(o) ? `si desta (${Number(o.clock) || 0}/${cdim(o)})` : `freme (${pressureLabel(o.pressione)})`;
        // Gli ASSI del dio venerato scendono sul culto: un dio intransigente e schierato
        // (etica/polarità alte) infiamma di più i suoi fedeli.
        const milit = (Number(o.etica_divina) || 0) >= 4 && (Number(o.polarita_cosmica) || 0) >= 4;
        push(o, `🙏 ${noteLink(o)} che veneri ${stato}${milit ? ", e la sua intransigenza divina infiamma i fedeli" : ""}: la posta cosmica matura`);
      }
    // 2) Un culto rivale in ascesa (caldo o fronte a metà): la fede è contesa.
    for (const link of asArray(page.rivali)) {
      const o = resolve(dv, link); if (!o || !o.file) continue;
      if ((text(o.categoria) !== "culto" && text(o.tipo) !== "culto") || (hot(o) < 5 && !adv(o))) continue;
      const why = adv(o) ? `fronte in corsa (${Number(o.clock) || 0}/${cdim(o)})` : pressureLabel(o.pressione);
      push(o, `☦ Culto rivale ${noteLink(o)} in ascesa (${why}): la fede è contesa`);
    }
    // 3) Una profezia / un mito che ti riguarda matura (inlink che avanza).
    for (const link of asArray(page.file.inlinks)) {
      const o = resolve(dv, link); if (!o || !o.file) continue;
      const c = text(o.categoria);
      if ((c === "profezia" || c === "mito") && adv(o))
        push(o, `📜 ${c === "profezia" ? "La profezia" : "Il mito"} ${noteLink(o)} matura (${Number(o.clock) || 0}/${cdim(o)}): la sua ora si avvicina`);
    }
  }
  return out;
}

async function renderPressioni(app, dv, page) {
  if (!dv || !page || !page.file) return "";
  if (page.clock_dim == null) return "";
  const out = await spinteFronte(app, dv, page);
  if (!out.length) {
    return "> [!tip] Fronte stabile\n> Nessuna spinta dal grafo per ora: il clock avanza solo per le tue mosse.";
  }
  const MAX = 8;                                   // cap anti-muro (SYS-3)
  const extra = out.length - MAX;
  const righe = out.slice(0, MAX).map((r) => "> - " + r);
  if (extra > 0) righe.push(`> - *…e altre ${extra} spinte dal grafo.*`);
  return "> [!danger]- ⚡ Spinte dal grafo (il mondo preme su questo fronte)\n"
    + righe.join("\n")
    + "\n>\n> Una spinta giustifica un segmento: premi **Avanza fronte** o gioca la mossa.";
}

// Cruscotto "Stato del Mondo": TUTTI i Fronti (clock_dim) ordinati per IMMINENZA =
// riempimento del clock + numero di spinte dal grafo che lo premono. Espone il
// differenziatore (la pressione del grafo) a colpo d'occhio per la prep di sessione,
// invece di doverla scoprire una-nota-alla-volta. Ritorna markdown.
async function renderStatoMondo(app, dv) {
  if (!dv) return "*Dataview non attivo.*";
  const fronti = dv.pages()
    .where((p) => p && p.clock_dim != null && Number(p.clock_dim) > 0 && text(p.stato) !== "archiviata")
    .array();
  if (!fronti.length) {
    return "> [!info] Nessun fronte\n> Imposta un **clock** dal tab *Al tavolo* di una nota per accendere un fronte.";
  }
  const rows = [];
  for (const f of fronti) {
    const dim = Math.max(1, Math.floor(Number(f.clock_dim) || 0));
    const cur = Math.max(0, Math.min(dim, Math.floor(Number(f.clock) || 0)));
    const spinte = await spinteFronte(app, dv, f);
    // Imminenza COERENTE (stessa scala di Home e fronti.md.j2): il countdown (clock) è il
    // segnale primario; la PRESSIONE autoriale ora conta (0-10 → peso 0.6, mai sopra un
    // clock pieno); le spinte dal grafo aggiungono slancio (≈ mezzo segmento l'una). Così
    // la dashboard non seppellisce più un Fronte segnato 🔴 Crisi col clock ancora vuoto.
    const pr = Math.max(0, Math.min(10, Number(f.pressione) || 0)) / 10;
    const score = cur / dim + 0.6 * pr + (spinte.length * 0.5) / dim;
    rows.push({ f, dim, cur, spinte, score });
  }
  rows.sort((a, b) => b.score - a.score || b.cur / b.dim - a.cur / a.dim);
  // Cap anti-muro (SYS-3): a scala il cruscotto rendeva un blocco per OGNI fronte
  // (decine di fronti = muro illegibile). Mostra solo i più imminenti; il totale
  // resta visibile nell'intestazione (no silent cap). Per la prep di sessione
  // contano i fronti caldi in cima, non l'elenco esaustivo.
  const TOP = 12;
  // "Caldo" = sta per scattare: ha spinte dal grafo, è al penultimo segmento, O è in
  // pressione di Crisi (≥7) — così la pressione autoriale tinge anche l'icona/stato.
  const caldo = (f, cur, dim, spinte) => spinte.length || cur >= dim - 1 || (Number(f.pressione) || 0) >= 7;
  const blocchi = rows.slice(0, TOP).map(({ f, dim, cur, spinte }) => {
    const pieno = cur >= dim;
    const hot = caldo(f, cur, dim, spinte);
    const icona = pieno ? "🔴" : hot ? "🟠" : "🟢";
    const stato = pieno ? "PIENO — scatena la conseguenza" : hot ? "sta per scattare" : "stabile";
    const next = text(f.prossima_mossa) ? ` · *${text(f.prossima_mossa)}*` : "";
    let blocco = `> ${icona} **${noteLink(f)}** ${cur}/${dim} — ${stato}${next}`;
    for (const s of spinte.slice(0, 2)) blocco += `\n> - ${s}`;
    return blocco;
  });
  const attivi = rows.filter((r) => caldo(r.f, r.cur, r.dim, r.spinte)).length;
  const piuDi = rows.length > TOP ? ` · mostro i ${TOP} più imminenti` : "";
  return `> [!warning] ⚡ Stato del Mondo — **${rows.length} fronti** · ${attivi} sotto pressione${piuDi}\n`
    + "> In ordine di imminenza (clock + spinte dal grafo):\n>\n"
    + blocchi.join("\n>\n");
}

// --- Proiezione (motore J: dry-run del giro del mondo) -----------------------
// Passi del clock per giro dal CALORE (pressione). DEVE combaciare con
// meta_actions.avanzamentoDaPressione (la proiezione mente se divergono → lo impone il
// guard test test_forecast_heat_allineato). Stesse bande di pressureLabel (≥7 / ≥4).
function forecastHeat(pressione) {
  const p = Number(pressione) || 0;
  return p >= 7 ? 2 : p >= 4 ? 1 : 0;
}

// PROIEZIONE: «dove va il mondo se premi Avanza?». Per ogni Fronte stima in QUANTI giri
// scatta al ritmo attuale (calore costante: ceil((dim-clock)/passi)), ordina per imminenza,
// e per chi scatta anticipa l'ONDA (lookahead a 1 passo: chi spingerà, sulle stesse relazioni
// di tensione della cascata). READ-ONLY: è il dry-run del tick — guardi il futuro prima di
// committerlo. Stima a calore costante (le onde reali possono accelerare il resto). Markdown.
async function renderProiezione(app, dv) {
  if (!dv) return "*Dataview non attivo.*";
  const fronti = dv.pages()
    .where((p) => p && p.clock_dim != null && Number(p.clock_dim) > 0 && text(p.stato) !== "archiviata")
    .array();
  if (!fronti.length) {
    return "> [!info] Niente da proiettare\n> Imposta un **clock** su una nota per vedere dove va il mondo.";
  }
  const TENS = ["conseguenza_su", "confina_con", "rivali", "alleati", "controllata_da", "fazioni"];
  const righe = fronti.map((f) => {
    const dim = Math.max(1, Math.floor(Number(f.clock_dim) || 0));
    const cur = Math.max(0, Math.min(dim, Math.floor(Number(f.clock) || 0)));
    const passi = forecastHeat(f.pressione);
    const eta = passi > 0 ? Math.ceil((dim - cur) / passi) : Infinity;
    const bersagli = [];
    if (Number.isFinite(eta)) {
      const seen = new Set([f.file ? f.file.name : ""]);
      for (const campo of TENS)
        for (const link of asArray(f[campo])) {
          const o = resolve(dv, link);
          if (o && o.file && !seen.has(o.file.name)) { seen.add(o.file.name); bersagli.push(noteLink(o)); }
        }
    }
    return { f, dim, cur, passi, eta, bersagli };
  }).sort((a, b) => (a.eta - b.eta) || 0);
  const TOP = 12;
  const blocchi = righe.slice(0, TOP).map(({ f, dim, cur, passi, eta, bersagli }) => {
    if (!Number.isFinite(eta)) return `> 🟢 *fermo* — **${noteLink(f)}** ${cur}/${dim} (Calma: non avanza da solo)`;
    const quando = eta <= 1 ? "**al prossimo giro**" : `tra **${eta} giri**`;
    const cons = text(f.conseguenza) ? ` → ${text(f.conseguenza)}` : "";
    let b = `> ${eta <= 1 ? "🔴" : "🟠"} ${quando} — **${noteLink(f)}** ${cur}/${dim} *(+${passi}/giro)*${cons}`;
    if (bersagli.length) b += `\n> ↳ *l'onda spingerà* ${bersagli.slice(0, 4).join(", ")}`;
    return b;
  });
  const prossimi = righe.filter((r) => Number.isFinite(r.eta) && r.eta <= 1).length;
  const piuDi = righe.length > TOP ? ` · i ${TOP} più vicini` : "";
  return `> [!abstract]- 🔮 Proiezione — al ritmo attuale (${prossimi} scattano al prossimo giro)${piuDi}\n`
    + "> *Dove va il mondo se premi «Avanza il mondo»: stima a calore costante; le onde possono accelerare il resto.*\n>\n"
    + blocchi.join("\n>\n");
}

// --- Tensioni latenti (motore G: il mondo propone i propri Fronti) -----------
// Scandisce il grafo per i CONFLITTI strutturali che non sono ancora un Fronte e li
// propone come orologi pronti: rivalità inerti, risorse contese, profezie dormienti,
// confini caldi. Read-only: suggerisce (chi, perché, conseguenza pre-compilata), il GM
// accende il clock sull'entità indicata. Così il mondo si ALIMENTA di tensioni invece di
// aspettare che le scriva tu. Ritorna markdown.
async function renderTensioni(app, dv) {
  if (!dv) return "*Dataview non attivo.*";
  const pages = dv.pages().where((p) => p && p.file && text(p.stato) !== "archiviata").array();
  const isFronte = (p) => p && Number(p.clock_dim) > 0;
  const nome = (p) => (p && p.file ? p.file.name : "");
  const sugg = [];
  const seen = new Set();
  const addOnce = (key, line) => { if (!seen.has(key)) { seen.add(key); sugg.push(line); } };

  // P1 — Rivalità inerte: A rivali B, e nessuno dei due è già un Fronte → vuole un orologio.
  for (const p of pages) {
    if (isFronte(p)) continue;
    for (const link of asArray(p.rivali)) {
      const o = resolve(dv, link);
      if (!o || !o.file || isFronte(o)) continue;
      addOnce("riv:" + [nome(p), nome(o)].sort().join("|"),
        `> 🔥 **${noteLink(p)} ⚔ ${noteLink(o)}** — rivalità senza orologio. Accendi un Fronte su ${noteLink(p)} *(suggerito: clock 6 · conseguenza «${nome(o)} incassa un colpo»)*.`);
    }
  }
  // P2 — Risorsa contesa: una risorsa è di X, ma X ha dei rivali che la vogliono.
  for (const p of pages.filter((x) => text(x.categoria) === "risorsa")) {
    const ctrl = resolve(dv, p.controllata_da);
    if (!ctrl || !ctrl.file) continue;
    const rivali = asArray(ctrl.rivali).map((l) => resolve(dv, l)).filter((o) => o && o.file);
    if (!rivali.length) continue;
    addOnce("ris:" + nome(p),
      `> 💎 **${noteLink(p)}** è di ${noteLink(ctrl)}, ma ${rivali.slice(0, 2).map(noteLink).join(", ")} la vogliono. Accendi una «corsa a ${nome(p)}» *(clock 4)*.`);
  }
  // P3 — Profezia dormiente: una profezia non ancora un Fronte → il suo compiersi è un clock.
  for (const p of pages.filter((x) => text(x.categoria) === "profezia" && !isFronte(x))) {
    addOnce("prof:" + nome(p),
      `> 🔮 **${noteLink(p)}** è una profezia senza orologio. Accendi un Fronte: il suo compiersi è il clock *(suggerito: 8 · conseguenza = ciò che predice)*.`);
  }
  // P4 — Confine caldo: due luoghi confinanti controllati da fazioni RIVALI tra loro.
  for (const p of pages.filter((x) => text(x.categoria) === "luogo")) {
    const cp = resolve(dv, p.controllata_da);
    if (!cp || !cp.file) continue;
    const rivaliCp = asArray(cp.rivali).map((l) => nome(resolve(dv, l)));
    for (const link of asArray(p.confina_con)) {
      const q = resolve(dv, link);
      if (!q || !q.file) continue;
      const cq = resolve(dv, q.controllata_da);
      if (!cq || !cq.file || nome(cp) === nome(cq) || !rivaliCp.includes(nome(cq))) continue;
      addOnce("conf:" + [nome(p), nome(q)].sort().join("|"),
        `> 🗺 Confine caldo: **${noteLink(p)}** (${noteLink(cp)}) ⟷ **${noteLink(q)}** (${noteLink(cq)}), fazioni rivali. Accendi un Fronte di frontiera *(clock 6)*.`);
    }
  }

  if (!sugg.length) {
    return "> [!tip]- 🌱 Tensioni latenti\n> Nessun conflitto latente nel grafo. Collega *rivali*, risorse *controllate*, *profezie* e *confini* di fazioni rivali per farne emergere.";
  }
  const TOP = 10;
  const righe = sugg.slice(0, TOP);
  if (sugg.length > TOP) righe.push(`> - *…e altre ${sugg.length - TOP} tensioni.*`);
  return `> [!tip]- 🌱 Tensioni latenti — ${sugg.length} conflitti che vogliono un orologio\n`
    + "> Il grafo propone i suoi Fronti: accendi un clock sull'entità indicata (tab *Al tavolo*).\n>\n"
    + righe.join("\n>\n");
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
  const rituali = new Set();
  if (dv) {
    try {
      const cat = (p) => p && p.file && (text(p.categoria) === "incantesimo" || text(p.categoria) === "srd-incantesimo");
      for (const sp of dv.pages().where(cat).array()) {
        const L = Number(sp.livello);
        if (!levelOf.has(sp.file.name) && Number.isFinite(L)) levelOf.set(sp.file.name, L);
        if (sp.durata && /concentr/i.test(text(sp.durata))) concentra.add(sp.file.name);
        if (sp.rituale && /^s[iì]?$|^v?ero$|true/i.test(text(sp.rituale))) rituali.add(sp.file.name);
      }
    } catch (e) { /* dv assente o query fallita: niente livelli/🌀/📿 homebrew */ }
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
    const names = groups.get(L).slice().sort((a, b) => a.localeCompare(b)).map((n) => `${concentra.has(n) ? "🌀 " : ""}${rituali.has(n) ? "📿 " : ""}[[${n}]]`);
    out.push(`> **${titolo}**${L > 0 ? slotInfo(L) : ""} (${names.length})\n> ${names.join(" · ")}`);
  }
  // Testata: CD incantesimo (8 + competenza + mod) e bonus d'attacco (competenza +
  // mod). La caratteristica da incantatore = la prima MENTALE fra le primarie della
  // classe (Mago→INT, Chierico→SAG, Paladino [FOR,CAR]→CAR, Ranger [DES,SAG]→SAG…),
  // così SRD e homebrew funzionano senza un campo dedicato. Il mod si calcola dal
  // punteggio nel frontmatter → corretto a ogni ri-render (non serve mod_<car>).
  const MENTALE = ["intelligenza", "saggezza", "carisma"];
  const carInc = classe.caratteristica_incantesimi
    || asArray(classe.caratteristica_primaria).map(text).find((c) => MENTALE.includes(c));
  let testa = "";
  if (carInc && page[carInc] != null) {
    const mod = Math.floor((Number(page[carInc]) - 10) / 2);
    const pb = Number(page.competenza) || 0;
    const cd = 8 + pb + mod, atk = pb + mod;
    const lab = carInc.charAt(0).toUpperCase() + carInc.slice(1);
    testa = `> **CD incantesimo ${cd}** · **Attacco ${atk >= 0 ? "+" : ""}${atk}** · ${lab}\n>\n`;
  }
  const leg = [];
  if (concentra.size) leg.push("🌀 = concentrazione");
  if (rituali.size) leg.push("📿 = rituale");
  const legenda = leg.length ? "\n>\n> " + leg.join(" · ") : "";
  return "> [!note]- 🪄 Incantesimi\n" + testa + out.join("\n>\n") + legenda;
}

// --- Coerenza GS (DM): "i numeri combaciano col GS dichiarato?" ----------------
// Inverte gs_baseline (mediane SRD) per stimare il GS DIFENSIVO (da AC+PF) e
// OFFENSIVO (da bonus d'attacco + danno per colpo) di una creatura e confrontarli
// col GS dichiarato. Sorgente = mediane SRD (core.gs_baseline), NON le tabelle DMG
// (niente vincolo di licenza). Pensato per gli statblock RIFINITI A MANO: lo scaffold
// è corretto per costruzione, ma una creatura editata può uscire dal GS senza che
// te ne accorga (es. un "GS 5" con 30 PF). Best-effort: i PF/AC si leggono sempre, il
// lato offensivo dipende dal formato delle azioni (n/d se non parsabile).
function _gsToNum(k) {
  if (typeof k === "string" && k.includes("/")) { const [a, b] = k.split("/").map(Number); return b ? a / b : NaN; }
  return Number(k);
}
function _relDist(a, b) { return Math.abs((Number(a) - Number(b)) / Math.max(1, Math.abs(Number(b)))); }
function nearestGs(table, score) {
  let best = null, bestD = Infinity;
  for (const k of Object.keys(table || {})) {
    const d = score(table[k]);
    if (Number.isFinite(d) && d < bestD) { bestD = d; best = k; }
  }
  return best;
}
function nearestGsByNum(table, target) {
  const keys = Object.keys(table || {}).filter((k) => Number.isFinite(_gsToNum(k)));
  if (!keys.length) return null;
  return keys.reduce((best, k) => Math.abs(_gsToNum(k) - target) < Math.abs(_gsToNum(best) - target) ? k : best);
}
function gsDifensivo(table, ac, hp) {
  if (hp == null) return null;
  return nearestGs(table, (r) => (r.hp == null ? Infinity : _relDist(hp, r.hp)) + (r.ac == null || ac == null ? 0 : 0.5 * _relDist(ac, r.ac)));
}
function gsOffensivo(table, atk, danno) {
  if (danno == null) return null;
  return nearestGs(table, (r) => (r.danno == null ? Infinity : _relDist(danno, r.danno)) + (r.attacco == null || atk == null ? 0 : 0.5 * _relDist(atk, r.attacco)));
}
function verificaGS(table, stats, dichiarato) {
  const difensivo = gsDifensivo(table, stats.ac, stats.hp);
  const offensivo = gsOffensivo(table, stats.atk, stats.danno);
  const nums = [difensivo, offensivo].filter((x) => x != null).map(_gsToNum).filter(Number.isFinite);
  const atteso = nums.length ? nearestGsByNum(table, nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  return { difensivo, offensivo, atteso, dichiarato: dichiarato == null ? null : String(dichiarato) };
}

// Estrae dal corpo nota i numeri del primo blocco ```statblock: AC, PF e (best-effort
// dal formato delle azioni) il miglior bonus d'attacco e il danno per colpo.
function parseStatblockStats(testo) {
  const block = (String(testo || "").match(/```statblock[\s\S]*?```/) || [])[0] || "";
  if (!block) return null;
  const one = (re) => { const m = block.match(re); return m ? Number(m[1]) : null; };
  let atk = null, danno = null, m;
  const atkRe = /per colpire:\*?\s*([+-]?\d+)/g;
  while ((m = atkRe.exec(block))) { const v = Number(m[1]); if (atk == null || v > atk) atk = v; }
  const dmgRe = /Colpito:\*?\s*(\d+)/g;
  while ((m = dmgRe.exec(block))) { const v = Number(m[1]); if (danno == null || v > danno) danno = v; }
  return { ac: one(/^\s*ac:\s*"?(\d+)/m), hp: one(/^\s*hp:\s*"?(\d+)/m), atk, danno };
}

async function renderVerificaGS(app, page) {
  if (!page || text(page.categoria) !== "creatura") return "";
  const gs = page.gs != null ? String(page.gs).trim() : "";
  if (!gs) return "";
  const core = await loadCoreData(app);
  const table = core.gs_baseline || {};
  if (!Object.keys(table).length) return "";
  const f = app.workspace && app.workspace.getActiveFile && app.workspace.getActiveFile();
  if (!f) return "";
  let body = "";
  try { body = await app.vault.read(f); } catch (e) { return ""; }
  const st = parseStatblockStats(body);
  if (!st || st.hp == null) return "";
  const v = verificaGS(table, st, gs);
  const vicino = (a) => a != null && Math.abs(_gsToNum(a) - _gsToNum(gs)) <= Math.max(1, _gsToNum(gs) * 0.34);
  const icona = (a) => a == null ? "·" : (vicino(a) ? "✅" : "⚠️");
  const righe = [
    `> - Difensivo (AC ${st.ac != null ? st.ac : "?"} · PF ${st.hp}) ≈ **GS ${v.difensivo}** ${icona(v.difensivo)}`,
    v.offensivo != null
      ? `> - Offensivo (att ${st.atk >= 0 ? "+" : ""}${st.atk} · danno ${st.danno}/colpo) ≈ **GS ${v.offensivo}** ${icona(v.offensivo)}`
      : "> - Offensivo: n/d (rifinisci le azioni col formato dello scaffold)",
    `> - **Atteso ≈ GS ${v.atteso}** · dichiarato **GS ${gs}**`,
  ];
  const allarme = (v.difensivo != null && !vicino(v.difensivo)) || (v.offensivo != null && !vicino(v.offensivo));
  return `> [!${allarme ? "warning" : "tip"}]- 📐 Coerenza GS${allarme ? " — controlla i numeri" : ""}\n`
    + righe.join("\n")
    + "\n>\n> Stime dalle mediane SRD di pari GS (non tabelle DMG). Difensivo = AC+PF; offensivo = attacco + danno per colpo.";
}

module.exports = {
  renderEntityPanel, renderSessionPanel, renderBacklinks,
  renderAxesCompare, radarSvg, clampAxis,
  renderProfilo, archetipiMatch, profiloTags, matchesCond,
  renderCoerenza, confrontoAssi, coerenzaNote,
  renderClock, clockSvg,
  renderEncounter, xpForCreature,
  renderVerificaGS, verificaGS, gsDifensivo, gsOffensivo, parseStatblockStats,
  renderProgressione,
  renderRisorsePG, barPct, barRow,
  renderSpecieTratti, sezioniMarkdown,
  renderIncantesimi,
  renderTimeline, quandoNum, epocaLabel,
  renderTappe, parseTappa,
  renderTipoProfilo,
  renderCausalita,
  renderMap, renderDintorni, renderViaggio, parseCoord,
  renderPressioni, cosmicPush, spinteFronte, renderStatoMondo,
  renderProiezione, forecastHeat, renderTensioni,
  renderCondizioni, condizioniMarkdown,
  renderMaestrie, maestrieMarkdown,
  renderAttacchi, attaccoArma, abilitaArma, danniArma, nomeArma, armiHomebrew,
  renderAlbero, parseNodo,
  radarMarkdownFromValues,
  renderTemaNatale, temaNataleMarkdown,
  renderConnessioni,
};
