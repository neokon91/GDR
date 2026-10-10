/**
 * SMOKE del PONTE con Atlas VTT — headless, su scene e collezioni scritte dal CODICE VERO di
 * Atlas 0.7.0 (`tests/fixtures/atlas/`, generate col suo store, il suo salvataggio e il suo
 * `serializeCollection`, non a mano), nei percorsi che hanno nel vault.
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
import {
  abbinaToken, fileCollezioneDi, leggiMisuraCollezione, leggiScenaAtlas, percorsoDaLink, riconosciToken, scenaDaIncorporare, type ScenaAtlas,
} from '../../plugin/atlas'
import { trovaMostro } from '../../plugin/statblock'
import { combattenteDiPg, scriviPg } from '../../plugin/pg'
import { assert, creaDiProva } from './pg_di_prova'

const dati = resolve(process.argv[2] ?? 'data')
const vault = resolve(process.argv[3] ?? '../tests/fixtures/atlas')
const cat = JSON.parse(readFileSync(`${dati}/srd_catalogo.json`, 'utf8')) as Catalogo
const bestiario = JSON.parse(readFileSync(`${dati}/srd_bestiario.json`, 'utf8')) as any[]
const percorsi: Record<string, string> = {
  Cripta: 'atlas-vtt/collections/gdr/scenes/Cripta.atlasmap',
  Ponte: 'atlas-vtt/collections/gdr/scenes/Ponte.atlasmap',
  Torre: 'atlas-vtt/collections/variante/scenes/Torre.atlasmap',
}
const testoScena = (nome: string) => readFileSync(`${vault}/${percorsi[nome]}`, 'utf8')
// Come la Board: la scena con le regole di misura del collection.json della sua cartella.
const scena = (nome: string, conCollezione = true): ScenaAtlas => {
  const fc = fileCollezioneDi(percorsi[nome]!)
  const misura = conCollezione && fc ? leggiMisuraCollezione(readFileSync(`${vault}/${fc}`, 'utf8')) : null
  const s = leggiScenaAtlas(testoScena(nome), misura)
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
assert(cripta.metriCasella === 1.5 && !cripta.senzaDistanze && cripta.misuraDa === 'collezione' && cripta.diagonali === 'una-casella',
  `Cripta: ${JSON.stringify({ ...cripta, token: undefined })}`)
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

// 3. La misura viene dalla collezione: il Ponte ha la griglia predefinita (nessuna unità) e
// misura in metri perché la sua collezione dice così; senza collezione, i 5 piedi di Atlas.
const ponte = scena('Ponte')
const p2 = abbinaToken(ponte, s.combattenti)
const ctx3 = contestoDaPosizioni(s, p2.posizioni, 'gob#1', kara, ponte.metriCasella, ponte.diagonali)!
assert(ponte.metriCasella === 1.5 && ponte.misuraDa === 'collezione' && ctx3.metri === 6, `Ponte: ${ponte.metriCasella} m per casella, goblin a ${ctx3?.metri} m`)
const ponteSenza = scena('Ponte', false)
assert(ponteSenza.misuraDa === 'scena' && ponteSenza.metriCasella === 1.5, `Ponte senza collezione: ${ponteSenza.metriCasella}`)
assert(ponte.token.every((t) => t.schieramento === 'nemico'), 'senza `side` né visione Atlas li legge avversari')
console.log(`✓ Ponte (griglia predefinita, misura della collezione): goblin a ${ctx3.metri} m in diagonale`)

// 4. La Torre: collezione in piedi a diagonali alternate, la scena con 10 piedi per casella sua
// (la griglia ne porta ancora la copia vecchia, 5). Kara e il goblin a tre caselle in diagonale.
const torre = scena('Torre')
const p4 = abbinaToken(torre, s.combattenti)
const ctx4 = contestoDaPosizioni(s, p4.posizioni, 'gob#1', kara, torre.metriCasella, torre.diagonali)!
assert(torre.metriCasella === 3 && torre.diagonali === 'alternate', `Torre: ${torre.metriCasella} m per casella, diagonali ${torre.diagonali}`)
assert(ctx4.metri === 12, `Torre: tre diagonali alternate da 3 m = 1+2+1 caselle, non ${ctx4.metri} m`)
const torreSenza = scena('Torre', false)
assert(torreSenza.metriCasella === 3 && torreSenza.diagonali === 'una-casella', 'senza collezione: la distanza della scena, diagonali da una casella')
console.log(`✓ Torre (piedi, 10 per casella, diagonali alternate): goblin a ${ctx4.metri} m come il righello di Atlas`)

// 5. Una collezione a fasce di distanza (Daggerheart) non dà metri: niente distanze.
const fasce = JSON.parse(readFileSync(`${vault}/atlas-vtt/collections/gdr/collection.json`, 'utf8'))
fasce.settings.gridDefaults.measurementMode = 'abstract'
const astratta = leggiScenaAtlas(testoScena('Cripta'), leggiMisuraCollezione(JSON.stringify(fasce))) as ScenaAtlas
assert(astratta.senzaDistanze === 'misura a fasce di distanza', `fasce: ${astratta.senzaDistanze}`)
assert(leggiMisuraCollezione('{"settings":{}}') === null, 'un file senza uid non è una collezione')
console.log('✓ misura a fasce: distanze non calcolate')

// 6. I link alla scena, in ogni forma che Obsidian e Atlas scrivono.
const p = 'atlas-vtt/collections/gdr/scenes/Cripta.atlasmap'
for (const [link, atteso] of [
  [`[[${p}|Cripta]]`, p], ['[[Cripta.atlasmap#Prima del crollo]]', 'Cripta.atlasmap'], [`![[${p}]]`, p],
  ['[Cripta](atlas-vtt/collections/gdr/scenes/Cripta%20vecchia.atlasmap)', 'atlas-vtt/collections/gdr/scenes/Cripta vecchia.atlasmap'],
  [`[Cripta](<${p}>)`, p], [p, p], [[`[[${p}]]`], p],
] as const) assert(percorsoDaLink(link) === atteso, `link ${JSON.stringify(link)} → ${percorsoDaLink(link)}`)
assert(percorsoDaLink('') === null && percorsoDaLink(undefined) === null, 'nessun link')
console.log('✓ link: wikilink, Markdown, incorporati, istantanee, percorso nudo')

// Il blocco `gdr scena` delle note: la scena da incorporare, o perché no.
const risolvi = (l: string) => Object.values(percorsi).find((x) => x === l || x.endsWith(`/${l}`)) ?? null
const incorpora = (link: unknown, atlas = true) => JSON.stringify(scenaDaIncorporare(link, risolvi, atlas))
assert(incorpora('[[Cripta.atlasmap|Cripta]]') === JSON.stringify({ tipo: 'scena', percorso: p }), `scena: ${incorpora('[[Cripta.atlasmap|Cripta]]')}`)
assert(incorpora(undefined) === '{"tipo":"nessuna"}' && incorpora('') === '{"tipo":"nessuna"}', 'senza link')
assert(incorpora('[[Sparita.atlasmap]]') === '{"tipo":"manca","link":"Sparita.atlasmap"}', 'link a niente')
assert(incorpora(`[[${p}]]`, false) === '{"tipo":"senza-atlas"}', 'senza Atlas')
console.log('✓ blocco gdr scena: scena incorporata, o nessun link, link rotto, Atlas assente')

// 7. Ciò che il lettore rifiuta: un formato più nuovo, un file che non è una scena.
const nuovo = JSON.parse(testoScena('Cripta'))
nuovo.version = 5
assert('errore' in leggiScenaAtlas(JSON.stringify(nuovo)), 'un formato più nuovo si rifiuta, come fa Atlas')
assert('errore' in leggiScenaAtlas('{"nome":"Kara"}') && 'errore' in leggiScenaAtlas('non json'), 'un file che non è una scena si rifiuta')
console.log('✓ formati più nuovi e file estranei rifiutati con la ragione')
