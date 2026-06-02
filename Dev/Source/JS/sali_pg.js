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

// --- Ponte HOMEBREW→motore (copie gemelle di crea_pg.js: script autonomi) -----
// Note del vault per categoria → frontmatter (vuoto fuori da Obsidian: test).
function vaultByCategoria(cat) {
  if (!app.vault || !app.vault.getMarkdownFiles) return [];
  return app.vault.getMarkdownFiles()
    .map(f => ({ f, fm: (app.metadataCache.getFileCache(f) || {}).frontmatter || {} }))
    .filter(e => e.fm.categoria === cat && e.fm.stato !== "archiviata");
}
// Incantesimi homebrew per la classe → {livello:[nomi]} (classi che citano la classe
// o vuote; livello mancante → 1). Da fondere col pool SRD.
function incantesimiHomebrew(classeId, classeLabel) {
  const want = [String(classeId || ""), String(classeLabel || "")].map(s => s.toLowerCase()).filter(Boolean);
  const pool = {};
  for (const { f, fm } of vaultByCategoria("incantesimo")) {
    const classi = (Array.isArray(fm.classi) ? fm.classi.join(",") : String(fm.classi || "")).toLowerCase();
    if (classi && !want.some(w => w && classi.includes(w))) continue;
    const n = Number.parseInt(fm.livello, 10);
    const L = String(Number.isFinite(n) && n >= 0 ? n : 1);
    (pool[L] = pool[L] || []).push(f.basename);
  }
  return pool;
}
function fondiPool(a, b) {
  const out = {};
  for (const src of [a || {}, b || {}])
    for (const [L, nomi] of Object.entries(src))
      out[L] = Array.from(new Set([...(out[L] || []), ...nomi]));
  return out;
}
// Talenti homebrew → {nome:{label:nome}}, da fondere con opt.talenti (SRD).
function talentiHomebrew() {
  const out = {};
  for (const { f } of vaultByCategoria("talento")) out[f.basename] = { label: f.basename };
  return out;
}
function normTxt(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}
function toIds(testo, labelToId) {
  const raw = Array.isArray(testo) ? testo.join(",") : String(testo || "");
  return raw.split(/[,;]/).map(x => labelToId[normTxt(x)]).filter(Boolean);
}
function armorCats(prose) {
  const n = normTxt(prose);
  return [["leggera", "legger"], ["media", "medi"], ["pesante", "pesant"], ["scudo", "scud"]]
    .filter(([, k]) => n.includes(k)).map(([c]) => c);
}
function parseEquip(prose) {
  const t = String(prose || "").replace(/\s+/g, " ").trim();
  if (!t) return {};
  const m = t.match(/^\s*A\s*:\s*(.*?)\s*(?:;?\s*oppure\s*|;\s*)B\s*:\s*(.*)$/i);
  return m ? { A: m[1].trim(), B: m[2].trim() } : { A: t };
}
// Classe homebrew → opzione nella forma del motore (copia gemella di crea_pg.js).
// sali_pg ne usa dado_vita, tipo_incantatore (slot al level-up dalle tabelle SRD) e
// incantesimi_pool; competenza/ASI sono derivati standard (niente progressione SRD).
function classeHomebrew(opt) {
  const statMap = {}; for (const id of opt.caratteristiche || []) statMap[normTxt(id)] = id;
  const out = {};
  for (const { f, fm } of vaultByCategoria("classe")) {
    const tipoInc = normTxt(fm.tipo_incantatore);
    const caster = tipoInc === "pieno" || tipoInc === "mezzo";
    const tab = (opt.slot_incantatore || {})[tipoInc] || [];
    const dado = String(fm.dado_vita == null ? "" : fm.dado_vita).match(/\d+/);
    out[f.basename] = {
      label: f.basename,
      dado_vita: dado ? Number(dado[0]) : 8,
      tiri_salvezza: toIds(fm.ts_competenze, statMap),
      caratteristica_primaria: toIds(fm.car_primaria, statMap),
      abilita: { scelte: Number.parseInt(fm.abilita_numero, 10) || 2, opzioni: Object.keys(opt.abilita || {}) },
      competenze_armi: String(fm.competenze_armi || ""),
      competenze_armature: String(fm.competenze_armature || ""),
      competenze_armature_cat: armorCats(fm.competenze_armature),
      competenze_strumenti: String(fm.strumento || ""),
      equipaggiamento: parseEquip(fm.equipaggiamento),
      privilegi_l1: [],
      incantatore: caster,
      trucchetti_noti: caster ? (tipoInc === "pieno" ? 3 : 2) : 0,
      incantesimi_preparati: caster ? (tipoInc === "pieno" ? 4 : 2) : 0,
      slot_l1: caster ? (tab[0] || {}) : {},
      incantesimi_pool: caster ? incantesimiHomebrew(f.basename, f.basename) : {},
      tipo_incantatore: tipoInc || "nessuno",
      padronanza_armi: 0,
    };
  }
  return out;
}

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
  // Classi SRD fuse con l'homebrew del vault (ponte homebrew→motore): un PG di
  // classe homebrew sale di livello come gli altri.
  const classi = { ...(opt.classi || {}), ...classeHomebrew(opt) };
  const classe = classi[fm.classe];
  if (!classe) { new Notice(`Classe sconosciuta: ${fm.classe}`); return ""; }
  const cur = Math.max(1, Number(fm.livello) || 1);
  if (cur >= 20) { new Notice("PG già al 20º livello."); return ""; }
  const nuovo = cur + 1;
  const row = (classe.progressione || [])[nuovo - 1] || {};
  // Classe HOMEBREW (senza progressione SRD): competenza/ASI/slot derivati standard.
  const homebrew = !(classe.progressione && classe.progressione.length);

  const u = {};        // aggiornamenti frontmatter
  const note = [];     // riepilogo per la Notice
  // PF (media fissa) + mod COS; competenza; slot
  const dpf = Math.max(1, pfPerLivello(classe.dado_vita) + mod(fm.costituzione));
  u.pf_max = (Number(fm.pf_max) || 0) + dpf;
  u.pf = u.pf_max;
  // Competenza: dalla riga SRD, o standard (2 + (liv-1)/4) per l'homebrew.
  u.competenza = row.competenza || (2 + Math.floor((nuovo - 1) / 4));
  // Slot: dalla riga SRD; per un caster homebrew dalla tabella standard del suo tipo.
  let slotMap = row.slot || {};
  if (homebrew && classe.tipo_incantatore && classe.tipo_incantatore !== "nessuno") {
    slotMap = ((opt.slot_incantatore || {})[classe.tipo_incantatore] || [])[nuovo - 1] || {};
  }
  for (const [n, q] of Object.entries(slotMap)) u["slot_" + n] = q;
  u.livello = nuovo;
  note.push(`PF +${dpf}`);

  // Sottoclasse (l'SRD ne ha una per classe; l'homebrew non la dichiara)
  if (classe.livello_sottoclasse === nuovo && !fm.sottoclasse && classe.sottoclasse) {
    u.sottoclasse = classe.sottoclasse;
    note.push(`sottoclasse ${classe.sottoclasse}`);
  }

  // ASI / Talento: livelli SRD della classe, o standard 4/8/12/16/19 per l'homebrew.
  const asiLevels = (classe.livelli_asi && classe.livelli_asi.length) ? classe.livelli_asi : [4, 8, 12, 16, 19];
  if (asiLevels.includes(nuovo)) {
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
      const talenti = { ...(opt.talenti || {}), ...talentiHomebrew() };  // SRD + homebrew
      const ids = Object.keys(talenti);
      const t = await tp.system.suggester(ids.map(id => (talenti[id].label) || id), ids, false, "Quale talento?");
      if (t) { const l = Array.isArray(fm.talenti) ? [...fm.talenti] : []; if (!l.includes(t)) l.push(t); u.talenti = l; note.push(`talento ${t}`); }
    }
  }

  // Incantesimi: trucchetti + incantesimi preparati (delta dal pool, fino al max
  // livello). Pool SRD FUSO con l'homebrew del vault (ponte homebrew→motore).
  if (classe.incantatore) {
    const pool = fondiPool(classe.incantesimi_pool || {}, incantesimiHomebrew(fm.classe, classe.label));
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
// Esposti per i test del ponte homebrew→motore.
module.exports.incantesimiHomebrew = incantesimiHomebrew;
module.exports.talentiHomebrew = talentiHomebrew;
module.exports.fondiPool = fondiPool;
module.exports.classeHomebrew = classeHomebrew;
