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

// --- Incantesimi del PG (gestione inline, scala 1-20) ------------------------
// Raggruppa i trucchetti (liv 0) + gli incantesimi noti/preparati del PG per
// LIVELLO, leggendo il livello di ciascuno dal pool della classe (personaggio.json:
// classi[c].incantesimi_pool = {livello:[nomi]}, stessi nomi delle note SRD →
// `[[..]]` risolve). Ogni intestazione di livello mostra gli slot residui
// (slot_N − slot_uso_N). Sostituisce il vecchio callout inchiodato al "1º livello":
// per un caster di livello alto vedi l'intero spellbook, non solo il 1º. Non
// incantatore / nessun incantesimo → "" (niente callout). Pure-ish (usa loadPersonaggio).
async function renderIncantesimi(app, dv, page) {
  if (!page) return "*Apri una scheda PG.*";
  const trucchetti = asArray(page.trucchetti), incantesimi = asArray(page.incantesimi);
  const data = await loadPersonaggio(app);
  const classiOpt = data.classi || {};
  // Classi del PG (breakdown multiclasse, o la classe piatta). Le incantatrici (incluso
  // il Patto del Warlock) forniscono i pool e le CD; con più caster i pool si UNISCONO.
  const bd = Array.isArray(page.classi) && page.classi.length
    ? page.classi.map((c) => text(c.id))
    : [text(page.classe)];
  const casterClasses = bd.map((id) => classiOpt[id]).filter((cl) => cl && (cl.incantatore || cl.tipo_incantatore === "patto"));
  if (!casterClasses.length && !trucchetti.length && !incantesimi.length) return "";  // non caster
  // nome → livello, unendo i pool di TUTTE le classi incantatrici (SRD).
  const levelOf = new Map();
  for (const cl of casterClasses)
    for (const [L, names] of Object.entries(cl.incantesimi_pool || {}))
      for (const n of names || []) if (!levelOf.has(n)) levelOf.set(n, Number(L));
  // Homebrew: il livello dalla nota stessa (categoria incantesimo) se non nel pool
  // della classe — così gli incantesimi homebrew si raggruppano bene, non sotto "ignoto".
  // Stessa passata raccoglie chi richiede CONCENTRAZIONE (durata SRD) → 🌀.
  const concentra = new Set();
  const rituali = new Set();
  if (dv) {
    try {
      const cat = (p) => p && p.file && (text(p.categoria) === "incantesimo" || text(p.categoria) === "srd-incantesimo");
      for (const sp of dv.pages().where(cat).array()) {
        const L = Number(sp.livello);
        if (!levelOf.has(sp.file.name) && Number.isFinite(L)) levelOf.set(sp.file.name, L);
        if (sp.durata && /concentr/i.test(text(sp.durata))) concentra.add(sp.file.name);
        if (sp.rituale && /^s[iì]?$|^v?ero$|true/i.test(text(sp.rituale))) rituali.add(sp.file.name);
      }
    } catch (e) { /* dv assente o query fallita: niente livelli/🌀/📿 homebrew */ }
  }
  const groups = new Map();  // livello → [nomi]
  const push = (L, n) => { if (!groups.has(L)) groups.set(L, []); groups.get(L).push(n); };
  for (const t of trucchetti) push(0, text(t));
  for (const s of incantesimi) { const n = text(s); push(levelOf.has(n) ? levelOf.get(n) : -1, n); }
  if (!groups.size) return "";
  const slotInfo = (L) => {
    const max = Number(page["slot_" + L]);
    if (!Number.isFinite(max) || max <= 0) return "";
    const used = Number(page["slot_uso_" + L]) || 0;
    return ` · slot ${Math.max(0, max - used)}/${max}`;
  };
  const out = [];
  for (const L of [...groups.keys()].sort((a, b) => a - b)) {
    const titolo = L === 0 ? "Trucchetti" : L === -1 ? "Livello ignoto" : `${L}º livello`;
    const names = groups.get(L).slice().sort((a, b) => a.localeCompare(b)).map((n) => `${concentra.has(n) ? "🌀 " : ""}${rituali.has(n) ? "📿 " : ""}[[${n}]]`);
    out.push(`> **${titolo}**${L > 0 ? slotInfo(L) : ""} (${names.length})\n> ${names.join(" · ")}`);
  }
  // Testata: CD incantesimo (8 + competenza + mod) e bonus d'attacco (competenza +
  // mod). La caratteristica da incantatore = la prima MENTALE fra le primarie della
  // classe (Mago→INT, Chierico→SAG, Paladino [FOR,CAR]→CAR, Ranger [DES,SAG]→SAG…),
  // così SRD e homebrew funzionano senza un campo dedicato. Il mod si calcola dal
  // punteggio nel frontmatter → corretto a ogni ri-render (non serve mod_<car>).
  const MENTALE = ["intelligenza", "saggezza", "carisma"];
  const pb = Number(page.competenza) || 0;
  const teste = [];
  for (const id of bd) {
    const cl = classiOpt[id];
    if (!cl || !(cl.incantatore || cl.tipo_incantatore === "patto")) continue;
    const carInc = cl.caratteristica_incantesimi || asArray(cl.caratteristica_primaria).map(text).find((c) => MENTALE.includes(c));
    if (!carInc || page[carInc] == null) continue;
    const m = Math.floor((Number(page[carInc]) - 10) / 2);
    const cd = 8 + pb + m, atk = pb + m;
    const lab = carInc.charAt(0).toUpperCase() + carInc.slice(1);
    const pre = casterClasses.length > 1 ? `${cl.label}: ` : "";
    teste.push(`${pre}**CD ${cd}** · **Attacco ${atk >= 0 ? "+" : ""}${atk}** · ${lab}`);
  }
  let testa = teste.length ? "> " + teste.join("\n> ") + "\n>\n" : "";
  // Patto del Warlock: slot SEPARATI dagli slot a livello (riga dedicata, ricarica breve).
  if (Number(page.slot_patto) > 0) {
    const rem = Math.max(0, Number(page.slot_patto) - (Number(page.slot_patto_uso) || 0));
    testa += `> 🩸 **Patto** — ${rem}/${Number(page.slot_patto)} slot di ${page.slot_patto_liv}º livello (ricarica a riposo breve)\n>\n`;
  }
  const leg = [];
  if (concentra.size) leg.push("🌀 = concentrazione");
  if (rituali.size) leg.push("📿 = rituale");
  const legenda = leg.length ? "\n>\n> " + leg.join(" · ") : "";
  return "> [!note]- 🪄 Incantesimi\n" + testa + out.join("\n>\n") + legenda;
}

// --- Coerenza GS (DM): "i numeri combaciano col GS dichiarato?" ----------------
// Inverte gs_baseline (mediane SRD) per stimare il GS DIFENSIVO (da AC+PF) e
// OFFENSIVO (da bonus d'attacco + danno per colpo) di una creatura e confrontarli
// col GS dichiarato. Sorgente = mediane SRD (core.gs_baseline), NON le tabelle DMG
// (niente vincolo di licenza). Pensato per gli statblock RIFINITI A MANO: lo scaffold
// è corretto per costruzione, ma una creatura editata può uscire dal GS senza che
// te ne accorga (es. un "GS 5" con 30 PF). Best-effort: i PF/AC si leggono sempre, il
// lato offensivo dipende dal formato delle azioni (n/d se non parsabile).
function _gsToNum(k) {
  if (typeof k === "string" && k.includes("/")) { const [a, b] = k.split("/").map(Number); return b ? a / b : NaN; }
  return Number(k);
}
function _relDist(a, b) { return Math.abs((Number(a) - Number(b)) / Math.max(1, Math.abs(Number(b)))); }
function nearestGs(table, score) {
  let best = null, bestD = Infinity;
  for (const k of Object.keys(table || {})) {
    const d = score(table[k]);
    if (Number.isFinite(d) && d < bestD) { bestD = d; best = k; }
  }
  return best;
}
function nearestGsByNum(table, target) {
  const keys = Object.keys(table || {}).filter((k) => Number.isFinite(_gsToNum(k)));
  if (!keys.length) return null;
  return keys.reduce((best, k) => Math.abs(_gsToNum(k) - target) < Math.abs(_gsToNum(best) - target) ? k : best);
}
function gsDifensivo(table, ac, hp) {
  if (hp == null) return null;
  return nearestGs(table, (r) => (r.hp == null ? Infinity : _relDist(hp, r.hp)) + (r.ac == null || ac == null ? 0 : 0.5 * _relDist(ac, r.ac)));
}
function gsOffensivo(table, atk, danno) {
  if (danno == null) return null;
  return nearestGs(table, (r) => (r.danno == null ? Infinity : _relDist(danno, r.danno)) + (r.attacco == null || atk == null ? 0 : 0.5 * _relDist(atk, r.attacco)));
}
function verificaGS(table, stats, dichiarato) {
  const difensivo = gsDifensivo(table, stats.ac, stats.hp);
  const offensivo = gsOffensivo(table, stats.atk, stats.danno);
  const nums = [difensivo, offensivo].filter((x) => x != null).map(_gsToNum).filter(Number.isFinite);
  const atteso = nums.length ? nearestGsByNum(table, nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  return { difensivo, offensivo, atteso, dichiarato: dichiarato == null ? null : String(dichiarato) };
}

// Estrae dal corpo nota i numeri del primo blocco ```statblock: AC, PF e (best-effort
// dal formato delle azioni) il miglior bonus d'attacco e il danno per colpo.
function parseStatblockStats(testo) {
  const block = (String(testo || "").match(/```statblock[\s\S]*?```/) || [])[0] || "";
  if (!block) return null;
  const one = (re) => { const m = block.match(re); return m ? Number(m[1]) : null; };
  let atk = null, danno = null, m;
  const atkRe = /per colpire:\*?\s*([+-]?\d+)/g;
  while ((m = atkRe.exec(block))) { const v = Number(m[1]); if (atk == null || v > atk) atk = v; }
  const dmgRe = /Colpito:\*?\s*(\d+)/g;
  while ((m = dmgRe.exec(block))) { const v = Number(m[1]); if (danno == null || v > danno) danno = v; }
  return { ac: one(/^\s*ac:\s*"?(\d+)/m), hp: one(/^\s*hp:\s*"?(\d+)/m), atk, danno };
}

async function renderVerificaGS(app, page) {
  if (!page || text(page.categoria) !== "creatura") return "";
  const gs = page.gs != null ? String(page.gs).trim() : "";
  if (!gs) return "";
  const core = await loadCoreData(app);
  const table = core.gs_baseline || {};
  if (!Object.keys(table).length) return "";
  const f = app.workspace && app.workspace.getActiveFile && app.workspace.getActiveFile();
  if (!f) return "";
  let body = "";
  try { body = await app.vault.read(f); } catch (e) { return ""; }
  const st = parseStatblockStats(body);
  if (!st || st.hp == null) return "";
  const v = verificaGS(table, st, gs);
  const vicino = (a) => a != null && Math.abs(_gsToNum(a) - _gsToNum(gs)) <= Math.max(1, _gsToNum(gs) * 0.34);
  const icona = (a) => a == null ? "·" : (vicino(a) ? "✅" : "⚠️");
  const righe = [
    `> - Difensivo (AC ${st.ac != null ? st.ac : "?"} · PF ${st.hp}) ≈ **GS ${v.difensivo}** ${icona(v.difensivo)}`,
    v.offensivo != null
      ? `> - Offensivo (att ${st.atk >= 0 ? "+" : ""}${st.atk} · danno ${st.danno}/colpo) ≈ **GS ${v.offensivo}** ${icona(v.offensivo)}`
      : "> - Offensivo: n/d (rifinisci le azioni col formato dello scaffold)",
    `> - **Atteso ≈ GS ${v.atteso}** · dichiarato **GS ${gs}**`,
  ];
  const allarme = (v.difensivo != null && !vicino(v.difensivo)) || (v.offensivo != null && !vicino(v.offensivo));
  return `> [!${allarme ? "warning" : "tip"}]- 📐 Coerenza GS${allarme ? " — controlla i numeri" : ""}\n`
    + righe.join("\n")
    + "\n>\n> Stime dalle mediane SRD di pari GS (non tabelle DMG). Difensivo = AC+PF; offensivo = attacco + danno per colpo.";
}

