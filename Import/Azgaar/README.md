# Import Azgaar

Metti qui gli export da Azgaar Fantasy Map Generator da importare nel vault.

## Formato Consigliato

Usa export strutturati come GeoJSON o CSV quando disponibili.

Non usare `.map` come formato primario per il vault: e il salvataggio interno di Azgaar, utile per riaprire la mappa in Azgaar ma fragile come sorgente diretta per note Obsidian.

## Comando

```bash
npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo"
```

Per controllare cosa verrebbe creato senza scrivere note:

```bash
npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo" --dry-run
```

Il comando crea bozze in `Mondi/Luoghi`. L'utente decide poi cosa rendere canonico.
