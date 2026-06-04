# Changelog

Tutte le modifiche degne di nota. Formato ispirato a [Keep a Changelog](https://keepachangelog.com/it/);
versioni [SemVer](https://semver.org/lang/it/). Le date sono `AAAA-MM-GG`.

## [Non rilasciato]

### Aggiunto
- **Condivisione v2 — rivelazione progressiva** del sito dei giocatori: campo
  `rivelazione` (`pubblico` < `incontrato` < `segreto`), ortogonale a `visibilita`
  (il «mai»). Il build sceglie il livello — `npm run site -- --reveal <tier>` — e
  include una nota se il suo tier ≤ livello: il portale si svela per gradi.
- **Rivelazione per-sezione**: callout `> [!rivela|<tier>]` (player-facing, gated dal
  build) → una nota pubblica può celare una verità che emerge a un livello più alto.
- **Dashboard «Occhi del giocatore»**: anteprima in-vault di cosa vedono i giocatori
  per tier, senza dover generare il sito.
- **Mondo-esempio più ricco**: mappa SVG («Mercato di Sale»), radar del *Carattere*
  delle fazioni (assi tematici), e tier di rivelazione (La Voragine, Vorth, Forte Cenere).
- **Pipeline asset del sito**: le immagini referenziate (mappe da `![[..]]`, ritratti
  da frontmatter) vengono copiate in `dist/GDR-site/media/` e rese come `<img>`.
- **`npm run dist`**: crea gli artefatti di release versionati in `dist/` — il vault
  Obsidian pronto all'uso (plugin inclusi) e il sito dei giocatori, zippati.
- **`THIRD-PARTY-LICENSES.md`** auto-generato (da `plugins.yaml`) e incluso nel vault:
  attribuzione di tutti i 18 plugin bundlati (autore/licenza/repo). Licenze verificate
  — tutte redistribuibili (12 MIT, 3 GPL-3.0, 3 AGPL-3.0), incluse come mera aggregazione.

## [0.1.0]

Prima base completa (beta chiuso). Pipeline sorgenti `YAML/Jinja/JS` → `render.py` →
vault Obsidian + sito dei giocatori opzionale.

### Worldbuilding
- 36+ categorie con classificazione `famiglia`+`tipo`, relazioni tipizzate con inversi
  auto-derivati, assi tematici 1-5 (radar/archetipi/coerenza), economia/risorse,
  geografia (coord/confini/distanza/viaggio), timeline causale, cronologia per-entità,
  alberi evolutivi, Fronti reattivi al grafo (econ/geo e cosmico) + cruscotto Stato del Mondo.

### Sistema D&D 5.5e (2024)
- PG SRD-completo 1→20 (level-up), statblock 5.5e (+5e), loop di sessione (Esaurimento,
  Dadi Vita, riposi, concentrazione), incantesimi/condizioni/maestrie, encounter budget
  2024 + alleati, ponte homebrew→motore (incl. classe/sottoclasse), scaffolder GS→statblock.

### Onboarding & condivisione
- Mondo-esempio *Valdombra* + nota «Inizia da qui», on-ramp Home, LEGGIMI,
  sito dei giocatori statico spoiler-free.

### Solidità
- Suite di test (snapshot + e2e/headless JS + rules-engine), validazione del contratto
  YAML↔wizard, anti-drift byte-equal, merge `.obsidian` non distruttivo.
