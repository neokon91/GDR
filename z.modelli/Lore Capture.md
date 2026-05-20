<% await tp.user.lore_capture(tp) %>
# `=this.nome`

>[!infoboxwiki]- Lore Capture
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
> `INPUT[canonico][:canonico]`
>
> Fonte:
> `INPUT[inlineSelect(option(sessione, Sessione), option(prep, Prep), option(player, Player), option(improvvisazione, Improvvisazione), option(retcon, Retcon), option(import, Import)):fonte]`
>
> Grado certezza:
> `INPUT[inlineSelect(option(basso, Basso), option(medio, Medio), option(alto, Alto)):grado_certezza]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
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

## Gestione

Stato:
`INPUT[inlineSelect(option(da smistare, Da smistare), option(collegata, Collegata), option(canonica, Canonica), option(archiviata, Archiviata), option(ignorata, Ignorata)):stato]`

Stato canonico:
`INPUT[inlineSelect(option(rumor, Rumor), option(canonico, Canonico), option(leggenda, Leggenda), option(falso, Falso), option(retcon, Retcon)):stato_canonico]`

Canonico:
`INPUT[canonico][:canonico]`

Grado certezza:
`INPUT[inlineSelect(option(basso, Basso), option(medio, Medio), option(alto, Alto)):grado_certezza]`

```meta-bind
INPUT[toggle:canonizza_evento]
INPUT[toggle:collega_al_mondo]
INPUT[toggle:aggiorna_png]
INPUT[toggle:aggiorna_luogo]
INPUT[toggle:aggiorna_missione]
INPUT[toggle:aggiorna_tracciato]
INPUT[toggle:archivia_appunto]
```

`BUTTON[nuovo-evento-storico-z-modelli-evento-storico-md]`

`BUTTON[post-sessione-risorse-post-sessione-guidato-2]`

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
