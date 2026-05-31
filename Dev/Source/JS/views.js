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
// Disegna gli assi (0-10, coppie sinistra↔destra) come radar SVG inline (niente
// dipendenze esterne). La definizione degli assi per categoria sta in core.json
// (render.py la scrive nel payload) -> il componente la carica a runtime e così
// funziona per QUALSIASI categoria, abilitando il confronto fra entità.

const RADAR_PALETTE = [
  "var(--text-accent)", "var(--color-red)", "var(--color-green)",
  "var(--color-orange)", "var(--color-purple)", "var(--color-cyan)",
];

// Valore di un asse normalizzato a [0,10]; vuoto/non numerico -> 5 (neutro).
function clampAxis(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(0, Math.min(10, n));
}

function polarPoint(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function svgEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// SVG (stringa) di un radar. axes = [{id, sinistra, destra}]; series =
// [{name, values:[0..10], color}]. <3 assi -> "" (un radar ha bisogno di 3 raggi).
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
    g += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="8" fill="var(--text-muted)" text-anchor="${anchor}" dominant-baseline="middle">${svgEscape(a.destra || a.id)}</text>`;
  });
  series.forEach((s) => {
    const poly = axes.map((_, i) => polarPoint(cx, cy, R * clampAxis(s.values[i]) / 10, i * step).map((n) => n.toFixed(1)).join(",")).join(" ");
    g += `<polygon points="${poly}" fill="${s.color}" fill-opacity="0.18" stroke="${s.color}" stroke-width="1.5"/>`;
  });
  series.forEach((s, i) => {
    g += `<text x="6" y="${12 + i * 12}" font-size="8" fill="${s.color}">■ ${svgEscape(s.name)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="gdr-radar-svg" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}

async function loadCoreData(app) {
  try {
    return JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json"));
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
  const values = axes.map((a) => clampAxis(page[a.id]));
  const name = page.nome || (page.file && page.file.name) || "—";
  injectSvg(container, radarSvg(axes, [{ name, values, color: RADAR_PALETTE[0] }]),
    "Servono almeno 3 assi tematici per il radar.");
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
      values: axes.map((a) => clampAxis(p[a.id])),
      color: RADAR_PALETTE[i % RADAR_PALETTE.length],
    }));
  injectSvg(container, radarSvg(axes, series),
    `Confronto: servono ≥3 assi e ≥1 entità di categoria "${category}".`);
}

module.exports = {
  renderEntityPanel, renderSessionPanel, renderBacklinks,
  renderAxesRadar, renderAxesCompare, radarSvg, clampAxis,
};
