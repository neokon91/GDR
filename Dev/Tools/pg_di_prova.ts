/**
 * Un PG DI PROVA costruito come lo costruirebbe il creatore (`plugin/creatore.ts`): le domande
 * le fa la guida del kernel, le risposte sono le prime opzioni offerte. Lo usano gli smoke
 * headless (`smoke_pg.ts`, `smoke_board.ts`).
 */
import type { Catalogo } from '../../regole/src/creatore/catalogo'
import { elencoSottoclassiPerClasse, fonteBackground, fonteClasse } from '../../regole/src/creatore/catalogo'
import { ABILITA } from '../../regole/src/creatore/risolutore'
import { type Base, type Libretto, aggiungiLivello, librettoIniziale } from '../../regole/src/creatore/libretto'
import {
  type Bozza, abilitaCompetenti, abilitaMulticlasse, anteprimaLivello, bozzaVuota, classeDelPasso,
  mancano, opzioniIncantesimi, opzioniParametro, opzioniSceltaClasse, passoDaBozza, talentoOrigine,
} from '../../regole/src/creatore/guida'

export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`✗ ${msg}`)
}
const primi = <T>(xs: T[], n: number) => xs.slice(0, n)
const id = (x: { id: string }) => x.id

/** La base come la compilerebbe il creatore, con le prime opzioni. */
export function baseDiProva(cat: Catalogo, classeId: string, bgId: string): Base {
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
export function livelloDiProva(cat: Catalogo, lib: Libretto, classeId = ''): Bozza {
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

/** Un libretto creato e fatto salire fino a `finoA`, senza mancanze (o la prova fallisce). */
export function creaDiProva(cat: Catalogo, classeId: string, bgId: string, finoA: number): Libretto {
  const b = baseDiProva(cat, classeId, bgId)
  const vuoto: Libretto = { base: b, passi: [] }
  const primo = livelloDiProva(cat, vuoto)
  assert(mancano(cat, vuoto, primo).length === 0, `${classeId} liv 1: manca ${mancano(cat, vuoto, primo).join(', ')}`)
  let lib = librettoIniziale(b, passoDaBozza(cat, vuoto, primo))
  while (lib.passi.length < finoA) {
    const bz = livelloDiProva(cat, lib)
    assert(mancano(cat, lib, bz).length === 0, `${classeId} liv ${lib.passi.length + 1}: manca ${mancano(cat, lib, bz).join(', ')}`)
    lib = aggiungiLivello(lib, passoDaBozza(cat, lib, bz))
  }
  return lib
}
