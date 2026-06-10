// SORGENTE CANONICA del ponte HOMEBREW→motore: le note del vault (incantesimi,
// classi, specie, background, talenti) lette a runtime e fuse nelle opzioni SRD.
// crea_pg.js e sali_pg.js sono script autonomi (niente require/bundling a runtime)
// e ne tengono una COPIA fra i marker `// >>>homebrew-bridge` / `// <<<homebrew-bridge`;
// validate.check() impone che le due copie siano IDENTICHE a questa. Così la deriva
// (modificarne una sola, es. nel lavoro su "sottoclasse homebrew") è un errore di
// `npm run check`, non un bug latente in cui creazione e level-up usano regole diverse.
// Modifica QUI e risincronizza le copie (stesso testo). Le funzioni file-specifiche
// (backgroundHomebrew/specieHomebrew in crea_pg; talentiHomebrew in sali_pg) restano
// FUORI dal blocco nei rispettivi file. Questo `_*.js` NON è copiato nel vault.
// >>>homebrew-bridge
// noteVault: note del vault per categoria → [{f, fm}]. Vuoto fuori da Obsidian
// (test: niente getMarkdownFiles) → l'homebrew non c'è e il motore resta quello SRD.
function noteVault(cat) {
  if (!app.vault || !app.vault.getMarkdownFiles) return [];
  return app.vault.getMarkdownFiles()
    .map(f => ({ f, fm: (app.metadataCache.getFileCache(f) || {}).frontmatter || {} }))
    .filter(e => e.fm.categoria === cat && e.fm.stato !== "archiviata");
}
function normTxt(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}
// "Forza, Destrezza" → ["forza","destrezza"] via mappa label→id (salta i non riconosciuti).
function toIds(testo, labelToId) {
  const raw = Array.isArray(testo) ? testo.join(",") : String(testo || "");
  return raw.split(/[,;]/).map(x => labelToId[normTxt(x)]).filter(Boolean);
}
// Incantesimi homebrew per la classe → {livello:[nomi]}. Una nota conta se le sue
// `classi` citano la classe (id o label) o sono vuote (= a tutti). livello → 1 se assente.
function incantesimiHomebrew(classeId, classeLabel) {
  const want = [String(classeId || ""), String(classeLabel || "")].map(s => s.toLowerCase()).filter(Boolean);
  const pool = {};
  for (const { f, fm } of noteVault("incantesimo")) {
    const classi = (Array.isArray(fm.classi) ? fm.classi.join(",") : String(fm.classi || "")).toLowerCase();
    if (classi && !want.some(w => w && classi.includes(w))) continue;
    const n = Number.parseInt(fm.livello, 10);
    const L = String(Number.isFinite(n) && n >= 0 ? n : 1);
    (pool[L] = pool[L] || []).push(f.basename);
  }
  return pool;
}
// Fonde due pool {livello:[nomi]} senza duplicati (SRD + homebrew).
function fondiPool(a, b) {
  const out = {};
  for (const src of [a || {}, b || {}])
    for (const [L, nomi] of Object.entries(src))
      out[L] = Array.from(new Set([...(out[L] || []), ...nomi]));
  return out;
}
// Categorie d'armatura indossabili dal testo (come build_personaggio._armor_categories).
function armorCats(prose) {
  const n = normTxt(prose);
  return [["leggera", "legger"], ["media", "medi"], ["pesante", "pesant"], ["scudo", "scud"]]
    .filter(([, k]) => n.includes(k)).map(([c]) => c);
}
// "A: ...; oppure B: ..." → {A, B}; senza B → {A: tutto}.
function parseEquip(prose) {
  const t = String(prose || "").replace(/\s+/g, " ").trim();
  if (!t) return {};
  const m = t.match(/^\s*A\s*:\s*(.*?)\s*(?:;?\s*oppure\s*|;\s*)B\s*:\s*(.*)$/i);
  return m ? { A: m[1].trim(), B: m[2].trim() } : { A: t };
}
// Classe homebrew → opzione nella forma del motore. I caster (tipo_incantatore
// pieno/mezzo) ricevono gli slot dalle tabelle SRD (opt.slot_incantatore) e il pool
// dagli incantesimi homebrew. crea_pg usa tutto; sali_pg usa dado_vita/tipo_incantatore/
// incantesimi_pool (competenza/ASI standard, niente progressione SRD).
function classeHomebrew(opt) {
  const statMap = {}; for (const id of opt.caratteristiche || []) statMap[normTxt(id)] = id;
  const out = {};
  for (const { f, fm } of noteVault("classe")) {
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
      privilegi_l1: String(fm.privilegi_l1 || "").split(/[;\n]/).map((s) => s.trim()).filter(Boolean),
      privilegi_livello: privilegiPerLivello(fm),
      livello_sottoclasse: Number.parseInt(fm.livello_sottoclasse, 10) || 3,
      incantatore: caster,
      trucchetti_noti: caster ? (tipoInc === "pieno" ? 3 : 2) : 0,
      incantesimi_preparati: caster ? (tipoInc === "pieno" ? 4 : 2) : 0,
      slot_l1: caster ? (tab[0] || {}) : {},
      incantesimi_pool: caster ? incantesimiHomebrew(f.basename, f.basename) : {},
      tipo_incantatore: tipoInc || "nessuno",
      padronanza_armi: 0,
      risorse: Array.isArray(fm.risorse) ? fm.risorse : [],
    };
  }
  return out;
}

// Privilegi di classe homebrew per livello: la lista frontmatter `privilegi`
// ([{livello, nome, descrizione, concede}]) → {N: [{nome, desc, concede}]}, fusa col legacy
// `privilegi_l1` (stringa → feature di livello 1 senza effetti). Letta da crea_pg (L1) e
// sali_pg (a ogni livello): mostra la feature e ne applica il `concede`.
function privilegiPerLivello(fm) {
  const out = {};
  const push = (L, nome, desc, concede) => { if (nome) (out[L] = out[L] || []).push({ nome, desc: desc || "", concede: concede || null }); };
  for (const p of Array.isArray(fm.privilegi) ? fm.privilegi : [])
    if (p && typeof p === "object") push(Number.parseInt(p.livello, 10) || 1, String(p.nome || "").trim(), String(p.descrizione || p.desc || ""), p.concede);
  for (const nome of String(fm.privilegi_l1 || "").split(/[;\n]/).map((s) => s.trim()).filter(Boolean)) push(1, nome, "", null);
  return out;
}

// Effetti STRUTTURATI di un talento/privilegio/tratto homebrew (campo `concede`) applicati a `u`,
// leggendo lo stato corrente da `fm`. Automatizza: caratteristica (+N, cap 20), abilita (competenze
// → prof_<id>), armi/armature/strumenti (competenze testuali). Ritorna le note per il log; gli
// effetti freeform restano nella prosa. carIds = id caratteristiche; abilMap = {forma: id_abilita}
// (label e id normalizzati). Non applica nulla che non sia dichiarato.
function applyConcede(u, fm, concede, carIds, abilMap) {
  const note = [];
  if (!concede || typeof concede !== "object") return note;
  const car = concede.caratteristica || concede.punteggi;
  if (car && typeof car === "object") {
    for (const [k, raw] of Object.entries(car)) {
      const id = (carIds || []).indexOf(normTxt(k)) >= 0 ? normTxt(k) : null;
      const v = Number(raw) || 0;
      if (id && v) {
        const cur = Number(u[id] != null ? u[id] : fm[id]) || 10;
        u[id] = Math.min(cur + v, 20);
        note.push(`${v >= 0 ? "+" : ""}${v} ${id}`);
      }
    }
  }
  const abil = concede.abilita || concede.competenze_abilita;
  for (const a of Array.isArray(abil) ? abil : abil ? [abil] : []) {
    const id = (abilMap || {})[normTxt(a)];
    if (id) { u["prof_" + id] = 1; note.push(`competenza ${id}`); }
  }
  for (const [campo, key] of [["armi", "competenze_armi"], ["armature", "competenze_armature"], ["strumenti", "competenze_strumenti"]]) {
    const add = String(concede[campo] || "").trim();
    if (!add) continue;
    const cur = String((u[key] != null ? u[key] : fm[key]) || "").trim();
    u[key] = cur ? `${cur}, ${add}` : add;
    note.push(add);
  }
  return note;
}
// <<<homebrew-bridge

module.exports = { noteVault, normTxt, toIds, incantesimiHomebrew, fondiPool, armorCats, parseEquip, classeHomebrew };
