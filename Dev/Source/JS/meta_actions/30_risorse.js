async function riposo_lungo(file) {
  let esaur = null;
  await updateFrontmatter(file, fm => {
    if (fm.pf_max != null) fm.pf = Number(fm.pf_max) || 0;
    fm.pf_temp = 0;
    fm.ts_morte_successi = 0;
    fm.ts_morte_fallimenti = 0;
    fm.concentrazione_su = "";
    for (let n = 1; n <= 9; n++) {
      if (fm["slot_uso_" + n] != null) fm["slot_uso_" + n] = 0;
    }
    if (fm.dadi_vita_max != null) {
      const rec = Math.max(1, Math.floor((Number(fm.dadi_vita_max) || 0) / 2));
      fm.dadi_vita_spesi = Math.max(0, (Number(fm.dadi_vita_spesi) || 0) - rec);
    }
    if (fm.esaurimento != null) {
      fm.esaurimento = Math.max(0, (Number(fm.esaurimento) || 0) - 1);
      esaur = fm.esaurimento;
    }
    // Risorse di classe (Ki/Ira/Incanalare/...): il riposo lungo le ricarica TUTTE.
    for (const r of (Array.isArray(fm.risorse_pg) ? fm.risorse_pg : [])) {
      if (r && r.id) fm["usi_" + r.id] = 0;
    }
  });
  const coda = esaur != null ? ` Esaurimento → ${esaur}.` : "";
  new Notice(`Riposo lungo: PF al massimo, slot/TS-morte/concentrazione, risorse di classe e metà Dadi Vita recuperati.${coda}`);
  return "";
}

// Riposo breve (PG): ricarica le risorse di classe a riposo BREVE (e gli slot del Patto
// del Warlock, 2024) e spende UN Dado Vita per curarsi (tira il dado vita + mod COS, min 1
// PF, fino a pf_max). La ricarica avviene SEMPRE, anche senza Dadi Vita da spendere.
async function riposo_breve(file) {
  let msg = "Riposo breve: nessun Dado Vita rimasto.";
  const ric = [];
  await updateFrontmatter(file, fm => {
    // Ricarica BREVE: risorse di classe con ric:breve + slot del Patto (slot_ricarica:breve).
    for (const r of (Array.isArray(fm.risorse_pg) ? fm.risorse_pg : [])) {
      if (r && r.ric === "breve" && (Number(fm["usi_" + r.id]) || 0) > 0) { fm["usi_" + r.id] = 0; ric.push(r.label); }
    }
    if (fm.slot_ricarica === "breve") {
      let any = false;
      for (let n = 1; n <= 9; n++) if (fm["slot_uso_" + n] != null && (Number(fm["slot_uso_" + n]) || 0) > 0) { fm["slot_uso_" + n] = 0; any = true; }
      if (any) ric.push("slot del Patto");
    }
    // Cura: spende 1 Dado Vita, se disponibile.
    const max = Number(fm.dadi_vita_max) || 0;
    const spesi = Number(fm.dadi_vita_spesi) || 0;
    if (max - spesi <= 0) return;
    const die = Number((String(fm.dado_vita).match(/\d+/) || [8])[0]) || 8;
    const conMod = Math.floor(((Number(fm.costituzione) || 10) - 10) / 2);
    const roll = Math.floor(Math.random() * die) + 1;
    const cura = Math.max(1, roll + conMod);
    const pf = (Number(fm.pf) || 0) + cura;
    fm.pf = fm.pf_max != null ? Math.min(Number(fm.pf_max) || pf, pf) : pf;
    fm.dadi_vita_spesi = spesi + 1;
    msg = `Riposo breve: speso 1 Dado Vita (d${die}: ${roll}${conMod >= 0 ? "+" : ""}${conMod}) → +${cura} PF.`;
  });
  new Notice(msg + (ric.length ? ` Ricaricati: ${ric.join(", ")}.` : ""));
  return "";
}

// «Usa risorsa»: spende 1 uso di una risorsa di classe a ricarica (incrementa usi_<id>
// fino al max). Suggester sulle risorse della scheda PG (risorse_pg). I riposi le azzerano.
async function usa_risorsa(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const risorse = (Array.isArray(fm.risorse_pg) ? fm.risorse_pg : []).filter(r => r && (Number(r.max) || 0) > 0);
  if (!risorse.length) { new Notice("Nessuna risorsa di classe da spendere su questa scheda."); return ""; }
  const labels = risorse.map(r => {
    const rem = Math.max(0, (Number(r.max) || 0) - (Number(fm["usi_" + r.id]) || 0));
    return `${r.label} — ${rem}/${Number(r.max) || 0}`;
  });
  const r = await tp.system.suggester(labels, risorse, false, "Quale risorsa spendere?");
  if (!r) return "";
  let ok = false;
  await updateFrontmatter(file, f => {
    const max = Number(r.max) || 0, spent = Number(f["usi_" + r.id]) || 0;
    if (spent >= max) return;
    f["usi_" + r.id] = spent + 1;
    ok = true;
  });
  new Notice(ok ? `Speso 1 · ${r.label}.` : `${r.label}: già esaurita (riposa per ricaricarla).`);
  return "";
}

// Aggiunge un'entrata datata al "Registro dei turni" del bastione (la sezione è
// creata se assente). Pura/testabile: ritorna il nuovo contenuto. Le voci nuove
// vanno in cima al registro (più recente prima).
