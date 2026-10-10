/**
 * SMOKE della BOARD COLLEGATA AD ATLAS — headless (jsdom + `obsidian` finto), con la Board VERA
 * del plugin e le scene e collezioni scritte dal codice vero di Atlas 0.7.0 (`tests/fixtures/atlas/`,
 * nei percorsi che hanno nel vault).
 *
 * La catena come la vive il GM: l'Incontro d'origine collega la Cripta (`mappa_battaglia`); la
 * Board la legge, abbina i token, offre di schierare quelli che non ha (il nascosto non
 * spuntato); la scimitarra a 9 m non parte e lo dice; Atlas salva il goblin spostato accanto a
 * Kara e la Board, riletta la scena, lo fa colpire; il picker dei bersagli dice i metri; una
 * scena scelta a mano vince sul link; cambiate in Atlas le regole della collezione (diagonali
 * alternate), la Board le rilegge. Il link dell'Incontro è come lo copia Atlas: incorporato,
 * col percorso breve.
 *
 * Uso (da `plugin/`): `npm run smoke:board-mappa` (lo lancia anche pytest, `tests/test_pg_kernel.py`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { installaDom, avvisi, TFile } from './obsidian-finto'
import type { Catalogo } from '../../regole/src/creatore/catalogo'
import { daMostro } from '../../regole/src/motore/combattente'
import { ricostruisci, type Evento } from '../../regole/src/motore/motore'
import { BoardView } from '../../plugin/board'
import { trovaMostro } from '../../plugin/statblock'
import { combattenteDiPg, scriviPg } from '../../plugin/pg'
import { assert, creaDiProva } from './pg_di_prova'

const dom = new JSDOM('<!doctype html><body></body>')
Object.assign(globalThis, { window: dom.window, document: dom.window.document })
installaDom(dom.window as unknown as { HTMLElement: typeof HTMLElement })

const dati = resolve(process.argv[2] ?? 'data')
const cartellaVault = resolve(process.argv[3] ?? '../tests/fixtures/atlas')
const cat = JSON.parse(readFileSync(`${dati}/srd_catalogo.json`, 'utf8')) as Catalogo
const bestiario = JSON.parse(readFileSync(`${dati}/srd_bestiario.json`, 'utf8')) as any[]

// Il vault finto: le scene e le collezioni di Atlas, la nota-Incontro che collega la Cripta, il PG Kara.
const file = (path: string): TFile => {
  const f = new TFile() as any
  f.path = path
  f.basename = path.split('/').pop()!.replace(/\.[^.]+$/, '')
  f.extension = path.split('.').pop()
  f.parent = { path: path.split('/').slice(0, -1).join('/') }
  return f
}
const cripta = file('atlas-vtt/collections/gdr/scenes/Cripta.atlasmap')
const ponte = file('atlas-vtt/collections/gdr/scenes/Ponte.atlasmap')
const torre = file('atlas-vtt/collections/variante/scenes/Torre.atlasmap')
const colGdr = file('atlas-vtt/collections/gdr/collection.json')
const colVariante = file('atlas-vtt/collections/variante/collection.json')
const incontro = file('Incontri/Agguato nella cripta.md')
const daVault = [cripta, ponte, torre, colGdr, colVariante]
const testi: Record<string, string> = Object.fromEntries(daVault.map((f) => [f.path, readFileSync(`${cartellaVault}/${f.path}`, 'utf8')]))
const perPath: Record<string, TFile> = Object.fromEntries([...daVault, incontro].map((f) => [f.path, f]))
const fmIncontro = { categoria: 'incontro', nome: 'Agguato nella cripta', mappa_battaglia: '![[Cripta.atlasmap]]' }

const lib = creaDiProva(cat, 'dnd.classe.guerriero', 'dnd.background.soldato', 1)
lib.base.nome = 'Kara'
const nota: Record<string, any> = {}
scriviPg(nota, lib, cat, true)
const pg = { f: file('Mondi/Personaggi/Kara.md'), fm: nota }

const ascolto: Record<string, ((f: TFile) => void)[]> = {}
const app: any = {
  workspace: { getLeaf: () => ({ openFile: async () => {} }) },
  fileManager: { processFrontMatter: async () => {} },
  vault: {
    getMarkdownFiles: () => [],
    getFiles: () => daVault,
    getAbstractFileByPath: (p: string) => perPath[p] ?? null,
    read: async (f: TFile) => testi[f.path],
    on: (nome: string, fn: (f: TFile) => void) => { (ascolto[nome] ??= []).push(fn); return {} },
  },
  metadataCache: {
    getFileCache: (f: TFile) => (f.path === incontro.path ? { frontmatter: fmIncontro } : null),
    // Come Obsidian: il percorso intero o, per il percorso breve, il file con quel nome.
    getFirstLinkpathDest: (link: string) => perPath[link] ?? daVault.find((f) => f.path.endsWith(`/${link}`)) ?? null,
    on: () => ({}),
  },
}
let salvati: Evento[] = []
let scenaScelta: string | null = null
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
  loadBoardOrigine: () => incontro.path,
  loadBoardScena: () => scenaScelta,
  saveBoardScena: async (p: string | null) => { scenaScelta = p },
  settings: {},
}

// In plancia dall'Incontro: Kara e UN goblin. Sulla mappa ce ne sono due, più un ogre nascosto.
const kara = combattenteDiPg(nota, cat)
const gob = daMostro(trovaMostro(bestiario, 'goblin-guerriero'))
salvati = [
  { tipo: 'aggiunto', combattente: { ...kara, key: `${kara.id}#1`, pf_attuali: kara.pf_max, iniziativa: null, schieramento: 'alleato' } },
  { tipo: 'aggiunto', combattente: { ...gob, key: `${gob.id}#1`, pf_attuali: gob.pf_max, iniziativa: null, schieramento: 'nemico' } },
] as Evento[]

const board = new BoardView({ app } as any, plugin)
const radice = () => board.containerEl.children[1] as HTMLElement
const rigaMappa = () => radice().querySelector('.gdr-board-mappa-txt')?.textContent ?? ''
const bottoni = () => [...radice().querySelectorAll('button')] as HTMLButtonElement[]
const bottone = (testo: string) => bottoni().find((b) => (b.textContent ?? '').includes(testo))
const attesa = () => new Promise((r) => setTimeout(r, 0))
const clic = async (testo: string) => {
  const b = bottone(testo)
  assert(b && !b.disabled, `pulsante «${testo}» attivo (ci sono: ${bottoni().map((x) => x.textContent).join(' | ')})`)
  b!.onclick?.(new dom.window.MouseEvent('click') as any)
  await attesa(); await attesa()
}
const stato = () => ricostruisci(salvati)
const g = globalThis as any

await board.onOpen()

// 1. La scena dell'Incontro: abbinati Kara e il goblin; da schierare il secondo goblin e l'ogre.
assert(rigaMappa().includes('Mappa: Cripta') && rigaMappa().includes('2/2 in plancia sulla griglia'), `riga della mappa: ${rigaMappa()}`)
assert(bottone('Schiera dalla mappa (2)'), 'due token senza combattente')
console.log(`✓ scena dal link dell'Incontro: ${rigaMappa()}`)

// 2. Schiera dalla mappa: l'ogre nascosto parte NON spuntato (il GM lo tiene per la sorpresa).
let righe: string[] = []
g.__conferma = (m: any) => {
  const voci = [...m.contentEl.querySelectorAll('label')] as HTMLElement[]
  righe = voci.map((l) => `${(l.querySelector('input') as HTMLInputElement).checked ? '[x]' : '[ ]'}${l.textContent}`)
  ;(m.contentEl.querySelector('button.mod-cta') as HTMLButtonElement).onclick?.({} as any)
}
await clic('Schiera dalla mappa')
g.__conferma = undefined
assert(righe.some((r) => r.startsWith('[x]') && r.includes('Goblin guerriero 2')) && righe.some((r) => r.startsWith('[ ]') && r.includes('Ogre') && r.includes('nascosto')),
  `voci del picker: ${righe.join(' / ')}`)
const nomi = stato().combattenti.map((c) => c.nome)
assert(nomi.includes('Goblin guerriero (2)') && !nomi.includes('Ogre'), `in plancia: ${nomi}`)
assert(rigaMappa().includes('3/3 in plancia sulla griglia') && bottone('Schiera dalla mappa (1)'), `dopo lo schieramento: ${rigaMappa()}`)
console.log(`✓ schierato dalla mappa il goblin 2 (l'ogre nascosto resta fuori): ${righe.join(' / ')}`)

// 3. Il goblin 2 a 9 m di turno: la scimitarra non arriva, lo dice, e il turno non si spende.
salvati.push(
  { tipo: 'iniziativa', key: `${gob.id}#2`, valore: 20 },
  { tipo: 'iniziativa', key: `${kara.id}#1`, valore: 10 },
  { tipo: 'iniziativa', key: `${gob.id}#1`, valore: 5 },
  { tipo: 'cominciato' },
)
board.ricarica()
await attesa()
const prima = salvati.length
await clic('Scimitarra')
assert(salvati.length === prima, 'nessun evento: il tiro non è partito')
assert(avvisi.some((a) => a === '«Scimitarra»: Kara è a 9 m, oltre la portata.'), `avvisi: ${avvisi.join(' | ')}`)
console.log('✓ scimitarra a 9 m rifiutata: «Scimitarra»: Kara è a 9 m, oltre la portata.')

// 4. Atlas salva il goblin spostato accanto a Kara: la Board rilegge la scena e il colpo parte.
const scena = JSON.parse(testi[cripta.path]!)
const t2 = Object.values(scena.state.objects.tokens).find((t: any) => t.name === 'Goblin guerriero' && t.instanceNumber === 2) as any
t2.x = 175; t2.y = 245 // la casella sotto Kara
testi[cripta.path] = JSON.stringify(scena)
for (const fn of ascolto.modify ?? []) fn(cripta)
await attesa(); await attesa()
await clic('Scimitarra')
const colpo = salvati.slice(prima).find((e) => e.tipo === 'attacco') as any
assert(colpo && colpo.da === `${gob.id}#2` && !colpo.spazio, `il colpo affiancato: ${JSON.stringify(salvati.slice(prima))}`)
console.log('✓ salvataggio di Atlas riletto: affiancato, la scimitarra colpisce')

// 5. Il turno di Kara: il picker dei bersagli dice i metri dalla mappa.
await clic('Passa turno')
let etichette: string[] = []
g.__scegli = (e: string[]) => { etichette = e; return 0 }
const arma = bottoni().find((b) => (b.textContent ?? '').startsWith('⚔️') && !b.disabled)
assert(arma, `Kara ha un attacco (${bottoni().map((b) => b.textContent).join(' | ')})`)
arma!.onclick?.({} as any)
await attesa(); await attesa()
g.__scegli = undefined
assert(etichette.length === 2 && etichette.every((e) => e.includes('1,5 m')), `etichette: ${etichette.join(' / ')}`)
console.log(`✓ bersagli coi metri: ${etichette.join(' / ')}`)

// 6. Una scena scelta a mano vince sul link dell'Incontro (e si stacca tornando al link).
g.__scegli = (e: string[]) => e.findIndex((x) => x.startsWith('Ponte'))
await clic('Cambia scena')
assert(scenaScelta === ponte.path && rigaMappa().includes('Mappa: Ponte'), `scelta a mano: ${scenaScelta} · ${rigaMappa()}`)
g.__scegli = (e: string[]) => e.findIndex((x) => x.startsWith('Nessuna scelta a mano'))
await clic('Cambia scena')
g.__scegli = undefined
assert(scenaScelta === null && rigaMappa().includes('Mappa: Cripta'), `staccata: ${rigaMappa()}`)
console.log('✓ scena scelta a mano (Ponte), poi di nuovo quella dell\'Incontro')

// 7. Il GM cambia in Atlas le regole della collezione (diagonali alternate): Atlas riscrive il
// suo collection.json e la Board, che lo ascolta, lo rilegge.
const col = JSON.parse(testi[colGdr.path]!)
col.settings.gridDefaults.diagonalRule = 'alternating'
testi[colGdr.path] = JSON.stringify(col)
for (const fn of ascolto.modify ?? []) fn(colGdr)
await attesa(); await attesa()
assert(rigaMappa().includes('diagonali alternate'), `regole della collezione rilette: ${rigaMappa()}`)
console.log(`✓ collection.json riletto: ${rigaMappa()}`)
