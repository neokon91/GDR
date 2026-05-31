<% await tp.user.crea_personaggio(tp) %>
# `=this.nome`

> [!info] PG
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!info] In gioco
> CA `INPUT[number:ca]` · PF `INPUT[number:pf]`/`INPUT[number:pf_max]` · Velocità `INPUT[number:velocita]` m
>
> Competenza +`INPUT[number:competenza]` · Iniziativa `VIEW[floor(({destrezza} - 10) / 2)]`

**Caratteristiche**

| Car | Valore | Mod | TS | Comp |
|:--|:-:|:-:|:-:|:-:|
| **FOR** | `INPUT[number:forza]` | `VIEW[floor(({forza} - 10) / 2)][math:mod_forza]` | `VIEW[floor(({forza} - 10) / 2) + ({ts_forza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_forza]` |
| **DES** | `INPUT[number:destrezza]` | `VIEW[floor(({destrezza} - 10) / 2)][math:mod_destrezza]` | `VIEW[floor(({destrezza} - 10) / 2) + ({ts_destrezza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_destrezza]` |
| **COS** | `INPUT[number:costituzione]` | `VIEW[floor(({costituzione} - 10) / 2)][math:mod_costituzione]` | `VIEW[floor(({costituzione} - 10) / 2) + ({ts_costituzione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_costituzione]` |
| **INT** | `INPUT[number:intelligenza]` | `VIEW[floor(({intelligenza} - 10) / 2)][math:mod_intelligenza]` | `VIEW[floor(({intelligenza} - 10) / 2) + ({ts_intelligenza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_intelligenza]` |
| **SAG** | `INPUT[number:saggezza]` | `VIEW[floor(({saggezza} - 10) / 2)][math:mod_saggezza]` | `VIEW[floor(({saggezza} - 10) / 2) + ({ts_saggezza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_saggezza]` |
| **CAR** | `INPUT[number:carisma]` | `VIEW[floor(({carisma} - 10) / 2)][math:mod_carisma]` | `VIEW[floor(({carisma} - 10) / 2) + ({ts_carisma} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_carisma]` |

**Abilità**

| Abilità | Bonus | Comp |
|:--|:-:|:-:|
| Acrobazia (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_acrobazia} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_acrobazia]` |
| Addestrare Animali (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_addestrare_animali} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_addestrare_animali]` |
| Arcano (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_arcano} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_arcano]` |
| Atletica (FOR) | `VIEW[floor(({forza} - 10) / 2) + ({prof_atletica} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_atletica]` |
| Furtività (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_furtivita} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_furtivita]` |
| Indagare (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_indagare} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_indagare]` |
| Inganno (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_inganno} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_inganno]` |
| Intimidire (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_intimidire} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intimidire]` |
| Intrattenere (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_intrattenere} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intrattenere]` |
| Intuizione (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_intuizione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intuizione]` |
| Medicina (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_medicina} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_medicina]` |
| Natura (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_natura} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_natura]` |
| Percezione (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_percezione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_percezione]` |
| Persuasione (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_persuasione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_persuasione]` |
| Rapidità di Mano (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_rapidita_di_mano} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_rapidita_di_mano]` |
| Religione (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_religione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_religione]` |
| Sopravvivenza (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_sopravvivenza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_sopravvivenza]` |
| Storia (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_storia} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_storia]` |

> [!abstract] Sistema
> **Classe**: `VIEW[{classe} ?? "—"]` · **Specie**: `VIEW[{specie} ?? "—"]` · **Background**: `VIEW[{background} ?? "—"]`
>
> **Taglia**: `VIEW[{taglia} ?? "—"]` · **Velocità**: `VIEW[{velocita} ?? "—"]` m
>
> **TS competenti**: `VIEW[{ts_competenti} ?? "—"]`
>
> **Competenze**: `VIEW[{competenze_abilita} ?? "—"]`
>
> **Talenti**: `VIEW[{talenti} ?? "—"]`
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
