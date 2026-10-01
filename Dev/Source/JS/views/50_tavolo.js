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
// Le armi arrivano dal plugin nella forma della Board (`ArmaCat`: srd_armi.json + armi
// homebrew del vault): {nome, dado, tipo_danno?, proprieta, distanza, padronanza?}, con
// proprietà e padronanza in slug (`accurata`, `doppio-fendente`).
//
// Caratteristica d'attacco di un'arma (2024): a distanza → Destrezza; accurata
// (finesse) → la migliore fra Forza e Destrezza del PG; mischia → Forza.
function abilitaArma(arma, page) {
  const props = ((arma && arma.proprieta) || []).map((p) => String(p).toLowerCase());
  if (props.some((p) => p.startsWith("accurata"))) {
    const f = Number(page && page.mod_forza) || 0;
    const d = Number(page && page.mod_destrezza) || 0;
    return d > f ? "destrezza" : "forza";
  }
  return arma && arma.distanza ? "destrezza" : "forza";
}

// Dado e tipo di danno: `dado` è "d8"/"2d6"/"1" (srd_armi) o, per l'homebrew, la stringa
// intera "1d8 tagliente"; il tipo da `tipo_danno` o dal resto della stringa.
function danniArma(arma) {
  const s = String((arma && arma.dado) || "").trim();
  const m = s.match(/^(\d*)d(\d+)/i);
  const dado = m ? `${m[1] || 1}d${m[2]}` : (/^\d+$/.test(s) ? s : "");
  const tipo = text(arma && arma.tipo_danno) || s.replace(/^\d*d\d+|^\d+/i, "").trim();
  return { dado, tipo };
}

// Slug di un nome di maestria ("Doppio fendente" → "doppio-fendente"), per legarla all'arma.
const slugMaestria = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "-");

// Nome-arma da una voce padronanze_armi del PG ("Ascia — Vessazione" → "Ascia").
function nomeArma(voce) {
  return String(voce == null ? "" : voce).split("—")[0].trim();
}

// Riga d'attacco per un'arma con maestria: tiro per colpire (mod arma + competenza,
// sintassi Dice Roller che legge il frontmatter), danni (dado + mod) ed effetto della
// padronanza. maestrie: mappa slug-padronanza → voce maestrie (core.maestrie). Esposto.
function attaccoArma(arma, page, maestrie) {
  const abil = abilitaArma(arma, page);
  const { dado, tipo } = danniArma(arma);
  const voce = (maestrie || {})[slugMaestria(arma && arma.padronanza)] || {};
  const mast = text(voce.nome) || String((arma && arma.padronanza) || "");
  const eff = voce.effetto || "";
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
// della maestria. Le armi vengono dal plugin (`kernel.armi`: SRD + homebrew, chiave = nome
// minuscolo). I `dice:` restano coerenti con la Scheda (Dice Roller legge mod_<car> e competenza).
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

async function renderAttacchi(app, page, kernel) {
  if (!page) return "*Apri la scheda PG.*";
  const scelte = asArray(page.padronanze_armi).map(nomeArma).filter(Boolean);
  if (!scelte.length) {
    return "> [!tip]- ⚔️ Attacchi con maestria\n> Nessuna padronanza d'arma: la tua classe non la concede. Le 8 proprietà di maestria sono nel quick-ref sotto.";
  }
  const armi = (kernel && kernel.armi) || {};
  const core = await loadCoreData(app);
  const maestrie = {};
  for (const mm of core.maestrie || []) maestrie[slugMaestria(mm.nome)] = mm;
  const righe = scelte.map((nome) => {
    const arma = armi[nome.toLowerCase()];
    if (!arma) return `> **${nome}** — *(non nel catalogo SRD; tira con il d20 della Scheda)*`;
    const a = attaccoArma(arma, page, maestrie);
    const danni = a.danni ? ` · danni \`dice: ${a.danni}\`${a.tipo ? " " + a.tipo : ""}` : "";
    return `> **${a.nome}** (${a.sigla}) — colpire \`dice: ${a.colpire}\`${danni}\n>\n> ⚔️ *${a.padronanza}* — ${a.effetto}`;
  });
  return `> [!tip]- ⚔️ Attacchi con maestria\n${righe.join("\n>\n")}`;
}

