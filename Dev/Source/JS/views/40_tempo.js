// --- Cronologia dell'entità: stati epoch-stamped (mondo-che-cambia) ----------
// Una tappa "quando | stato" → { quando, stato }. Senza '|' tutto è 'quando'. Il
// 'quando' può essere un'epoca testuale o un [[link]] a una nota epoca/evento.
function parseTappa(riga) {
  const s = String(riga == null ? "" : riga);
  const i = s.indexOf("|");
  return i < 0
    ? { quando: s.trim(), stato: "" }
    : { quando: s.slice(0, i).trim(), stato: s.slice(i + 1).trim() };
}

// Pannello "🧩 Dettagli del tipo": il PROFILO del sottotipo scelto (`tipo`) —
// descrizione + i suoi campi (valore dal frontmatter) + se è un Fronte (clock) / se
// evolve. Reattivo: cambia se cambi `tipo`. I campi si editano dal pannello Proprietà
// (sono chiavi di frontmatter). "" se il sottotipo non ha un profilo dedicato.
async function renderTipoProfilo(app, page) {
  if (!page) return "";
  const cat = text(page.categoria), tipo = text(page.tipo);
  if (!cat || !tipo) return "";
  const core = await loadCoreData(app);
  const prof = (((core.categories || {})[cat] || {}).subtype_profiles || {})[tipo];
  if (!prof) return "";
  const fields = core.fields || {};
  const fmt = (v) => {
    if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
    return (v == null || v === "") ? "—" : String(v);
  };
  const out = ["> [!note]- 🧩 " + tipo + " — dettagli del tipo"];
  if (prof.descrizione) out.push("> " + prof.descrizione);
  const campi = asArray(prof.campi);
  if (campi.length) {
    out.push(">");
    for (const id of campi) out.push("> **" + ((fields[id] || {}).label || id) + "**: " + fmt(page[id]));
  }
  const tags = [];
  if (prof.clock) tags.push("⏳ è un **Fronte** — usa il clock nell'*Al tavolo*");
  // «vedi Cronologia» SOLO se la categoria ha davvero quella tab (è in tappe_categorie):
  // altrimenti il riferimento penzolerebbe verso una tab inesistente.
  if (prof.evoluzione) {
    const inTappe = asArray(core.tappe_categorie).includes(cat);
    tags.push("🕰 **evolve** tra le epoche" + (inTappe ? " — vedi *Cronologia*" : ""));
  }
  if (tags.length) { out.push(">"); out.push("> " + tags.join(" · ")); }
  // Il promemoria «edita dal pannello Proprietà» ha senso SOLO se il tipo porta campi
  // propri: un sottotipo senza `campi` (es. 'evento storico') non deve mostrarlo — il
  // pannello resta un compatto richiamo di cosa significa il tipo scelto.
  if (campi.length) out.push(">", "> *I campi del tipo si modificano dal pannello **Proprietà**.*");
  // Spunti del tipo: le domande-guida del profilo (campo `wizard`), prima orfane (non
  // chieste nel modale per scelta di design — la prosa non si digita lì). Qui diventano
  // suggerimenti su cosa sviluppare creando una nota di QUESTO sottotipo.
  const spunti = asArray(prof.wizard);
  if (spunti.length) out.push(">", "> 💡 *Per un* «" + tipo + "» *chiediti:* " + spunti.join(" · "));
  return out.join("\n");
}

// Pannello "Cronologia": il percorso dell'entità attraverso le epoche (proprietà
// `tappe`), reso in ordine d'autore come una linea di vita (fondazione → ascesa →
// crisi). Vuoto → guida col formato. Le entità durature cambiano: il mondo non è
// statico. Esposto parseTappa per i test.
async function renderTappe(app, page) {
  if (!page) return "";
  const tappe = asArray(page.tappe).map(parseTappa).filter((t) => t.quando || t.stato);
  if (!tappe.length) {
    return "> [!tip]- 📜 Cronologia\n> Racconta come questa entità cambia nel tempo: aggiungi la proprietà `tappe`, una riga per tappa in ordine cronologico:\n> `quando | stato` — es. `[[Era della Fondazione]] | Fondato dai coloni del nord`.";
  }
  const righe = tappe.map((t) => `> - **${t.quando || "—"}**${t.stato ? " — " + t.stato : ""}`);
  return "> [!abstract]- 📜 Cronologia (come cambia attraverso le epoche)\n" + righe.join("\n");
}

// --- Timeline / cronologia ---------------------------------------------------
// Estrae il primo intero da una data del mondo testuale ("anno 1234", "1200 PE")
// per ordinare; null se non c'è un numero (allora si ordina per stringa).
function quandoNum(value) {
  const m = String(value == null ? "" : value).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function cmpQuando(a, b) {
  const na = quandoNum(a), nb = quandoNum(b);
  if (na != null && nb != null) return na - nb;
  if (na != null) return -1;
  if (nb != null) return 1;
  return String(a == null ? "" : a).localeCompare(String(b == null ? "" : b));
}

// Nome dell'epoca da un link del frontmatter (oggetto Link Dataview o stringa).
function epocaLabel(dv, link) {
  if (!link) return "";
  const p = resolve(dv, link);
  if (p && p.file) return p.file.name;
  if (link.path) return String(link.path).split("/").pop().replace(/\.md$/, "");
  return text(link).replace(/\[\[|\]\]/g, "").split("|")[0].trim();
}

// Linea del tempo navigabile: eventi E tappe delle entità durature (📜, il mondo
// che evolve) raggruppati per epoca (callout pieghevole), ordinati per 'quando';
// le epoche si ordinano per 'inizio' (poi per primo item), "Senza epoca" in fondo.
// Ritorna markdown (i [[link]] si rendono). La pagina Cronologia la mostra in cima.
async function renderTimeline(app, dv, page) {
  if (!dv) return "*Dataview non attivo.*";
  const eraInfo = {};
  for (const ep of dv.pages().where((p) => p && text(p.categoria) === "epoca").array()) {
    if (ep.file) eraInfo[ep.file.name] = { inizio: ep.inizio, fine: ep.fine };
  }
  const SENZA = "Senza epoca";
  const groups = new Map();
  const push = (key, item) => { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); };
  // Eventi: ogni evento è un punto, raggruppato per la sua epoca (link).
  const eventi = dv.pages()
    .where((p) => p && text(p.categoria) === "evento" && text(p.stato) !== "archiviata").array();
  for (const e of eventi) push(epocaLabel(dv, e.epoca) || SENZA, e);
  // Tappe: le linee di vita delle entità durature entrano nella STESSA timeline —
  // il mondo che evolve accanto agli eventi. Ogni tappa è raggruppata per epoca se
  // il suo 'quando' nomina un'epoca esistente, altrimenti in fondo (Senza epoca).
  let nTappe = 0;
  for (const p of dv.pages().where((q) => q && asArray(q.tappe).length && text(q.stato) !== "archiviata").array()) {
    for (const riga of asArray(p.tappe)) {
      const t = parseTappa(riga);
      const eraName = String(t.quando).replace(/\[\[|\]\]/g, "").split("|")[0].trim();
      push(eraInfo[eraName] ? eraName : SENZA, { __tappa: true, quando: t.quando, link: noteLink(p), stato: t.stato });
      nTappe++;
    }
  }
  if (!groups.size) {
    return "> [!info] Nessun evento\n> Crea un **Evento** (campo *Quando* + un'*Epoca*) o aggiungi le *tappe* a un'entità per popolare la linea del tempo.";
  }
  const sortKey = (name) => {
    if (name === SENZA) return [1, Infinity];
    const ini = quandoNum((eraInfo[name] || {}).inizio);
    if (ini != null) return [0, ini];
    const first = groups.get(name).map((it) => quandoNum(it.quando)).filter((n) => n != null).sort((a, b) => a - b)[0];
    return [0, first == null ? Infinity : first];
  };
  const ordered = [...groups.keys()].sort((a, b) => {
    const ka = sortKey(a), kb = sortKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || a.localeCompare(b);
  });
  const blocchi = [];
  for (const name of ordered) {
    const its = groups.get(name).slice().sort((a, b) => cmpQuando(a.quando, b.quando));
    const info = eraInfo[name] || {};
    const span = [text(info.inizio), text(info.fine)].filter(Boolean).join(" – ");
    const testa = name === SENZA ? `🌫 ${SENZA}` : `🏛 ${name}`;
    const righe = [`> [!abstract]- ${testa}${span ? ` · ${span}` : ""} (${its.length})`];
    for (const it of its) {
      if (it.__tappa) {
        righe.push(`> - 📜 **${text(it.quando) || "—"}** ${it.link}${it.stato ? ` — ${it.stato}` : ""}`);
      } else {
        const meta = [text(it.portata), text(it.tipo)].filter(Boolean).join(" · ");
        righe.push(`> - **${text(it.quando) || "—"}** ${noteLink(it)}${meta ? ` · ${meta}` : ""}`);
      }
    }
    blocchi.push(righe.join("\n"));
  }
  const eras = ordered.filter((n) => n !== SENZA).length;
  const head = `**${eventi.length} eventi**` + (nTappe ? ` · **${nTappe} tappe**` : "")
    + ` · ${eras} ${eras === 1 ? "epoca" : "epoche"}`;
  // Nastro grafico delle epoche (resa "a colpo d'occhio"): un segmento per epoca in ordine
  // cronologico, largo ∝ al n. di voci, colorato; sotto resta il dettaglio pieghevole. HTML
  // (reso da engine.markdown.create, come le barre-risorsa) → nessun plugin timeline dedicato.
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const palette = ["green", "blue", "purple", "cyan", "orange", "pink", "red", "yellow"];
  let ci = 0;
  const seg = ordered.map((name) => {
    const its = groups.get(name);
    const info = eraInfo[name] || {};
    const span = [text(info.inizio), text(info.fine)].filter(Boolean).join("–");
    const isS = name === SENZA;
    const color = isS ? "var(--text-faint)" : `var(--color-${palette[ci++ % palette.length]})`;
    return `<div class="gdr-tl-era" style="flex:${Math.max(1, its.length)};border-bottom-color:${color}">`
      + `<span class="gdr-tl-name">${isS ? "🌫" : "🏛"} ${esc(isS ? SENZA : name)}</span>`
      + (span ? `<span class="gdr-tl-span">${esc(span)}</span>` : "")
      + `<span class="gdr-tl-count">${its.length} voci</span></div>`;
  }).join("");
  const ribbon = `<div class="gdr-timeline">${seg}</div>`;
  return `${head}\n\n${ribbon}\n\n` + blocchi.join("\n\n");
}

