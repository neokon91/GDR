function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function text(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "").trim();
}

function card(title, body, cls = "") {
  return `<div class="gdr-card ${cls}"><strong>${title}</strong><br>${body || "Da compilare."}</div>`;
}

// Etichetta di rischio dalla pressione 0-10 (coerente con la macro tavolo()).
function pressureLabel(value) {
  const p = Number(value);
  if (!Number.isFinite(p)) return "—";
  if (p >= 7) return `🔴 Crisi (${p})`;
  if (p >= 4) return `🟠 Tensione (${p})`;
  return `🟢 Calma (${p})`;
}

// Reciprocita': chi cita questa nota (le relazioni in frontmatter sono
// unidirezionali; i backlink danno il senso inverso). Raggruppa per categoria,
// mostra la pressione: "chi dipende da me e quanto scotta".
function renderBacklinks(dv, page) {
  const links = asArray(page.file && page.file.inlinks)
    .map(link => { try { return dv.page(link.path ?? link); } catch (e) { return null; } })
    .filter(Boolean);
  if (!links.length) {
    dv.paragraph("*Nessuna nota lo cita ancora.*");
    return;
  }
  const rows = links
    .map(p => [p.file.link, text(p.categoria) || "—", pressureLabel(p.pressione)])
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  dv.paragraph("**Citato da:**");
  dv.table(["Nota", "Categoria", "Pressione"], rows);
}

// Pannello "pronto al tavolo?": stato della superficie giocabile a colpo d'occhio.
// Non duplica i tab di input: mostra COSA manca per usare la nota in scena, poi
// la reciprocita' (chi la cita).
function renderEntityPanel(dv, page) {
  const root = dv.el("div", "", { cls: "gdr-grid" });
  root.innerHTML = [
    card("Uso al tavolo", text(page.uso_al_tavolo), page.uso_al_tavolo ? "ready" : "missing"),
    card("Gancio", text(page.gancio), page.gancio ? "ready" : "missing"),
    card("Pressione", pressureLabel(page.pressione), Number(page.pressione) >= 7 ? "missing" : "ready"),
    card("Prossima mossa", text(page.prossima_mossa), page.prossima_mossa ? "ready" : "missing")
  ].join("");
  renderBacklinks(dv, page);
}

// Risolve i link di una pagina ed estrae i "fronti": pressione + prossima mossa,
// ordinati per pressione decrescente (cosa preme di piu').
function frontsFromLinks(dv, links) {
  return asArray(links)
    .map(link => { try { return dv.page(link.path ?? link); } catch (e) { return null; } })
    .filter(p => p && p.prossima_mossa)
    .map(p => ({ link: p.file.link, pressione: Number(p.pressione) || 0, mossa: text(p.prossima_mossa) }))
    .sort((a, b) => b.pressione - a.pressione);
}

// Pannello sessione: obiettivo/scena + i FRONTI delle entita' collegate, cosi'
// il DM vede in un colpo d'occhio cosa preme questa sessione.
function renderSessionPanel(dv, page) {
  const root = dv.el("div", "", { cls: "gdr-grid" });
  root.innerHTML = [
    card("Obiettivo", text(page.obiettivo), page.obiettivo ? "ready" : "missing"),
    card("Scena corrente", text(page.scena_corrente || page.apertura), "ready")
  ].join("");
  const fronts = frontsFromLinks(dv, page.connessioni);
  if (fronts.length) {
    dv.paragraph("**Fronti collegati** — cosa preme adesso:");
    dv.table(["Entità", "Pressione", "Prossima mossa"],
      fronts.map(f => [f.link, pressureLabel(f.pressione), f.mossa]));
  }
}
