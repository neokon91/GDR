<% await tp.user.create_entity(tp, "png") %>
# `=this.nome`

> [!info] PNG
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!info] In gioco
> CA `INPUT[number:ca]` · PF `INPUT[number:pf]`/`INPUT[number:pf_max]` · Velocità `INPUT[number:velocita]` m
>
> Competenza +`INPUT[number:competenza]` · Iniziativa `VIEW[floor(({destrezza} - 10) / 2)]`

> [!abstract] Caratteristiche
> **FOR** `INPUT[number:forza]` · mod `VIEW[floor(({forza} - 10) / 2)][math:mod_forza]`
> **DES** `INPUT[number:destrezza]` · mod `VIEW[floor(({destrezza} - 10) / 2)][math:mod_destrezza]`
> **COS** `INPUT[number:costituzione]` · mod `VIEW[floor(({costituzione} - 10) / 2)][math:mod_costituzione]`
> **INT** `INPUT[number:intelligenza]` · mod `VIEW[floor(({intelligenza} - 10) / 2)][math:mod_intelligenza]`
> **SAG** `INPUT[number:saggezza]` · mod `VIEW[floor(({saggezza} - 10) / 2)][math:mod_saggezza]`
> **CAR** `INPUT[number:carisma]` · mod `VIEW[floor(({carisma} - 10) / 2)][math:mod_carisma]`

--- Lore

> [!abstract] Scheda
> Allineamento: `INPUT[allineamento][:allineamento]`
> Pronomi: `INPUT[text:pronomi]`
> Età: `INPUT[text:eta]`

> [!note]- Descrizione
> Chi è, com'è, cosa porta in scena.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Ruolo
> `INPUT[textArea:ruolo]`

> [!note] Aspetto
> `INPUT[textArea:aspetto]`

> [!note] Vuole
> `INPUT[textArea:desiderio]`

> [!note] Teme
> `INPUT[textArea:paura]`

> [!note] Voce
> `INPUT[textArea:voce]`

> [!note] Oggetto
> `INPUT[textArea:oggetto]`

> [!quote] Frase tipica
> `INPUT[textArea:frase]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Carattere

> [!abstract] Carattere
> **Lecito** `INPUT[slider(minValue(0), maxValue(10), addLabels):lecito_caotico]` **Caotico**
> **Altruista** `INPUT[slider(minValue(0), maxValue(10), addLabels):altruista_egoista]` **Egoista**
> **Calmo** `INPUT[slider(minValue(0), maxValue(10), addLabels):calmo_volatile]` **Volatile**

--- Collegamenti

> [!example] Relazioni
> **Affiliazione**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Base**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Alleati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):alleati]`
> **Rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):rivali]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`
--- Vista

```dataviewjs
const source = await dv.io.load("z.automazioni/views.js");
eval(source);
renderEntityPanel(dv, dv.current());
```
````
