---
cssclasses:
  - indice
categoria: risorsa
tipo: collaudo
stato: archiviata
---

# Prove Entità

Questa pagina raccoglie note di prova non canoniche. Servono per controllare template, campi, callout, Dataview, CSS e collegamenti senza toccare contenuti reali.

Le note di prova usano:

- prefisso `Prova -`;
- `stato: archiviata`, quando possibile;
- `canonico: false`, quando il campo ha senso;
- collegamenti incrociati tra mondo, luoghi, PNG, fazioni, missioni, incontri e oggetti.

Regola pratica: le prove devono comparire qui, ma non nelle dashboard e negli indici usati per preparare o giocare.

Quando aggiungi una nuova prova:

- usa la cartella reale della categoria;
- collega almeno un mondo o una nota vicina, se ha senso;
- evita contenuti canonici;
- controlla che la vista operativa corrispondente la escluda.

## Mondo E Campagna

- [[Mondi/Prova - Mondo]]
- [[Campagne/Prova - Campagna]]

## Personaggi E Religioni

- [[Mondi/Personaggi/Prova - PG]]
- [[Mondi/Personaggi/Prova - PNG]]
- [[Mondi/Religioni/Prova - Divinità]]

## Luoghi

- [[Mondi/Luoghi/Prova - Insediamento]]
- [[Mondi/Luoghi/Prova - Dungeon]]
- [[Mondi/Luoghi/Prova - Regione Naturale]]
- [[Mondi/Luoghi/Prova - Tempio]]
- [[Mondi/Luoghi/Prova - Rovina]]
- [[Mondi/Luoghi/Prova - Interesse]]
- [[Mondi/Luoghi/Prova - Continente]]
- [[Mondi/Luoghi/Prova - Regione]]
- [[Mondi/Luoghi/Prova - Isola]]
- [[Mondi/Luoghi/Prova - Regno]]

## Fazioni

- [[Mondi/Fazioni/Prova - Fazione]]
- [[Mondi/Fazioni/Prova - Gilda]]
- [[Mondi/Fazioni/Prova - Confraternita]]

## Tavolo

- [[Mondi/Missioni/Prova - Missione]]
- [[Mondi/Missioni/Prova - Avventura]]
- [[Mondi/Missioni/Prova - One-Shot]]
- [[Mondi/Incontri/Prova - Incontro]]
- [[Mondi/Incontri/Prova - Trappola]]
- [[Mondi/Incontri/Prova - Pericolo Ambientale]]
- [[Mondi/Sessioni/Prova - Sessione]]

## Materiali

- [[Mondi/Creature/Prova - Creatura]]
- [[Mondi/Oggetti/Prova - Oggetto]]
- [[Mondi/Oggetti/Prova - Oggetto Magico]]
- [[Mondi/Dispense/Prova - Dispensa]]
- [[Risorse/Prova - Risorsa Riutilizzabile]]
- [[Inbox/Prova - Nota Rapida]]

## Controllo Rapido

```dataview
TABLE categoria, tipo, stato, mondo
FROM "Mondi" OR "Campagne" OR "Risorse" OR "Inbox"
WHERE startswith(file.name, "Prova -")
SORT categoria ASC, tipo ASC, file.name ASC
```
