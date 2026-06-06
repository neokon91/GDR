// --- Clock & conseguenze: orologio a segmenti (progress-clock) ---------------
// SVG di un orologio a N segmenti, i primi `filled` pieni. Nessuna dipendenza.
function clockSvg(n, filled) {
  n = Math.max(1, Math.floor(Number(n) || 0));
  filled = Math.max(0, Math.min(n, Math.floor(Number(filled) || 0)));
  const R = 34, cx = 40, cy = 40, sectors = [];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = polarPoint(cx, cy, R, (360 / n) * i);
    const [x1, y1] = polarPoint(cx, cy, R, (360 / n) * (i + 1));
    const large = 360 / n > 180 ? 1 : 0;
    const col = i < filled ? "var(--color-red, #c94040)" : "var(--background-modifier-border, #d0d0d0)";
    sectors.push(`<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${col}" stroke="var(--background-primary,#fff)" stroke-width="1.5"/>`);
  }
  return `<svg viewBox="0 0 80 80" class="gdr-clock-svg" width="88" height="88" xmlns="http://www.w3.org/2000/svg">${sectors.join("")}</svg>`;
}

// Disegna l'orologio del fronte corrente (clock_dim segmenti, clock pieni).
async function renderClock(container, app, page) {
  if (!page) { container.createEl("p", { text: "Apri la nota per il clock.", cls: "gdr-radar-empty" }); return; }
  const n = Math.floor(Number(page.clock_dim) || 0);
  if (!n) {
    container.createEl("p", { text: "Imposta i segmenti del clock per tracciare questo fronte.", cls: "gdr-radar-empty" });
    return;
  }
  const filled = Math.max(0, Math.min(n, Math.floor(Number(page.clock) || 0)));
  const wrap = container.createEl("div", { cls: "gdr-clock" });
  wrap.innerHTML = clockSvg(n, filled);
  container.createEl("p", { cls: "gdr-clock-label",
    text: filled >= n ? `⚠️ Clock PIENO (${filled}/${n}) — scatena la conseguenza` : `Clock ${filled}/${n}` });
}

// --- Difficoltà incontri (DMG 2024) ------------------------------------------
// XP di una creatura: 'pe' diretto (mostri SRD) o derivato dal 'gs' via cr_xp.
function xpForCreature(p, core) {
  if (p && p.pe != null && Number(p.pe) > 0) return Number(p.pe);
  const cr = (core.xp || {}).cr_xp || {};
  const gs = p && p.gs != null ? String(p.gs) : "";
  return Number(cr[gs] || 0);
}

// Pannello difficoltà (markdown): budget del gruppo vs XP totale delle creature
// collegate + la lista pronta per il blocco `encounter` (Initiative Tracker).
async function renderEncounter(app, dv, page) {
  if (!page || !dv) return "*Dataview non attivo o nessuna nota.*";
  const core = await loadCoreData(app);
  const xp = core.xp || {};
  const liv = Math.max(0, Math.min(20, Math.floor(Number(page.pg_livello) || 0)));
  const num = Math.max(0, Math.floor(Number(page.pg_numero) || 0));
  const creature = asArray(page.creature).map((l) => resolve(dv, l)).filter(Boolean);
  let totale = 0;
  const counts = {};
  const righe = [];
  for (const c of creature) {
    const x = xpForCreature(c, core);
    totale += x;
    const nome = c.file ? c.file.name : (c.nome || "—");
    counts[nome] = (counts[nome] || 0) + 1;
    righe.push(`- ${nome}: GS ${c.gs != null ? c.gs : "?"} · ${x} PE`);
  }
  let out = "> [!abstract] Difficoltà incontro\n";
  if (!liv || !num) {
    out += "> Imposta **Livello del gruppo** e **Numero di PG** (tab Scena / Proprietà) per la stima.\n";
  } else {
    const b = (xp.budget_2024 || {})[String(liv)] || [0, 0, 0];
    const bassa = b[0] * num, mod = b[1] * num, alta = b[2] * num;
    // Difficoltà 2024 (DMG): solo Bassa/Moderata/Alta (niente tier "Mortale", abolito
    // nel 2024). Oltre il budget Alta non è un tier: lo segnaliamo come avviso.
    let label = "Banale";
    if (totale >= alta) label = totale > alta * 1.5 ? "Alta ⚠️ (oltre budget)" : "Alta";
    else if (totale >= mod) label = "Moderata";
    else if (totale >= bassa) label = "Bassa";
    out += `> Gruppo: **${num}× liv ${liv}** · XP nemici: **${totale}**\n>\n`;
    out += `> Budget: Bassa ${bassa} · Moderata ${mod} · Alta ${alta}\n>\n`;
    out += `> → **Difficoltà: ${label}**\n`;
  }
  const dettaglio = righe.length ? "\n\n" + righe.join("\n")
    : "\n\n*Collega le creature (tab Collegamenti) per la stima.*";
  const blocco = Object.keys(counts).length
    ? "\n\n**Per il blocco `encounter`** (copia sotto `creatures:`):\n```\n"
      + Object.entries(counts).map(([n, q]) => `  - ${q}: ${n}`).join("\n") + "\n```"
    : "";
  return out + dettaglio + blocco;
}

