// --- Filo dell'avventura: flusso delle scene + ragnatela degli indizi -----------
// Ispirazione Alkemion Studio: il design d'avventura NON-LINEARE reso nel vault.
// Per una SCENA mostra l'intera avventura (le scene sorelle della stessa missione)
// col flusso «Conduce a» e, per ogni scena, quanti indizi la rivelano; evidenzia
// quella corrente. Applica la «REGOLA DEI 3 INDIZI» (Justin Alexander): ogni snodo
// CHIAVE (subtype con `chiave:true`) dovrebbe essere raggiungibile da ≥3 indizi
// indipendenti, o i PG rischiano di restare bloccati. Legge il vault via Dataview
// (robusto: conta gli indizi dalle note `indizio`, non si fida dei soli reciproci).
async function renderFiloAvventura(app, dv, page) {
  if (!page) return "*Apri una Scena.*";
  const cat = text(page.categoria);
  if (cat !== "scena" && cat !== "missione") return "";
  if (!dv) return "*Dataview non disponibile.*";
  const core = await loadCoreData(app);
  const profili = ((core.categories || {}).scena || {}).subtype_profiles || {};
  const isChiave = (p) => !!(profili[text(p.tipo)] || {}).chiave;
  const samePath = (a, b) => a && b && a.file && b.file && a.file.path === b.file.path;

  // L'avventura di riferimento: la nota stessa (se missione) o quella della scena.
  const missione = cat === "missione" ? page : resolve(dv, page.missione);

  // Le scene dell'avventura (o la sola scena, se "sciolta" senza missione).
  let scene = [];
  if (missione) {
    scene = dv.pages().where((p) => text(p.categoria) === "scena"
      && samePath(resolve(dv, p.missione), missione)).array();
  }
  if (!scene.length && cat === "scena") scene = [page];
  if (!scene.length) return missione ? "*Nessuna scena collegata a questa avventura.*" : "";

  // Indizi del vault: quanti RIVELANO una data scena (vie d'accesso alla conclusione).
  const indizi = dv.pages().where((p) => text(p.categoria) === "indizio").array();
  const indiziVerso = (sc) => indizi.filter((i) =>
    asArray(i.rivela).map((l) => resolve(dv, l)).some((t) => samePath(t, sc)));

  // Ordine di lettura: apertura → corpo (per nome) → climax in fondo.
  const rank = (p) => (text(p.tipo) === "apertura" ? 0 : text(p.tipo) === "climax" ? 2 : 1);
  scene.sort((a, b) => rank(a) - rank(b) || (a.file && a.file.name || "").localeCompare(b.file && b.file.name || ""));

  const carenti = [];
  const righe = scene.map((sc) => {
    const qui = samePath(sc, page) ? " ⬅" : "";
    const verso = asArray(sc.conduce_a).map((l) => resolve(dv, l)).filter(Boolean).map(noteLink);
    const n = indiziVerso(sc).length;
    const chiave = isChiave(sc);
    if (chiave && n < 3) carenti.push(`${noteLink(sc)} (${n}/3)`);
    const badge = chiave ? (n >= 3 ? `🟢 ${n} indizi` : `🔴 ${n}/3 indizi`) : (n ? `${n} indizi` : "");
    const tipo = text(sc.tipo) || "scena";
    return `> - ${noteLink(sc)}${qui} · *${tipo}*${badge ? ` · ${badge}` : ""}`
      + (verso.length ? `\n>     ↳ conduce a: ${verso.join(", ")}` : "");
  });

  const titolo = missione ? `🧭 Filo dell'avventura — ${noteLink(missione)}` : "🧭 Filo della scena";
  let out = `> [!abstract]- ${titolo} (${scene.length} scene)\n${righe.join("\n")}`;
  if (carenti.length) {
    out += `\n\n> [!warning]- 🔍 Regola dei 3 indizi — snodi con meno di 3 vie\n`
      + `> Ogni rivelazione-chiave dovrebbe avere ≥3 indizi indipendenti che la portano,\n`
      + `> o i PG rischiano di bloccarsi (Three Clue Rule). Da rinforzare:\n`
      + carenti.map((x) => `> - ${x}`).join("\n");
  }
  return out;
}
