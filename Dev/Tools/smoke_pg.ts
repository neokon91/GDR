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
import { type Libretto, aggiungiLivello, librettoIniziale } from '../../regole/src/creatore/libretto'
import { mancano, passoDaBozza } from '../../regole/src/creatore/guida'
import { combattenteDiPg, idPg, librettoDi, notaDaRisorse, risorseDaNota, scriviPg } from '../../plugin/pg'
import { conHomebrew, type NoteHomebrew } from '../../plugin/homebrew'
import { assert, baseDiProva, creaDiProva, livelloDiProva } from './pg_di_prova'

const cat = JSON.parse(readFileSync(resolve(process.argv[2] ?? 'data/srd_catalogo.json'), 'utf8')) as Catalogo
const id = (x: { id: string }) => x.id
const base = (classeId: string, bgId: string) => baseDiProva(cat, classeId, bgId)
const livello = (lib: Libretto, classeId = '') => livelloDiProva(cat, lib, classeId)
const crea = (classeId: string, bgId: string, finoA: number) => creaDiProva(cat, classeId, bgId, finoA)

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
// Recuperare le Energie torna (una) col riposo breve: la scheda la segna «breve».
assert(risorsa.ric === 'breve', `ricarica di ${risorsa.label}: ${risorsa.ric}`)
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

// 6. L'HOMEBREW del vault: tradotto nel catalogo del kernel, si crea e sale come l'SRD.
const note: NoteHomebrew = {
  classe: [{ nome: 'Lama del Vento', fm: {
    dado_vita: 'd8', ts_competenze: 'Destrezza e Saggezza', car_primaria: 'Destrezza, Saggezza', tipo_incantatore: 'pieno',
    competenze_armi: 'Armi semplici', competenze_armature: 'Armature leggere', abilita_numero: 2, livello_sottoclasse: 3,
    privilegi: [{ livello: 1, nome: 'Passo del Vento', concede: { caratteristica: { destrezza: 1 } } }],
  } }],
  specie: [{ nome: 'Silfide', fm: { taglia: 'Media', velocita: '10,5 m', tratti: 'Leggiadria; scurovisione' } }],
  background: [{ nome: 'Esiliato', fm: { car_background: 'Destrezza, Saggezza, Costituzione', abilita_background: 'Furtività, Sopravvivenza', talento_origine: 'Allerta' } }],
  talento: [{ nome: 'Passo Leggero', fm: { tipo: 'generale', concede: { abilita: ['Acrobazia'] } } }],
  sottoclasse: [{ nome: 'Via della Tempesta', fm: { classe: '[[Lama del Vento]]' } }],
  incantesimo: [
    { nome: 'Brezza', fm: { livello: 0, classi: 'Lama del Vento' } },
    { nome: 'Raffica', fm: { livello: 1, classi: ['Lama del Vento'] } },
  ],
}
const nSrd = cat.classi.length
const hb = conHomebrew(cat, note)
assert(hb.classi.length === nSrd + 1 && hb.background.find((b) => b.id === 'homebrew.background.esiliato')?.talento_origine === 'dnd.talento.allerta',
  'homebrew: classe aggiunta, talento d\'origine risolto per nome')
// Il creatore sul catalogo con l'homebrew: le stesse funzioni, il catalogo arricchito
// (le sezioni precedenti hanno già girato sull'SRD puro).
Object.assign(cat, hb)
{
  const base0 = base('homebrew.classe.lama-del-vento', 'homebrew.background.esiliato')
  base0.specieId = 'homebrew.specie.silfide'
  const vuoto: Libretto = { base: base0, passi: [] }
  const b1 = livello(vuoto)
  assert(mancano(cat, vuoto, b1).length === 0, `homebrew liv 1: manca ${mancano(cat, vuoto, b1).join(', ')}`)
  let lib = librettoIniziale(base0, passoDaBozza(cat, vuoto, b1))
  while (lib.passi.length < 3) lib = aggiungiLivello(lib, passoDaBozza(cat, lib, livello(lib)))
  // Al 4º, il talento homebrew al posto dell'aumento.
  const b4 = { ...livello(lib), talentoId: 'homebrew.talento.passo-leggero', bonusAsi: {} }
  assert(mancano(cat, lib, b4).length === 0, `homebrew liv 4: manca ${mancano(cat, lib, b4).join(', ')}`)
  lib = aggiungiLivello(lib, passoDaBozza(cat, lib, b4))
  const fm: Record<string, any> = {}
  scriviPg(fm, lib, cat, true)
  assert(fm.destrezza === 14 + 2 + 1, `homebrew: Destrezza 14 + background 2 + Passo del Vento 1 (${fm.destrezza})`)
  assert(fm.scurovisione === 18 && fm.prof_acrobazia === 1 && fm.prof_furtivita === 1, 'homebrew: scurovisione, Acrobazia dal talento, Furtività dal background')
  assert(lib.passi[2].sottoclasseId === 'homebrew.sottoclasse.via-della-tempesta', 'homebrew: la sottoclasse legata per link si sceglie al 3º')
  assert((fm.trucchetti ?? []).includes('homebrew.incantesimo.brezza') && fm.slot_1 > 0, 'homebrew: incantatore pieno con gli incantesimi della sua classe')
  console.log(`✓ homebrew: Lama del Vento 4, Des ${fm.destrezza}, slot ${fm.slot_1}/${fm.slot_2}, sottoclasse e talento del vault`)
}
