// Ricucitura prepara→gioca (audit F2): traduce una nota-Incontro del vault negli `Evento[]`
// che popolano la Board. Legge le creature collegate (nemici), gli alleati e i PG del party;
// applica gli override `varianti` (hp/ca) per boss/gregari. Le creature si risolvono nel
// bestiario per nome/slug (via trovaMostro), tollerante alla migrazione degli id.
import { daMostro, type Combattente } from "../regole/src/motore/combattente";
import type { Evento, InPlancia } from "../regole/src/motore/motore";
import { daPgGdr } from "./adapters";
import { trovaMostro } from "./statblock";

type Override = { hp?: number; ca?: number };

// Nome-creatura da un valore-link: `[[Nome|alias]]`→Nome, path-qualificato→ultimo segmento,
// stringa nuda→com'è.
function nomeDaLink(v: any): string {
  const t = String(v ?? "").trim();
  const m = t.match(/^\[\[([^\]]+)\]\]$/);
  const inner = (m ? m[1] : t).split("|")[0].trim();
  return inner.split("/").pop()!.trim();
}

function asArray(v: any): any[] {
  return Array.isArray(v) ? v : v != null && v !== "" ? [v] : [];
}

// Override `varianti`: mappa nome→"hp 60, ca 12" (o lista di stringhe "[[X]]: hp 60…").
// Best-effort: forme sconosciute ignorate. Alias `pf`→hp.
function leggiVarianti(fm: any): Record<string, Override> {
  const out: Record<string, Override> = {};
  const parse = (nome: string, spec: string) => {
    const o: Override = {};
    const hp = spec.match(/\b(?:hp|pf)\s*[:=]?\s*(\d+)/i);
    const ca = spec.match(/\bca\s*[:=]?\s*(\d+)/i);
    if (hp) o.hp = +hp[1];
    if (ca) o.ca = +ca[1];
    if (o.hp != null || o.ca != null) out[nomeDaLink(nome).toLowerCase()] = o;
  };
  const v = fm?.varianti;
  if (!v) return out;
  if (Array.isArray(v)) {
    for (const r of v) { const s = String(r); const i = s.indexOf(":"); if (i > 0) parse(s.slice(0, i), s.slice(i + 1)); }
  } else if (typeof v === "object") {
    for (const [k, val] of Object.entries(v)) parse(k, String(val));
  }
  return out;
}

/**
 * Costruisce gli eventi di plancia da una nota-Incontro. Ritorna gli `eventi` (una serie di
 * `aggiunto`) e i `saltati` (nomi non risolti nel bestiario — creature homebrew non ancora
 * gestite). Il chiamante persiste gli eventi e apre la Board.
 */
export function eventiDaIncontro(
  fm: any,
  bestiario: any[],
  party: { f: any; fm: any }[],
): { eventi: Evento[]; saltati: string[] } {
  const conteggi: Record<string, number> = {};
  const saltati: string[] = [];
  const eventi: Evento[] = [];
  const varianti = leggiVarianti(fm);

  // Avvolge un Combattente in InPlancia con key unica (`id#n`), nome disambiguato dal 2º
  // doppione, PF pieni, applicando l'eventuale override varianti (per nome).
  const schiera = (base: Combattente, lato: "alleato" | "nemico") => {
    const ov = varianti[String(base.nome).toLowerCase()];
    const ca = ov?.ca ?? base.ca;
    const pfMax = ov?.hp ?? base.pf_max;
    const n = (conteggi[base.id] = (conteggi[base.id] ?? 0) + 1);
    const nome = n > 1 ? `${base.nome} (${n})` : base.nome;
    const c: InPlancia = { ...base, ca, pf_max: pfMax, key: `${base.id}#${n}`, nome, pf_attuali: pfMax, iniziativa: null, schieramento: lato };
    eventi.push({ tipo: "aggiunto", combattente: c });
  };

  // Nemici: le creature collegate (i duplicati nella lista = più copie).
  for (const link of asArray(fm?.creature)) {
    const nome = nomeDaLink(link);
    const raw = trovaMostro(bestiario, nome);
    if (raw) schiera(daMostro(raw), "nemico");
    else if (nome && !saltati.includes(nome)) saltati.push(nome);
  }

  // Alleati collegati (PNG/creature che combattono col gruppo).
  for (const link of asArray(fm?.alleati)) {
    const nome = nomeDaLink(link);
    const raw = trovaMostro(bestiario, nome);
    if (raw) schiera(daMostro(raw), "alleato");
    else if (nome && !saltati.includes(nome)) saltati.push(nome);
  }

  // Il gruppo: i PG del vault entrano come alleati.
  for (const pg of party) schiera(daPgGdr(pg.fm), "alleato");

  return { eventi, saltati };
}
