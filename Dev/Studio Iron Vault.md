---
cssclasses:
  - indice
categoria: risorsa
tipo: studio plugin
stato: pronto
---

# Studio Iron Vault

Iron Vault resta fuori dal flusso base D&D/fantasy classico. Non va esposto al DM come requisito della release ZIP, ma vale la pena studiarne la struttura per replicare nel vault alcune funzioni utili con note, template, Dataview, Meta Bind e Dice Roller.

## Struttura Osservata

Dal plugin locale installato:

- `manifest.json`: VTT per Ironsworn/Starforged, non generico D&D.
- `data.json`: configura dadi grafici, personaggi, progress track, clock, contenuti custom e blocchi inline.
- Cartelle predefinite: `Progress`, `Clocks`, `Characters`, `Custom Content`.
- Moduli ricorrenti nel bundle: oracoli, mosse, personaggi, progress track, clocks, index manager e roller.

## Funzioni Da Replicare

| Funzione Iron Vault | Replica utile nel vault | Priorita |
| --- | --- | --- |
| Progress track | Tracciati per missioni, fronti, rituali, minacce e progetti lunghi. | alta |
| Clocks | Orologi di pressione per fazioni, pericoli, dungeon e conseguenze. | alta |
| Active character | Contesto attivo di sessione, PNG o gruppo, simile al Session Context Engine. | media |
| Oracles | Tabelle casuali tematiche con Dice Roller e block id stabili. | alta |
| Moves | Procedure guidate per viaggio, indagine, negoziazione e downtime. | media |
| Custom content | Pacchetti modulari di tabelle, procedure e preset per genere/campagna. | media |
| Inline blocks | Blocchi Markdown leggibili anche senza plugin, con rendering migliorato quando possibile. | alta |

## Decisione Di Prodotto

Non importare Iron Vault nel flusso D&D. Replicare solo i pattern che migliorano il tavolo:

- progressi visibili senza aprire un VTT;
- clock collegati a fazioni e missioni;
- oracoli integrati in [[Risorse/Tabelle/Tabelle]];
- procedure in pagine operative, non in impostazioni plugin;
- contenuti modulari come note Markdown, non come dati chiusi dentro plugin.

## Prossimi Esperimenti

- Fatto: creare un template `Clock` o `Tracciato` per missioni e fronti.
- Fatto: aggiungere una vista in [[Mondi/Stato del Mondo]] per pressioni con avanzamento.
- Estendere [[Risorse/Tabelle/Tabelle]] con oracoli tematici per viaggio, PNG e fazioni.
- Valutare pulsanti Meta Bind per avanzare o ridurre un clock senza modificare YAML a mano.

Regola: se una funzione richiede Iron Vault per essere capita, non entra nel prodotto base.
