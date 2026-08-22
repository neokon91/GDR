// Sorgente CANONICA degli helper puri condivisi fra crea_pg.js e sali_pg.js.
//
// I due wizard sono script Templater AUTONOMI (niente require a runtime), quindi ne
// tengono una COPIA byte-identica fra i marker `// >>>pg-shared` / `// <<<pg-shared`.
// validate.check() impone l'uguaglianza: modificarne una sola copia è un errore di
// build, non un drift latente (creazione e level-up calcolerebbero risorse diverse).
// Per aggiornare un helper: cambia il blocco QUI e ricopialo identico nelle due copie.
//
// SPEC delle REGOLE: `mod`/`maxAtLevel`/`risorseAtLevel` sono la copia JS della spec
// TESTATA in `regole/creatore/risorse.ts` (`modPunteggio`/`maxAlLivello`/`risorseAlLivello`).
// `tests/test_pg_shared_parity.py` lega questa copia a quella spec su una batteria di
// input: se una delle due deriva, il test diventa rosso. La verità della regola è in
// regole; qui c'è la copia perché i wizard restano autonomi. `sigla`/`scegliMulti`
// (formato/UI, non regole) restano solo JS.

// >>>pg-shared
// Helper puri CONDIVISI fra crea_pg.js e sali_pg.js (creazione ↔ level-up): così le
// risorse/competenze calcolate coincidono. Sorgente canonica: Dev/Source/JS/_pg_shared.js
// — le copie fra i marker devono restare byte-identiche (imposto da validate.check).
function mod(v) { const n = Number.parseInt(v, 10); return Math.floor(((Number.isFinite(n) ? n : 10) - 10) / 2); }
function sigla(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
function maxAtLevel(valori, liv) {
  let m = 0;
  for (const [k, v] of Object.entries(valori || {})) if (Number(k) <= liv) m = Math.max(m, Number(v) || 0);
  return m;
}
// Risorse di classe attive al livello `liv`: max da CARATTERISTICA (mod, min 1), da
// TABELLA SRD (`valori`) o `max` fisso (homebrew); la ricarica passa a breve dalla soglia
// `ricarica_breve_da_livello`. Esclude i max 0. → frontmatter `risorse_pg`.
function risorseAtLevel(risorse, liv, scores) {
  return (risorse || []).map(r => {
    let max;
    if (r.caratteristica) max = Math.max(1, mod((scores || {})[r.caratteristica]));
    else if (r.valori) max = maxAtLevel(r.valori, liv);
    else max = Number(r.max) || 0;
    const ric = (r.ricarica_breve_da_livello && liv >= r.ricarica_breve_da_livello) ? "breve" : r.ricarica;
    return { id: r.id, label: r.label, max, ric, icona: r.icona || "" };
  }).filter(r => r.max > 0);
}
async function scegliMulti(tp, titolo, pool, n) {
  const scelte = [], disp = [...(pool || [])];
  for (let i = 0; i < (n || 0) && disp.length; i++) {
    const v = await tp.system.suggester(disp, disp, false, `${titolo} (${i + 1}/${n})`);
    if (v == null) break;
    scelte.push(v); disp.splice(disp.indexOf(v), 1);
  }
  return scelte;
}
// <<<pg-shared
