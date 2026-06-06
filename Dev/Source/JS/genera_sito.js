// Esportatore «sito dei giocatori» a runtime, DENTRO Obsidian (niente Python né
// terminale): un GM non-tecnico clicca un bottone e ottiene un sito statico HTML
// spoiler-free e read-only, da aprire/pubblicare. Gemello-JS di build_site.py
// (render.py): STESSE regole di filtro/stripping/markdown→HTML/modello-pagina. Un
// test di parità impone che, sugli stessi dati, JS e Python diano lo stesso modello
// di pagina e lo stesso HTML-di-sezione (così le due non divergono). Autonomo
// (script Templater → tp.user.genera_sito), builder PURO testabile a parte.

// --- costanti (gemelle di build_site.py) ------------------------------------
const WORLD_DIR = "Mondi";
const SKIP_CATEGORIES = new Set(["sessione", "incontro", "insidia"]);
const HIDE_VISIBILITY = new Set(["dm", "gm", "master", "privato", "segreto"]);
const REVEAL_TIERS = ["pubblico", "incontrato", "segreto"];
const REVEAL_RANK = { pubblico: 0, incontrato: 1, segreto: 2 };
const IMG_EXT = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

const CATEGORY_LABELS = {
  luogo: "Luoghi", fazione: "Fazioni", cultura: "Culture", divinita: "Divinità",
  specie: "Specie", regno: "Regni", evento: "Eventi", personaggio: "Personaggi",
  creatura: "Creature", oggetto: "Oggetti", risorsa: "Risorse", mito: "Miti",
  culto: "Culti", profezia: "Profezie", epoca: "Epoche", bioma: "Biomi",
  lingua: "Lingue", istituzione: "Istituzioni", cosmologia: "Cosmologia",
  piano: "Piani", mondo: "Mondo", bastione: "Bastioni", incantesimo: "Incantesimi",
  classe: "Classi", sottoclasse: "Sottoclassi", talento: "Talenti", background: "Background",
};

const NEVER_FACT = new Set(["tags", "cssclasses", "stato", "visibilita", "pubblico",
  "banner", "ritratto", "mappa", "coord", "uso_al_tavolo", "gancio", "prossima_mossa",
  "pressione", "conseguenza", "conseguenza_su", "clock", "clock_dim", "tensione",
  "segreto", "player_safe", "nome", "categoria", "tipo", "mondo", "rivelazione"]);

const DROP_HEADINGS = new Set(["collegamenti", "connessioni", "relazioni", "carattere",
  "vista", "al tavolo", "viaggio", "mappa"]);

// --- reveal tier ------------------------------------------------------------
function noteRevealRank(fm) {
  return REVEAL_RANK[String((fm || {}).rivelazione || "").trim().toLowerCase()] || 0;
}
function buildRevealRank(reveal) {
  const r = String(reveal || "pubblico").trim().toLowerCase();
  if (r === "tutto" || r === "all") return REVEAL_TIERS.length - 1;
  return REVEAL_RANK[r] || 0;
}

// --- filtro nota ------------------------------------------------------------
function isPublic(fm) {
  fm = fm || {};
  if (fm.pubblico === false) return false;
  if (HIDE_VISIBILITY.has(String(fm.visibilita || "").trim().toLowerCase())) return false;
  const cat = fm.categoria;
  return Boolean(cat) && !SKIP_CATEGORIES.has(cat);
}

// --- pulizia corpo (note-esempio: prosa inline) -----------------------------
const RE_TEMPLATER = /<%[\s\S]*?%>/g;
const RE_METABIND = /`?(?:INPUT|VIEW|BUTTON)\[[^\]]*\][^`\n]*`?/g;
const RE_DVINLINE = /`=[^`]*`/g;
const RE_DICE = /`dice(?:-mod)?:[^`]*`/g;
const RE_FENCE = /^(`{3,}|~{3,})/;
const RE_RIVELA = /^>\s*\[!rivela(?:\|([a-z]+))?\]-?\s*(.*)$/i;

function stripBody(body, revealLevel = 0) {
  body = String(body || "").replace(RE_TEMPLATER, "");
  const out = [];
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = RE_FENCE.exec(line.trim());
    if (fence) {  // salta l'intero blocco recintato
      const marker = fence[1];
      i += 1;
      const close = marker[0].repeat(marker.length);
      while (i < lines.length && !lines[i].trim().startsWith(close)) i += 1;
      i += 1;
      continue;
    }
    const stripped = line.trim();
    if (stripped.startsWith(">")) {  // callout / blockquote
      const block = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith(">")) { block.push(lines[j]); j += 1; }
      i = j;
      const riv = RE_RIVELA.exec(block[0].trim());
      if (riv) {  // callout di rivelazione: svela se il tier è già raggiunto
        const tier = REVEAL_RANK[(riv[1] || "incontrato").toLowerCase()] ?? 1;
        if (tier <= revealLevel) {
          if (riv[2].trim()) out.push(`### ${riv[2].trim()}`);
          for (const bl of block.slice(1)) {
            const content = bl.replace(/^\s*>\s?/, "").replace(/\s+$/, "");
            if (content) out.push(content);
          }
        }
      }
      continue;  // callout non-rivela (o non svelato): scartato per intero
    }
    if (stripped.startsWith("# ")) { i += 1; continue; }  // H1 = titolo (rigenerato)
    const m = /^#{2,6}\s+(.*)$/.exec(stripped);
    if (m && DROP_HEADINGS.has(m[1].trim().toLowerCase().replace(/:+$/, ""))) { i += 1; continue; }
    out.push(line);
    i += 1;
  }
  let text = out.join("\n");
  text = text.replace(RE_METABIND, "").replace(RE_DVINLINE, "").replace(RE_DICE, "");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

// --- Markdown → HTML (sottoinsieme mirato, gemello di markdown_to_html) ------
const RE_WIKIIMG = /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const RE_MDIMG = /!\[([^\]]*)\]\(([^)]+)\)/g;
const RE_WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const RE_MDLINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const RE_BOLD = /\*\*([^*]+)\*\*/g;
const RE_ITALIC = /(?<!\*)\*([^*\n]+)\*(?!\*)|_([^_\n]+)_/g;
const RE_CODE = /`([^`]+)`/g;
const RE_OL_ITEM = /^\d+\.\s+/;

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function stem(name) {  // basename senza estensione
  const base = String(name).split("/").pop();
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

function inlineMd(text, link, image) {
  link = link || (() => null);
  image = image || (() => null);
  const codes = [];
  const holds = [];
  text = String(text).replace(RE_CODE, (_m, g1) => { codes.push(esc(g1)); return `\x00C${codes.length - 1}\x00`; });
  text = esc(text);
  const hold = (html) => { holds.push(html); return `\x00H${holds.length - 1}\x00`; };
  // immagini prima dei link (consumano il '!')
  text = text.replace(RE_WIKIIMG, (_m, g1, g2) => {
    const name = g1.trim();
    const src = image(name);
    const alt = (g2 || stem(name).replace(/_/g, " ")).trim();
    return src ? hold(`<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`) : "";
  });
  text = text.replace(RE_MDIMG, (_m, g1, g2) => {
    const src = image(g2.trim());
    return src ? hold(`<img src="${esc(src)}" alt="${esc(g1.trim())}" loading="lazy">`) : "";
  });
  text = text.replace(RE_WIKILINK, (_m, g1, g2) => {
    const target = g1.trim(), alias = (g2 || g1).trim();
    const href = link(target);
    return href ? `<a href="${href}">${esc(alias)}</a>` : esc(alias);
  });
  text = text.replace(RE_MDLINK, (_m, g1, g2) =>
    (g2.startsWith("http://") || g2.startsWith("https://"))
      ? `<a href="${esc(g2)}" rel="noopener">${esc(g1)}</a>` : esc(g1));
  text = text.replace(RE_BOLD, "<strong>$1</strong>");
  text = text.replace(RE_ITALIC, (_m, g1, g2) => `<em>${g1 || g2}</em>`);
  codes.forEach((code, idx) => { text = text.replace(`\x00C${idx}\x00`, `<code>${code}</code>`); });
  holds.forEach((html, idx) => { text = text.replace(`\x00H${idx}\x00`, html); });
  return text;
}

function mdToHtml(md, link, image) {
  link = link || (() => null);
  md = String(md || "").trim();
  if (!md) return "";
  const html = [];
  for (let block of md.split(/\n\s*\n/)) {
    block = block.replace(/^\n+|\n+$/g, "");
    if (!block) continue;
    const first = block.replace(/^\s+/, "");
    const h = /^(#{2,6})\s+(.*)$/.exec(first);
    if (h && !block.includes("\n")) {
      const level = Math.min(h[1].length, 6);
      html.push(`<h${level}>${inlineMd(h[2].trim(), link, image)}</h${level}>`);
      continue;
    }
    const lines = block.split("\n").map((ln) => ln.trim()).filter((ln) => ln);
    if (lines.length && lines.every((ln) => /^[-*]\s+/.test(ln))) {
      const items = lines.map((ln) => `<li>${inlineMd(ln.slice(2).trim(), link, image)}</li>`).join("");
      html.push(`<ul>${items}</ul>`);
      continue;
    }
    if (lines.length && lines.every((ln) => RE_OL_ITEM.test(ln))) {
      const items = lines.map((ln) => `<li>${inlineMd(ln.replace(RE_OL_ITEM, ""), link, image)}</li>`).join("");
      html.push(`<ol>${items}</ol>`);
      continue;
    }
    const para = block.split("\n").filter((ln) => ln.trim())
      .map((ln) => inlineMd(ln, link, image)).join("<br>\n");
    html.push(`<p>${para}</p>`);
  }
  return html.join("\n");
}

// --- modello di pagina (gemello di page_model) ------------------------------
function cleanLink(value) {
  const out = [];
  for (const item of (Array.isArray(value) ? value : [value])) {
    if (!item) continue;
    const s = String(item);
    let m;
    const re = new RegExp(RE_WIKILINK.source, "g");
    while ((m = re.exec(s)) !== null) out.push(m[1].trim());
    if (!s.includes("[[")) out.push(s.trim());
  }
  return out.filter((x) => x);
}

function slugify(name) {
  let norm = String(name).normalize("NFKD").replace(/[̀-ͯ]/g, "");
  norm = norm.replace(/[^\w\s-]/g, "").trim().toLowerCase();
  return norm.replace(/[\s_-]+/g, "-") || "nota";
}

function capitalize(s) {
  s = String(s || "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function pageModel(core, fm, body, name, link, image, revealLevel = 0) {
  fm = fm || {};
  const cat = fm.categoria || "";
  const fields = core.fields || {};
  const img = image || (() => null);

  let portrait = null;
  const rit = cleanLink(fm.ritratto);
  if (rit.length) portrait = img(rit[0]);

  const facts = [];
  if (fm.tipo) facts.push({ label: "Tipo", value: esc(String(fm.tipo)) });
  for (const fid of ((core.scheda || {})[cat] || [])) {
    const val = fm[fid];
    if (val && !NEVER_FACT.has(fid)) {
      const label = ((fields[fid] || {}).label) || capitalize(fid);
      facts.push({ label: esc(label), value: esc(String(val)) });
    }
  }

  const sections = [];
  if (fm.player_safe) sections.push({ heading: "", html: mdToHtml(String(fm.player_safe), link, img) });
  for (const entry of (((core.creation || {})[cat] || {}).body || [])) {
    if (entry.callout) continue;  // es. segreto → DM-only
    const riv = entry.rivelazione;
    if (riv && (REVEAL_RANK[String(riv).trim().toLowerCase()] || 0) > revealLevel) continue;
    const val = fm[entry.field];
    if (entry.heading && val) sections.push({ heading: entry.heading, html: mdToHtml(String(val), link, img) });
  }

  const bodyHtml = mdToHtml(stripBody(body, revealLevel), link, img);
  if (bodyHtml) sections.unshift({ heading: "", html: bodyHtml });

  const rels = [];
  for (const rel of ((core.relazioni || {})[cat] || [])) {
    const targets = cleanLink(fm[rel.field]);
    if (!targets.length) continue;
    rels.push({
      label: rel.label || rel.field,
      targets: targets.map((t) => ({ name: t, href: link(t) })),
    });
  }

  return {
    name, category: cat,
    category_label: CATEGORY_LABELS[cat] || capitalize(cat),
    world: (cleanLink(fm.mondo)[0] || null),
    portrait, facts, sections, relations: rels,
  };
}

// --- template HTML (gemelli di SiteJinja/*.html.j2) -------------------------
function renderPage(page) {
  const facts = page.facts.length
    ? `\n  <table class="facts">\n    ${page.facts.map((f) => `<tr><th>${f.label}</th><td>${f.value}</td></tr>`).join("")}\n  </table>\n  ` : "";
  const sections = page.sections.map((s) =>
    `\n    ${s.heading ? `<h2>${esc(s.heading)}</h2>\n    ` : ""}${s.html}\n  `).join("");
  const relations = page.relations.length ? `\n  <section class="relations">
    <h2>Collegamenti</h2>
    <dl>
      ${page.relations.map((r) => `<dt>${esc(r.label)}</dt>
      <dd>${r.targets.map((t) => t.href ? `<a href="${t.href}">${esc(t.name)}</a>` : esc(t.name)).join(", ")}</dd>`).join("\n      ")}
    </dl>
  </section>\n  ` : "";
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(page.name)} · ${esc(page.world || "Mondo")}</title>
<link rel="stylesheet" href="site.css">
</head>
<body>
<header class="topbar">
  <a class="home" href="index.html">← Indice</a>
  <span class="crumb">${esc(page.world || "Mondo")} · ${esc(page.category_label)}</span>
</header>
<main class="note">
  <h1>${esc(page.name)}</h1>
  ${page.portrait ? `<img class="portrait" src="${page.portrait}" alt="${esc(page.name)}" loading="lazy">` : ""}${facts}${sections}${relations}</main>
<footer class="foot">Sito dei giocatori · sola lettura · senza spoiler · generato dal vault</footer>
</body>
</html>
`;
}

function renderIndex(worlds, total, reveal, daRivelare) {
  const wkeys = Object.keys(worlds);
  const revealLine = reveal ? `\n  <p class="reveal">Rivelazione: <strong>${esc(reveal)}</strong>${daRivelare ? ` · ${daRivelare} ${daRivelare === 1 ? "voce ancora da rivelare" : "voci ancora da rivelare"}` : ""}.</p>` : "";
  const empty = !wkeys.length ? `\n  <p class="empty">Nessuna voce pubblica ancora. Crea note di worldbuilding nel vault e rilancia l'esportazione.</p>` : "";
  const sections = wkeys.map((w) => {
    const cats = worlds[w];
    const catBlocks = Object.keys(cats).map((cat) =>
      `<h3>${esc(cat)}</h3>
    <ul class="notes">
      ${cats[cat].map((n) => `<li><a href="${n.slug}.html">${esc(n.name)}</a></li>`).join("")}
    </ul>`).join("\n    ");
    return `\n  <section class="world">
    <h2>${esc(w)}</h2>
    ${catBlocks}
  </section>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Il mondo — guida dei giocatori</title>
<link rel="stylesheet" href="site.css">
</head>
<body>
<main class="index">
  <h1>Guida dei giocatori</h1>
  <p class="lede">Cosa i personaggi possono sapere del mondo. ${total} voci · sola lettura · senza spoiler.</p>${revealLine}${empty}${sections}
</main>
<footer class="foot">Generato dal vault · segreti e strumenti del DM esclusi · le voci si svelano via via che la campagna procede</footer>
</body>
</html>
`;
}

// --- builder PURO: dato il modello + le note → pagine HTML + indice ----------
// notes = [{ name, fm, body }] (già filtrate is_public dal chiamante). opts:
// { reveal, image }. image(name)→src web|null (iniettato; il runtime lo aggancia al
// vault). Ritorna { pages: {slug: html}, index, slugByName, models, daRivelare }.
function buildSite(core, notes, opts) {
  const o = opts || {};
  const level = buildRevealRank(o.reveal);
  const image = o.image || (() => null);
  const shareable = (notes || []).filter((n) => n && n.name);
  const included = shareable.filter((n) => noteRevealRank(n.fm) <= level);
  const daRivelare = shareable.length - included.length;

  const slugByName = {};
  const used = new Set();
  const pages = [];
  for (const n of included) {
    let slug = slugify(n.name), base = slug, k = 2;
    while (used.has(slug)) { slug = `${base}-${k}`; k += 1; }
    used.add(slug);
    slugByName[n.name.toLowerCase()] = slug;
    pages.push({ name: n.name, fm: n.fm, body: n.body, slug });
  }
  const link = (target) => {
    const slug = slugByName[String(target).trim().toLowerCase()];
    return slug ? `${slug}.html` : null;
  };

  const out = { pages: {}, models: [], slugByName, daRivelare };
  for (const p of pages) {
    const model = pageModel(core, p.fm, p.body, p.name, link, image, level);
    model.slug = p.slug;
    out.models.push(model);
    out.pages[p.slug] = renderPage(model);
  }

  // indice: mondo → categoria → note (ordinato come build_site)
  const worlds = {};
  const sorted = [...out.models].sort((a, b) =>
    a.category_label.localeCompare(b.category_label) || a.name.localeCompare(b.name));
  for (const m of sorted) {
    const wkey = m.world || "Senza mondo";
    (worlds[wkey] = worlds[wkey] || {});
    (worlds[wkey][m.category_label] = worlds[wkey][m.category_label] || []).push(m);
  }
  const revealLabel = REVEAL_TIERS[Math.min(level, REVEAL_TIERS.length - 1)];
  out.index = renderIndex(worlds, out.models.length, revealLabel, daRivelare);
  return out;
}

// --- frontmatter dal testo nota (corpo): per leggere `body` a runtime --------
function splitBody(text) {
  text = String(text || "");
  if (text.startsWith("---")) {
    const parts = text.split("---");
    if (parts.length >= 3) return parts.slice(2).join("---").replace(/^\n+/, "");
  }
  return text;
}

// --- Runtime: genera/aggiorna il sito dei giocatori di un mondo dell'utente ---
async function genera_sito(tp) {
  let core = {};
  try { core = JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json")); } catch (e) { core = {}; }

  // Livello di rivelazione: fin dove svelare ai giocatori.
  const reveal = await tp.system.suggester(
    ["Pubblico — noto da subito", "Incontrato — ciò che i PG hanno scoperto", "Segreto — tutto (anche i colpi di scena)"],
    ["pubblico", "incontrato", "segreto"], false, "Fino a che punto svelare il mondo ai giocatori?");
  if (!reveal) return "";

  // Raccogli le note pubbliche sotto Mondi/ (nome, frontmatter, corpo).
  const files = app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(WORLD_DIR + "/"));
  const notes = [];
  for (const f of files) {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
    if (!isPublic(fm)) continue;
    let raw = "";
    try { raw = await app.vault.read(f); } catch (e) { raw = ""; }
    notes.push({ name: fm.nome || f.basename, fm, body: splitBody(raw) });
  }

  // Resolver immagini: trova il file nel vault, lo segna per la copia, ritorna `media/<file>`.
  const copies = {};   // vaultPath → destName
  const dests = new Set();
  const cache = {};
  const image = (name) => {
    if (name in cache) return cache[name];
    const raw = String(name).trim().split("|")[0].trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) { cache[name] = raw; return raw; }
    let result = null;
    const ext = "." + raw.split(".").pop().toLowerCase();
    if (IMG_EXT.has(ext)) {
      const fname = raw.split("/").pop();
      let src = null;
      if (raw.includes("/") && app.vault.getAbstractFileByPath(raw)) src = raw;
      else if (app.vault.getAbstractFileByPath("Media/" + fname)) src = "Media/" + fname;
      else {
        const hit = app.vault.getFiles().find((x) => x.name === fname);
        src = hit ? hit.path : null;
      }
      if (src) {
        if (src in copies) result = "media/" + copies[src];
        else {
          let dest = fname, st = stem(fname), suf = "." + fname.split(".").pop(), k = 2;
          while (dests.has(dest)) { dest = `${st}-${k}${suf}`; k += 1; }
          dests.add(dest); copies[src] = dest; result = "media/" + dest;
        }
      }
    }
    cache[name] = result;
    return result;
  };

  const site = buildSite(core, notes, { reveal, image });
  const total = Object.keys(site.pages).length;

  // Scrivi il sito in Sito-giocatori/ (cartella nel vault, condivisibile/pubblicabile).
  const OUT = "Sito-giocatori";
  const ad = app.vault.adapter;
  if (!(await ad.exists(OUT))) await ad.mkdir(OUT);
  for (const [slug, html] of Object.entries(site.pages)) await ad.write(`${OUT}/${slug}.html`, html);
  await ad.write(`${OUT}/index.html`, site.index);
  // CSS: copiato dal vault (z.automazioni/site.css, sorgente unica = SiteJinja/site.css).
  try { await ad.write(`${OUT}/site.css`, await ad.read("z.automazioni/site.css")); } catch (e) { /* css opzionale */ }
  // Asset-immagine referenziati → Sito-giocatori/media/.
  if (Object.keys(copies).length) {
    if (!(await ad.exists(`${OUT}/media`))) await ad.mkdir(`${OUT}/media`);
    for (const [srcPath, dest] of Object.entries(copies)) {
      try { await ad.writeBinary(`${OUT}/media/${dest}`, await ad.readBinary(srcPath)); } catch (e) { /* salta asset mancante */ }
    }
  }

  new Notice(`Sito dei giocatori: ${total} pagine in «${OUT}/». Apri ${OUT}/index.html nel browser (clic destro → mostra nel Finder).`);
  return "";
}

// Esposti per i test (parità col Python build_site.py).
genera_sito.buildSite = buildSite;
genera_sito.pageModel = pageModel;
genera_sito.stripBody = stripBody;
genera_sito.mdToHtml = mdToHtml;
genera_sito.isPublic = isPublic;
genera_sito.slugify = slugify;
module.exports = genera_sito;
