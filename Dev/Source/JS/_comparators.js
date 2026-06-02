// SORGENTE CANONICA della grammatica dei comparatori `quando`:
//   ">=N" "<=N" ">N" "<N" "==N"/"N" (uguaglianza) "N-M" (intervallo).
// Gli script autonomi (views.js, meta_actions.js) — niente require/bundling a
// runtime — ne tengono una COPIA fra i marker `// >>>matchesCond` / `// <<<matchesCond`;
// validate.check() impone che le copie siano IDENTICHE a questa. Così la deriva
// (modificare una sola copia) è un errore di `npm run check`, non un bug latente
// scoperto solo a runtime. Modifica QUI e risincronizza le copie (stesso testo).
// Questo file NON è copiato nel vault (i `_*.js` sono sorgenti di riferimento,
// come i partial Jinja `_*.j2`). create_entity.presetValore è l'INVERSA (deriva
// un valore da un comparatore) e resta lì, guardata dal test anti-drift.
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

module.exports = { matchesCond };
