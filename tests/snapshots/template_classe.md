<% await tp.user.crea_classe(tp) %>
# `=this.nome`

> [!infobox|classe] 🛡️ Classe
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Dado vita** | `INPUT[dado_vita][:dado_vita]` |
> | **Caratteristica primaria** | `INPUT[car_primaria][:car_primaria]` |
> | **TS competenti** | `INPUT[text(placeholder(es. Forza e Costituzione)):ts_competenze]` |
> | **Competenze in armi** | `INPUT[text:competenze_armi]` |
> | **Competenze in armature** | `INPUT[text:competenze_armature]` |
> | **Competenza in strumenti** | `INPUT[text(placeholder(es. Strumenti da fabbro)):strumento]` |
> | **Abilità a scelta (numero)** | `INPUT[number:abilita_numero]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(marziale), option(incantatore), option(mezzo incantatore), option(esperto)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Classe
> **Cos'è** · La classe homebrew che i tuoi giocatori potranno scegliere in creazione e far salire di livello come una ufficiale.
> **Campi chiave** · Il **Tipo** (marziale/incantatore/…) è solo narrativo; a guidare la MECCANICA sono **Dado vita** + **Caratteristica primaria** + **Incantatore?** (nessuno/pieno/mezzo): da questi il motore deriva slot, competenza e ASI. ⚠️ imposta **Incantatore?** esplicitamente — il Tipo da solo NON dà gli slot. **Privilegi automatizzati (opzionale):** un blocco frontmatter `privilegi:` con voci `{livello, nome, concede}` viene **mostrato e applicato** al livello giusto (e a creazione per il 1º) — `concede` come per i talenti (punteggi/competenze); i privilegi freeform restano prosa nella Progressione.


````tabs
--- 🛡 Classe


--- 📈 Progressione

%%prosa%%
## Concept
> [!question]- 💡 Concept della classe

## Equipaggiamento
> [!question]- 💡 Equipaggiamento iniziale (es. A: ...; oppure B: ...)

## Progressione
> [!question]- 💡 Privilegi salienti per livello

%%/prosa%%

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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
