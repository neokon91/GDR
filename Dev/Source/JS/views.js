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

function renderEntityPanel(dv, page) {
  const root = dv.el("div", "", { cls: "gdr-grid" });
  root.innerHTML = [
    card("Uso al tavolo", text(page.uso_al_tavolo), page.uso_al_tavolo ? "ready" : "missing"),
    card("Prossima mossa", text(page.prossima_mossa), page.prossima_mossa ? "ready" : "missing"),
    card("Connessioni", asArray(page.connessioni).join(", "), asArray(page.connessioni).length ? "ready" : "missing")
  ].join("");
}

function renderSessionPanel(dv, page) {
  const root = dv.el("div", "", { cls: "gdr-grid" });
  root.innerHTML = [
    card("Obiettivo", text(page.obiettivo), page.obiettivo ? "ready" : "missing"),
    card("Scena corrente", text(page.scena_corrente || page.apertura), "ready"),
    card("Ancore", asArray(page.connessioni).join(", "), asArray(page.connessioni).length ? "ready" : "missing")
  ].join("");
}
