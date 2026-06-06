function parseVarianti(varianti, sourcePath) {
  const list = Array.isArray(varianti) ? varianti : (varianti ? [varianti] : []);
  const out = {};
  for (const raw of list) {
    const s = String(raw ?? "");
    const i = s.indexOf(":");
    if (i < 0) continue;
    const nome = linkName(s.slice(0, i), sourcePath);
    if (!nome) continue;
    const spec = {};
    for (const part of s.slice(i + 1).split(",")) {
      const m = part.trim().match(/^(pf|hp|ca|init|iniz(?:iativa)?)\s*[:=]?\s*(-?\d+)$/i);
      if (!m) continue;
      const k = m[1].toLowerCase();
      const v = Number(m[2]);
      if (k === "pf" || k === "hp") spec.hp = v;
      else if (k === "ca") spec.ca = v;
      else spec.init = v;
    }
    out[nome] = spec;
  }
  return out;
}

// Riga `creatures:` per una creatura. Con override hp emette la sintassi posizionale
// IT (count: name, hp[, ca[, init]]); ca/init solo se contigui a partire da hp (così
// indicare l'hp impedisce il tiro casuale → incontro ripetibile).
function rigaCreatura(nome, q, spec) {
  if (spec && Number.isFinite(spec.hp)) {
    const extra = [spec.hp];
    if (Number.isFinite(spec.ca)) {
      extra.push(spec.ca);
      if (Number.isFinite(spec.init)) extra.push(spec.init);
    }
    return `  - ${q}: ${nome}, ${extra.join(", ")}`;
  }
  return `  - ${q}: ${nome}`;
}

// Riscrive il blocco ```encounter``` della nota dalle creature collegate
// (frontmatter 'creature'): rigenera la lista `creatures:` (per nome × quantità,
// le occorrenze ripetute = più creature, coerente con la difficoltà), applica gli
// override `varianti` e allinea `name:` al titolo della nota; preserva `players:`.
async function aggiorna_encounter(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const creature = Array.isArray(fm.creature) ? fm.creature : (fm.creature ? [fm.creature] : []);
  const counts = {};
  for (const l of creature) {
    const nome = linkName(l, file.path);
    if (nome) counts[nome] = (counts[nome] || 0) + 1;
  }
  const varianti = parseVarianti(fm.varianti, file.path);
  const righe = Object.entries(counts).map(([n, q]) => rigaCreatura(n, q, varianti[n]));
  // Alleati (PNG/evocazioni schierati col gruppo): flag `, ally` → Initiative Tracker
  // li separa dai nemici nel conteggio difficoltà. Una riga per occorrenza.
  const alleati = Array.isArray(fm.alleati) ? fm.alleati : (fm.alleati ? [fm.alleati] : []);
  const righeAll = alleati.map(l => linkName(l, file.path)).filter(Boolean).map(n => `  - ${n}, ally`);

  const data = await app.vault.read(file);
  const re = /```encounter\r?\n[\s\S]*?\r?\n```/;
  const cur = data.match(re);
  if (!cur) { new Notice("Nessun blocco ```encounter``` in questa nota."); return ""; }
  const pm = cur[0].match(/^players\s*:\s*(.+)$/m);
  const players = pm ? pm[1].trim() : "true";
  const tutte = [...righe, ...righeAll];
  const lista = tutte.length ? tutte.join("\n") : "  # Collega le creature (tab Collegamenti) e ripremi.";
  const blocco = "```encounter\nname: " + file.basename + "\nplayers: " + players + "\ncreatures:\n" + lista + "\n```";
  await app.vault.modify(file, data.replace(re, blocco));
  new Notice(righe.length
    ? `Blocco encounter aggiornato: ${creature.length} creatura/e collegate.`
    : "Blocco encounter aggiornato (nessuna creatura collegata).");
  return "";
}

// Riposo lungo (PG): PF al massimo, PF temporanei e tiri salvezza contro morte
// azzerati, slot incantesimo recuperati (azzera gli slot_uso_* esistenti),
// concentrazione conclusa, metà dei Dadi Vita recuperati (2024: floor(max/2),
// min 1) e un livello di Esaurimento (Indebolimento) rimosso (−1, NON azzerato).
