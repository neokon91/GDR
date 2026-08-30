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
 * ../docs/architecture.md.
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
import { risolviCondizioni, type RisolviIncantesimo } from "../regole/src/motore/combattente";
// CREATORE PG dal repo condiviso `regole` (Tier 3): il `Catalogo` magro guida `assembla`.
// Il dato arriva da `data/srd_catalogo.json` (gen_catalogo.py); `caricaFonti`+`assembla` derivano l'Attore.
import { caricaFonti, type Catalogo } from "../regole/src/creatore/catalogo";
import { assembla } from "../regole/src/creatore/motore";
import type { Personaggio } from "../regole/src/creatore/personaggio";
import type { Caratteristica } from "../regole/src/creatore/attore";
import { evalCjs } from "./util";
import { suggester, promptModal, multiSuggester, tpShim } from "./modali";
import { renderStatblock, trovaMostro, validaRawMostro, validaDef } from "./statblock";
import { type ArmaCat, personaggioAFrontmatter } from "./adapters";
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

// Estrae una def MECCANICA (`effetti`/`attivita`) dal primo blocco ```yaml del CORPO che ne
// contiene una. Complementare al frontmatter: un blocco YAML nel corpo è VISIBILE ed editabile
// a vista (come lo statblock delle creature), meglio dei dati strutturati nascosti nelle
// Proprietà — così un non-tecnico può autorare la meccanica di oggetti/incantesimi. Scandisce
// tutti i blocchi yaml e ritorna il primo oggetto con `effetti` o `attivita` (gli altri — prosa,
// render — si scartano). Ritorna l'oggetto YAML o null.
function estraiDefBody(testo: string): any | null {
  const re = /```ya?ml[^\n]*\n([\s\S]*?)\n?```/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(testo))) {
    try {
      const raw = parseYaml(m[1]);
      if (raw && typeof raw === "object" && (Array.isArray((raw as any).effetti) || Array.isArray((raw as any).attivita)))
        return raw;
    } catch { /* blocco non-YAML: passa al prossimo */ }
  }
  return null;
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
  private incantesimi: any[] | null = null;
  private oggetti: any[] | null = null;
  private armi: any[] | null = null;
  private catalogo: Catalogo | null = null;
  private abilita: Record<string, { label: string; caratteristica?: string }> | null = null;
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
    this.addCommand({ id: "valida-homebrew", name: "Valida l'homebrew del vault (creature, oggetti, incantesimi, condizioni)", callback: () => void this.apriValidazioneHomebrew() });
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
    this.addCommand({ id: "crea-pg-kernel", name: "Crea PG (kernel condiviso · beta)", callback: () => void this.creaPgKernel() });
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
    const { eventi, saltati } = eventiDaIncontro(fm, bestiario, this.partyPgs(), await this.risolviIncantesimo(), await this.armiCatalogo());
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

  // La `attivita` risolta di una nota def-entity (oggetto/incantesimo/condizione), come la
  // vede la discovery: frontmatter `attivita:`, oppure `effetti:` avvolto, oppure il blocco
  // ```yaml del corpo. undefined se è solo prosa. Usata dalla validazione batch.
  private async attivitaDefNota(f: any, fm: any): Promise<any[] | undefined> {
    let attivita = (fm as any).attivita;
    let effetti = (fm as any).effetti;
    if (!Array.isArray(attivita) && !Array.isArray(effetti)) {
      const def = estraiDefBody(await this.app.vault.cachedRead(f));
      if (def) { attivita = def.attivita; effetti = def.effetti; }
    }
    if (Array.isArray(attivita)) return attivita;
    if (Array.isArray(effetti)) return [{ tipo: "passivo", effetti }];
    return undefined;
  }

  // Check batch di TUTTO l'homebrew giocabile del vault: creature (categoria: creatura, forma
  // RawMostro) + le def-entities (oggetto/incantesimo/condizione, forma effetti/attivita). Per
  // ogni nota: errori (non utilizzabile) e avvisi (utilizzabile ma non giocabile/incompleto).
  // Complementa la validazione inline nel blocco statblock delle creature.
  async apriValidazioneHomebrew() {
    const mdFiles = this.app.vault.getMarkdownFiles();
    const sezioni: string[] = [];
    let totali = 0, ok = 0, conAvvisi = 0, conErrori = 0;
    const conta = (e: string[], a: string[]) => { totali++; if (e.length) conErrori++; else if (a.length) conAvvisi++; else ok++; };
    const riga = (icona: string, nome: string, e: string[], a: string[]) => {
      if (!e.length && !a.length) return `### ✅ ${nome}`;
      const lista = [...e.map((x) => `- ❌ ${x}`), ...a.map((x) => `- ⚠️ ${x}`)].join("\n");
      return `### ${e.length ? "❌" : "⚠️"} ${nome}\n${lista}`;
    };

    // Creature (blocco gdr statblock).
    const creature = mdFiles.filter((f) => String(this.frontmatterOf(f.path)?.categoria ?? "").toLowerCase() === "creatura").sort((a, b) => a.basename.localeCompare(b.basename));
    if (creature.length) {
      const righe: string[] = [];
      for (const f of creature) {
        const raw = estraiRawMostro(await this.app.vault.cachedRead(f));
        if (!raw) { totali++; conErrori++; righe.push(`### ❌ ${f.basename}\n- nessun blocco \`gdr statblock\` valido nella nota`); continue; }
        const { errori, avvisi } = validaRawMostro(raw);
        conta(errori, avvisi); righe.push(riga("", raw.nome ?? f.basename, errori, avvisi));
      }
      sezioni.push(`## 🐾 Creature (${creature.length})\n\n${righe.join("\n\n")}`);
    }

    // Def-entities: oggetto · incantesimo · condizione (effetti/attivita).
    for (const [cat, titolo] of [["oggetto", "🎒 Oggetti"], ["incantesimo", "🔮 Incantesimi"], ["condizione", "＋ Condizioni"]] as const) {
      const note = mdFiles.filter((f) => String(this.frontmatterOf(f.path)?.categoria ?? "").toLowerCase() === cat).sort((a, b) => a.basename.localeCompare(b.basename));
      if (!note.length) continue;
      const righe: string[] = [];
      for (const f of note) {
        const fm = this.frontmatterOf(f.path);
        const attivita = await this.attivitaDefNota(f, fm);
        const { errori, avvisi } = validaDef((fm as any)?.nome ?? f.basename, attivita);
        conta(errori, avvisi); righe.push(riga("", String((fm as any)?.nome ?? f.basename), errori, avvisi));
      }
      sezioni.push(`## ${titolo} (${note.length})\n\n${righe.join("\n\n")}`);
    }

    if (!totali) { new Notice("Nessun homebrew giocabile (creatura/oggetto/incantesimo/condizione) nel vault."); return; }
    const md = `# 🏠 Validazione homebrew del vault\n\n**${totali}** voci — ✅ ${ok} · ⚠️ ${conAvvisi} · ❌ ${conErrori}\n\n${sezioni.join("\n\n")}`;
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
      let effetti = (fm as any).effetti;
      if (!Array.isArray(attivita) && !Array.isArray(effetti)) {
        // Fallback: blocco ```yaml nel corpo (visibile/editabile, come oggetti/incantesimi).
        const def = estraiDefBody(await this.app.vault.cachedRead(f));
        if (def) { attivita = def.attivita; effetti = def.effetti; }
      }
      if (!Array.isArray(attivita) && Array.isArray(effetti)) {
        attivita = [{ tipo: "passivo", effetti }];
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

  // Oggetti-effetto HOMEBREW del vault (categoria: oggetto): un oggetto magico è un Active
  // Effect sul portatore — la STESSA forma delle condizioni (§5): `effetti:` diretto o
  // `attivita:` completo. Es. Spada +1 → {bersaglio: colpire/danno, operazione: somma, valore:
  // {piatto:1}}. Id `oggetto:<slug>` (distinto dalle condizioni `homebrew:*`) → chip 🎒 nella
  // Board. Rilette a ogni chiamata (l'utente le edita). Mordono i tiri come le condizioni.
  async homebrewOggetti(): Promise<any[]> {
    const out: any[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const fm = this.frontmatterOf(f.path);
      if (!fm || String(fm.categoria ?? "").toLowerCase() !== "oggetto") continue;
      let attivita = (fm as any).attivita;
      let effetti = (fm as any).effetti;
      if (!Array.isArray(attivita) && !Array.isArray(effetti)) {
        // Fallback: blocco ```yaml nel corpo (visibile/editabile, come lo statblock delle creature).
        const def = estraiDefBody(await this.app.vault.cachedRead(f));
        if (def) { attivita = def.attivita; effetti = def.effetti; }
      }
      if (!Array.isArray(attivita) && Array.isArray(effetti)) {
        attivita = [{ tipo: "passivo", effetti }];
      }
      if (!Array.isArray(attivita)) continue; // nessun effetto meccanico → è solo prosa, salta
      const id = (fm as any).id ? String((fm as any).id) : `oggetto:${f.basename.toLowerCase().replace(/\s+/g, "-")}`;
      out.push({ id, nome: String((fm as any).nome ?? f.basename), attivita });
    }
    return out;
  }

  // Gli oggetti-effetto SRD bundlati (sidecar gen_oggetti.py): le voci di archivio magic_items
  // che portano `effetti:` (il dato vive in archivio, qui si legge). Letto una volta, on-demand.
  async loadOggetti(): Promise<any[]> {
    if (!this.oggetti) {
      let grezzi: any[] = [];
      try { grezzi = JSON.parse(await this.app.vault.adapter.read(`${this.manifest.dir}/data/srd_oggetti.json`)) as any[]; }
      catch { grezzi = []; }
      // Normalizza al formato di homebrewOggetti: `effetti:` → attività passiva, così
      // risolviCondizioni li fa mordere e il picker mostra il nome.
      this.oggetti = grezzi.map((o) => ({
        id: o.id,
        nome: o.nome,
        attivita: Array.isArray(o.attivita) ? o.attivita
          : Array.isArray(o.effetti) ? [{ tipo: "passivo", effetti: o.effetti }] : undefined,
      })).filter((o) => Array.isArray(o.attivita));
    }
    return this.oggetti;
  }

  // Gli oggetti-effetto completi per la Board: SRD bundlati + homebrew del vault. Sorgente del
  // picker «🎒 Equipaggia». Ognuno può portare `effetti:` (avvolto in un'attività passiva a
  // schieramento) o `attivita:` completo — loadDefsCondizioni li risolve e li fa mordere.
  async oggettiComplete(): Promise<any[]> {
    return [...(await this.loadOggetti()), ...(await this.homebrewOggetti())];
  }

  // Le ARMI SRD bundlate (gen_armi.py): forma normalizzata per il deriver arma→attacco dei PG.
  async loadArmi(): Promise<any[]> {
    if (!this.armi) {
      try { this.armi = JSON.parse(await this.app.vault.adapter.read(`${this.manifest.dir}/data/srd_armi.json`)) as any[]; }
      catch { this.armi = []; }
    }
    return this.armi;
  }

  // Il CATALOGO magro del creatore PG (sidecar gen_catalogo.py): classi/specie/background/
  // sottoclassi/talenti/lingue/incantesimi/oggetti SRD, la forma che il kernel condiviso
  // (`regole/creatore`, `caricaFonti` + `assembla`) sa risolvere in un `Attore`. Tier 3 Fase B:
  // qui c'è solo il caricamento; chi lo consuma (creazione PG col kernel) è la Fase C. Letto una
  // volta, on-demand. Su file mancante torna un catalogo VUOTO (mai crash): l'assenza dei dati non
  // deve rompere il plugin, si vede a valle come "nessuna classe disponibile".
  async loadCatalogo(): Promise<Catalogo> {
    if (!this.catalogo) {
      const vuoto: Catalogo = {
        classi: [], specie: [], background: [], sottoclassi: [],
        talenti: [], lingue: [], incantesimi: [], oggetti: [],
      };
      try { this.catalogo = JSON.parse(await this.app.vault.adapter.read(`${this.manifest.dir}/data/srd_catalogo.json`)) as Catalogo; }
      catch { this.catalogo = vuoto; }
    }
    return this.catalogo;
  }

  // Il vocabolario delle abilità (slug → {label, caratteristica}) dal `personaggio.json` del vault:
  // serve al wizard kernel per etichette leggibili e per il caso «scegli fra TUTTE le abilità».
  // Fonte-dati del vault (la stessa di crea_pg); on-demand, tollerante (mappa vuota se assente).
  async loadAbilita(): Promise<Record<string, { label: string; caratteristica?: string }>> {
    if (!this.abilita) {
      try {
        const d = JSON.parse(await this.app.vault.adapter.read("z.automazioni/data/personaggio.json"));
        this.abilita = (d && typeof d.abilita === "object") ? d.abilita : {};
      } catch { this.abilita = {}; }
    }
    return this.abilita;
  }

  // Il catalogo armi (nome-minuscolo → arma) per l'offensiva dei PG nella Board: SRD bundlate +
  // homebrew del vault (note `oggetto` con tipo=arma; parità di campi danno/proprieta). Passato a
  // `daPgGdr`, trasforma le `padronanze_armi` del PG in bottoni d'attacco.
  async armiCatalogo(): Promise<Record<string, ArmaCat>> {
    const cat: Record<string, ArmaCat> = {};
    for (const a of await this.loadArmi()) if (a?.nome) cat[String(a.nome).toLowerCase()] = a;
    // Homebrew (le armi del vault): sovrascrivono/aggiungono, come per le altre entità.
    for (const f of this.app.vault.getMarkdownFiles()) {
      const fm = this.frontmatterOf(f.path);
      if (!fm || String(fm.categoria ?? "").toLowerCase() !== "oggetto" || String((fm as any).tipo ?? "").toLowerCase() !== "arma") continue;
      const nome = String((fm as any).nome ?? f.basename);
      const proprieta = Array.isArray((fm as any).proprieta) ? (fm as any).proprieta
        : String((fm as any).proprieta ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      cat[nome.toLowerCase()] = {
        nome,
        dado: String((fm as any).danni ?? (fm as any).dado ?? ""),
        proprieta,
        distanza: /distanza/i.test(String((fm as any).categoria_arma ?? (fm as any).tipo_arma ?? "")),
      };
    }
    return cat;
  }

  // Le DEFINIZIONI risolte che il motore applica ai tiri (`defs`): condizioni (prono→svantaggio…)
  // E oggetti-effetto (Spada +1 → +1 colpire/danno). Stessa macchina risolviCondizioni: entrambi
  // sono Active Effects applicati via `condizione-inflitta`. Include l'homebrew → NON cachato.
  async loadDefsCondizioni(): Promise<DefinizioniCondizioni> {
    return risolviCondizioni([...(await this.condizioniComplete()), ...(await this.oggettiComplete())]);
  }

  // Gli incantesimi SRD (sidecar generato da gen_incantesimi.py): il catalogo GREZZO da cui il
  // `RisolviIncantesimo` pesca l'attività eseguibile. Letto una volta, on-demand.
  async loadIncantesimi(): Promise<any[]> {
    if (!this.incantesimi) {
      try { this.incantesimi = JSON.parse(await this.app.vault.adapter.read(`${this.manifest.dir}/data/srd_incantesimi.json`)) as any[]; }
      catch { this.incantesimi = []; }
    }
    return this.incantesimi;
  }

  // Incantesimi HOMEBREW del vault (categoria: incantesimo): un def della stessa forma degli SRD,
  // autorato nel frontmatter (`attivita:` come nello statblock §3 — attacco/tiro-salvezza/…).
  // L'id nasce dallo slug del nome-file se assente. Rilette a ogni chiamata (l'utente le edita).
  // Rese lanciabili come le SRD: una creatura le referenzia per id nel suo blocco `incantatore`.
  async homebrewIncantesimi(): Promise<any[]> {
    const out: any[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const fm = this.frontmatterOf(f.path);
      if (!fm || String(fm.categoria ?? "").toLowerCase() !== "incantesimo") continue;
      const id = (fm as any).id ? String((fm as any).id) : `homebrew:${f.basename.toLowerCase().replace(/\s+/g, "-")}`;
      let attivita = Array.isArray((fm as any).attivita) ? (fm as any).attivita : undefined;
      let def: any = null;
      if (!attivita) {
        // Fallback: blocco ```yaml nel corpo (visibile/editabile, tab ⚙ Meccanica del template).
        def = estraiDefBody(await this.app.vault.cachedRead(f));
        if (Array.isArray(def?.attivita)) attivita = def.attivita;
      }
      out.push({
        id,
        nome: String((fm as any).nome ?? f.basename),
        livello: Number((fm as any).livello) || Number(def?.livello) || 0,
        tempo_lancio: (fm as any).tempo_lancio ?? def?.tempo_lancio,
        concentrazione: (fm as any).concentrazione === true || def?.concentrazione === true,
        attivita,
      });
    }
    return out;
  }

  // Il catalogo completo per la Board/motore: gli incantesimi SRD bundlati + gli homebrew del vault.
  async incantesimiCompleti(): Promise<any[]> {
    return [...(await this.loadIncantesimi()), ...(await this.homebrewIncantesimi())];
  }

  // La funzione che il motore (`daMostro(m, risolvi)`) usa per rendere ESEGUIBILE un incantesimo
  // referenziato per id nel blocco `incantatore` di una creatura: cerca nel catalogo (SRD+homebrew)
  // e ne restituisce nome/livello/attività. Indice per id costruito una volta a schieramento;
  // ciò che non trova → l'incantesimo si lancia NARRATO (il motore lo logga, spende lo slot).
  async risolviIncantesimo(): Promise<RisolviIncantesimo> {
    const per_id = new Map<string, any>();
    for (const s of await this.incantesimiCompleti()) if (s?.id) per_id.set(String(s.id), s);
    return (id: string) => per_id.get(id);
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

  // TIER 3 FASE C (beta, ADDITIVO — non ritira crea_pg.js): crea un PG col KERNEL condiviso.
  // Wizard nativo (classe/specie/background dal catalogo + caratteristiche) → Personaggio →
  // `assembla` → Attore → `personaggioAFrontmatter` → nota PG (stesso corpo del template pg, così
  // rende come scheda). Prova che il kernel guida la creazione reale nel plugin, senza toccare il
  // flusso Templater esistente. Ogni passo annullabile (suggester/prompt con throwOnCancel).
  async creaPgKernel() {
    const app = this.app;
    const cat = await this.loadCatalogo();
    if (!cat.classi.length) { new Notice("Catalogo vuoto: lancia la build del plugin (`npm run build`)."); return; }

    const byNome = <T extends { nome: string }>(xs: T[]) => [...xs].sort((a, b) => a.nome.localeCompare(b.nome));
    const classi = byNome(cat.classi), specie = byNome(cat.specie), background = byNome(cat.background);

    try {
      const classe = await suggester(app, classi.map((c) => c.nome), classi, true, "Classe?");
      const spec = await suggester(app, specie.map((s) => s.nome), specie, true, "Specie?");
      const bg = await suggester(app, background.map((b) => b.nome), background, true, "Background?");
      const nome = ((await promptModal(app, "Nome del PG?", "Nuovo PG", true)) ?? "").trim() || "Nuovo PG";
      const livello = Math.max(1, Number.parseInt((await promptModal(app, "Livello?", "1", true)) || "1", 10) || 1);

      // Caratteristiche: array standard 5.5 come default, una per una (l'utente ritocca al volo).
      const ORDINE: Caratteristica[] = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
      const STD = [15, 14, 13, 12, 10, 8];
      const caratteristiche_base = {} as Record<Caratteristica, number>;
      for (let i = 0; i < ORDINE.length; i++) {
        const v = await promptModal(app, `${ORDINE[i]} (standard ${STD[i]})`, String(STD[i]), true);
        caratteristiche_base[ORDINE[i]] = Number.parseInt(v || String(STD[i]), 10) || STD[i];
      }
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      // ASI del background (2024): +2 a una caratteristica fra quelle offerte, +1 a un'altra.
      const bonus_background: Partial<Record<Caratteristica, number>> = {};
      const offerte = (bg.punteggi_caratteristica ?? []) as Caratteristica[];
      if (offerte.length >= 2) {
        const due = await suggester(app, offerte.map(cap), offerte, false, "Background: +2 a quale caratteristica?");
        if (due) {
          bonus_background[due] = 2;
          const resto = offerte.filter((c) => c !== due);
          const uno = await suggester(app, resto.map(cap), resto, false, "Background: +1 a quale caratteristica?");
          if (uno) bonus_background[uno] = 1;
        }
      }

      // Abilità di classe: scegline `quantita` fra le `scelte` (o fra TUTTE se la classe lo permette).
      const ca = classe.competenze_abilita;
      let abilita_classe: string[] = [];
      if (ca && ca.quantita > 0) {
        const vocab = await this.loadAbilita();
        const pool = ca.scelte.includes("tutte") ? Object.keys(vocab) : ca.scelte;
        const label = (slug: string) => vocab[slug]?.label ?? cap(slug);
        const scelti = await multiSuggester<string>(app, pool.map(label), pool, `Scegli ${ca.quantita} abilità di classe`);
        abilita_classe = (scelti ?? []).slice(0, ca.quantita);
      }

      // Sottoclasse: le sottoclassi della classe scelta (in 2024 dal 3º livello). Il campo `classe`
      // delle sottoclassi è lo slug corto → confronto sullo slug finale dell'id classe.
      const corto = (id: string) => id.split(".").pop() ?? id;
      let sottoclasseId: string | undefined;
      const sottoclassi = cat.sottoclassi.filter((s) => corto(String(s.classe ?? "")) === corto(classe.id));
      if (livello >= 3 && sottoclassi.length) {
        const SENZA: any = { id: undefined, nome: "(nessuna)" };
        const opts = [SENZA, ...[...sottoclassi].sort((a, b) => a.nome.localeCompare(b.nome))];
        const scelta = await suggester(app, opts.map((s) => s.nome), opts, false, "Sottoclasse?");
        if (scelta && scelta.id) sottoclasseId = scelta.id;
      }

      // Equipaggiamento iniziale: scegli l'opzione (A/B…) di classe e di background; il motore la
      // risolve in inventario. (Salta in silenzio se una fonte non offre opzioni.)
      const opzione = async (opts: any[] | undefined, titolo: string) =>
        opts?.length ? (await suggester(app, opts.map((o) => o.nome), opts, false, titolo))?.nome : undefined;
      const equipClasse = await opzione(classe.equipaggiamento, "Equipaggiamento di classe?");
      const equipBackground = await opzione(bg.equipaggiamento, "Equipaggiamento del background?");

      // Incantesimi (se la classe lancia): trucchetti + incantesimi noti, coi conteggi della
      // progressione al livello scelto; il pool sono gli incantesimi di classe (join sullo slug corto).
      let trucchetti: string[] = [];
      let incantesimi: string[] = [];
      if (classe.incantesimi) {
        const shortCls = corto(classe.id);
        const riga = (classe.progressione ?? []).find((p) => p.livello === livello);
        const maxLiv = (riga?.slot ?? []).reduce((m, s, i) => (s > 0 ? i + 1 : m), 0);
        const pool = (liv0: boolean) => cat.incantesimi
          .filter((s) => s.classi.includes(shortCls) && (liv0 ? s.livello === 0 : s.livello >= 1 && s.livello <= maxLiv))
          .sort((a, b) => a.livello - b.livello || a.nome.localeCompare(b.nome));
        const nTruc = riga?.trucchetti ?? 0;
        const nSpell = riga?.preparati ?? 0;
        if (nTruc > 0) {
          const p = pool(true);
          const sel = await multiSuggester<any>(app, p.map((s) => s.nome), p, `Scegli ${nTruc} trucchetti`);
          trucchetti = (sel ?? []).slice(0, nTruc).map((s) => s.id);
        }
        if (nSpell > 0 && maxLiv > 0) {
          const p = pool(false);
          const sel = await multiSuggester<any>(app, p.map((s) => `[${s.livello}] ${s.nome}`), p, `Scegli ${nSpell} incantesimi`);
          incantesimi = (sel ?? []).slice(0, nSpell).map((s) => s.id);
        }
      }

      const pg: Personaggio = {
        nome, livello, caratteristiche_base,
        specieId: spec.id, classeId: classe.id, backgroundId: bg.id,
        ...(sottoclasseId ? { sottoclasseId } : {}),
        ...(equipClasse ? { equipClasse } : {}),
        ...(equipBackground ? { equipBackground } : {}),
        ...(trucchetti.length ? { trucchetti } : {}),
        ...(incantesimi.length ? { incantesimi } : {}),
        bonus_background, abilita_classe, talenti: [],
      };

      let fm: Record<string, any>;
      try {
        const attore = assembla(pg, caricaFonti(cat, pg));
        fm = personaggioAFrontmatter(attore);
      } catch (e: any) { new Notice(`Kernel — assemblaggio fallito: ${e?.message ?? e}`); return; }

      // Provenienza (slug corti, come le note del vault) + blocco classi.
      fm.classe = corto(classe.id); fm.specie = corto(spec.id); fm.background = corto(bg.id);
      fm.classi = [{ id: corto(classe.id), livello, sottoclasse: sottoclasseId ? corto(sottoclasseId) : "" }];
      // Campi che il level-up (sali_pg) e la scheda leggono: il dado vita della classe e quanti se
      // ne sono spesi (1 per livello). NB: equipaggiamento/incantesimi/slot NON sono ancora coperti
      // dal wizard kernel → il flusso PG standard resta su crea_pg.js finché non c'è parità piena.
      fm.dado_vita = classe.dado_vita;
      fm.dadi_vita_max = livello;

      await this.scriviNotaPg(fm, nome);
    } catch { new Notice("Creazione PG annullata."); }
  }

  // Scrive la nota PG: serializza il frontmatter e lo inietta nel corpo del template pg (le viste
  // meta-bind leggono i campi). Cartella e template dal core; ripiego prudente se mancano.
  private async scriviNotaPg(fm: Record<string, any>, nome: string) {
    const app = this.app;
    let core: any; try { core = await this.loadCore(); } catch { core = {}; }
    const tpl = (core.templates || []).find((t: any) => t.id === "pg");
    const folder = core.folders?.personaggio ?? "Mondi/Personaggi";
    let body: string;
    try { body = await app.vault.adapter.read(tpl?.target ?? "z.modelli/PG.md"); }
    catch { body = "<% await tp.user.crea_pg(tp) %>\n# `=this.nome`\n"; }
    let content = body.replace(/^<%\s*await\s+tp\.user\.[^%]*%>\s*\n?/m, toFrontmatter(fm));
    const base = nome.replace(/[\\/:]+/g, "-");
    content = content.split("<% tp.config.target_file.basename %>").join(base);
    let dest = `${folder}/${base}.md`;
    for (let n = 2; app.vault.getAbstractFileByPath(dest); n++) dest = `${folder}/${base} ${n}.md`;
    await this.ensureParent(dest);
    const created = await app.vault.create(dest, content);
    app.workspace.getLeaf(false).openFile(created as any);
    new Notice(`PG creato col kernel condiviso → ${dest}`);
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

// --- Serializzazione frontmatter (per la creazione PG col kernel) ------------------------
// Un mini-serializzatore YAML per il frontmatter: scalari, liste di scalari e liste di oggetti
// inline (`- { id: ladro, livello: 1 }`), la forma che usano le note PG del vault. Cita solo i
// valori che lo richiedono. Niente dipendenze: `parseYaml` di Obsidian legge, non scrive.
function yamlScalar(v: any): string {
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  const s = String(v ?? "");
  return /[:#[\]{}"'\n,]|^\s|\s$|^$/.test(s) ? JSON.stringify(s) : s;
}
function toFrontmatter(fm: Record<string, any>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      if (!v.length) { lines.push(`${k}: []`); continue; }
      lines.push(`${k}:`);
      for (const item of v) {
        if (item && typeof item === "object") {
          const inner = Object.entries(item).map(([ik, iv]) => `${ik}: ${yamlScalar(iv)}`).join(", ");
          lines.push(`  - { ${inner} }`);
        } else lines.push(`  - ${yamlScalar(item)}`);
      }
    } else lines.push(`${k}: ${yamlScalar(v)}`);
  }
  return `---\n${lines.join("\n")}\n---\n`;
}
