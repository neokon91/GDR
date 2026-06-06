// «Tira sulla tabella» (bottone): pesca un esito dalle `voci` della tabella attiva
// RISPETTANDO i pesi («3× testo» pesa 3), lo annuncia con una Notice e lo inserisce al
// cursore se c'è un editor attivo. Gemello del display views.renderTabella (stesso parser).

// Una voce: «3× testo» / «3x testo» / «3| testo» → peso 3; altrimenti peso 1.
function parseVoceTab(riga) {
  const s = String(riga == null ? "" : riga).replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim();
  const m = s.match(/^(\d+)\s*[×x|]\s*(.+)$/i);
  return m && m[2].trim() ? { peso: Math.max(1, parseInt(m[1], 10)), testo: m[2].trim() } : { peso: 1, testo: s };
}

// Esito per un tiro 1..somma-pesi: scorre le voci sommando i pesi (range cumulativi).
// roll oltre la somma dei pesi (dado dichiarato più grande) → null = «ritira». Puro/testabile.
function pescaTabella(voci, roll) {
  let cur = 1;
  for (const v of voci || []) {
    if (roll < cur + (Number(v.peso) || 1)) return v.testo;
    cur += Number(v.peso) || 1;
  }
  return null;
}

async function tira_tabella(tp, file) {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  if (fm.categoria !== "tabella") { new Notice("Apri una Tabella casuale."); return ""; }
  const voci = String(fm.voci == null ? "" : fm.voci).split(/\r?\n/).map(parseVoceTab).filter((v) => v.testo);
  if (voci.length < 2) { new Notice("Tabella vuota: aggiungi almeno 2 voci."); return ""; }
  const totPeso = voci.reduce((s, v) => s + v.peso, 0);
  const decl = Number((String(fm.dado == null ? "" : fm.dado).match(/\d+/) || [])[0]);
  const n = Number.isFinite(decl) && decl >= totPeso ? decl : totPeso;
  const roll = Math.floor(Math.random() * n) + 1;
  const esito = pescaTabella(voci, roll);
  if (esito == null) { new Notice(`🎲 1d${n} → ${roll}: nessun esito (ritira).`); return ""; }
  // Inserisce al cursore se c'è un editor markdown attivo; altrimenti basta la Notice.
  const ed = app.workspace.activeEditor && app.workspace.activeEditor.editor;
  if (ed && typeof ed.replaceSelection === "function") ed.replaceSelection(`🎲 ${esito}`);
  new Notice(`🎲 1d${n} → ${roll}: ${esito}`);
  return "";
}
