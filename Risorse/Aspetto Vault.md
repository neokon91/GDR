---
cssclasses:
  - indice
categoria: risorsa
tipo: aspetto
stato: pronto
---

# Aspetto Vault

Il vault usa il tema **Minimal** con lo snippet `gdr-vault.css`. Le regolazioni principali sono esposte in **Style Settings > GDR Vault**.

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

- Dashboard e indici hanno card compatte, griglie responsive e pulsanti leggibili anche con titoli lunghi.
- Le tabelle Dataview e Markdown restano dense e scorrono lateralmente quando sono troppo larghe.
- I callout GDR hanno colori e icone coerenti per scena, indizio, segreto, incontro, tesoro, PNG, luogo, missione, handout, regola, pericolo, lettura e timer.
- La vista `tavolo` aumenta leggibilità e nasconde i metadati, utile durante la sessione.
- La stampa rimuove elementi dell'interfaccia e nasconde i callout `segreto`.
- Il focus da tastiera resta visibile su pulsanti e link; le animazioni rispettano la preferenza di movimento ridotto del sistema.

## Preset Consigliato

- Tema: Minimal.
- Snippet attivo: `gdr-vault`.
- Palette: Scriptorium.
- Dashboard density: Comfortable.
- Table density: Comfortable.
- Card depth: Soft.

## Regola Pratica

Mantieni l'interfaccia leggibile al tavolo: dashboard più dense, callout riconoscibili, tabelle compatte e niente decorazioni che rallentino la lettura.

## Controllo Prima Di Release

Per verificare che lo snippet sia presente e che la configurazione base del vault sia coerente:

```bash
node z.automazioni/check_vault.js
```
