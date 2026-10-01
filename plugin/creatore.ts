// IL CREATORE DEL VAULT sul kernel: crea un PG (il libretto al 1º livello) e lo fa salire.
//
// Le DOMANDE non si decidono qui: cosa chiede un livello, fra quali opzioni, cosa manca per
// confermarlo e il passo che ne risulta li dice la guida del kernel (`creatore/guida.ts`), la
// stessa del creatore del Compendio. Qui solo l'interfaccia: una sequenza di modali di
// Obsidian che compila la Base e la Bozza, poi `librettoIniziale`/`aggiungiLivello`.
import type { App } from "obsidian";
import type { Caratteristica } from "../regole/src/creatore/attore";
import {
  type Catalogo, elencoBackground, elencoClassi, elencoSpecie, elencoSottoclassiPerClasse,
  elencoTalenti, fonteBackground, fonteClasse,
} from "../regole/src/creatore/catalogo";
import { ABILITA } from "../regole/src/creatore/risolutore";
import { type Base, type Libretto, aggiungiLivello, librettoIniziale, livelloCorrente } from "../regole/src/creatore/libretto";
import {
  type Bozza, ID_TALENTO_ASI, LIVELLO_MASSIMO, abilitaCompetenti, abilitaMulticlasse, anteprimaLivello,
  bozzaVuota, classeDelPasso, classiAttuali, etichettaSlug, mancano, opzioniIncantesimi,
  opzioniParametro, opzioniSceltaClasse, passoDaBozza, pfNelDado, puoAggiungereClasse, talentoInBozza,
  talentoOrigine,
} from "../regole/src/creatore/guida";
import { multiSuggester, promptModal, suggester } from "./modali";

const CARATTERISTICHE: Caratteristica[] = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
const STANDARD = [15, 14, 13, 12, 10, 8];

/** Annullato dall'utente: si interrompe il percorso senza scrivere niente. */
class Annullato extends Error {}

type Voce = { id: string; nome: string };

async function una<T>(app: App, voci: T[], nome: (x: T) => string, titolo: string): Promise<T> {
  const v = await suggester(app, nome, voci, false, titolo);
  if (v == null) throw new Annullato();
  return v;
}

/** Esattamente `n` voci (o meno, se le opzioni sono meno): si ripropone finché il numero torna. */
async function enne(app: App, voci: Voce[], n: number, titolo: string): Promise<string[]> {
  const quante = Math.min(n, voci.length);
  if (quante <= 0) return [];
  for (;;) {
    const scelte = await multiSuggester<Voce>(app, (v) => v.nome, voci, `${titolo} — scegline ${quante}`);
    if (scelte == null) throw new Annullato();
    if (scelte.length === quante) return scelte.map((v) => v.id);
    await promptModal(app, `Ne servono esattamente ${quante} (scelte: ${scelte.length}). Premi OK e riprova.`, "");
  }
}

const voceAbilita = (id: string): Voce => ({ id, nome: etichettaSlug(id) });

// --- La BASE (il 1º livello: chi sei) -------------------------------------------------

async function caratteristicheBase(app: App): Promise<Record<Caratteristica, number>> {
  const metodo = await una(app, ["standard", "manuale"], (m) =>
    m === "standard" ? "Serie standard (15, 14, 13, 12, 10, 8)" : "Punteggi a mano (tiri o acquisto)", "Caratteristiche");
  const out = {} as Record<Caratteristica, number>;
  if (metodo === "standard") {
    let libere = [...CARATTERISTICHE];
    for (const v of STANDARD) {
      const c = await una(app, libere, etichettaSlug, `A quale caratteristica il ${v}?`);
      out[c] = v;
      libere = libere.filter((x) => x !== c);
    }
    return out;
  }
  for (const c of CARATTERISTICHE) {
    const v = await promptModal(app, `${etichettaSlug(c)} (3–18)`, "10");
    if (v == null) throw new Annullato();
    out[c] = Math.max(3, Math.min(18, Number.parseInt(v, 10) || 10));
  }
  return out;
}

async function bonusDelBackground(app: App, ammesse: Caratteristica[]): Promise<Partial<Record<Caratteristica, number>>> {
  if (!ammesse.length) return {};
  const modo = await una(app, ["2-1", "1-1-1"], (m) => (m === "2-1" ? "+2 a una, +1 a un'altra" : "+1 a tutte e tre"), "Bonus del background");
  if (modo === "1-1-1") return Object.fromEntries(ammesse.map((c) => [c, 1]));
  const due = await una(app, ammesse, etichettaSlug, "+2 a quale caratteristica?");
  const uno = await una(app, ammesse.filter((c) => c !== due), etichettaSlug, "+1 a quale caratteristica?");
  return { [due]: 2, [uno]: 1 };
}

async function base(app: App, cat: Catalogo): Promise<Base> {
  const classe = await una(app, elencoClassi(cat), (v) => v.nome, "Classe?");
  const specie = await una(app, elencoSpecie(cat), (v) => v.nome, "Specie?");
  const bg = await una(app, elencoBackground(cat), (v) => v.nome, "Background?");
  const nome = ((await promptModal(app, "Nome del PG?", "Nuovo PG")) ?? "").trim();
  if (!nome) throw new Annullato();
  const b: Base = {
    nome, classeId: classe.id, specieId: specie.id, backgroundId: bg.id,
    caratteristiche_base: await caratteristicheBase(app),
    bonus_background: {}, abilita_classe: [],
  };
  b.bonus_background = await bonusDelBackground(app, fonteBackground(cat, bg.id)?.punteggi_caratteristica ?? []);
  const offerta = fonteClasse(cat, classe.id)?.competenze_abilita;
  if (offerta?.quantita) {
    const pool = offerta.scelte.includes("tutte") ? Object.keys(ABILITA) : offerta.scelte;
    b.abilita_classe = await enne(app, pool.map(voceAbilita), offerta.quantita, "Abilità di classe");
  }
  const lingue = cat.lingue.filter((l) => l.id !== "comune");
  b.lingue = await enne(app, lingue, 2, "Lingue (oltre al Comune)");
  for (const p of talentoOrigine(cat, b)?.parametri ?? []) {
    const scelti = await enne(app, opzioniParametro(p, cat), p.quantita, `Talento d'origine: ${p.tipo}`);
    b.talentoOrigineParametri = { ...(b.talentoOrigineParametri ?? {}), [p.id]: scelti };
  }
  const equip = async (opz: { nome: string }[] | undefined, titolo: string) =>
    opz?.length ? (await una(app, opz, (o) => o.nome, titolo)).nome : undefined;
  const ec = await equip(fonteClasse(cat, classe.id)?.equipaggiamento, "Equipaggiamento di classe?");
  const eb = await equip(fonteBackground(cat, bg.id)?.equipaggiamento, "Equipaggiamento del background?");
  if (ec) b.equipClasse = ec;
  if (eb) b.equipBackground = eb;
  return b;
}

// --- Il LIVELLO (la bozza: ciò che il livello chiede) -----------------------------------

async function talento(app: App, cat: Catalogo, lib: Libretto, bozza: Bozza): Promise<void> {
  const ASI = { id: ID_TALENTO_ASI, nome: "Aumento dei punteggi di caratteristica" };
  const scelto = await una(app, [ASI, ...elencoTalenti(cat).filter((t) => !t.id.endsWith(ID_TALENTO_ASI))], (t) => t.nome, "Talento o aumento?");
  bozza.talentoId = scelto.id;
  if (scelto.id === ID_TALENTO_ASI) {
    const modo = await una(app, ["2", "1-1"], (m) => (m === "2" ? "+2 a una caratteristica" : "+1 a due caratteristiche"), "Aumento");
    if (modo === "2") bozza.bonusAsi = { [await una(app, CARATTERISTICHE, etichettaSlug, "+2 a quale?")]: 2 };
    else {
      const a = await una(app, CARATTERISTICHE, etichettaSlug, "+1 alla prima");
      const b = await una(app, CARATTERISTICHE.filter((c) => c !== a), etichettaSlug, "+1 alla seconda");
      bozza.bonusAsi = { [a]: 1, [b]: 1 };
    }
    return;
  }
  const tal = talentoInBozza(cat, bozza);
  if (tal.varianti?.length) bozza.talentoVariante = (await una(app, tal.varianti, (v) => v.nome, `${scelto.nome}: variante`)).id;
  const conVariante = talentoInBozza(cat, bozza);
  if (conVariante.classeInc) {
    const tr = await enne(app, conVariante.trucchettiOpz, 2, `${scelto.nome}: trucchetti`);
    const sp = await enne(app, conVariante.spelliOpz, 1, `${scelto.nome}: incantesimo di 1º livello`);
    bozza.incantesimiTalento = [...tr, ...sp];
  }
  for (const p of conVariante.parametri ?? []) {
    const competenti = abilitaCompetenti(anteprimaLivello(cat, lib, bozza));
    bozza.parametriTalento[p.id] = await enne(app, opzioniParametro(p, cat, competenti), p.quantita, `${scelto.nome}: ${p.tipo}`);
  }
}

/** Compila la bozza del prossimo livello del libretto, domanda per domanda. */
async function livello(app: App, cat: Catalogo, lib: Libretto, bozza: Bozza): Promise<void> {
  const primo = livelloCorrente(lib) === 0;
  const { dadoVita, media, classe } = classeDelPasso(cat, lib, bozza);
  if (!primo) {
    const v = await promptModal(app, `PF di questo livello: tiro del d${dadoVita} (vuoto = media ${media})`, "");
    if (v == null) throw new Annullato();
    bozza.pf = v.trim() ? pfNelDado(Number.parseInt(v, 10), dadoVita) : media;
  }
  const r = classeDelPasso(cat, lib, bozza).richieste;
  if (!r) return;
  const mc = abilitaMulticlasse(cat, lib, bozza);
  if (mc?.quantita) {
    const pool = mc.scelte.includes("tutte") ? Object.keys(ABILITA) : mc.scelte;
    bozza.abilitaScelte = await enne(app, pool.map(voceAbilita), mc.quantita, `${classe?.nome}: abilità d'ingresso`);
  }
  if (r.sottoclasse) {
    const sc = elencoSottoclassiPerClasse(cat, classeDelPasso(cat, lib, bozza).classeId);
    if (sc.length) bozza.sottoclasseId = (await una(app, sc, (s) => s.nome, "Sottoclasse?")).id;
  }
  if (r.talento) await talento(app, cat, lib, bozza);
  for (const s of r.scelte) {
    bozza.scelteClasse[s.privilegio] = await enne(app, opzioniSceltaClasse(cat, lib, bozza, s), s.nuove, s.nome);
  }
  if (r.maestrie) {
    const competenti = abilitaCompetenti(anteprimaLivello(cat, lib, bozza));
    const pool = r.opzioniMaestria ? competenti.filter((a) => r.opzioniMaestria!.includes(a)) : competenti;
    bozza.maestrie = await enne(app, pool.map(voceAbilita), r.maestrie, "Maestria");
  }
  const opz = opzioniIncantesimi(cat, lib, bozza, anteprimaLivello(cat, lib, bozza));
  if (r.trucchettiNuovi) bozza.trucchetti = await enne(app, opz.trucchetti, r.trucchettiNuovi, "Trucchetti nuovi");
  if (r.incantesimiNuovi) bozza.incantesimi = await enne(app, opz.incantesimi.map((s) => ({ id: s.id, nome: `[${s.livello}] ${s.nome}` })), r.incantesimiNuovi, "Incantesimi nuovi");
}

/** Il libretto di un PG nuovo, al 1º livello; null se annullato o incompleto (avvisa). */
export async function creaLibretto(app: App, cat: Catalogo, avvisa: (m: string) => void): Promise<Libretto | null> {
  try {
    const b = await base(app, cat);
    const vuoto: Libretto = { base: b, passi: [] };
    const bozza = bozzaVuota();
    await livello(app, cat, vuoto, bozza);
    const resta = mancano(cat, vuoto, bozza);
    if (resta.length) { avvisa(`PG non creato, manca: ${resta.join(", ")}.`); return null; }
    return librettoIniziale(b, passoDaBozza(cat, vuoto, bozza));
  } catch (e) {
    if (e instanceof Annullato) { avvisa("Creazione PG annullata."); return null; }
    throw e;
  }
}

/** Il libretto col livello successivo; null se annullato, incompleto o al 20º (avvisa). */
export async function saliLibretto(app: App, cat: Catalogo, lib: Libretto, avvisa: (m: string) => void): Promise<Libretto | null> {
  if (livelloCorrente(lib) >= LIVELLO_MASSIMO) { avvisa("Il PG è al 20º livello: oltre non si sale."); return null; }
  try {
    const bozza = bozzaVuota();
    // In quale classe si sale: le proprie, o una nuova se il PG ne soddisfa il prerequisito.
    const ammesse = elencoClassi(cat).filter((c) => puoAggiungereClasse(cat, lib, c.id));
    if (ammesse.length > 1) {
      const attuali = classiAttuali(lib);
      const ordinate = [...ammesse.filter((c) => attuali.includes(c.id)), ...ammesse.filter((c) => !attuali.includes(c.id))];
      const c = await una(app, ordinate, (x) => (attuali.includes(x.id) ? x.nome : `${x.nome} (multiclasse)`), "Sali in quale classe?");
      bozza.classeId = c.id === lib.base.classeId ? "" : c.id;
    }
    await livello(app, cat, lib, bozza);
    const resta = mancano(cat, lib, bozza);
    if (resta.length) { avvisa(`Livello non confermato, manca: ${resta.join(", ")}.`); return null; }
    return aggiungiLivello(lib, passoDaBozza(cat, lib, bozza));
  } catch (e) {
    if (e instanceof Annullato) { avvisa("Salita di livello annullata."); return null; }
    throw e;
  }
}
