---
id: demo-regno-di-prova
nome: "Regno di Prova"
categoria: mondo
fileClass: mondo
stato: bozza
tono: avventura leggera
tema: esplorazione e prime scelte
premessa: Un regno costiero in cui ogni scelta del party lascia un segno visibile.
gancio: Il faro spento sulla costa nasconde un passaggio dimenticato.
conflitto_centrale: Chi controlla il porto controlla le rotte del sale.
uso_al_tavolo: Mondo dimostrativo per esplorare Codex, dashboard e wizard senza campagna completa.
player_safe: Una costa nebbiosa con un faro antico ancora in piedi.
fonti: []
riferimenti_srd: []
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: []
tabelle_collegate: []
tags:
  - dnd55/homebrew
  - mondo/lore
  - gdr/bozza
---

# Regno di Prova

> [!scena] Demo minima
> Usa questo mondo per provare filtri, [[Hub/Bibbia del Mondo|Codex]] e [[Worldbuilder Dashboard]]. Completa luoghi iconici e fazioni principali, poi crea campagna o sessione dal wizard.

````tabs
tab: Identità

## Identità

- **Tono:** avventura leggera, mistero costiero
- **Promessa:** ogni sessione cambia almeno un luogo o un potere visibile al party

tab: Prontezza

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
gdr.renderWorldCreationStatus(dv, dv.current().file.path);
```

tab: Passi

## Prossimi passi

1. Aggiungi un luogo in `Mondi/Luoghi/` e collegalo qui.
2. Crea una fazione in `Mondi/Fazioni/`.
3. Apri [[Risorse/Preparazione Sessione]] quando sei pronto al tavolo.
````

## Fallback Markdown

Se Dataview o Meta Bind non sono attivi, compila i campi in Properties e usa [[Worldbuilder Dashboard]] per il filtro mondo.
