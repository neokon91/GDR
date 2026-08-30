// Board di combattimento: tracker pilotato dal motore event-sourced di `regole`. Tiene
// `eventi: Evento[]`, ogni comando li accoda e la board ridisegna `ricostruisci(eventi)`.
// Incontro dal bestiario SRD bundlato + PG del vault; azioni di turno con scelta bersaglio;
// controlli GM (danno/cura/condizioni); statblock nativo; persistenza tra reload.
import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import {
  ricostruisci, registro, ordine, attivo, esitoScontro, inPiedi, dadoVero, annullaUltimo,
  comandoIniziativa, comandoAttacco, comandoSalvezza, comandoMultiattacco, comandoCura,
  comandoLeggendaria, leggendarieRestanti, comandoLancia, slotRestanti, usiRestanti,
  comandoSostituisciEsito, sostituzioniDisponibili, sostituzioniRestanti,
  type Evento, type Dado, type InPlancia, type Stato, type DefinizioniCondizioni,
} from "../regole/src/motore/motore";
import { daMostro, type Combattente, type Azione, type RisolviIncantesimo, type IncantesimoLanciabile } from "../regole/src/motore/combattente";
import { StatblockModal, trovaMostro } from "./statblock";
import { daPgGdr } from "./adapters";
import { suggester, multiSuggester } from "./modali";
import type GdrPlugin from "./main";

export const VIEW_TYPE_BOARD = "gdr-board";

// Etichetta breve per un bottone-azione, per tipo (attacco/salvezza/multiattacco/cura).
function etichettaAzione(az: Azione): string {
  if (az.tipo === "attacco") return `⚔️ ${az.nome} (+${az.colpire})`;
  if (az.tipo === "salvezza") return `✨ ${az.nome} (CD ${az.cd})`;
  if (az.tipo === "multiattacco") return `⚔️⚔️ ${az.nome}`;
  if (az.tipo === "cura") return `➕ ${az.nome}`;
  return `• ${az.nome}`;
}

// Etichetta breve per un bottone-incantesimo: costo (trucchetto/livello/usi) + 🌀 concentrazione
// + «·narrato» se non ancora meccanizzato (si lancia lo stesso, lo risolve il GM leggendo).
function etichettaIncantesimo(spell: IncantesimoLanciabile, costo: string): string {
  const conc = spell.concentrazione ? " 🌀" : "";
  const narrato = spell.azioni.length ? "" : " ·narrato";
  return `🔮 ${spell.nome} (${costo})${conc}${narrato}`;
}

export class BoardView extends ItemView {
  private eventi: Evento[] = [];
  private bestiario: any[] = [];
  private condLista: any[] = [];
  private oggetti: any[] = []; // oggetti-effetto homebrew, per il picker «🎒 Equipaggia»
  private armiCat: Record<string, any> = {}; // catalogo armi (nome→arma), per l'offensiva PG
  private nomiEffetti: Record<string, string> = {}; // id → nome, per i chip (condizioni + oggetti)
  private defs: DefinizioniCondizioni = {};
  private risolvi: RisolviIncantesimo = () => undefined; // catalogo incantesimi SRD+homebrew → attività eseguibile
  private errore: string | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: GdrPlugin) { super(leaf); }

  getViewType() { return VIEW_TYPE_BOARD; }
  getDisplayText() { return "Board di combattimento"; }
  getIcon() { return "swords"; }

  async onOpen() {
    try { this.bestiario = await this.plugin.bestiarioCompleto(); }
    catch (e: any) { this.errore = e?.message ?? String(e); }
    this.condLista = await this.plugin.condizioniComplete(); // SRD + homebrew, per il picker manuale
    this.oggetti = await this.plugin.oggettiComplete(); // oggetti-effetto homebrew, per «🎒 Equipaggia»
    this.armiCat = await this.plugin.armiCatalogo(); // armi SRD+homebrew, per gli attacchi dei PG
    this.defs = await this.plugin.loadDefsCondizioni(); // effetti condizioni+oggetti automatici sui tiri
    this.risolvi = await this.plugin.risolviIncantesimo(); // incantesimi SRD+homebrew, per il lancio
    // Mappa id→nome per i chip (invece del crudo id): condizioni + oggetti.
    this.nomiEffetti = {};
    for (const x of [...this.condLista, ...this.oggetti]) if (x?.id) this.nomiEffetti[String(x.id)] = String(x.nome ?? x.id);
    this.eventi = this.plugin.loadBoard(); // ripristina il combattimento in corso
    this.render();
  }

  // Ricarica gli eventi persistiti e ridisegna (dopo che il plugin ha caricato un Incontro
  // nella Board mentre questa era già aperta).
  ricarica() { this.eventi = this.plugin.loadBoard(); this.render(); }

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
    // Le creature homebrew del vault (id `homebrew:*`) sono marcate 🏠 nel picker, accanto agli SRD.
    const etich = (m: any) => (typeof m.id === "string" && m.id.startsWith("homebrew:") ? `🏠 ${m.nome}` : m.nome);
    const raw = await suggester(this.app, etich, this.bestiario, false, `Aggiungi ${lato === "nemico" ? "un nemico" : "un alleato"}`);
    if (raw) this.push({ tipo: "aggiunto", combattente: this.schieraDaBase(daMostro(raw, this.risolvi), lato) });
  }

  // Picker sui PG del vault → aggiunge un personaggio come alleato (via daPgGdr).
  private async aggiungiPg() {
    const pgs = this.plugin.partyPgs();
    if (!pgs.length) { new Notice("Nessun PG nel vault (categoria=personaggio, tipo=pg)."); return; }
    const scelto = await suggester(this.app, (e: any) => String(e.fm.nome || e.f.basename), pgs, false, "Aggiungi un PG");
    if (scelto) this.push({ tipo: "aggiunto", combattente: this.schieraDaBase(daPgGdr(scelto.fm, this.armiCat), "alleato") });
  }

  // Applica una condizione a mano (il GM la impone spesso da effetti non meccanizzati).
  private async applicaCondizione(c: InPlancia) {
    if (!this.condLista.length) { new Notice("Nessuna condizione caricata."); return; }
    const scelta = await suggester(this.app, (x: any) => String(x.nome ?? x.id), this.condLista, false, `Condizione su ${c.nome}`);
    if (scelta?.id) this.push({ tipo: "condizione-inflitta", key: c.key, condizione: scelta.id });
  }

  // Equipaggia un oggetto-effetto homebrew: un Active Effect sul portatore (Spada +1 → +1
  // colpire/danno), applicato come una condizione. Il chip 🎒 lo mostra; cliccarlo lo disequipaggia.
  private async equipaggia(c: InPlancia) {
    if (!this.oggetti.length) { new Notice("Nessun oggetto homebrew (categoria: oggetto con effetti) nel vault."); return; }
    const scelta = await suggester(this.app, (x: any) => `🎒 ${x.nome ?? x.id}`, this.oggetti, false, `Equipaggia su ${c.nome}`);
    if (scelta?.id) this.push({ tipo: "condizione-inflitta", key: c.key, condizione: scelta.id });
  }

  // Nome leggibile di un effetto applicato (condizione o oggetto): dalla mappa id→nome, con
  // ripiego sullo slug nudo dell'id. Gli oggetti (id `oggetto:*`) portano il prefisso 🎒.
  private nomeEffetto(id: string): string {
    const nome = this.nomiEffetti[id] ?? id.split(/[:.]/).pop() ?? id;
    return id.startsWith("oggetto:") ? `🎒 ${nome}` : nome;
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
    const raw = trovaMostro(this.bestiario, c.id);
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
      if (t) this.push(...comandoAttacco(s, attore.key, t.key, dadoVero, az, this.defs));
    } else if (az.tipo === "salvezza") {
      const t = await this.pickBersaglio(nemici, `${az.nome} → bersaglio`);
      if (t) this.push(...comandoSalvezza(s, attore.key, t.key, az, dadoVero, this.defs));
    } else if (az.tipo === "multiattacco") {
      const t = await this.pickBersaglio(nemici, `${az.nome} → bersaglio`);
      if (t) this.push(...comandoMultiattacco(s, attore.key, t.key, az, dadoVero, this.defs));
    } else if (az.tipo === "cura") {
      const t = await this.pickBersaglio(alleati, `${az.nome} → chi curare`);
      if (t) this.push(...comandoCura(s, t.key, az, dadoVero));
    } else {
      new Notice(`Azione «${az.nome}» (${az.tipo}) non ancora gestita dalla board.`);
    }
  }

  // Lancia un incantesimo: sceglie il livello di slot (upcast, se serve), poi i BERSAGLI (uno o
  // più — le aree si risolvono con un solo picker multi-selezione, come un template VTT che
  // "prende" chi capita). Il motore (comandoLancia) spende slot/uso, apre la concentrazione,
  // esegue le attività coi numeri del lanciatore o LOGGA narrato se non meccanizzato.
  private async lancia(attore: InPlancia, spell: IncantesimoLanciabile) {
    const s = this.stato();
    // Il livello di lancio. `livelloLancio` = livello FISSO (mostri: "Cono di freddo di 9º").
    // Un trucchetto (livello 0) o un "X/giorno" non scelgono lo slot; un incantesimo di livello
    // con slot lascia scegliere il livello (≥ suo) fra quelli con slot residui (upcasting).
    const livelloBase = spell.livelloLancio ?? spell.livello;
    let livelloSlot = livelloBase;
    if (spell.usiGiornalieri == null && spell.livello > 0) {
      const maxLiv = attore.incantatore?.slot.length ?? 0;
      const scelte: number[] = [];
      for (let L = spell.livello; L <= maxLiv; L++) if (slotRestanti(s, attore.key, L) > 0) scelte.push(L);
      if (!scelte.length) { new Notice(`Nessuno slot disponibile per ${spell.nome}.`); return; }
      if (scelte.length === 1) livelloSlot = scelte[0];
      else {
        const L = await suggester(this.app, (n: number) => `Livello ${n} (${slotRestanti(s, attore.key, n)} slot)`, scelte, false, `Lancia ${spell.nome} a che livello?`);
        if (L == null) return;
        livelloSlot = L;
      }
    }
    // I bersagli: tutti i combattenti in piedi (anche alleati — buff/cura; anche sé). Il GM
    // spunta chi è preso. Nessun bersaglio = lancio "a vuoto"/su di sé narrato (il motore regge []).
    const cands = ordine(s).filter((c) => inPiedi(c));
    const scelti = await multiSuggester(this.app, (c: InPlancia) => `${c.nome} — ${c.pf_attuali}/${c.pf_max} PF`, cands, `${spell.nome} → bersagli (spunta chi è colpito)`);
    if (scelti == null) return; // annullato
    const bersagli = scelti.map((c) => c.key);
    const ev = comandoLancia(s, attore.key, bersagli, spell.id, livelloSlot, dadoVero, this.defs);
    if (!ev.length) { new Notice(`Impossibile lanciare ${spell.nome} (slot/uso esauriti o azione già spesa).`); return; }
    this.push(...ev);
  }

  // Azione leggendaria: spende dal pozzo (una/round, si ricarica) e risolve l'effetto su un
  // bersaglio (il motore la incanala in comandoAzione). Il bersaglio si sceglie come un attacco.
  private async agisciLeggendaria(attore: InPlancia, leg: { id: string; nome: string; costo?: number }) {
    const s = this.stato();
    const nemici = ordine(s).filter((c) => c.schieramento !== attore.schieramento && inPiedi(c));
    if (!nemici.length) { new Notice("Nessun bersaglio in piedi."); return; }
    const t = await this.pickBersaglio(nemici, `${leg.nome} (leggendaria) → bersaglio`);
    if (t) this.push(...comandoLeggendaria(s, attore.key, t.key, leg.id, dadoVero, this.defs));
  }

  // Pannello Azioni leggendarie: fra un turno e l'altro il boss spende utilizzi leggendari.
  // Mostra ogni creatura col pozzo residuo (esclusa quella di turno: non si usano sul PROPRIO
  // turno). Bottone per azione, disabilitato se il costo supera gli utilizzi rimasti.
  private renderLeggendarie(root: HTMLElement, s: Stato) {
    const attivoOra = attivo(s);
    const legendari = s.combattenti.filter((c) =>
      c.leggendarie && c.leggendarie.utilizzi > 0 && inPiedi(c) &&
      (!attivoOra || c.key !== attivoOra.key) && leggendarieRestanti(s, c.key) > 0);
    if (!legendari.length) return;
    const pan = root.createDiv({ cls: "gdr-board-leggendarie" });
    for (const c of legendari) {
      const restanti = leggendarieRestanti(s, c.key);
      const box = pan.createDiv({ cls: "gdr-board-legg-box" });
      box.createEl("h4", { text: `⭐ Azioni leggendarie — ${c.nome} (${restanti}/${c.leggendarie!.utilizzi})` });
      const btns = box.createDiv({ cls: "gdr-board-azioni-box" });
      for (const leg of c.leggendarie!.azioni) {
        const costo = Number(leg.costo) || 1;
        const b = btns.createEl("button", { text: costo > 1 ? `${leg.nome} (${costo})` : leg.nome });
        if (costo > restanti) b.disabled = true;
        else b.onclick = () => void this.agisciLeggendaria(c, leg);
      }
    }
  }

  // Reazioni all'ESITO offerte dal motore: la Resistenza Leggendaria & simili, che
  // trasformano un TS FALLITO in superato. Il motore le offre (sostituzioniDisponibili) subito
  // dopo il tiro; la Board le mostra come banner d'interruzione, il GM decide se spenderle.
  private renderReazioni(root: HTMLElement, s: Stato) {
    const offerte = sostituzioniDisponibili(this.eventi, s);
    if (!offerte.length) return;
    const pan = root.createDiv({ cls: "gdr-board-reazioni" });
    for (const o of offerte) {
      const c = s.combattenti.find((x) => x.key === o.key);
      const restanti = sostituzioniRestanti(s, o.key);
      const box = pan.createDiv({ cls: "gdr-board-reaz-box" });
      box.createSpan({ cls: "gdr-board-reaz-txt",
        text: `⚡ ${c?.nome ?? o.key}: usa ${o.nome} (${restanti} rimaste) per superare il tiro salvezza fallito?` });
      const b = box.createEl("button", { text: `Usa ${o.nome}` });
      b.onclick = () => this.push(...comandoSostituisciEsito(this.eventi, o.key, o.indice, o.interno));
    }
  }

  // Costruisce l'incontro-demo e ne AUTO-GIOCA il copione (dado seminato) — scorciatoia
  // dimostrativa. I mostri si risolvono con `trovaMostro` (tollerante agli id in migrazione).
  private seedDemo(seme = (Date.now() & 0xffff)) {
    const vuoi = ["lupo-feroce", "orso-bruno", "goblin-guerriero", "goblin-guerriero"];
    const lati: ("alleato" | "nemico")[] = ["alleato", "alleato", "nemico", "nemico"];
    this.eventi = [];
    vuoi.forEach((id, i) => { const raw = trovaMostro(this.bestiario, id); if (raw) this.eventi.push({ tipo: "aggiunto", combattente: this.schieraDaBase(daMostro(raw, this.risolvi), lati[i]) }); });
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

  // --- F5 Conseguenze: a fine scontro, cuce la Board al mondo ------------------
  // Riporta i PF finali dei PG sulle loro note (campo `pf`, quello che la scheda mostra).
  private async riportaPfAiPg(s: Stato) {
    const pgs = this.plugin.partyPgs();
    const pgInPlancia = s.combattenti.filter((c) => c.id.startsWith("pg:"));
    let scritti = 0;
    for (const c of pgInPlancia) {
      const pg = pgs.find((e) => `pg:${String(e.fm.nome ?? "").toLowerCase().replace(/\s+/g, "-")}` === c.id);
      if (!pg) continue;
      await this.app.fileManager.processFrontMatter(pg.f, (fm: any) => {
        fm.pf = c.pf_attuali;
        if (c.pf_temporanei) fm.pf_temp = c.pf_temporanei; else delete fm.pf_temp;
      });
      scritti++;
    }
    new Notice(scritti ? `PF riportati su ${scritti} PG.` : "Nessuna nota PG trovata da aggiornare.");
  }

  // Avanza il clock di un fronte (una nota con `clock_dim`: la macchina-clock è armata).
  private async avanzaFronte() {
    const fronti = this.app.vault.getMarkdownFiles()
      .map((f) => ({ f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter ?? {}) as any }))
      .filter((e) => e.fm.clock_dim != null)
      .sort((a, b) => String(a.fm.nome || a.f.basename).localeCompare(String(b.fm.nome || b.f.basename)));
    if (!fronti.length) { new Notice("Nessun fronte con clock nel vault."); return; }
    const scelto = await suggester(
      this.app,
      (e: any) => `${e.fm.nome ?? e.f.basename} — clock ${Number(e.fm.clock) || 0}/${e.fm.clock_dim}`,
      fronti, false, "Avanza quale fronte?");
    if (!scelto) return;
    let nuovo = 0, dim = 0;
    await this.app.fileManager.processFrontMatter(scelto.f, (fm: any) => {
      dim = Number(fm.clock_dim) || 0;
      nuovo = Math.min(dim, (Number(fm.clock) || 0) + 1);
      fm.clock = nuovo;
    });
    const nome = scelto.fm.nome ?? scelto.f.basename;
    new Notice(nuovo >= dim && dim > 0
      ? `«${nome}»: clock PIENO (${nuovo}/${dim}) — risolvi la conseguenza (Giro del mondo).`
      : `«${nome}»: clock ${nuovo}/${dim}.`);
  }

  // Nome (o basename) della nota-Incontro d'origine, se la Board è stata schierata da una (F2).
  private incontroOrigine(): TFile | null {
    const path = this.plugin.loadBoardOrigine();
    if (!path) return null;
    const f = this.app.vault.getAbstractFileByPath(path);
    return f instanceof TFile ? f : null;
  }
  private nomeNota(f: TFile): string {
    return String(this.app.metadataCache.getFileCache(f)?.frontmatter?.nome ?? f.basename);
  }

  // Marca una nota Incontro come risolta (campo `stato`). Se la Board è stata aperta da una
  // nota-Incontro (F2, tracciata in boardOrigine) usa QUELLA; altrimenti scelta a mano.
  private async marcaIncontroRisolto() {
    let file = this.incontroOrigine();
    if (!file) {
      const incontri = this.app.vault.getMarkdownFiles()
        .map((f) => ({ f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter ?? {}) as any }))
        .filter((e) => String(e.fm.categoria).toLowerCase() === "incontro")
        .sort((a, b) => String(a.fm.nome || a.f.basename).localeCompare(String(b.fm.nome || b.f.basename)));
      if (!incontri.length) { new Notice("Nessuna nota Incontro nel vault."); return; }
      const scelto = await suggester(this.app, (e: any) => String(e.fm.nome ?? e.f.basename), incontri, false, "Quale Incontro è risolto?");
      if (!scelto) return;
      file = scelto.f as TFile;
    }
    await this.app.fileManager.processFrontMatter(file, (fm: any) => { fm.stato = "risolto"; });
    new Notice(`Incontro «${this.nomeNota(file)}» segnato risolto.`);
  }

  // Pannello Conseguenze: riepilogo dei PG con PF finali + azioni-ponte (opzionali, il GM
  // clicca ciò che serve). Mostrato solo a scontro deciso.
  private renderConseguenze(root: HTMLElement, s: Stato, esito: string) {
    const pan = root.createDiv({ cls: "gdr-board-conseguenze" });
    pan.createEl("h4", { text: `🏁 Conseguenze — ${esito}` });
    const pgFinali = s.combattenti.filter((c) => c.id.startsWith("pg:"));
    if (pgFinali.length) {
      const ul = pan.createEl("ul", { cls: "gdr-board-cons-pg" });
      for (const c of pgFinali) {
        ul.createEl("li", { text: `${c.nome}: ${c.pf_attuali}/${c.pf_max} PF${inPiedi(c) ? "" : " — KO"}` });
      }
    }
    const bar = pan.createDiv({ cls: "gdr-board-controls" });
    const b = (label: string, fn: () => void) => { bar.createEl("button", { text: label }).onclick = fn; };
    if (pgFinali.length) b("🩹 Riporta PF ai PG", () => void this.riportaPfAiPg(s));
    b("📈 Avanza un fronte", () => void this.avanzaFronte());
    const orig = this.incontroOrigine();
    b(orig ? `✅ Marca «${this.nomeNota(orig)}» risolto` : "✅ Marca Incontro risolto", () => void this.marcaIncontroRisolto());
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
        const chip = coda.createSpan({ cls: "gdr-board-cond-chip is-click", text: this.nomeEffetto(id) });
        if (id.startsWith("oggetto:")) chip.addClass("is-oggetto");
        chip.setAttribute("aria-label", `Togli «${this.nomeEffetto(id)}»`);
        chip.onclick = () => this.push({ tipo: "condizione-finita", key: c.key, condizione: id });
      }
      const ctrl = coda.createDiv({ cls: "gdr-board-ctrl" });
      const amt = ctrl.createEl("input", { cls: "gdr-board-amt", attr: { type: "number", min: "1", value: "5", inputmode: "numeric" } });
      const quanti = () => Math.max(1, Math.round(Number(amt.value) || 0));
      const bDmg = ctrl.createEl("button", { text: "−", cls: "gdr-board-dmg" }); bDmg.setAttribute("aria-label", "Infliggi danno");
      bDmg.onclick = () => this.push({ tipo: "danno", key: c.key, quanti: quanti() });
      const bHeal = ctrl.createEl("button", { text: "+", cls: "gdr-board-heal" }); bHeal.setAttribute("aria-label", "Cura");
      bHeal.onclick = () => this.push({ tipo: "cura", key: c.key, quanti: quanti() });
      const bCond = ctrl.createEl("button", { text: "＋stato", cls: "gdr-board-cond-add" }); bCond.setAttribute("aria-label", "Applica una condizione");
      bCond.onclick = () => void this.applicaCondizione(c);
      const bEquip = ctrl.createEl("button", { text: "🎒", cls: "gdr-board-equip" }); bEquip.setAttribute("aria-label", "Equipaggia un oggetto");
      bEquip.onclick = () => void this.equipaggia(c);
      const bDel = ctrl.createEl("button", { text: "✕", cls: "gdr-board-del" }); bDel.setAttribute("aria-label", "Rimuovi dalla plancia");
      bDel.onclick = () => this.push({ tipo: "rimosso", key: c.key });
    }

    // Reazioni all'esito (Resistenza Leggendaria…): banner d'interruzione, PRIMA di tutto il
    // resto — così un TS fallito può essere ribaltato anche se ha appena deciso lo scontro.
    if (iniziato) this.renderReazioni(root, s);

    // Conseguenze: a scontro deciso, il pannello-ponte verso il mondo (PF ai PG, fronti, risolto).
    if (esito) this.renderConseguenze(root, s, esito);

    // Azioni dell'attivo (a battaglia iniziata, se in piedi e non c'è ancora un esito).
    // Divise per economia del turno: Azioni (principali) e Azioni bonus.
    if (iniziato && !esito && attivoOra && inPiedi(attivoOra)) {
      const disponibili: Azione[] = (attivoOra.azioni && attivoOra.azioni.length)
        ? attivoOra.azioni
        : (attivoOra.attacco ? [{ nome: attivoOra.attacco.nome, tipo: "attacco", colpire: attivoOra.attacco.colpire, danno: attivoOra.attacco.danno } as Azione] : []);
      const principali = disponibili.filter((a) => a.economia !== "azione-bonus");
      const bonus = disponibili.filter((a) => a.economia === "azione-bonus");
      const pan = root.createDiv({ cls: "gdr-board-azioni" });
      pan.createEl("h4", { text: `Azioni di turno — ${attivoOra.nome}` });
      const gruppo = (voci: Azione[], etich?: string) => {
        if (!voci.length) return;
        if (etich) pan.createEl("div", { cls: "gdr-board-azioni-sub", text: etich });
        const box = pan.createDiv({ cls: "gdr-board-azioni-box" });
        for (const az of voci) {
          const b = box.createEl("button", { text: etichettaAzione(az) });
          b.onclick = () => void this.agisci(attivoOra, az);
        }
      };
      if (principali.length || bonus.length) {
        gruppo(principali);
        gruppo(bonus, "⚡ Azioni bonus");
      } else {
        pan.createDiv({ cls: "gdr-board-azioni-box" })
          .createSpan({ cls: "gdr-board-vuoto", text: "(nessuna azione eseguibile — passa il turno)" });
      }

      // 🔮 Incantesimi: se l'attivo è un incantatore, il pozzo di slot + un bottone per lancio.
      // Un click apre la scelta del livello (upcast) e dei bersagli (§lancia).
      const inc = attivoOra.incantatore;
      if (inc?.lanciabili.length) {
        const panI = root.createDiv({ cls: "gdr-board-incantesimi" });
        panI.createEl("h4", { text: `🔮 Incantesimi — ${attivoOra.nome}` });
        // Lettura degli slot: "Slot: 1º ●●○ · 2º ●○" (● residuo · ○ speso), solo i livelli col pozzo.
        const slotTxt = inc.slot
          .map((max, i) => {
            if (!max || max <= 0) return null; // livello senza slot (array sparso) → salta
            const r = slotRestanti(s, attivoOra.key, i + 1);
            return `${i + 1}º ${"●".repeat(r)}${"○".repeat(Math.max(0, max - r))}`;
          })
          .filter((x): x is string => x != null).join(" · ");
        if (slotTxt) panI.createDiv({ cls: "gdr-board-slot", text: `Slot: ${slotTxt}` });
        const boxI = panI.createDiv({ cls: "gdr-board-azioni-box" });
        for (const spell of inc.lanciabili) {
          // Il livello fisso di lancio (mostri 2024: "Cono di freddo di 9º"), da appendere al costo.
          const liv = spell.livelloLancio ? ` · ${spell.livelloLancio}º` : "";
          let costo: string, esaurito = false;
          if (spell.usiGiornalieri != null) {
            // X/giorno (mostri 2024): costa un uso, non uno slot.
            const rest = usiRestanti(s, attivoOra.key, spell.id);
            costo = `${rest}/${spell.usiGiornalieri}/dì${liv}`;
            esaurito = rest <= 0;
          } else if (spell.livello === 0) {
            // Livello 0 senza usi = a volontà (mostri 2024) / trucchetto (PG): illimitato.
            costo = `a volontà${liv}`;
          } else {
            // Livello > 0 con slot: è il caso PG (upcasting); le creature 2024 non hanno slot.
            costo = `Liv ${spell.livello}`;
            esaurito = !inc.slot.some((_m, i) => i + 1 >= spell.livello && slotRestanti(s, attivoOra.key, i + 1) > 0);
          }
          const b = boxI.createEl("button", { text: etichettaIncantesimo(spell, costo) });
          if (esaurito) b.disabled = true;
          else b.onclick = () => void this.lancia(attivoOra, spell);
        }
      }
    }

    // Azioni leggendarie: i boss agiscono fra un turno e l'altro (pozzo che si ricarica ogni round).
    if (iniziato && !esito) this.renderLeggendarie(root, s);

    // Registro.
    const log = root.createDiv({ cls: "gdr-board-log" });
    log.createEl("h4", { text: "Registro" });
    const righe = log.createEl("div", { cls: "gdr-board-log-righe" });
    for (const riga of registro(this.eventi)) righe.createDiv({ cls: "gdr-board-log-riga", text: riga });
  }

  async onClose() {}
}
