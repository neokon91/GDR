---
cssclasses:
  - indice
categoria: risorsa
tipo: guida rapida
stato: pronto
---

# Prima Sessione In 15 Minuti

Usa questa pagina quando vuoi giocare subito. Non devi completare il mondo: ti bastano una sessione, una prima scena, un luogo, un PNG, una pressione e 1-3 informazioni rivelabili.

````tabs
tab: Prima

> [!scena] Minimo giocabile
> Prepara solo obiettivo, apertura, luogo, PNG, pressione e segreti rivelabili.

tab: Durante

> [!incontro] Al tavolo
> Apri [[Hub/Durante il Gioco]], cattura appunti e rimanda il riordino a dopo.

tab: Dopo

> [!timer] Chiusura
> Apri [[Risorse/Post Sessione Guidato]], poi scegli una reazione in [[Hub/Cosa Succede Fuori Scena]].
````

## Percorso Breve

<!-- workflow:quick_actions:start prima_sessione_rapida -->
> [!regia] Azioni rapide
> Preparare, giocare e chiudere una prima sessione con il minimo indispensabile.
>
> Plugin coinvolti: `Meta Bind`, `Dataview`, `Templater`.
>
> **Controlla setup** - non sai se i pulsanti funzionano
> `BUTTON[setup-guidato-risorse-setup-guidato-2]`
>
> **Prepara** - devi scrivere obiettivo, apertura e poche ancore
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Rendi attiva** - hai scelto quale sessione giocare
> `BUTTON[rendi-sessione-attiva]`
>
> **Gioca** - vuoi aprire il cockpit del tavolo
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> **Chiudi sessione** - il tavolo e finito
> `BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`
>
> **Fuori scena** - devi scegliere una conseguenza o prossima mossa
> `BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`
>
> [!regia]- Minimo giocabile
> Creare solo quello che serve alla prima sessione.
>
> **Nuova sessione** - non esiste ancora una nota sessione
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> **Creazione entita** - non sai cosa compilare su PNG, luogo o fazione
> `BUTTON[creazione-guidata-entita-risorse-creazione-guidata-entita]`
>
> **DM Dashboard** - vuoi vedere lo stato complessivo del tavolo
> `BUTTON[dm-dashboard-1-dm-dashboard]`
<!-- workflow:quick_actions:end prima_sessione_rapida -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "prima_sessione_rapida");
```

## Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderActiveSessionBanner(dv);
```

## Scrivi Solo Questo

| Elemento | Minimo sufficiente |
| --- | --- |
| Obiettivo | Cosa devono decidere, ottenere o scoprire i personaggi. |
| Apertura | La prima scena da giocare. |
| Luogo | Dove puo cambiare qualcosa. |
| PNG | Chi vuole qualcosa adesso. |
| Pressione | Cosa peggiora se nessuno interviene. |
| Segreti | 1-3 informazioni che puoi rivelare. |

## Durante Il Gioco

- Cattura appunti senza riordinare tutto.
- Registra decisioni importanti.
- Segna conseguenze solo quando cambiano davvero mondo, missioni, PNG, luoghi o clock.
- Non sistemare il vault mentre giochi: ordina dopo.

## Dopo La Sessione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPostSessionCommandCenter(dv);
```

## Fallback Markdown

| Passo | Apri |
| --- | --- |
| Preparare | [[Risorse/Preparazione Sessione]] |
| Giocare | [[Hub/Durante il Gioco]] |
| Chiudere | [[Risorse/Post Sessione Guidato]] |
| Vedere reazioni | [[Hub/Cosa Succede Fuori Scena]] |

## Checklist Finale

- [ ] Una sola sessione ha `attiva: true`.
- [ ] La sessione giocata ha un breve resoconto.
- [ ] Missioni e clock hanno stato aggiornato.
- [ ] Almeno una conseguenza ha `entita_impattate` o `propaga_a`.
- [ ] La prossima sessione ha una prima scena.
