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
// nome + effetto. Da core.maestrie (system.yaml). NB: la mappa arma→proprietà e
// i conteggi per classe non sono nei dati SRD → qui solo gli effetti.
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

module.exports = {
  renderEntityPanel, renderSessionPanel, renderBacklinks,
  renderAxesRadar, renderAxesCompare, radarSvg, clampAxis,
  renderProfilo, archetipiMatch, profiloTags, matchesCond,
  renderClock, clockSvg,
  renderEncounter, xpForCreature,
  renderProgressione,
  renderSpecieTratti, sezioniMarkdown,
  renderTimeline, quandoNum, epocaLabel,
  renderMap,
  renderCondizioni, condizioniMarkdown,
  renderMaestrie, maestrieMarkdown,
  radarMarkdownFromValues,
  renderTemaNatale, temaNataleMarkdown,
  renderConnessioni,
};
