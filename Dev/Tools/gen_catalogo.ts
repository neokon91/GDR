/**
 * Il CATALOGO del creatore (`plugin/data/srd_catalogo.json`) dalla copia vendorizzata dell'SRD.
 *
 * Il costruttore è quello del kernel (`regole/src/creatore/costruisci.ts`, `catalogoDa`): lo
 * stesso che il Compendio usa sulle sue collezioni. Qui si leggono i file (`leggiNota` del
 * kernel: `.yaml` e `.md`, un lettore solo) e si smistano per il TIPO dell'id puntato
 * (`dnd.<tipo>.<slug>`), mai per nome-file. Sostituisce `gen_catalogo.py`, che aveva un
 * costruttore suo e divergeva (talenti scritti come nota persi, niente varianti né parametri
 * dei talenti, lingue con id puntati).
 *
 * Uso (dalla cartella `plugin/`): `npm run gen:catalogo` — bundla con esbuild e gira con node.
 * Argomenti facoltativi: [cartella SRD] [file d'uscita].
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { leggiNota } from '../../regole/src/lib/frontmatter'
import { catalogoDa, type Raccolte } from '../../regole/src/creatore/costruisci'

const SRD = resolve(process.argv[2] ?? '../Dev/Source/SRD')
const OUT = resolve(process.argv[3] ?? 'data/srd_catalogo.json')

// I tipi degli oggetti che l'equipaggiamento può citare, con la SEZIONE come la chiama il
// Compendio (`sezioneOggetto`): la guida offre gli strumenti per sezione. Veicoli e valute
// non hanno sezione (il Compendio non dà loro una scheda), ma un'opzione iniziale li nomina.
const SEZIONE_DEL_TIPO: Record<string, string | null> = {
  oggetto: 'oggetti', arma: 'armi', armatura: 'armature', strumento: 'strumenti',
  cavalcatura: 'cavalcature', 'oggetto-magico': 'oggetti-magici', veicolo: null, valuta: null,
}

function file(dir: string, out: string[] = []): string[] {
  for (const v of readdirSync(dir).sort()) {
    const p = join(dir, v)
    if (statSync(p).isDirectory()) file(p, out)
    else if (/\.(ya?ml|md)$/.test(v) && !/^readme\.md$/i.test(v)) out.push(p)
  }
  return out
}

const per: Record<string, unknown[]> = {}
for (const p of file(SRD)) {
  const nota = leggiNota(readFileSync(p, 'utf8'))
  if (!nota) throw new Error(`${p}: YAML illeggibile (una voce che sparirebbe in silenzio)`)
  const tipo = /^dnd\.([a-z-]+)\./.exec(String(nota.dati.id ?? ''))?.[1]
  if (tipo) (per[tipo] ??= []).push(nota.dati)
}

const raccolte: Raccolte = {
  classi: per.classe ?? [],
  specie: per.specie ?? [],
  background: per.background ?? [],
  sottoclassi: per.sottoclasse ?? [],
  talenti: per.talento ?? [],
  lingue: per.lingua ?? [],
  incantesimi: per.incantesimo ?? [],
  oggetti: Object.entries(SEZIONE_DEL_TIPO).flatMap(([t, sezione]) =>
    (per[t] ?? []).map((dato) => ({ dato, sezione, magico: t === 'oggetto-magico' })),
  ),
}

const cat = catalogoDa(raccolte)
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(cat))
const n = Object.fromEntries(Object.entries(cat).map(([k, v]) => [k, (v as unknown[]).length]))
console.log(`[ok] catalogo del kernel → ${OUT}`, n)
