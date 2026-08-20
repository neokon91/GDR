<% await tp.user.crea_fazione(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|fazione] ⚔️ Fazione
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Sede** | `VIEW[{sede}][link]` |
> | **Regno / Stato** | `VIEW[{regno}][link]` |
> | **Portata** | `INPUT[portata][:portata]` |
> | **Motto** | `INPUT[text:motto]` |
> | **Epoca di fondazione** | `INPUT[text:fondazione]` |
> | **Simbolo** | `INPUT[text(placeholder(es. un sole infranto su campo nero)):simbolo]` |
> | **Effettivi / membri** | `INPUT[text:effettivi]` |
> | **Come si scopre** | `INPUT[text(placeholder(es. un PNG o una diceria)):scoperta]` |
> | **Cosa possono fare** | `INPUT[text(placeholder(la scelta o ricompensa al tavolo)):interazione]` |
> | **Perché gli importa** | `INPUT[text(placeholder(il gancio per i PG)):movente]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(gilda), option(ordine), option(casata), option(fazione politica), option(banda), option(accademia), option(corte), option(tribunale)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(militare), option(religiosa), option(arcana), option(rivoluzionaria), option(egemonica), option(mercantile), option(profetica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **militare** — Strutturata attorno al dominio delle arti belliche: eserciti, ordini armati, caste guerriere.
> **religiosa** — Devota a un'entità, principio o pantheon; si fonda su dogmi, rituali e rivelazioni.
> **arcana** — Dedicata allo studio, controllo o protezione della magia: ordini, gilde, circoli occulti.
> **rivoluzionaria** — Mira a sovvertire l'ordine costituito: moti insurrezionali, cellule clandestine.
> **egemonica** — Integrata nel potere vigente: caste, organi ufficiali, bracci di controllo istituzionale.
> **mercantile** — Orientata a risorse, potere economico o controllo logistico: corporazioni, reti commerciali.
> **profetica** — Fondata su visioni, cicli cosmici o profezie; agisce in funzione di un evento atteso.

> [!info]- ℹ️ Guida — Fazione
> **Cos'è** · Un gruppo organizzato con un'agenda comune che agisce sul mondo — e può diventare un Fronte al tavolo.
> **Campi chiave** · **Tipo** (forma: gilda, ordine…) e **Famiglia** (natura: militare, mercantile… → preimposta gli assi); poi **Rivali**/**Alleate** per innescare il grafo delle trame.
> **Spunti** · Cosa vuole davvero, e cosa è disposta a fare per averlo? Chi le si oppone? Con chi è alleata per pura convenienza? Qual è la sua debolezza, o il segreto che non deve uscire?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

> [!tip]- Genera nome/spunto
> `BUTTON[genera-locale]` (italiano, a tema) — scegli **cosa generare**: nomi (persona/luogo/fazione), PNG, taverne, bevande, ganci, dicerie, tesori (SRD), insediamenti, oggetti, meteo, stanze di dungeon… — dallo *stile* della cultura/specie collegata. Inserisce al cursore.

> [!note]- Identità
> Cosa rappresenta la fazione, simboli, reputazione e percezione pubblica.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

%%prosa%%
## Obiettivo
> [!question]- 💡 Cosa vuole ottenere la fazione

## Metodi
> [!question]- 💡 Come opera (metodi, stile)

## Gerarchia
> [!question]- 💡 Ruoli, capi, come si entra

## Influenza
> [!question]- 💡 Impatto su civiltà, culti e riti associati

## Nel presente
> [!question]- 💡 Stato attuale, tracce nel mondo, segreti rivelati

## Tensione
> [!question]- 💡 Conflitto o rivalita'

> [!rivela|segreto]- Segreto
> 💡 *Segreto della fazione*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Sede**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):sede]`
> **Fondatori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):fondatori]`
> **Figure chiave**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Alleate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):alleati]`
> **Rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`
> **Controlla le risorse**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):controlla_risorse]`
> **Regno / Stato**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Editti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Editti"), useLinks(partial), allowOther):editti]`
> **Missioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`
> **Forze armate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eserciti"), useLinks(partial), allowOther):eserciti]`
> **Cultura / tradizione**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Culto / fede**: `INPUT[suggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culto]`
> **Background affiliati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Background"), useLinks(partial), allowOther):background]`
> **Contende (territori)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):contende]`

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
