<% await tp.user.crea_mondo(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|mondo] 🌍 Mondo
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Genere** | `INPUT[genere][:genere]` |
> | **Temi** | `INPUT[temi][:temi]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(mondo)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Mondo
> **Cos'è** · Il mondo è il contenitore-radice della campagna: ne fissa genere, tono e conflitto, e da qui agganci tutti i componenti (regni, culture, cosmologia…).
> **Campi chiave** · **Genere** e **Temi** danno il sapore; sul Carattere imposta **Tono** e **Diffusione della magia** — definiscono atmosfera e quanto conta l'arcano.
> **Spunti** · Qual è la tensione centrale che muove tutto? (chi vuole cosa, e perché proprio ora) Cosa rende questo mondo diverso da una terra qualunque? Genere e tono in una frase (dark fantasy di frontiera, eroico, weird…).

````tabs
--- 📖 Lore


> [!note]- Premessa
> L'idea in una frase: il pitch del mondo, cosa lo rende unico, che storie ci si giocano.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

%%prosa%%
## Conflitto centrale
> [!question]- 💡 Conflitto centrale della campagna

> [!rivela|segreto]- Verità nascosta
> 💡 *La verità nascosta del mondo*
>

%%/prosa%%

--- 🧩 Componenti

> [!tip] Un mondo è fatto dei suoi pezzi — costruiscili qui
> Non descrivere la geografia/i popoli/la magia a parole: **creali come componenti veri**.
> Nel wizard scegli **questo mondo** e si agganciano da soli al grafo.
>
> **Cosmo & sacro**: `BUTTON[crea-cosmologia]` `BUTTON[crea-sistema_magico]` `BUTTON[crea-divinita]`
>
> **Geografia & poteri**: `BUTTON[crea-regno]` `BUTTON[crea-luogo]` `BUTTON[crea-fazione]`
>
> **Popoli & tempo**: `BUTTON[crea-cultura]` `BUTTON[crea-specie]` `BUTTON[crea-epoca]`

**I componenti di questo mondo** *(si popolano man mano che li crei)*
```dataview
table rows.file.link as "Voci"
from "Mondi"
where mondo = this.file.link
group by categoria as "Tipo"
```

--- 🗺 Mappa

> [!info] Mappa
> **1.** Pesca l'**immagine**: `INPUT[mappa][:mappa]` — compare interattiva qui sotto (zoom/pan, righello distanze→tempi).
> **2.** Aggiungi i **segnaposto** con *Shift+clic* e linkali ai `[[Luoghi]]` (restano salvati accanto all'immagine).
>
> *Quale formato? **SVG** (Watabou/Azgaar) = resta nitido a ogni zoom **e** crea i pin dai nomi sulla carta. **PNG/JPG** = solo l'immagine, pin a mano (nessun nome da leggere). Con **Azgaar** i pin arrivano dal Full JSON, qualunque sia l'immagine.*

> [!tip]- 📥 Importa da un generatore — crea Luoghi e pin da solo
> Esporta dal generatore, trascina in `Media/`, poi:
> - **Watabou** (Realm/Perilous Shores, City, Village → **SVG**): `BUTTON[importa-mappa]` — imposta mappa+origine e crea un `[[Luogo]]` per ogni toponimo, coi segnaposto.
> - **Azgaar** (Export → **Full JSON**): `BUTTON[importa-azgaar]` — import PROFONDO: `[[Cultura]]`/`[[Culto]]`/`[[Regno]]`/`[[Luogo]]` (burgs+marker) collegati + pin a coordinate. *Controlla la posizione dei pin dopo.*
> - **One Page Dungeon** → esporta in **Markdown** e incollalo nel corpo di un `[[Luogo]]`-dungeon; usa l'SVG/PNG come sua mappa.

> [!tip]- 🧭 Pin a mano, disegno e hexcrawl
> - **Immagine caricata da te:** piazza i pin (*Shift+clic*), linkali ai `[[Luoghi]]`, poi `BUTTON[sincronizza-pin]` riscrive le **coordinate** delle note dai pin → distanze in linea d'aria e *Dintorni* si calcolano da sé.
> - **Disegna tu:** `BUTTON[disegna-mappa]` (Excalidraw → `![[nome]]`) · `BUTTON[inserisci-mappa]` (blocco avanzato con livelli/overlay).
> - **Hexcrawl giocabile:** apri **Hexmap World Creator** (griglia esagonale, contenuti per esagono, tiri incontri). Le cartelle sono già puntate alle tue note (Towns/Dungeons→`Mondi/Luoghi`, Factions→`Mondi/Fazioni`, Quests→`Mondi/Missioni`, Regions→`Mondi/Regni`). *Al 1° avvio del suo wizard scegli «Don't show again».*
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMap");
```

> [!tip] World Board — il mondo a colpo d'occhio
> Genera un **Canvas** di questo mondo: una card per ogni nota, una linea per ogni relazione tipizzata. Vista visiva alternativa alla *Rete del mondo*. `BUTTON[world-board]`
> Ripremi per **aggiornarlo** dopo aver creato note o collegamenti.

> [!info] Scala e viaggio
> Scala mappa (km per unità): `INPUT[number:scala_mappa]` — km per unità di coordinata. Imposta i `coord` sui **Luoghi**: la tab *Dintorni* mostrerà le distanze in linea d'aria in km.
>
> Passo di viaggio (km/giorno): `INPUT[number:passo_viaggio]` — km al giorno a piedi (default 30): la tab *Viaggio* dei luoghi stima i tempi.
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Cosmologia**: `INPUT[suggester(optionQuery("Mondi/Cosmologia"), useLinks(partial), allowOther):cosmologia]`
> **Sistemi magici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Regni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regni]`
> **Culture**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

> [!example] Collegamenti
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
````

> [!tip] ＋ Componenti
> Aggiungi ciò che ti serve, quando ti serve — **Al tavolo**, **Clock del fronte**, **Carattere**, **Cronologia**, **Vista**…
> `BUTTON[aggiungi-componente]`
>
> `BUTTON[marca-canonico]` · `BUTTON[archivia-nota]`
