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
> Mappe:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappe]`
>
> Audio:
> `INPUT[inlineListSuggester(optionQuery("Risorse/Audio"), useLinks(partial), allowOther):audio]`
>
> Round:
> `INPUT[number:round]`
>
> Condizioni:
> `INPUT[inlineList:condizioni]`

> [!incontro] Al tavolo
>
> > [!timer]- Pressione
> > - [ ]
> > - [ ]
> > - [ ]
>
> > [!regola]- Tiri rapidi
> > - Iniziativa: `dice: 1d20`
> > - Percezione o indagine: `dice: 1d20`
> > - Danno improvvisato leggero: `dice: 1d6`
> > - Danno improvvisato serio: `dice: 2d6`

> [!regia] Gestione
> ```meta-bind-button
> label: Iniziativa
> style: primary
> actions:
>   - type: open
>     link: "[[Risorse/Iniziativa e Combattimenti]]"
> ```
>
> ```meta-bind-button
> label: Durante Il Gioco
> style: primary
> actions:
>   - type: open
>     link: "[[Durante il Gioco]]"
> ```
>
> ```meta-bind-button
> label: Nuova Creatura
> style: default
> actions:
>   - type: templaterCreateNote
>     templateFile: "z.modelli/Creatura.md"
>     folderPath: "Mondi/Creature"
>     open: true
> ```
>
> ```meta-bind-button
> label: Nuova Mappa Zoom
> style: default
> actions:
>   - type: templaterCreateNote
>     templateFile: "z.modelli/mappe/Mappa Zoom.md"
>     folderPath: "Risorse/Mappe"
>     open: true
> ```


````tabs
tab: Scena

## Obiettivo Dell'Incontro

> [!missione] Obiettivo
>

tab: Creature

## Statblock

```dataview
TABLE type AS tipo_statblock, size AS taglia, cr
FROM "Mondi/Creature"
WHERE contains(this.creature, file.link) OR contains(this.creatures, file.link)
SORT cr ASC
```

```dataviewjs
const currentCreatureLinks = [
  ...dv.array(dv.current().creature ?? []).array(),
  ...dv.array(dv.current().creatures ?? []).array()
];

for (const link of currentCreatureLinks) {
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
let creatures = dv.array(current.encounter_creatures ?? [])
  .map(value => String(value ?? "").trim())
  .where(Boolean)
  .array();

if (!creatures.length) {
  const linkedCreatures = [
    ...dv.array(current.creature ?? []).array(),
    ...dv.array(current.creatures ?? []).array()
  ];

  creatures = dv.array(linkedCreatures)
    .map(link => dv.page(link.path ?? link))
    .where(Boolean)
    .map(page => page.name ?? page.nome ?? page.file.name)
    .where(Boolean)
    .array();
}

if (!creatures.length) {
  dv.paragraph("Aggiungi creature all'incontro o compila il campo dell'iniziativa.");
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

> [!timer]- Round
> `INPUT[number:round]`

```meta-bind
INPUT[list:condizioni]
```

tab: Rete

## PNG Coinvolti

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

tab: Tattiche

## Tattiche

> [!pericolo]- Tattiche
>

## Terreno

> [!luogo]- Terreno
>

## Varianti

> [!segreto]- Varianti
>

tab: Mappe

## Mappe

```dataview
TABLE uso, luogo, stato
FROM "Risorse/Mappe"
WHERE contains(this.mappe, file.link)
SORT uso ASC, file.name ASC
```

## Audio

```dataview
TABLE uso, tono, campagna, stato
FROM "Risorse/Audio"
WHERE contains(this.audio, file.link)
SORT uso ASC, tono ASC, file.name ASC
```

tab: Ricompense

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompense]`

```dataview
TABLE tipo, rarita, stato, proprietario
FROM "Mondi/Oggetti"
WHERE contains(this.ricompense, file.link)
SORT rarita ASC, nome ASC
```

## Esiti

> [!missione]- Conseguenze possibili
>
````
