# Audit accessibilità — Contrasto e leggibilità (dark + light)

Audit **solo-report** (nessun file sorgente modificato). Focus: contrasto testo/bordi
contro i fondi nei due temi del vault Obsidian (dark + light) e nel sito giocatori
(dark-only), più le collisioni di palette e gli SVG light-only.

## Metodo e assunzioni

- **Soglie WCAG 2.1**: testo normale **AA = 4.5:1**; testo grande / componenti UI e
  oggetti grafici (bordi, swatch, barre) **3:1**.
- **Palette di riferimento**: nessun tema custom né accento personalizzato è impostato
  (`dist/GDR-vault/.obsidian/appearance.json` abilita solo lo snippet `gdr`, nessun
  `accentColor`). I `--color-*` e i ruoli testo/fondo sono quindi quelli del **tema
  Default di Obsidian**. Valori usati per il calcolo:
  - Accenti (condivisi nei due temi): red `#e93147`, orange `#ec7500`, yellow `#e0ac00`,
    green `#08b94e`, cyan `#00bfbc`, blue `#086ddd`, purple `#7852ee`, pink `#d53984`;
    accento tema `hsl(254,80%,68%)`.
  - Dark: primary `#1e1e1e`, secondary `#161616`, border `#333`, text-normal `#dadada`,
    text-muted `#b3b3b3`, text-faint `#666`.
  - Light: primary `#ffffff`, secondary `#f2f3f5`, border `#e0e0e0`, text-normal
    `#222`, text-muted `#5c5c5c`, text-faint `#999`.
- Piccoli scostamenti tra versioni di Obsidian sono possibili; le conclusioni (giallo/
  ciano/verde falliscono su fondo chiaro, faint sotto soglia, ecc.) sono robuste allo scostamento.
- I `--color-*` sono variabili del tema, ma lo snippet `gdr.css` è di proprietà del progetto:
  ridefinirli/overriddarli **per-tema dentro lo snippet** è lecito e non tocca l'app.

---

## 1. Vault Obsidian — accento di categoria (tema-aware) — PROBLEMA MAGGIORE (light)

`Dev/Tools/render_config/presentation.py:229-252` mappa 8 gruppi categoria → 8 `--color-*`.
L'identità cromatica sta **solo nei bordi** (border-top 3px riga 156, border-bottom 2px
del titolo riga 163) perché il titolo è tenuto in `--text-normal` di proposito (righe 157-163).
In **light** metà degli accenti come bordo scende sotto 3:1 → l'identità di categoria sparisce.

| Accento (categorie) | file:riga | Light: ratio vs secondary `#f2f3f5` | Esito |
|---|---|---|---|
| yellow (incontro, scena, missione, tabella…) | presentation.py:239 | **1.88** | FAIL |
| cyan (epoca, evento, mito, profezia) | presentation.py:236 | **2.06** | FAIL |
| green (mondo, luogo, bioma, risorsa…) | presentation.py:230 | **2.35** | FAIL |
| orange (personaggio, creatura) | presentation.py:233 | **2.66** | FAIL |
| pink (cultura, lingua) | presentation.py:232 | 3.98 | ok |
| red (fazione, culto, esercito, calamità) | presentation.py:231 | 3.79 | ok |
| blue (regole/scheda 5e) | presentation.py:237 | 4.46 | ok |
| purple (cosmologia, magia, divinità) | presentation.py:234 | 4.46 | ok |

In **dark** tutti gli 8 passano il 3:1 (range 3.65–8.68), quindi il problema è **solo light**.

**Fix proposto** — override per-tema nello snippet (`.theme-light` blocco che ridefinisce
`--gdr-accent` con varianti più scure sulle 4 categorie deboli):

| Accento | valore attuale | proposto (light) | nuovo ratio vs `#f2f3f5` |
|---|---|---|---|
| yellow | `#e0ac00` | `#8a6a00` | 4.9 |
| cyan | `#00bfbc` | `#067a78` | 5.0 |
| orange | `#ec7500` | `#b35800` | 4.6 |
| green | `#08b94e` | `#0a7a34` | 5.2 |

(Le varianti scure alzano anche il border-top/border-bottom del titolo sopra 3:1; in dark
si mantengono i valori attuali che già passano.)

## 2. Vault — callout `tavolo` / `rivela` (bordo-sinistro colore)

`presentation.py:196-207`: `tavolo` usa border-left 4px `--color-red`, `rivela` usa
`--color-cyan`. Come oggetto UI la soglia è 3:1.

- `rivela` cyan su secondary — **light 2.06** (FAIL UI), dark 7.91 (ok). In light il filetto
  "rivelazione/segreto" è quasi invisibile.
- `tavolo` red su secondary — light 3.79 (ok), dark 4.30 (ok).

**Fix**: per `rivela` usare in light un ciano più scuro (`#067a78`, come sopra) → ~4.9, oppure
spostare `rivela` su `--color-blue` (light 4.46). `tavolo` va lasciato.

## 3. Vault — etichette con `--text-faint` sotto soglia (entrambi i temi)

`--text-faint` non raggiunge AA su nessun fondo. È usato per etichette *informative*
(non decorative), quindi andrebbe letto:

| Uso | file:riga | Dark | Light |
|---|---|---|---|
| `.gdr-tl-count` ("N voci" nella timeline) | presentation.py:84 | 2.90 FAIL | 2.85 FAIL |
| `.gdr-sl-axis` (tacche asse swimlane) | presentation.py:89 | 2.90 FAIL | 2.85 FAIL |
| legenda radar via `text-muted` | presentation.py:56 | 7.95 ok | 6.69 ok |

**Fix**: sostituire `var(--text-faint)` → `var(--text-muted)` in quelle due righe
(muted passa AA in entrambi i temi: 7.95 dark / 6.69 light). Evita di overriddare la
variabile globale del tema. In alternativa, override `--text-faint` a `#8a8a8a`
(dark → 4.83) / `#767676` (light → 4.54), ma è più invasivo.

## 4. Pannelli SVG (`Dev/Source/JS/views`)

### 4a. Legenda radar: accento come TESTO fallisce in light
`00_helpers.js:121-123` (`RADAR_PALETTE`) e `:179` disegnano le etichette di serie con
`fill="${s.color}"` a `font-size:8` (testo piccolo → soglia 4.5). Su fondo `--background-primary`:

| Colore serie | Dark (vs #1e1e1e) | Light (vs #fff) |
|---|---|---|
| yellow | 7.99 ok | **2.09** FAIL |
| cyan | 7.29 ok | **2.29** FAIL |
| green | 6.40 ok | **2.61** FAIL |
| orange | 5.65 ok | **2.95** FAIL |
| accent | 4.36 (large) | 3.83 (large) |
| purple | 3.37 | 4.95 ok |
| blue | 3.37 | 4.95 ok |
| red | 3.97 | 4.20 |

La stessa palette è usata anche per il `fill-opacity:0.18` del poligono (`:176`, grafico, ok).

**Fix** (strutturale, copre entrambi i temi in un colpo): tenere lo swatch `■` colorato
ma rendere il **testo** dell'etichetta in `var(--text-normal)` (righe :179 e :169). Così la
codifica-colore resta nello swatch (oggetto grafico) e il nome resta sempre leggibile.
Se si vuole mantenere il testo colorato, servono varianti scure per light: yellow `#8a6a00`
(5.1), cyan `#067a78` (5.2), orange `#b35800` (4.9), green `#0a7a34` (5.5).

### 4b. Timeline / swimlane: bordo epoca colorato
`40_tempo.js:169`: `border-bottom-color` dei segmenti epoca su `--color-<palette>`
(green, blue, purple, cyan, orange, pink, red, yellow). Bordo 3px = oggetto UI (3:1).
Stessa distribuzione della §1: in **light** green/cyan/orange/yellow scendono a 1.9–2.7
(FAIL UI); in dark tutti ok. **Fix**: stesse varianti scure per-tema della §1.

### 4c. Statblock 2024 — pergamena light-only "abbagliante" in dark
`presentation.py:275-292`: skin opt-in con `--statblock-background-color:#fdf6ec`
(pergamena) e testo maroon `#58180d`. Internamente è ottimo (maroon su pergamena 12.6,
corpo 16.0), **ma è light-only**: nel vault in **dark** il blocco è un'isola chiara con
luminanza **15.5×** la pagina (`#1e1e1e`) → abbagliamento e rottura del tema.

**Fix**: skin tema-aware — dentro lo snippet aggiungere un blocco
`.theme-dark .statblock:has(.gdr-sb-2024) { … }` con pergamena scura. Valori proposti
(tutti ≥AA e senza glare, delta di luminanza ~1× vs pagina):
`--statblock-background-color:#241d15`, `--statblock-font-color:#ece0cf` (12.8),
heading/nome `#e08b6d` (6.4), barre/filetti `#c76a4d` (4.4), border `#5a4a33`.

### 4d. Clock combat (ok, per completezza)
`20_combat.js:11-12`: settori `--color-red` (pieni) vs `--background-modifier-border`
(vuoti), stroke `--background-primary`. Oggetti grafici, contrasto adeguato in entrambi i
temi; i fallback hardcoded (`#c94040`, `#d0d0d0`, `#fff`) intervengono solo fuori-Obsidian.
Nessun intervento.

## 5. Sito giocatori (`Dev/Source/SiteJinja/site.css`) — dark-only — CONFORME

Palette hardcoded coerente e ben contrastata; **nessuna combinazione sotto AA**:

| Coppia | ratio | Coppia | ratio |
|---|---|---|---|
| ink `#ece4d8` / bg `#14110f` | 14.9 | link `#e0a85a` / bg | 8.9 |
| ink / panel `#1d1916` | 13.9 | muted `#a99e8c` / bg | 7.1 |
| h1 `#fff` / bg | 18.8 | muted / panel | 6.6 |
| h2 accent `#c98a3b` / bg | 6.4 | code `#ece4d8` / `#000` | 16.7 |

Unico appunto minore, non-contrasto: `.foot` e `.index .reveal` a `0.8–0.9rem` in `muted`
(7.1) sono ok; nessun fix necessario. Essendo dark-only non c'è rischio light.

## 6. Collisioni di palette — Canvas / World Board

`presentation.py:329-330` (`_CANVAS_PRESET`): mappa gli 8 gruppi sui **6** colori del Canvas
Obsidian (1 rosso, 2 arancio, 3 giallo, 4 verde, 5 ciano, 6 viola). Due collisioni **esatte**:

- **pink → "6"** e **purple → "6"** : `cultura/lingua` e `cosmologia/magia/divinità`
  rendono con lo **stesso** colore Canvas (viola).
- **blue → "5"** e **cyan → "5"** : `regole/scheda 5e` e `epoca/evento/mito` rendono
  **identici** (ciano).

Nota: come *tinte* i colori sono ben distinti percettivamente (pink↔purple ΔE76 = 68,
blue↔cyan ΔE76 = 82), quindi nell'**infobox** (che usa gli 8 `--color-*` pieni) si
distinguono benissimo. Il problema è **solo sul Canvas**, dove 8 categorie collassano a 6
e 4 gruppi diventano 2 coppie indistinguibili.

**Fix**: il Canvas Obsidian offre 6 preset numerici + colori esadecimali liberi. Opzioni:
(a) accettare 6 famiglie sul Canvas ma **de-collidere le coppie** rimappando pink→"1"
(rosso, libero) e cyan→"2"… — richiede riconsiderare l'insieme; oppure (b) usare i
**colori hex** del Canvas (non i preset 1-6) così da rendere tutti e 8 i `--color-*`
fedelmente. Poiché `canvas_colors()` (righe 340-348) è single-source condivisa con il JS
`world_board`, il fix va fatto qui e vale per entrambi.

## 7. Distinguibilità accenti serie radar (minore)

`RADAR_PALETTE` (`00_helpers.js:121`) usa `--text-accent` come **prima** serie e poi
purple/blue come altre serie. L'accento tema default è viola (`hsl 254`): accent↔purple
ΔE76 = **19.4** (vicini), accent↔blue = 24.3. Con ≥4 serie contemporanee, la serie
"accent" e la serie "purple" possono confondersi. **Fix minore**: sostituire
`var(--text-accent)` con un colore più lontano (es. `--color-pink` o `--color-yellow`)
nella prima posizione della palette.

---

## Top 8 fix di contrasto

| # | Problema | file:riga | Tema | Ratio attuale | Fix proposto | Ratio risultante |
|---|---|---|---|---|---|---|
| 1 | Accento categoria yellow/cyan/green/orange **invisibile come bordo** (identità di categoria persa) | presentation.py:236-239 (via :156,:163) | Light | 1.88 / 2.06 / 2.35 / 2.66 | Override `.theme-light`: yellow `#8a6a00`, cyan `#067a78`, orange `#b35800`, green `#0a7a34` | 4.6–5.2 |
| 2 | Statblock 2024 pergamena **light-only, abbagliante** in dark | presentation.py:281-286 | Dark | glare 15.5× vs pagina | Skin `.theme-dark`: bg `#241d15`, testo `#ece0cf`, heading `#e08b6d` | 12.8 testo / 6.4 heading, glare ~1× |
| 3 | Legenda radar: **testo** accento (yellow/cyan/green/orange) sotto AA | 00_helpers.js:179 (palette :121-123) | Light | 2.09 / 2.29 / 2.61 / 2.95 | Testo etichetta in `var(--text-normal)`, swatch `■` resta colorato | ~12+ |
| 4 | Bordo epoca timeline stessi 4 accenti sotto 3:1 | 40_tempo.js:169 | Light | 1.88–2.95 | Stesse varianti scure per-tema del fix #1 | ≥3.8 |
| 5 | `--text-faint` su etichette informative (conteggi/tacche) sotto AA | presentation.py:84, :89 | Dark+Light | 2.90 / 2.85 | `var(--text-faint)` → `var(--text-muted)` | 7.95 / 6.69 |
| 6 | Canvas: **pink≡purple (preset 6)** e **blue≡cyan (preset 5)** identici | presentation.py:329-330 | (Canvas) | collisione esatta | Usare colori hex Canvas o rimappare le coppie su preset liberi | 8 categorie distinte |
| 7 | Callout `rivela` (cyan) bordo-sinistro quasi invisibile | presentation.py:206 | Light | 2.06 | Cyan scuro `#067a78` o passare a `--color-blue` | 4.9 / 4.46 |
| 8 | Serie radar "accent" ≈ "purple" (confondibili) | 00_helpers.js:121 | Dark+Light | ΔE76 19.4 | Prima serie su `--color-pink`/`--color-yellow` | ΔE76 ≥ 40 |

**Sintesi trasversale**: il difetto sistemico è che gli accenti chiari del tema Default
(yellow, cyan, green, orange) sono calibrati per fondo scuro e **cadono tutti insieme
sotto soglia in light** ovunque siano usati come testo o bordo (categorie infobox,
legende radar, bordi timeline, callout). Un unico override per-tema `.theme-light` sullo
snippet `gdr.css`, con le quattro varianti scure indicate, risolve i fix #1, #3, #4, #7 in
blocco. Il sito giocatori (dark-only) è già conforme.
