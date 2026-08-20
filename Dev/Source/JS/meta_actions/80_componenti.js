// Componenti a richiesta: il bottone «＋ Componenti» (BUTTON[aggiungi-componente])
// legge z.automazioni/data/componenti.json — reso da render.write_componenti dalle
// macro di _macros.j2 — e offre i componenti pertinenti alla CATEGORIA della nota e
// NON ancora presenti, appendendo il blocco scelto in fondo. Così la nota nasce
// snella (Lore + Collegamenti) e i componenti "da tavolo" (Al tavolo, Clock,
// Carattere, Cronologia, Vista…) si aggiungono solo quando servono.

// Append idempotente: se il marker (l'heading `## …` del componente) è già nel
// corpo, non duplica. Nucleo puro (niente app/tp) → testabile in isolamento.
function applyComponent(content, block, marker) {
  if (marker && content.includes(marker)) return content;
  return `${String(content).replace(/\s+$/, "")}\n\n${block}\n`;
}

async function inserisci_componente(tp, file) {
  const cat = (app.metadataCache.getFileCache(file)?.frontmatter ?? {}).categoria;
  if (!cat) {
    new Notice("Nota senza 'categoria': apri una nota-entità e riprova.");
    return "";
  }
  let catalog;
  try {
    catalog = JSON.parse(await app.vault.adapter.read("z.automazioni/data/componenti.json"));
  } catch (e) {
    new Notice("componenti.json non trovato — rilancia la build del vault (npm run build).");
    return "";
  }
  const perCat = catalog[cat] ?? [];
  if (!perCat.length) {
    new Notice(`Nessun componente disponibile per «${cat}».`);
    return "";
  }
  const content = await app.vault.read(file);
  // Offri solo ciò che manca (marker=heading assente): evita doppioni e tiene corto il menu.
  const missing = perCat.filter((c) => !(c.heading && content.includes(c.heading)));
  if (!missing.length) {
    new Notice("Tutti i componenti sono già nella nota.");
    return "";
  }
  // Display "label — desc" (il DM sa cosa fa prima di aggiungerlo); il VALORE resta il
  // componente. desc assente → solo label.
  const chosen = await tp.system.suggester(
    missing.map((c) => (c.desc ? `${c.label} — ${c.desc}` : c.label)),
    missing, false, "Aggiungi componente");
  if (!chosen) return "";
  const block = `${chosen.heading}\n${chosen.md}`;
  await app.vault.modify(file, applyComponent(content, block, chosen.heading));
  new Notice(`Aggiunto: ${chosen.label}`);
  return "";
}

// Esposto sull'oggetto meta_actions (dichiarato in 70_dispatch.js, hoisted): il
// dispatch instrada l'azione; applyComponent è esposto per il test-guardia.
meta_actions.inserisci_componente = inserisci_componente;
meta_actions.applyComponent = applyComponent;
