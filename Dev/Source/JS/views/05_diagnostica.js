// Diagnostica plugin: confronta i plugin ESSENZIALI dichiarati nel modello
// (core.json:plugins, da plugins.yaml:critico) con quelli ATTIVI in Obsidian, e
// stampa una checklist AZIONABILE. È la rete di sicurezza per l'utente non-tecnico:
// quando una nota mostra «codice grezzo» di solito manca un plugin — qui scopre
// quale e come riattivarlo, invece di pensare che il vault sia rotto.
//
// Robustezza al caso peggiore: se è JS Engine stesso a mancare, questo pannello non
// gira affatto (il blocco resta codice) — lo copre il callout STATICO nella nota
// Diagnostica, che è markdown puro e si vede sempre. Questo pannello NON usa Dataview,
// così funziona anche quando Dataview è spento (proprio il caso da diagnosticare).

// Normalizza un insieme di id comunque l'API lo esponga (Set, array, oggetto→chiavi).
// Restituisce null se il valore non è un insieme utile, così il chiamante può ripiegare.
function toIdSet(x) {
  if (!x) return null;
  if (x instanceof Set) return x;
  if (Array.isArray(x)) return new Set(x);
  if (typeof x === "object") return new Set(Object.keys(x));
  return null;
}

// I plugin REALMENTE CARICATI come Set di id. Fonte di verità: `app.plugins.plugins`
// (i plugin che Obsidian ha effettivamente caricato), NON `enabledPlugins` (quelli che
// l'utente ha CHIESTO di abilitare, da community-plugins.json). Un plugin elencato lì ma
// che non si carica — file mancanti, versione incompatibile dopo un update, installazione
// corrotta — resta in `enabledPlugins` pur non comparendo in `plugins`, e le sue note
// appaiono come codice grezzo. Usare i caricati evita il falso «tutto a posto» — proprio
// il senso di sicurezza fasullo che la Diagnostica esiste per smascherare.
// Robustezza: se `plugins` manca del tutto (ambienti di test/legacy) ripiega su enabledPlugins.
function pluginAttivi(app) {
  const p = app && app.plugins;
  if (!p) return new Set();
  return toIdSet(p.plugins) || toIdSet(p.enabledPlugins) || new Set();
}

async function renderDiagnostica(app) {
  const core = await loadCoreData(app);
  const critici = asArray(core.plugins);
  if (!critici.length) return "*Nessun plugin essenziale dichiarato nel modello.*";
  const attivi = pluginAttivi(app);
  const mancanti = critici.filter((p) => p && !attivi.has(p.id));

  if (!mancanti.length) {
    return `✅ **Tutti i ${critici.length} plugin essenziali sono attivi.** Il vault funziona: `
      + `se vedi del codice grezzo da qualche parte, riapri la nota o passa in modalità Lettura.`;
  }

  const righe = mancanti.map((p) =>
    `| ❌ **${p.name}** | ${p.rompe || "Alcune note non si renderanno."} |`);
  const uno = mancanti.length === 1;
  return [
    (uno
      ? `⚠️ **Manca 1 plugin essenziale su ${critici.length}.** `
      : `⚠️ **Mancano ${mancanti.length} plugin essenziali su ${critici.length}.** `)
      + `Attiva${uno ? "lo" : "li"} in *Impostazioni → Plugin della community* `
      + `(se la lista è bloccata, togli prima il *Restricted mode*), poi riapri le note.`,
    ``,
    `| Plugin da attivare | Cosa non si vede senza |`,
    `|:--|:--|`,
    ...righe,
  ].join("\n");
}
