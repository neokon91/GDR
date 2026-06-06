// --- Scaffolder statblock dal GS (DM) ---------------------------------------
// Per una creatura con `gs` impostato, RIGENERA il blocco ```statblock con valori
// base = mediane dei mostri SRD di pari GS (core.json gs_baseline): AC/PF/BC/
// iniziativa + un'azione d'attacco col bonus e il danno tipici (+ un'azione-
// salvezza se quel GS la prevede). Un boss con solo `gs` diventa SUBITO giocabile;
// il DM rifinisce a mano. Re-eseguibile. Preserva il `layout` esistente.
function _sign(n) { return (Number(n) >= 0 ? "+" : "") + Number(n); }
function _gsNum(k) {
  if (typeof k === "string" && k.includes("/")) { const [a, b] = k.split("/").map(Number); return b ? a / b : NaN; }
  return Number(k);
}
function nearestBaseline(table, gs) {
  if (table[gs]) return { rec: table[gs], gs };
  const target = _gsNum(gs);
  if (!Number.isFinite(target)) return null;
  let best = null, bestD = Infinity;
  for (const k of Object.keys(table)) {
    const v = _gsNum(k);
    if (Number.isFinite(v) && Math.abs(v - target) < bestD) { bestD = Math.abs(v - target); best = k; }
  }
  return best ? { rec: table[best], gs: best } : null;
}

async function scaffold_statblock(file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const gs = fm.gs != null ? String(fm.gs).trim() : "";
  if (!gs) { new Notice("Imposta il Grado di sfida (GS) nella scheda e ripremi."); return ""; }
  const core = await loadCore();
  const hit = nearestBaseline(core.gs_baseline || {}, gs);
  if (!hit) { new Notice(`Nessuna statistica base per GS ${gs}.`); return ""; }
  const base = hit.rec;
  const data = await app.vault.read(file);
  const re = /```statblock\r?\n[\s\S]*?\r?\n```/;
  const cur = data.match(re);
  if (!cur) { new Notice("Nessun blocco ```statblock``` in questa nota."); return ""; }
  const layout = (cur[0].match(/^layout:\s*(.+)$/m) || [])[1] || "5-5e-ita";

  const pb = base.pb != null ? base.pb : 2;
  const atk = base.attacco != null ? base.attacco : pb;
  const mod = atk - pb;
  const forza = Math.max(1, 10 + 2 * mod);
  const cos = Math.max(8, 10 + 2 * Math.round(mod / 2));
  const danno = base.danno != null
    ? `${base.danno}${base.danno_formula ? ` (${base.danno_formula})` : ""} danni${base.danno_tipo ? ` ${base.danno_tipo}` : ""}`
    : "danni a scelta";
  // Multiattacco: i mostri di GS medio-alto attaccano più volte per turno. Lo
  // scaffold lo riflette (1 attacco fino a GS 1; 2 da GS 2; 3 da GS 11) così un boss
  // homebrew "picchia" come la sua fascia. Ogni attacco fa il danno-base del GS.
  const gsN = _gsNum(gs);
  const nAtt = !Number.isFinite(gsN) ? 1 : (gsN >= 11 ? 3 : (gsN >= 2 ? 2 : 1));
  const azioni = [];
  if (nAtt > 1) {
    azioni.push("  - name: Multiattacco");
    azioni.push(`    desc: "${file.basename} effettua ${nAtt} attacchi."`);
  }
  azioni.push("  - name: Attacco");
  azioni.push(`    desc: "*Tiro per colpire:* ${_sign(atk)}, portata 1,5 m (o gittata). *Colpito:* ${danno}."`);
  if (base.cd != null) {
    azioni.push(`  - name: Azione speciale (CD ${base.cd})`);
    azioni.push(`    desc: "*Tiro salvezza:* CD ${base.cd}. Personalizza l'effetto (area, condizione, danno)."`);
  }
  const sb = [
    "```statblock",
    `layout: ${layout}`,
    `name: ${file.basename}`,
    `size: ${fm.taglia || "Medio"}`,
    `type: ${fm.tipo || "umanoide"}`,
    "alignment: neutrale",
    `ac: ${base.ac != null ? base.ac : 12}`,
    `hp: ${base.hp != null ? base.hp : 10}`,
    "speed: 9 m",
    `initiative: "${_sign(base.init != null ? base.init : 0)}"`,
    `stats: [${forza}, 12, ${cos}, 10, 12, 10]`,
    `cr: "${gs}"`,
    `pb: "${_sign(pb)}"`,
    // TS competenti sulle caratteristiche potenziate (FOR/COS): rollabili, e danno
    // alla creatura una difesa coerente col GS. Il DM rifinisce le altre a mano.
    `saves: [{FOR: ${mod + pb}}, {COS: ${Math.round(mod / 2) + pb}}]`,
    "traits:",
    `  - name: Generato dal GS ${gs}`,
    `    desc: "Valori base = mediane dei mostri SRD di pari GS${hit.gs !== gs ? ` (≈ GS ${hit.gs})` : ""}. Rifinisci a mano: multiattacco, tratti, resistenze, leggendarie."`,
    "actions:",
    ...azioni,
    "```",
  ].join("\n");
  await app.vault.modify(file, data.replace(re, sb));
  new Notice(`Statblock generato dal GS ${gs} (AC ${base.ac}, PF ${base.hp}). Rifinisci a mano.`);
  return "";
}

