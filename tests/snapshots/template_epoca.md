<% await tp.user.crea_epoca(tp) %>
# `=this.nome`

> [!infobox|epoca] ⏳ Epoca
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Inizio** | `INPUT[text:inizio]` |
> | **Fine** | `INPUT[text:fine]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(era cosmica), option(era storica), option(era mitica), option(età), option(eone)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(fondativa), option(transizionale), option(stabilizzante), option(degenerativa), option(ciclica), option(apocrifa), option(liminale)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **fondativa** — Dà origine a strutture cosmiche fondamentali: leggi, piani, razze, civiltà, entità primordiali.
> **transizionale** — Periodo di passaggio, mutazione o riformulazione ontologica.
> **stabilizzante** — L'universo trova una forma durevole, ordinata o codificata.
> **degenerativa** — L'equilibrio si corrompe, le leggi si incrinano, le civiltà decadono.
> **ciclica** — Epoca destinata a ripetersi o riemergere.
> **apocrifa** — Epoca dimenticata, rimossa o occultata.
> **liminale** — Esiste tra due stati dell'essere: confini, piani e identità incerti.

> [!info]- ℹ️ Guida — Epoca
> **Cos'è** · Un grande periodo del mondo che raccoglie eventi e archi e fa da spina dorsale alla timeline.
> **Campi chiave** · **Tipo** + **Inizio**/**Fine** (date del mondo); **Famiglia** (fondativa, degenerativa…) e gli assi danno il sapore dell'era.
> **Spunti** · Cosa rese quest'era diversa da quella prima e quella dopo? Quale evento la apre e quale la chiude? Cosa di lei sopravvive nel presente?

````tabs
--- 📖 Lore


%%prosa%%
## Panorama
> [!question]- 💡 Panorama dell'epoca (com'era il mondo)

## Principi dominanti
> [!question]- 💡 Principi dominanti (leggi, divinità, forze)

## Sviluppi
> [!question]- 💡 Sviluppi narrativi (cosa è cambiato)

## Eredità
> [!question]- 💡 Tracce nel presente (cosa ne resta oggi)

> [!rivela|segreto]- Segreto
> 💡 *Verità nascosta dell'epoca*
>

%%/prosa%%

--- 🕰 Cronologia

> [!abstract]- Calendario
> Inizio: `INPUT[text:fc-date]` — nel formato del calendario attivo (Gregorian: AAAA-MM-GG).
>
> Fine: `INPUT[text:fc-end]` — l'epoca compare come intervallo sul calendario.
>
> Calendario: `INPUT[text:fc-calendar]` · Categoria: `INPUT[text:fc-category]`
>
> Compila *Inizio (e Fine)* per far comparire l'epoca sul calendario. Lascia vuoti calendario/categoria per il calendario di default.
>
> Manca il calendario del mondo (mesi/ere)? `BUTTON[apri-calendario]` — crealo o aprilo in un clic; poi i datati vi compaiono soli.
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Eventi principali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):eventi]`
> **Divinità dominanti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Precede**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):precede]`
> **Segue**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):segue]`
> **Evento d'apertura**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):evento_apertura]`
> **Evento di chiusura**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):evento_chiusura]`
> **Miti dell'era**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`
> **Calamità dell'era**: `INPUT[inlineListSuggester(optionQuery("Mondi/Calamita"), useLinks(partial), allowOther):calamita]`
> **Figure dell'era**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Primordiali dell'era**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):primordiali]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
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
