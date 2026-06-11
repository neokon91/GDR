// Generatore homebrew di nomi/spunti — italiano e legato all'ontologia.
// Autonomo (niente require): legge core.json (sezione 'generatori') a runtime.
// La LOGICA è pura e testabile (rng iniettabile, default Math.random); il wrapper
// tp.user.genera(tp) risolve lo stile dai link della nota, genera N opzioni e le
// offre in un suggester (inserisce al cursore o copia). Lo schema dati è in
// Dev/Source/YAML/generatori.yaml. Il `tesoro` SRD legge tesoro._srd (iniettato
// da render.py: srd_loot_pool). Vedi docs/play_layer.md § Generazione nomi/spunti.

function pick(arr, rng) {
  const list = Array.isArray(arr) && arr.length ? arr : [""];
  return list[Math.floor((rng ? rng() : Math.random()) * list.length)];
}

// Scelta pesata: items[i] esce con probabilità pesi[i]/somma. Se i pesi mancano
// o non combaciano, ripiega su pick() uniforme.
function pickWeighted(items, pesi, rng) {
  const list = Array.isArray(items) && items.length ? items : [""];
  if (!Array.isArray(pesi) || pesi.length !== list.length) return pick(list, rng);
  const tot = pesi.reduce((a, b) => a + (Number(b) || 0), 0);
  if (tot <= 0) return pick(list, rng);
  let r = (rng ? rng() : Math.random()) * tot;
  for (let i = 0; i < list.length; i++) { r -= Number(pesi[i]) || 0; if (r < 0) return list[i]; }
  return list[list.length - 1];
}

function cap(s) {
  s = String(s || "");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function stiliIds(gen) {
  return Object.keys((gen && gen.stili) || {});
}

function stileLabel(gen, id) {
  return ((gen.stili || {})[id] || {}).label || id;
}

// Un nome di persona: inizio (maiuscolo) + centro + fine (M o F a caso).
function nomePersona(gen, stileId, rng) {
  const stile = (gen.stili || {})[stileId] || (gen.stili || {})[stiliIds(gen)[0]] || {};
  const p = stile.persona || {};
  const fini = (rng ? rng() : Math.random()) < 0.5 ? p.fini_m : p.fini_f;
  return cap(pick(p.inizi, rng)) + pick(p.centri, rng) + pick(fini && fini.length ? fini : p.fini_m, rng);
}

// Nome di persona completo: a volte con cognome/epiteto dello stile.
function generaPersona(gen, stileId, rng) {
  const stile = (gen.stili || {})[stileId] || {};
  const nome = nomePersona(gen, stileId, rng);
  if (stile.cognomi && stile.cognomi.length && (rng ? rng() : Math.random()) < 0.55) {
    return `${nome} ${pick(stile.cognomi, rng)}`;
  }
  return nome;
}

// Toponimo: radice dalle sillabe dello stile + suffisso globale, a volte prefisso.
function generaToponimo(gen, stileId, rng) {
  const stile = (gen.stili || {})[stileId] || {};
  const p = stile.persona || {};
  const top = gen.toponimi || {};
  const radice = cap(pick(p.inizi, rng)) + pick(top.suffissi, rng);
  if ((rng ? rng() : Math.random()) < 0.45) return `${pick(top.prefissi, rng)} ${radice}`;
  return radice;
}

// Fazione: risolve una forma templatizzata (placeholder {…}) ricorsivamente.
// {nome}/{luogo} = generatori terminali; gli altri pescano da fazioni.*.
function generaFazione(gen, stileId, rng) {
  const f = gen.fazioni || {};
  const resolve = (str, depth) => String(str).replace(/\{(\w+)\}/g, (_, key) => {
    if (depth > 4) return "";
    if (key === "nome") return nomePersona(gen, stileId, rng);
    if (key === "luogo") return generaToponimo(gen, stileId, rng);
    const list = f[key];
    return list ? resolve(pick(list, rng), depth + 1) : "";
  });
  return resolve(pick(f.forme, rng), 0).replace(/\s+/g, " ").trim();
}

// Generatore generico "da forme": risolve una forma templatizzata della sezione
// gen[sectionKey] ({chiave} -> pesca da section[chiave], ricorsivo). {nome} = nome di
// persona dello stile, {luogo} = toponimo: così PNG/taverne/ganci riusano i nomi a
// tema. Stessa meccanica di generaFazione, parametrica sulla sezione (estendibile:
// aggiungi una sezione con `forme` in generatori.yaml e una voce nel registro).
function generaDaForme(gen, sectionKey, stileId, rng) {
  const section = gen[sectionKey] || {};
  const resolve = (str, depth) => String(str).replace(/\{(\w+)\}/g, (_, key) => {
    if (depth > 5) return "";
    if (key === "nome") return nomePersona(gen, stileId, rng);
    if (key === "luogo") return generaToponimo(gen, stileId, rng);
    const list = section[key];
    return list ? resolve(pick(list, rng), depth + 1) : "";
  });
  return resolve(pick(section.forme, rng), 0).replace(/\s+/g, " ").trim();
}

// Tesoro legato all'SRD: monete a fascia + un oggetto/equip REALE dell'SRD 5.2.1,
// scelto per rarità. NON usa generaDaForme: i nomi-oggetto non stanno in YAML ma
// in gen.tesoro._srd (per fascia), iniettato da render.py dai JSON SRD. La fascia
// si pesca pesata (i tesori comuni capitano più spesso); l'oggetto magico riporta
// la rarità in coda, quello mondano resta nudo. {luogo}/{nome} non servono qui.
function generaTesoro(gen, stileId, rng) {
  const t = (gen && gen.tesoro) || {};
  const fasce = Array.isArray(t.fasce) ? t.fasce : [];
  if (!fasce.length) return "";
  const srd = t._srd || {};
  const fascia = pickWeighted(fasce, t.pesi, rng);
  const pool = Array.isArray(srd[fascia]) ? srd[fascia] : [];
  let oggetto = pool.length ? pick(pool, rng) : "cianfrusaglie senza valore";
  if (fascia !== (t.fascia_mondana || "mondano")) oggetto = `${oggetto} (rarità ${fascia})`;
  const importi = (t.importi || {})[fascia] || [10];
  const n = pick(importi, rng);
  const monete = String(pick((t.monete || {})[fascia] || ["{n} monete"], rng)).replace("{n}", n);
  const conn = pick(t.connettori && t.connettori.length ? t.connettori : ["{monete}; e {oggetto}"], rng);
  return conn.replace("{monete}", monete).replace("{oggetto}", oggetto).replace(/\s+/g, " ").trim();
}

// Incontro casuale legato all'SRD: pesca una BANDA di GS, una creatura REALE da
// gen.incontro._srd[banda] (iniettata da render.py), poi riempie una forma con numero/
// attività/atteggiamento/twist. NON usa generaDaForme: {creatura} viene dall'SRD, non da YAML.
function generaIncontro(gen, stileId, rng) {
  const sec = (gen && gen.incontro) || {};
  const fasce = Array.isArray(sec.fasce) ? sec.fasce : [];
  if (!fasce.length || !Array.isArray(sec.forme) || !sec.forme.length) return "";
  const srd = sec._srd || {};
  let banda = pickWeighted(fasce, sec.pesi, rng);
  let pool = Array.isArray(srd[banda]) ? srd[banda] : [];
  if (!pool.length) { banda = fasce.find((f) => (srd[f] || []).length) || banda; pool = srd[banda] || []; }
  const creatura = pool.length ? pick(pool, rng) : "creature ignote";
  const resolve = (str, depth) => String(str).replace(/\{(\w+)\}/g, (_, key) => {
    if (depth > 5) return "";
    if (key === "creatura") return creatura;
    const list = sec[key];
    return list ? resolve(pick(list, rng), depth + 1) : "";
  });
  return resolve(pick(sec.forme, rng), 0).replace(/\s+/g, " ").trim();
}

const GENERATORI = {
  persona: { fn: generaPersona, label: "Nome di persona" },
  toponimo: { fn: generaToponimo, label: "Toponimo / luogo" },
  fazione: { fn: generaFazione, label: "Nome di fazione" },
  png: { fn: (g, s, r) => generaDaForme(g, "png", s, r), label: "PNG (schizzo)" },
  taverna: { fn: (g, s, r) => generaDaForme(g, "taverna", s, r), label: "Taverna / locanda" },
  gancio: { fn: (g, s, r) => generaDaForme(g, "gancio", s, r), label: "Gancio di trama" },
  diceria: { fn: (g, s, r) => generaDaForme(g, "diceria", s, r), label: "Diceria / voce" },
  bottino: { fn: (g, s, r) => generaDaForme(g, "bottino", s, r), label: "Bottino / tesoro" },
  insediamento: { fn: (g, s, r) => generaDaForme(g, "insediamento", s, r), label: "Insediamento" },
  oggetto: { fn: (g, s, r) => generaDaForme(g, "oggetto", s, r), label: "Oggetto / curiosità" },
  meteo: { fn: (g, s, r) => generaDaForme(g, "meteo", s, r), label: "Meteo / presagio" },
  dungeon_stanza: { fn: (g, s, r) => generaDaForme(g, "dungeon_stanza", s, r), label: "Stanza di dungeon" },
  bevanda: { fn: (g, s, r) => generaDaForme(g, "bevanda", s, r), label: "Bevanda" },
  trappola: { fn: (g, s, r) => generaDaForme(g, "trappola", s, r), label: "Trappola / insidia" },
  evento_viaggio: { fn: (g, s, r) => generaDaForme(g, "evento_viaggio", s, r), label: "Evento di viaggio" },
  tesoro: { fn: generaTesoro, label: "Tesoro (SRD)" },
  incontro: { fn: generaIncontro, label: "Incontro casuale (SRD)" },
};

// N opzioni distinte (per quanto possibile) di un tipo, dato lo stile.
function generaLista(gen, tipo, stileId, n, rng) {
  const spec = GENERATORI[tipo] || GENERATORI.persona;
  const out = [];
  const seen = new Set();
  for (let i = 0; i < n * 4 && out.length < n; i++) {
    const v = spec.fn(gen, stileId, rng);
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

// --- Wrapper Templater (runtime Obsidian) -----------------------------------
async function loadGen() {
  try {
    const core = JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json"));
    return core.generatori || {};
  } catch (e) {
    return {};
  }
}

// basename di un link [[Nota]] -> TFile risolto (per leggere il suo frontmatter).
function linkDest(link, sourcePath) {
  const raw = String(link ?? "").trim();
  const m = raw.match(/\[\[([^\]]+)\]\]/);
  const inner = (m ? m[1] : raw).split("|")[0].split("#")[0].trim();
  return app.metadataCache?.getFirstLinkpathDest?.(inner, sourcePath || "") || null;
}

function fmOf(file) {
  return (file && app.metadataCache.getFileCache(file)?.frontmatter) || {};
}

// Stili candidati (ordine di preferenza) dai link della nota: lo stile_nomi
// proprio (cultura/specie), poi quello delle entità collegate, con un salto
// luogo -> sua cultura. Best-effort: se non risolve nulla, lista vuota.
function candidatiStile(gen, file) {
  const fm = fmOf(file);
  const cand = [];
  const push = (s) => { if (s && gen.stili && gen.stili[s] && !cand.includes(s)) cand.push(s); };
  push(fm.stile_nomi);
  const keys = ["cultura", "culture", "specie", "lingua", "regioni", "luogo", "fazione"];
  for (const k of keys) {
    const v = fm[k];
    for (const link of Array.isArray(v) ? v : (v ? [v] : [])) {
      const dest = linkDest(link, file && file.path);
      if (!dest) continue;
      const dfm = fmOf(dest);
      push(dfm.stile_nomi);
      if (dfm.categoria === "luogo") {
        for (const c of Array.isArray(dfm.cultura) ? dfm.cultura : (dfm.cultura ? [dfm.cultura] : [])) {
          push(fmOf(linkDest(c, dest.path)).stile_nomi);
        }
      }
    }
  }
  return cand;
}

async function genera(tp) {
  const gen = await loadGen();
  if (!stiliIds(gen).length) { new Notice("Nessuno stile in generatori.yaml."); return ""; }
  const file = app.workspace.getActiveFile?.() ?? tp.config?.target_file;
  const cat = fmOf(file).categoria;

  // Tipo: si sceglie sempre (così sono raggiungibili TUTTI i generatori, non solo i
  // nomi), col tipo suggerito dalla categoria in cima (★) — un tap per il caso comune.
  const suggerito = cat === "luogo" ? "toponimo" : cat === "fazione" ? "fazione"
    : cat === "personaggio" ? "persona" : null;
  const tipi = Object.keys(GENERATORI);
  const ord = suggerito ? [suggerito, ...tipi.filter((t) => t !== suggerito)] : tipi;
  const tipo = await tp.system.suggester(
    ord.map((t) => (t === suggerito ? "★ " : "") + GENERATORI[t].label), ord, false, "Cosa generare?");
  if (!tipo) return "";

  // Stile: candidati dall'ontologia in cima, poi tutti gli altri.
  const cand = candidatiStile(gen, file);
  const ordered = [...cand, ...stiliIds(gen).filter((s) => !cand.includes(s))];
  const labels = ordered.map((s) => (cand.includes(s) ? "★ " : "") + stileLabel(gen, s));
  const stile = await tp.system.suggester(labels, ordered, false, "Stile dei nomi");
  if (!stile) return "";

  // Genera e fai scegliere.
  const opzioni = generaLista(gen, tipo, stile, 8, null);
  if (!opzioni.length) { new Notice("Nessun risultato generato."); return ""; }
  const scelto = await tp.system.suggester([...opzioni, "↻ Rigenera"], [...opzioni, "__rigenera__"], false, `${GENERATORI[tipo].label} — scegli`);
  if (!scelto) return "";
  if (scelto === "__rigenera__") return await genera(tp);

  // Inserisci al cursore se possibile, altrimenti copia negli appunti.
  const editor = app.workspace.activeEditor?.editor;
  if (editor) {
    editor.replaceSelection(scelto);
    new Notice(`Inserito: ${scelto}`);
  } else {
    try { await navigator.clipboard.writeText(scelto); new Notice(`Copiato: ${scelto}`); }
    catch (e) { new Notice(scelto); }
  }
  return "";
}

// Esposte per i test node (logica pura, rng iniettabile).
genera.generaPersona = generaPersona;
genera.generaToponimo = generaToponimo;
genera.generaFazione = generaFazione;
genera.generaLista = generaLista;
genera.generaDaForme = generaDaForme;
genera.generaIncontro = generaIncontro;
genera.generaTesoro = generaTesoro;
module.exports = genera;
