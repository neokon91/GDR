// Statblock NATIVO di un mostro (sostituisce Fantasy Statblocks per la consultazione) +
// il lookup di un mostro nel bestiario, TOLLERANTE alla migrazione degli id.
import { App, MarkdownRenderer, MarkdownRenderChild, Modal } from "obsidian";
import { daMostro } from "../regole/src/motore/combattente";
import type { InPlancia } from "../regole/src/motore/motore";

// Modificatore di caratteristica, formattato col segno (+3, -1, +0).
export function modCar(valore: number): string {
  const m = Math.floor((valore - 10) / 2);
  return m >= 0 ? `+${m}` : String(m);
}

// Trova un mostro nel bestiario tollerando lo stato della migrazione archivio: per id
// esatto, poi per SLUG (ultimo segmento dopo il `.`, così `aboleth` trova `dnd.monster.aboleth`
// e viceversa), infine per nome (case-insensitive).
export function trovaMostro(bestiario: any[], chiave: string): any | undefined {
  if (!chiave) return undefined;
  const k = chiave.toLowerCase();
  return bestiario.find((m) => m.id === chiave)
    ?? bestiario.find((m) => String(m.id).split(".").pop() === chiave)
    ?? bestiario.find((m) => String(m.nome).toLowerCase() === k);
}

// Rende uno statblock completo dentro un host (Modal o blocco ```gdr statblock) da `raw` (il
// .monster.yaml completo del bestiario). PF/condizioni correnti dal combattente in plancia se
// presente; i tiri salvezza dai numeri già risolti da `daMostro`. Con `md` (app+component) la
// prosa di tratti/azioni è resa come Markdown (corsivi/grassetti/[[wikilink]]).
export function renderStatblock(host: HTMLElement, m: any, comb?: InPlancia, md?: { app: App; component: any; sourcePath?: string }) {
  const c = host;
  c.addClass("gdr-sb");
  const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  c.createEl("h2", { cls: "gdr-sb-nome", text: String(m.nome ?? "?") });
  const sotto = [m.taglia, m.tipo, m.allineamento].filter(Boolean).join(", ");
  if (sotto) c.createEl("div", { cls: "gdr-sb-sotto", text: sotto });

  // Testata difensiva: CA · PF · Velocità.
  const testa = c.createDiv({ cls: "gdr-sb-blocco" });
  // Con un combattente in plancia: PF correnti/max. Senza (blocco in nota): i PF
  // massimi calcolati dal motore (daMostro), come nello statblock a riposo.
  let pf = "?";
  try { pf = comb ? `${comb.pf_attuali}/${comb.pf_max}` : String(daMostro(m).pf_max ?? "?"); } catch { /* dati incompleti */ }
  const riga = (etich: string, val: string) => { const p = testa.createEl("div"); p.createEl("strong", { text: `${etich} ` }); p.appendText(val); };
  riga("CA", String(n((m.ca ?? {}).valore)));
  riga("PF", String(pf));
  const vel = m.velocita ? Object.entries(m.velocita).map(([k, v]) => (k === "camminata" ? `${v} m` : `${k} ${v} m`)).join(", ") : "";
  if (vel) riga("Velocità", vel);

  // Caratteristiche: valore (mod) + eventuale TS.
  const abil = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
  const grid = c.createDiv({ cls: "gdr-sb-car" });
  for (const a of abil) {
    const v = n((m.caratteristiche ?? {})[a]?.valore ?? 10);
    const ts = comb?.tiri_salvezza?.[a];
    const cell = grid.createDiv({ cls: "gdr-sb-carcell" });
    cell.createDiv({ cls: "gdr-sb-carnome", text: a.slice(0, 3).toUpperCase() });
    cell.createDiv({ cls: "gdr-sb-carval", text: `${v} (${modCar(v)})` });
    if (ts != null) cell.createDiv({ cls: "gdr-sb-carts", text: `TS ${ts >= 0 ? "+" : ""}${ts}` });
  }

  // Abilità · Sensi · Lingue · GS (difensivo sulle forme dei dati).
  const meta = c.createDiv({ cls: "gdr-sb-blocco" });
  const ab = m.abilita;
  if (ab && (Array.isArray(ab) ? ab.length : Object.keys(ab).length)) {
    const txt = Array.isArray(ab) ? ab.map((x: any) => (typeof x === "string" ? x : `${x.nome ?? x.abilita} ${x.valore ?? x.bonus ?? ""}`.trim())).join(", ")
      : Object.entries(ab).map(([k, v]) => `${k} ${v}`).join(", ");
    const p = meta.createEl("div"); p.createEl("strong", { text: "Abilità " }); p.appendText(txt);
  }
  if (m.sensi) { const p = meta.createEl("div"); p.createEl("strong", { text: "Sensi " }); p.appendText(Object.entries(m.sensi).map(([k, v]) => `${k.replace(/_/g, " ")} ${v} m`).join(", ")); }
  const perLingua = (l: any) => (typeof l === "string" ? l : String(l?.nome ?? l?.id ?? "")).trim();
  const lingue = (Array.isArray(m.lingue) ? m.lingue : m.lingue ? [m.lingue] : []).map(perLingua).filter(Boolean);
  if (lingue.length) { const p = meta.createEl("div"); p.createEl("strong", { text: "Lingue " }); p.appendText(lingue.join(", ")); }
  if (m.gs != null) { const p = meta.createEl("div"); p.createEl("strong", { text: "GS " }); p.appendText(String(m.gs)); }

  // Sezioni a voci: tratti, azioni, reazioni, leggendarie (nome in grassetto + prosa).
  const sezione = (titolo: string, voci: any[]) => {
    if (!Array.isArray(voci) || !voci.length) return;
    c.createEl("h3", { cls: "gdr-sb-sez", text: titolo });
    for (const v of voci) {
      const p = c.createEl("div", { cls: "gdr-sb-voce" });
      const testo = v?.testo ? String(v.testo).trim() : "";
      if (md) {
        const sorgente = (v?.nome ? `***${v.nome}.*** ` : "") + testo;
        void MarkdownRenderer.render(md.app, sorgente, p, md.sourcePath ?? "", md.component);
      } else {
        if (v?.nome) p.createEl("strong", { text: `${v.nome}. ` });
        if (testo) p.appendText(testo);
      }
    }
  };
  sezione("Tratti", m.tratti);
  sezione("Azioni", m.azioni);
  sezione("Reazioni", m.reazioni);
  sezione("Azioni leggendarie", m.azioni_leggendarie);
}

export class StatblockModal extends Modal {
  constructor(app: App, private raw: any, private comb?: InPlancia) { super(app); }
  onOpen() {
    this.contentEl.empty();
    const child = new MarkdownRenderChild(this.contentEl);
    renderStatblock(this.contentEl, this.raw, this.comb, { app: this.app, component: child });
  }
  onClose() { this.contentEl.empty(); }
}
