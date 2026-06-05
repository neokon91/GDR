<% await tp.user.crea_classe(tp) %>
# `=this.nome`

> [!infobox|classe] 🛡️ Classe
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Dado vita** | `VIEW[{dado_vita} ?? "—"]` |
> | **Caratteristica primaria** | `VIEW[{car_primaria} ?? "—"]` |
> | **TS competenti** | `VIEW[{ts_competenze} ?? "—"]` |
> | **Competenze in armi** | `VIEW[{competenze_armi} ?? "—"]` |
> | **Competenze in armature** | `VIEW[{competenze_armature} ?? "—"]` |
> | **Competenza in strumenti** | `VIEW[{strumento} ?? "—"]` |
> | **Abilità a scelta (numero)** | `VIEW[{abilita_numero} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(marziale), option(incantatore), option(mezzo incantatore), option(esperto)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

````tabs
--- 🛡 Classe

> [!abstract] Scheda
> Dado vita: `INPUT[dado_vita][:dado_vita]`
> Caratteristica primaria: `INPUT[text:car_primaria]`
> TS competenti: `INPUT[text:ts_competenze]`
> Competenze in armi: `INPUT[text:competenze_armi]`
> Competenze in armature: `INPUT[text:competenze_armature]`
> Competenza in strumenti: `INPUT[text:strumento]`
> Abilità a scelta (numero): `INPUT[number:abilita_numero]`

--- 📈 Progressione

> [!note] Concept
> `INPUT[textArea:descrizione]`

> [!note] Equipaggiamento
> `INPUT[textArea:equipaggiamento]`

> [!note] Progressione
> `INPUT[textArea:progressione]`


> [!example]- Tabella dei livelli
> | Liv | Comp. | Privilegi |
> |----|----|----|
> | 1 | | |
> | 2 | | |
> | 3 | | |
> | 4 | | |
> | 5 | | |
> | 6 | | |
> | 7 | | |
> | 8 | | |
> | 9 | | |
> | 10 | | |
> | 11 | | |
> | 12 | | |
> | 13 | | |
> | 14 | | |
> | 15 | | |
> | 16 | | |
> | 17 | | |
> | 18 | | |
> | 19 | | |
> | 20 | | |

--- 🎓 Sottoclassi

La sottoclasse si sceglie al **livello 3**.
```dataview
list
from ""
where categoria = "sottoclasse" and classe = this.file.link
```

--- 🔗 Collegamenti

> [!example]- 🎭 Chi la gioca al tavolo
> I personaggi del vault che hanno scelto questa nota (si popola creando un PG/PNG che la sceglie):
```dataview
list
from ""
where categoria = "personaggio" and lower(string(classe)) = lower(this.file.name)
sort tipo asc, file.name asc
```
> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
