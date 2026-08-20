<% await tp.user.crea_cultura(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|cultura] 🎏 Cultura
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Lingua** | `VIEW[{lingua}][link]` |
> | **Portata** | `INPUT[portata][:portata]` |
> | **Stile dei nomi** | `INPUT[stile_nomi][:stile_nomi]` |
> | **Simbolo** | `INPUT[text(placeholder(es. un sole infranto su campo nero)):simbolo]` |
> | **Festività & ricorrenze** | `INPUT[testo_area][:festivita]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(civilta), option(popolo), option(tradizione), option(religione)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(ancestrale), option(sciamanica), option(iniziatica), option(dogmatica), option(fluida), option(sincretica), option(guerriera), option(nomadica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **ancestrale** — Radicata nelle origini mitiche, nella trasmissione orale e nei cicli naturali.
> **sciamanica** — Integra visibile e invisibile: pratiche spirituali, viaggi dell'anima, dialogo con l'Altrove.
> **iniziatica** — Fondata sul passaggio, la prova e la trasformazione.
> **dogmatica** — Del sacro immutabile, del rito stabilito, della gerarchia indiscutibile.
> **fluida** — In perenne mutamento; abbraccia molteplicità e trasformazione.
> **sincretica** — Dell'intreccio: fonde tradizioni e significati.
> **guerriera** — Fondata sul conflitto, sulla prova e sulla conquista.
> **nomadica** — Del movimento, dell'adattamento e della non-fissazione.

> [!info]- ℹ️ Guida — Cultura
> **Cos'è** · Una cultura è un popolo coi suoi valori, riti e tabù: dà identità a luoghi e personaggi e attriti con le culture vicine.
> **Campi chiave** · Scegli la **famiglia** (indole): pre-compila gli assi. Poi **Stile dei nomi** (alimenta il generatore) e **Portata**; sul Carattere **Valori dominanti**.
> **Spunti** · Cosa venera o teme questo popolo? Qual è il suo valore supremo? Un costume o un rito che a un forestiero sembra assurdo. Come tratta gli stranieri, i morti, il potere?

````tabs
--- 📖 Lore

```gdr
renderTipoProfilo
```

%%prosa%%
## Valori
> [!question]- 💡 Valori fondanti

## Vita
> [!question]- 💡 Vita quotidiana

## Riti
> [!question]- 💡 Riti di passaggio, feste

## Tabù
> [!question]- 💡 Tabù: cosa è proibito

## Estetica
> [!question]- 💡 Estetica: arte, moda, architettura

## Tensione
> [!question]- 💡 Attrito con altre culture

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Regioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`
> **Lingua**: `INPUT[suggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingua]`
> **Istituzioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):istituzioni]`
> **Specie**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`
> **Culti / fedi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`
> **Divinità venerate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Background**: `INPUT[inlineListSuggester(optionQuery("Mondi/Background"), useLinks(partial), allowOther):background]`
> **Ambiente d'origine**: `INPUT[inlineListSuggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):biomi]`

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
