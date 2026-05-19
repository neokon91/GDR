<% await tp.user.incontro(tp) %>
# `=this.nome`

>[!infobox|wiki]- Incontro
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(usato, Usato), option(archiviata, Archiviata)):stato]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Creature:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial)):creature]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Round:
> `INPUT[number:round]`
>
> Condizioni:
> `INPUT[inlineList:condizioni]`

> [!incontro] Setup
>

> [!timer] Pressione
> - [ ]
> - [ ]
> - [ ]

> [!regola] Tiri rapidi
> - Iniziativa: `dice: 1d20`
> - Percezione o indagine: `dice: 1d20`
> - Danno improvvisato leggero: `dice: 1d6`
> - Danno improvvisato serio: `dice: 2d6`

````tabs
tab: Scena

## Obiettivo Dell'Incontro

> [!missione] Obiettivo
>

tab: Creature

## Creature

```dataview
TABLE type AS tipo_statblock, size AS taglia, cr
FROM "Mondi/Creature"
WHERE contains(this.creature, file.link)
SORT cr ASC
```

```dataviewjs
for (const link of dv.current().creature ?? dv.current().creatures ?? []) {
  const page = dv.page(link.path ?? link);
  if (page?.name) {
    dv.paragraph("```statblock\nmonster: " + page.name + "\n```");
  }
}
```

## Initiative Tracker

Creature incontro:
`INPUT[inlineList:encounter_creatures]`

```dataviewjs
const current = dv.current();
const creatures = dv.array(current.encounter_creatures ?? [])
  .map(value => String(value ?? "").trim())
  .where(Boolean)
  .array();

if (!creatures.length) {
  dv.paragraph("Aggiungi le creature dell'iniziativa nel campo sopra.");
} else {
  const lines = [
    "```encounter",
    `name: ${current.nome ?? current.file.name}`,
    "players: true",
    "creatures:",
    ...creatures.map(name => `  - ${name}`),
    "```"
  ];
  dv.paragraph(lines.join("\n"));
}
```

## Round E Condizioni

> [!timer] Round
> `INPUT[number:round]`

```meta-bind
INPUT[list:condizioni]
```

tab: PNG

## PNG Coinvolti

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

tab: Tattiche

## Tattiche

> [!pericolo] Tattiche
>

## Terreno

> [!luogo] Terreno
>

tab: Ricompense

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompense]`

```dataview
TABLE tipo, rarita, stato, proprietario
FROM "Mondi/Oggetti"
WHERE contains(this.ricompense, file.link)
SORT rarita ASC, nome ASC
```

## Varianti

> [!segreto]- Varianti
>
````
