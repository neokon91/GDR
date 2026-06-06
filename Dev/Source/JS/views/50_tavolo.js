// --- Quick-ref condizioni 5.5e -----------------------------------------------
// Callout pieghevole con le 15 condizioni (nome linkato alla nota SRD + effetti
// compatti): richiamo rapido al tavolo. Pure (riceve la lista da core.condizioni).
function condizioniMarkdown(condizioni) {
  const lista = condizioni || [];
  if (!lista.length) return "*Condizioni SRD non disponibili (genera l'SRD).*";
  const righe = lista.map((c) => {
    const eff = (c.effetti || []).map((e) => text(e.descrizione)).filter(Boolean).join(" ");
    return `> **[[${text(c.nome)}]]** — ${eff || text(c.descrizione)}`;
  });
  return `> [!quote]- 📋 Condizioni 5.5e (quick-ref)\n${righe.join("\n>\n")}`;
}

async function renderCondizioni(app) {
  const core = await loadCoreData(app);
  return condizioniMarkdown(core.condizioni);
}

// Quick-ref delle 8 proprietà di maestria delle armi (2024): callout pieghevole
// nome + effetto. Da core.maestrie (system.yaml). L'applicazione PER-ARMA (tiro per
// colpire + danni + effetto, dalle armi di cui il PG ha padronanza) è in renderAttacchi.
function maestrieMarkdown(maestrie) {
  const lista = maestrie || [];
  if (!lista.length) return "*Maestrie delle armi non disponibili.*";
  const righe = lista.map((m) => `> **${text(m.nome)}** *(${text(m.en)})* — ${text(m.effetto)}`);
  return `> [!quote]- ⚔️ Maestria delle armi 2024 (quick-ref)\n${righe.join("\n>\n")}`;
}

async function renderMaestrie(app) {
  const core = await loadCoreData(app);
  return maestrieMarkdown(core.maestrie);
}

// --- Attacchi con maestria (scheda PG) --------------------------------------
// Caratteristica d'attacco di un'arma (2024): a distanza → Destrezza; accurata
// (finesse) → la migliore fra Forza e Destrezza del PG; mischia → Forza.
function abilitaArma(arma, page) {
  const props = ((arma && arma.proprieta) || []).map((p) => String(p).toLowerCase());
  if (props.some((p) => p.startsWith("accurata"))) {
    const f = Number(page && page.mod_forza) || 0;
    const d = Number(page && page.mod_destrezza) || 0;
    return d > f ? "destrezza" : "forza";
  }
  return /distanza/i.test((arma && arma.categoria) || "") ? "destrezza" : "forza";
}

// Dado di danno dalla stringa SRD "1d6 taglienti" → { dado:"1d6", tipo:"taglienti" }.
function danniArma(danni) {
  const s = String(danni || "");
  const m = s.match(/(\d+d\d+)/i);
  return { dado: m ? m[1] : "", tipo: s.replace(/\d+d\d+/i, "").trim() };
}

// Nome-arma da una voce padronanze_armi del PG ("Ascia — Vessazione" → "Ascia").
function nomeArma(voce) {
  return String(voce == null ? "" : voce).split("—")[0].trim();
}

// Riga d'attacco per un'arma con maestria: tiro per colpire (mod arma + competenza,
// sintassi Dice Roller che legge il frontmatter), danni (dado + mod) ed effetto della
// padronanza. maestrieByName: mappa nome-padronanza(minuscolo)→voce maestrie. Esposto.
function attaccoArma(arma, page, maestrieByName) {
  const abil = abilitaArma(arma, page);
  const { dado, tipo } = danniArma(arma && arma.danni);
  const mast = String((arma && arma.padronanza) || "");
  const eff = ((maestrieByName || {})[mast.toLowerCase()] || {}).effetto || "";
  return {
    nome: (arma && arma.nome) || "",
    sigla: abil.slice(0, 3).toUpperCase(),
    colpire: `1d20 + mod_${abil} + competenza`,
    danni: dado ? `${dado} + mod_${abil}` : "",
    tipo,
    padronanza: mast,
    effetto: eff,
  };
}

// Pannello "Attacchi con maestria" della scheda PG: per ogni arma di cui il PG ha
// padronanza (frontmatter padronanze_armi) emette tiro per colpire + danni + effetto
// della maestria. Le armi vengono dal catalogo di personaggio.json (opt.armi). I
// `dice:` restano coerenti con la Scheda (Dice Roller legge mod_<car> e competenza).
// --- Albero evolutivo (progressione ramificata, lore) -----------------------
// Parsing di un nodo "grado | nome | prerequisito | effetto" → {grado, nome, prereq,
// effetto}. Campi mancanti = vuoti; grado non numerico → 0 ("Senza grado"). Esposto.
function parseNodo(riga) {
  const parts = String(riga == null ? "" : riga).split("|").map((s) => s.trim());
  const grado = parseInt(parts[0], 10);
  return {
    grado: Number.isFinite(grado) ? grado : 0,
    nome: parts[1] || "",
    prereq: parts[2] && parts[2] !== "—" ? parts[2] : "",
    effetto: parts[3] || "",
  };
}

// Pannello "Albero evolutivo": legge page.nodi (lista "grado | nome | prereq |
// effetto"), raggruppa per grado crescente e rende ogni nodo con prerequisito ed
// effetto. Vuoto → guida col formato (i nodi si editano nella proprietà `nodi`).
async function renderAlbero(app, page) {
  if (!page) return "*Apri una scheda Albero evolutivo.*";
  const nodi = asArray(page.nodi).map(parseNodo).filter((n) => n.nome);
  if (!nodi.length) {
    return "> [!tip]- 🌳 Albero evolutivo\n> Aggiungi i nodi nella proprietà `nodi`, una riga per nodo:\n> `grado | nome | prerequisito | effetto` — es. `1 | Tocco di Cenere | — | +1 danno da fuoco`.";
  }
  const perGrado = {};
  for (const n of nodi) (perGrado[n.grado] = perGrado[n.grado] || []).push(n);
  const gradi = Object.keys(perGrado).map(Number).sort((a, b) => a - b);
  const blocchi = gradi.map((g) => {
    const righe = perGrado[g].map((n) => {
      const pre = n.prereq ? ` *(richiede ${n.prereq})*` : "";
      const eff = n.effetto ? ` — ${n.effetto}` : "";
      return `> - **${n.nome}**${pre}${eff}`;
    });
    return `> **${g > 0 ? "Grado " + g : "Senza grado"}**\n${righe.join("\n")}`;
  });
  return `> [!tip]- 🌳 Albero evolutivo\n${blocchi.join("\n>\n")}`;
}

// Armi HOMEBREW dal vault (note `oggetto` con tipo=arma): stesso shape del catalogo
// SRD {nome:{nome,danni,proprieta,categoria,padronanza}}, grazie alla parità di campi
// (system.yaml usa gli stessi nomi dell'equip SRD). Così un'arma homebrew, se il PG
// ne ha padronanza, è giocabile in renderAttacchi come quelle ufficiali. Best-effort:
// se l'app non espone il vault (test headless), torna {} e si usa solo il catalogo SRD.
function armiHomebrew(app) {
  const out = {};
  try {
    for (const f of app.vault.getMarkdownFiles()) {
      const fm = app.metadataCache.getFileCache(f) && app.metadataCache.getFileCache(f).frontmatter;
      if (!fm || fm.categoria !== "oggetto" || String(fm.tipo || "").toLowerCase() !== "arma") continue;
      const nome = (fm.nome || f.basename || "").toString();
      if (!nome) continue;
      const proprieta = Array.isArray(fm.proprieta)
        ? fm.proprieta
        : String(fm.proprieta || "").split(",").map((s) => s.trim()).filter(Boolean);
      out[nome] = { nome, danni: fm.danni || "", proprieta, categoria: fm.categoria_arma || "", padronanza: fm.padronanza || "" };
    }
  } catch (e) { /* vault non disponibile (headless): solo catalogo SRD */ }
  return out;
}

async function renderAttacchi(app, page) {
  if (!page) return "*Apri la scheda PG.*";
  const scelte = asArray(page.padronanze_armi).map(nomeArma).filter(Boolean);
  if (!scelte.length) {
    return "> [!tip]- ⚔️ Attacchi con maestria\n> Nessuna padronanza d'arma: la tua classe non la concede. Le 8 proprietà di maestria sono nel quick-ref sotto.";
  }
  const opt = await loadPersonaggio(app);
  // Catalogo SRD + armi homebrew dal vault (parità di campi → stesse colonne).
  const armi = { ...armiHomebrew(app), ...(opt.armi || {}) };
  const core = await loadCoreData(app);
  const maestrieByName = {};
  for (const mm of core.maestrie || []) maestrieByName[String(mm.nome || "").toLowerCase()] = mm;
  const righe = scelte.map((nome) => {
    const arma = armi[nome];
    if (!arma) return `> **${nome}** — *(non nel catalogo SRD; tira con il d20 della Scheda)*`;
    const a = attaccoArma(arma, page, maestrieByName);
    const danni = a.danni ? ` · danni \`dice: ${a.danni}\`${a.tipo ? " " + a.tipo : ""}` : "";
    return `> **${a.nome}** (${a.sigla}) — colpire \`dice: ${a.colpire}\`${danni}\n>\n> ⚔️ *${a.padronanza}* — ${a.effetto}`;
  });
  return `> [!tip]- ⚔️ Attacchi con maestria\n${righe.join("\n>\n")}`;
}

