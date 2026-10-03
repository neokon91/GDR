/**
 * SMOKE del PONTE con Atlas VTT — headless, su scene scritte dal CODICE VERO di Atlas 0.5.0
 * (`tests/fixtures/atlas/`, generate col suo store e il suo salvataggio, non a mano).
 *
 * Prova la catena che la Board userà: la scena → i token abbinati ai combattenti per nome →
 * le posizioni in metri → il contesto del tiro (geometria del kernel) → il tiro per colpire
 * del motore con le regole dello spazio (portata, gittata, nemico vicino).
 *
 * Uso (da `plugin/`): `npm run smoke:atlas` (lo lancia anche pytest, `tests/test_pg_kernel.py`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Catalogo } from '../../regole/src/creatore/catalogo'
import { daMostro } from '../../regole/src/motore/combattente'
import { comandoAttacco, distanzaDelTiro, ricostruisci, type Dado, type Evento, type InPlancia } from '../../regole/src/motore/motore'
import { contestoDaPosizioni } from '../../regole/src/motore/geometria'
import { abbinaToken, leggiScenaAtlas, riconosciToken, type ScenaAtlas } from '../../plugin/atlas'
import { trovaMostro } from '../../plugin/statblock'
import { combattenteDiPg, scriviPg } from '../../plugin/pg'
import { assert, creaDiProva } from './pg_di_prova'

const dati = resolve(process.argv[2] ?? 'data')
const scene = resolve(process.argv[3] ?? '../tests/fixtures/atlas')
const cat = JSON.parse(readFileSync(`${dati}/srd_catalogo.json`, 'utf8')) as Catalogo
const bestiario = JSON.parse(readFileSync(`${dati}/srd_bestiario.json`, 'utf8')) as any[]
const scena = (nome: string): ScenaAtlas => {
  const s = leggiScenaAtlas(readFileSync(`${scene}/${nome}.atlasmap`, 'utf8'))
  assert(!('errore' in s), `${nome}: ${'errore' in s ? s.errore : ''}`)
  return s as ScenaAtlas
}

// La Board come la monta lo schieramento: un PG col libretto e due goblin dal bestiario
// (la seconda copia si chiama «Goblin guerriero (2)», come in `incontro.ts`).
const lib = creaDiProva(cat, 'dnd.classe.guerriero', 'dnd.background.soldato', 1)
lib.base.nome = 'Kara'
const nota: Record<string, any> = {}
scriviPg(nota, lib, cat, true)
const pg = combattenteDiPg(nota, cat)
const gob = daMostro(trovaMostro(bestiario, 'goblin-guerriero'))
const inPlancia = (c: any, key: string, nome: string, lato: 'alleato' | 'nemico'): InPlancia =>
  ({ ...c, key, nome, pf_attuali: c.pf_max, iniziativa: null, schieramento: lato })
const kara = `${pg.id}#1`
const s = ricostruisci([
  inPlancia(pg, kara, 'Kara', 'alleato'),
  inPlancia(gob, 'gob#1', 'Goblin guerriero', 'nemico'),
  inPlancia(gob, 'gob#2', 'Goblin guerriero (2)', 'nemico'),
].map((combattente): Evento => ({ tipo: 'aggiunto', combattente })))

// 1. La scena in metri: abbinamento, token rimasti, distanze.
const cripta = scena('Cripta')
assert(cripta.metriCasella === 1.5 && !cripta.esagonale, `Cripta: ${cripta.metriCasella} m per casella`)
const { posizioni, senzaCombattente } = abbinaToken(cripta, s.combattenti)
assert(Object.keys(posizioni).sort().join() === [kara, 'gob#1', 'gob#2'].sort().join(), `abbinati: ${Object.keys(posizioni)}`)
assert(senzaCombattente.map((t) => t.nome).join() === 'Ogre' && senzaCombattente[0]!.nascosto && senzaCombattente[0]!.caselle === 2,
  'l’ogre (nascosto, 2×2) non è nella Board: resta da schierare')
console.log(`✓ Cripta: ${Object.keys(posizioni).length} token abbinati per nome, da schierare: ${senzaCombattente.map((t) => t.nome)}`)
// Da schierare: l'ogre si riconosce nel bestiario; un nome che non è niente si dice, non si inventa.
const finto = { ...senzaCombattente[0]!, id: 'x', nome: 'Drago di cartone' }
const r = riconosciToken([...senzaCombattente, finto], bestiario, [{ f: { basename: 'Kara' }, fm: { nome: 'Kara' } }])
assert(r.riconosciuti.length === 1 && r.riconosciuti[0]!.mostro?.nome === 'Ogre' && r.ignoti.map((t) => t.nome).join() === 'Drago di cartone',
  `riconosciuti: ${r.riconosciuti.map((x) => x.token.nome)}, ignoti: ${r.ignoti.map((t) => t.nome)}`)
console.log('✓ da schierare: Ogre riconosciuto nel bestiario, «Drago di cartone» senza riscontro')

const ctx1 = contestoDaPosizioni(s, posizioni, 'gob#1', kara)!
const ctx2 = contestoDaPosizioni(s, posizioni, 'gob#2', kara)!
assert(ctx1.metri === 1.5 && ctx1.nemiciVicini!.includes(kara), `goblin 1 affiancato a Kara: ${JSON.stringify(ctx1)}`)
assert(ctx2.metri === 9 && ctx2.nemiciVicini!.length === 0, `goblin 2 a 6 caselle: ${JSON.stringify(ctx2)}`)
console.log(`✓ distanze dalla mappa: goblin 1 a ${ctx1.metri} m, goblin 2 a ${ctx2.metri} m`)

// 2. Le regole dello spazio sul tiro vero.
const azione = (nome: string) => gob.azioni!.find((a) => a.nome === nome)! as any
const fisso = (n: number): Dado => () => n
const scimitarra = azione('Scimitarra'), arco = azione('Arco corto')
assert(comandoAttacco(s, 'gob#2', kara, fisso(15), scimitarra, {}, ctx2).length === 0, 'la scimitarra a 9 m non arriva')
assert(distanzaDelTiro(s, 'gob#2', scimitarra, ctx2).motivo === 'oltre-portata', 'motivo: oltre la portata')
const tiroLontano = comandoAttacco(s, 'gob#2', kara, fisso(15), arco, {}, ctx2)[0] as any
assert(tiroLontano?.tipo === 'attacco' && !tiroLontano.spazio, `l’arco a 9 m tira normale: ${JSON.stringify(tiroLontano)}`)
const tiroVicino = comandoAttacco(s, 'gob#1', kara, fisso(15), arco, {}, ctx1)[0] as any
assert(tiroVicino?.tiro === 'svantaggio' && tiroVicino.spazio?.includes('nemico-vicino'), `l’arco con Kara addosso: ${JSON.stringify(tiroVicino)}`)
assert(comandoAttacco(s, 'gob#1', kara, fisso(15), scimitarra, {}, ctx1).length > 0, 'la scimitarra affiancata colpisce')
console.log('✓ regole dello spazio: scimitarra oltre portata rifiutata, arco normale a 9 m, svantaggio col nemico addosso')

// 3. La scena con la griglia predefinita di Atlas (nessuna unità: 5 piedi per casella).
const ponte = scena('Ponte')
const p2 = abbinaToken(ponte, s.combattenti)
const ctx3 = contestoDaPosizioni(s, p2.posizioni, 'gob#1', kara)!
assert(ponte.metriCasella === 1.5 && ctx3.metri === 6, `Ponte: ${ponte.metriCasella} m per casella, goblin a ${ctx3?.metri} m`)
assert(ponte.token.every((t) => t.schieramento === 'nemico'), 'senza `side` né visione Atlas li legge avversari')
console.log(`✓ Ponte (griglia in piedi, default di Atlas): goblin a ${ctx3.metri} m in diagonale`)

// 4. Ciò che il lettore rifiuta: un formato più nuovo, un file che non è una scena.
const nuovo = JSON.parse(readFileSync(`${scene}/Cripta.atlasmap`, 'utf8'))
nuovo.version = 5
assert('errore' in leggiScenaAtlas(JSON.stringify(nuovo)), 'un formato più nuovo si rifiuta, come fa Atlas')
assert('errore' in leggiScenaAtlas('{"nome":"Kara"}') && 'errore' in leggiScenaAtlas('non json'), 'un file che non è una scena si rifiuta')
console.log('✓ formati più nuovi e file estranei rifiutati con la ragione')
