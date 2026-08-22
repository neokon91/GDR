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
  // Un solo `daMostro`: da qui PF massimi e bonus iniziativa (quando non c'è un
  // combattente in plancia che li porta già risolti).
  let dm: any;
  try { dm = daMostro(m); } catch { /* dati incompleti */ }
  const pf = comb ? `${comb.pf_attuali}/${comb.pf_max}` : String(dm?.pf_max ?? "?");
  const riga = (etich: string, val: string) => { const p = testa.createEl("div"); p.createEl("strong", { text: `${etich} ` }); p.appendText(val); };
  riga("CA", String(n((m.ca ?? {}).valore)));
  const initBonus = comb?.iniziativa_bonus ?? dm?.iniziativa_bonus;
  if (initBonus != null) riga("Iniziativa", `${initBonus >= 0 ? "+" : ""}${initBonus}`);
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
  // Abilità: unifica le forme dei dati dell'archivio — `abilita` come oggetto
  // ({abilità: grado}) o come lista di oggetti mono-chiave ([{abilità: grado}]), più le
  // liste `competenza_abilita`/`maestria_abilita` (id di abilità per grado) che la maggior
  // parte dei mostri usa. Il grado ("competenza"/"maestria") si mostra come testo, coerente
  // con lo statblock a riposo (i bonus numerici li risolve il motore in plancia).
  const abilitaVoci: string[] = [];
  const spingiAbil = (nome: string, grado: string) => { if (nome) abilitaVoci.push(`${nome} ${grado}`.trim()); };
  const ab = m.abilita;
  if (Array.isArray(ab)) {
    for (const x of ab) {
      if (typeof x === "string") spingiAbil(x, "");
      else if (x && typeof x === "object") { const [k, v] = Object.entries(x)[0] ?? []; spingiAbil(String(k ?? ""), String(v ?? "")); }
    }
  } else if (ab && typeof ab === "object") {
    for (const [k, v] of Object.entries(ab)) spingiAbil(k, String(v));
  }
  if (Array.isArray(m.competenza_abilita)) for (const id of m.competenza_abilita) spingiAbil(String(id), "competenza");
  if (Array.isArray(m.maestria_abilita)) for (const id of m.maestria_abilita) spingiAbil(String(id), "maestria");
  if (abilitaVoci.length) { const p = meta.createEl("div"); p.createEl("strong", { text: "Abilità " }); p.appendText(abilitaVoci.join(", ")); }
  // Sensi (oggetto {senso: portata}; salta la forma vuota/lista) + percezione passiva.
  const sensiVoci = m.sensi && !Array.isArray(m.sensi) && typeof m.sensi === "object"
    ? Object.entries(m.sensi).map(([k, v]) => `${k.replace(/_/g, " ")} ${v} m`) : [];
  if (m.percezione_passiva != null) sensiVoci.push(`percezione passiva ${m.percezione_passiva}`);
  if (sensiVoci.length) { const p = meta.createEl("div"); p.createEl("strong", { text: "Sensi " }); p.appendText(sensiVoci.join(", ")); }
  const perLingua = (l: any) => (typeof l === "string" ? l : String(l?.nome ?? l?.id ?? "")).trim();
  const lingue = (Array.isArray(m.lingue) ? m.lingue : m.lingue ? [m.lingue] : []).map(perLingua).filter(Boolean);
  if (lingue.length) { const p = meta.createEl("div"); p.createEl("strong", { text: "Lingue " }); p.appendText(lingue.join(", ")); }
  // Difese/dotazione per TIPO (liste di stringhe): resistenze, immunità (danni e
  // condizioni), vulnerabilità, equipaggiamento. Erano ciò che il renderer nativo
  // ancora non mostrava rispetto a Fantasy Statblocks.
  const listaTesto = (etich: string, v: any) => {
    const arr = Array.isArray(v) ? v : v != null ? [v] : [];
    if (!arr.length) return;
    const p = meta.createEl("div"); p.createEl("strong", { text: `${etich} ` });
    p.appendText(arr.map((x: any) => (typeof x === "string" ? x : String(x?.nome ?? x?.id ?? x))).join(", "));
  };
  listaTesto("Resistenze", m.resistenze);
  listaTesto("Immunità ai danni", m.immunita_danni);
  listaTesto("Immunità alle condizioni", m.immunita_condizioni);
  listaTesto("Vulnerabilità", m.vulnerabilita);
  listaTesto("Equipaggiamento", m.equipaggiamento);
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
  sezione("Azioni bonus", m.azioni_bonus);
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
