# Opportunità dai plugin (sweep doc ufficiale)

Backlog derivato dal confronto fra la doc **ufficiale** di ogni plugin e il nostro uso
reale (sweep). I dettagli verificati e la sintassi esatta di ogni voce stanno nel
rispettivo [`Dev/Reference/<plugin>.md`](../Dev/Reference/). Qui solo la lista degli
interventi **possibili** — materiale utile non ancora sfruttato — con valore/effort/blocco,
da cui scegliere. **Non è codice.**

## Stato della QA in-app
Diversi candidati cambiano comportamento **runtime** (Meta Bind / plugin GDR / Bases): la
generazione è deterministica e testata, ma il **rendering reale dei plugin** va verificato
aprendo Obsidian. Le voci marcate 🔬 dipendono da quella verifica prima di poter essere
spedite con fiducia.

## Già fatto (questo ciclo)
- **Reattività live radar/infobox** (ex candidato #1): risolta dal **plugin GDR** — i blocchi
  ```gdr si ridisegnano su `metadataCache 'changed'` (niente più bisogno di un ponte Meta
  Bind↔JS Engine; js-engine ritirato).
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
| 2 | Galleria `cards` con copertina (Bestiario/Cast/Atlante) | Bases | Alto | Basso\* | 🔬 key immagine da confermare + servono ritratti in `Media/` | [bases](../Dev/Reference/bases.md) |
| 3 | Modale **multi-select** nativa per "collega più note" nei wizard | plugin GDR | Medio | Basso-medio | 🔬 UX in-app (SuggestModal multi) | — |
| 4 | `fc-img`/`fc-category` nel wizard evento (colore+immagine in agenda) | Calendarium | Medio | Basso | 🔬 resa agenda | [calendarium](../Dev/Reference/calendarium.md) |
| 5 | `extends` fileClass-base condiviso (meno duplicazione in `z.classi/`) | Metadata Menu | Medio | Medio | — | [metadata-menu](../Dev/Reference/metadata-menu.md) |
| 6 | Indici Bases più ricchi: `groupBy`/`summaries`/`formulas`/filtri `or-not` | Bases | Medio | Basso-medio | 🔬 | [bases](../Dev/Reference/bases.md) |
| 7 | Tasks `filter by function`/`happens` (prep legata all'ontologia) | Tasks | Medio | Basso | 🔬 | [tasks](../Dev/Reference/tasks.md) |
| 9 | `updateMetadata` per i bottoni di solo-reset | Meta Bind | Basso | Basso | i flussi JS funzionano e sono testati (ROI basso) | [meta-bind](../Dev/Reference/meta-bind.md) |
| 10 | `excludeFolders` (no folder-note fantasma su `z.*`/`Media`/`SRD`) | Folder Notes | Basso | Medio (oggetti con UUID, fragili) | — | [folder-notes](../Dev/Reference/folder-notes.md) |
| 11 | `kind: Base` / `separateMobile` (landing su `.base` / home mobile) | Homepage | Basso | Basso | — | [homepage](../Dev/Reference/homepage.md) |
| 12 | Frozen version per i plugin di nicchia (distribuzione testata) | BRAT | Medio | — (processo utente) | — | [brat](../Dev/Reference/brat.md) |

\* basso una volta confermata in-app la sintassi della key immagine dei `cards`.

## Note
- **Iconize → Iconic** (FATTO): Iconize deprecato (2025); sostituito da *Iconic* (mantenuto)
  in `plugins.yaml`. La pipeline non inietta più config icone-cartella (formato Iconic non
  documentato); le emoji per categoria restano nei titoli di folder-note/hub (`folder_icons`).
- Tre sintassi restano **da confermare in-app** (non spedibili come syntax finché non viste
  in Obsidian): la key immagine dei `cards` di Bases, il fence per embeddare un `.base` in
  nota, il `dvQueryString` del `Lookup` di Metadata Menu.
