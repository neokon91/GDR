---
cssclasses:
  - indice
categoria: risorsa
tipo: sviluppo
stato: pronto
plugin:
  - Linter
---

# Linter E Sviluppo

Linter e utile per manutenzione, non per normalizzare tutto il vault in automatico. In questo vault resta manuale: niente lint on save, niente lint on file change.

## Configurazione Sicura

Regole attive:

- riga vuota dopo YAML;
- limite alle righe vuote consecutive;
- newline finale nel file;
- rimozione spazi finali.

Cartelle ignorate:

- `SRD`, per non riscrivere frontmatter e statblock importati;
- `Risorse/Mappe`, per non toccare file Excalidraw e mappe plugin-heavy;
- `.obsidian`, per evitare rumore su configurazioni plugin.

## Regola Operativa

- Usa Linter su singole note o cartelle piccole dopo una modifica controllata.
- Non lanciare Linter su tutto il vault prima di una release senza controllare il diff.
- Non attivare regole YAML aggressive: array, sort, quote e timestamp possono rompere campi usati da Dataview, Statblocks, Calendarium e template.
