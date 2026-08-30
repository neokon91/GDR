<% await tp.user.crea_condizione(tp) %>
# `=this.nome`

> [!infobox|condizione] Condizione
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(stato), option(malattia), option(maledizione), option(benedizione)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Condizione
> **Cos'è** · Una condizione/effetto persistente che MORDE i tiri (come le 15 SRD), applicabile nella Board col picker «＋stato».
> **Campi chiave** · La **meccanica** sta nel blocco `effetti` (⚙ Meccanica): `bersaglio` (tiri_colpire/tiri_salvezza/prove/velocita) + `operazione` (svantaggio/vantaggio/…). Senza, la condizione è solo prosa.


````tabs
--- 📖 Lore

```gdr
renderTipoProfilo
```
> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

%%prosa%%
## Effetto
> [!question]- 💡 Effetto narrativo: cosa comporta al tavolo

## Come finisce
> [!question]- 💡 Come finisce: durata, tiro salvezza, rimozione

%%/prosa%%

> [!tip]- ⚙️ Rendila MORDENTE (Active Effect)
> Compila il blocco sotto (togli i `#`): gli `effetti` mordono i tiri di chi ha la condizione, applicata nella Board col picker «＋stato». `bersaglio`: tiri_colpire · tiri_salvezza · prove · velocita. `operazione`: `svantaggio` · `vantaggio` · `somma` (con `valore`).

```yaml
# Esempio: una maledizione (svantaggio a colpire e ai TS). Togli i # per attivare.
# effetti:
#   - { bersaglio: tiri_colpire,  operazione: svantaggio }
#   - { bersaglio: tiri_salvezza, operazione: svantaggio }
```
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

```gdr
renderConnessioni
```
```gdr
renderMemoria
```
--- 👁 Vista

```gdr
renderEntityPanel
```
````
