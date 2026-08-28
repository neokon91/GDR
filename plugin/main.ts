/*
 * GDR — Console DM & Motore (plugin Obsidian).
 *
 * Runtime del vault GDR: riusa `z.automazioni/views.js` e `z.automazioni/meta_actions.js`
 * SENZA modificarli (li carica come CommonJS) e importa la mappa PANELS da `_panels.mjs`.
 * È l'UNICO runtime dei blocchi/azioni (js-engine e Templater sono stati ritirati). Espone:
 *   1. blocco ```gdr <renderX> / `radar <cat>` / `statblock <id>` — re-render reattivo;
 *   2. le AZIONI del dispatcher come comandi nativi + hotkey + ribbon (modali native al posto
 *      di tp.system.suggester/prompt); la CREAZIONE via mini-motore di istanziazione template;
 *   3. CRUSCOTTO DM (dashboard) e BOARD di combattimento (motore `regole`) come ItemView.
 *
 * Struttura (esbuild bundla tutto da qui): util.ts (helper puri) · modali.ts (modali+tpShim) ·
 * adapters.ts (PG→Combattente) · statblock.ts · board.ts · cruscotto.ts. Vedi
 * ../docs/combat_engine.md.
 */
import {
  App, MarkdownRenderer, MarkdownRenderChild, Modal, Notice, Plugin, PluginSettingTab, Setting, parseYaml,
} from "obsidian";
// @ts-ignore — .mjs JS del vault, senza tipi; esbuild lo risolve e tree-shaka al solo PANELS.
import { PANELS } from "../Dev/Source/JS/_panels.mjs";
// Tipi GENERATI dal modello (Dev/Tools/gen_plugin_types.py): la shape di core.json e i
// vocabolari chiusi. Solo type-import → esbuild lo strippa (nessun impatto a runtime).
import type { CoreData } from "./core";
// MOTORE di combattimento dal repo condiviso `regole` (symlink `../regole`, bundlato da esbuild).
import {
  ricostruisci, registro, comandoIniziativa, comandoAttacco,
  type Evento, type Dado, type InPlancia, type DefinizioniCondizioni,
} from "../regole/src/motore/motore";
import { risolviCondizioni } from "../regole/src/motore/combattente";
import { evalCjs } from "./util";
import { suggester, tpShim } from "./modali";
import { renderStatblock, trovaMostro, validaRawMostro } from "./statblock";
import { BoardView, VIEW_TYPE_BOARD } from "./board";
import { CruscottoView, VIEW_TYPE_CRUSCOTTO } from "./cruscotto";
import { eventiDaIncontro } from "./incontro";

// --- Impostazioni del plugin (persistite via loadData/saveData) ---------------------------
interface GdrSettings {
  sezioni: { party: boolean; combattimento: boolean; dadi: boolean; data: boolean; mondo: boolean };
  dadi: string; // "etichetta:espressione" separati da virgola
  board?: Evento[]; // stato della Board di combattimento, persistito così sopravvive al reload
  boardOrigine?: string; // path della nota-Incontro che ha schierato la Board (F2), per «marca risolto»
}
const DEFAULT_SETTINGS: GdrSettings = {
  sezioni: { party: true, combattimento: true, dadi: true, data: true, mondo: true },
  dadi: "d20:1d20, Vantaggio:2d20kh1, Svantaggio:2d20kl1, d100:1d100, 2d6:2d6, 1d8:1d8",
};

const VIEWS_PATH = "z.automazioni/views.js";
const META_PATH = "z.automazioni/meta_actions.js";

// Estrae il RawMostro dal primo blocco ```gdr statblock inline di una nota (creatura homebrew).
// Tollerante alle due forme dell'arg: nel fence (```gdr statblock) o nella prima riga del corpo
// (```gdr\nstatblock). Ritorna null se il blocco manca, non è YAML, o non ha `nome`.
function estraiRawMostro(testo: string): any | null {
  const m = testo.match(/```gdr[^\n]*\n([\s\S]*?)\n?```/);
  if (!m) return null;
  const corpo = m[1].replace(/^\s*statblock[^\n]*\n/, "");
  try {
    const raw = parseYaml(corpo);
    return raw && typeof raw === "object" && (raw as any).nome ? raw : null;
  } catch {
    return null;
  }
}

// Modale generica che rende del Markdown (usata per il report di validazione homebrew).
class ReportModal extends Modal {
  constructor(app: App, private md: string) { super(app); }
  onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("gdr-report");
    void MarkdownRenderer.render(this.app, this.md, this.contentEl, "", new MarkdownRenderChild(this.contentEl));
  }
  onClose() { this.contentEl.empty(); }
}

export default class GdrPlugin extends Plugin {
  private views: any = null;
  private meta: any = null;
  private core: CoreData | null = null;
  private bestiario: any[] | null = null;
  private condizioni: any[] | null = null;
  private condDefs: DefinizioniCondizioni | null = null;
  settings: GdrSettings = DEFAULT_SETTINGS;
  private statusBar: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    // 1. Blocco ```gdr <renderX> (o `radar <cat>` / `statblock <id>`) → monta la vista, con
    //    re-render reattivo sui cambi di frontmatter della nota-sorgente.
    this.registerMarkdownCodeBlockProcessor("gdr", async (source, el, ctx) => {
      // Tolleranza di sintassi. Per convenzione l'argomento (`statblock <id>` / `radar <cat>` /
      // `<vista>`) è la PRIMA RIGA DEL CORPO (```gdr\nstatblock aboleth) — così Obsidian lo passa
      // in `source`. Ma diversi generatori/note lo scrivono nella INFO-STRING del fence
      // (```gdr statblock aboleth): lì Obsidian registra la lingua "gdr" e passa `source` = SOLO
      // corpo, lasciando l'arg nel fence. Lo recuperiamo da getSectionInfo e lo anteponiamo, così
      // le DUE forme rendono identiche (e le note homebrew già scritte a mano non si rompono).
      const info = ctx.getSectionInfo(el);
      const fenceArg = info
        ? (info.text.split("\n")[info.lineStart] || "").replace(/^\s*`{3,}\s*gdr\b\s*/, "").trim()
        : "";
      const src = fenceArg ? fenceArg + (source ? "\n" + source : "") : source;
      const tokens = src.trim().split(/\s+/);
      const name = tokens[0];
      const child = new MarkdownRenderChild(el);
      ctx.addChild(child);
      const reactive = (draw: () => Promise<void>) => {
        void draw();
        child.registerEvent(this.app.metadataCache.on("changed", (f) => {
          if (f?.path === ctx.sourcePath) void draw();
        }));
        // Viste che leggono l'API Dataview (renderEntityPanel/renderConnessioni…): Dataview
        // reindicizza DOPO metadataCache → un ulteriore redraw quando il suo indice cambia.
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

      // Statblock nativo (sostituisce Fantasy Statblocks). Due sintassi, stesso renderer:
      //  · `statblock <id-mostro>` (prima riga, niente corpo) → dato dal bestiario bundlato (SRD);
      //  · `statblock` + CORPO YAML nella forma RawMostro → statblock INLINE homebrew (creature
      //    del vault), senza dipendere da un id del bestiario. Non reattivo (dato immutabile).
      if (name === "statblock") {
        const nl = src.indexOf("\n");
        const corpo = nl < 0 ? "" : src.slice(nl + 1).trim();
        const id = (nl < 0 ? src : src.slice(0, nl)).replace(/^\s*statblock\s*/, "").trim();
        el.empty();
        try {
          let raw: any;
          if (corpo) raw = parseYaml(corpo);                                  // inline homebrew (RawMostro)
          else raw = trovaMostro(await this.loadBestiario(), id);            // lookup SRD per id
          if (raw && typeof raw === "object") {
            renderStatblock(el.createDiv(), raw, undefined, { app: this.app, component: child, sourcePath: ctx.sourcePath });
            // Validazione inline SOLO per l'homebrew (corpo YAML): i campi mancanti schierano
            // con default silenziosi (CA/PF 10, niente PB) → un callout li rende visibili.
            if (corpo) {
              const { errori, avvisi } = validaRawMostro(raw);
              if (errori.length || avvisi.length) {
                const righe = [...errori.map((x) => `> - ❌ ${x}`), ...avvisi.map((x) => `> - ⚠️ ${x}`)].join("\n");
                const md = `> [!${errori.length ? "error" : "warning"}]- Statblock homebrew da rifinire (${errori.length + avvisi.length})\n${righe}`;
                await MarkdownRenderer.render(this.app, md, el.createDiv(), ctx.sourcePath, child);
              }
            }
          } else if (corpo) {
            el.createEl("pre", { text: "Statblock GDR: corpo YAML inline non valido." });
          } else {
            el.createEl("pre", { text: `Statblock GDR: mostro «${id}» non nel bestiario.` });
          }
        } catch (e: any) {
          el.createEl("pre", { text: `Errore statblock: ${e?.message ?? e}` });
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
      { id: "scaffold_statblock", name: "Genera statblock dal GS" },
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

    // 3. Cruscotto DM + Board di combattimento (ItemView): registrazione + comandi + ribbon.
    this.registerView(VIEW_TYPE_CRUSCOTTO, (leaf) => new CruscottoView(leaf, this));
    this.addCommand({ id: "apri-cruscotto", name: "Apri il Cruscotto DM", callback: () => this.activateCruscotto() });
    this.registerView(VIEW_TYPE_BOARD, (leaf) => new BoardView(leaf, this));
    this.addCommand({ id: "apri-board", name: "Apri la Board di combattimento", callback: () => this.activateBoard() });
    this.addCommand({ id: "valida-homebrew", name: "Valida le creature homebrew", callback: () => void this.apriValidazioneHomebrew() });
    // Ricucitura prepara→gioca (F2): dalla nota-Incontro attiva schiera nella Board.
    this.addCommand({
      id: "apri-incontro-in-board",
      name: "Schiera l'incontro nella Board",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const fm = file ? this.frontmatterOf(file.path) : null;
        if (!fm || String(fm.categoria).toLowerCase() !== "incontro") return false;
        if (!checking) void this.apriIncontroInBoard(file!);
        return true;
      },
    });
    this.addCommand({ id: "motore-smoke", name: "DEV: Smoke del motore di combattimento", callback: () => this.motoreSmoke() });
    this.addRibbonIcon("swords", "GDR: Board di combattimento", () => this.activateBoard());
    this.addRibbonIcon("layout-dashboard", "GDR: Cruscotto DM", () => this.activateCruscotto());
    this.addRibbonIcon("moon", "GDR: Riposo lungo (PG attivo)", () => {
      const file = this.app.workspace.getActiveFile();
      if (file) this.riposoLungo(file); else new Notice("Nessuna nota attiva.");
    });

    // 4. WIZARD DI CREAZIONE come comandi nativi (mini-motore di istanziazione template).
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

  // Apre una ItemView come tab dell'AREA PRINCIPALE (non nel laterale stretto): riusa la vista
  // se già aperta lì, altrimenti stacca eventuali istanze laterali e apre a piena pagina.
  private async activateView(type: string) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(type);
    const inMain = existing.find((l) => (l as any).getRoot?.() === (workspace as any).rootSplit);
    if (inMain) { workspace.revealLeaf(inMain); return; }
    existing.forEach((l) => l.detach());
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type, active: true });
    workspace.revealLeaf(leaf);
  }
  activateCruscotto() { return this.activateView(VIEW_TYPE_CRUSCOTTO); }
  activateBoard() { return this.activateView(VIEW_TYPE_BOARD); }

  // Ricarica le Board già aperte dagli eventi persistiti (dopo aver caricato un Incontro).
  refreshBoard() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_BOARD)) {
      const v: any = leaf.view;
      if (v && typeof v.ricarica === "function") v.ricarica();
    }
  }

  // Ricucitura prepara→gioca (F2): dalla nota-Incontro costruisce lo schieramento (creature
  // collegate = nemici, alleati collegati + PG del party = alleati, override `varianti`),
  // lo PERSISTE come stato-board e apre/ricarica la Board pronta per l'iniziativa. Sostituisce
  // il vecchio flusso ```encounter + Initiative Tracker.
  async apriIncontroInBoard(file: any) {
    let bestiario: any[];
    try { bestiario = await this.bestiarioCompleto(); }
    catch (e: any) { new Notice(`Bestiario non caricato: ${e?.message ?? e}`); return; }
    const fm = this.frontmatterOf(file.path);
    const { eventi, saltati } = eventiDaIncontro(fm, bestiario, this.partyPgs());
    if (!eventi.length) { new Notice("Incontro vuoto: nessuna creatura/PG risolti."); return; }
    // Traccia la nota d'origine: il pannello Conseguenze potrà marcarla «risolto» senza chiedere.
    this.settings.boardOrigine = file.path;
    await this.saveBoard(eventi);
    await this.activateBoard();
    this.refreshBoard();
    const nNem = eventi.filter((e) => e.tipo === "aggiunto" && (e as any).combattente.schieramento === "nemico").length;
    const nAll = eventi.length - nNem;
    let msg = `Schierato «${fm.nome ?? file.basename}»: ${nNem} nemici, ${nAll} alleati. Tira l'iniziativa.`;
    if (saltati.length) msg += `\n⚠️ Non nel bestiario (saltati): ${saltati.join(", ")}.`;
    new Notice(msg, 9000);
  }

  // DEV — smoke del motore: micro-battaglia deterministica (Eroina vs due Goblin) coi comandi
  // reali di `regole`; stampa il registro. Prova che il motore bundlato gira in-app.
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
    gioca(...comandoIniziativa(s(), dado), { tipo: "cominciato" });
    gioca(...comandoAttacco(s(), "eroe", "gob1", dado));
    gioca({ tipo: "turno-passato" });
    gioca(...comandoAttacco(s(), "gob2", "eroe", dado));
    gioca(...comandoAttacco(s(), "eroe", "gob1", dado));
    const finale = s();
    const log = [
      ...registro(eventi), "— Stato finale —",
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
    // ignora): dal cruscotto passiamo un file di ripiego come tp.config.target_file.
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

  // Catalogo core.json (assi per categoria, ecc.): immutabile a runtime → letto una volta.
  async loadCore(): Promise<CoreData> {
    if (!this.core) this.core = JSON.parse(await this.app.vault.adapter.read("z.automazioni/data/core.json")) as CoreData;
    return this.core;
  }

  // Bestiario SRD (sidecar generato da gen_bestiario.py, copiato accanto a main.js): i mostri
  // GREZZI che `daMostro` converte in Combattente. Letto una volta, on-demand.
  async loadBestiario(): Promise<any[]> {
    if (!this.bestiario) {
      this.bestiario = JSON.parse(await this.app.vault.adapter.read(`${this.manifest.dir}/data/srd_bestiario.json`)) as any[];
    }
    return this.bestiario;
  }

  // Creature HOMEBREW del vault: le note `categoria: creatura` col loro RawMostro nel blocco
  // ```gdr statblock inline. Rilette a ogni chiamata (l'utente le edita); l'id nasce dallo slug
  // del nome-file se il blocco non lo porta. Rende l'homebrew schiera-bile come i mostri SRD —
  // stesso schema, stesso motore (daMostro), stessa Board.
  async homebrewCreature(): Promise<any[]> {
    const out: any[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (String(this.frontmatterOf(f.path)?.categoria ?? "").toLowerCase() !== "creatura") continue;
      const raw = estraiRawMostro(await this.app.vault.cachedRead(f));
      if (raw) {
        if (!raw.id) raw.id = `homebrew:${f.basename.toLowerCase().replace(/\s+/g, "-")}`;
        out.push(raw);
      }
    }
    return out;
  }

  // Roster completo per la Board: bestiario SRD bundlato + creature homebrew del vault.
  async bestiarioCompleto(): Promise<any[]> {
    return [...(await this.loadBestiario()), ...(await this.homebrewCreature())];
  }

  // Check batch di TUTTE le creature homebrew (categoria: creatura): apre un report con, per
  // ogni nota, gli errori (non utilizzabile) e gli avvisi (schiera con default). Complementa la
  // validazione inline nel blocco statblock.
  async apriValidazioneHomebrew() {
    const note = this.app.vault.getMarkdownFiles()
      .filter((f) => String(this.frontmatterOf(f.path)?.categoria ?? "").toLowerCase() === "creatura")
      .sort((a, b) => a.basename.localeCompare(b.basename));
    if (!note.length) { new Notice("Nessuna creatura homebrew (categoria: creatura) nel vault."); return; }
    const righe: string[] = [];
    let ok = 0, conAvvisi = 0, conErrori = 0;
    for (const f of note) {
      const raw = estraiRawMostro(await this.app.vault.cachedRead(f));
      if (!raw) { conErrori++; righe.push(`### ❌ ${f.basename}\n- nessun blocco \`gdr statblock\` valido nella nota`); continue; }
      const { errori, avvisi } = validaRawMostro(raw);
      if (!errori.length && !avvisi.length) { ok++; righe.push(`### ✅ ${raw.nome ?? f.basename}`); continue; }
      if (errori.length) conErrori++; else conAvvisi++;
      const lista = [...errori.map((x) => `- ❌ ${x}`), ...avvisi.map((x) => `- ⚠️ ${x}`)].join("\n");
      righe.push(`### ${errori.length ? "❌" : "⚠️"} ${raw.nome ?? f.basename}\n${lista}`);
    }
    const md = `# 🏠 Validazione creature homebrew\n\n**${note.length}** creature — ✅ ${ok} · ⚠️ ${conAvvisi} · ❌ ${conErrori}\n\n${righe.join("\n\n")}`;
    new ReportModal(this.app, md).open();
  }

  // Le condizioni GREZZE dal sidecar (gen_condizioni.py): per il picker manuale.
  async loadCondizioni(): Promise<any[]> {
    if (!this.condizioni) {
      try { this.condizioni = JSON.parse(await this.app.vault.adapter.read(`${this.manifest.dir}/data/srd_condizioni.json`)) as any[]; }
      catch { this.condizioni = []; }
    }
    return this.condizioni;
  }

  // Condizioni/effetti HOMEBREW del vault (categoria: condizione): un def della stessa forma
  // delle SRD, autorato nel frontmatter. Ergonomico: `effetti:` diretto (lo avvolgo in
  // un'attività passiva) OPPURE `attivita:` completo (come le SRD). Rilette a ogni chiamata
  // (l'utente le edita). Rese mordenti+schiera-bili come le SRD — stesso motore risolviCondizioni.
  async homebrewCondizioni(): Promise<any[]> {
    const out: any[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const fm = this.frontmatterOf(f.path);
      if (!fm || String(fm.categoria ?? "").toLowerCase() !== "condizione") continue;
      let attivita = (fm as any).attivita;
      if (!Array.isArray(attivita) && Array.isArray((fm as any).effetti)) {
        attivita = [{ tipo: "passivo", effetti: (fm as any).effetti }];
      }
      if (!Array.isArray(attivita)) continue; // nessun effetto meccanico → è solo prosa, salta
      const id = (fm as any).id ? String((fm as any).id) : `homebrew:${f.basename.toLowerCase().replace(/\s+/g, "-")}`;
      out.push({ id, nome: String((fm as any).nome ?? f.basename), attivita });
    }
    return out;
  }

  // Le condizioni complete per la Board/motore: le SRD bundlate + gli effetti homebrew del vault.
  async condizioniComplete(): Promise<any[]> {
    return [...(await this.loadCondizioni()), ...(await this.homebrewCondizioni())];
  }

  // Le DEFINIZIONI delle condizioni risolte (prono→svantaggio…): il motore le applica ai tiri
  // quando gliele si passa come `defs`. Include l'homebrew → NON cachato (l'utente edita).
  async loadDefsCondizioni(): Promise<DefinizioniCondizioni> {
    return risolviCondizioni(await this.condizioniComplete());
  }

  // I PG del vault (categoria=personaggio, tipo=pg), col frontmatter. Sorgente condivisa fra
  // Cruscotto (Party) e Board (schierare i PG). Ordinati per nome.
  partyPgs(): { f: any; fm: any }[] {
    return this.app.vault.getMarkdownFiles()
      .map((f) => ({ f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter || {}) as any }))
      .filter((e) => e.fm.categoria === "personaggio" && String(e.fm.tipo).toLowerCase() === "pg")
      .sort((a, b) => String(a.fm.nome || a.f.basename).localeCompare(String(b.fm.nome || b.f.basename)));
  }

  // Persistenza della Board: gli eventi vivono nel data.json del plugin, così il combattimento
  // sopravvive a un reload. Salvataggio "nudo" (niente refreshCruscotti/statusBar).
  async saveBoard(eventi: Evento[]) {
    this.settings.board = eventi;
    if (!eventi.length) this.settings.boardOrigine = undefined; // board svuotata (Reset) → dimentica l'origine
    await this.saveData(this.settings);
  }
  loadBoard(): Evento[] { return Array.isArray(this.settings.board) ? this.settings.board : []; }
  loadBoardOrigine(): string | null { return this.settings.boardOrigine ?? null; }

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

  // Un comando `gdr:crea-<id>` per template (i bottoni Meta Bind li chiamano) + un picker.
  async registerCreationCommands() {
    let core: any;
    try { core = await this.loadCore(); } catch { return; }
    const templates: any[] = core.templates || [];
    for (const t of templates) {
      this.addCommand({ id: `crea-${t.id}`, name: `Crea ${t.title}`, callback: () => this.createFromTemplate(t.id) });
    }
    this.addCommand({
      id: "crea",
      name: "Crea… (scegli il tipo)",
      callback: async () => {
        const chosen = await suggester(this.app, templates.map((t) => t.title), templates, false, "Cosa vuoi creare?");
        if (chosen) this.createFromTemplate((chosen as any).id);
      },
    });
  }

  // Istanzia un template SENZA Templater: esegue il wizard (crea_pg o create_entity) col
  // tpShim esteso (tp.file.move REGISTRA la destinazione), poi compone frontmatter + corpo.
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

    // Corpo: rimpiazza la riga `<% await tp.user.crea_X(tp) %>` col frontmatter e
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
    toggle("combattimento", "Combattimento", "Board di combattimento (GDR).");
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
