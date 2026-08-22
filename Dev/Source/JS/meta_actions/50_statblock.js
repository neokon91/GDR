// --- Scaffolder statblock dal GS (DM) ---------------------------------------
// Per una creatura con `gs` impostato, RIGENERA il blocco ```gdr statblock (statblock
// NATIVO, forma RawMostro) con valori base = mediane dei mostri SRD di pari GS
// (core.json gs_baseline): CA/PF/BC + caratteristiche coerenti (TS competenti su
// FOR/COS) e un'azione d'attacco col bonus e il danno tipici (+ multiattacco e
// un'azione-salvezza se quel GS li prevede). Un boss con solo `gs` diventa SUBITO
// giocabile; il DM rifinisce a mano. Re-eseguibile.
function _sign(n) { return (Number(n) >= 0 ? "+" : "") + Number(n); }
function _gsNum(k) {
  if (typeof k === "string" && k.includes("/")) { const [a, b] = k.split("/").map(Number); return b ? a / b : NaN; }
  return Number(k);
}
// Media del dado vita per taglia (5.5e): d4/d6/d8/d10/d12/d20 → serve per ricavare
// i `dadi_vita` che rendono i PF-base del GS (il motore calcola i PF da HD+taglia+Cos).
function _avgDado(taglia) {
  const f = { minuscola: 4, piccola: 6, media: 8, grande: 10, enorme: 12, mastodontica: 20 };
  const t = String(taglia || "media").toLowerCase();
  return (f[t] || 8) / 2 + 0.5;
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
  const re = /```gdr statblock\r?\n[\s\S]*?\r?\n```/;
  const cur = data.match(re);
  if (!cur) { new Notice("Nessun blocco ```gdr statblock``` in questa nota."); return ""; }

  const pb = base.pb != null ? base.pb : 2;
  const atk = base.attacco != null ? base.attacco : pb;
  const mod = atk - pb;
  const forza = Math.max(1, 10 + 2 * mod);
  const cos = Math.max(8, 10 + 2 * Math.round(mod / 2));
  const taglia = String(fm.taglia || "media").toLowerCase();
  // `dadi_vita` tale che i PF calcolati (HD·mediaDado + HD·modCos) ≈ ai PF-base del GS.
  const cosMod = Math.floor((cos - 10) / 2);
  const dadiVita = Math.max(1, Math.round((base.hp != null ? base.hp : 10) / (_avgDado(taglia) + cosMod)));
  const danno = base.danno != null
    ? `${base.danno}${base.danno_formula ? ` (${base.danno_formula})` : ""} danni${base.danno_tipo ? ` ${base.danno_tipo}` : ""}`
    : "danni a scelta";
  // Multiattacco: i mostri di GS medio-alto attaccano più volte per turno. Lo
  // scaffold lo riflette (1 attacco fino a GS 1; 2 da GS 2; 3 da GS 11).
  const gsN = _gsNum(gs);
  const nAtt = !Number.isFinite(gsN) ? 1 : (gsN >= 11 ? 3 : (gsN >= 2 ? 2 : 1));
  const azioni = [];
  if (nAtt > 1) {
    azioni.push("  - nome: Multiattacco");
    azioni.push(`    testo: "${file.basename} effettua ${nAtt} attacchi."`);
  }
  azioni.push("  - nome: Attacco");
  azioni.push(`    testo: "*Tiro per colpire:* ${_sign(atk)}, portata 1,5 m (o gittata). *Colpito:* ${danno}."`);
  if (base.cd != null) {
    azioni.push(`  - nome: Azione speciale (CD ${base.cd})`);
    azioni.push(`    testo: "*Tiro salvezza:* CD ${base.cd}. Personalizza l'effetto (area, condizione, danno)."`);
  }
  const sb = [
    "```gdr statblock",
    `nome: ${file.basename}`,
    `taglia: ${taglia}`,
    `tipo: ${fm.tipo || "umanoide"}`,
    "allineamento: neutrale",
    `ca: {valore: ${base.ac != null ? base.ac : 12}}`,
    "caratteristiche:",
    // TS competenti su FOR/COS (competenza: true): il motore li rende rollabili con
    // il BC del GS. Le altre caratteristiche restano da rifinire a mano.
    `  forza: {valore: ${forza}, competenza: true}`,
    "  destrezza: {valore: 12}",
    `  costituzione: {valore: ${cos}, competenza: true}`,
    "  intelligenza: {valore: 10}",
    "  saggezza: {valore: 12}",
    "  carisma: {valore: 10}",
    `dadi_vita: ${dadiVita}`,
    "velocita: {camminata: 6}",
    `gs: "${gs}"`,
    "tratti:",
    `  - nome: Generato dal GS ${gs}`,
    `    testo: "Valori base = mediane dei mostri SRD di pari GS${hit.gs !== gs ? ` (≈ GS ${hit.gs})` : ""}. Rifinisci a mano: multiattacco, tratti, resistenze, leggendarie."`,
    "azioni:",
    ...azioni,
    "```",
  ].join("\n");
  await app.vault.modify(file, data.replace(re, sb));
  new Notice(`Statblock generato dal GS ${gs} (CA ${base.ac}, PF ~${base.hp}). Rifinisci a mano.`);
  return "";
}
