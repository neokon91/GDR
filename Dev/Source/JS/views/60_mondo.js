// --- Tema natale (personalità psico-astrale, recupero #9) --------------------
// Profilo di personalità di un personaggio (soprattutto PNG): scelto un SEGNO si
// deriva elemento/modalità/archetipo/MBTI; l'ARCANO è la carta del destino
// opzionale; l'allineamento D&D resta accanto come bussola morale. Dal catalogo
// core.astrologia. Pure (riceve astrologia + i valori del personaggio).
function temaNataleMarkdown(astro, p) {
  const segnoNome = text(p && p.segno);
  if (!segnoNome) {
    return "> [!tip] Tema natale\n> Scegli un **Segno** qui sopra per generare il profilo: archetipo, temperamento (elemento), MBTI e *ombra*.";
  }
  const s = ((astro || {}).segni || []).find((x) => text(x.nome) === segnoNome);
  if (!s) return "*Segno non riconosciuto.*";
  const mbti = Array.isArray(s.mbti) && s.mbti.length ? ` · MBTI ${s.mbti.join("/")}` : "";
  const out = [
    `> [!quote] ${s.nome} · ${s.elemento} ${s.modalita} · *${s.archetipo}* — «${s.parola_chiave}»`,
    `> ${s.funzione_archetipica}${mbti}`,
  ];
  if (Array.isArray(s.manifestazioni) && s.manifestazioni.length) out.push(`> **In scena**: ${s.manifestazioni.join(" · ")}`);
  if (Array.isArray(s.ombra) && s.ombra.length) out.push(`> **⚠ Ombra**: ${s.ombra.join(", ")}`);
  const arcNome = text(p && p.arcano);
  if (arcNome) {
    const a = ((astro || {}).arcani || []).find((x) => text(x.nome) === arcNome);
    if (a) out.push(`>\n> **🔮 Arcano ${a.numero} · ${a.nome}** — ${a.ruolo}${a.ombra ? ` *(ombra: ${a.ombra})*` : ""}`);
  }
  if (p && p.allineamento) out.push(`>\n> **⚖ Allineamento**: ${text(p.allineamento)}`);
  return out.join("\n");
}

async function renderTemaNatale(app, page) {
  if (!page) return "*Apri una scheda personaggio.*";
  const core = await loadCoreData(app);
  return temaNataleMarkdown(core.astrologia, page);
}

// --- Rete di collegamenti (tabella) ------------------------------------------
// Le relazioni TIPIZZATE forward della nota (core.relazioni[categoria]) risolte
// → tabella | Relazione | Nota | Tipo | Pressione |. Complementa "Citato da"
// (backlink, in uscita ↔ in entrata). "" se la nota non ha ancora collegamenti.
async function renderConnessioni(app, dv, page) {
  if (!dv || !page) return "";
  const core = await loadCoreData(app);
  const rels = (core.relazioni || {})[text(page.categoria)] || [];
  const rows = [];
  for (const r of rels) {
    for (const link of asArray(page[r.field])) {
      const p = resolve(dv, link);
      if (p) rows.push(`| ${r.label} | ${noteLink(p)} | ${text(p.categoria) || "—"} | ${pressureLabel(p.pressione)} |`);
    }
  }
  if (!rows.length) return "";
  return ["**🕸 Rete di collegamenti**", "", "| Relazione | Nota | Tipo | Pressione |",
          "|:--|:--|:--|:--|", ...rows].join("\n");
}

// --- Mappa (luogo/mondo) -----------------------------------------------------
// Embed della mappa collegata (campo 'mappa'): un disegno Excalidraw, un'immagine
// o una nota. Se vuoto, un suggerimento su come crearne una. Ritorna markdown
// (l'embed ![[..]] si rende; gestisce Link Dataview o stringa).
async function renderMap(app, dv, page) {
  if (!page) return "*Apri una nota.*";
  const raw = page.mappa;
  // Risolvi mappa → path nel vault: Link Dataview ({path}) o stringa "[[..]]" (risolta
  // al path reale via metadataCache, fallback al nome del link).
  let path = "", nameStr = "";
  if (raw && raw.path) {
    path = String(raw.path);
  } else if (raw) {
    nameStr = text(raw).replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
    const dest = nameStr && app && app.metadataCache && app.metadataCache.getFirstLinkpathDest
      ? app.metadataCache.getFirstLinkpathDest(nameStr, (page.file && page.file.path) || "")
      : null;
    path = dest ? dest.path : nameStr;
  }
  if (!path) {
    return "> [!tip] Nessuna mappa\n> Imposta il campo **Mappa** qui sopra: collega un'**immagine** (mappa interattiva con zoom/pan e segnaposto che linkano le note), un disegno **Excalidraw**, o una nota.";
  }
  // Immagine raster/SVG → mappa INTERATTIVA zoom-map (pan/zoom, righello distanze→tempi,
  // pin con [[link]] alle note). Verificato in-app: zoom-map processa il blocco anche se
  // iniettato da JS Engine (engine.markdown.create). I marker si piazzano a mano (Shift+clic).
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(path)) {
    return "```zoommap\nimage: " + path + "\nheight: 480px\nminZoom: 0.3\nmaxZoom: 8\n```";
  }
  // Nota o disegno Excalidraw → embed (zone cliccabili disegnate a mano).
  const base = (nameStr || path.split("/").pop()).replace(/\.md$/, "");
  return `![[${base}]]`;
}

// --- Dintorni (geografia spaziale) -------------------------------------------
// Vista locale del luogo, due nozioni complementari di distanza: (1) per CONFINI
// (BFS su confina_con — quante aree attraversi, "come ci si muove via terra") e
// (2) IN LINEA D'ARIA (euclidea sulle coord × scala del mondo, in km — "quanto
// dista davvero"). Più la REGIONE contenitore e i luoghi CONTENUTI (le rotte di
// viaggio vivono nel pannello Viaggio, con tempo e rischio — niente doppione).
// L'adiacenza è non orientata (i link sono già reciproci, ma uniamo le due
// direzioni per robustezza). Ritorna markdown (i [[link]] si rendono).
async function renderDintorni(app, dv, page) {
  if (!dv || !page || !page.file) return "*Apri una scheda luogo.*";
  const luoghi = dv.pages()
    .where((p) => p && p.file && text(p.categoria) === "luogo" && text(p.stato) !== "archiviata")
    .array();
  const self = page.file.name;
  // Grafo di adiacenza non orientato da confina_con (unione delle due direzioni).
  const adj = new Map(luoghi.map((p) => [p.file.name, new Set()]));
  for (const p of luoghi) {
    for (const link of asArray(p.confina_con)) {
      const q = resolve(dv, link);
      const qn = q && q.file ? q.file.name : null;
      if (qn && adj.has(qn) && adj.has(p.file.name)) {
        adj.get(p.file.name).add(qn);
        adj.get(qn).add(p.file.name);
      }
    }
  }
  // BFS dei confini dal luogo corrente → distanza in salti (anelli).
  const dist = new Map([[self, 0]]);
  let frontier = [self];
  while (frontier.length) {
    const next = [];
    for (const n of frontier) {
      for (const m of adj.get(n) ?? []) {
        if (!dist.has(m)) { dist.set(m, dist.get(n) + 1); next.push(m); }
      }
    }
    frontier = next;
  }
  const out = [];
  const regione = resolve(dv, page.regione);
  if (regione && regione.file) out.push(`**📍 Regione**: ${noteLink(regione)}`);
  const contiene = luoghi.filter((p) => {
    const r = resolve(dv, p.regione);
    return r && r.file && r.file.name === self;
  });
  if (contiene.length) out.push(`**🗺 Contiene** (${contiene.length}): ` + contiene.map(noteLink).join(", "));
  const rings = new Map();
  for (const [name, d] of dist) {
    if (d === 0) continue;
    if (!rings.has(d)) rings.set(d, []);
    rings.get(d).push(name);
  }
  for (const d of [...rings.keys()].sort((a, b) => a - b)) {
    const names = rings.get(d).sort((a, b) => a.localeCompare(b)).map((n) => `[[${n}]]`);
    const label = d === 1 ? "🧭 Confina con" : `↔ A ${d} confini`;
    out.push(`**${label}** (${names.length}): ${names.join(", ")}`);
  }
  // Distanza IN LINEA D'ARIA (metrica): euclidea sulle coord × scala del mondo
  // (mondo.scala_mappa = km per unità; assente → unità "u"). I più vicini in cima.
  const selfCoord = parseCoord(page.coord);
  if (selfCoord) {
    const mondo = resolve(dv, page.mondo);
    const s = mondo ? Number(mondo.scala_mappa) : NaN;
    const scala = Number.isFinite(s) && s > 0 ? s : null;
    const unit = scala ? "km" : "u";
    const fmt = (d) => ` ~${d >= 10 ? Math.round(d) : Math.round(d * 10) / 10} ${unit}`;
    const vicini = luoghi
      .map((p) => ({ p, c: parseCoord(p.coord) }))
      .filter((e) => e.c && e.p.file.name !== self)
      .map((e) => ({ name: e.p.file.name, d: Math.hypot(e.c.x - selfCoord.x, e.c.y - selfCoord.y) * (scala || 1) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
    if (vicini.length) out.push(`**📐 In linea d'aria**: ` + vicini.map((v) => `[[${v.name}]]${fmt(v.d)}`).join(" · "));
  }
  // (Le rotte di viaggio non si elencano qui: sono nel pannello Viaggio, con tempo
  //  e rischio per destinazione — niente doppione sulla stessa tab "Spazio".)
  if (!out.length) {
    return "> [!tip] Nessun dintorno\n> Collega questo luogo: imposta **Regione** (l'area che lo contiene), **Confina con** (i luoghi adiacenti), **Rotta commerciale con** (i viaggi) e **Coordinate** (`x, y`, per la distanza in km). Le distanze si calcolano da sé.";
  }
  return "> [!abstract] 🧭 Dintorni — *per confini (terra) e in linea d'aria (km)*\n" + out.map((r) => "> " + r).join("\n>\n");
}

// --- Viaggio (sistema di viaggio: rotte × tempo × pericolo) -------------------
// Pianificazione dal luogo corrente: le DESTINAZIONI dirette (rotte 🛣 + confinanti
// 🧭) con TEMPO stimato (distanza metrica ÷ passo del mondo) e RISCHIO (pressione
// della destinazione), più COSA PUÒ SUCCEDERE qui (incontri con luogo==qui + insidie
// che includono qui). Lega geografia (coord/rotte/confini) a bestiario/incontri.
// Pace e scala dal mondo (passo_viaggio km/g, default 30); senza coord il tempo è
// "—" ma la tabella resta utile. Ritorna markdown (tabella + callout).
async function renderViaggio(app, dv, page) {
  if (!dv || !page || !page.file) return "*Apri una scheda luogo.*";
  const self = page.file.name;
  const rn = (l) => { const p = resolve(dv, l); return p && p.file ? p.file.name : null; };
  const mondo = resolve(dv, page.mondo);
  const scala = mondo && Number(mondo.scala_mappa) > 0 ? Number(mondo.scala_mappa) : null;
  const pace = mondo && Number(mondo.passo_viaggio) > 0 ? Number(mondo.passo_viaggio) : 30;
  const selfC = parseCoord(page.coord);
  const tempo = (p) => {
    const c = parseCoord(p.coord);
    if (!selfC || !c || !scala) return "—";
    const days = (Math.hypot(c.x - selfC.x, c.y - selfC.y) * scala) / pace;
    return days >= 1 ? `~${Math.round(days)} g` : `~${Math.max(1, Math.round(days * 8))} h`;
  };
  // Destinazioni dirette: rotte (🛣) + confinanti (🧭), dedup per nome con i 'via'.
  const dests = new Map();
  const add = (link, via) => {
    const p = resolve(dv, link);
    if (p && p.file && p.file.name !== self) {
      if (!dests.has(p.file.name)) dests.set(p.file.name, { p, via: new Set() });
      dests.get(p.file.name).via.add(via);
    }
  };
  for (const l of asArray(page.rotta_con)) add(l, "🛣 rotta");
  for (const l of asArray(page.confina_con)) add(l, "🧭 terra");
  const out = [];
  if (dests.size) {
    const rows = [...dests.values()]
      .sort((a, b) => a.p.file.name.localeCompare(b.p.file.name))
      .map(({ p, via }) => `| ${noteLink(p)} | ${[...via].join(", ")} | ${tempo(p)} | ${pressureLabel(p.pressione)} |`);
    out.push([`**🧳 Partenze da qui** *(a piedi, ${pace} km/g)*`, "",
      "| Verso | Via | Tempo | Rischio |", "|:--|:--|:--|:--|", ...rows].join("\n"));
  }
  // Cosa può succedere qui: incontri (luogo==self) + insidie (self ∈ luoghi).
  const pericoli = dv.pages()
    .where((p) => p && p.file && text(p.stato) !== "archiviata"
      && ((text(p.categoria) === "incontro" && rn(p.luogo) === self)
        || (text(p.categoria) === "insidia" && asArray(p.luoghi).some((l) => rn(l) === self))))
    .array();
  if (pericoli.length) {
    const righe = pericoli.map((p) => `> - ${noteLink(p)} *(${text(p.categoria)}${p.tipo ? " · " + text(p.tipo) : ""})*`);
    out.push([`> [!warning]- ⚔ Cosa può succedere qui (${pericoli.length})`, ...righe].join("\n"));
  }
  if (!out.length) {
    return "> [!tip] Nessuna via\n> Collega **Rotte** o **Confina con** per pianificare i viaggi; crea **Incontri**/**Insidie** in questo luogo per popolare i pericoli.";
  }
  return out.join("\n\n");
}

