<% await tp.user.crea_lingua(tp) %>
# `=this.nome`

> [!infobox|lingua] 🗣️ Lingua
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Vitalità** | `INPUT[vitalita][:vitalita]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(lingua), option(dialetto), option(codice o gergo)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(primordiale), option(divina), option(planare), option(elementale), option(ancestrale), option(rituale), option(arcana), option(segreta)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **primordiale** — Linguaggi originari, emanazioni cosmiche o divine anteriori alla realtà ordinata.
> **divina** — Idiomi delle entità divine o delle sfere celesti, spesso incomprensibili ai mortali.
> **planare** — Associati a uno o più piani; riflettono le proprietà metafisiche del piano.
> **elementale** — Linguaggi naturali legati ai quattro elementi primari.
> **ancestrale** — Idiomi di civiltà estinte o epoche dimenticate.
> **rituale** — Usati per scopi cerimoniali, religiosi o liturgici.
> **arcana** — Linguaggi specialistici per incantesimi, formule, sigilli e grimori.
> **segreta** — Codici cifrati e idiomi criptici di sette, ladri, spie o ordini iniziatici.

> [!info]- ℹ️ Guida — Lingua
> **Cos'è** · Una lingua dà texture al mondo: chi la parla, come suona e — se arcana o rituale — cosa può fare quando viene pronunciata.
> **Campi chiave** · **Famiglia** (registro: divina, arcana, segreta…) e **Tipo**; **Vitalità** (viva→morta) per le query; sul Carattere **Effetto magico** e **Rischio** se le parole hanno potere.
> **Spunti** · Chi la parla — e chi NON deve mai sentirla o pronunciarla? Una parola o frase usabile al tavolo: cosa significa, e cosa fa? È viva o sta morendo? Chi la tiene in vita, e perché?

````tabs
--- 📖 Lore


%%prosa%%
## Parlanti
> [!question]- 💡 Chi la parla

## Suono
> [!question]- 💡 Come suona

## Scrittura
> [!question]- 💡 Sistema di scrittura / alfabeto

## Lessico
> [!question]- 💡 Parole/frasi chiave usabili al tavolo

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Parlata in**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):parlata_in]`
> **Culture**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`
> **Sistema magico**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`
> **Lingua di (divinità)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Piani**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Origine primordiale**: `INPUT[suggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):entita_primordiale]`
> **Deriva da**: `INPUT[suggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):derivata_da]`
> **Lingue derivate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingue_figlie]`

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
