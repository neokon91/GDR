// SORGENTE CANONICA della derivazione delle relazioni INVERSE (link reciproci).
// Gli script autonomi (meta_actions.js, create_entity.js) — niente require/bundling a
// runtime — ne tengono una COPIA fra i marker `// >>>relations` / `// <<<relations`;
// validate.check() impone che le copie siano IDENTICHE a questa. Così l'inverso scritto
// da "Collega" (meta_actions) e quello scritto dal wizard di creazione (create_entity)
// NON possono divergere: modificare una sola copia è un errore di `npm run check`.
// Modifica QUI e risincronizza le copie (stesso testo).
// >>>relations
function reciprocalField(relazioni, targetCat, sourceCat) {
  const cands = ((relazioni ?? {})[targetCat] ?? []).filter((s) => s && s.category === sourceCat);
  return cands.length === 1 ? cands[0] : null;
}

// Relazione INVERSA da scrivere sul target collegando con `rel`. Tre vie, in ordine:
//  1) ESPLICITA — `rel.reciprocal` nomina il campo inverso, risolto nello schema del
//     target per ereditarne 'multi'/'label'. Serve quando l'auto-derivazione è
//     ambigua: coppie simmetriche (luogo.confina_con↔confina_con) o direzionali
//     (evento.causato_da↔conseguenze), dove il target ha più relazioni alla sorgente;
//  2) AUTO-DERIVATA — la coppia è univoca (reciprocalField), per le relazioni
//     tipizzate senza override esplicito;
//  3) null — relazione generica o ambigua senza override: il chiamante usa 'connessioni'.
function inverseRelation(core, rel, sourceCat, targetCat) {
  if (rel && rel.reciprocal) {
    const rels = (core.relazioni ?? {})[targetCat] ?? [];
    return rels.find((r) => r && r.field === rel.reciprocal) ?? { field: rel.reciprocal, multi: !!rel.multi };
  }
  return rel && rel.category ? reciprocalField(core.relazioni, targetCat, sourceCat) : null;
}
// <<<relations

module.exports = { reciprocalField, inverseRelation };
