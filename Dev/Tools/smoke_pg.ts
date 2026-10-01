/**
 * SMOKE del PG col LIBRETTO (Tier 3) — headless, col catalogo vero del vault.
 *
 * Fa le domande che farebbe il creatore (`plugin/creatore.ts`) scegliendo da solo le prime
 * opzioni che la GUIDA del kernel offre, e prova la catena intera: il libretto si chiude
 * senza mancanze, `scriviPg` ne deriva la nota, la salita non perde i PF spesi, la Board
 * monta il PG completo (`combattenteDiPg`) e le risorse vanno e tornano fra nota e motore.
 *
 * Uso (da `plugin/`): `npm run smoke:pg` (lo lancia anche pytest, `tests/test_pg_kernel.py`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Catalogo } from '../../regole/src/creatore/catalogo'
import { elencoSottoclassiPerClasse, fonteBackground, fonteClasse } from '../../regole/src/creatore/catalogo'
import { ABILITA } from '../../regole/src/creatore/risolutore'
import { type Base, type Libretto, aggiungiLivello, librettoIniziale } from '../../regole/src/creatore/libretto'
import {
  type Bozza, abilitaCompetenti, abilitaMulticlasse, anteprimaLivello, bozzaVuota, classeDelPasso,
  mancano, opzioniIncantesimi, opzioniParametro, opzioniSceltaClasse, passoDaBozza, talentoOrigine,
} from '../../regole/src/creatore/guida'
import { combattenteDiPg, idPg, librettoDi, notaDaRisorse, risorseDaNota, scriviPg } from '../../plugin/pg'

const cat = JSON.parse(readFileSync(resolve(process.argv[2] ?? 'data/srd_catalogo.json'), 'utf8')) as Catalogo

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`✗ ${msg}`)
}
const primi = <T>(xs: T[], n: number) => xs.slice(0, n)
const id = (x: { id: string }) => x.id

/** La base come la compilerebbe il creatore, con le prime opzioni. */
function base(classeId: string, bgId: string): Base {
  const b: Base = {
    nome: `Prova ${classeId.split('.').pop()}`, classeId, specieId: 'dnd.specie.umano', backgroundId: bgId,
    caratteristiche_base: { forza: 15, destrezza: 14, costituzione: 13, intelligenza: 12, saggezza: 10, carisma: 8 },
    bonus_background: {}, abilita_classe: [],
  }
  const ammesse = fonteBackground(cat, bgId)?.punteggi_caratteristica ?? []
  if (ammesse.length) b.bonus_background = { [ammesse[0]]: 2, [ammesse[1]]: 1 }
  const offerta = fonteClasse(cat, classeId)?.competenze_abilita
  if (offerta) b.abilita_classe = primi(offerta.scelte.includes('tutte') ? Object.keys(ABILITA) : offerta.scelte, offerta.quantita)
  b.lingue = primi(cat.lingue.filter((l) => l.id !== 'comune'), 2).map(id)
  for (const p of talentoOrigine(cat, b)?.parametri ?? [])
    b.talentoOrigineParametri = { ...(b.talentoOrigineParametri ?? {}), [p.id]: primi(opzioniParametro(p, cat), p.quantita).map(id) }
  return b
}

/** La bozza del prossimo livello, compilata come il creatore ma con le prime opzioni. */
function livello(lib: Libretto, classeId = ''): Bozza {
  const bozza = { ...bozzaVuota(), classeId }
  const r = classeDelPasso(cat, lib, bozza).richieste!
  const mc = abilitaMulticlasse(cat, lib, bozza)
  if (mc) bozza.abilitaScelte = primi(mc.scelte.includes('tutte') ? Object.keys(ABILITA) : mc.scelte, mc.quantita)
  if (r.sottoclasse) bozza.sottoclasseId = elencoSottoclassiPerClasse(cat, classeDelPasso(cat, lib, bozza).classeId)[0]?.id ?? ''
  if (r.talento) bozza.bonusAsi = { forza: 2 }
  for (const s of r.scelte) bozza.scelteClasse[s.privilegio] = primi(opzioniSceltaClasse(cat, lib, bozza, s), s.nuove).map(id)
  if (r.maestrie) bozza.maestrie = primi(abilitaCompetenti(anteprimaLivello(cat, lib, bozza)), r.maestrie)
  const opz = opzioniIncantesimi(cat, lib, bozza, anteprimaLivello(cat, lib, bozza))
  bozza.trucchetti = primi(opz.trucchetti, r.trucchettiNuovi).map(id)
  bozza.incantesimi = primi(opz.incantesimi, r.incantesimiNuovi).map(id)
  return bozza
}

function crea(classeId: string, bgId: string, finoA: number): Libretto {
  const b = base(classeId, bgId)
  const vuoto: Libretto = { base: b, passi: [] }
  const primo = livello(vuoto)
  assert(mancano(cat, vuoto, primo).length === 0, `${classeId} liv 1: manca ${mancano(cat, vuoto, primo).join(', ')}`)
  let lib = librettoIniziale(b, passoDaBozza(cat, vuoto, primo))
  while (lib.passi.length < finoA) {
    const bz = livello(lib)
    assert(mancano(cat, lib, bz).length === 0, `${classeId} liv ${lib.passi.length + 1}: manca ${mancano(cat, lib, bz).join(', ')}`)
    lib = aggiungiLivello(lib, passoDaBozza(cat, lib, bz))
  }
  return lib
}

// 1. Ogni classe dell'SRD si crea al 1º livello e sale fino al 5º senza mancanze.
const backgrounds = cat.background.map(id)
for (const [i, c] of cat.classi.entries()) {
  const lib = crea(c.id, backgrounds[i % backgrounds.length], 5)
  const fm: Record<string, any> = {}
  scriviPg(fm, lib, cat, true)
  assert(fm.livello === 5 && fm.pf === fm.pf_max && fm.pf_max > 0, `${c.id}: nota al 5º con PF pieni (${fm.pf}/${fm.pf_max})`)
  assert(librettoDi(fm)?.passi.length === 5, `${c.id}: il libretto sta nella nota`)
}
console.log(`✓ ${cat.classi.length} classi create e salite al 5º senza mancanze`)

// 2. La salita: i PF spesi restano spesi, il massimo nuovo si aggiunge; gli usi restano.
const guerriero = crea('dnd.classe.guerriero', 'dnd.background.soldato', 2)
const nota: Record<string, any> = {}
scriviPg(nota, guerriero, cat, true)
const risorsa = (nota.risorse_pg ?? [])[0]
assert(risorsa, 'il guerriero ha una risorsa a usi (risorse_pg)')
nota.pf = nota.pf_max - 5
nota[`usi_${risorsa.id}`] = 1
const prima = nota.pf_max
scriviPg(nota, aggiungiLivello(guerriero, passoDaBozza(cat, guerriero, livello(guerriero))), cat)
assert(nota.pf === nota.pf_max - 5 && nota.pf_max > prima, `salendo i PF spesi restano spesi (${nota.pf}/${nota.pf_max})`)
assert(nota[`usi_${risorsa.id}`] === 1, 'salendo gli usi spesi restano spesi')
console.log(`✓ salita al 3º: PF ${nota.pf}/${nota.pf_max}, ${risorsa.label} spesa 1/${risorsa.max}`)

// 3. La Board monta il PG completo e lo stato di gioco va e torna.
const c = combattenteDiPg(nota, cat)
assert(c.id === idPg(nota), 'id di plancia pg:<nome>')
assert((c.attivabili ?? []).length + (c.azioni ?? []).length > 0, 'il PG del libretto entra con azioni o attivabili')
const spese = risorseDaNota(nota, c)!
assert(spese.pf_attuali === nota.pf, 'i PF della nota entrano in plancia')
const ritorno = notaDaRisorse(spese, c)
assert(ritorno[`usi_${risorsa.id}`] === 1, 'gli usi spesi tornano nella nota')
assert(risorseDaNota({ nome: 'Vecchio', pf: 3 }, c) === null, 'un PG senza libretto entra pieno, come prima')
console.log(`✓ Board: ${c.nome} con ${(c.attivabili ?? []).length} attivabili, ${(c.azioni ?? []).length} azioni; risorse andata e ritorno`)

// 4. Un incantatore: slot nella nota, incantesimi scelti.
const mago = crea('dnd.classe.mago', 'dnd.background.sapiente', 3)
const nm: Record<string, any> = {}
scriviPg(nm, mago, cat, true)
assert(nm.slot_1 > 0 && nm.slot_2 > 0, `mago al 3º: slot di 1º e 2º (${nm.slot_1}, ${nm.slot_2})`)
assert((nm.incantesimi ?? []).length > 0 && (nm.trucchetti ?? []).length > 0, 'mago: incantesimi e trucchetti nella nota')
console.log(`✓ mago al 3º: slot ${nm.slot_1}/${nm.slot_2}, ${nm.trucchetti.length} trucchetti, ${nm.incantesimi.length} incantesimi`)

// 5. La multiclasse: guerriero 2 → mago 1, la nota elenca le due classi.
const multi = aggiungiLivello(guerriero, passoDaBozza(cat, guerriero, livello(guerriero, 'dnd.classe.mago')))
const nmc: Record<string, any> = {}
scriviPg(nmc, multi, cat, true)
assert(nmc.classi.length === 2 && nmc.classi[1].id === 'mago', `multiclasse: ${JSON.stringify(nmc.classi)}`)
console.log(`✓ multiclasse: ${nmc.classi.map((x: any) => `${x.id} ${x.livello}`).join(' / ')}`)
