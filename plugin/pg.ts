// Il PG del vault come LIBRETTO del kernel (Tier 3: un solo creatore).
//
// La nota di un PG creato col kernel custodisce `libretto` (la storia per-livello: chi sei +
// cosa hai scelto salendo, `regole/src/creatore/libretto.ts`). Tutto il resto si DERIVA: i
// numeri della scheda li riscrive il codice da `assembla`, e la Board monta il PG completo
// (attivabili, aure, incantatore, oggetti magici, reazioni) invece della ricostruzione minima
// dai campi piatti. Un PG senza libretto (creato prima del kernel) entra come prima (`daPgGdr`).
//
// Lo STATO DI GIOCO (PF attuali, slot e usi spesi) resta nei campi piatti che la scheda e le
// azioni di riposo del vault già leggono (`pf`, `slot_uso_N`, `usi_<id>`): `risorseDaNota` e
// `notaDaRisorse` li traducono da e verso le `RisorseSpese` del motore, in un posto solo.
import type { Attore } from "../regole/src/creatore/attore";
import type { Catalogo } from "../regole/src/creatore/catalogo";
import { type Libretto, livelloCorrente } from "../regole/src/creatore/libretto";
import { attoreAlLivello } from "../regole/src/creatore/guida";
import { daAttore, type Combattente } from "../regole/src/motore/combattente";
import type { RisorseSpese } from "../regole/src/motore/motore";
import { personaggioAFrontmatter, daPgGdr, type ArmaCat } from "./adapters";

const corto = (id: string) => String(id ?? "").split(".").pop() ?? "";
// Come la nota del PG nomina una classe/specie/background: lo slug per l'SRD (`barbaro`), il
// NOME della nota per l'homebrew del vault (la scheda «chi la usa» confronta col nome del file).
const nomina = (id: string, voci: readonly { id: string; nome: string }[]) =>
  id.startsWith("homebrew.") ? (voci.find((v) => v.id === id)?.nome ?? corto(id)) : corto(id);

/** Il libretto della nota, se c'è e ha la forma minima (base + passi). */
export function librettoDi(fm: any): Libretto | null {
  const l = fm?.libretto;
  return l && typeof l === "object" && l.base && Array.isArray(l.passi) && l.passi.length ? (l as Libretto) : null;
}

/** L'id del PG in plancia: `pg:<slug del nome>`, lo stesso per tutti i chiamanti. */
export function idPg(fm: any): string {
  return `pg:${String(fm?.nome ?? "pg").toLowerCase().replace(/\s+/g, "-")}`;
}

/** Una risorsa del PG come la legge la scheda (`risorse_pg`), con la chiave del motore. */
export type RisorsaPg = {
  id: string;
  label: string;
  max: number;
  ric: "breve" | "lungo";
  /** Da dove la legge il motore: un attivabile, un incantesimo X/giorno, il pozzo di un oggetto. */
  fonte: "attivabile" | "giornaliero" | "cariche";
  chiave: string;
};

// La chiave di frontmatter di una risorsa: niente punti né segni (gli id del kernel sono puntati).
const chiaveNota = (k: string) => k.toLowerCase().replace(/[^a-z0-9_-]+/g, "_");

/** Le risorse a usi del PG montato: attivabili con usi, incantesimi X/giorno, cariche d'oggetto. */
export function risorseDi(c: Combattente): RisorsaPg[] {
  const out: RisorsaPg[] = [];
  for (const a of c.attivabili ?? []) {
    if (!a.usi) continue;
    // Il kernel scrive la ricarica per riposo (`{riposo-breve: 1, riposo-lungo: tutti}`): torna
    // (anche in parte) col breve → la scheda la segna «breve».
    const ric = a.usi.ricarica && typeof a.usi.ricarica === "object" && "riposo-breve" in a.usi.ricarica ? "breve" : "lungo";
    out.push({ id: chiaveNota(a.id), label: a.nome, max: a.usi.massimo, ric, fonte: "attivabile", chiave: a.id });
  }
  for (const s of c.incantatore?.lanciabili ?? []) {
    if (s.usiGiornalieri) out.push({ id: chiaveNota(s.id), label: `${s.nome} (al giorno)`, max: s.usiGiornalieri, ric: "lungo", fonte: "giornaliero", chiave: s.id });
  }
  for (const [oggetto, p] of Object.entries(c.cariche ?? {})) {
    out.push({ id: chiaveNota(oggetto), label: `${p.nome} (cariche)`, max: p.massimo, ric: "lungo", fonte: "cariche", chiave: oggetto });
  }
  return out;
}

/** L'Attore della nota, assemblato dal libretto al suo livello (null senza libretto). */
export function attoreDiNota(fm: any, cat: Catalogo): Attore | null {
  const lib = librettoDi(fm);
  return lib ? attoreAlLivello(cat, lib, livelloCorrente(lib)) : null;
}

/**
 * I campi DERIVATI della nota dal libretto: ciò che la scheda, Dataview e le azioni del vault
 * leggono. Li scrive solo il codice; il libretto è la fonte. Le risorse a usi diventano
 * `risorse_pg` (con la chiave del motore) e gli slot `slot_N`.
 */
export function derivatiPg(lib: Libretto, attore: Attore, cat: Catalogo): Record<string, any> {
  const fm = personaggioAFrontmatter(attore);
  const passi = lib.passi;
  const classeBase = lib.base.classeId;
  // Le classi in ordine d'ingresso, coi livelli e la sottoclasse scelta in ciascuna.
  const classi = [...new Set(passi.map((p) => p.classeId ?? classeBase))].map((id) => {
    const suoi = passi.filter((p) => (p.classeId ?? classeBase) === id);
    const sotto = suoi.filter((p) => p.sottoclasseId).at(-1)?.sottoclasseId ?? "";
    return { id: nomina(id, cat.classi), livello: suoi.length, sottoclasse: sotto ? nomina(sotto, cat.sottoclassi) : "" };
  });
  const classe = cat.classi.find((c) => c.id === classeBase);
  fm.classe = nomina(classeBase, cat.classi);
  fm.specie = nomina(lib.base.specieId, cat.specie);
  fm.background = nomina(lib.base.backgroundId, cat.background);
  fm.classi = classi;
  fm.livello = passi.length;
  if (classe?.dado_vita) fm.dado_vita = classe.dado_vita;
  fm.dadi_vita_max = passi.length;
  if (attore.talenti?.length) fm.talenti = attore.talenti;
  if (attore.competenza_armi?.length) fm.competenze_armi = attore.competenza_armi;
  if (attore.competenza_armature?.length) fm.competenze_armature = attore.competenza_armature;
  if (attore.sensi?.scurovisione) fm.scurovisione = attore.sensi.scurovisione;
  // Slot massimi per livello d'incantesimo; il Patto torna col riposo breve.
  for (let i = 0; i < 9; i++) {
    const n = attore.incantatore?.slot?.[i] ?? 0;
    if (n > 0) fm[`slot_${i + 1}`] = n;
  }
  if (attore.incantatore?.recupero === "riposo-breve") fm.slot_ricarica = "breve";
  const risorse = risorseDi(daAttore(attore));
  if (risorse.length) fm.risorse_pg = risorse;
  return fm;
}

// I campi derivati che una riscrittura deve poter TOGLIERE (un livello rimosso, uno slot che
// non c'è più): tutto ciò che `derivatiPg` può scrivere, oltre ai suoi stessi campi.
const DERIVATI_VARIABILI = /^(slot_[1-9]|slot_ricarica|risorse_pg|talenti|competenze_armi|competenze_armature|scurovisione|trucchetti|incantesimi|padronanze_armi|prof_[a-z_]+)$/;

/**
 * Scrive libretto + derivati nel frontmatter `fm` (in place: è il callback di
 * processFrontMatter). Lo stato di gioco resta: i PF attuali salgono di quanto sale il
 * massimo (un livello nuovo) e non lo superano; gli usi spesi restano spesi. Un PG nuovo
 * parte pieno.
 */
export function scriviPg(fm: Record<string, any>, lib: Libretto, cat: Catalogo, nuovo = false): void {
  const attore = attoreAlLivello(cat, lib, livelloCorrente(lib));
  if (!attore) throw new Error("il catalogo non basta a montare il PG");
  const derivati = derivatiPg(lib, attore, cat);
  const pfMaxPrima = Number(fm.pf_max) || 0;
  const pfPrima = Number(fm.pf);
  for (const k of Object.keys(fm)) if (DERIVATI_VARIABILI.test(k) && !(k in derivati)) delete fm[k];
  const resto = { ...derivati };
  delete resto.pf;
  Object.assign(fm, resto, { libretto: lib, categoria: "personaggio", tipo: "pg" });
  const pfMax = derivati.pf_max;
  fm.pf = nuovo || !Number.isFinite(pfPrima) ? pfMax : Math.min(pfMax, Math.max(0, pfPrima + Math.max(0, pfMax - pfMaxPrima)));
  if (nuovo) for (const r of (derivati.risorse_pg ?? []) as RisorsaPg[]) fm[`usi_${r.id}`] = 0;
}

/** Il combattente di un PG: dal libretto (completo) o, senza, dai campi piatti (`daPgGdr`). */
export function combattenteDiPg(fm: any, cat: Catalogo, armi?: Record<string, ArmaCat>): Combattente {
  const attore = attoreDiNota(fm, cat);
  if (!attore) return daPgGdr(fm, armi);
  const c = daAttore(attore);
  c.id = idPg(fm);
  return c;
}

/** Lo stato di gioco della nota → le `RisorseSpese` del motore (null senza libretto: i PG
 *  vecchi entrano pieni, come prima). */
export function risorseDaNota(fm: any, c: Combattente): RisorseSpese | null {
  if (!librettoDi(fm)) return null;
  const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const r: RisorseSpese = { slot_spesi: [], usi_giornalieri: {}, cariche_spese: {}, usi_attivabili: {} };
  for (let i = 0; i < 9; i++) r.slot_spesi!.push(n(fm[`slot_uso_${i + 1}`]));
  for (const x of risorseDi(c)) {
    const spesi = n(fm[`usi_${x.id}`]);
    if (!spesi) continue;
    if (x.fonte === "attivabile") r.usi_attivabili![x.chiave] = spesi;
    else if (x.fonte === "giornaliero") r.usi_giornalieri![x.chiave] = spesi;
    else r.cariche_spese![x.chiave] = spesi;
  }
  if (fm.pf != null) r.pf_attuali = Math.min(c.pf_max, n(fm.pf));
  if (n(fm.pf_temp)) r.pf_temporanei = n(fm.pf_temp);
  return r;
}

/** Le `RisorseSpese` a fine scontro → i campi di gioco della nota (inverso di `risorseDaNota`). */
export function notaDaRisorse(r: RisorseSpese, c: Combattente): Record<string, number> {
  const out: Record<string, number> = {};
  (r.slot_spesi ?? []).forEach((v, i) => { if (i < 9) out[`slot_uso_${i + 1}`] = v ?? 0; });
  for (const x of risorseDi(c)) {
    const fonte = x.fonte === "attivabile" ? r.usi_attivabili : x.fonte === "giornaliero" ? r.usi_giornalieri : r.cariche_spese;
    out[`usi_${x.id}`] = fonte?.[x.chiave] ?? 0;
  }
  return out;
}
