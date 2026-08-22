/*
 * GDR — Console DM & Motore (plugin Obsidian).
 *
 * Runtime del vault GDR: riusa `z.automazioni/views.js` e `z.automazioni/meta_actions.js`
 * SENZA modificarli (li carica come CommonJS) e importa la mappa PANELS da `_panels.mjs`.
 * È l'UNICO runtime dei blocchi/azioni (js-engine e Templater sono stati ritirati). Espone:
 *   1. blocco ```gdr <renderX> / `radar <cat>` — re-render reattivo (metadataCache+dataview);
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
  board?: Evento[]; // stato della Board di combattimento, persistito così sopravvive al reload
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
// SORGENTE UNICA della mappa pannelli: importata da _panels.mjs (bundlata da esbuild), così il
// plugin e i test la condividono senza duplicarne il registro (niente drift). Il prefisso `_`
// la tiene fuori dal vault: è consumata solo a build-time (esbuild) e dal test di drift.
// @ts-ignore — .mjs JS del vault, senza tipi; esbuild lo risolve e tree-shaka al solo PANELS.
import { PANELS } from "../Dev/Source/JS/_panels.mjs";
// Tipi GENERATI dal modello (Dev/Tools/gen_plugin_types.py): la shape di core.json e i
// vocabolari chiusi. Solo type-import → esbuild lo strippa (nessun impatto a runtime).
import type { CoreData } from "./core";
// MOTORE di combattimento dal repo condiviso `regole` (symlink `../regole`, gitignorato;
// esbuild ne segue il link e bundla la catena TS pura). Spike A: prova che gira in-app.
import {
  ricostruisci, registro, ordine, attivo, esitoScontro, inPiedi, dadoVero, annullaUltimo,
  comandoIniziativa, comandoAttacco, comandoSalvezza, comandoMultiattacco, comandoCura,
  type Evento, type Dado, type InPlancia, type Stato,
} from "../regole/src/motore/motore";
import { daMostro, type Combattente, type Azione } from "../regole/src/motore/combattente";

const VIEWS_PATH = "z.automazioni/views.js";
const META_PATH = "z.automazioni/meta_actions.js";
const VIEW_TYPE_CRUSCOTTO = "gdr-cruscotto";
const VIEW_TYPE_BOARD = "gdr-board";

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
  private core: CoreData | null = null;
  private bestiario: any[] | null = null;
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
      // frontmatter e disegna l'SVG). Sintassi: `radar <category>`.
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

      // Statblock nativo (sostituisce Fantasy Statblocks nelle pagine SRD). Sintassi:
      // `statblock <id-mostro>` — rende dal bestiario bundlato. Non reattivo (dato immutabile).
      if (name === "statblock") {
        const id = tokens.slice(1).join(" ").trim();
        el.empty();
        try {
          const best = await this.loadBestiario();
          const raw = best.find((mm) => mm.id === id) ?? best.find((mm) => String(mm.nome).toLowerCase() === id.toLowerCase());
          if (raw) renderStatblock(el.createDiv(), raw);
          else el.createEl("pre", { text: `Statblock GDR: mostro «${id}» non nel bestiario.` });
        } catch (e: any) {
          el.createEl("pre", { text: `Errore statblock ${id}: ${e?.message ?? e}` });
        }
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
    // SPIKE A — smoke del motore: gioca una micro-battaglia deterministica (Eroina vs
    // due Goblin) coi comandi reali di `regole` e stampa il registro. Prova che il
    // motore event-sourced bundlato gira dentro Obsidian. Comando dev, senza dati vault.
    this.addCommand({
      id: "motore-smoke",
      name: "DEV: Smoke del motore di combattimento",
      callback: () => this.motoreSmoke(),
    });
    // Board di combattimento (Spike C, read-only): ItemView che rende una battaglia dal
    // motore di `regole`. Sostituirà Initiative Tracker + il rendering di Fantasy Statblocks.
    this.registerView(VIEW_TYPE_BOARD, (leaf) => new BoardView(leaf, this));
    this.addCommand({
      id: "apri-board",
      name: "Apri la Board di combattimento",
      callback: () => this.activateBoard(),
    });
    this.addRibbonIcon("swords", "GDR: Board di combattimento", () => this.activateBoard());
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

  async activateBoard() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_BOARD);
    const inMain = existing.find((l) => (l as any).getRoot?.() === (workspace as any).rootSplit);
    if (inMain) { workspace.revealLeaf(inMain); return; }
    existing.forEach((l) => l.detach());
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_BOARD, active: true });
    workspace.revealLeaf(leaf);
  }

  // SPIKE A — smoke del motore. Costruisce combattenti "magri" a mano (nessun adapter
  // ancora: quello è lo Spike B), gioca due round coi comandi reali e mostra il
  // `registro` narrato + lo stato finale in PF. Dado deterministico (LCG) → esito ripetibile.
  motoreSmoke() {
    let seme = 7 >>> 0;
    const dado: Dado = (facce) => { seme = (seme * 1664525 + 1013904223) >>> 0; return (seme % facce) + 1; };
    const eroe: InPlancia = {
      key: "eroe", id: "eroe", nome: "Eroina", ca: 18, pf_max: 34, pf_attuali: 34,
      iniziativa: null, iniziativa_bonus: 2, schieramento: "alleato",
      attacco: { nome: "Colpo di spada", colpire: 6, danno: { numero: 1, facce: 8, bonus: 4 } },
    };
    const goblin = (key: string, nome: string): InPlancia => ({
      key, id: "goblin", nome, ca: 13, pf_max: 12, pf_attuali: 12,
      iniziativa: null, iniziativa_bonus: 2, schieramento: "nemico",
      attacco: { nome: "Scimitarra", colpire: 4, danno: { numero: 1, facce: 6, bonus: 2 } },
    });
    const eventi: Evento[] = [
      { tipo: "aggiunto", combattente: eroe },
      { tipo: "aggiunto", combattente: goblin("gob1", "Goblin A") },
      { tipo: "aggiunto", combattente: goblin("gob2", "Goblin B") },
    ];
    const s = () => ricostruisci(eventi);
    const gioca = (...nuovi: Evento[]) => { eventi.push(...nuovi); };
    // Round 1: iniziativa, si comincia, l'eroina colpisce Goblin A.
    gioca(...comandoIniziativa(s(), dado), { tipo: "cominciato" });
    gioca(...comandoAttacco(s(), "eroe", "gob1", dado));
    gioca({ tipo: "turno-passato" });
    // Round 2: Goblin B risponde all'eroina, poi l'eroina rifinisce Goblin A.
    gioca(...comandoAttacco(s(), "gob2", "eroe", dado));
    gioca(...comandoAttacco(s(), "eroe", "gob1", dado));
    const finale = s();
    const log = [
      ...registro(eventi),
      "— Stato finale —",
      ...finale.combattenti.map((c) => `${c.nome}: ${c.pf_attuali}/${c.pf_max} PF`),
    ].join("\n");
    console.log("[GDR motore-smoke]\n" + log);
    new Notice("Motore OK — registro in console:\n\n" + log, 12000);
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
  // render.py al build) → letto una volta e cacheato.
  async loadCore(): Promise<CoreData> {
    if (!this.core) this.core = JSON.parse(await this.app.vault.adapter.read("z.automazioni/data/core.json")) as CoreData;
    return this.core;
  }

  // Bestiario SRD (sidecar generato da gen_bestiario.py, copiato accanto a main.js): i mostri
  // GREZZI che `daMostro` converte in Combattente. Letto una volta, on-demand (all'apertura
  // della Board), così main.js resta magro. `manifest.dir` = cartella del plugin nel vault.
  async loadBestiario(): Promise<any[]> {
    if (!this.bestiario) {
      const path = `${this.manifest.dir}/data/srd_bestiario.json`;
      this.bestiario = JSON.parse(await this.app.vault.adapter.read(path)) as any[];
    }
    return this.bestiario;
  }

  // I PG del vault (categoria=personaggio, tipo=pg), con il loro frontmatter. Sorgente
  // condivisa fra Cruscotto (Party) e Board (schierare i PG). Ordinati per nome.
  partyPgs(): { f: any; fm: any }[] {
    return this.app.vault.getMarkdownFiles()
      .map((f) => ({ f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter || {}) as any }))
      .filter((e) => e.fm.categoria === "personaggio" && String(e.fm.tipo).toLowerCase() === "pg")
      .sort((a, b) => String(a.fm.nome || a.f.basename).localeCompare(String(b.fm.nome || b.f.basename)));
  }

  // Persistenza della Board: gli eventi vivono nel data.json del plugin (accanto alle
  // impostazioni) così il combattimento sopravvive a un reload. Salvataggio "nudo" (niente
  // refreshCruscotti/statusBar di saveSettings): lo si chiama a ogni comando della board.
  async saveBoard(eventi: Evento[]) { this.settings.board = eventi; await this.saveData(this.settings); }
  loadBoard(): Evento[] { return Array.isArray(this.settings.board) ? this.settings.board : []; }

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

  // Combattimento: stato LIVE di Initiative Tracker (best-effort su forme note dell'API),
  // altrimenti il roster del gruppo. Guardato: se l'API interna cambia, degrada al roster.
  private renderCombat(root: HTMLElement) {
    const it = (this.app as any).plugins?.plugins?.["initiative-tracker"];
    const box = root.createDiv({ cls: "gdr-crusc-sec" });
    box.createEl("h4", { text: "⚔️ Combattimento" });
    // Superficie primaria: la Board nativa GDR (motore di `regole`). Initiative Tracker
    // resta sotto come legacy finché la Board non lo sostituisce del tutto.
    const bBoard = box.createEl("button", { text: "⚔️ Board di combattimento (GDR)" });
    bBoard.onclick = () => this.plugin.activateBoard();
    if (!it || !it.data) {
      box.createEl("p", { text: "Initiative Tracker (legacy) non attivo.", cls: "gdr-crusc-empty" });
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

// Adapter PG GDR → Combattente. Il frontmatter del PG è ricco e piatto: mod_* già
// calcolati, ts_* = FLAG di competenza (0/1), competenza = bonus competenza. Ne ricava CA,
// PF, bonus iniziativa (mod destrezza) e i tiri salvezza (mod + PB·flag). NON gli attacchi:
// dipendono dall'arma che il giocatore sceglie → gestiti a mano (barra PF/danni), non
// auto-eseguiti. Così il PG entra in plancia targetabile, subisce danni e TIRA salvezza
// (i mostri lo attaccano dal motore); la sua offensiva resta al giocatore.
function daPgGdr(fm: any): Combattente {
  const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const pb = n(fm.competenza);
  const ABIL = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
  const tiri_salvezza: Record<string, number> = {};
  for (const a of ABIL) tiri_salvezza[a] = n(fm[`mod_${a}`]) + pb * (n(fm[`ts_${a}`]) ? 1 : 0);
  const slug = String(fm.nome ?? "pg").toLowerCase().replace(/\s+/g, "-");
  return {
    id: `pg:${slug}`,
    nome: String(fm.nome ?? "PG"),
    ca: n(fm.ca),
    pf_max: n(fm.pf_max) || n(fm.pf),
    iniziativa_bonus: n(fm.mod_destrezza),
    tiri_salvezza,
  };
}

// Modificatore di caratteristica, formattato col segno (+3, -1, +0).
function modCar(valore: number): string {
  const m = Math.floor((valore - 10) / 2);
  return m >= 0 ? `+${m}` : String(m);
}

// Statblock NATIVO di un mostro (sostituisce Fantasy Statblocks): reso dentro un host
// (Modal o blocco ```gdr statblock) da `raw` (il .monster.yaml completo del bestiario).
// PF/condizioni correnti dal combattente in plancia se presente; i tiri salvezza dai
// numeri già risolti da `daMostro`.
function renderStatblock(host: HTMLElement, m: any, comb?: InPlancia) {
    const c = host;
    c.addClass("gdr-sb");
    const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

    c.createEl("h2", { cls: "gdr-sb-nome", text: String(m.nome ?? "?") });
    const sotto = [m.taglia, m.tipo, m.allineamento].filter(Boolean).join(", ");
    if (sotto) c.createEl("div", { cls: "gdr-sb-sotto", text: sotto });

    // Testata difensiva: CA · PF · Velocità.
    const testa = c.createDiv({ cls: "gdr-sb-blocco" });
    const pf = comb ? `${comb.pf_attuali}/${comb.pf_max}` : "?";
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
    if (m.lingue) { const p = meta.createEl("div"); p.createEl("strong", { text: "Lingue " }); p.appendText(Array.isArray(m.lingue) ? m.lingue.join(", ") : String(m.lingue)); }
    if (m.gs != null) { const p = meta.createEl("div"); p.createEl("strong", { text: "GS " }); p.appendText(String(m.gs)); }

    // Sezioni a voci: tratti, azioni, reazioni, leggendarie (nome in grassetto + prosa).
    const sezione = (titolo: string, voci: any[]) => {
      if (!Array.isArray(voci) || !voci.length) return;
      c.createEl("h3", { cls: "gdr-sb-sez", text: titolo });
      for (const v of voci) {
        const p = c.createEl("div", { cls: "gdr-sb-voce" });
        if (v?.nome) p.createEl("strong", { text: `${v.nome}. ` });
        if (v?.testo) p.appendText(String(v.testo).trim());
      }
    };
    sezione("Tratti", m.tratti);
    sezione("Azioni", m.azioni);
    sezione("Reazioni", m.reazioni);
    sezione("Azioni leggendarie", m.azioni_leggendarie);
}

class StatblockModal extends Modal {
  constructor(app: App, private raw: any, private comb?: InPlancia) { super(app); }
  onOpen() { this.contentEl.empty(); renderStatblock(this.contentEl, this.raw, this.comb); }
  onClose() { this.contentEl.empty(); }
}

// Etichetta breve per un bottone-azione, per tipo (attacco/salvezza/multiattacco/cura).
function etichettaAzione(az: Azione): string {
  if (az.tipo === "attacco") return `⚔️ ${az.nome} (+${az.colpire})`;
  if (az.tipo === "salvezza") return `✨ ${az.nome} (CD ${az.cd})`;
  if (az.tipo === "multiattacco") return `⚔️⚔️ ${az.nome}`;
  if (az.tipo === "cura") return `➕ ${az.nome}`;
  return `• ${az.nome}`;
}

// --- Board di combattimento (Spike C+D) ---------------------------------------------------
// Tracker di combattimento pilotato dal motore event-sourced di `regole`: tiene `eventi:
// Evento[]`, ogni comando li accoda e la board ridisegna `ricostruisci(eventi)`. Costruisci
// l'incontro pescando dal bestiario SRD bundlato (opzione 1), tira l'iniziativa, poi
// l'attivo agisce (attacco/TS/multiattacco/cura) scegliendo il bersaglio; passa-turno e
// annulla. Sostituirà Initiative Tracker + il rendering di Fantasy Statblocks. Lo stato è in
// memoria (per-vista); persistere gli eventi su nota è un passo successivo. I PG (via
// daAttore) sono lo Spike E.
class BoardView extends ItemView {
  private eventi: Evento[] = [];
  private bestiario: any[] = [];
  private errore: string | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: GdrPlugin) { super(leaf); }

  getViewType() { return VIEW_TYPE_BOARD; }
  getDisplayText() { return "Board di combattimento"; }
  getIcon() { return "swords"; }

  async onOpen() {
    try { this.bestiario = await this.plugin.loadBestiario(); }
    catch (e: any) { this.errore = e?.message ?? String(e); }
    this.eventi = this.plugin.loadBoard(); // ripristina il combattimento in corso
    this.render();
  }

  private stato(): Stato { return ricostruisci(this.eventi); }
  // Ridisegna E persiste: unico punto d'uscita dopo ogni mutazione degli eventi.
  private commit() { this.render(); void this.plugin.saveBoard(this.eventi); }
  // Accoda eventi e committa. Unico punto per i comandi del motore.
  private push(...ev: Evento[]) { this.eventi.push(...ev); this.commit(); }

  // Avvolge un Combattente (da mostro o PG) in un InPlancia schierato: key unica per copia
  // (`id#n`), nome disambiguato «(2)», «(3)» dal secondo doppione in poi, PF pieni.
  private schieraDaBase(base: Combattente, lato: "alleato" | "nemico"): InPlancia {
    const simili = this.stato().combattenti.filter((c) => c.id === base.id).length;
    const nome = simili > 0 ? `${base.nome} (${simili + 1})` : base.nome;
    return { ...base, key: `${base.id}#${simili + 1}`, nome, pf_attuali: base.pf_max, iniziativa: null, schieramento: lato };
  }

  // Picker sul bestiario (334 mostri) → aggiunge un mostro del lato scelto.
  private async aggiungi(lato: "alleato" | "nemico") {
    if (!this.bestiario.length) { new Notice("Bestiario non caricato."); return; }
    const raw = await suggester(this.app, (m: any) => m.nome, this.bestiario, false, `Aggiungi ${lato === "nemico" ? "un nemico" : "un alleato"}`);
    if (raw) this.push({ tipo: "aggiunto", combattente: this.schieraDaBase(daMostro(raw), lato) });
  }

  // Picker sui PG del vault → aggiunge un personaggio come alleato (via daPgGdr).
  private async aggiungiPg() {
    const pgs = this.plugin.partyPgs();
    if (!pgs.length) { new Notice("Nessun PG nel vault (categoria=personaggio, tipo=pg)."); return; }
    const scelto = await suggester(this.app, (e: any) => String(e.fm.nome || e.f.basename), pgs, false, "Aggiungi un PG");
    if (scelto) this.push({ tipo: "aggiunto", combattente: this.schieraDaBase(daPgGdr(scelto.fm), "alleato") });
  }

  // Statblock del combattente: mostro → StatblockModal nativa (dal bestiario grezzo);
  // PG → apre la sua nota (che ha già la scheda completa nel vault).
  private apriStatblock(c: InPlancia) {
    if (c.id.startsWith("pg:")) {
      const pg = this.plugin.partyPgs().find((e) => `pg:${String(e.fm.nome ?? "").toLowerCase().replace(/\s+/g, "-")}` === c.id);
      if (pg) void this.app.workspace.getLeaf(false).openFile(pg.f);
      else new Notice("Nota del PG non trovata.");
      return;
    }
    const raw = this.bestiario.find((m) => m.id === c.id);
    if (raw) new StatblockModal(this.app, raw, c).open();
    else new Notice("Statblock non disponibile per questo combattente.");
  }

  // Sceglie un bersaglio fra i candidati (auto se uno solo).
  private pickBersaglio(cands: InPlancia[], titolo: string): Promise<InPlancia | null> {
    if (cands.length === 0) { new Notice("Nessun bersaglio valido."); return Promise.resolve(null); }
    if (cands.length === 1) return Promise.resolve(cands[0]);
    return suggester(this.app, (c: InPlancia) => `${c.nome} — ${c.pf_attuali}/${c.pf_max} PF`, cands, false, titolo);
  }

  // Esegue l'azione dell'attivo instradandola al comando giusto (col bersaglio scelto).
  private async agisci(attore: InPlancia, az: Azione) {
    const s = this.stato();
    const nemici = ordine(s).filter((c) => c.schieramento !== attore.schieramento && inPiedi(c));
    const alleati = ordine(s).filter((c) => c.schieramento === attore.schieramento && inPiedi(c));
    if (az.tipo === "attacco") {
      const t = await this.pickBersaglio(nemici, `${az.nome} → bersaglio`);
      if (t) this.push(...comandoAttacco(s, attore.key, t.key, dadoVero, az));
    } else if (az.tipo === "salvezza") {
      const t = await this.pickBersaglio(nemici, `${az.nome} → bersaglio`);
      if (t) this.push(...comandoSalvezza(s, attore.key, t.key, az, dadoVero));
    } else if (az.tipo === "multiattacco") {
      const t = await this.pickBersaglio(nemici, `${az.nome} → bersaglio`);
      if (t) this.push(...comandoMultiattacco(s, attore.key, t.key, az, dadoVero));
    } else if (az.tipo === "cura") {
      const t = await this.pickBersaglio(alleati, `${az.nome} → chi curare`);
      if (t) this.push(...comandoCura(s, t.key, az, dadoVero));
    } else {
      new Notice(`Azione «${az.nome}» (${az.tipo}) non ancora gestita dalla board.`);
    }
  }

  // Costruisce l'incontro-demo e ne AUTO-GIOCA il copione (dado seminato) — resta come
  // scorciatoia dimostrativa accanto al gioco a mano.
  private seedDemo(seme = (Date.now() & 0xffff)) {
    const byId = new Map(this.bestiario.map((m) => [m.id, m]));
    const vuoi = ["lupo-feroce", "orso-bruno", "goblin-guerriero", "goblin-guerriero"];
    const lati: ("alleato" | "nemico")[] = ["alleato", "alleato", "nemico", "nemico"];
    this.eventi = [];
    vuoi.forEach((id, i) => { const raw = byId.get(id); if (raw) this.eventi.push({ tipo: "aggiunto", combattente: this.schieraDaBase(daMostro(raw), lati[i]) }); });
    let s = (seme >>> 0); const dado: Dado = (f) => { s = (s * 1664525 + 1013904223) >>> 0; return (s % f) + 1; };
    this.eventi.push(...comandoIniziativa(this.stato(), dado), { tipo: "cominciato" });
    for (let step = 0; step < 60 && !esitoScontro(this.stato()); step++) {
      const st = this.stato(); const a = attivo(st); if (!a) break;
      if (inPiedi(a) && a.attacco) {
        const n = ordine(st).find((c) => c.schieramento !== a.schieramento && inPiedi(c));
        if (n) this.eventi.push(...comandoAttacco(st, a.key, n.key, dado));
      }
      this.eventi.push({ tipo: "turno-passato" });
    }
    this.commit();
  }

  private render() {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("gdr-board");

    const head = root.createDiv({ cls: "gdr-board-head" });
    head.createEl("h3", { text: "⚔️ Board di combattimento" });

    if (this.errore) {
      root.createEl("pre", { text: `Bestiario non caricato: ${this.errore}\n(fatto 'npm run build:plugin' + render.py, così data/srd_bestiario.json è nel plugin?)` });
      return;
    }

    const s = this.stato();
    const esito = esitoScontro(s);
    const iniziato = s.round > 0;
    const attivoOra = attivo(s);

    // Barra comandi.
    const bar = root.createDiv({ cls: "gdr-board-controls" });
    const btn = (label: string, fn: () => void, cls = "") => {
      const b = bar.createEl("button", { text: label });
      if (cls) b.addClass(cls);
      b.onclick = fn;
      return b;
    };
    btn("➕ Nemico", () => void this.aggiungi("nemico"));
    btn("➕ Alleato", () => void this.aggiungi("alleato"));
    btn("🎭 PG", () => void this.aggiungiPg());
    if (!iniziato) btn("🎲 Iniziativa", () => this.push(...comandoIniziativa(this.stato()), { tipo: "cominciato" }), "primario");
    else if (!esito) btn("⏭️ Passa turno", () => this.push({ tipo: "turno-passato" }), "primario");
    btn("↩️ Annulla", () => { this.eventi = annullaUltimo(this.eventi); this.commit(); });
    btn("🗑️ Reset", () => { this.eventi = []; this.commit(); });
    btn("🎬 Demo", () => this.seedDemo());

    const sub = root.createDiv({ cls: "gdr-board-sub" });
    sub.setText(!iniziato ? `${s.combattenti.length} combattenti — pre-battaglia` : esito ? `Round ${s.round} — ${esito}` : `Round ${s.round} — in corso`);

    if (!s.combattenti.length) {
      root.createDiv({ cls: "gdr-board-vuoto", text: "Aggiungi creature col bestiario (➕ Nemico / ➕ Alleato) oppure carica la 🎬 Demo." });
      return;
    }

    // Roster: in ordine d'iniziativa a battaglia iniziata, altrimenti in ordine di
    // schieramento (così i combattenti si vedono già in pre-battaglia).
    const lista = root.createDiv({ cls: "gdr-board-roster" });
    for (const c of (iniziato ? ordine(s) : s.combattenti)) {
      const riga = lista.createDiv({ cls: "gdr-board-riga" });
      if (attivoOra && c.key === attivoOra.key) riga.addClass("is-attivo");
      if (!inPiedi(c)) riga.addClass("is-ko");
      riga.createSpan({ cls: "gdr-board-ini", text: c.iniziativa != null ? String(c.iniziativa) : "—" });
      riga.createSpan({ cls: "gdr-board-lato", text: c.schieramento === "alleato" ? "🛡️" : "☠️" });
      const nome = riga.createSpan({ cls: "gdr-board-nome is-click", text: c.nome });
      nome.setAttribute("aria-label", "Apri statblock");
      nome.onclick = () => this.apriStatblock(c);
      riga.createSpan({ cls: "gdr-board-ca", text: `CA ${c.ca}` });
      const pf = riga.createDiv({ cls: "gdr-board-pf" });
      const barra = pf.createDiv({ cls: "gdr-board-pf-fill" });
      const frazione = Math.max(0, Math.min(1, c.pf_attuali / c.pf_max));
      barra.style.width = `${Math.round(frazione * 100)}%`;
      if (frazione <= 0.33) barra.addClass("bassa"); else if (frazione <= 0.66) barra.addClass("media");
      const pfTemp = c.pf_temporanei ? ` (+${c.pf_temporanei})` : "";
      pf.createSpan({ cls: "gdr-board-pf-txt", text: `${c.pf_attuali}/${c.pf_max}${pfTemp}` });
      // Coda: condizioni (chip cliccabili per toglierle) + controlli manuali del GM.
      const coda = riga.createDiv({ cls: "gdr-board-tail" });
      for (const id of s.condizioni[c.key] ?? []) {
        const chip = coda.createSpan({ cls: "gdr-board-cond-chip is-click", text: id });
        chip.setAttribute("aria-label", `Togli «${id}»`);
        chip.onclick = () => this.push({ tipo: "condizione-finita", key: c.key, condizione: id });
      }
      const ctrl = coda.createDiv({ cls: "gdr-board-ctrl" });
      const amt = ctrl.createEl("input", { cls: "gdr-board-amt", attr: { type: "number", min: "1", value: "5", inputmode: "numeric" } });
      const quanti = () => Math.max(1, Math.round(Number(amt.value) || 0));
      const bDmg = ctrl.createEl("button", { text: "−", cls: "gdr-board-dmg" }); bDmg.setAttribute("aria-label", "Infliggi danno");
      bDmg.onclick = () => this.push({ tipo: "danno", key: c.key, quanti: quanti() });
      const bHeal = ctrl.createEl("button", { text: "+", cls: "gdr-board-heal" }); bHeal.setAttribute("aria-label", "Cura");
      bHeal.onclick = () => this.push({ tipo: "cura", key: c.key, quanti: quanti() });
      const bDel = ctrl.createEl("button", { text: "✕", cls: "gdr-board-del" }); bDel.setAttribute("aria-label", "Rimuovi dalla plancia");
      bDel.onclick = () => this.push({ tipo: "rimosso", key: c.key });
    }

    // Azioni dell'attivo (a battaglia iniziata, se in piedi e non c'è ancora un esito).
    if (iniziato && !esito && attivoOra && inPiedi(attivoOra)) {
      const disponibili: Azione[] = (attivoOra.azioni && attivoOra.azioni.length)
        ? attivoOra.azioni
        : (attivoOra.attacco ? [{ nome: attivoOra.attacco.nome, tipo: "attacco", colpire: attivoOra.attacco.colpire, danno: attivoOra.attacco.danno } as Azione] : []);
      const pan = root.createDiv({ cls: "gdr-board-azioni" });
      pan.createEl("h4", { text: `Azioni di turno — ${attivoOra.nome}` });
      const box = pan.createDiv({ cls: "gdr-board-azioni-box" });
      if (disponibili.length) {
        for (const az of disponibili) {
          const b = box.createEl("button", { text: etichettaAzione(az) });
          b.onclick = () => void this.agisci(attivoOra, az);
        }
      } else {
        box.createSpan({ cls: "gdr-board-vuoto", text: "(nessuna azione eseguibile — passa il turno)" });
      }
    }

    // Registro.
    const log = root.createDiv({ cls: "gdr-board-log" });
    log.createEl("h4", { text: "Registro" });
    const righe = log.createEl("div", { cls: "gdr-board-log-righe" });
    for (const riga of registro(this.eventi)) righe.createDiv({ cls: "gdr-board-log-riga", text: riga });
  }

  async onClose() {}
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
