/*
 * GDR — Console DM & Motore (plugin Obsidian).
 *
 * Runtime del vault GDR: riusa `z.automazioni/views.js` e `z.automazioni/meta_actions.js`
 * SENZA modificarli (li carica come CommonJS, come boot.mjs, di cui importa la mappa PANELS)
 * ed espone:
 *   1. blocco ```gdr <renderX> / `radar <cat>` — al posto di js-engine, re-render reattivo;
 *   2. le AZIONI del dispatcher come comandi nativi + hotkey + ribbon (modali native al posto
 *      di tp.system.suggester/prompt); la CREAZIONE via mini-motore di istanziazione template;
 *   3. CRUSCOTTO DM — dashboard a piena pagina che integra PG, Initiative Tracker, dadi,
 *      Calendarium e lo stato del mondo, con tab Impostazioni e status bar.
 */
import {
  App, ItemView, MarkdownRenderer, MarkdownRenderChild, Modal, Notice, Plugin, PluginSettingTab,
  Setting, SuggestModal, WorkspaceLeaf,
} from "obsidian";

// --- Impostazioni del plugin (persistite via loadData/saveData) ---------------------------
interface GdrSettings {
  sezioni: { party: boolean; combattimento: boolean; dadi: boolean; data: boolean; mondo: boolean };
  dadi: string; // "etichetta:espressione" separati da virgola
}
const DEFAULT_SETTINGS: GdrSettings = {
  sezioni: { party: true, combattimento: true, dadi: true, data: true, mondo: true },
  dadi: "d20:1d20, Vantaggio:2d20kh1, Svantaggio:2d20kl1, d100:1d100, 2d6:2d6, 1d8:1d8",
};

// Parsa la stringa dadi impostata in coppie [etichetta, espressione].
function parseDadi(s: string): [string, string][] {
  return String(s || "").split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(":");
    return (i < 0 ? [p, p] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]) as [string, string];
  });
}
// SORGENTE UNICA della mappa pannelli: importata da boot.mjs (bundlata da esbuild), così il
// plugin SUSSUME boot.mjs invece di duplicarne il registro (niente drift).
// @ts-ignore — .mjs JS del vault, senza tipi; esbuild lo risolve e tree-shaka al solo PANELS.
import { PANELS } from "../Dev/Source/JS/boot.mjs";

const VIEWS_PATH = "z.automazioni/views.js";
const META_PATH = "z.automazioni/meta_actions.js";
const VIEW_TYPE_CRUSCOTTO = "gdr-cruscotto";

// Carica uno script CommonJS del vault iniettando i SOLI globali che il runtime usa
// (app, Notice — verificato: nessun altro simbolo Obsidian libero in views/meta_actions).
function evalCjs(src: string, app: App): any {
  const mod: any = { exports: {} };
  // eslint-disable-next-line no-new-func
  const fn = new Function("module", "exports", "app", "Notice", src);
  fn(mod, mod.exports, app, Notice);
  return mod.exports;
}

// --- Modali native (rimpiazzano tp.system.suggester / tp.system.prompt di Templater) ------
// Così il dispatcher `meta_actions` gira dal plugin ANCHE per le azioni interattive
// (collega, applica_profilo, aggiorna_encounter…) senza dipendere da Templater a runtime.

class GdrSuggestModal extends SuggestModal<number> {
  private picked = false;
  constructor(app: App, private labels: string[], private onPick: (i: number | null) => void, ph: string) {
    super(app);
    this.setPlaceholder(ph || "");
  }
  getSuggestions(query: string): number[] {
    const q = query.toLowerCase();
    const out: number[] = [];
    this.labels.forEach((l, i) => { if (l.toLowerCase().includes(q)) out.push(i); });
    return out;
  }
  renderSuggestion(i: number, el: HTMLElement) { el.setText(this.labels[i]); }
  onChooseSuggestion(i: number) { this.picked = true; this.onPick(i); }
  onClose() { window.setTimeout(() => { if (!this.picked) this.onPick(null); }, 0); }
}

// Firma Templater: suggester(text_items, items, throw_on_cancel=false, placeholder). text_items
// può essere un array di stringhe o una funzione su items; ritorna items[scelto] (o null/throw).
function suggester(app: App, textItems: any, items: any[], throwOnCancel = false, placeholder = ""): Promise<any> {
  const labels = (typeof textItems === "function" ? (items || []).map(textItems) : (textItems || [])).map(String);
  return new Promise((resolve, reject) => {
    new GdrSuggestModal(app, labels, (i) => {
      if (i == null) { throwOnCancel ? reject(new Error("Suggester annullato")) : resolve(null); }
      else resolve(items[i]);
    }, placeholder).open();
  });
}

class GdrPromptModal extends Modal {
  private submitted = false;
  constructor(app: App, private message: string, private def: string, private onDone: (v: string | null) => void) {
    super(app);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });
    const input = contentEl.createEl("input", { type: "text" }) as HTMLInputElement;
    input.value = this.def ?? "";
    input.style.width = "100%";
    setTimeout(() => { input.focus(); input.select(); }, 0);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") this.submit(input.value); });
    const bar = contentEl.createDiv({ cls: "modal-button-container" });
    const ok = bar.createEl("button", { text: "OK", cls: "mod-cta" });
    ok.onclick = () => this.submit(input.value);
    bar.createEl("button", { text: "Annulla" }).onclick = () => this.close();
  }
  private submit(v: string) { this.submitted = true; this.onDone(v); this.close(); }
  onClose() { this.contentEl.empty(); window.setTimeout(() => { if (!this.submitted) this.onDone(null); }, 0); }
}

// Firma Templater: prompt(message, default_value, throw_on_cancel=false).
function promptModal(app: App, message: string, def = "", throwOnCancel = false): Promise<string | null> {
  return new Promise((resolve, reject) => {
    new GdrPromptModal(app, message, def, (v) => {
      if (v == null) { throwOnCancel ? reject(new Error("Prompt annullato")) : resolve(null); }
      else resolve(v);
    }).open();
  });
}

// tp compatibile per il dispatcher: `date.now`, le modali native (suggester/prompt) e un
// proxy `user` che carica lazy gli script `tp.user.<name>` da z.automazioni (usati da alcune
// azioni: sali_pg, genera, importa_*, genera_sito, world_board). NIENTE multi_suggester: il
// runtime lo tratta come opzionale e degrada a suggester singoli.
function tpShim(app: App): any {
  const m = (window as any).moment;
  const userCache: Record<string, any> = {};
  const tp: any = {
    config: {},
    date: { now: (fmt: string) => (m ? m().format(fmt) : new Date().toISOString().slice(0, 10)) },
    system: {
      suggester: (t: any, i: any[], thr = false, ph = "") => suggester(app, t, i, thr, ph),
      prompt: (msg: string, def = "", thr = false) => promptModal(app, msg, def, thr),
    },
  };
  tp.user = new Proxy({}, {
    get: (_t, name: string) => async (...args: any[]) => {
      if (!userCache[name]) userCache[name] = evalCjs(await app.vault.adapter.read(`z.automazioni/${name}.js`), app);
      return userCache[name](...args);
    },
  });
  return tp;
}

export default class GdrPlugin extends Plugin {
  private views: any = null;
  private meta: any = null;
  private core: any = null;
  settings: GdrSettings = DEFAULT_SETTINGS;
  private statusBar: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    // 1. Blocco ```gdr <renderX> (o `radar <category>`) → monta la vista, con re-render
    //    reattivo sui cambi di frontmatter della nota-sorgente.
    this.registerMarkdownCodeBlockProcessor("gdr", async (source, el, ctx) => {
      const tokens = source.trim().split(/\s+/);
      const name = tokens[0];
      const child = new MarkdownRenderChild(el);
      ctx.addChild(child);
      const reactive = (draw: () => Promise<void>) => {
        void draw();
        child.registerEvent(this.app.metadataCache.on("changed", (f) => {
          if (f?.path === ctx.sourcePath) void draw();
        }));
        // Viste che leggono l'API Dataview (renderEntityPanel/renderConnessioni…): Dataview
        // reindicizza DOPO metadataCache → un ulteriore redraw quando il suo indice cambia,
        // così anche i dati derivati dal grafo si aggiornano (evento custom, non tipizzato).
        child.registerEvent((this.app.metadataCache as any).on("dataview:metadata-change", () => void draw()));
      };

      // Caso speciale: il RADAR non è in PANELS (firma diversa — legge gli assi dal
      // frontmatter e disegna l'SVG). `radar <category>`; era `boot.radar` via js-engine.
      if (name === "radar") {
        const category = tokens[1] || "";
        reactive(async () => {
          el.empty();
          try {
            const views = await this.loadViews();
            const core = await this.loadCore();
            const md = views.radarMarkdownFromValues(core, category, this.frontmatterOf(ctx.sourcePath), "");
            await MarkdownRenderer.render(this.app, md, el, ctx.sourcePath, child);
          } catch (e: any) {
            el.createEl("pre", { text: `Errore radar ${category}: ${e?.message ?? e}` });
          }
        });
        return;
      }

      const spec = PANELS[name];
      if (!spec) { el.createEl("pre", { text: `Vista GDR sconosciuta: "${name}"` }); return; }
      reactive(async () => {
        el.empty();
        try {
          const views = await this.loadViews();
          const d = this.pageFor(ctx.sourcePath);
          const out = await views[name](...spec.args(this.app, d, el));
          if (spec.mode === "md" && typeof out === "string") {
            await MarkdownRenderer.render(this.app, out, el, ctx.sourcePath, child);
          }
        } catch (e: any) {
          el.createEl("pre", { text: `Errore vista ${name}: ${e?.message ?? e}` });
        }
      });
    });

    // 2. Azioni del dispatcher come COMANDI nativi (hotkey assegnabili). Le INTERATTIVE
    //    (collega/incontro) girano via le modali native → niente Templater a runtime.
    const ACTIONS: { id: string; name: string; global?: boolean }[] = [
      { id: "riposo_lungo", name: "Riposo lungo (PG attivo)" },
      { id: "riposo_breve", name: "Riposo breve (PG attivo)" },
      { id: "sali_di_livello", name: "Sali di livello (PG attivo)" },
      { id: "usa_risorsa", name: "Usa risorsa (PG attivo)" },
      { id: "collega", name: "Collega (nota attiva)" },
      { id: "applica_profilo", name: "Applica profilo (nota attiva)" },
      { id: "marca_canonico", name: "Segna come canonico" },
      { id: "archivia", name: "Archivia la nota" },
      { id: "aggiorna_encounter", name: "Aggiorna l'incontro" },
      { id: "scaffold_statblock", name: "Genera statblock dal GS" },
      { id: "inizia_incontro", name: "Avvia l'incontro" },
      { id: "avanza_fronte", name: "Avanza il fronte" },
      { id: "scatena_conseguenza", name: "Scatena la conseguenza" },
      { id: "tira_tabella", name: "Tira sulla tabella" },
      { id: "turno_bastione", name: "Turno di bastione" },
      { id: "inserisci_componente", name: "Aggiungi componente" },
      { id: "genera", name: "Genera un nome (nota attiva)" },
      { id: "sincronizza_pin", name: "Sincronizza i pin dalla mappa" },
      { id: "importa_mappa", name: "Importa mappa (Watabou)" },
      { id: "importa_azgaar", name: "Importa mappa (Azgaar)" },
      { id: "giro_del_mondo", name: "Giro del mondo", global: true },
      { id: "world_board", name: "Genera il World Board", global: true },
      { id: "genera_sito", name: "Genera il sito giocatori", global: true },
    ];
    for (const a of ACTIONS) {
      this.addCommand({
        id: a.id.replace(/_/g, "-"),
        name: a.name,
        checkCallback: (checking) => {
          if (!a.global && !this.app.workspace.getActiveFile()) return false;
          if (!checking) this.dispatch(a.id);
          return true;
        },
      });
    }

    // 3. Cruscotto DM (ItemView): registrazione + comando + ribbon per aprirlo.
    this.registerView(VIEW_TYPE_CRUSCOTTO, (leaf) => new CruscottoView(leaf, this));
    this.addCommand({
      id: "apri-cruscotto",
      name: "Apri il Cruscotto DM",
      callback: () => this.activateCruscotto(),
    });
    this.addRibbonIcon("layout-dashboard", "GDR: Cruscotto DM", () => this.activateCruscotto());
    this.addRibbonIcon("moon", "GDR: Riposo lungo (PG attivo)", () => {
      const file = this.app.workspace.getActiveFile();
      if (file) this.riposoLungo(file); else new Notice("Nessuna nota attiva.");
    });

    // 4. WIZARD DI CREAZIONE come comandi nativi: un mini-motore di istanziazione template
    //    esegue crea_pg/create_entity col tpShim esteso → niente Templater per creare.
    //    Un comando `gdr:crea-<id>` per template (i bottoni Meta Bind li chiamano) + un picker.
    await this.registerCreationCommands();

    // 5. Impostazioni native + status bar (data del mondo · n° PG), cliccabile → dashboard.
    this.addSettingTab(new GdrSettingTab(this.app, this));
    this.statusBar = this.addStatusBarItem();
    this.statusBar.addClass("gdr-status");
    this.statusBar.onClickEvent(() => this.activateCruscotto());
    this.updateStatusBar();
    this.registerEvent(this.app.metadataCache.on("changed", () => this.updateStatusBar()));
    this.registerEvent((this.app.metadataCache as any).on("dataview:index-ready", () => this.updateStatusBar()));

    console.log("GDR plugin caricato.");
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CRUSCOTTO);
  }

  // Apre il Cruscotto come DASHBOARD a piena pagina (area principale), non nel laterale
  // stretto: la control-room ha spazio per il layout multi-colonna. Riusa la vista se già aperta.
  async activateCruscotto() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_CRUSCOTTO);
    // Se è già aperto in un tab dell'AREA PRINCIPALE, rivelalo lì.
    const inMain = existing.find((l) => (l as any).getRoot?.() === (workspace as any).rootSplit);
    if (inMain) { workspace.revealLeaf(inMain); return; }
    // Altrimenti apri il dashboard a piena pagina, staccando eventuali istanze nel laterale.
    existing.forEach((l) => l.detach());
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_CRUSCOTTO, active: true });
    workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) || {});
    this.settings.sezioni = Object.assign({}, DEFAULT_SETTINGS.sezioni, this.settings.sezioni);
  }
  async saveSettings() { await this.saveData(this.settings); this.refreshCruscotti(); this.updateStatusBar(); }

  // Ridisegna eventuali dashboard aperte (dopo un cambio impostazioni).
  refreshCruscotti() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_CRUSCOTTO)) {
      const v: any = leaf.view;
      if (v && typeof v.render === "function") v.render();
    }
  }

  // Data del mondo da Calendarium (best-effort, forme API variabili). "" se non disponibile.
  worldDate(): string {
    const cal = (this.app as any).plugins?.plugins?.["calendarium"];
    if (!cal) return "";
    try {
      if (typeof cal.api?.getCurrentDate === "function") return String(cal.api.getCurrentDate());
      if (typeof cal.getCurrentDate === "function") return String(cal.getCurrentDate());
      const c = cal.data?.calendars?.[0], cur = c?.current;
      if (cur) {
        const month = c?.static?.months?.[(cur.month ?? 1) - 1]?.name ?? cur.month;
        return [cur.day, month, cur.year].filter((x: any) => x != null).join(" ");
      }
    } catch { /* forma API cambiata */ }
    return "";
  }

  private countPgs(): number {
    return this.app.vault.getMarkdownFiles().filter((f) => {
      const fm = this.app.metadataCache.getFileCache(f)?.frontmatter || {};
      return fm.categoria === "personaggio" && String((fm as any).tipo).toLowerCase() === "pg";
    }).length;
  }

  updateStatusBar() {
    if (!this.statusBar) return;
    const parts = ["🎲 GDR"];
    const date = this.worldDate();
    if (date) parts.push(`🕰 ${date}`);
    const pgs = this.countPgs();
    if (pgs) parts.push(`🎭 ${pgs}`);
    this.statusBar.setText(parts.join("  ·  "));
    this.statusBar.setAttribute("aria-label", "Apri il Cruscotto DM");
  }

  async riposoLungo(file: any) {
    const meta = await this.loadMeta(); // module.exports = dispatcher meta_actions(tp, action)
    if (typeof meta !== "function") { new Notice("Dispatcher meta_actions non trovato nel vault."); return; }
    await meta(tpShim(this.app), "riposo_lungo"); // il dispatcher risolve `file` da getActiveFile
  }

  async dispatch(action: string) {
    const meta = await this.loadMeta();
    if (typeof meta !== "function") { new Notice("Dispatcher meta_actions non trovato."); return; }
    // Il dispatcher pretende un file attivo anche per le azioni GLOBALI (giro_del_mondo lo
    // ignora): dal cruscotto — pannello laterale senza nota aperta — passiamo un file di
    // ripiego come tp.config.target_file, così il guard passa senza cambiare la semantica.
    const tp = tpShim(this.app);
    tp.config.target_file =
      this.app.workspace.getActiveFile() ?? this.app.vault.getMarkdownFiles()[0] ?? null;
    await meta(tp, action);
  }

  async loadViews() {
    if (!this.views) this.views = evalCjs(await this.app.vault.adapter.read(VIEWS_PATH), this.app);
    return this.views;
  }

  async loadMeta() {
    if (!this.meta) this.meta = evalCjs(await this.app.vault.adapter.read(META_PATH), this.app);
    return this.meta;
  }

  // Catalogo core.json (assi per categoria, ecc.): immutabile a runtime (lo riscrive solo
  // render.py al build) → letto una volta e cacheato, come fa boot.mjs.
  async loadCore() {
    if (!this.core) this.core = JSON.parse(await this.app.vault.adapter.read("z.automazioni/data/core.json"));
    return this.core;
  }

  // Frontmatter FRESCO di una nota (da metadataCache, già aggiornato al 'changed').
  frontmatterOf(path: string): any {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file ? (this.app.metadataCache.getFileCache(file as any)?.frontmatter ?? {}) : {};
  }

  // Dataview API + page della nota, con i CAMPI FRONTMATTER FRESCHI sovrapposti (Dataview
  // reindicizza in ritardo rispetto a metadataCache → altrimenti il re-render è stale).
  pageFor(path: string) {
    const dv = (this.app as any).plugins?.plugins?.dataview?.api ?? null;
    const file = this.app.vault.getAbstractFileByPath(path);
    const fm = file ? (this.app.metadataCache.getFileCache(file as any)?.frontmatter ?? {}) : {};
    const dvPage = dv ? dv.page(path) : null;
    return { dv, page: Object.assign({}, dvPage || {}, fm) };
  }

  // --- WIZARD DI CREAZIONE (mini-motore di istanziazione template) ---------------------

  // Registra un comando `gdr:crea-<id>` per ogni template di core.json (i bottoni Meta Bind
  // `command`→`gdr:crea-<id>` li chiamano) + un picker generico «GDR: Crea…».
  async registerCreationCommands() {
    let core: any;
    try { core = await this.loadCore(); } catch { return; }
    const templates: any[] = core.templates || [];
    for (const t of templates) {
      this.addCommand({
        id: `crea-${t.id}`,
        name: `Crea ${t.title}`,
        callback: () => this.createFromTemplate(t.id),
      });
    }
    this.addCommand({
      id: "crea",
      name: "Crea… (scegli il tipo)",
      callback: async () => {
        const chosen = await suggester(
          this.app, templates.map((t) => t.title), templates, false, "Cosa vuoi creare?");
        if (chosen) this.createFromTemplate((chosen as any).id);
      },
    });
  }

  // Istanzia un template SENZA Templater: esegue il wizard (crea_pg o create_entity) col
  // tpShim esteso (tp.file.move REGISTRA la destinazione, la nota si crea alla fine), poi
  // compone `frontmatter (ritorno del wizard) + corpo del template` e apre la nota.
  async createFromTemplate(templateId: string) {
    const app = this.app;
    let core: any;
    try { core = await this.loadCore(); } catch { new Notice("core.json non leggibile."); return; }
    const tpl = (core.templates || []).find((t: any) => t.id === templateId);
    if (!tpl) { new Notice(`Template sconosciuto: ${templateId}`); return; }
    let templateContent: string;
    try { templateContent = await app.vault.adapter.read(tpl.target); }
    catch { new Notice(`Template mancante: ${tpl.target}`); return; }

    // tpShim esteso: file.move registra la destinazione (niente nota provvisoria).
    let movedTo: string | null = null;
    const tp: any = tpShim(app);
    tp.file = {
      move: async (p: string) => { movedTo = p; },
      exists: async (p: string) => !!app.vault.getAbstractFileByPath(p),
    };
    tp.config = { target_file: { get basename() { return movedTo ? movedTo.split("/").pop() : "Senza nome"; } } };

    // Esegui il wizard → stringa frontmatter (o bozza se annullato).
    let fm: string;
    try {
      if (templateId === "pg") {
        const crea = evalCjs(await app.vault.adapter.read("z.automazioni/crea_pg.js"), app);
        fm = await crea(tp);
      } else {
        const ce = evalCjs(await app.vault.adapter.read("z.automazioni/create_entity.js"), app);
        fm = await ce(tp, templateId);
      }
    } catch (e: any) { new Notice(`Creazione interrotta: ${e?.message ?? e}`); return; }

    // Destinazione: quella scelta dal wizard (tp.file.move) o un ripiego in cartella.
    const folder = core.folders?.[tpl.category] ?? "Inbox";
    let dest = (movedTo ? movedTo : `${folder}/Senza nome`) + ".md";
    for (let n = 2; app.vault.getAbstractFileByPath(dest); n++) dest = dest.replace(/( \d+)?\.md$/, ` ${n}.md`);
    const base = dest.replace(/\.md$/, "").split("/").pop() as string;

    // Corpo: rimpiazza la riga `<% await tp.user.crea_X(tp) %>` col frontmatter, e
    // `<% tp.config.target_file.basename %>` col basename finale.
    let content = templateContent.replace(/^<%\s*await\s+tp\.user\.[^%]*%>\s*\n?/m, fm);
    content = content.split("<% tp.config.target_file.basename %>").join(base);

    await this.ensureParent(dest);
    const created = await app.vault.create(dest, content);
    app.workspace.getLeaf(false).openFile(created as any);
  }

  // Crea le cartelle-genitore di un path (idempotente).
  private async ensureParent(path: string) {
    const dir = path.split("/").slice(0, -1).join("/");
    if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
      try { await this.app.vault.createFolder(dir); } catch { /* già esistente */ }
    }
  }
}

// Sezioni-vista riusate (md-mode, argomenti (app, dv)) — la parte "mondo" della console.
const CRUSCOTTO_SECTIONS = [
  { icon: "🌍", title: "Stato del mondo", view: "renderStatoMondo" },
  { icon: "🔥", title: "Tensioni", view: "renderTensioni" },
  { icon: "🔮", title: "Proiezione", view: "renderProiezione" },
];

// Roller locale (affidabile in ItemView): NdM con +/-K e kh1/kl1 (vantaggio/svantaggio).
function rollFormula(expr: string): { total: number; detail: string } {
  const m = expr.match(/^(\d+)d(\d+)(kh1|kl1)?([+-]\d+)?$/i);
  if (!m) return { total: NaN, detail: expr };
  const n = +m[1], faces = +m[2], keep = (m[3] || "").toLowerCase(), mod = m[4] ? +m[4] : 0;
  const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * faces));
  let used = rolls;
  if (keep === "kh1") used = [Math.max(...rolls)];
  else if (keep === "kl1") used = [Math.min(...rolls)];
  const total = used.reduce((a, b) => a + b, 0) + mod;
  const modTxt = mod ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
  return { total, detail: `[${rolls.join(", ")}]${keep ? " " + keep : ""}${modTxt}` };
}

class CruscottoView extends ItemView {
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
    act("⚔️ Schiera il gruppo", "inizia_incontro");
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
  private partyPgs() {
    return this.app.vault.getMarkdownFiles()
      .map((f) => ({ f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter || {}) as any }))
      .filter((e) => e.fm.categoria === "personaggio" && String(e.fm.tipo).toLowerCase() === "pg")
      .sort((a, b) => String(a.fm.nome || a.f.basename).localeCompare(String(b.fm.nome || b.f.basename)));
  }

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

  // Combattimento: stato LIVE di Initiative Tracker (best-effort su forme note dell'API),
  // altrimenti il roster del gruppo. Guardato: se l'API interna cambia, degrada al roster.
  private renderCombat(root: HTMLElement) {
    const it = (this.app as any).plugins?.plugins?.["initiative-tracker"];
    const box = root.createDiv({ cls: "gdr-crusc-sec" });
    box.createEl("h4", { text: "⚔️ Combattimento" });
    if (!it || !it.data) {
      box.createEl("p", { text: "Initiative Tracker non attivo.", cls: "gdr-crusc-empty" });
      return;
    }
    let live: any = null;
    try {
      if (it.tracker && typeof it.tracker.subscribe === "function") {
        const unsub = it.tracker.subscribe((v: any) => { live = v; }); unsub();  // valore corrente dello store
      } else if (it.view?.ordered || it.combatants) {
        live = { creatures: it.view?.ordered || it.combatants, round: it.view?.round, state: true };
      }
    } catch { /* forma API cambiata → roster */ }

    const creatures = live && Array.isArray(live.creatures) ? live.creatures : null;
    if (creatures && creatures.length && (live.state || live.round != null)) {
      if (live.round != null) box.createEl("div", { cls: "gdr-crusc-round", text: `Round ${live.round}` });
      const list = box.createDiv({ cls: "gdr-crusc-combat" });
      for (const c of creatures) {
        const row = list.createDiv({ cls: "gdr-crusc-cbrow" + (c.active ? " is-active" : "") });
        row.createSpan({ cls: "gdr-crusc-cbinit", text: String(c.initiative ?? c.roll ?? "—") });
        row.createSpan({ cls: "gdr-crusc-cbname", text: String(c.name || "?") });
        const hp = c.current_hp ?? c.hp;
        if (hp != null) row.createSpan({ cls: "gdr-crusc-cbhp", text: `${hp}${c.max_hp ? "/" + c.max_hp : ""}` });
      }
    } else {
      const pname = it.data.defaultParty || it.data.parties?.[0]?.name;
      const party = (it.data.parties || []).find((p: any) => p?.name === pname) || it.data.parties?.[0];
      const players = party?.players || (it.data.players || []).map((p: any) => p?.name).filter(Boolean);
      box.createEl("p", {
        cls: "gdr-crusc-empty",
        text: players && players.length
          ? `Gruppo «${pname || "—"}»: ${players.join(", ")}. Nessun combattimento in corso.`
          : "Nessun gruppo. Usa «⚔️ Schiera il gruppo».",
      });
    }
    const b = box.createEl("button", { text: "Apri il tracker" });
    b.onclick = async () => {
      const w = this.app.workspace;
      let leaf = w.getLeavesOfType("initiative-tracker-view")[0];
      if (!leaf) {
        leaf = w.getRightLeaf(false)!;
        try { await leaf.setViewState({ type: "initiative-tracker-view", active: true }); } catch { /* vista non registrata */ }
      }
      if (leaf) w.revealLeaf(leaf);
    };
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

// --- Tab Impostazioni native --------------------------------------------------------------
class GdrSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: GdrPlugin) { super(app, plugin); }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h3", { text: "Cruscotto DM — sezioni" });

    const toggle = (key: keyof GdrSettings["sezioni"], name: string, desc: string) =>
      new Setting(containerEl).setName(name).setDesc(desc).addToggle((t) =>
        t.setValue(this.plugin.settings.sezioni[key]).onChange(async (v) => {
          this.plugin.settings.sezioni[key] = v; await this.plugin.saveSettings();
        }));

    toggle("party", "Party", "I PG del vault con barra PF e CA.");
    toggle("combattimento", "Combattimento", "Roster / stato live di Initiative Tracker.");
    toggle("dadi", "Tiri rapidi", "Pulsanti-dado.");
    toggle("data", "Data del mondo", "Data corrente da Calendarium.");
    toggle("mondo", "Mondo", "Stato del mondo, tensioni, proiezione.");

    new Setting(containerEl)
      .setName("Tiri rapidi")
      .setDesc("Coppie «etichetta:espressione» separate da virgola (es. d20:1d20, Vantaggio:2d20kh1).")
      .addTextArea((t) => {
        t.setValue(this.plugin.settings.dadi).onChange(async (v) => {
          this.plugin.settings.dadi = v; await this.plugin.saveSettings();
        });
        t.inputEl.rows = 3; t.inputEl.style.width = "100%";
      });
  }
}
