---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Importare Mappe

Questa pagina serve a portare mappe esterne nel vault senza trasformarle automaticamente in canone.

## Regola

La mappa esterna produce bozze. Il DM decide cosa tenere, collegare e rendere canonico.

## Azgaar Fantasy Map Generator

Azgaar e ottimo per generare mondi, stati, culture, burg e geografia. Per il vault la strada consigliata e:

1. crea o apri la mappa in Azgaar;
2. salva il `.map` per poterla riaprire in Azgaar;
3. esporta dati strutturati quando disponibili, per esempio GeoJSON;
4. metti il file in `Import/Azgaar`;
5. importa le bozze nel vault;
6. apri [[Atlante del Mondo]] e collega solo cio che vuoi usare.

## Perche Non Importare Direttamente `.map`

Il `.map` e il formato interno di Azgaar. E utile come salvataggio del progetto, ma non e il formato migliore per creare note Obsidian stabili.

Per il vault sono preferibili:

- GeoJSON per luoghi, regioni e geometrie;
- CSV per liste di citta, stati, culture o religioni;
- SVG/PNG come riferimento visuale;
- note create dal DM per rendere canonico solo cio che serve.

## Comando GeoJSON

```bash
npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo"
```

Per provare senza creare note:

```bash
npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo" --dry-run
```

Esempio incluso:

```bash
npm run import:azgaar -- "Import/Azgaar/Prova - Azgaar.geojson" --world "Demo - Terre della Soglia" --dry-run
```

## Dopo L'Import

1. Apri [[Mondi/Luoghi/Luoghi]].
2. Controlla le note con `fonte: azgaar`.
3. Collega mondo, fazioni, culture e missioni.
4. Porta a `pronto` solo cio che userai.
5. Lascia il resto in `bozza` o archivialo.
