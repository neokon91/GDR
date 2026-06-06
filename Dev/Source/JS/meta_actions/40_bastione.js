function appendTurnoLog(content, data, riepilogo) {
  const voce = `- **${data}** — ${String(riepilogo || "").trim() || "(turno senza note)"}`;
  const re = /(^|\n)(##+\s*Registro dei turni\s*\n)/;
  const m = content.match(re);
  if (m) {
    const at = m.index + m[0].length;
    return content.slice(0, at) + voce + "\n" + content.slice(at);
  }
  const sep = content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}\n## Registro dei turni\n${voce}\n`;
}

// Tira inline i dadi dentro un testo-esito: sostituisce il PRIMO gettone NdM
// (con ×K/*K e ±B opzionali) col risultato, lasciando il resto come etichetta.
// "1d6 lingotti" → "4 lingotti"; "1d4×10 mo" → "30 mo"; "2d6+1 difensori" → "9 difensori".
// rng()∈[0,1) iniettabile (test deterministici). Niente dado → testo invariato.
function rollInline(text, rng) {
  const r = rng || Math.random;
  const re = /(\d*)d(\d+)(?:\s*[×x*]\s*(\d+))?(?:\s*([+-])\s*(\d+))?/i;
  return String(text ?? "").replace(re, (_m, count, faces, mult, sign, mod) => {
    const n = Math.max(1, parseInt(count || "1", 10));
    const f = parseInt(faces, 10);
    let tot = 0;
    for (let i = 0; i < n; i++) tot += Math.floor(r() * f) + 1;
    if (mult) tot *= parseInt(mult, 10);
    if (sign) tot += (sign === "-" ? -1 : 1) * parseInt(mod, 10);
    return String(tot);
  });
}

// Una riga-ordine "Struttura | Ordine | esito" → {struttura, ordine, esito}.
function parseOrdine(line) {
  const parts = String(line ?? "").split("|").map((p) => p.trim());
  return { struttura: parts[0] || "", ordine: parts[1] || "", esito: parts.slice(2).join(" | ") || "" };
}

// Normalizza il campo `ordini` (lista YAML o stringa multilinea) in righe non vuote.
function ordiniLines(ordini) {
  const arr = Array.isArray(ordini) ? ordini : String(ordini ?? "").split(/\r?\n/);
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean);
}

// Risolve un turno di bastione dalle strutture dichiarate: per ciascuna, tira i
// dadi dell'esito. Ritorna [{struttura, ordine, esito}]. License-safe: gli ordini
// e gli esiti sono AUTORIALI (nessuna tabella DMG riprodotta) — l'azione tira e logga.
function resolveTurno(ordini, rng) {
  return ordiniLines(ordini).map((line) => {
    const o = parseOrdine(line);
    return { ...o, esito: rollInline(o.esito, rng) };
  });
}

// Una voce-esito risolta → riga di log markdown ("    - **Struttura** → *Ordine*: esito").
function rigaTurno(o) {
  let s = `    - **${o.struttura || "Struttura"}**`;
  if (o.ordine) s += ` → *${o.ordine}*`;
  if (o.esito) s += `: ${o.esito}`;
  return s;
}

// Turno di bastione (2024): se la scheda dichiara le `ordini` (lista "Struttura |
// Ordine | esito", esito con dadi opzionali), RISOLVE il turno (tira i dadi, conta
// il turno, scrive un blocco datato nel Registro dei turni e aggiorna `turni`).
// Senza strutture dichiarate, ricade nel prompt libero (compat). I dadi sono tirati,
// non simulati: il GM autora ordini/esiti, l'azione fa i conti.
async function turno_bastione(tp, file) {
  const data = tp.date ? tp.date.now("YYYY-MM-DD") : "";
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const righe = ordiniLines(fm.ordini);
  let riepilogo;
  if (righe.length) {
    const turno = (Number(fm.turni) || 0) + 1;
    const esiti = resolveTurno(fm.ordini, Math.random);
    riepilogo = `**Turno ${turno}**\n` + esiti.map(rigaTurno).join("\n");
    await updateFrontmatter(file, (f) => { f.turni = turno; f.ultimo_turno = data; });
  } else {
    riepilogo = await tp.system.prompt(
      "Nessuna struttura in `ordini`. Turno di bastione: cosa hanno prodotto le strutture?", "");
    if (riepilogo == null) return "";
  }
  const content = await app.vault.read(file);
  await app.vault.modify(file, appendTurnoLog(content, data, riepilogo));
  new Notice(righe.length
    ? `Turno di bastione risolto: ${righe.length} strutture (${data}).`
    : `Turno di bastione registrato (${data}).`);
  return "";
}

