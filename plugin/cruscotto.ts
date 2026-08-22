// Cruscotto DM: dashboard a piena pagina (Party, Combattimento, Tiri rapidi, Data del mondo,
// Stato del mondo). La control-room del DM.
import { ItemView, MarkdownRenderer, Notice, WorkspaceLeaf } from "obsidian";
import { parseDadi, rollFormula } from "./util";
import type GdrPlugin from "./main";

export const VIEW_TYPE_CRUSCOTTO = "gdr-cruscotto";

// Sezioni-vista riusate (md-mode, argomenti (app, dv)) — la parte "mondo" della console.
const CRUSCOTTO_SECTIONS = [
  { icon: "🌍", title: "Stato del mondo", view: "renderStatoMondo" },
  { icon: "🔥", title: "Tensioni", view: "renderTensioni" },
  { icon: "🔮", title: "Proiezione", view: "renderProiezione" },
];

export class CruscottoView extends ItemView {
  private redrawTimer: number | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: GdrPlugin) {
    super(leaf);
  }

  getViewType() { return VIEW_TYPE_CRUSCOTTO; }
  getDisplayText() { return "Cruscotto DM"; }
  getIcon() { return "layout-dashboard"; }

  async onOpen() {
    await this.render();
    // Reattività: qualunque cambio nel vault ridisegna la console (debounce 400ms).
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRedraw()));
    // Robustezza al COLD-START: le viste leggono Dataview, che indicizza async dopo l'avvio.
    this.registerEvent((this.app.metadataCache as any).on("dataview:index-ready", () => this.render()));
    this.registerEvent((this.app.metadataCache as any).on("dataview:metadata-change", () => this.scheduleRedraw()));
  }

  private scheduleRedraw() {
    if (this.redrawTimer) window.clearTimeout(this.redrawTimer);
    this.redrawTimer = window.setTimeout(() => this.render(), 400);
  }

  async render() {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("gdr-cruscotto");
    const s = this.plugin.settings.sezioni;

    // Intestazione + azioni rapide (piena larghezza).
    const head = root.createDiv({ cls: "gdr-crusc-head" });
    head.createEl("h3", { text: "🎲 Cruscotto DM" });
    const bar = head.createDiv({ cls: "gdr-crusc-actions" });
    const act = (label: string, action: string) => {
      const b = bar.createEl("button", { text: label });
      b.onclick = async () => { await this.plugin.dispatch(action); };
    };
    // Superficie di combattimento = la Board GDR (audit F3): la CTA apre la Board
    // (Initiative Tracker ritirato).
    const bBoard = bar.createEl("button", { text: "⚔️ Board di combattimento" });
    bBoard.onclick = () => this.plugin.activateBoard();
    act("🌍 Giro del mondo", "giro_del_mondo");
    const btnRefresh = bar.createEl("button", { text: "🔄" });
    btnRefresh.setAttribute("aria-label", "Aggiorna");
    btnRefresh.onclick = () => this.render();

    // Griglia RESPONSIVE: multi-colonna a piena pagina, impilata se stretta (auto-fit).
    const grid = root.createDiv({ cls: "gdr-crusc-grid" });

    if (s.party) this.renderParty(grid);
    if (s.combattimento) this.renderCombat(grid);
    if (s.dadi) this.renderDice(grid);
    if (s.data) this.renderWorldDate(grid);

    if (s.mondo) {
      let views: any, dv: any;
      try {
        views = await this.plugin.loadViews();
        dv = (this.app as any).plugins?.plugins?.dataview?.api ?? null;
      } catch (e: any) {
        grid.createEl("pre", { text: `Cruscotto: impossibile caricare le viste (${e?.message ?? e}).` });
        return;
      }
      for (const sec of CRUSCOTTO_SECTIONS) {
        const box = grid.createDiv({ cls: "gdr-crusc-sec" });
        box.createEl("h4", { text: `${sec.icon} ${sec.title}` });
        const body = box.createDiv();
        try {
          const out = await views[sec.view](this.app, dv);
          if (typeof out === "string" && out.trim()) await MarkdownRenderer.render(this.app, out, body, "", this);
          else body.createEl("p", { text: "—", cls: "gdr-crusc-empty" });
        } catch (e: any) {
          body.createEl("pre", { text: `Errore ${sec.view}: ${e?.message ?? e}` });
        }
      }
    }
  }

  // I PG del vault (nota personaggio · tipo pg), ordinati per nome.
  private partyPgs() { return this.plugin.partyPgs(); }

  private renderParty(root: HTMLElement) {
    const box = root.createDiv({ cls: "gdr-crusc-sec" });
    box.createEl("h4", { text: "🎭 Party" });
    const pgs = this.partyPgs();
    if (!pgs.length) {
      box.createEl("p", { text: "Nessun PG. Crea i personaggi col comando «GDR: Crea PG».", cls: "gdr-crusc-empty" });
      return;
    }
    for (const { f, fm } of pgs) {
      const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      const pf = num(fm.pf), pfMax = num(fm.pf_max) || pf;
      const pct = pfMax ? Math.max(0, Math.min(100, Math.round((pf / pfMax) * 100))) : 0;
      const col = pct <= 25 ? "var(--color-red)" : pct <= 50 ? "var(--color-orange)" : "var(--color-green)";
      const row = box.createDiv({ cls: "gdr-crusc-pgrow" });
      const name = row.createEl("a", { cls: "gdr-crusc-pgname", text: String(fm.nome || f.basename) });
      name.onclick = () => this.app.workspace.getLeaf(false).openFile(f);
      const track = row.createDiv({ cls: "gdr-crusc-pftrack" });
      const fill = track.createDiv({ cls: "gdr-crusc-pffill" });
      fill.style.width = `${pct}%`; fill.style.background = col;
      row.createSpan({ cls: "gdr-crusc-pfval", text: `${pf}/${pfMax}` });
      if (fm.ca != null) row.createSpan({ cls: "gdr-crusc-ac", text: `🛡 ${num(fm.ca)}` });
    }
  }

  private renderDice(root: HTMLElement) {
    const box = root.createDiv({ cls: "gdr-crusc-sec" });
    box.createEl("h4", { text: "🎲 Tiri rapidi" });
    const body = box.createDiv({ cls: "gdr-crusc-dice" });
    for (const [label, expr] of parseDadi(this.plugin.settings.dadi)) {
      const b = body.createEl("button", { cls: "gdr-crusc-die", text: label });
      b.onclick = () => {
        const { total, detail } = rollFormula(expr);
        // Preferisci Dice Roller se espone un'API di roll; altrimenti roller locale.
        const dr = (this.app as any).plugins?.plugins?.["obsidian-dice-roller"];
        try {
          if (dr?.api?.roll) { dr.api.roll(expr); return; }
        } catch { /* fallback locale */ }
        new Notice(`🎲 ${label} (${expr}): ${Number.isFinite(total) ? total : "?"}  ${detail}`);
      };
    }
  }

  // Combattimento: la Board nativa GDR è LA superficie di combattimento. Initiative Tracker
  // è ritirato (il vecchio flusso ```encounter/IT non esiste più): dal Cruscotto si apre la Board.
  private renderCombat(root: HTMLElement) {
    const box = root.createDiv({ cls: "gdr-crusc-sec" });
    box.createEl("h4", { text: "⚔️ Combattimento" });
    const bBoard = box.createEl("button", { text: "⚔️ Board di combattimento (GDR)" });
    bBoard.onclick = () => this.plugin.activateBoard();
  }

  // Data del mondo (Calendarium), best-effort: nessuna sezione se il plugin è assente o
  // se non si riesce a leggere la data corrente (API interna variabile fra versioni).
  private renderWorldDate(root: HTMLElement) {
    const date = this.plugin.worldDate();
    if (!date) return;
    const box = root.createDiv({ cls: "gdr-crusc-sec gdr-crusc-date" });
    box.createEl("h4", { text: "🕰 Data del mondo" });
    box.createEl("p", { text: date });
  }

  async onClose() {
    if (this.redrawTimer) window.clearTimeout(this.redrawTimer);
  }
}
