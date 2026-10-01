// Board di combattimento: tracker pilotato dal motore event-sourced di `regole`. Tiene
// `eventi: Evento[]`, ogni comando li accoda e la board ridisegna `ricostruisci(eventi)`.
// Incontro dal bestiario SRD bundlato + PG del vault; azioni di turno con scelta bersaglio;
// controlli GM (danno/cura/condizioni); statblock nativo; persistenza tra reload.
import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import {
  ricostruisci, registro, ordine, attivo, esitoScontro, inPiedi, dadoVero, annullaUltimo,
  comandoIniziativa, comandoAzione, comandoAttacco, comandoLeggendaria, leggendarieRestanti, comandoLancia,
  slotRestanti, comandoSostituisciEsito, sostituzioniDisponibili, sostituzioniRestanti, risorseDi,
  comandoTiroMorte, comandoRiposo, comandoPara, pareDisponibili, comandoCommuta,
  comandoIngaggio, comandoDisingaggio, comandoOpportunita, comandoCopertura, eventiConcentrazione,
  staConcentrando, condizioniAttive, eMorto, eStabile, sonoIngaggiati, gradoCopertura,
  opzioniLancio, motivoAzioneBloccata, statoAttivabile, caricheRestanti,
  type Evento, type Dado, type InPlancia, type Stato, type DefinizioniCondizioni, type CoperturaGrado,
} from "../regole/src/motore/motore";
import { daMostro, variantiDi, type Combattente, type Azione, type RisolviIncantesimo, type IncantesimoLanciabile } from "../regole/src/motore/combattente";
import { StatblockModal, trovaMostro } from "./statblock";
import { combattenteDiPg, idPg, risorseDaNota, notaDaRisorse, librettoDi } from "./pg";
import type { Catalogo } from "../regole/src/creatore/catalogo";
import { suggester, multiSuggester } from "./modali";
import type GdrPlugin from "./main";

export const VIEW_TYPE_BOARD = "gdr-board";

// Perché un lancio o un'azione non parte, a parole (i motivi li dà il motore).
const MOTIVO_LANCIO = { slot: "nessuno slot disponibile", usi: "usi del giorno finiti", cariche: "cariche insufficienti", economia: "azione del turno già spesa" } as const;
const MOTIVO_AZIONE = { economia: "già spesa questo turno", cariche: "cariche finite" } as const;

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
  private catalogo: Catalogo | null = null; // catalogo del kernel: monta i PG col libretto
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
    this.catalogo = await this.plugin.catalogoCompleto(); // i PG col libretto entrano completi (SRD + homebrew)
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

  // Picker sui PG del vault → aggiunge un personaggio come alleato. Un PG col libretto entra
  // completo e con lo stato di gioco della sua nota (PF, slot e usi spesi); uno vecchio, pieno.
  private async aggiungiPg() {
    const pgs = this.plugin.partyPgs();
    if (!pgs.length) { new Notice("Nessun PG nel vault (categoria=personaggio, tipo=pg)."); return; }
    const scelto = await suggester(this.app, (e: any) => String(e.fm.nome || e.f.basename), pgs, false, "Aggiungi un PG");
    if (!scelto) return;
    const base = combattenteDiPg(scelto.fm, this.catalogo ?? await this.plugin.catalogoCompleto(), this.armiCat);
    const c = this.schieraDaBase(base, "alleato");
    const risorse = risorseDaNota(scelto.fm, base);
    this.push({ tipo: "aggiunto", combattente: c }, ...(risorse ? [{ tipo: "risorse", key: c.key, risorse } as Evento] : []));
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
      const pg = this.plugin.partyPgs().find((e) => idPg(e.fm) === c.id);
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

  // Esegue l'azione dell'attivo col comando del motore (`comandoAzione`, lo stesso della plancia
  // del Compendio). Il bersaglio: un nemico per attacchi e TS; per una cura o un potenziamento
  // chiunque del proprio lato, sé compreso (bere una pozione).
  private async agisci(attore: InPlancia, az: Azione) {
    const s = this.stato();
    const perSe = az.tipo === "cura" || az.tipo === "potenziamento";
    const cands = ordine(s).filter((c) => (perSe ? c.schieramento === attore.schieramento : c.schieramento !== attore.schieramento && inPiedi(c)));
    const t = await this.pickBersaglio(cands, perSe ? `${az.nome} → su chi` : `${az.nome} → bersaglio`);
    if (!t) return;
    const ev = comandoAzione(s, attore.key, t.key, az, dadoVero, this.defs);
    if (!ev.length) { new Notice(`«${az.nome}» non si può eseguire adesso.`); return; }
    this.push(...ev);
  }

  // Lancia un incantesimo: sceglie il livello di slot (upcast, se serve), poi i BERSAGLI (uno o
  // più — le aree si risolvono con un solo picker multi-selezione, come un template VTT che
  // "prende" chi capita). Il motore (comandoLancia) spende slot/uso, apre la concentrazione,
  // esegue le attività coi numeri del lanciatore o LOGGA narrato se non meccanizzato.
  private async lancia(attore: InPlancia, spell: IncantesimoLanciabile) {
    const s = this.stato();
    // A che livelli si può lanciare (slot residui o cariche dell'oggetto) e perché no: dal motore
    // (`opzioniLancio`, lo stesso del dialog della plancia del Compendio).
    const opz = opzioniLancio(s, attore.key, spell);
    if (opz.motivo) { new Notice(`${spell.nome}: ${MOTIVO_LANCIO[opz.motivo]}.`); return; }
    let livello = spell.livelloLancio ?? spell.livello;
    if (opz.livelli.length === 1) livello = opz.livelli[0];
    else if (opz.livelli.length > 1) {
      const etich = (n: number) => opz.cariche ? `Livello ${n} (${opz.cariche[n]} cariche su ${opz.restano})` : `Livello ${n} (${slotRestanti(s, attore.key, n)} slot)`;
      const L = await suggester(this.app, etich, opz.livelli, false, `Lancia ${spell.nome} a che livello?`);
      if (L == null) return;
      livello = L;
    }
    // Una variante (Ingrandire o Ridurre): l'effetto si sceglie al lancio.
    const varianti = variantiDi(spell);
    let variante: string | undefined;
    if (varianti.length > 1) {
      variante = await suggester(this.app, (v: string) => v, varianti, false, `${spell.nome}: quale effetto?`);
      if (variante == null) return;
    }
    // I bersagli: tutti i combattenti in piedi (anche alleati — buff/cura; anche sé). Il GM
    // spunta chi è preso. Nessun bersaglio = lancio "a vuoto"/su di sé narrato (il motore regge []).
    const cands = ordine(s).filter((c) => inPiedi(c));
    const scelti = await multiSuggester(this.app, (c: InPlancia) => `${c.nome} — ${c.pf_attuali}/${c.pf_max} PF`, cands, `${spell.nome} → bersagli (spunta chi è colpito)`);
    if (scelti == null) return; // annullato
    const ev = comandoLancia(s, attore.key, scelti.map((c) => c.key), spell.id, livello, dadoVero, this.defs, variante);
    if (!ev.length) { new Notice(`Impossibile lanciare ${spell.nome} adesso.`); return; }
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
    // Le PARATE (lo Scudo): un colpo di questo turno che chi l'ha subito può ancora deviare.
    const pare = pareDisponibili(this.eventi, s);
    if (!offerte.length && !pare.length) return;
    const pan = root.createDiv({ cls: "gdr-board-reazioni" });
    for (const p of pare) {
      const c = s.combattenti.find((x) => x.key === p.key);
      const box = pan.createDiv({ cls: "gdr-board-reaz-box" });
      box.createSpan({ cls: "gdr-board-reaz-txt", text: `${c?.nome ?? p.key}: lanciare ${p.nome} come reazione? Se il bonus alla CA basta, il colpo manca.` });
      box.createEl("button", { text: `Para con ${p.nome}` }).onclick = () =>
        this.push(...comandoPara(this.eventi, p.key, p.indice, p.interno, dadoVero, this.defs));
    }
    for (const o of offerte) {
      const c = s.combattenti.find((x) => x.key === o.key);
      // Da un oggetto (l'anello di eludere) costa una carica; altrimenti un uso (Resistenza Leggendaria).
      const resto = o.oggetto ? `${caricheRestanti(s, o.key, o.oggetto)} cariche` : `${sostituzioniRestanti(s, o.key)} rimaste`;
      const box = pan.createDiv({ cls: "gdr-board-reaz-box" });
      box.createSpan({ cls: "gdr-board-reaz-txt",
        text: `${c?.nome ?? o.key}: usa ${o.nome} (${resto}) per superare il tiro salvezza fallito?` });
      const b = box.createEl("button", { text: `Usa ${o.nome}` });
      b.onclick = () => this.push(...comandoSostituisciEsito(this.eventi, o.key, o.indice, o.interno, o.oggetto));
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
      const pg = pgs.find((e) => idPg(e.fm) === c.id);
      if (!pg) continue;
      // Un PG col libretto riporta anche slot e usi spesi (la scheda e i riposi del vault li leggono).
      const spese = librettoDi(pg.fm) ? notaDaRisorse(risorseDi(s, c.key), c) : {};
      await this.app.fileManager.processFrontMatter(pg.f, (fm: any) => {
        fm.pf = c.pf_attuali;
        if (c.pf_temporanei) fm.pf_temp = c.pf_temporanei; else delete fm.pf_temp;
        Object.assign(fm, spese);
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

  // Il TURNO dell'attivo: l'economia (azione ● · bonus ◆ · reazione ▲, tenue = spesa), le azioni
  // (bloccate dal motore se l'economia è spesa o il pozzo vuoto), gli attivabili, le relazioni e
  // gli incantesimi. Le regole stanno nel motore; qui solo i pulsanti.
  private renderTurno(root: HTMLElement, s: Stato, a: InPlancia) {
    const pan = root.createDiv({ cls: "gdr-board-azioni" });
    const head = pan.createEl("h4", { text: `Turno di ${a.nome} ` });
    const spesa = s.economia_spesa[a.key] ?? [];
    for (const [slot, simbolo, nome] of [["azione", "●", "Azione"], ["azione-bonus", "◆", "Bonus"], ["reazione", "▲", "Reazione"]] as const) {
      const x = head.createSpan({ cls: `gdr-board-econ${spesa.includes(slot) ? " is-spesa" : ""}`, text: simbolo });
      x.setAttribute("aria-label", `${nome}${spesa.includes(slot) ? " (spesa)" : ""}`);
    }

    const disponibili: Azione[] = (a.azioni && a.azioni.length)
      ? a.azioni
      : (a.attacco ? [{ nome: a.attacco.nome, tipo: "attacco", colpire: a.attacco.colpire, danno: a.attacco.danno } as Azione] : []);
    const gruppo = (voci: Azione[], etich?: string) => {
      if (!voci.length) return;
      if (etich) pan.createEl("div", { cls: "gdr-board-azioni-sub", text: etich });
      const box = pan.createDiv({ cls: "gdr-board-azioni-box" });
      for (const az of voci) {
        const car = (az as { cariche?: { oggetto: string } }).cariche;
        const resto = car ? ` · ${caricheRestanti(s, a.key, car.oggetto)} cariche` : "";
        const b = box.createEl("button", { text: `${etichettaAzione(az)}${resto}` });
        const motivo = motivoAzioneBloccata(s, a.key, az);
        if (motivo) { b.disabled = true; b.setAttribute("aria-label", MOTIVO_AZIONE[motivo]); }
        else b.onclick = () => void this.agisci(a, az);
      }
    };
    const principali = disponibili.filter((x) => x.economia !== "azione-bonus");
    const bonus = disponibili.filter((x) => x.economia === "azione-bonus");
    if (principali.length || bonus.length) { gruppo(principali); gruppo(bonus, "Azioni bonus"); }
    else pan.createDiv({ cls: "gdr-board-azioni-box" }).createSpan({ cls: "gdr-board-vuoto", text: "(nessuna azione eseguibile — passa il turno)" });

    // Gli ATTIVABILI (l'Ira, una pozione di resistenza, un'aura): si accendono e si spengono.
    // Un'aura a ZONA chiede chi c'è dentro (di partenza gli alleati della fonte).
    if (a.attivabili?.length) {
      pan.createEl("div", { cls: "gdr-board-azioni-sub", text: "Da attivare" });
      const box = pan.createDiv({ cls: "gdr-board-azioni-box" });
      for (const att of a.attivabili) {
        const st = statoAttivabile(s, a.key, att);
        const extra = [
          att.durata ? att.durata : "",
          st.restano != null ? `${st.restano} cariche` : "",
          st.usi != null && att.usi ? `usi ${st.usi}/${att.usi.massimo}` : "",
          st.acceso && att.numeri?.nota ? att.numeri.nota : "",
        ].filter(Boolean).join(" · ");
        const b = box.createEl("button", { text: `${st.acceso ? "● " : "○ "}${att.nome}${extra ? ` (${extra})` : ""}` });
        if (st.acceso) b.addClass("is-acceso");
        if (st.finito) { b.disabled = true; continue; }
        b.onclick = async () => {
          let zona: string[] | undefined;
          if (att.aura?.ambito === "zona" && !st.acceso) {
            const tutti = this.stato().combattenti;
            const dentro = await multiSuggester(this.app, (c: InPlancia) => c.nome, tutti, `${att.nome}: chi è nell'aura`, (c) => c.schieramento === a.schieramento);
            if (dentro == null) return;
            zona = dentro.map((c) => c.key);
          }
          this.push(...comandoCommuta(this.stato(), a.key, att.id, zona));
        };
      }
    }

    // Le RELAZIONI (la mappa senza mappa): il GM dichiara mischia e copertura, il motore ne fa
    // le regole (attacco d'opportunità, bonus alla CA).
    const altri = s.combattenti.filter((c) => c.key !== a.key && inPiedi(c));
    if (altri.length) {
      pan.createEl("div", { cls: "gdr-board-azioni-sub", text: "Relazioni" });
      const box = pan.createDiv({ cls: "gdr-board-azioni-box" });
      const conChi = (titolo: string, filtro: (c: InPlancia) => boolean) =>
        this.pickBersaglio(this.stato().combattenti.filter((c) => c.key !== a.key && inPiedi(c) && filtro(c)), titolo);
      box.createEl("button", { text: "Ingaggia in mischia…" }).onclick = async () => {
        const c = await conChi(`${a.nome} ingaggia`, (x) => !sonoIngaggiati(this.stato(), a.key, x.key));
        if (c) this.push(...comandoIngaggio(this.stato(), a.key, c.key));
      };
      if (altri.some((c) => sonoIngaggiati(s, a.key, c.key))) {
        box.createEl("button", { text: "Disingaggia…" }).onclick = async () => {
          const c = await conChi(`${a.nome} si disingaggia da`, (x) => sonoIngaggiati(this.stato(), a.key, x.key));
          if (c) this.push(...comandoDisingaggio(this.stato(), a.key, c.key));
        };
        box.createEl("button", { text: "Attacco d'opportunità…" }).onclick = async () => {
          const c = await conChi(`Attacco d'opportunità di ${a.nome} contro`, (x) => sonoIngaggiati(this.stato(), a.key, x.key));
          if (c) this.push(...comandoOpportunita(this.stato(), a.key, c.key, dadoVero, this.defs));
        };
      }
      box.createEl("button", { text: "Copertura…" }).onclick = async () => {
        const da = await conChi(`Copertura di ${a.nome} rispetto a`, () => true);
        if (!da) return;
        const ora = gradoCopertura(this.stato(), a.key, da.key);
        // «nessuna» è una scelta vera: non va confusa con l'annullamento del modale (null).
        const gradi: (CoperturaGrado | "nessuna")[] = ["mezza", "tre-quarti", "nessuna"];
        const g = await suggester(this.app, (x: CoperturaGrado | "nessuna") => (x === "mezza" ? "Mezza (+2 a CA e TS di Destrezza)" : x === "tre-quarti" ? "Tre quarti (+5)" : "Nessuna") + (x === (ora ?? "nessuna") ? " — attuale" : ""), gradi, false, "Che copertura?");
        if (g != null) this.push(...comandoCopertura(this.stato(), a.key, da.key, g === "nessuna" ? null : g));
      };
    }

    // Gli INCANTESIMI: un bottone per lancio, col costo e perché no se non si può (dal motore).
    const inc = a.incantatore;
    if (inc?.lanciabili.length) {
      const panI = root.createDiv({ cls: "gdr-board-incantesimi" });
      panI.createEl("h4", { text: `Incantesimi — ${a.nome}` });
      const slotTxt = inc.slot
        .map((max, i) => {
          if (!max || max <= 0) return null;
          const r = slotRestanti(s, a.key, i + 1);
          return `${i + 1}º ${"●".repeat(r)}${"○".repeat(Math.max(0, max - r))}`;
        })
        .filter((x): x is string => x != null).join(" · ");
      if (slotTxt) panI.createDiv({ cls: "gdr-board-slot", text: `Slot: ${slotTxt}` });
      const boxI = panI.createDiv({ cls: "gdr-board-azioni-box" });
      for (const spell of inc.lanciabili) {
        const opz = opzioniLancio(s, a.key, spell);
        const liv = spell.livelloLancio ? ` · ${spell.livelloLancio}º` : "";
        const costo =
          spell.cariche ? `${opz.restano} cariche${liv}`
          : spell.usiGiornalieri != null ? `${opz.usi}/${spell.usiGiornalieri}/dì${liv}`
          : spell.livello === 0 ? `a volontà${liv}`
          : `Liv ${spell.livello}`;
        const b = boxI.createEl("button", { text: etichettaIncantesimo(spell, costo) });
        if (opz.motivo) { b.disabled = true; b.setAttribute("aria-label", MOTIVO_LANCIO[opz.motivo]); }
        else b.onclick = () => void this.lancia(a, spell);
      }
    }
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
    // I RIPOSI del gruppo: tutti i PG in plancia (il lungo tira le ricariche degli oggetti all'alba).
    if (s.combattenti.some((c) => c.key.startsWith("pg:"))) {
      const riposa = (lungo: boolean) => {
        const st = this.stato();
        this.push(...st.combattenti.filter((c) => c.key.startsWith("pg:")).flatMap((c) => comandoRiposo(st, c.key, lungo, dadoVero)));
      };
      btn("Riposo breve", () => riposa(false));
      btn("Riposo lungo", () => riposa(true));
    }
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
      const conc = staConcentrando(s, c.key);
      if (conc) riga.createSpan({ cls: "gdr-board-conc", text: `conc.: ${conc}` });
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
      // Le condizioni addosso; quelle annullate da un'immunità (l'Aura di Coraggio) restano
      // visibili ma barrate, perché senza effetto.
      const valgono = condizioniAttive(s, c.key, this.defs);
      for (const id of s.condizioni[c.key] ?? []) {
        const grado = s.gradi?.[c.key]?.[id];
        const chip = coda.createSpan({ cls: "gdr-board-cond-chip is-click", text: `${this.nomeEffetto(id)}${grado ? ` ${grado}` : ""}` });
        if (id.startsWith("oggetto:")) chip.addClass("is-oggetto");
        if (!valgono.includes(id)) chip.addClass("is-immune");
        chip.setAttribute("aria-label", valgono.includes(id) ? `Togli «${this.nomeEffetto(id)}»` : `«${this.nomeEffetto(id)}»: senza effetto (immune). Clic per toglierla`);
        chip.onclick = () => this.push({ tipo: "condizione-finita", key: c.key, condizione: id });
      }
      const ctrl = coda.createDiv({ cls: "gdr-board-ctrl" });
      const amt = ctrl.createEl("input", { cls: "gdr-board-amt", attr: { type: "number", min: "1", value: "5", inputmode: "numeric" } });
      const quanti = () => Math.max(1, Math.round(Number(amt.value) || 0));
      const bDmg = ctrl.createEl("button", { text: "−", cls: "gdr-board-dmg" }); bDmg.setAttribute("aria-label", "Infliggi danno");
      // Il danno a mano fa tirare la concentrazione a chi si concentra (come nei tiri del motore).
      bDmg.onclick = () => {
        const st = this.stato();
        this.push({ tipo: "danno", key: c.key, quanti: quanti() }, ...eventiConcentrazione(st, c.key, quanti(), dadoVero, this.defs));
      };
      const bHeal = ctrl.createEl("button", { text: "+", cls: "gdr-board-heal" }); bHeal.setAttribute("aria-label", "Cura");
      bHeal.onclick = () => this.push({ tipo: "cura", key: c.key, quanti: quanti() });
      const bTemp = ctrl.createEl("button", { text: "PF t", cls: "gdr-board-temp" }); bTemp.setAttribute("aria-label", "Concedi PF temporanei (non si sommano: resta il più alto)");
      bTemp.onclick = () => this.push({ tipo: "pf-temporanei", key: c.key, quanti: quanti() });
      // Tiri contro morte: a 0 PF, pallini di successi e fallimenti e il tiro.
      if (c.morte) {
        const m = ctrl.createSpan({ cls: "gdr-board-morte" });
        if (eMorto(c)) m.setText("morto");
        else if (eStabile(c)) m.setText("stabile");
        else {
          m.setText(`${"●".repeat(c.morte.successi)}${"○".repeat(3 - c.morte.successi)} / ${"●".repeat(c.morte.fallimenti)}${"○".repeat(3 - c.morte.fallimenti)}`);
          m.setAttribute("aria-label", `${c.morte.successi} successi · ${c.morte.fallimenti} fallimenti`);
          const bTs = ctrl.createEl("button", { text: "TS morte", cls: "gdr-board-ts-morte" });
          bTs.onclick = () => this.push(...comandoTiroMorte(this.stato(), c.key, dadoVero, this.defs));
        }
      }
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

    // Il turno dell'attivo (a battaglia iniziata, se in piedi e non c'è ancora un esito).
    if (iniziato && !esito && attivoOra && inPiedi(attivoOra)) this.renderTurno(root, s, attivoOra);

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
