---
cssclasses:
  - tavolo
categoria: risorsa
tipo: mappa
uso: zoom
stato: bozza
pubblico: false
mondo:
luogo:
luoghi: []
incontri: []
missioni: []
asset_mappa:
versione_giocatori:
---

# `=this.file.name`

>[!infobox|wiki]- Mappa Zoom
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`
>
> Pubblica:
> `INPUT[toggle:pubblico]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Luogo principale:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Incontri:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial)):incontri]`
>
> Missioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`
>
> Asset:
> `INPUT[text:asset_mappa]`
>
> Versione giocatori:
> `INPUT[suggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):versione_giocatori]`

> [!scena] Uso al tavolo
> Apri questa mappa quando posizione, distanza, linee di vista, percorsi o marker rivelati cambiano una scelta dei giocatori.

```zoommap
image: Risorse/Mappe/Asset/NOME-FILE.svg
id: mappa-zoom
storage: note
width: 100%
height: 520px
minZoom: 0.35
maxZoom: 6
align: center
wrap: false
render: dom
```

## Checklist Pubblica

- [ ] L'immagine non contiene segreti del GM.
- [ ] I marker visibili sono gia rivelati o sicuri da mostrare.
- [ ] `pubblico: true` solo se la nota puo comparire in [[Vista Giocatori]].
- [ ] La versione GM rimanda alla versione giocatori tramite `versione_giocatori`.

## Collegamenti

```dataview
TABLE categoria, tipo, stato
FROM "Mondi"
WHERE file.link = this.luogo OR contains(this.luoghi, file.link) OR contains(this.incontri, file.link) OR contains(this.missioni, file.link)
SORT categoria ASC, file.name ASC
```

## Note GM

> [!segreto]- Segreti, aree nascoste e appunti GM
>
