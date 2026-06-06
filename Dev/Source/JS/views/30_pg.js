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

