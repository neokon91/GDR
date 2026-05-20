<% await tp.user.lore_capture(tp) %>
# `=this.nome`

>[!infobox|wiki]- Lore Capture
> Tipo:
> `INPUT[inlineSelect(option(evento, Evento), option(png improvvisato, PNG improvvisato), option(luogo improvvisato, Luogo improvvisato), option(dialogo, Dialogo), option(conseguenza, Conseguenza), option(idea, Idea)):tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(da smistare, Da smistare), option(collegata, Collegata), option(canonica, Canonica), option(archiviata, Archiviata), option(ignorata, Ignorata)):stato]`
>
> Stato canonico:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(segreto, Segreto), option(falso, Falso), option(retcon, Retcon), option(dimenticato, Dimenticato)):stato_canonico]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Fonte:
> `INPUT[inlineSelect(option(sessione, Sessione), option(prep, Prep), option(player, Player), option(improvvisazione, Improvvisazione), option(retcon, Retcon), option(import, Import)):fonte]`
>
> Grado certezza:
> `INPUT[inlineSelect(option(basso, Basso), option(medio, Medio), option(alto, Alto)):grado_certezza]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Sessioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial)):sessioni]`
>
> Collegamenti:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):collegamenti]`
>
> Entità impattate:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`
>
> Data mondo:
> `INPUT[text:data_mondo]`
>
> Pronta al tavolo:
> `INPUT[toggle:giocabile]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`
>
> Canonizza evento:
> `INPUT[toggle:canonizza_evento]`
>
> Collega al mondo:
> `INPUT[toggle:collega_al_mondo]`
>
> Aggiorna PNG:
> `INPUT[toggle:aggiorna_png]`
>
> Aggiorna luogo:
> `INPUT[toggle:aggiorna_luogo]`
>
> Aggiorna missione:
> `INPUT[toggle:aggiorna_missione]`
>
> Aggiorna tracciato:
> `INPUT[toggle:aggiorna_tracciato]`
>
> Archivia appunto:
> `INPUT[toggle:archivia_appunto]`

> [!indizio] Cosa e emerso
>

> [!missione] Impatto sul mondo
> `INPUT[list:impatto]`

## Continuità Narrativa

> [!timeline] Da non perdere
> Causa:
> `INPUT[text:causa]`
>
> Entità impattate:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`
>
> Stato mondo:
> `INPUT[list:stato_mondo]`

## Controllo Canone

> [!warning] Contraddizioni e retcon
> Contraddice:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):contraddice]`
>
> Retcon di:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):retcon_di]`
>
> Motivo retcon:
> `INPUT[text:retcon_motivo]`

## Rendere Giocabile

### Scelte

```meta-bind
INPUT[list:scelte]
```

### Rischi

```meta-bind
INPUT[list:rischi]
```

### Indizi

```meta-bind
INPUT[list:indizi]
```

### PNG Coinvolti

```meta-bind
INPUT[list:png_coinvolti]
```

### Ricompense

```meta-bind
INPUT[list:ricompense]
```

### Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Azioni Guidate

```meta-bind-button
label: Canonizza
style: primary
actions:
  - type: updateMetadata
    bindTarget: canonizza_evento
    evaluate: false
    value: true
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: canonica
  - type: updateMetadata
    bindTarget: stato_canonico
    evaluate: false
    value: canonico
  - type: updateMetadata
    bindTarget: canonico
    evaluate: false
    value: true
  - type: updateMetadata
    bindTarget: grado_certezza
    evaluate: false
    value: alto
```

```meta-bind-button
label: Collega Al Mondo
style: primary
actions:
  - type: updateMetadata
    bindTarget: collega_al_mondo
    evaluate: false
    value: true
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: collegata
```

```meta-bind-button
label: Aggiorna PNG
style: primary
actions:
  - type: updateMetadata
    bindTarget: aggiorna_png
    evaluate: false
    value: true
```

```meta-bind-button
label: Aggiorna Luogo
style: primary
actions:
  - type: updateMetadata
    bindTarget: aggiorna_luogo
    evaluate: false
    value: true
```

```meta-bind-button
label: Aggiorna Missione
style: primary
actions:
  - type: updateMetadata
    bindTarget: aggiorna_missione
    evaluate: false
    value: true
```

```meta-bind-button
label: Aggiorna Tracciato
style: primary
actions:
  - type: updateMetadata
    bindTarget: aggiorna_tracciato
    evaluate: false
    value: true
```

```meta-bind-button
label: Archivia Appunto
style: default
actions:
  - type: updateMetadata
    bindTarget: archivia_appunto
    evaluate: false
    value: true
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: archiviata
```

```meta-bind-button
label: Ignora
style: default
actions:
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: ignorata
  - type: updateMetadata
    bindTarget: canonico
    evaluate: false
    value: false
```

## Azioni

```meta-bind
INPUT[list:azioni]
```

> [!timer] Da fare
> - [ ] Canonizza evento
> - [ ] Collega al mondo
> - [ ] Aggiorna PNG
> - [ ] Aggiorna luogo
> - [ ] Aggiorna missione
> - [ ] Archivia appunto
