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

// I plugin attivi come Set di id, comunque l'API li esponga (Set, array, oggetto).
function pluginAttivi(app) {
  const e = app && app.plugins && app.plugins.enabledPlugins;
  if (!e) return new Set();
  if (e instanceof Set) return e;
  if (Array.isArray(e)) return new Set(e);
  if (typeof e === "object") return new Set(Object.keys(e));
  return new Set();
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
