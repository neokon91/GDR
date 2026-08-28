// Statblock NATIVO di un mostro (sostituisce Fantasy Statblocks per la consultazione) +
// il lookup di un mostro nel bestiario, TOLLERANTE alla migrazione degli id.
import { App, MarkdownRenderer, MarkdownRenderChild, Modal } from "obsidian";
import { daMostro } from "../regole/src/motore/combattente";
import type { InPlancia } from "../regole/src/motore/motore";

// Validazione di una creatura HOMEBREW (forma RawMostro): rende visibile la "wrongness
// silenziosa" — daMostro è tollerante (usa default per i campi mancanti), quindi una creatura
// incompleta schiera lo stesso ma con CA/PF/TS sbagliati e l'autore non lo sa. `errori` =
// non utilizzabile (niente nome/YAML rotto); `avvisi` = schiera con valori di default.
export interface ValidazioneMostro { errori: string[]; avvisi: string[]; }
const _ABIL6 = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
export function validaRawMostro(m: any): ValidazioneMostro {
  const errori: string[] = [];
  const avvisi: string[] = [];
  if (!m || typeof m !== "object") { errori.push("lo statblock non è un oggetto YAML valido"); return { errori, avvisi }; }
  if (!m.nome) errori.push("manca «nome»");
  const car = m.caratteristiche;
  if (!car || typeof car !== "object") {
    avvisi.push("manca «caratteristiche» → mod, tiri salvezza e PF usano il default (10)");
  } else {
    const senza = _ABIL6.filter((a) => (car as any)[a]?.valore == null);
    if (senza.length) avvisi.push(`caratteristiche senza valore: ${senza.join(", ")} → default 10`);
  }
  if (m.ca?.valore == null) avvisi.push("manca «ca.valore» → CA 10");
  // PF calcolati: servono dadi_vita (intero positivo) E taglia; altrimenti daMostro usa 10.
  const dv = m.dadi_vita;
  const taglia = Array.isArray(m.taglia) ? m.taglia[0] : m.taglia;
  if (!(typeof dv === "number" && Number.isInteger(dv) && dv > 0) || !taglia) {
    avvisi.push("manca «dadi_vita» o «taglia» → PF 10 (i PF si calcolano da dadi_vita + taglia)");
  }
  if (m.gs == null || m.gs === "") avvisi.push("manca «gs» → niente bonus di competenza (TS/CD/attacchi senza PB)");
  return { errori, avvisi };
}

// Modificatore di caratteristica, formattato col segno (+3, -1, +0).
export function modCar(valore: number): string {
  const m = Math.floor((valore - 10) / 2);
  return m >= 0 ? `+${m}` : String(m);
}

// Etichetta leggibile da un valore che può essere un id QUALIFICATO dell'archivio
// (`dnd.<tipo>.<slug>`, in migrazione): ne ricava lo slug (ultimo segmento, trattini→spazi,
// iniziale maiuscola). I valori già in prosa ("Bestia", "Comune…") restano invariati.
// NB: lo slug perde accenti/maiuscole interne dell'originale ("profondita" non "profondità");
// la resa perfetta richiederebbe un indice id→nome bundlato (possibile evoluzione).
export function etichetta(v: any): string {
  const s = String(v ?? "").trim();
  if (!/^dnd\.[a-z0-9-]+\.[a-z0-9-]+$/.test(s)) return s;
  const slug = s.split(".").pop()!.replace(/-/g, " ");
  return slug.charAt(0).toUpperCase() + slug.slice(1);
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
  const sotto = [m.taglia, etichetta(m.tipo), m.allineamento].filter(Boolean).join(", ");
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

  // Caratteristiche in tabella (formato ufficiale 2024): Punteggio · Mod · TS, in DUE gruppi
  // affiancati (FOR/DES/COS | INT/SAG/CAR). I TS sono SEMPRE mostrati: a riposo vengono da
  // daMostro (mod + bonus competenza se la caratteristica è competente); in plancia dal
  // combattente. Il salvezza non competente coincide col modificatore.
  const abil = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
  const saves: Record<string, number> = comb?.tiri_salvezza ?? dm?.tiri_salvezza ?? {};
  const seg = (v: number) => (v >= 0 ? `+${v}` : String(v));
  const abilBox = c.createDiv({ cls: "gdr-sb-abil" });
  for (const gruppo of [abil.slice(0, 3), abil.slice(3)]) {
    const tab = abilBox.createEl("table", { cls: "gdr-sb-abil-tab" });
    const trh = tab.createEl("thead").createEl("tr");
    trh.createEl("th");
    trh.createEl("th", { cls: "gdr-sb-abil-h", text: "Pt" });
    trh.createEl("th", { cls: "gdr-sb-abil-h", text: "Mod" });
    trh.createEl("th", { cls: "gdr-sb-abil-h", text: "TS" });
    const tbody = tab.createEl("tbody");
    for (const a of gruppo) {
      const v = n((m.caratteristiche ?? {})[a]?.valore ?? 10);
      const mod = Math.floor((v - 10) / 2);
      const ts = saves[a] ?? mod;
      const tr = tbody.createEl("tr");
      tr.createEl("th", { text: a.slice(0, 3).toUpperCase() });
      tr.createEl("td", { text: String(v) });
      tr.createEl("td", { text: seg(mod) });
      tr.createEl("td", { cls: ts !== mod ? "gdr-sb-ts-prof" : "", text: seg(ts) });
    }
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
  const perLingua = (l: any): string => {
    if (typeof l === "string") return etichetta(l);
    if (l && typeof l === "object") {
      if (l.nome) return String(l.nome).trim();
      if (l.id) return etichetta(String(l.id));
      // forma {senso: portata} — es. {telepatia: 36} → "telepatia 36 m"
      const [k, v] = Object.entries(l)[0] ?? [];
      return k ? `${k} ${v} m` : "";
    }
    return "";
  };
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
