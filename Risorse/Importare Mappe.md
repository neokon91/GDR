---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Importare Mappe

Questa pagina serve a portare mappe esterne nel vault senza trasformarle automaticamente in canone.

````tabs
tab: Scegli

> [!mappa] Fonte
> | Fonte | Quando usarla | Comando |
> | --- | --- | --- |
> | Dispatch unico | Scegli una sorgente senza ricordare il comando specifico. | `npm run import:map` |
> | Azgaar GeoJSON | Continenti, stati, regioni, burg e geografia ampia. | `npm run import:azgaar` |
> | Watabou City JSON | Una citta o insediamento dettagliato. | `npm run import:watabou:city` |
> | Watabou One Page Dungeon JSON | Un dungeon rapido da rifinire. | `npm run import:watabou:dungeon` |

tab: Dry Run

> [!regia] Prova Senza Scrivere
> ```bash
> npm run import:map -- azgaar "Import/Azgaar/mappa.geojson" --world "Nome Mondo" --dry-run
> npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo" --dry-run
> npm run import:watabou:city -- "Import/Watabou/citta.json" --world "Nome Mondo" --dry-run
> npm run import:watabou:dungeon -- "Import/Watabou/dungeon.json" --world "Nome Mondo" --dry-run
> ```

tab: Dopo

> [!todo] Canonizza Solo Cio Che Serve
> ```tasks
> not done
> path includes Inbox/Generati
> sort by priority
> ```
>
> - [ ] Apri [[Mondi/Luoghi/Luoghi]]. #task
> - [ ] Collega mondo, fazioni, culture e missioni. #task
> - [ ] Porta a `pronto` solo cio che userai. #task
> - [ ] Lascia il resto in `bozza` o archivialo. #task

tab: Viste

> [!regia] Dove Controllare
> - [[Atlante del Mondo]]
> - [[z.bases/Atlante Mappe.base]]
> - [[Risorse/Mappe/Mappe]]
> - [[Risorse/Smistamento Bozze Generate]]
````

## Fallback Markdown

| Fonte | Risultato |
| --- | --- |
| Azgaar | Bozze luogo/geografia |
| Watabou City | Bozza insediamento + mappa |
| Watabou Dungeon | Bozza dungeon |

## Regola

La mappa esterna produce bozze. Il DM decide cosa tenere, collegare e rendere canonico.

## Scegli Fonte

| Fonte | Quando usarla | Comando |
| --- | --- | --- |
| Azgaar GeoJSON | Continenti, stati, regioni, burg e geografia ampia. | `npm run import:azgaar` |
| Watabou City JSON | Una citta o insediamento dettagliato. | `npm run import:watabou:city` |
| Watabou One Page Dungeon JSON | Un dungeon rapido da trasformare in stanze, incontri e indizi. | `npm run import:watabou:dungeon` |

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

Comando unico:

```bash
npm run import:map -- azgaar "Import/Azgaar/mappa.geojson" --world "Nome Mondo"
```

Comando diretto:

```bash
npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo"
```

Per provare senza creare note:

```bash
npm run import:azgaar -- "Import/Azgaar/mappa.geojson" --world "Nome Mondo" --dry-run
```

Esempio di dry-run:

```bash
```

## Watabou City

Watabou City e utile quando hai gia deciso che un insediamento conta davvero. Esporta il JSON della citta e, se vuoi, salva PNG/SVG nella stessa cartella come riferimento visuale.

```bash
npm run import:watabou:city -- "Import/Watabou/citta.json" --world "Nome Mondo"
```

Per provare senza creare note:

```bash
npm run import:watabou:city -- "Import/Watabou/citta.json" --world "Nome Mondo" --dry-run
```

Il comando crea:

- una bozza luogo in `Mondi/Luoghi`;
- una bozza mappa in `Risorse/Mappe`;
- collegamenti reciproci tra citta e mappa.

## Watabou One Page Dungeon

Watabou Dungeon e utile per produrre una bozza tattica da rifinire prima del tavolo.

```bash
npm run import:watabou:dungeon -- "Import/Watabou/dungeon.json" --world "Nome Mondo"
```

Per provare senza creare note:

```bash
npm run import:watabou:dungeon -- "Import/Watabou/dungeon.json" --world "Nome Mondo" --dry-run
```

Il comando crea una bozza luogo dungeon con elenco stanze e una checklist minima per trasformarlo in incontri, trappole o indizi.

## Dopo L'Import

1. Apri [[Mondi/Luoghi/Luoghi]].
2. Controlla le note con `fonte: azgaar`, `fonte: watabou-city` o `fonte: watabou-dungeon`.
3. Collega mondo, fazioni, culture e missioni.
4. Porta a `pronto` solo cio che userai.
5. Lascia il resto in `bozza` o archivialo.
