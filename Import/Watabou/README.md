# Import Watabou

Metti qui gli export Watabou da importare nel vault.

## City Generator

Nel Medieval Fantasy City Generator esporta il JSON della citta. Se hai anche PNG o SVG, salvali nella stessa cartella e collegali poi alla nota mappa creata.

```bash
npm run import:watabou:city -- "Import/Watabou/citta.json" --world "Nome Mondo"
```

Per collegarla subito a una sessione:

```bash
npm run import:watabou:city -- "Import/Watabou/citta.json" --world "Nome Mondo" --session "2026-05-21 - Sessione"
```

Dry-run senza scrittura:

```bash
npm run import:watabou:city -- "Import/Watabou/citta.json" --world "Nome Mondo" --dry-run
```

Il comando crea una bozza luogo in `Mondi/Luoghi` e una bozza mappa in `Risorse/Mappe`.

## One Page Dungeon

Nel One Page Dungeon esporta il JSON del dungeon.

```bash
npm run import:watabou:dungeon -- "Import/Watabou/dungeon.json" --world "Nome Mondo"
```

Per collegarlo subito a una sessione:

```bash
npm run import:watabou:dungeon -- "Import/Watabou/dungeon.json" --world "Nome Mondo" --session "2026-05-21 - Sessione"
```

Dry-run senza scrittura:

```bash
npm run import:watabou:dungeon -- "Import/Watabou/dungeon.json" --world "Nome Mondo" --dry-run
```

Il comando crea una bozza luogo dungeon con elenco stanze, incontri da preparare e dati importati.
