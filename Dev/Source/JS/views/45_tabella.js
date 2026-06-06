// --- Tabella casuale: tira sulle voci d'utente (ispirazione Alkemion: Random Tables) -
// Numera le `voci` (campo testo, una per riga) della nota-tabella e offre il tiro come
// roller `dice: 1dN` (N = n. di voci, o il `dado` dichiarato se maggiore). Complementare
// a `genera` (generatori CURATI di nomi/spunti): qui le tavole le scrive il GM. Pure-ish
// (legge solo `page`): il tiro lo fa il plugin Dice Roller, la mappa risultato→esito è qui.
async function renderTabella(app, page) {
  if (!page || text(page.categoria) !== "tabella") return "";
  // Voci: una per riga (textArea). Si tollerano prefissi di elenco ("- ", "1. ") incollati.
  const voci = text(page.voci).split(/\r?\n/)
    .map((s) => s.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  if (voci.length < 2) {
    return "> [!info] Tabella da riempire\n> Scrivi almeno 2 **Voci** (una per riga) nel campo qui sopra: il dado si adatterà al loro numero.";
  }
  // Dado: quello dichiarato se ≥ n. voci (lascia risultati alti "ritira"); altrimenti auto.
  const dichiarato = Number((String(page.dado == null ? "" : page.dado).match(/\d+/) || [])[0]);
  const n = Number.isFinite(dichiarato) && dichiarato >= voci.length ? dichiarato : voci.length;
  const righe = voci.map((v, i) => `> | ${i + 1} | ${v} |`);
  const coda = n > voci.length ? `\n>\n> *${n - voci.length} risultati alti non assegnati → ritira.*` : "";
  return `> [!example]- 🎲 Tira sulla tabella — 1d${n}\n> \`dice: 1d${n}\`\n>\n`
    + `> | d${n} | Esito |\n> |:-:|:--|\n${righe.join("\n")}${coda}`;
}
