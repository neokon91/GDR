# z.engine

Runtime di rendering per DataviewJS e JS Engine. I file qui dentro devono produrre viste, tabelle, card e feedback, senza modificare file o frontmatter.

## Contratto

- `z.engine/session_views.js` e l'entrypoint per dashboard, sessioni, player view e template generati.
- `z.engine/gdr_views.js` contiene componenti piu piccoli e riusabili.
- Le azioni che scrivono frontmatter restano in `z.automazioni/meta_actions.js`.
- La creazione e lo spostamento delle note restano in funzioni Templater dentro `z.automazioni/`.
- Le nuove note operative non devono puntare direttamente a `z.automazioni/session_context.js`.

## Uso

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
```

## Check

`npm run check:js` blocca scritture file da `z.engine`.
`npm run check:layer` blocca riferimenti operativi diretti a `z.automazioni/session_context.js`.
