<% await tp.user.crea_profezia(tp) %>
# `=this.nome`

> [!infobox|profezia] 🔮 Profezia
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato d'avveramento** | `INPUT[stato_profezia][:stato_profezia]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(cosmica), option(divinatoria), option(di rinascita), option(distruttiva), option(personale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Profezia
> **Cos'è** · Una predizione con condizioni d'avveramento — un gancio narrativo forte che il DM fa maturare nel tempo.
> **Campi chiave** · **Tipo**; **Stato d'avveramento** (campo filtrabile: in corso/compiuta) per ritrovarla; sul Carattere **Malleabilità** dice se le scelte dei PG possono deviarla.
> **Spunti** · Chi crede a questa profezia e chi la teme? Cosa deve accadere perché si compia — e chi lavora per impedirlo? E se l'interpretazione comune fosse sbagliata?

````tabs
--- 📖 Lore

```gdr
renderTipoProfilo
```

%%prosa%%
## Testo
> [!question]- 💡 Il testo della profezia (le parole, anche criptiche)

## Interpretazioni
> [!question]- 💡 Interpretazioni possibili (cosa si crede significhi)

## Condizioni
> [!question]- 💡 Condizioni di avveramento (cosa deve accadere)

## Segni
> [!question]- 💡 Segni e manifestazioni: come capire che si avvera

> [!rivela|segreto]- Segreto
> 💡 *La verità sull'avveramento (cosa il DM sa davvero)*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Chi riguarda**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):riguarda]`
> **Evento legato**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):evento]`
> **Culti che la custodiscono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`
> **Calamità annunciata**: `INPUT[suggester(optionQuery("Mondi/Calamita"), useLinks(partial), allowOther):calamita]`
> **Divinità implicata**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Epoca dell'avveramento**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```gdr
renderConnessioni
```
```gdr
renderMemoria
```
````

> [!tip] ＋ Componenti
> Aggiungi ciò che ti serve, quando ti serve — **Al tavolo**, **Clock del fronte**, **Carattere**, **Cronologia**, **Vista**…
> `BUTTON[aggiungi-componente]`
>
> `BUTTON[marca-canonico]` · `BUTTON[archivia-nota]`
