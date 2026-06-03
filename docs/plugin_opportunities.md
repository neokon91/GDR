# Opportunità dai plugin (sweep doc ufficiale)

Backlog derivato dal confronto fra la doc **ufficiale** di ogni plugin e il nostro uso
reale (sweep). I dettagli verificati e la sintassi esatta di ogni voce stanno nel
rispettivo [`Dev/Reference/<plugin>.md`](../Dev/Reference/). Qui solo la lista degli
interventi **possibili** — materiale utile non ancora sfruttato — con valore/effort/blocco,
da cui scegliere. **Non è codice.**

## Stato della QA in-app
Diversi candidati cambiano comportamento **runtime** (Meta Bind / JS Engine / Bases): la
generazione è deterministica e testata, ma il **rendering reale dei plugin** va verificato
aprendo Obsidian. Le voci marcate 🔬 dipendono da quella verifica prima di poter essere
spedite con fiducia.

## Già fatto (questo ciclo)
- **FIX**: zoom-map sintassi `image:` + nome plugin reale; Iconize deprecazione + gotcha
  falso corretto; callout `infobox` in tabella; repo IT → `javalent`; `tp.file.title` →
  `tp.config.target_file.basename`; Metadata Menu "proposta" → "implementata"; comando BRAT;
  firma `suggester`; versioni vendorizzate aggiunte.
- **Tab Panels `enableCaching`** — provato e **disattivato**: incompatibile con Meta Bind (il
  caching IndexedDB scatena `metadataCache.changed` con cache `undefined` → crash di
  `onCacheChanged` in Meta Bind/core, su ogni nota con tab + input Meta Bind). I link liberi nel
  corpo delle tab restano non-indicizzati; le relazioni tipizzate (frontmatter) sono indicizzate.

## Candidati (prioritizzati)

| # | Candidato | Plugin | Valore | Effort | Blocco | Reference |
|---|---|---|:-:|:-:|---|---|
| 1 | Reattività live radar/infobox via `engine.reactive` | JS Engine | Alto | Medio-alto | 🔬 serve un ponte evento Meta Bind↔JS Engine | [js-engine](../Dev/Reference/js-engine.md) |
| 2 | Galleria `cards` con copertina (Bestiario/Cast/Atlante) | Bases | Alto | Basso\* | 🔬 key immagine da confermare + servono ritratti in `Media/` | [bases](../Dev/Reference/bases.md) |
| 3 | `multi_suggester` per "collega più note" nei wizard | Templater | Medio | Basso-medio | 🔬 UX in-app | [templater](../Dev/Reference/templater.md) |
| 4 | `fc-img`/`fc-category` nel wizard evento (colore+immagine in agenda) | Calendarium | Medio | Basso | 🔬 resa agenda | [calendarium](../Dev/Reference/calendarium.md) |
| 5 | `extends` fileClass-base condiviso (meno duplicazione in `z.classi/`) | Metadata Menu | Medio | Medio | — | [metadata-menu](../Dev/Reference/metadata-menu.md) |
| 6 | Indici Bases più ricchi: `groupBy`/`summaries`/`formulas`/filtri `or-not` | Bases | Medio | Basso-medio | 🔬 | [bases](../Dev/Reference/bases.md) |
| 7 | Tasks `filter by function`/`happens` (prep legata all'ontologia) | Tasks | Medio | Basso | 🔬 | [tasks](../Dev/Reference/tasks.md) |
| 8 | Campi statblock extra (spells/lair/regional/mythic) + bottoni IT nel layout | Fantasy Statblocks | Medio | Medio | 🔬 | [fantasy-statblocks](../Dev/Reference/fantasy-statblocks.md) |
| 9 | `updateMetadata` per i bottoni di solo-reset | Meta Bind | Basso | Basso | i flussi JS funzionano e sono testati (ROI basso) | [meta-bind](../Dev/Reference/meta-bind.md) |
| 10 | `excludeFolders` (no folder-note fantasma su `z.*`/`Media`/`SRD`) | Folder Notes | Basso | Medio (oggetti con UUID, fragili) | — | [folder-notes](../Dev/Reference/folder-notes.md) |
| 11 | `kind: Base` / `separateMobile` (landing su `.base` / home mobile) | Homepage | Basso | Basso | — | [homepage](../Dev/Reference/homepage.md) |
| 12 | Frozen version per i plugin di nicchia (distribuzione testata) | BRAT | Medio | — (processo utente) | — | [brat](../Dev/Reference/brat.md) |

\* basso una volta confermata in-app la sintassi della key immagine dei `cards`.

## Note
- **Iconize è deprecato upstream**: prima di investire su icone inline/frontmatter,
  valutare la migrazione a un successore (es. *Iconic*).
- Tre sintassi restano **da confermare in-app** (non spedibili come syntax finché non viste
  in Obsidian): la key immagine dei `cards` di Bases, il fence per embeddare un `.base` in
  nota, il `dvQueryString` del `Lookup` di Metadata Menu.
