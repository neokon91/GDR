// --- Ponte Initiative Tracker: schiera il gruppo (DM) ------------------------
// Un PG (nota personaggio, tipo pg) → oggetto-player Initiative Tracker: nome, PF
// (pf_max), CA (ca), modificatore d'iniziativa (mod DES da `destrezza`), livello.
// `je.from(t)` di IT accetta questi campi (player:true lo marca come giocatore).
// Esposto per i test.
function playerFromPg(file, fm) {
  const dex = Number(fm.destrezza);
  return {
    name: String(fm.nome || file.basename),
    player: true,
    hp: Number(fm.pf_max) || Number(fm.pf) || undefined,
    ac: Number(fm.ca) || undefined,
    modifier: Number.isFinite(dex) ? Math.floor((dex - 10) / 2) : 0,
    level: Number(fm.livello) || 1,
  };
}

// «Prepara il gruppo (IT)»: auto-inietta il PARTY di Initiative Tracker dai PG del
// vault (note personaggio · tipo pg), così il blocco `players: true` risolve senza
// configurazione manuale — chiude il residuo documentato del ponte IT. NON duplica
// IT (il tracker resta il motore del combattimento): aggiunge solo i PG mancanti al
// roster (`savePlayer`, non distruttivo) e li unisce al party di default. I mostri
// li risolve già il blocco encounter al «Avvia incontro». Best-effort + graceful se
// IT assente o l'API interna cambia.
async function inizia_incontro(tp) {
  const it = app.plugins?.plugins?.["initiative-tracker"];
  if (!it || !it.data) {
    new Notice("Initiative Tracker non è installato (o non attivo): installalo per schierare il gruppo.");
    return "";
  }
  const pgs = app.vault.getMarkdownFiles()
    .map((f) => ({ f, fm: app.metadataCache.getFileCache(f)?.frontmatter || {} }))
    .filter((e) => e.fm.categoria === "personaggio" && String(e.fm.tipo).toLowerCase() === "pg")
    .map((e) => playerFromPg(e.f, e.fm))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!pgs.length) {
    new Notice("Nessun PG nel vault (nota personaggio · tipo pg). Crea i PG col bottone «Crea PG».");
    return "";
  }
  // Roster IT: aggiungi solo i PG mancanti (non distruttivo: preserva i player utente).
  const existing = new Set((it.data.players || []).map((p) => p && p.name));
  for (const pg of pgs) {
    if (existing.has(pg.name)) continue;
    try { await it.savePlayer(pg); } catch (e) { /* best-effort */ }
  }
  // Party di default: crealo se assente e unisci i PG (non distruttivo).
  try {
    const pname = it.data.defaultParty || "Gruppo";
    if (!Array.isArray(it.data.parties)) it.data.parties = [];
    let party = it.data.parties.find((p) => p && p.name === pname);
    if (!party) { party = { name: pname, players: [] }; it.data.parties.push(party); }
    const names = new Set(party.players || []);
    for (const pg of pgs) names.add(pg.name);
    party.players = [...names];
    if (!it.data.defaultParty) it.data.defaultParty = pname;
    await (it.saveSettings ? it.saveSettings() : Promise.resolve());
  } catch (e) { /* best-effort */ }
  const nomi = pgs.map((p) => p.name);
  new Notice(`Gruppo IT pronto: ${pgs.length} PG nel party (${nomi.slice(0, 4).join(", ")}${nomi.length > 4 ? "…" : ""}). Ora «Avvia incontro» sul blocco include il gruppo.`);
  try { app.commands?.executeCommandById?.("initiative-tracker:open"); } catch (e) { /* opzionale */ }
  return "";
}

