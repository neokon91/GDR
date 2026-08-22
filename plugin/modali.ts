// Modali native (rimpiazzano tp.system.suggester / tp.system.prompt di Templater) + il
// `tpShim` che dà al dispatcher `meta_actions` un `tp` compatibile senza Templater a runtime.
import { App, Modal, SuggestModal } from "obsidian";
import { evalCjs } from "./util";

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
export function suggester(app: App, textItems: any, items: any[], throwOnCancel = false, placeholder = ""): Promise<any> {
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
export function promptModal(app: App, message: string, def = "", throwOnCancel = false): Promise<string | null> {
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
export function tpShim(app: App): any {
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
