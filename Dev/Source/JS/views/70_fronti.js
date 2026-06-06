// --- Fronti reattivi al grafo ------------------------------------------------
// Categorie cosmologiche: un principio cosmico può essere un Fronte le cui spinte
// vengono dal GRAFO COSMICO, non da quello economico (collega lo strato più
// modellato alla superficie giocabile).
const COSMO = new Set(["legge_fondamentale", "divinita", "entita_primordiale", "dominio", "piano", "cosmologia", "sistema_magico"]);
// Campi-manifestazione: outlink di un principio verso il mondo mortale (un loro
// target "caldo" = il cosmico si fa crisi lì). I dipendenti che POGGIANO sul
// principio arrivano invece dagli inlink.
const MANIF_FIELDS = ["luoghi", "luoghi_nodo", "soglie", "culti", "abitanti"];

// Una spinta cosmica da un'entità linkata: vale se è "calda" (pressione ≥ 5) o un
// Fronte a metà o oltre. `role` = prefisso (es. "Si manifesta in"). Ritorna la
// riga markdown o null. Esposto per i test.
function cosmicPush(o, role) {
  if (!o || !o.file) return null;
  const p = Number(o.pressione) || 0;
  const dim = Number(o.clock_dim) || 0;
  const adv = dim > 0 && (Number(o.clock) || 0) >= Math.ceil(dim / 2);
  if (p < 5 && !adv) return null;
  const why = adv ? `fronte in corsa (${Number(o.clock) || 0}/${dim})` : pressureLabel(o.pressione);
  return `🌌 ${role} ${noteLink(o)} — ${why}`;
}

// Per un FRONTE (entità con clock_dim) deriva dal grafo le SPINTE che giustificano
// un avanzamento del clock. Grafo ECONOMICO/GEOGRAFICO: dipendenze da risorse
// contese o in mano a terzi (tagliarle stringe), risorse prodotte e contese, rotte
// verso luoghi in crisi, rivali in ascesa. Grafo COSMICO (per i principi): siti di
// manifestazione in crisi + dipendenti (inlink) che vacillano. Rende VISIBILE come
// il mondo preme sul fronte — il GM avanza col bottone (meta_actions.avanza_fronte).
// "" se non è un fronte; tip se nessuna spinta. Ritorna markdown (i [[link]] rendono).
// Le SPINTE dal grafo su un Fronte (entità con clock_dim): grafo economico/
// geografico (dipendenze contese, produzione contesa, rotte a rischio, rivali in
// ascesa) + grafo cosmico (manifestazioni in crisi + dipendenti che vacillano).
// Ritorna l'array di righe-spinta (vuoto = stabile). Sorgente UNICA, riusata da
// renderPressioni (callout per-nota) e renderStatoMondo (cruscotto globale).
async function spinteFronte(app, dv, page) {
  if (!dv || !page || !page.file || page.clock_dim == null) return [];
  const hot = (p) => (Number(p && p.pressione) || 0);
  const out = [];
  // Un Fronte è "religioso" (categoria culto o tipo culto): i suoi rivali-culto e
  // il sacro che serve li tratta il GRAFO TEOLOGICO sotto, non quello economico.
  const religioso = text(page.categoria) === "culto" || text(page.tipo) === "culto";
  // Motore I — SCADENZA: un Fronte con una deadline (campo `scadenza`, in giri) preme più
  // forte man mano che si avvicina; a 0 è arrivata (il giro del mondo lo fa scattare).
  const scad = Number(page.scadenza);
  if (Number.isFinite(scad) && scad <= 3) {
    out.push(scad <= 0
      ? "⏳ **Scadenza arrivata**: la deadline è scaduta — scatena la conseguenza"
      : `⏳ Scadenza tra ${scad} ${scad === 1 ? "giro" : "giri"}: la deadline incombe`);
  }
  // Scarsità come driver economico: una risorsa SCARSA è contesa anche se la sua
  // pressione è bassa (la rarità stessa fa gola). Legge il campo `scarsita` (select).
  const scarsaR = (r) => ["scarsa", "rara", "esaurita"].includes(text(r.scarsita));
  for (const link of asArray(page.dipende_da)) {
    const r = resolve(dv, link); if (!r || !r.file) continue;
    const ctrl = resolve(dv, r.controllata_da);
    const why = [];
    if (hot(r) >= 5) why.push(pressureLabel(r.pressione));
    if (scarsaR(r)) why.push(`risorsa ${text(r.scarsita)}`);
    if (ctrl && ctrl.file) why.push(`in mano a ${noteLink(ctrl)}`);
    if (why.length) out.push(`⛓ Dipendi da ${noteLink(r)} — ${why.join(", ")}: tagliarla ti stringe`);
  }
  for (const link of asArray(page.produce)) {
    const r = resolve(dv, link); if (!r || !r.file) continue;
    if (hot(r) >= 5 || scarsaR(r)) {
      const why = hot(r) >= 5 ? pressureLabel(r.pressione) : `risorsa ${text(r.scarsita)}`;
      out.push(`💎 Produci ${noteLink(r)} (${why}): chi la vuole preme qui`);
    }
  }
  for (const link of asArray(page.rotta_con)) {
    const o = resolve(dv, link); if (!o || !o.file) continue;
    if (hot(o) >= 7) out.push(`🛣 Rotta con ${noteLink(o)} a rischio (${pressureLabel(o.pressione)})`);
  }
  for (const link of asArray(page.rivali)) {
    const o = resolve(dv, link); if (!o || !o.file) continue;
    // I culti-rivali di un Fronte religioso li tratta il grafo teologico (sotto).
    if (religioso && (text(o.categoria) === "culto" || text(o.tipo) === "culto")) continue;
    if (hot(o) >= 7) out.push(`⚔ Rivale ${noteLink(o)} in ascesa (${pressureLabel(o.pressione)})`);
  }
  // Grafo cosmico: un principio cosmico-Fronte è spinto dai suoi siti di
  // manifestazione in crisi (outlink) e dai dipendenti che vacillano (inlink).
  if (COSMO.has(text(page.categoria))) {
    const seen = new Set();
    const add = (o, role) => {
      const r = cosmicPush(o, role);
      if (r && o.file && !seen.has(o.file.path)) { seen.add(o.file.path); out.push(r); }
    };
    for (const fld of MANIF_FIELDS)
      for (const link of asArray(page[fld])) add(resolve(dv, link), "Si manifesta in");
    // I culti (la fede) li tratta il motore F qui sotto: dal generico li escludiamo.
    for (const link of asArray(page.file.inlinks)) {
      const o = resolve(dv, link);
      if (o && text(o.categoria) === "culto") continue;
      add(o, "Dipende da te");
    }
    // Motore F — FEDE ⇄ REALTÀ: la fede che cresce RAFFORZA il principio cosmico (chiude il
    // loop cosmo↔mortali: la cosmologia preme sul tavolo via i culti, e i culti che fioriscono
    // premono sul cosmo). I culti che lo venerano (inlink) caldi o in corsa lo destano.
    const cdimF = (o) => Number(o && o.clock_dim) || 0;
    const fiorenti = asArray(page.file.inlinks).map((l) => resolve(dv, l))
      .filter((o) => o && o.file && text(o.categoria) === "culto"
        && (hot(o) >= 5 || (cdimF(o) > 0 && (Number(o.clock) || 0) >= Math.ceil(cdimF(o) / 2))));
    if (fiorenti.length)
      out.push(`🙏 La fede cresce: ${fiorenti.slice(0, 3).map(noteLink).join(", ")} in ascesa ti rafforza${fiorenti.length > 1 ? "no" : ""} — la tua presenza nel mondo si fa più densa`);
  }
  // Grafo degli ASSI: il CARATTERE di una divinità preme sul tavolo — gli assi che
  // SCENDONO (il ritratto cosmico diventa spinta, non solo descrizione). Volontà alta →
  // interviene; intransigente e schierata → i fedeli si fanno crociata; ancorata e
  // incarnata → la sua presenza si fa crisi tangibile. Legge i valori-assi dal frontmatter.
  if (text(page.categoria) === "divinita") {
    const ax = (k) => Number(page[k]) || 0;
    if (ax("volonta") >= 4)
      out.push(`🌌 Volontà ${ax("volonta") >= 5 ? "interventista" : "attiva"}: interviene negli eventi, non resta a guardare`);
    if (ax("etica_divina") >= 4 && ax("polarita_cosmica") >= 4)
      out.push(`⚔ Dio intransigente e schierato (etica ${ax("etica_divina")}/5 · polarità ${ax("polarita_cosmica")}/5): i suoi fedeli si fanno crociata`);
    if (ax("presenza_cosmica") >= 4 && ax("incarnazione") >= 4)
      out.push(`👁 Presenza ancorata e quasi incarnata: la sua mano si fa tangibile nel mondo`);
  }
  // Grafo TEOLOGICO: un Fronte religioso è spinto dalla metafisica — il dio/dominio
  // cosmico che venera si desta o freme, un culto rivale sale, una profezia che lo
  // riguarda matura. La fede genera trame come l'economia genera tensioni materiali
  // (il wedge: cosmologia → tavolo, dal lato dei mortali che la servono).
  if (religioso) {
    const cdim = (o) => Number(o && o.clock_dim) || 0;
    const adv = (o) => cdim(o) > 0 && (Number(o.clock) || 0) >= Math.ceil(cdim(o) / 2);
    const seenT = new Set();
    const push = (o, line) => { if (o && o.file && !seenT.has(o.file.path)) { seenT.add(o.file.path); out.push(line); } };
    // 1) Il dio / dominio cosmico che servi (divinita, domini) si desta o freme.
    for (const fld of ["divinita", "domini"])
      for (const link of asArray(page[fld])) {
        const o = resolve(dv, link); if (!o || !o.file) continue;
        if (!COSMO.has(text(o.categoria)) || (hot(o) < 5 && !adv(o))) continue;
        const stato = adv(o) ? `si desta (${Number(o.clock) || 0}/${cdim(o)})` : `freme (${pressureLabel(o.pressione)})`;
        // Gli ASSI del dio venerato scendono sul culto: un dio intransigente e schierato
        // (etica/polarità alte) infiamma di più i suoi fedeli.
        const milit = (Number(o.etica_divina) || 0) >= 4 && (Number(o.polarita_cosmica) || 0) >= 4;
        push(o, `🙏 ${noteLink(o)} che veneri ${stato}${milit ? ", e la sua intransigenza divina infiamma i fedeli" : ""}: la posta cosmica matura`);
      }
    // 2) Un culto rivale in ascesa (caldo o fronte a metà): la fede è contesa.
    for (const link of asArray(page.rivali)) {
      const o = resolve(dv, link); if (!o || !o.file) continue;
      if ((text(o.categoria) !== "culto" && text(o.tipo) !== "culto") || (hot(o) < 5 && !adv(o))) continue;
      const why = adv(o) ? `fronte in corsa (${Number(o.clock) || 0}/${cdim(o)})` : pressureLabel(o.pressione);
      push(o, `☦ Culto rivale ${noteLink(o)} in ascesa (${why}): la fede è contesa`);
    }
    // 3) Una profezia / un mito che ti riguarda matura (inlink che avanza).
    for (const link of asArray(page.file.inlinks)) {
      const o = resolve(dv, link); if (!o || !o.file) continue;
      const c = text(o.categoria);
      if ((c === "profezia" || c === "mito") && adv(o))
        push(o, `📜 ${c === "profezia" ? "La profezia" : "Il mito"} ${noteLink(o)} matura (${Number(o.clock) || 0}/${cdim(o)}): la sua ora si avvicina`);
    }
  }
  return out;
}

async function renderPressioni(app, dv, page) {
  if (!dv || !page || !page.file) return "";
  if (page.clock_dim == null) return "";
  const out = await spinteFronte(app, dv, page);
  if (!out.length) {
    return "> [!tip] Fronte stabile\n> Nessuna spinta dal grafo per ora: il clock avanza solo per le tue mosse.";
  }
  const MAX = 8;                                   // cap anti-muro (SYS-3)
  const extra = out.length - MAX;
  const righe = out.slice(0, MAX).map((r) => "> - " + r);
  if (extra > 0) righe.push(`> - *…e altre ${extra} spinte dal grafo.*`);
  return "> [!danger]- ⚡ Spinte dal grafo (il mondo preme su questo fronte)\n"
    + righe.join("\n")
    + "\n>\n> Una spinta giustifica un segmento: premi **Avanza fronte** o gioca la mossa.";
}

// Cruscotto "Stato del Mondo": TUTTI i Fronti (clock_dim) ordinati per IMMINENZA =
// riempimento del clock + numero di spinte dal grafo che lo premono. Espone il
// differenziatore (la pressione del grafo) a colpo d'occhio per la prep di sessione,
// invece di doverla scoprire una-nota-alla-volta. Ritorna markdown.
async function renderStatoMondo(app, dv) {
  if (!dv) return "*Dataview non attivo.*";
  const fronti = dv.pages()
    .where((p) => p && p.clock_dim != null && Number(p.clock_dim) > 0 && text(p.stato) !== "archiviata")
    .array();
  if (!fronti.length) {
    return "> [!info] Nessun fronte\n> Imposta un **clock** dal tab *Al tavolo* di una nota per accendere un fronte.";
  }
  const rows = [];
  for (const f of fronti) {
    const dim = Math.max(1, Math.floor(Number(f.clock_dim) || 0));
    const cur = Math.max(0, Math.min(dim, Math.floor(Number(f.clock) || 0)));
    const spinte = await spinteFronte(app, dv, f);
    // Imminenza COERENTE (stessa scala di Home e fronti.md.j2): il countdown (clock) è il
    // segnale primario; la PRESSIONE autoriale ora conta (0-10 → peso 0.6, mai sopra un
    // clock pieno); le spinte dal grafo aggiungono slancio (≈ mezzo segmento l'una). Così
    // la dashboard non seppellisce più un Fronte segnato 🔴 Crisi col clock ancora vuoto.
    const pr = Math.max(0, Math.min(10, Number(f.pressione) || 0)) / 10;
    const score = cur / dim + 0.6 * pr + (spinte.length * 0.5) / dim;
    rows.push({ f, dim, cur, spinte, score });
  }
  rows.sort((a, b) => b.score - a.score || b.cur / b.dim - a.cur / a.dim);
  // Cap anti-muro (SYS-3): a scala il cruscotto rendeva un blocco per OGNI fronte
  // (decine di fronti = muro illegibile). Mostra solo i più imminenti; il totale
  // resta visibile nell'intestazione (no silent cap). Per la prep di sessione
  // contano i fronti caldi in cima, non l'elenco esaustivo.
  const TOP = 12;
  // "Caldo" = sta per scattare: ha spinte dal grafo, è al penultimo segmento, O è in
  // pressione di Crisi (≥7) — così la pressione autoriale tinge anche l'icona/stato.
  const caldo = (f, cur, dim, spinte) => spinte.length || cur >= dim - 1 || (Number(f.pressione) || 0) >= 7;
  const blocchi = rows.slice(0, TOP).map(({ f, dim, cur, spinte }) => {
    const pieno = cur >= dim;
    const hot = caldo(f, cur, dim, spinte);
    const icona = pieno ? "🔴" : hot ? "🟠" : "🟢";
    const stato = pieno ? "PIENO — scatena la conseguenza" : hot ? "sta per scattare" : "stabile";
    const next = text(f.prossima_mossa) ? ` · *${text(f.prossima_mossa)}*` : "";
    let blocco = `> ${icona} **${noteLink(f)}** ${cur}/${dim} — ${stato}${next}`;
    for (const s of spinte.slice(0, 2)) blocco += `\n> - ${s}`;
    return blocco;
  });
  const attivi = rows.filter((r) => caldo(r.f, r.cur, r.dim, r.spinte)).length;
  const piuDi = rows.length > TOP ? ` · mostro i ${TOP} più imminenti` : "";
  return `> [!warning] ⚡ Stato del Mondo — **${rows.length} fronti** · ${attivi} sotto pressione${piuDi}\n`
    + "> In ordine di imminenza (clock + spinte dal grafo):\n>\n"
    + blocchi.join("\n>\n");
}

// --- Proiezione (motore J: dry-run del giro del mondo) -----------------------
// Passi del clock per giro dal CALORE (pressione). DEVE combaciare con
// meta_actions.avanzamentoDaPressione (la proiezione mente se divergono → lo impone il
// guard test test_forecast_heat_allineato). Stesse bande di pressureLabel (≥7 / ≥4).
function forecastHeat(pressione) {
  const p = Number(pressione) || 0;
  return p >= 7 ? 2 : p >= 4 ? 1 : 0;
}

// PROIEZIONE: «dove va il mondo se premi Avanza?». Per ogni Fronte stima in QUANTI giri
// scatta al ritmo attuale (calore costante: ceil((dim-clock)/passi)), ordina per imminenza,
// e per chi scatta anticipa l'ONDA (lookahead a 1 passo: chi spingerà, sulle stesse relazioni
// di tensione della cascata). READ-ONLY: è il dry-run del tick — guardi il futuro prima di
// committerlo. Stima a calore costante (le onde reali possono accelerare il resto). Markdown.
async function renderProiezione(app, dv) {
  if (!dv) return "*Dataview non attivo.*";
  const fronti = dv.pages()
    .where((p) => p && p.clock_dim != null && Number(p.clock_dim) > 0 && text(p.stato) !== "archiviata")
    .array();
  if (!fronti.length) {
    return "> [!info] Niente da proiettare\n> Imposta un **clock** su una nota per vedere dove va il mondo.";
  }
  const TENS = ["conseguenza_su", "confina_con", "rivali", "alleati", "controllata_da", "fazioni"];
  const righe = fronti.map((f) => {
    const dim = Math.max(1, Math.floor(Number(f.clock_dim) || 0));
    const cur = Math.max(0, Math.min(dim, Math.floor(Number(f.clock) || 0)));
    const passi = forecastHeat(f.pressione);
    const eta = passi > 0 ? Math.ceil((dim - cur) / passi) : Infinity;
    const bersagli = [];
    if (Number.isFinite(eta)) {
      const seen = new Set([f.file ? f.file.name : ""]);
      for (const campo of TENS)
        for (const link of asArray(f[campo])) {
          const o = resolve(dv, link);
          if (o && o.file && !seen.has(o.file.name)) { seen.add(o.file.name); bersagli.push(noteLink(o)); }
        }
    }
    return { f, dim, cur, passi, eta, bersagli };
  }).sort((a, b) => (a.eta - b.eta) || 0);
  const TOP = 12;
  const blocchi = righe.slice(0, TOP).map(({ f, dim, cur, passi, eta, bersagli }) => {
    if (!Number.isFinite(eta)) return `> 🟢 *fermo* — **${noteLink(f)}** ${cur}/${dim} (Calma: non avanza da solo)`;
    const quando = eta <= 1 ? "**al prossimo giro**" : `tra **${eta} giri**`;
    const cons = text(f.conseguenza) ? ` → ${text(f.conseguenza)}` : "";
    let b = `> ${eta <= 1 ? "🔴" : "🟠"} ${quando} — **${noteLink(f)}** ${cur}/${dim} *(+${passi}/giro)*${cons}`;
    if (bersagli.length) b += `\n> ↳ *l'onda spingerà* ${bersagli.slice(0, 4).join(", ")}`;
    return b;
  });
  const prossimi = righe.filter((r) => Number.isFinite(r.eta) && r.eta <= 1).length;
  const piuDi = righe.length > TOP ? ` · i ${TOP} più vicini` : "";
  return `> [!abstract]- 🔮 Proiezione — al ritmo attuale (${prossimi} scattano al prossimo giro)${piuDi}\n`
    + "> *Dove va il mondo se premi «Avanza il mondo»: stima a calore costante; le onde possono accelerare il resto.*\n>\n"
    + blocchi.join("\n>\n");
}

// --- Tensioni latenti (motore G: il mondo propone i propri Fronti) -----------
// Scandisce il grafo per i CONFLITTI strutturali che non sono ancora un Fronte e li
// propone come orologi pronti: rivalità inerti, risorse contese, profezie dormienti,
// confini caldi. Read-only: suggerisce (chi, perché, conseguenza pre-compilata), il GM
// accende il clock sull'entità indicata. Così il mondo si ALIMENTA di tensioni invece di
// aspettare che le scriva tu. Ritorna markdown.
async function renderTensioni(app, dv) {
  if (!dv) return "*Dataview non attivo.*";
  const pages = dv.pages().where((p) => p && p.file && text(p.stato) !== "archiviata").array();
  const isFronte = (p) => p && Number(p.clock_dim) > 0;
  const nome = (p) => (p && p.file ? p.file.name : "");
  const sugg = [];
  const seen = new Set();
  const addOnce = (key, line) => { if (!seen.has(key)) { seen.add(key); sugg.push(line); } };

  // P1 — Rivalità inerte: A rivali B, e nessuno dei due è già un Fronte → vuole un orologio.
  for (const p of pages) {
    if (isFronte(p)) continue;
    for (const link of asArray(p.rivali)) {
      const o = resolve(dv, link);
      if (!o || !o.file || isFronte(o)) continue;
      addOnce("riv:" + [nome(p), nome(o)].sort().join("|"),
        `> 🔥 **${noteLink(p)} ⚔ ${noteLink(o)}** — rivalità senza orologio. Accendi un Fronte su ${noteLink(p)} *(suggerito: clock 6 · conseguenza «${nome(o)} incassa un colpo»)*.`);
    }
  }
  // P2 — Risorsa contesa: una risorsa è di X, ma X ha dei rivali che la vogliono.
  for (const p of pages.filter((x) => text(x.categoria) === "risorsa")) {
    const ctrl = resolve(dv, p.controllata_da);
    if (!ctrl || !ctrl.file) continue;
    const rivali = asArray(ctrl.rivali).map((l) => resolve(dv, l)).filter((o) => o && o.file);
    if (!rivali.length) continue;
    addOnce("ris:" + nome(p),
      `> 💎 **${noteLink(p)}** è di ${noteLink(ctrl)}, ma ${rivali.slice(0, 2).map(noteLink).join(", ")} la vogliono. Accendi una «corsa a ${nome(p)}» *(clock 4)*.`);
  }
  // P3 — Profezia dormiente: una profezia non ancora un Fronte → il suo compiersi è un clock.
  for (const p of pages.filter((x) => text(x.categoria) === "profezia" && !isFronte(x))) {
    addOnce("prof:" + nome(p),
      `> 🔮 **${noteLink(p)}** è una profezia senza orologio. Accendi un Fronte: il suo compiersi è il clock *(suggerito: 8 · conseguenza = ciò che predice)*.`);
  }
  // P4 — Confine caldo: due luoghi confinanti controllati da fazioni RIVALI tra loro.
  for (const p of pages.filter((x) => text(x.categoria) === "luogo")) {
    const cp = resolve(dv, p.controllata_da);
    if (!cp || !cp.file) continue;
    const rivaliCp = asArray(cp.rivali).map((l) => nome(resolve(dv, l)));
    for (const link of asArray(p.confina_con)) {
      const q = resolve(dv, link);
      if (!q || !q.file) continue;
      const cq = resolve(dv, q.controllata_da);
      if (!cq || !cq.file || nome(cp) === nome(cq) || !rivaliCp.includes(nome(cq))) continue;
      addOnce("conf:" + [nome(p), nome(q)].sort().join("|"),
        `> 🗺 Confine caldo: **${noteLink(p)}** (${noteLink(cp)}) ⟷ **${noteLink(q)}** (${noteLink(cq)}), fazioni rivali. Accendi un Fronte di frontiera *(clock 6)*.`);
    }
  }

  if (!sugg.length) {
    return "> [!tip]- 🌱 Tensioni latenti\n> Nessun conflitto latente nel grafo. Collega *rivali*, risorse *controllate*, *profezie* e *confini* di fazioni rivali per farne emergere.";
  }
  const TOP = 10;
  const righe = sugg.slice(0, TOP);
  if (sugg.length > TOP) righe.push(`> - *…e altre ${sugg.length - TOP} tensioni.*`);
  return `> [!tip]- 🌱 Tensioni latenti — ${sugg.length} conflitti che vogliono un orologio\n`
    + "> Il grafo propone i suoi Fronti: accendi un clock sull'entità indicata (tab *Al tavolo*).\n>\n"
    + righe.join("\n>\n");
}

// --- Memoria (il mondo ricorda) ----------------------------------------------
// Apri una nota: riemerge la STORIA che l'ha toccata — gli eventi (specie le conseguenze
// che B+A generano in continuazione) che la citano, in ordine cronologico. Legge gli inlink
// filtrati a eventi (connessioni/luogo/fazioni/coinvolti/conseguenza_su risolvono qui). Le
// conseguenze sono marcate ⚑. Read-only; "" se nessun evento la tocca → invisibile dove non
// c'è storia (così la si può innestare ovunque). Ritorna markdown.
async function renderMemoria(app, dv, page) {
  if (!dv || !page || !page.file) return "";
  const eventi = asArray(page.file.inlinks)
    .map((l) => resolve(dv, l))
    .filter((e) => e && e.file && text(e.categoria) === "evento" && text(e.stato) !== "archiviata");
  if (!eventi.length) return "";
  const righe = eventi.slice()
    .sort((a, b) => cmpQuando(a.quando, b.quando))
    .map((e) => `> - ${text(e.tipo) === "conseguenza" ? "⚑ " : ""}**${text(e.quando) || "—"}** ${noteLink(e)}`);
  return `> [!quote]- 📜 Memoria — ${eventi.length} ${eventi.length === 1 ? "evento" : "eventi"} che hanno toccato questa nota\n`
    + righe.join("\n");
}

// --- Catena causale (timeline causale) ---------------------------------------
// Per un evento ricostruisce PERCHÉ è successo (risalendo causato_da) e COSA NE È
// DERIVATO (scendendo per conseguenze). Le due direzioni sono complementari: con
// la macro Collega l'inverso è scritto automaticamente, ma qui le uniamo (causa =
// causato_da ∪ eventi-che-mi-elencano-in-conseguenze) così la catena si
// ricostruisce anche se solo un lato è stato compilato a mano. Cicli protetti
// (visited condiviso). Ritorna markdown (liste annidate, i [[link]] si rendono).
async function renderCausalita(app, dv, page) {
  if (!dv || !page || !page.file) return "*Apri una scheda evento.*";
  const eventi = dv.pages()
    .where((p) => p && p.file && text(p.categoria) === "evento" && text(p.stato) !== "archiviata")
    .array();
  const byName = new Map(eventi.map((p) => [p.file.name, p]));
  const nameOf = (link) => { const p = resolve(dv, link); return p && p.file ? p.file.name : null; };
  const causes = new Map(), effects = new Map();
  const link = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); if (v) m.get(k).add(v); };
  for (const e of eventi) {
    const en = e.file.name;
    for (const l of asArray(e.causato_da)) { const c = nameOf(l); if (c) { link(causes, en, c); link(effects, c, en); } }
    for (const l of asArray(e.conseguenze)) { const c = nameOf(l); if (c) { link(effects, en, c); link(causes, c, en); } }
  }
  const self = page.file.name;
  const tree = (map, root) => {
    const lines = [], seen = new Set([root]);
    const walk = (name, depth) => {
      const kids = [...(map.get(name) ?? [])].sort((a, b) =>
        cmpQuando((byName.get(a) || {}).quando, (byName.get(b) || {}).quando));
      for (const k of kids) {
        if (seen.has(k)) continue;
        seen.add(k);
        const quando = text((byName.get(k) || {}).quando);
        lines.push(`${"  ".repeat(depth)}- ${quando ? `**${quando}** ` : ""}[[${k}]]`);
        walk(k, depth + 1);
      }
    };
    walk(root, 0);
    return lines;
  };
  const su = tree(causes, self), giu = tree(effects, self);
  if (!su.length && !giu.length) {
    return "> [!tip] Nessuna catena causale\n> Collega questo evento ad altri con **Causato da** (le cause a monte) o **Conseguenze** (cosa ha innescato). La catena si ricostruisce in entrambe le direzioni da sé.";
  }
  const blocks = [];
  if (su.length) blocks.push("**⬆ Perché è successo** *(cause a monte)*\n" + su.join("\n"));
  if (giu.length) blocks.push("**⬇ Cosa ne è derivato** *(conseguenze a valle)*\n" + giu.join("\n"));
  return blocks.join("\n\n");
}

