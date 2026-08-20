<% await tp.user.crea_tabella(tp) %>
# `=this.nome`

> [!infobox|tabella] Tabella casuale
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Dado (vuoto = auto sul n. di voci)** | `INPUT[text:dado]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(tabella), option(incontri), option(tesoro), option(png), option(colpo_scena), option(ambiente)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Tabella casuale
> **Cos'è** · Una tabella casuale pronta al tavolo: scrivi le **Voci** (una per riga), poi tira nel pannello e leggi l'esito. Il dado si adatta al numero di voci (1dN).
> **Campi chiave** · Le **Voci** sono i risultati (una per riga); il **Dado** è opzionale (auto = numero di voci). Il **Tipo** dice a cosa serve (incontri, tesoro, colpi di scena…).


````tabs
--- 📖 Lore

```gdr
renderTipoProfilo
```

> [!note] Voci della tabella — una per riga (peso opzionale: `3× testo`)
> `INPUT[testo_area][:voci]`

> [!tip] Tira col bottone (rispetta i pesi e inserisce l'esito al cursore): `BUTTON[tira-tabella]`

```gdr
renderTabella
```

> [!tip]- 🎲 Vuoi il roll NATIVO del Dice Roller (animazione + cronologia)?
> Le **lookup-table** del Dice Roller vanno a livello-radice di una nota: un block-id dentro i
> tab non è raggiungibile dal link. Tienile nella libreria **[[Tabelle casuali]]** (formato pronto
> da copiare) e richiamale da qui con `` `dice: [[Tabelle casuali#^id]]` ``.
%%prosa%%
## Uso
> [!question]- 💡 Quando/perché tirarla (nota per te)

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Dove si usa**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

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
