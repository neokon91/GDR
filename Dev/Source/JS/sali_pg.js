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

// --- Ponte HOMEBREW→motore (note del vault fuse nelle opzioni SRD a runtime) ---
// Le 8 funzioni nel blocco qui sotto sono una COPIA byte-identica di
// Dev/Source/JS/_homebrew_bridge.js (sorgente canonica), condivisa con l'altro
// wizard PG; check() ne impone l'uguaglianza. Le funzioni file-specifiche restano
// FUORI dal blocco.
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
// <<<homebrew-bridge

// Talenti homebrew → {nome:{label, categoria}}, da fondere con opt.talenti (SRD).
// `categoria` dal subtype della nota (origine/generale/stile/epico) → gating.
function talentiHomebrew() {
  const out = {};
  for (const { f, fm } of noteVault("talento")) out[f.basename] = { label: f.basename, categoria: fm.tipo || "" };
  return out;
}

// Gating dei talenti a un ASI (2024): a un Aumento dei punteggi si prende un talento
// GENERALE; i DONI EPICI solo dal livello 19; i talenti di ORIGINE vengono dal
// background e gli STILI DI COMBATTIMENTO dai privilegi di classe → esclusi qui.
// Categoria ignota (homebrew non marcato) = permesso (non bloccare l'homebrew).
function talentoAmmesso(t, livello) {
  const c = normTxt(t && t.categoria);
  if (!c) return true;
  if (c.includes("general")) return true;
  if (c.includes("epic")) return Number(livello) >= 19;
  return false;
}

// Sottoclassi homebrew del vault legate a una classe (match su id o label del
// campo `classe` della nota sottoclasse) → {nome:{label}}. Offerte al livello_sottoclasse.
function sottoclasseHomebrew(classeId, classeLabel) {
  const want = [String(classeId || ""), String(classeLabel || "")].map((s) => s.toLowerCase()).filter(Boolean);
  const out = {};
  for (const { f, fm } of noteVault("sottoclasse")) {
    const cls = (Array.isArray(fm.classe) ? fm.classe.join(",") : String(fm.classe || "")).toLowerCase();
    if (cls && want.some((w) => w && cls.includes(w))) out[f.basename] = { label: f.basename };
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

// --- Multiclasse 2024 (funzioni pure, testate isolate) ------------------------
const CARS = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];

// Prerequisito soddisfatto: `alternative` = lista di set {caratteristica:min}; ne basta
// UNO con TUTTE le sue soglie raggiunte (Guerriero = Forza O Destrezza; Monaco/Paladino/
// Ranger = entrambe). Nessuna alternativa (classe non in tabella) → vero (no gate).
function prereqOk(scores, alternative) {
  const alts = Array.isArray(alternative) ? alternative : [];
  if (!alts.length) return true;
  return alts.some(set => Object.entries(set || {}).every(([car, min]) => (Number((scores || {})[car]) || 0) >= Number(min)));
}

// Prerequisito in chiaro per la Notice: "Forza 13 o Destrezza 13" · "Destrezza 13 e Saggezza 13".
function prereqLabel(alternative) {
  return (alternative || []).map(set =>
    Object.entries(set || {}).map(([c, m]) => `${c.charAt(0).toUpperCase() + c.slice(1)} ${m}`).join(" e ")
  ).join(" o ");
}

// Multiclasse consentita (RAW): servono i prerequisiti della NUOVA classe E di tutte
// quelle già possedute. → {ok, mancanti:[id...]} con le classi i cui prereq non reggono.
function multiclassGate(scores, classiPossedute, nuova, prereqMap) {
  const map = prereqMap || {};
  const mancanti = [];
  for (const id of [nuova, ...(classiPossedute || [])]) {
    if (map[id] && !prereqOk(scores, map[id])) mancanti.push(id);
  }
  return { ok: mancanti.length === 0, mancanti: Array.from(new Set(mancanti)) };
}

// Classi che contribuiscono agli slot a LIVELLO (incantatori pieno/mezzo/terzo); il
// Patto del Warlock è SEMPRE separato e qui escluso. breakdown = [{id, livello}].
function casterClasses(breakdown, classiOpt) {
  return (breakdown || [])
    .map(c => ({ id: c.id, livello: Number(c.livello) || 0, tipo: (classiOpt[c.id] || {}).tipo_incantatore || "nessuno" }))
    .filter(c => c.livello > 0 && (c.tipo === "pieno" || c.tipo === "mezzo" || c.tipo === "terzo"));
}

// Livello-da-incantatore COMBINATO (2024): pieno ×1, mezzo ÷2, terzo ÷3 (arrot. in
// difetto). Per la tabella slot multiclasse, usata SOLO con 2+ classi incantatrici.
function combinedCasterLevel(breakdown, classiOpt) {
  const cc = casterClasses(breakdown, classiOpt);
  const somma = t => cc.filter(c => c.tipo === t).reduce((s, c) => s + c.livello, 0);
  return somma("pieno") + Math.floor(somma("mezzo") / 2) + Math.floor(somma("terzo") / 3);
}

// Slot incantesimo a livello del PG (mappa {n:q}): 0 caster → {}; UNA sola classe
// incantatrice → la SUA tabella al suo livello (o quella standard del tipo, per
// l'homebrew); 2+ → tabella multiclasse SRD al livello-incantatore combinato. Il
// Patto del Warlock è separato (pactSlots), non entra qui.
function leveledSlots(breakdown, opt, classiOpt) {
  const cc = casterClasses(breakdown, classiOpt || opt.classi || {});
  if (!cc.length) return {};
  if (cc.length === 1) {
    const c = cc[0], cls = (classiOpt || opt.classi || {})[c.id] || {};
    if (cls.progressione && cls.progressione.length) return ((cls.progressione[c.livello - 1] || {}).slot) || {};
    return ((opt.slot_incantatore || {})[cls.tipo_incantatore] || [])[c.livello - 1] || {};  // caster homebrew
  }
  return (opt.slot_multiclasse || [])[combinedCasterLevel(breakdown, classiOpt || opt.classi || {}) - 1] || {};
}

// Patto del Warlock (slot separati, ricarica a riposo breve): somma i livelli delle
// classi-patto e legge la loro tabella `pact`. → {slot, liv} o null senza warlock.
function pactSlots(breakdown, classiOpt) {
  let liv = 0, cls = null;
  for (const c of breakdown || []) {
    const o = (classiOpt || {})[c.id] || {};
    if (o.tipo_incantatore === "patto" && Array.isArray(o.pact)) { liv += Number(c.livello) || 0; cls = o; }
  }
  if (!cls || liv <= 0) return null;
  return cls.pact[Math.min(liv, cls.pact.length) - 1] || null;
}

// Max di una risorsa a un livello (colonna SRD monotòna → max sui livelli ≤ liv).
function maxAtLevel(valori, liv) {
  let m = 0;
  for (const [k, v] of Object.entries(valori || {})) if (Number(k) <= liv) m = Math.max(m, Number(v) || 0);
  return m;
}

// Risorse di classe attive al livello `liv` (gemella di crea_pg.risorseAtLevel): max da
// CARATTERISTICA (mod, min 1), da TABELLA SRD (`valori`) o `max` fisso (homebrew); la
// ricarica passa a breve dalla soglia `ricarica_breve_da_livello`. Esclude i max 0.
function risorseAtLevel(risorse, liv, scores) {
  return (risorse || []).map(r => {
    let max;
    if (r.caratteristica) max = Math.max(1, mod((scores || {})[r.caratteristica]));
    else if (r.valori) max = maxAtLevel(r.valori, liv);
    else max = Number(r.max) || 0;
    const ric = (r.ricarica_breve_da_livello && liv >= r.ricarica_breve_da_livello) ? "breve" : r.ricarica;
    return { id: r.id, label: r.label, max, ric, icona: r.icona || "" };
  }).filter(r => r.max > 0);
}

// Risorse da TUTTE le classi del breakdown ai rispettivi livelli, deduplicate per id
// (su collisione tiene il max più alto). → lista per risorse_pg.
function risorseBreakdown(breakdown, classiOpt, scores) {
  const byId = new Map();
  for (const c of breakdown || []) {
    for (const r of risorseAtLevel(((classiOpt || {})[c.id] || {}).risorse, Number(c.livello) || 0, scores)) {
      const ex = byId.get(r.id);
      if (!ex || r.max > ex.max) byId.set(r.id, r);
    }
  }
  return [...byId.values()];
}

async function sali_pg(tp) {
  const file = app.workspace.getActiveFile && app.workspace.getActiveFile();
  if (!file) { new Notice("Nessuna nota attiva."); return ""; }
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  if (fm.tipo !== "pg" && fm.categoria !== "personaggio") { new Notice("Apri una scheda PG."); return ""; }
  const opt = await loadOpzioni();
  // Classi SRD fuse con l'homebrew del vault (ponte homebrew→motore).
  const classi = { ...(opt.classi || {}), ...classeHomebrew(opt) };

  // Ripartizione per classe = fonte di verità della multiclasse. Assente (PG mono-classe
  // o creato prima della multiclasse) → ricavata dai campi piatti classe/livello.
  let breakdown = (Array.isArray(fm.classi) && fm.classi.length
    ? fm.classi.map(c => ({ id: String(c.id), livello: Math.max(0, Number(c.livello) || 0), sottoclasse: c.sottoclasse || "" }))
    : [{ id: fm.classe, livello: Math.max(1, Number(fm.livello) || 1), sottoclasse: fm.sottoclasse || "" }]
  ).filter(c => c.id && classi[c.id]);
  if (!breakdown.length) { new Notice(`Classe sconosciuta: ${fm.classe}`); return ""; }
  const totale = breakdown.reduce((s, c) => s + c.livello, 0);
  if (totale >= 20) { new Notice("PG già al 20º livello (personaggio)."); return ""; }

  const u = {};        // aggiornamenti frontmatter
  const note = [];     // riepilogo per la Notice
  const scores = {};   // caratteristiche correnti (per prereq e risorse), aggiornate da un ASI
  for (const c of CARS) scores[c] = Number(fm[c]) || 10;

  // 1) In quale classe salire? Classi possedute + (se restano classi) la multiclasse.
  const MC = "__multiclasse__";
  const voci = breakdown.map(c => `Sali in ${classi[c.id].label || c.id} (→ ${c.livello + 1})`);
  const valori = breakdown.map(c => c.id);
  const multiPossibile = Object.keys(classi).some(id => !breakdown.find(b => b.id === id));
  if (multiPossibile) { voci.push("➕ Multiclasse — livello in una NUOVA classe"); valori.push(MC); }
  let targetId = (breakdown.length === 1 && !multiPossibile) ? breakdown[0].id
    : await tp.system.suggester(voci, valori, false, `Livello ${totale} → ${totale + 1}: in quale classe?`);
  if (targetId == null) return "";

  // 1b) Multiclasse: nuova classe → prerequisiti RAW (blocco) → competenze parziali
  // (sottoinsieme del 1º livello) + eventuali abilità a scelta. Poi entra nel breakdown.
  if (targetId === MC) {
    const presi = breakdown.map(c => c.id);
    const disp = Object.keys(classi).filter(id => !presi.includes(id));
    const nuova = await tp.system.suggester(disp.map(id => classi[id].label || id), disp, false, "Multiclasse: nuova classe");
    if (!nuova) return "";
    const prereqMap = (opt.multiclasse || {}).prerequisiti || {};
    const gate = multiclassGate(scores, presi, nuova, prereqMap);
    if (!gate.ok) {
      const dett = gate.mancanti.map(id => `${classi[id].label || id} (${prereqLabel(prereqMap[id])})`).join(" · ");
      new Notice(`Multiclasse negata — prerequisiti 5.5e non soddisfatti: ${dett}.`);
      return "";
    }
    const comp = ((opt.multiclasse || {}).competenze || {})[nuova] || {};
    const append = (cur, add) => { add = String(add || "").trim(); if (!add) return cur; const c = String(cur || "").trim().replace(/\.$/, ""); return c ? `${c}; ${add}` : add; };
    if (comp.armi) u.competenze_armi = append(fm.competenze_armi, comp.armi);
    if (comp.armature) u.competenze_armature = append(fm.competenze_armature, comp.armature);
    if (comp.strumenti) u.competenze_strumenti = append(fm.competenze_strumenti, comp.strumenti);
    if (comp.abilita_scelte) {
      const lab = id => (opt.abilita[id] && opt.abilita[id].label) || id;
      const disp2 = Object.keys(opt.abilita || {}).filter(id => !(Number(fm["prof_" + id]) > 0) && !u["prof_" + id]);
      for (let i = 0; i < comp.abilita_scelte && disp2.length; i++) {
        const id = await tp.system.suggester(disp2.map(lab), disp2, false, `Abilità — multiclasse ${classi[nuova].label || nuova} (${i + 1}/${comp.abilita_scelte})`);
        if (!id) break;
        u["prof_" + id] = 1; disp2.splice(disp2.indexOf(id), 1);
      }
    }
    breakdown.push({ id: nuova, livello: 0, sottoclasse: "" });  // il livello sale a 1 qui sotto
    targetId = nuova;
    note.push(`multiclasse → ${classi[nuova].label || nuova}`);
  }

  // 2) Sale di livello la classe scelta; tutto il resto è derivato dal nuovo breakdown.
  const tgt = breakdown.find(c => c.id === targetId);
  tgt.livello += 1;
  const lvCls = tgt.livello;                                     // livello NELLA classe scelta
  const classe = classi[targetId];
  const row = (classe.progressione || [])[lvCls - 1] || {};
  const prevRow = (classe.progressione || [])[lvCls - 2] || {};  // {} se è il 1º livello della classe
  const multiclasse = breakdown.length > 1;
  const nuovoTot = breakdown.reduce((s, c) => s + c.livello, 0);

  // PF: media fissa del dado della classe SCELTA + mod COS. Competenza e Dadi Vita dal
  // livello TOTALE del personaggio (la competenza è condivisa, non per-classe).
  const dpf = Math.max(1, pfPerLivello(classe.dado_vita) + mod(fm.costituzione));
  u.pf_max = (Number(fm.pf_max) || 0) + dpf;
  u.pf = u.pf_max;
  u.competenza = 2 + Math.floor((nuovoTot - 1) / 4);
  u.livello = nuovoTot;
  u.dadi_vita_max = nuovoTot;
  u.classe = breakdown[0].id;  // classe "primaria" (display/compat): la prima presa
  note.push(`PF +${dpf}`);

  // Sottoclasse della classe scelta al suo livello_sottoclasse (SRD: una; homebrew: a
  // scelta dal vault). Scritta nel breakdown; rispecchiata nel campo piatto se primaria.
  if (classe.livello_sottoclasse === lvCls && !tgt.sottoclasse) {
    const opzioni = {};
    if (classe.sottoclasse) opzioni[classe.sottoclasse] = { label: classe.sottoclasse };
    Object.assign(opzioni, sottoclasseHomebrew(targetId, classe.label));
    const ids = Object.keys(opzioni);
    let sc = ids[0];
    if (ids.length > 1) sc = await tp.system.suggester(ids.map(id => opzioni[id].label || id), ids, false, `${classe.label} ${lvCls}: scegli la sottoclasse`);
    if (sc) { tgt.sottoclasse = sc; if (targetId === breakdown[0].id) u.sottoclasse = sc; note.push(`sottoclasse ${sc}`); }
  }

  // ASI / Talento: ai livelli DI CLASSE giusti (gli ASI sono per-classe, 2024). Gating
  // dono epico sul livello-personaggio.
  const asiLevels = (classe.livelli_asi && classe.livelli_asi.length) ? classe.livelli_asi : [4, 8, 12, 16, 19];
  if (asiLevels.includes(lvCls)) {
    const scelta = await tp.system.suggester(
      ["+2 a una caratteristica", "+1 a due caratteristiche", "Talento"],
      ["asi2", "asi11", "talento"], false, `${classe.label} ${lvCls}: Aumento dei punteggi o Talento`);
    if (scelta === "asi2") {
      const c = await tp.system.suggester(CARS.map(sigla), CARS, false, "+2 a quale caratteristica?");
      if (c) { u[c] = (Number(fm[c]) || 10) + 2; note.push(`+2 ${sigla(c)}`); }
    } else if (scelta === "asi11") {
      const disp = [...CARS];
      for (let i = 0; i < 2 && disp.length; i++) {
        const c = await tp.system.suggester(disp.map(sigla), disp, false, `+1 a una caratteristica (${i + 1}/2)`);
        if (!c) break;
        u[c] = (Number(u[c] != null ? u[c] : fm[c]) || 10) + 1; disp.splice(disp.indexOf(c), 1); note.push(`+1 ${sigla(c)}`);
      }
    } else if (scelta === "talento") {
      const talenti = { ...(opt.talenti || {}), ...talentiHomebrew() };  // SRD + homebrew
      const ids = Object.keys(talenti).filter(id => talentoAmmesso(talenti[id], nuovoTot));  // gating 2024
      const t = await tp.system.suggester(ids.map(id => talenti[id].label || id), ids, false, `Quale talento (generale${nuovoTot >= 19 ? " o dono epico" : ""})?`);
      if (t) { const l = Array.isArray(fm.talenti) ? [...fm.talenti] : []; if (!l.includes(t)) l.push(t); u.talenti = l; note.push(`talento ${t}`); }
    }
  }
  // Risincronizza mod_<car> per le caratteristiche cambiate dall'ASI (e aggiorna scores,
  // così Ispirazione bardica = mod CAR e gli altri derivati restano corretti qui sotto).
  for (const c of CARS) if (u[c] != null) { u["mod_" + c] = mod(u[c]); scores[c] = u[c]; }

  // Slot incantesimo: ricomputati da TUTTO il breakdown (tabella della singola classe o
  // tabella multiclasse SRD coi 2+ caster) + Patto del Warlock SEPARATO. Gli usi sono
  // clampati al nuovo massimo. Un caster che non ha più uno slot lo vede azzerato.
  const newSlots = leveledSlots(breakdown, opt, classi);
  for (let n = 1; n <= 9; n++) {
    const q = Number(newSlots[String(n)] || newSlots[n] || 0);
    if (q > 0) { u["slot_" + n] = q; if ((Number(fm["slot_uso_" + n]) || 0) > q) u["slot_uso_" + n] = q; }
    else if (fm["slot_" + n] != null) u["slot_" + n] = 0;
  }
  const pact = pactSlots(breakdown, classi);
  if (pact) {
    u.slot_patto = pact.slot; u.slot_patto_liv = pact.liv;
    if (fm.slot_patto_uso == null) u.slot_patto_uso = 0;
    else if ((Number(fm.slot_patto_uso) || 0) > pact.slot) u.slot_patto_uso = pact.slot;
  }
  if (breakdown.some(c => (classi[c.id] || {}).incantatore || (classi[c.id] || {}).tipo_incantatore === "patto")) u.incantatore = true;

  // Incantesimi: trucchetti + incantesimi della CLASSE scelta, per INCREMENTO del suo
  // livello (così con più incantatori i conteggi non si confondono). Pool SRD+homebrew.
  if (classe.incantatore) {
    const pool = fondiPool(classe.incantesimi_pool || {}, incantesimiHomebrew(targetId, classe.label));
    const curTr = Array.isArray(fm.trucchetti) ? fm.trucchetti : [];
    const dTr = (row.trucchetti || 0) - (prevRow.trucchetti || 0);
    if (dTr > 0) {
      const nuovi = await scegliMulti(tp, `Nuovo trucchetto (${classe.label})`, (pool["0"] || []).filter(s => !curTr.includes(s)), dTr);
      if (nuovi.length) { u.trucchetti = [...curTr, ...nuovi]; note.push(`+${nuovi.length} trucchetti`); }
    }
    const curSp = Array.isArray(fm.incantesimi) ? fm.incantesimi : [];
    const dSp = (row.preparati || 0) - (prevRow.preparati || 0);
    if (dSp > 0) {
      const maxLiv = Math.max(0, ...Object.keys(newSlots).map(Number).filter(Number.isFinite), pact ? pact.liv : 0, ...Object.keys(row.slot || {}).map(Number));
      let castabili = [];
      for (let L = 1; L <= maxLiv; L++) castabili = castabili.concat(pool[String(L)] || []);
      const nuovi = await scegliMulti(tp, `Nuovo incantesimo ${classe.label} (fino al liv ${maxLiv})`, castabili.filter(s => !curSp.includes(s)), dSp);
      if (nuovi.length) { u.incantesimi = [...curSp, ...nuovi]; note.push(`+${nuovi.length} incantesimi`); }
    }
  }

  // Privilegi del nuovo livello (esclusa la voce ASI). In multiclasse li si etichetta con
  // la classe, per leggere la scheda senza confondere le fonti.
  const nuoviPriv = (row.privilegi || []).filter(p => !/aumento dei punteggi/i.test(p));
  if (nuoviPriv.length) {
    const l = Array.isArray(fm.privilegi_classe) ? [...fm.privilegi_classe] : [];
    for (const p of nuoviPriv) { const v = multiclasse ? `${classe.label}: ${p}` : p; if (!l.includes(v)) l.push(v); }
    u.privilegi_classe = l;
    note.push(nuoviPriv.join(", "));
  }

  // Ripartizione aggiornata = fonte di verità (la classe piatta = primaria, già sopra).
  u.classi = breakdown.map(c => ({ id: c.id, livello: c.livello, sottoclasse: c.sottoclasse || "" }));

  // Risorse di classe da TUTTE le classi ai rispettivi livelli (deduplicate per id, max
  // più alto). Le nuove partono da 0 spesi; le altre conservano gli usi (li azzera un riposo).
  const risorse = risorseBreakdown(breakdown, classi, scores);
  if (risorse.length) {
    u.risorse_pg = risorse;
    for (const r of risorse) if (fm["usi_" + r.id] == null) u["usi_" + r.id] = 0;
    note.push("risorse aggiornate");
  }

  await app.fileManager.processFrontMatter(file, f => { for (const [k, v] of Object.entries(u)) f[k] = v; });
  new Notice(`Salito! ${classe.label} ${lvCls} · personaggio ${nuovoTot}. ${note.join(" · ")}`);
  return "";
}

module.exports = sali_pg;
// Esposti per i test della multiclasse (funzioni pure).
module.exports.prereqOk = prereqOk;
module.exports.multiclassGate = multiclassGate;
module.exports.combinedCasterLevel = combinedCasterLevel;
module.exports.casterClasses = casterClasses;
module.exports.leveledSlots = leveledSlots;
module.exports.pactSlots = pactSlots;
module.exports.risorseBreakdown = risorseBreakdown;
// Esposti per i test del ponte homebrew→motore.
module.exports.incantesimiHomebrew = incantesimiHomebrew;
module.exports.talentiHomebrew = talentiHomebrew;
module.exports.talentoAmmesso = talentoAmmesso;
module.exports.sottoclasseHomebrew = sottoclasseHomebrew;
module.exports.fondiPool = fondiPool;
module.exports.classeHomebrew = classeHomebrew;
