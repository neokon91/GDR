<% await tp.user.crea_calamita(tp) %>
# `=this.nome`

> [!infobox|calamita] ☣️ Calamità
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Gravità** | `INPUT[gravita][:gravita]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(pestilenza), option(carestia), option(cataclisma), option(maledizione), option(anomalia)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Calamità
> **Cos'è** · Una calamità è una sciagura che DURA e si diffonde (peste, carestia, cataclisma, maledizione): un Fronte il cui clock avanza finché qualcuno non la ferma.
> **Campi chiave** · **Tipo** (pestilenza/carestia/…) e **Gravità**; imposta un **clock** = la diffusione; **Come si diffonde** e **Rimedio** dicono come accelera e come si spegne; collega **Dove colpisce**.
> **Spunti** · Da dove è partita, e perché continua a diffondersi? Chi potrebbe fermarla — e cosa glielo impedisce? Cosa lascia dietro di sé là dove è passata?

````tabs
--- 📖 Lore

```gdr
renderTipoProfilo
```

%%prosa%%
## Cosa accade
> [!question]- 💡 Cosa accade, e a chi

## Avanzata
> [!question]- 💡 Come avanza se nessuno interviene (la posta del clock)

## Come finisce
> [!question]- 💡 Cosa la ferma o la spegne

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Dove colpisce**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Epoca**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca]`
> **Scatenata da**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):causato_da]`
> **Chi reagisce**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Profezia che l'annuncia**: `INPUT[suggester(optionQuery("Mondi/Profezie"), useLinks(partial), allowOther):profezia]`
> **Chi colpisce (stirpi)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):colpisce]`
> **Origine / mandante divino**: `INPUT[suggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Culti coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`

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
