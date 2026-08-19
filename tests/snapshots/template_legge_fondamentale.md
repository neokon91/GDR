<% await tp.user.crea_legge_fondamentale(tp) %>
# `=this.nome`

> [!infobox|legge_fondamentale] ⚖️ Legge fondamentale
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Poli** | `INPUT[text:poli]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(polarità), option(principio assoluto), option(vincolo cosmico)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(esistenziale), option(morale), option(causale), option(formale), option(temporale), option(magica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **esistenziale** — Regge l'essere e il non-essere: vita, morte, presenza.
> **morale** — Regge bene e male, luce e ombra, colpa e redenzione.
> **causale** — Regge causa ed effetto, destino e libero arbitrio, caso.
> **formale** — Regge forma e dissoluzione, ordine ed entropia, identità.
> **temporale** — Regge tempo, durata, eternità e ciclicità.
> **magica** — Regge il flusso dell'energia, il vuoto e i limiti del potere.

> [!info]- ℹ️ Guida — Legge fondamentale
> **Cos'è** · Una legge fondamentale è un principio cosmico assoluto, spesso una polarità (Vita↔Morte): la tensione fra i due poli regge un aspetto della realtà.
> **Campi chiave** · **Poli** (i due estremi) e **Famiglia** (esistenziale, morale, causale…); sul Carattere **Equilibrio** dice verso quale polo pende il mondo ora.
> **Spunti** · Quali sono i due poli, e verso quale pende oggi la realtà? Cosa accade — nel mondo, non in astratto — se la legge si spezza? Chi o cosa la incarna, e chi sogna di infrangerla?

````tabs
--- 📖 Lore


%%prosa%%
## Principio
> [!question]- 💡 Principio: cosa regola, come tiene insieme la realtà

## Quando si spezza
> [!question]- 💡 Rottura: cosa accade se la legge si spezza o si sbilancia

## Manifestazioni
> [!question]- 💡 Manifestazioni: come si percepisce nel mondo (fenomeni, presagi)

> [!rivela|segreto]- Segreto
> 💡 *La verità che pochi conoscono su questa legge*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Dominio che la esprime**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Incarnata da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):incarnata_da]`
> **Piani che la riflettono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Sistemi magici che vi poggiano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Legge complementare / opposta**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):legge_opposta]`
> **Divinità che la incarnano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`

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
