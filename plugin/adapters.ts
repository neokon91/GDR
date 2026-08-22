// Adapter: dato-di-dominio GDR → `Combattente` del motore `regole`. (I mostri li converte
// `daMostro` in `regole`; qui il PG, la cui forma-dato è specifica di GDR.)
import type { Combattente } from "../regole/src/motore/combattente";

// Adapter PG GDR → Combattente. Il frontmatter del PG è ricco e piatto: mod_* già
// calcolati, ts_* = FLAG di competenza (0/1), competenza = bonus competenza. Ne ricava CA,
// PF, bonus iniziativa (mod destrezza) e i tiri salvezza (mod + PB·flag). NON gli attacchi:
// dipendono dall'arma che il giocatore sceglie → gestiti a mano (barra PF/danni), non
// auto-eseguiti. Così il PG entra in plancia targetabile, subisce danni e TIRA salvezza
// (i mostri lo attaccano dal motore); la sua offensiva resta al giocatore.
// TODO (debito, audit A5): mappare il frontmatter → `Attore` e passare per `daAttore`, così
// la matematica TS/mod non è duplicata qui ma riusata da `regole/creatore`.
export function daPgGdr(fm: any): Combattente {
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
