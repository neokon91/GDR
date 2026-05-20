---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Risorse

Questa pagina raccoglie guide e materiali riutilizzabili. Se vuoi preparare o giocare, parti da [[Inizia Qui]], [[1. DM Dashboard]] o [[Durante il Gioco]].

## Uso Quotidiano

| Pagina | Quando aprirla |
| --- | --- |
| [[Inizia Qui]] | Quando non sai da dove partire. |
| [[Risorse/Guida DM]] | Quando vuoi il flusso DM senza dettagli tecnici. |
| [[Risorse/Preparazione Sessione]] | Prima di una sessione. |
| [[Durante il Gioco]] | Durante la partita. |
| [[Risorse/Tabelle/Tabelle]] | Quando serve improvvisare con tiri e tabelle. |
| [[Inbox/Inbox]] | Quando devi smistare idee grezze. |
| [[Risorse/FAQ]] | Quando hai un dubbio d'uso. |

## Materiali Al Tavolo

| Area | Uso |
| --- | --- |
| [[Risorse/Mappe/Mappe]] | Mappe, schemi e riferimenti visuali. |
| [[Risorse/Immagini/Immagini]] | Immagini, ritratti, luoghi e handout visuali. |
| [[Risorse/Audio/Audio]] | Musica, atmosfera e audio da sessione. |
| [[Risorse/Video/Video]] | Video, reference e timestamp utili. |
| [[Risorse/Dispense/Dispense]] | Materiali generici da consegnare o riusare. |
| [[SRD/SRD]] | Riferimento regolamentare, separato dal mondo canonico. |

## Strumenti E Aspetto

| Pagina | Uso |
| --- | --- |
| [[Risorse/Primo Avvio Strumenti]] | Cosa fare se Obsidian chiede di abilitare gli strumenti inclusi. |
| [[Risorse/Strumenti Attivi|Strumenti Attivi]] | Quali strumenti sono disponibili nel vault, spiegati per uso pratico. |
| [[Risorse/Callout GDR]] | Callout disponibili per scene, indizi, segreti e pericoli. |
| [[Risorse/Aspetto Vault]] | Regolazioni visuali semplici. |
| [[Risorse/Se Qualcosa Non Funziona]] | Diagnosi rapida quando pulsanti, tabelle o viste non rispondono. |

## Controllo Del Vault

| Pagina | Uso |
| --- | --- |
| [[Risorse/Controllo Vault]] | Controlli pratici su note incomplete, sessioni attive e materiale pronto. |
| [[Risorse/Prove Entità]] | Esempi per capire come dovrebbero apparire le note. |
| [[VERSION]] | Versione corrente del vault. |
| [[CHANGELOG]] | Cronologia modifiche. |

## Archivio Mappe

```dataview
LIST
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Archivio Immagini

```dataview
LIST
FROM "Risorse/Immagini"
WHERE file.name != "Immagini" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Archivio Audio

```dataview
LIST
FROM "Risorse/Audio"
WHERE file.name != "Audio" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Archivio Video

```dataview
LIST
FROM "Risorse/Video"
WHERE file.name != "Video" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Archivio Tabelle

```dataview
LIST
FROM "Risorse/Tabelle"
WHERE file.name != "Tabelle" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Archivio Dispense

```dataview
LIST
FROM "Risorse/Dispense"
WHERE file.name != "Dispense" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
