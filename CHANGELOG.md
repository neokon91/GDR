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
- **Auto-link incrociato delle schede SRD**: dove una scheda cita un'altra entità nella
  prosa (un incantesimo nomina una condizione, un mostro ne lancia un altro…), il nome
  diventa un `[[link]]` navigabile — condizioni declinate o/a/i/e, incantesimi, specie/
  classi/background/talenti, mostri, e **dentro gli statblock**. Conservativo (prima
  occorrenza, omonimi/self esclusi, termini comuni in stop-list): ~1270 link, zero falsi positivi.
- **Creazione PG più completa**: step opzionale «Mondo di appartenenza» (collega il PG al
  worldbuilding); tratti-scelta dell'Umano 2024 (*Versatile* = talento d'origine, *Skillful*
  = abilità, dedotti dal SRD); le **maestrie d'arma** scelte compaiono nel pannello Sistema.
- **Mondo-esempio *Astaria* vivo e giocabile**: ogni pin della mappa regionale porta a un
  luogo con lore; **mappa-città di Aster** (drill-down) con pin curato; **PG collegato**
  (Korbin Salmastro, RAW-completo) e **incontro** «Guardiani della Terza Porta» alla Ziggurat
  (budget 2024 + creature SRD). La demo copre entrambe le suite: worldbuilding e tavolo.
- **Pipeline asset del sito**: le immagini referenziate (mappe da `![[..]]`, ritratti
  da frontmatter) vengono copiate in `dist/GDR-site/media/` e rese come `<img>`.
- **`npm run dist`**: crea gli artefatti di release versionati in `dist/` — il vault
  Obsidian pronto all'uso (plugin inclusi) e il sito dei giocatori, zippati.
- **`THIRD-PARTY-LICENSES.md`** auto-generato (da `plugins.yaml`) e incluso nel vault:
  attribuzione di tutti i 18 plugin bundlati (autore/licenza/repo). Licenze verificate
  — tutte redistribuibili (12 MIT, 3 GPL-3.0, 3 AGPL-3.0), incluse come mera aggregazione.

### Corretto
- **Selettore immagini vuoto**: `imageSuggester()` senza `optionQuery` non interrogava
  nessuna cartella → il picker non mostrava NIENTE (sembrava «non trova le immagini / niente
  SVG»). Ora `optionQuery("")` lista ogni immagine del vault, **SVG inclusi**.
- **`placeholder` rompeva Meta Bind** (`MB_PARSINOM`): l'apostrofo dritto `'` (es. «l'URL»)
  spezzava il parser argomenti → testo con apostrofo tipografico `'`, e `validate` ora vieta
  gli apici dritti `'` `"`.
- **ASI/Dono epico del 19° mancante per TUTTE le 12 classi**: la regex che deriva i livelli
  di Aumento dei punteggi non intercettava il privilegio «Dono epico» → ora sì (extra di
  classe intatti: Ladro 10°, Guerriero 6/14).
- **Nomi-file luoghi/PG con spazi** come le fazioni (niente più underscore): link dei marker
  e suffisso di disambiguazione PG («Nome 2») allineati.
- **Parser toponimi mappe**: soglia di grouping `1.6→2.5` font → meno frammentazione delle
  label curve nelle piante-città. Competenza-strumento duplicata (classe+background) dedotta;
  campi-lista resi «a, b» nel sito (non col `repr` Python); schema marker dei pin allineato
  al plugin zoom-map.

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
- Mondo-esempio *Astaria* (seme `seed-example`) + nota «Inizia da qui», on-ramp Home, LEGGIMI,
  sito dei giocatori statico spoiler-free.

### Solidità
- Suite di test (snapshot + e2e/headless JS + rules-engine), validazione del contratto
  YAML↔wizard, anti-drift byte-equal, merge `.obsidian` non distruttivo.
