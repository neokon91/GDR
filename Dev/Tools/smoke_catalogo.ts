/**
 * SMOKE TEST del catalogo del creatore (Tier 3 Fase B) — headless.
 *
 * Prova che `plugin/data/srd_catalogo.json` (generato da `gen_catalogo.py`) è un `Catalogo`
 * valido che guida il kernel condiviso: costruisce un PG di esempio, chiama `caricaFonti` +
 * `assembla` (gli STESSI di `regole` che userà il plugin) e verifica l'`Attore` risultante.
 * Se la forma del catalogo è sbagliata, `caricaFonti`/`assembla` sollevano e il test fallisce.
 *
 * Uso: node esbuild.config.mjs non serve — si bundla e gira via `npm run smoke:catalogo`
 * (vedi package.json del plugin). Nessun runtime Obsidian: è puro motore.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { caricaFonti, type Catalogo } from '../../regole/src/creatore/catalogo'
import { assembla } from '../../regole/src/creatore/motore'
import type { Personaggio } from '../../regole/src/creatore/personaggio'
import { personaggioAFrontmatter, attoreDaPgGdr } from '../../plugin/adapters'

// Il catalogo: da argv[2], altrimenti `plugin/data/srd_catalogo.json` relativo al cwd
// (lo script gira dalla cartella `plugin/` via `npm run smoke:catalogo`).
const JSON_PATH = resolve(process.argv[2] ?? 'data/srd_catalogo.json')

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`✗ ${msg}`)
}

const cat = JSON.parse(readFileSync(JSON_PATH, 'utf8')) as Catalogo

// Invarianti strutturali minime del catalogo.
assert(cat.classi.length >= 12, `attese ≥12 classi, trovate ${cat.classi.length}`)
assert(cat.specie.length >= 6, `attese ≥6 specie, trovate ${cat.specie.length}`)
assert(cat.background.length >= 4, `attesi ≥4 background, trovati ${cat.background.length}`)
assert(cat.sottoclassi.length >= 6, `attese ≥6 sottoclassi, trovate ${cat.sottoclassi.length}`)
const barbaro = cat.classi.find((c) => c.id === 'dnd.classe.barbaro')
assert(barbaro, `manca dnd.classe.barbaro nel catalogo`)
assert(barbaro!.dado_vita === 12, `dado vita barbaro atteso 12, trovato ${barbaro!.dado_vita}`)

// Un PG di esempio: Barbaro 3 (Cammino del Berserker), Umano, Soldato.
const pg: Personaggio = {
  nome: 'Grok il Provino',
  livello: 3,
  caratteristiche_base: { forza: 16, destrezza: 14, costituzione: 15, intelligenza: 8, saggezza: 12, carisma: 10 },
  specieId: 'dnd.specie.umano',
  classeId: 'dnd.classe.barbaro',
  sottoclasseId: 'cammino-del-berserker',
  backgroundId: 'dnd.background.soldato',
  bonus_background: { forza: 2, costituzione: 1 },
  abilita_classe: ['atletica'],
  talenti: [],
}

const fonti = caricaFonti(cat, pg)
const attore = assembla(pg, fonti)

// L'Attore risultante deve reggere le invarianti base del PG.
assert(attore.nome === pg.nome, `nome non propagato: ${attore.nome}`)
assert(attore.livello === 3, `livello atteso 3, trovato ${attore.livello}`)
assert(attore.caratteristiche.forza.valore === 18, `forza attesa 18 (16+2 bg), trovata ${attore.caratteristiche.forza.valore}`)
assert(attore.bonus_competenza === 2, `PB atteso 2 al liv 3, trovato ${attore.bonus_competenza}`)
assert(attore.punti_ferita.massimi > 0, `PF massimi non calcolati: ${attore.punti_ferita.massimi}`)
assert(attore.ca.valore > 0, `CA non calcolata: ${attore.ca.valore}`)

// --- Round-trip Fase C: Attore → frontmatter PG → Attore ---------------------
// Il ponte `personaggioAFrontmatter` deve produrre una nota che il reader del combattimento
// (`attoreDaPgGdr`) rilegge negli STESSI numeri: è la garanzia che la creazione col kernel non
// cambia la forma-nota del vault.
const fm = personaggioAFrontmatter(attore)
assert(fm.categoria === 'personaggio' && fm.tipo === 'pg', `frontmatter non marcato come PG`)
const ri = attoreDaPgGdr(fm)
for (const c of ['forza', 'destrezza', 'costituzione', 'intelligenza', 'saggezza', 'carisma'] as const) {
  assert(ri.caratteristiche[c].valore === attore.caratteristiche[c].valore,
    `round-trip ${c}: ${ri.caratteristiche[c].valore} ≠ ${attore.caratteristiche[c].valore}`)
  const tsAtteso = attore.caratteristiche[c].competenza ? 1 : 0
  assert(ri.caratteristiche[c].competenza === tsAtteso, `round-trip TS ${c}: flag non conservato`)
}
assert(ri.ca.valore === attore.ca.valore, `round-trip CA: ${ri.ca.valore} ≠ ${attore.ca.valore}`)
assert(ri.punti_ferita.massimi === attore.punti_ferita.massimi, `round-trip PF: ${ri.punti_ferita.massimi} ≠ ${attore.punti_ferita.massimi}`)
assert(ri.bonus_competenza === attore.bonus_competenza, `round-trip PB: ${ri.bonus_competenza} ≠ ${attore.bonus_competenza}`)
const skillAttese = Object.entries(attore.competenza_abilita ?? {}).filter(([, g]) => g > 0).map(([id]) => id).sort()
const skillRi = Object.keys(ri.competenza_abilita ?? {}).sort()
assert(JSON.stringify(skillAttese) === JSON.stringify(skillRi), `round-trip abilità: ${skillRi} ≠ ${skillAttese}`)

console.log('✓ round-trip Attore→frontmatter→Attore OK — nota PG coerente col reader del combattimento')
console.log('✓ smoke catalogo OK —', JSON.stringify({
  classi: cat.classi.length, specie: cat.specie.length, background: cat.background.length,
  sottoclassi: cat.sottoclassi.length, talenti: cat.talenti.length, lingue: cat.lingue.length,
  incantesimi: cat.incantesimi.length, oggetti: cat.oggetti.length,
}))
console.log('  Attore:', JSON.stringify({
  nome: attore.nome, livello: attore.livello, forza: attore.caratteristiche.forza.valore,
  pf: attore.punti_ferita.massimi, ca: attore.ca.valore, pb: attore.bonus_competenza,
  sottoclasse: attore.sottoclasse, privilegi: attore.privilegi?.length ?? 0,
}))
