---
cssclasses:
  - indice
categoria: risorsa
tipo: tabelle
stato: pronto
---

# Tabelle

## Tiri Rapidi

> [!scena] Al tavolo
> - Complicazione: `dice: [[Risorse/Tabelle/Tabelle#^complicazioni]]`
> - Umore PNG: `dice: [[Risorse/Tabelle/Tabelle#^umore-png]]`
> - Bottino minore: `dice: [[Risorse/Tabelle/Tabelle#^bottino-minore]]`
> - Dettaglio sensoriale: `dice: [[Risorse/Tabelle/Tabelle#^dettagli-sensoriali]]`

## Complicazioni

| d6 | Risultato |
| ---: | --- |
| 1 | Una minaccia avanza fuori scena. |
| 2 | Qualcuno arriva nel momento peggiore. |
| 3 | Una risorsa costa piu del previsto. |
| 4 | Una informazione e vera ma incompleta. |
| 5 | Un alleato chiede qualcosa subito. |
| 6 | Il luogo cambia: rumore, folla, meteo, guardie o pericolo. |
^complicazioni

## Umore PNG

| d6 | Risultato |
| ---: | --- |
| 1 | Diffidente, risponde poco. |
| 2 | Nervoso, vuole chiudere in fretta. |
| 3 | Curioso, fa domande prima di aiutare. |
| 4 | Pragmatico, chiede uno scambio chiaro. |
| 5 | Disponibile, ma ha un problema urgente. |
| 6 | Espansivo, rivela un dettaglio non richiesto. |
^umore-png

## Bottino Minore

| d8 | Risultato |
| ---: | --- |
| 1 | Monete, poche ma subito spendibili. |
| 2 | Oggetto comune utile: corda, torcia, gesso, olio o utensile. |
| 3 | Indizio scritto, simbolo, ricevuta o mappa incompleta. |
| 4 | Chiave, sigillo, parola d'ordine o lasciapassare. |
| 5 | Componente raro ma non prezioso. |
| 6 | Favore promesso da una persona minore. |
| 7 | Oggetto curioso che punta a una fazione o luogo. |
| 8 | Consumabile magico minore o monouso. |
^bottino-minore

## Dettagli Sensoriali

| d10 | Risultato |
| ---: | --- |
| 1 | Odore acre o dolciastro. |
| 2 | Umidita, polvere o cenere sulle mani. |
| 3 | Rumore ripetuto in lontananza. |
| 4 | Luce tremolante, riflesso o ombra fuori posto. |
| 5 | Traccia recente: impronte, graffi, briciole, sangue o fango. |
| 6 | Temperatura diversa dal previsto. |
| 7 | Silenzio improvviso. |
| 8 | Segno di manutenzione, cura o abbandono. |
| 9 | Piccolo animale, insetto o presenza naturale che reagisce. |
| 10 | Dettaglio bello ma inquietante. |
^dettagli-sensoriali

## Archivio

```dataview
LIST
FROM "Risorse/Tabelle"
WHERE file.name != "Tabelle" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
