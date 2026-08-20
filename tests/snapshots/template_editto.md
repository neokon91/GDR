<% await tp.user.crea_editto(tp) %>
# `=this.nome`

> [!infobox|editto] ⚖️ Editto
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Emanato da** | `INPUT[legame][:emanato_da]` |
> | **Pena / sanzione** | `INPUT[pena][:pena]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(editto), option(legge), option(divieto), option(privilegio), option(trattato)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Editto
> **Cos'è** · Un editto è una norma del mondo — un decreto, una legge, un trattato che un potere proclama. Dà attrito e poste in gioco (≠ regola, che è una regola del tavolo).
> **Campi chiave** · **Tipo** (editto/legge/divieto/privilegio/trattato), chi l'ha **Emanata** e la **Pena** per chi la viola; collega **Dove vale** e le **Fazioni** che tocca.
> **Spunti** · Chi ci guadagna davvero, e a spese di chi? Chi lo infrange, apertamente o di nascosto? Quanto costa farlo rispettare — e chi paga?

````tabs
--- 📖 Lore

```gdr
renderTipoProfilo
```

%%prosa%%
## Contenuto
> [!question]- 💡 Cosa stabilisce, nei fatti

## Movente
> [!question]- 💡 Perché è stata emanata (chi ci guadagna)

## Applicazione
> [!question]- 💡 Come viene fatta rispettare — e chi la aggira

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Regno / potere**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Dove vale**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Fazioni toccate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Promulgato in**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):promulgato_in]`

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
