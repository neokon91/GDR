---
cssclasses:
  - indice
categoria: risorsa
tipo: aspetto
stato: pronto
---

# Aspetto Vault

Il vault usa il tema **Minimal** con lo snippet `gdr-vault.css`. Le regolazioni principali sono in **Style Settings > GDR Vault**.

## Controlli Principali

| Impostazione | Cosa cambia |
| --- | --- |
| Palette | Colori di dashboard, callout e accenti GDR |
| Note width | Larghezza delle pagine indice e dashboard |
| Dashboard density | Spaziatura di card, flussi e griglie |
| Table density | Altezza delle righe nelle tabelle |
| Card depth | Ombra delle card, da piatta a rialzata |
| Callout density | Spaziatura interna dei callout |

## Cosa Cura Lo Snippet

- Dashboard e indici hanno card compatte, griglie adattive e pulsanti leggibili anche con titoli lunghi.
- Le viste principali hanno accenti dedicati: DM Dashboard, Worldbuilder Dashboard, Atlante, Durante il Gioco e Vista Giocatori.
- PNG, luoghi, fazioni, missioni, incontri, timeline, segreti e ricompense usano colori coerenti in callout, card ed etichette CSS riutilizzabili.
- Le tabelle Dataview e Markdown restano dense e scorrono lateralmente quando sono troppo larghe.
- I callout GDR hanno colori e icone coerenti per scena, regia, indizio, segreto, incontro, tesoro, ricompensa, PNG, luogo, fazione, missione, handout, regola, pericolo, lettura, timeline e timer.
- La vista `tavolo` aumenta leggibilità e nasconde i metadati, utile durante la sessione.
- La stampa rimuove gli elementi dell'interfaccia e nasconde i callout `segreto`.
- I colori sono volutamente sobri: niente gradienti decorativi, niente velature sovrapposte e accenti abbastanza chiari da restare leggibili con temi chiari e scuri.
- Il focus da tastiera resta visibile su pulsanti e link; le animazioni rispettano la preferenza di movimento ridotto del sistema.

## Attivare Lo Stile

1. Apri **Impostazioni > Aspetto > Snippet CSS**.
2. Attiva lo snippet `gdr-vault`.
3. Se lo snippet non compare, premi il pulsante di ricarica nella sezione Snippet CSS.
4. Consigliato: usa il tema **Minimal** e, se presente, regola **Style Settings > GDR Vault**.

## Classi E Blocchi Utili

- Dashboard operative: usa `cssclasses: [dashboard]` nel frontmatter.
- Schermata da tavolo: usa `cssclasses: [tavolo]`.
- Vista giocatori: usa `cssclasses: [dashboard, gdr-player-view]`.
- Etichette riutilizzabili in HTML/DataviewJS: `gdr-badge png`, `gdr-badge luogo`, `gdr-badge fazione`, `gdr-badge missione`, `gdr-badge incontro`, `gdr-badge timeline`, `gdr-badge segreto`, `gdr-badge ricompensa`.
- Callout tematici: `[!regia]`, `[!scena]`, `[!png]`, `[!luogo]`, `[!fazione]`, `[!missione]`, `[!incontro]`, `[!timeline]`, `[!segreto]`, `[!ricompensa]`, `[!lettura]`, `[!timer]`.

## Preset Consigliato

- Tema: Minimal.
- Snippet attivo: `gdr-vault`.
- Palette: Scriptorium.
- Dashboard density: Comfortable.
- Table density: Comfortable.
- Card depth: Soft.

## Regola Pratica

Mantieni l'interfaccia leggibile al tavolo: dashboard dense ma ordinate, callout riconoscibili, tabelle compatte e nessuna decorazione che rallenti la lettura.
