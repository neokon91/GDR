// --- Tabella casuale: tira sulle voci d'utente (ispirazione Alkemion: Random Tables) -
// Numera le `voci` (campo testo, una per riga) e offre il tiro come roller `dice: 1dN`.
// Le voci possono essere PESATE («3× testo» → occupa 3 risultati): renderTabella ne
// calcola i range (es. «2–4»). Complementare a `genera` (generatori CURATI di nomi/
// spunti): qui le tavole le scrive il GM. Il tiro col bottone è in meta_actions.tira_tabella.

// Una voce: «3× testo» / «3x testo» / «3| testo» → peso 3; altrimenti peso 1. Tollera un
// prefisso di elenco («- », «1. ») incollato. Gemella di meta_actions.parseVoceTab.
function parseVoceTabella(riga) {
  const s = String(riga == null ? "" : riga).replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim();
  const m = s.match(/^(\d+)\s*[×x|]\s*(.+)$/i);
  return m && m[2].trim() ? { peso: Math.max(1, parseInt(m[1], 10)), testo: m[2].trim() } : { peso: 1, testo: s };
}

async function renderTabella(app, page) {
  if (!page || text(page.categoria) !== "tabella") return "";
  const voci = text(page.voci).split(/\r?\n/).map(parseVoceTabella).filter((v) => v.testo);
  if (voci.length < 2) {
    return "> [!info] Tabella da riempire\n> Scrivi almeno 2 **Voci** (una per riga) nel campo qui sopra. Una voce più probabile? Anteponi un peso: `3× testo`.";
  }
  const totPeso = voci.reduce((s, v) => s + v.peso, 0);
  // Dado: quello dichiarato se ≥ somma pesi (lascia i risultati alti a «ritira»); altrimenti auto.
  const dichiarato = Number((String(page.dado == null ? "" : page.dado).match(/\d+/) || [])[0]);
  const n = Number.isFinite(dichiarato) && dichiarato >= totPeso ? dichiarato : totPeso;
  let cur = 1;
  const righe = voci.map((v) => {
    const lo = cur, hi = cur + v.peso - 1; cur = hi + 1;
    return `> | ${lo === hi ? lo : `${lo}–${hi}`} | ${v.testo} |`;
  });
  const coda = n > totPeso ? `\n>\n> *${n - totPeso} risultati alti non assegnati → ritira.*` : "";
  return `> [!example]- 🎲 Tira sulla tabella — 1d${n}\n> \`dice: 1d${n}\` · oppure il bottone «Tira» (rispetta i pesi)\n>\n`
    + `> | d${n} | Esito |\n> |:-:|:--|\n${righe.join("\n")}${coda}`;
}
