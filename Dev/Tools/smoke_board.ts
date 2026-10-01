/**
 * SMOKE della BOARD — headless (jsdom + un `obsidian` finto), con la Board VERA del plugin.
 *
 * Mette in campo un PG barbaro col libretto (dal creatore del kernel) contro un goblin e prova,
 * cliccando i pulsanti come farebbe il GM, ciò che la Board ha in comune con la plancia del
 * Compendio: l'Ira (attivabile con usi), le relazioni (mischia), il danno che fa tirare la
 * concentrazione, i tiri contro morte, i riposi e il riporto delle risorse sulla nota.
 *
 * Uso (da `plugin/`): `npm run smoke:board` (lo lancia anche pytest, `tests/test_pg_kernel.py`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { installaDom, avvisi } from './obsidian-finto'
import type { Catalogo } from '../../regole/src/creatore/catalogo'
import { daMostro } from '../../regole/src/motore/combattente'
import { ricostruisci, risorseDi, sonoIngaggiati, type Evento } from '../../regole/src/motore/motore'
import { BoardView } from '../../plugin/board'
import { trovaMostro } from '../../plugin/statblock'
import { combattenteDiPg, idPg, notaDaRisorse, scriviPg } from '../../plugin/pg'
import { assert, creaDiProva } from './pg_di_prova'

const dom = new JSDOM('<!doctype html><body></body>')
Object.assign(globalThis, { window: dom.window, document: dom.window.document })
installaDom(dom.window as unknown as { HTMLElement: typeof HTMLElement })

const dati = resolve(process.argv[2] ?? 'data')
const cat = JSON.parse(readFileSync(`${dati}/srd_catalogo.json`, 'utf8')) as Catalogo
const bestiario = JSON.parse(readFileSync(`${dati}/srd_bestiario.json`, 'utf8')) as any[]

// Il PG: barbaro al 2º col libretto, nota derivata dal kernel.
const nota: Record<string, any> = {}
scriviPg(nota, creaDiProva(cat, 'dnd.classe.barbaro', 'dnd.background.soldato', 2), cat, true)
const pg = { f: { basename: nota.nome, path: `Mondi/Personaggi/${nota.nome}.md` }, fm: nota }

// Il plugin finto: dati veri, persistenza in memoria.
let salvati: Evento[] = []
const plugin: any = {
  bestiarioCompleto: async () => bestiario,
  condizioniComplete: async () => [],
  oggettiComplete: async () => [],
  armiCatalogo: async () => ({}),
  loadDefsCondizioni: async () => ({}),
  risolviIncantesimo: async () => () => undefined,
  catalogoCompleto: async () => cat,
  loadBoard: () => salvati,
  saveBoard: async (e: Evento[]) => { salvati = [...e] },
  partyPgs: () => [pg],
  loadBoardOrigine: () => undefined,
  settings: {},
}
const app: any = { workspace: { getLeaf: () => ({ openFile: async () => {} }) }, fileManager: { processFrontMatter: async (_f: unknown, fn: (fm: any) => void) => fn(nota) }, vault: { getMarkdownFiles: () => [] }, metadataCache: { getFileCache: () => null } }
const board = new BoardView({ app } as any, plugin)

// In campo: il PG (completo, con lo stato della sua nota) e un goblin; il PG agisce per primo.
const c = combattenteDiPg(nota, cat)
const gob = daMostro(trovaMostro(bestiario, 'goblin-guerriero'))
const inPlancia = (x: any, lato: 'alleato' | 'nemico', key: string) => ({ ...x, key, pf_attuali: x.pf_max, iniziativa: null, schieramento: lato })
salvati = [
  { tipo: 'aggiunto', combattente: inPlancia(c, 'alleato', `${c.id}#1`) },
  { tipo: 'aggiunto', combattente: inPlancia(gob, 'nemico', 'gob#1') },
  { tipo: 'iniziativa', key: `${c.id}#1`, valore: 20 },
  { tipo: 'iniziativa', key: 'gob#1', valore: 1 },
  { tipo: 'cominciato' },
] as Evento[]

const radice = () => board.containerEl.children[1] as HTMLElement
const bottoni = () => [...radice().querySelectorAll('button')] as HTMLButtonElement[]
const bottone = (testo: string) => bottoni().find((b) => (b.textContent ?? '').includes(testo))
const clic = async (testo: string) => {
  const b = bottone(testo)
  assert(b, `pulsante «${testo}» (ci sono: ${bottoni().map((x) => x.textContent).join(' | ')})`)
  assert(!b.disabled, `pulsante «${testo}» attivo`)
  b.onclick?.(new dom.window.MouseEvent('click') as any)
  await new Promise((r) => setTimeout(r, 0))
}
const stato = () => ricostruisci(salvati)
const k = `${c.id}#1`

await board.onOpen()
assert(radice().textContent?.includes(`Turno di ${nota.nome}`), 'la Board mostra il turno del PG')

// 1. L'Ira: un attivabile con usi. Si accende, il pulsante lo dice, gli usi scendono.
assert(bottone('○ Ira'), 'il barbaro ha l\'Ira fra gli attivabili')
await clic('○ Ira')
assert((stato().attivi[k] ?? []).includes('ira'), 'l\'Ira è accesa nel motore')
assert(bottone('● Ira'), 'il pulsante mostra l\'Ira accesa')
console.log(`✓ Ira accesa (${bottone('● Ira')!.textContent})`)

// 2. Le relazioni: ingaggio in mischia col goblin (unico bersaglio: scelto da solo).
await clic('Ingaggia in mischia')
assert(sonoIngaggiati(stato(), k, 'gob#1'), 'il PG e il goblin sono ingaggiati nel motore')
assert(bottone("Attacco d'opportunità"), 'ingaggiati: compare l\'attacco d\'opportunità')
console.log('✓ mischia dichiarata, attacco d\'opportunità offerto')

// 3. I riposi del gruppo e i tiri contro morte a 0 PF.
assert(bottone('Riposo breve') && bottone('Riposo lungo'), 'riposi del gruppo nella barra')
// Cade a 0 con un danno pari ai suoi PF: morente (999 sarebbe danno massiccio, morte sul colpo).
salvati.push({ tipo: 'danno', key: k, quanti: stato().combattenti.find((x) => x.key === k)!.pf_attuali } as Evento)
board.ricarica()
assert(bottone('TS morte'), 'a 0 PF compaiono i tiri contro morte')
await clic('TS morte')
const m = stato().combattenti.find((x) => x.key === k)!
assert(m.morte && (m.morte.successi + m.morte.fallimenti > 0 || m.pf_attuali === 1), 'il tiro contro morte è registrato')
console.log(`✓ tiri contro morte: ${JSON.stringify(m.morte ?? { pf: m.pf_attuali })}`)

// 4. Fine scontro: le risorse spese (l'Ira) tornano sulla nota del PG.
const spese = notaDaRisorse(risorseDi(stato(), k), c)
const ira = (nota.risorse_pg ?? []).find((r: any) => r.chiave === 'ira')
assert(ira && spese[`usi_${ira.id}`] === 1, `l'Ira spesa torna sulla nota (${JSON.stringify(spese)})`)
assert(idPg(nota) === c.id, 'id di plancia coerente con la nota')
console.log(`✓ risorse verso la nota: ${JSON.stringify(spese)}`)
if (avvisi.length) console.log(`  avvisi: ${avvisi.join(' | ')}`)
