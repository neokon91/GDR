---
cssclasses:
  - dashboard
  - gdr-prep-flow
categoria: risorsa
tipo: preparazione
stato: pronto
---

# Preparazione Sessione

Questa pagina deve produrre una sessione giocabile. Non leggere tutto: completa i cinque blocchi minimi e vai al tavolo.

`BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`

`BUTTON[durante-il-gioco-durante-il-gioco]`

## Sessione Da Rendere Giocabile

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPreparationFocus(dv);
```

## I Cinque Blocchi

> [!scena] 1. Obiettivo
> Scrivi una frase: cosa devono ottenere, scoprire o decidere i personaggi entro fine sessione.

> [!luogo] 2. Prima Scena
> Dove si apre la sessione, chi e presente, cosa sta gia succedendo.

> [!missione] 3. Scelta
> Una decisione reale per i giocatori. Se non cambia nulla, non e una scelta.

> [!timer] 4. Pressione
> Una missione, fazione, relazione o clock che avanza se il party perde tempo.

> [!handout] 5. Materiale
> Almeno una cosa pronta da usare: incontro, mappa, handout, PNG o oggetto.

## Prendi Materiale Senza Cercare

````tabs
tab: Missioni

```dataview
TABLE stato, pressione, prossima_mossa, committente, luoghi, personaggi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT pressione DESC, stato ASC, nome ASC
LIMIT 6
```

tab: Pressioni

```dataview
TABLE categoria, tipo, pressione, progress_value, progress_max, prossima_mossa
FROM "Mondi/Relazioni" OR "Mondi/Luoghi" OR "Mondi/Fazioni" OR "Mondi/Tracciati"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pressione >= 6 OR progress_value >= progress_max - 1)
SORT pressione DESC, progress_value DESC
LIMIT 8
```

tab: PNG

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
LIMIT 8
```

tab: Scene

```dataview
TABLE luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE stato = "pronto" AND !startswith(file.name, "Prova -")
SORT pericolo DESC
LIMIT 8
```

tab: Handout

```dataview
TABLE tipo, luogo, personaggi, pubblico
FROM "Mondi/Dispense"
WHERE stato = "pronto" AND !startswith(file.name, "Prova -")
SORT pubblico DESC, nome ASC
LIMIT 8
```
````

## Fatto

Quando i cinque blocchi sono completi:

1. apri la nota sessione;
2. imposta `stato: pronto`;
3. imposta `attiva: true` se e la prossima al tavolo;
4. apri [[Durante il Gioco]].
