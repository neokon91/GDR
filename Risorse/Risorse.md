---
cssclasses:
  - indice
---

# Risorse

## Materiale Rapido

- [[Risorse/Guida DM]]
- [[Risorse/Installazione Plugin]]
- [[Risorse/Se Qualcosa Non Funziona]]
- [[Risorse/Controllo Vault]]
- [[Risorse/Sviluppo Vault]]
- [[Risorse/Preparazione Sessione]]
- [[Risorse/Plugin Attivi]]
- [[Risorse/Aspetto Vault]]
- [[Risorse/Integrazioni Plugin]]
- [[Risorse/Callout GDR]]
- [[SRD/SRD]]
- [[Inbox/Inbox]]
- [[Risorse/Mappe/Mappe]]
- [[Risorse/Immagini/Immagini]]
- [[Risorse/Audio/Audio]]
- [[Risorse/Video/Video]]
- [[Risorse/Tabelle/Tabelle]]
- [[Risorse/Dispense/Dispense]]

## Mappe

```dataview
LIST
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Immagini

```dataview
LIST
FROM "Risorse/Immagini"
WHERE file.name != "Immagini" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Audio

```dataview
LIST
FROM "Risorse/Audio"
WHERE file.name != "Audio" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Tabelle

```dataview
LIST
FROM "Risorse/Tabelle"
WHERE file.name != "Tabelle" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```

## Dispense

```dataview
LIST
FROM "Risorse/Dispense"
WHERE file.name != "Dispense" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
