// Adapter: dato-di-dominio GDR → `Combattente` del motore `regole`. (I mostri li converte
// `daMostro` in `regole`; qui il PG, la cui forma-dato è specifica di GDR.)
import type { Combattente } from "../regole/src/motore/combattente";
import { daAttore } from "../regole/src/motore/combattente";
import { modificatore } from "../regole/src/creatore/risolutore";
import type { Attore, Caratteristica } from "../regole/src/creatore/attore";

const ABIL: Caratteristica[] = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Ponte frontmatter-PG GDR → `Attore` (il modello che `regole/creatore` sa risolvere).
// Il frontmatter è ricco e piatto: punteggi grezzi al top-level (`forza: 15`), `ts_<car>` =
// FLAG di competenza 0/1, `competenza` = bonus competenza, `pf_max`/`ca` già calcolati. Ne
// ricostruisce i SOLI campi che il combattimento del PG usa (caratteristiche+CA+PF+iniziativa,
// da cui `daAttore` deriva i tiri salvezza). L'offensiva NON entra: gli attacchi dipendono
// dall'arma che il giocatore sceglie → restano a mano (barra PF/danni), non auto-eseguiti.
// I campi obbligatori di `Attore` non usati dal motore (percezione/abilità/taglia) si
// popolano onestamente ma non pesano sul Combattente risultante.
export function attoreDaPgGdr(fm: any): Attore {
  const caratteristiche = Object.fromEntries(
    ABIL.map((c) => [c, { valore: n(fm[c]), competenza: n(fm[`ts_${c}`]) ? 1 : 0 }]),
  ) as Record<Caratteristica, { valore: number; competenza: number }>;
  const pb = n(fm.competenza);
  const pf = n(fm.pf_max) || n(fm.pf);
  // competenza_abilita dai flag `prof_<id>: 0/1` (grado pieno; la maestria non è tracciata qui).
  const competenza_abilita: Record<string, number> = {};
  for (const k of Object.keys(fm || {})) {
    if (k.startsWith("prof_") && n(fm[k])) competenza_abilita[k.slice(5)] = 1;
  }
  return {
    nome: String(fm.nome ?? "PG"),
    livello: n(fm.livello) || undefined,
    caratteristiche,
    ca: { valore: n(fm.ca) },
    punti_ferita: { massimi: pf, attuali: pf },
    bonus_competenza: pb,
    iniziativa: modificatore(n(fm.destrezza)),
    attacchi_per_azione: 1, // l'offensiva del PG resta al giocatore, non al motore
    percezione_passiva: 10 + modificatore(n(fm.saggezza)) + (n(fm.prof_percezione) ? pb : 0),
    competenza_abilita,
    taglia: "media",
  };
}

// Adapter PG GDR → Combattente: costruisce l'`Attore` e lo passa per `daAttore` (motore
// `regole`), così la matematica di derivazione (mod, tiri salvezza) vive UNA volta sola in
// `regole/creatore`, non duplicata qui (chiude il TODO dell'audit A5). L'id resta slug-ato
// `pg:<slug>` perché più PG possano stare in plancia senza collidere (`daAttore` usa `pg`).
export function daPgGdr(fm: any): Combattente {
  const c = daAttore(attoreDaPgGdr(fm));
  const slug = String(fm.nome ?? "pg").toLowerCase().replace(/\s+/g, "-");
  c.id = `pg:${slug}`;
  return c;
}
