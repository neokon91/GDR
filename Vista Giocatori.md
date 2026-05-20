---
cssclasses:
  - dashboard
  - gdr-player-view
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Vista Giocatori

Vista pubblica semplice: mostra solo materiale giocabile e condivisibile.

> [!warning] Area pubblica
> Non scrivere qui segreti, verità nascoste, prossime mosse o appunti del DM. Le card linkano una nota solo quando e marcata `pubblico: true` e non contiene campi privati evidenti.

```meta-bind-button
label: Durante Il Gioco
style: default
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

```meta-bind-button
label: Materiali Al Tavolo
style: default
actions:
  - type: open
    link: "[[Risorse/Materiali Al Tavolo]]"
```

## Recap Pubblico

> [!lettura] Da leggere ai giocatori
> 

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPlayerView(dv);
```

## Note Per La Prossima Sessione

- 
