<% await tp.user.pg(tp) %>
# `=this.nome`

>[!infoboxwiki] right
>**Giocatore**: `=this.giocatore`
>**Classe**: `=this.classe`
>**Sottoclasse**: `=this.sottoclasse`
>**Livello**: `=this.livello`
>**Specie**: `=this.specie`
>**Background**: `=this.background`
>**Stato**: `=this.stato`
>**Mondo**: `=this.mondo`
>**HP**: `VIEW[{hp_attuali}]` / `VIEW[{hp_massimi}]`
>
>```meta-bind-js-view
>{hp_massimi} as max
>---
>const slider = `
>\`INPUT[slider(
>  minValue(0),
>  maxValue(${context.bound.max ?? 100}),
>  stepSize(1),
>  addLabels,
>  class(hp-slider),
>  title(Punti Ferita correnti)
>):hp_attuali]\`
>`;
>
>return engine.markdown.create(slider);
>```

> [!png] Identità
>

Mondo:
`INPUT[mondo][:mondo]`

## Scheda PG

| Campo | Valore |
| --- | --- |
| Classe | `INPUT[inlineSelect(option(Barbaro), option(Bardo), option(Chierico), option(Druido), option(Guerriero), option(Ladro), option(Mago), option(Monaco), option(Paladino), option(Ranger), option(Stregone), option(Warlock)):classe]` |
| Sottoclasse | `INPUT[text:sottoclasse]` |
| Livello | `INPUT[number:livello]` |
| Specie | `INPUT[inlineSelect(option(Aasimar), option(Dragonide), option(Elfo), option(Gnomo), option(Goliath), option(Halfling), option(Nano), option(Orco), option(Tiefling), option(Umano)):specie]` |
| Background | `INPUT[inlineSelect(option(Accolito), option(Artigiano), option(Ciarlatano), option(Criminale), option(Eremita), option(Eroe locale), option(Forestiero), option(Intrattenitore), option(Marinaio), option(Nobile), option(Sapiente), option(Soldato)):background]` |
| Allineamento | `INPUT[text:allineamento]` |
| Esperienza | `INPUT[number:esperienza]` |
| Milestone | `INPUT[toggle:milestone]` |
| Prossimo livello | `INPUT[text:prossimo_livello]` |
| Bonus competenza | `=this.bonus_competenza` |
| Classe SRD | `=this.classe_srd` |

## Combattimento

| Campo | Valore |
| --- | --- |
| CA | `INPUT[number:ac]` |
| Iniziativa | `INPUT[number:iniziativa]` |
| Velocità | `INPUT[text:velocita]` |
| PF temporanei | `INPUT[number:hp_temporanei]` |
| Condizioni | `INPUT[inlineList:condizioni]` |
| Risorse rapide | `INPUT[inlineList:risorse_rapide]` |
| Dadi vita | `INPUT[text:dadi_vita_totali]` |
| Dadi vita spesi | `INPUT[number:dadi_vita_spesi]` |
| Ispirazione | `INPUT[toggle:ispirazione]` |
| TS morte | `INPUT[number:successi_morte]` successi / `INPUT[number:fallimenti_morte]` fallimenti |

## Caratteristiche

| For | Des | Cos | Int | Sag | Car |
| --- | --- | --- | --- | --- | --- |
| `=this.stats[0]` | `=this.stats[1]` | `=this.stats[2]` | `=this.stats[3]` | `=this.stats[4]` | `=this.stats[5]` |

## Progressione

```dataview
TABLE WITHOUT ID file.link AS Classe, caratteristica_primaria AS "Caratteristica primaria", dado_vita AS "Dado vita", tiri_salvezza AS "Tiri salvezza"
FROM "SRD/Classi"
WHERE file.name = this.classe
```

## Privilegi

`INPUT[inlineList:privilegi]`

## Competenze

`INPUT[inlineList:competenze]`

## Incantesimi

## Legami

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):relazioni]`

## Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT nome ASC
```

## Al Tavolo

> [!scena] Spotlight
> `INPUT[text:spotlight]`

> [!timer] Condizioni E Risorse
> Condizioni: `INPUT[inlineList:condizioni]`
>
> Risorse rapide: `INPUT[inlineList:risorse_rapide]`

## Obiettivi

> [!missione] Obiettivi
> `INPUT[inlineList:quest_personali]`

## Inventario Rapido

```meta-bind
INPUT[list:inventario_rapido]
```

## Loot Da Assegnare

```meta-bind
INPUT[list:loot_da_assegnare]
```

## Segreti

> [!segreto]- Segreti
>

## Note Di Campagna

## Missioni E Sessioni

```dataview
TABLE stato, committente, luoghi, fazioni
FROM "Mondi/Missioni"
WHERE contains(personaggi, this.file.link)
SORT stato ASC, nome ASC
```

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(personaggi, this.file.link)
SORT data DESC
LIMIT 10
```
