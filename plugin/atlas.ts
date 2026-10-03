// IL PONTE CON ATLAS VTT, lato lettura: una scena `.atlasmap` → le posizioni dei combattenti
// della Board, in metri, per la geometria del kernel (`regole/src/motore/geometria.ts`).
//
// Il contratto è il FILE della scena, non il codice di Atlas: Atlas lo scrive con l'API del
// vault (`app.vault.create`, poi `app.vault.process`) 500 ms dopo l'ultima modifica, e si è
// impegnato a tenerlo leggibile da ogni versione (busta `{state, version}`, versione 4; i
// campi vecchi restano). Verificato sul sorgente di Atlas 0.5.0 e su scene scritte dal suo
// stesso codice (`tests/fixtures/atlas/`). Qui si legge e basta: Atlas non sa che esistiamo.
import { CASELLA, type Impronta } from "../regole/src/motore/geometria";

/** La versione del formato che Atlas 0.5 scrive. Una più alta la rifiuta anche Atlas. */
export const VERSIONE_SCENA_ATLAS = 4;

/** Un token della scena, nelle unità della mappa (pixel) e con ciò che serve al ponte. */
export type TokenAtlas = {
  id: string;
  nome: string;
  /** Il numero della copia (due goblin dalla stessa immagine: 1 e 2). */
  istanza: number;
  x: number;
  y: number;
  /** Il lato in caselle (Atlas: `size` 1 = 1×1, 1.5 = 2×2, 2 = 3×3, 2.5 = 4×4). */
  caselle: number;
  /** Da che parte sta, se la scena lo dice (`side`), o come lo legge Atlas (chi ha la visione accesa è dei giocatori). */
  schieramento: "alleato" | "nemico";
  nascosto: boolean;
};

export type ScenaAtlas = {
  /** I pixel di una casella e dove comincia la griglia. */
  pixelCasella: number;
  offsetX: number;
  offsetY: number;
  /** I metri di una casella, dalla scena (metri, piedi, iarde) o il default di Atlas (5 piedi). */
  metriCasella: number;
  /** Le griglie esagonali non hanno la distanza di Chebyshev: le distanze non si calcolano. */
  esagonale: boolean;
  token: TokenAtlas[];
};

const numero = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const oggetto = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

// Le unità di Atlas in metri, alla scala del manuale (5 piedi = 1,5 m: 1 piede = 0,3 m).
const METRI_PER_UNITA: Record<string, number> = { meters: 1, feet: 0.3, yards: 0.9 };

/**
 * Legge il testo di una scena. Un file che non è una scena di Atlas, o di una versione più
 * nuova, dà un errore con la sua ragione: niente letture a metà.
 */
export function leggiScenaAtlas(testo: string): ScenaAtlas | { errore: string } {
  let grezzo: unknown;
  try { grezzo = JSON.parse(testo); } catch { return { errore: "non è JSON" }; }
  const busta = oggetto(grezzo);
  const stato = oggetto(busta?.state);
  if (!busta || !stato) return { errore: "manca la scena (state)" };
  if (stato.schema !== undefined && stato.schema !== "atlas-vtt") return { errore: "non è una scena di Atlas" };
  const versioni = [numero(busta.version), numero(stato.version)].filter((v): v is number => v !== undefined);
  if (versioni.some((v) => v > VERSIONE_SCENA_ATLAS)) return { errore: `scena di un Atlas più nuovo (formato ${Math.max(...versioni)})` };

  const griglia = oggetto(stato.grid) ?? {};
  const pixelCasella = numero(griglia.size) ?? 70;
  if (pixelCasella <= 0) return { errore: "griglia senza misura" };
  const unita = typeof griglia.unitType === "string" ? griglia.unitType : "feet";
  const distanza = numero(griglia.unitDistance) ?? 5;
  // Una griglia in «units» (astratta) non dice quanto è grande una casella: vale quella del manuale.
  const metriCasella = METRI_PER_UNITA[unita] ? distanza * METRI_PER_UNITA[unita]! : CASELLA;

  const token: TokenAtlas[] = [];
  for (const [chiave, t] of Object.entries(oggetto(oggetto(stato.objects)?.tokens) ?? {})) {
    const o = oggetto(t);
    const x = numero(o?.x), y = numero(o?.y);
    if (!o || x === undefined || y === undefined) continue;
    const size = numero(o.size) ?? 1;
    const lato = o.side === "players" || o.side === "opponents" ? o.side : oggetto(o.vision)?.enabled === true ? "players" : "opponents";
    token.push({
      id: typeof o.id === "string" ? o.id : chiave,
      nome: typeof o.name === "string" ? o.name : "",
      istanza: numero(o.instanceNumber) ?? 1,
      x, y,
      caselle: Math.max(1, 2 * size - 1),
      schieramento: lato === "players" ? "alleato" : "nemico",
      nascosto: o.isHidden === true,
    });
  }
  return {
    pixelCasella,
    offsetX: numero(griglia.offsetX) ?? 0,
    offsetY: numero(griglia.offsetY) ?? 0,
    metriCasella,
    esagonale: typeof griglia.type === "string" && griglia.type.startsWith("hex"),
    token,
  };
}

/** L'impronta di un token in metri (centro e lato), per la geometria del kernel. */
export function improntaDi(scena: ScenaAtlas, t: TokenAtlas): Impronta {
  const m = scena.metriCasella / scena.pixelCasella;
  return { x: (t.x - scena.offsetX) * m, y: (t.y - scena.offsetY) * m, lato: t.caselle * scena.metriCasella };
}

// Il nome confrontabile: minuscolo, senza accenti né il numero di copia che la Board aggiunge («Goblin (2)»).
const base = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s*\(\d+\)\s*$/, "").trim().toLowerCase();
const copia = (key: string) => Number(/#(\d+)$/.exec(key)?.[1] ?? 1);

/**
 * Abbina i token ai combattenti della Board per NOME (Atlas 0.5 non lega un token a una
 * nota senza Fantasy Statblocks; il nome viene dall'asset e il GM lo cambia in «Edit
 * Token»). Più copie con lo stesso nome si abbinano in ordine: la copia 1 di Atlas alla
 * prima della Board. Torna le impronte per chiave di combattente e i token rimasti senza
 * combattente (da schierare, o un nome da correggere).
 */
export function abbinaToken(
  scena: ScenaAtlas,
  combattenti: readonly { key: string; nome: string }[],
): { posizioni: Record<string, Impronta>; senzaCombattente: TokenAtlas[] } {
  const perNome = new Map<string, { key: string; nome: string }[]>();
  for (const c of combattenti) {
    const k = base(c.nome);
    perNome.set(k, [...(perNome.get(k) ?? []), c]);
  }
  for (const lista of perNome.values()) lista.sort((a, b) => copia(a.key) - copia(b.key));
  const posizioni: Record<string, Impronta> = {};
  const senzaCombattente: TokenAtlas[] = [];
  const perToken = new Map<string, TokenAtlas[]>();
  for (const t of scena.token) perToken.set(base(t.nome), [...(perToken.get(base(t.nome)) ?? []), t]);
  for (const [nome, tokens] of perToken) {
    const liberi = [...(perNome.get(nome) ?? [])];
    for (const t of [...tokens].sort((a, b) => a.istanza - b.istanza)) {
      const c = liberi.shift();
      if (c) posizioni[c.key] = improntaDi(scena, t);
      else senzaCombattente.push(t);
    }
  }
  return { posizioni, senzaCombattente };
}
