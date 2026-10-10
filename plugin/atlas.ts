// IL PONTE CON ATLAS VTT, lato lettura: una scena `.atlasmap` → le posizioni dei combattenti
// della Board, in metri, per la geometria del kernel (`regole/src/motore/geometria.ts`).
//
// Il contratto sono i FILE, non il codice di Atlas: la scena (`.atlasmap`), che Atlas scrive
// con l'API del vault (`app.vault.create`, poi `app.vault.process`) 500 ms dopo l'ultima
// modifica e si è impegnato a tenere leggibile da ogni versione (busta `{state, version}`,
// versione 4; i campi vecchi restano), e il `collection.json` della sua collezione (dalla 0.6,
// nel vault), che decide come si misura. Verificato sul sorgente di Atlas 0.7.0 e su file
// scritti dal suo stesso codice (`tests/fixtures/atlas/`). Qui si legge e basta: Atlas non sa
// che esistiamo.
import { CASELLA, type Impronta, type RegolaDiagonali } from "../regole/src/motore/geometria";

/** La versione del formato che Atlas scrive (0.5–0.7). Una più alta la rifiuta anche Atlas. */
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
  /** La nota-statblock a cui Atlas ha collegato il token («Link Statblock»), se c'è. */
  nota?: string;
};

export type ScenaAtlas = {
  /** I pixel di una casella e dove comincia la griglia. */
  pixelCasella: number;
  offsetX: number;
  offsetY: number;
  /** I metri di una casella, come li misura Atlas (la collezione, o la distanza propria della scena). */
  metriCasella: number;
  /** Come contano le diagonali: la regola della collezione (una casella se non ne ha). */
  diagonali: RegolaDiagonali;
  /** Perché le distanze non si calcolano (griglia esagonale, misura a fasce), o null. */
  senzaDistanze: string | null;
  /** Da dove viene la misura: il `collection.json` della collezione, o la scena se non la dichiara. */
  misuraDa: "collezione" | "scena";
  token: TokenAtlas[];
};

/** Le regole di misura di una collezione di Atlas (`settings.gridDefaults` del `collection.json`). */
export type MisuraAtlas = {
  unitType: string;
  unitDistance: number;
  measurementMode: "metric" | "abstract";
  diagonalRule: "equidistant" | "alternating" | "euclidean";
};

const numero = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const oggetto = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

// Le unità di Atlas in metri, alla scala del manuale (5 piedi = 1,5 m: 1 piede = 0,3 m).
const METRI_PER_UNITA: Record<string, number> = { meters: 1, feet: 0.3, yards: 0.9 };
const DIAGONALI: Record<MisuraAtlas["diagonalRule"], RegolaDiagonali> = { equidistant: "una-casella", alternating: "alternate", euclidean: "retta" };
// Una distanza per casella che Atlas accetta (`isUnitDistance`).
const distanzaValida = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0.000001 && v <= 1_000_000;

/** Il `collection.json` della collezione a cui appartiene una scena: la cartella decide. */
export function fileCollezioneDi(percorsoScena: string): string | null {
  const id = /^atlas-vtt\/collections\/([^/]+)\//.exec(percorsoScena)?.[1];
  return id ? `atlas-vtt/collections/${id}/collection.json` : null;
}

/**
 * Le regole di misura di un `collection.json`. Null se la collezione non ne ha (Atlas allora
 * misura dalla scena) o se il file non è una collezione di Atlas (manca `uid`).
 */
export function leggiMisuraCollezione(testo: string): MisuraAtlas | null {
  let grezzo: unknown;
  try { grezzo = JSON.parse(testo); } catch { return null; }
  const c = oggetto(grezzo);
  if (!c || typeof c.uid !== "string" || !c.uid) return null;
  const g = oggetto(oggetto(c.settings)?.gridDefaults);
  if (!g || typeof g.unitType !== "string" || !distanzaValida(g.unitDistance)) return null;
  const regola = g.diagonalRule === "alternating" || g.diagonalRule === "euclidean" ? g.diagonalRule : "equidistant";
  return { unitType: g.unitType, unitDistance: g.unitDistance, measurementMode: g.measurementMode === "abstract" ? "abstract" : "metric", diagonalRule: regola };
}

/**
 * Legge il testo di una scena e la misura come Atlas (`resolveMeasurementSettings`): le
 * regole della collezione vincono su quelle scritte nella griglia della scena, che ne è solo
 * una copia presa alla creazione; la scena aggiunge la sua distanza per casella
 * (`unitDistanceOverride`). Senza collezione nota si misura dalla griglia della scena, coi
 * 5 piedi di Atlas se non dice niente. Un file che non è una scena di Atlas, o di una
 * versione più nuova, dà un errore con la sua ragione: niente letture a metà.
 */
export function leggiScenaAtlas(testo: string, collezione: MisuraAtlas | null = null): ScenaAtlas | { errore: string } {
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
  const regole: MisuraAtlas = collezione ?? {
    unitType: typeof griglia.unitType === "string" ? griglia.unitType : "feet",
    unitDistance: distanzaValida(griglia.unitDistance) ? griglia.unitDistance : 5,
    measurementMode: "metric",
    diagonalRule: "equidistant",
  };
  const propria = regole.measurementMode === "metric" && distanzaValida(griglia.unitDistanceOverride) ? griglia.unitDistanceOverride : undefined;
  const distanza = propria ?? regole.unitDistance;
  // In «units» o «custom» una casella non ha una misura reale: vale quella del manuale.
  const metriCasella = METRI_PER_UNITA[regole.unitType] ? distanza * METRI_PER_UNITA[regole.unitType]! : CASELLA;
  const esagonale = typeof griglia.type === "string" && griglia.type.startsWith("hex");

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
      ...(typeof o.statblockPath === "string" && o.statblockPath ? { nota: o.statblockPath } : {}),
    });
  }
  return {
    pixelCasella,
    offsetX: numero(griglia.offsetX) ?? 0,
    offsetY: numero(griglia.offsetY) ?? 0,
    metriCasella,
    diagonali: DIAGONALI[regole.diagonalRule],
    senzaDistanze: esagonale ? "griglia esagonale" : regole.measurementMode === "abstract" ? "misura a fasce di distanza" : null,
    misuraDa: collezione ? "collezione" : "scena",
    token,
  };
}

/**
 * Il percorso a cui punta un link del frontmatter, in ogni forma che Obsidian e Atlas scrivono:
 * wikilink (`[[percorso|alias]]`, `[[Scena#istantanea]]`), link Markdown (`[alias](percorso)`,
 * anche codificato), incorporato (`![[...]]`) o il percorso nudo. Di una lista, il primo.
 */
export function percorsoDaLink(v: unknown): string | null {
  const testo = String((Array.isArray(v) ? v[0] : v) ?? "").trim().replace(/^!/, "");
  const wiki = /^\[\[([^\]|#]+)/.exec(testo)?.[1];
  const markdown = /^\[[^\]]*\]\(\s*<?([^)>#]+?)>?\s*(?:#[^)]*)?\)/.exec(testo)?.[1];
  let percorso = wiki ?? markdown ?? testo;
  if (markdown && !wiki) { try { percorso = decodeURIComponent(markdown); } catch { /* resta com'è */ } }
  percorso = percorso.trim();
  return percorso || null;
}

/** L'impronta di un token in metri (centro e lato), per la geometria del kernel. */
export function improntaDi(scena: ScenaAtlas, t: TokenAtlas): Impronta {
  const m = scena.metriCasella / scena.pixelCasella;
  return { x: (t.x - scena.offsetX) * m, y: (t.y - scena.offsetY) * m, lato: t.caselle * scena.metriCasella };
}

/** Il nome confrontabile: minuscolo, senza accenti né il numero di copia che la Board aggiunge («Goblin (2)»). */
export const nomeConfrontabile = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s*\(\d+\)\s*$/, "").replace(/\s+/g, " ").trim().toLowerCase();
const base = nomeConfrontabile;
const copia = (key: string) => Number(/#(\d+)$/.exec(key)?.[1] ?? 1);

/**
 * Il nome con cui si riconosce un token: quello della sua nota-statblock, se Atlas l'ha
 * collegato a una (`nomeDellaNota`: il `nome` della nota, o il nome del file), altrimenti il
 * nome del token. Così un goblin rinominato «Grishnak» resta il goblin del bestiario.
 */
const nomeDiRiconoscimento = (t: TokenAtlas, nomeDellaNota?: (percorso: string) => string | null): string =>
  (t.nota && nomeDellaNota?.(t.nota)) || t.nome;

/**
 * Abbina i token ai combattenti della Board per NOME: quello della nota collegata se il token
 * ne ha una, altrimenti il suo (il nome viene dall'asset e il GM lo cambia in «Edit Token»).
 * Più copie con lo stesso nome si abbinano in ordine: la copia 1 di Atlas alla prima della
 * Board. Torna le impronte per chiave di combattente e i token rimasti senza combattente (da
 * schierare, o un nome da correggere).
 */
export function abbinaToken(
  scena: ScenaAtlas,
  combattenti: readonly { key: string; nome: string }[],
  nomeDellaNota?: (percorso: string) => string | null,
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
  for (const t of scena.token) {
    const k = base(nomeDiRiconoscimento(t, nomeDellaNota));
    perToken.set(k, [...(perToken.get(k) ?? []), t]);
  }
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

/** I metri come si leggono al tavolo: «9 m», «1,5 m». */
export const metriLeggibili = (m: number) => `${String(Math.round(m * 10) / 10).replace(".", ",")} m`;

/** Un token da schierare, riconosciuto: un PG del vault o una creatura del bestiario, per nome. */
export type TokenRiconosciuto<P> =
  | { token: TokenAtlas; pg: P; mostro?: undefined }
  | { token: TokenAtlas; mostro: any; pg?: undefined };

/**
 * Riconosce i token rimasti senza combattente: prima i PG del vault (`nome` della nota o il
 * nome del file), poi il bestiario (nome, o id/slug come `trovaMostro`), col nome della nota
 * collegata se il token ne ha una (`nomeDellaNota`, come in `abbinaToken`). I nomi che non
 * corrispondono a niente tornano a parte: il GM rinomina il token in Atlas, o lo collega.
 */
export function riconosciToken<P extends { f: { basename: string }; fm: any }>(
  token: readonly TokenAtlas[],
  bestiario: readonly any[],
  pgs: readonly P[],
  nomeDellaNota?: (percorso: string) => string | null,
): { riconosciuti: TokenRiconosciuto<P>[]; ignoti: TokenAtlas[] } {
  const riconosciuti: TokenRiconosciuto<P>[] = [];
  const ignoti: TokenAtlas[] = [];
  for (const t of token) {
    const k = base(nomeDiRiconoscimento(t, nomeDellaNota));
    const pg = k ? pgs.find((p) => base(String(p.fm?.nome || p.f.basename)) === k) : undefined;
    const mostro = pg || !k ? undefined
      : bestiario.find((m) => base(String(m?.nome ?? "")) === k)
        ?? bestiario.find((m) => m?.id === t.nome || String(m?.id ?? "").split(".").pop() === k.replace(/ /g, "-"));
    if (pg) riconosciuti.push({ token: t, pg });
    else if (mostro) riconosciuti.push({ token: t, mostro });
    else ignoti.push(t);
  }
  // Le copie nell'ordine di Atlas: la copia 1 diventa la prima della Board, come in `abbinaToken`.
  const chiave = (t: TokenAtlas) => base(nomeDiRiconoscimento(t, nomeDellaNota));
  riconosciuti.sort((a, b) => chiave(a.token).localeCompare(chiave(b.token)) || a.token.istanza - b.token.istanza);
  return { riconosciuti, ignoti };
}

/** Cosa mostra il blocco `gdr scena` di una nota (Incontro, Luogo) per la sua `mappa_battaglia`. */
export type ScenaDaIncorporare =
  | { tipo: "nessuna" }
  | { tipo: "manca"; link: string }
  | { tipo: "senza-atlas" }
  | { tipo: "scena"; percorso: string };

/**
 * Decide il blocco `gdr scena`: la scena da incorporare (`![[percorso]]`, la scheda di Atlas),
 * oppure perché no: nessun link, un link che non porta a un file del vault, Atlas non attivo
 * (è solo desktop). `risolvi` è la risoluzione dei link di Obsidian (`getFirstLinkpathDest`).
 */
export function scenaDaIncorporare(link: unknown, risolvi: (percorso: string) => string | null, atlasAttivo: boolean): ScenaDaIncorporare {
  const percorso = percorsoDaLink(link);
  if (!percorso) return { tipo: "nessuna" };
  const file = risolvi(percorso);
  if (!file) return { tipo: "manca", link: percorso };
  return atlasAttivo ? { tipo: "scena", percorso: file } : { tipo: "senza-atlas" };
}
