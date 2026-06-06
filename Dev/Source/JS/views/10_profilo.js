// --- Profilo: tag coerenti derivati dalle combinazioni di valori-assi ---------
// Un archetipo combacia se TUTTE le sue condizioni `quando` (per-asse) sono vere.
// Comparatori: ">=N" "<=N" ">N" "<N" "==N"/"N" (uguaglianza) "N-M" (intervallo).
// Copia della sorgente canonica _comparators.js: check() ne impone l'uguaglianza
// (anti-drift). Modifica _comparators.js e risincronizza qui (stesso testo).
// >>>matchesCond
function matchesCond(value, cond) {
  const v = Number(value);
  if (!Number.isFinite(v)) return false;
  const c = String(cond).trim();
  let m;
  if ((m = c.match(/^(>=|<=|>|<|==|=)\s*(\d+)$/))) {
    const n = Number(m[2]);
    return m[1] === ">=" ? v >= n : m[1] === "<=" ? v <= n
         : m[1] === ">" ? v > n : m[1] === "<" ? v < n : v === n;
  }
  if ((m = c.match(/^(\d+)\s*-\s*(\d+)$/))) return v >= Number(m[1]) && v <= Number(m[2]);
  if (/^\d+$/.test(c)) return v === Number(c);
  return false;
}
// <<<matchesCond

function archetipiMatch(archetipi, page) {
  return (archetipi || []).filter((a) =>
    Object.entries(a.quando || {}).every(([axis, cond]) => matchesCond(page[axis], cond)));
}

// Tag derivati (namespaced 'profilo/<tag>') dagli archetipi che combaciano.
function profiloTags(matches) {
  const tags = matches.flatMap((a) => (a.tag || []).map((t) => `profilo/${t}`));
  return [...new Set(tags)];
}

// Pannello "Profilo" (markdown): archetipi che combaciano coi valori-assi correnti
// + i tag coerenti. Si ri-deriva live al variare degli slider. Il bottone
// 'Applica profilo' (meta_actions) li scrive in frontmatter senza residui.
async function renderProfilo(app, page) {
  if (!page) return "*Apri la nota per il profilo.*";
  const core = await loadCoreData(app);
  const archetipi = (core.archetipi || {})[page.categoria] || [];
  if (!archetipi.length) return "*Nessun archetipo definito per questa categoria.*";
  const matches = archetipiMatch(archetipi, page);
  if (!matches.length) {
    return "> [!abstract] Profilo\n> Nessun archetipo combacia con i valori attuali — regola gli assi o lascia un profilo libero.";
  }
  const nomi = matches.map((a) => `**${a.nome}**`).join(" · ");
  const tags = profiloTags(matches).map((t) => `#${t}`).join(" ");
  return `> [!abstract] Profilo (derivato dagli assi)\n> ${nomi}\n>\n> ${tags}`;
}

// --- Coerenza tematica: tensioni fra entità collegate sugli assi condivisi -----
// Confronta i valori-assi di due entità sugli assi con lo STESSO id presenti in
// entrambe (stesso tipo → tutti; cross-tipo → quelli che coincidono, es. culto e
// fazione condividono struttura/legalità). Ritorna, per asse condiviso con valore
// numerico in entrambe, distanza ed etichette (dalle valori dell'asse sorgente).
function confrontoAssi(page, target, axesPage, axesTarget) {
  const idsTarget = new Set((axesTarget || []).map((a) => a.id));
  const out = [];
  for (const a of axesPage || []) {
    if (!idsTarget.has(a.id)) continue;
    const va = Number(page[a.id]); const vb = Number(target[a.id]);
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    out.push({
      id: a.id, nome: a.nome, dist: Math.abs(va - vb),
      etA: ((a.valori || {})[va] || {}).etichetta || String(va),
      etB: ((a.valori || {})[vb] || {}).etichetta || String(vb),
    });
  }
  return out;
}

// Note di coerenza (PROMPT, non errori) da un confronto e dal tipo di relazione:
// - contrasto forte: un asse condiviso a distanza ≥3 = opposizione netta (top 2);
// - specchio: un `rivali` dal profilo quasi identico (tutti gli assi ≤1). Esposto.
function coerenzaNote(rel, target, cmp) {
  if (!cmp.length) return [];
  const note = [];
  const forti = cmp.filter((c) => c.dist >= 3).sort((a, b) => b.dist - a.dist).slice(0, 2);
  for (const c of forti) {
    const frame = rel.field === "alleati" ? "alleati ma lontani" : "tensione";
    note.push(`🎭 ${noteLink(target)} — ${c.nome}: ${c.etA} ↔ ${c.etB} *(${frame})*`);
  }
  if (rel.field === "rivali" && cmp.every((c) => c.dist <= 1)) {
    note.push(`🪞 ${noteLink(target)} — rivale dal profilo quasi identico: l'attrito è di potere o territorio, non di natura?`);
  }
  return note;
}

// Pannello "Coerenza tematica": per i collegamenti tipizzati dell'entità, fa
// emergere le tensioni notevoli sugli assi condivisi (contrasti forti, rivali-
// specchio). Spunti narrativi, non lint rigido: le tensioni sono il sale del mondo.
async function renderCoerenza(app, dv, page) {
  if (!dv || !page || !page.categoria) return "";
  const core = await loadCoreData(app);
  const axesPage = axesFor(core, text(page.categoria));
  if (!axesPage.length) return "";
  const rels = (core.relazioni || {})[text(page.categoria)] || [];
  const note = [];
  const seen = new Set();
  for (const rel of rels) {
    for (const link of asArray(page[rel.field])) {
      const target = resolve(dv, link);
      if (!target || !target.file || seen.has(target.file.path)) continue;
      const cmp = confrontoAssi(page, target, axesPage, axesFor(core, text(target.categoria)));
      const n = coerenzaNote(rel, target, cmp);
      if (n.length) { seen.add(target.file.path); note.push(...n); }
    }
  }
  if (!note.length) {
    return "> [!check]- 🎭 Coerenza tematica\n> Nessuna tensione notevole coi collegamenti (profili compatibili o assi non condivisi).";
  }
  const MAX = 8;                                   // cap anti-rumore (SYS-3)
  const extra = note.length - MAX;
  const righe = note.slice(0, MAX).map((n) => "> - " + n);
  if (extra > 0) righe.push(`> - *…e altri ${extra} spunti dai collegamenti.*`);
  return "> [!check]- 🎭 Coerenza tematica (spunti, non errori)\n" + righe.join("\n");
}

