// sali_pg.js — Sali di livello PG interattivo (2-20). Legge personaggio.json + il
// frontmatter del PG attivo e applica il livello successivo: PF (media fissa del
// dado vita + mod COS), competenza e slot dalla progressione; poi guida le scelte
// (ASI/talento, sottoclasse, nuovi trucchetti/incantesimi). Script Templater
// autonomo (tp.user.sali_pg), richiamato da meta_actions.

async function loadOpzioni() {
  return JSON.parse(await app.vault.adapter.read("z.automazioni/data/personaggio.json"));
}
function mod(v) { const n = Number.parseInt(v, 10); return Math.floor(((Number.isFinite(n) ? n : 10) - 10) / 2); }
function pfPerLivello(dado) { return Math.floor((Number(dado) || 8) / 2) + 1; } // media fissa (PHB)
function sigla(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

async function scegliMulti(tp, titolo, pool, n) {
  const scelte = [], disp = [...(pool || [])];
  for (let i = 0; i < (n || 0) && disp.length; i++) {
    const v = await tp.system.suggester(disp, disp, false, `${titolo} (${i + 1}/${n})`);
    if (v == null) break;
    scelte.push(v); disp.splice(disp.indexOf(v), 1);
  }
  return scelte;
}

async function sali_pg(tp) {
  const file = app.workspace.getActiveFile && app.workspace.getActiveFile();
  if (!file) { new Notice("Nessuna nota attiva."); return ""; }
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  if (fm.tipo !== "pg" && fm.categoria !== "personaggio") { new Notice("Apri una scheda PG."); return ""; }
  const opt = await loadOpzioni();
  const classe = (opt.classi || {})[fm.classe];
  if (!classe) { new Notice(`Classe sconosciuta: ${fm.classe}`); return ""; }
  const cur = Math.max(1, Number(fm.livello) || 1);
  if (cur >= 20) { new Notice("PG già al 20º livello."); return ""; }
  const nuovo = cur + 1;
  const row = (classe.progressione || [])[nuovo - 1] || {};

  const u = {};        // aggiornamenti frontmatter
  const note = [];     // riepilogo per la Notice
  // PF (media fissa) + mod COS; competenza; slot
  const dpf = Math.max(1, pfPerLivello(classe.dado_vita) + mod(fm.costituzione));
  u.pf_max = (Number(fm.pf_max) || 0) + dpf;
  u.pf = u.pf_max;
  if (row.competenza) u.competenza = row.competenza;
  for (const [n, q] of Object.entries(row.slot || {})) u["slot_" + n] = q;
  u.livello = nuovo;
  note.push(`PF +${dpf}`);

  // Sottoclasse (l'SRD ne ha una per classe)
  if (classe.livello_sottoclasse === nuovo && !fm.sottoclasse && classe.sottoclasse) {
    u.sottoclasse = classe.sottoclasse;
    note.push(`sottoclasse ${classe.sottoclasse}`);
  }

  // ASI / Talento
  if ((classe.livelli_asi || []).includes(nuovo)) {
    const cars = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
    const scelta = await tp.system.suggester(
      ["+2 a una caratteristica", "+1 a due caratteristiche", "Talento"],
      ["asi2", "asi11", "talento"], false, `Livello ${nuovo}: Aumento dei punteggi o Talento`);
    if (scelta === "asi2") {
      const c = await tp.system.suggester(cars.map(sigla), cars, false, "+2 a quale caratteristica?");
      if (c) { u[c] = (Number(fm[c]) || 10) + 2; note.push(`+2 ${sigla(c)}`); }
    } else if (scelta === "asi11") {
      const disp = [...cars];
      for (let i = 0; i < 2 && disp.length; i++) {
        const c = await tp.system.suggester(disp.map(sigla), disp, false, `+1 a una caratteristica (${i + 1}/2)`);
        if (!c) break;
        u[c] = (Number(u[c] != null ? u[c] : fm[c]) || 10) + 1; disp.splice(disp.indexOf(c), 1); note.push(`+1 ${sigla(c)}`);
      }
    } else if (scelta === "talento") {
      const ids = Object.keys(opt.talenti || {});
      const t = await tp.system.suggester(ids.map(id => (opt.talenti[id].label) || id), ids, false, "Quale talento?");
      if (t) { const l = Array.isArray(fm.talenti) ? [...fm.talenti] : []; if (!l.includes(t)) l.push(t); u.talenti = l; note.push(`talento ${t}`); }
    }
  }

  // Incantesimi: trucchetti + incantesimi preparati (delta dal pool, fino al max livello)
  if (classe.incantatore) {
    const pool = classe.incantesimi_pool || {};
    const curTr = Array.isArray(fm.trucchetti) ? fm.trucchetti : [];
    const dTr = (row.trucchetti || 0) - curTr.length;
    if (dTr > 0) {
      const nuovi = await scegliMulti(tp, "Nuovo trucchetto", (pool["0"] || []).filter(s => !curTr.includes(s)), dTr);
      if (nuovi.length) { u.trucchetti = [...curTr, ...nuovi]; note.push(`+${nuovi.length} trucchetti`); }
    }
    const curSp = Array.isArray(fm.incantesimi) ? fm.incantesimi : [];
    const dSp = (row.preparati || 0) - curSp.length;
    if (dSp > 0) {
      const maxLiv = Math.max(0, ...Object.keys(row.slot || {}).map(Number));
      let castabili = [];
      for (let L = 1; L <= maxLiv; L++) castabili = castabili.concat(pool[String(L)] || []);
      const nuovi = await scegliMulti(tp, `Nuovo incantesimo (fino al liv ${maxLiv})`, castabili.filter(s => !curSp.includes(s)), dSp);
      if (nuovi.length) { u.incantesimi = [...curSp, ...nuovi]; note.push(`+${nuovi.length} incantesimi`); }
    }
  }

  // Privilegi del nuovo livello (esclusa la voce ASI, già gestita) -> lista
  const nuoviPriv = (row.privilegi || []).filter(p => !/aumento dei punteggi/i.test(p));
  if (nuoviPriv.length) {
    const l = Array.isArray(fm.privilegi_classe) ? [...fm.privilegi_classe] : [];
    for (const p of nuoviPriv) if (!l.includes(p)) l.push(p);
    u.privilegi_classe = l;
    note.push(nuoviPriv.join(", "));
  }

  await app.fileManager.processFrontMatter(file, f => { for (const [k, v] of Object.entries(u)) f[k] = v; });
  new Notice(`Salito al livello ${nuovo}! ${note.join(" · ")}`);
  return "";
}

module.exports = sali_pg;
