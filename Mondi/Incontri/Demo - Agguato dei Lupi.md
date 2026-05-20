---
id: demo-agguato-dei-lupi
nome: "Demo - Agguato dei Lupi"
categoria: incontro
fileClass: incontro
tipo: combattimento
stato: pronto
mondo: "[[Demo - Terre della Soglia]]"
luogo: "[[Demo - Ponte delle Campane]]"
luoghi:
  - "[[Demo - Ponte delle Campane]]"
creature:
  - "[[SRD/Mostri/Lupo|Lupo]]"
encounter_creatures:
  - "2: Lupo"
personaggi:
  - "[[Demo - Mira Ventofermo]]"
mappe:
  - "[[Demo - Scena Ponte.excalidraw]]"
audio:
  - "[[Demo - Nebbia Sul Ponte]]"
pericolo: 5
round: 1
condizioni:
  - visibilita ridotta oltre 9 metri
  - terreno scivoloso vicino al fiume
---

# Demo - Agguato dei Lupi

> [!incontro] Setup
> Due lupi emergono dalla nebbia quando qualcuno attraversa il centro del ponte o prova a forzare il blocco dei Custodi.

> [!pericolo] Terreno
> - Visibilita ridotta oltre 9 metri.
> - Il parapetto rotto offre copertura parziale ma impone attenzione ai movimenti laterali.
> - La campana incrinata vibra all'inizio di ogni round pari.

## Initiative Tracker

```encounter
name: Demo - Agguato dei Lupi
players: true
creatures:
  - 2: Lupo
```

## Tattiche

- I lupi cercano vantaggio circondando chi resta isolato.
- Se un lupo scende sotto meta punti ferita, arretra nella nebbia e prova a richiamare rinforzi.
- Mira interrompe il combattimento solo se i personaggi minacciano il ponte o la campana.

## Esiti

- Se i personaggi vincono rapidamente, trovano impronte umide che portano al santuario.
- Se il combattimento si allunga, la nebbia avanza e il prossimo incontro parte con pressione maggiore.
