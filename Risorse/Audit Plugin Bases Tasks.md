---
cssclasses:
  - indice
categoria: risorsa
tipo: audit plugin
stato: pronto
aggiornato: 2026-05-20
---

# Audit Plugin Bases Tasks

Questa nota valuta quanto sono sfruttati i plugin gia presenti e come integrare Bases e Tasks senza gonfiare il vault.

## Sintesi

Decisione:

- usare **Bases** subito come layer modificabile sopra metadati stabili;
- usare **Tasks** come plugin supportato per backlog DM, preparazione e post-sessione;
- non usare Tasks per missioni narrative, clock, conseguenze o lore canonica;
- non migrare le dashboard principali da Dataview a Bases.

## Uso Reale Nel Vault

Conteggio su file Markdown del vault, escluso `dist`.

| Segnale | Occorrenze | Lettura |
| --- | ---: | --- |
| `dataview` | 354 | Molto integrato: indici, dashboard e viste operative. |
| `dataviewjs` | 74 | Forte uso per dashboard complesse, controlli e card. |
| `meta-bind` | 304 | Input in blocco ancora usati dove serve una lista editabile. |
| `BUTTON[...]` | 257 | Pulsanti spostati su template globali Meta Bind. |
| input template Meta Bind | 103 | Campi inline ricorrenti compressi con template globali. |
| `dice:` | 401 | Buona copertura per tiri e tabelle casuali. |
| `statblock` | 338 blocchi, 346 frontmatter | Molto sfruttato su SRD e creature. |
| `encounter` | 3 blocchi, 5 inline | Sottoutilizzato: utile solo per combattimenti pronti. |
| `fc-date` | 39 | Calendarium presente ma ancora leggero. |
| `tabs` | 369 | Molto sfruttato, soprattutto su note lunghe e mostri. |
| `.base` | 5 basi, 20 viste tabellari | Bases ora usa viste diverse per priorita, archivio, relazioni e dati marker. |
| `#task` | 0 prima del pilota | Ora usato come filtro globale Tasks. |

## Stato Dopo Il Pilota

Implementato:

- `z.bases/Missioni.base`;
- `z.bases/PNG.base`;
- `z.bases/Luoghi.base`;
- `z.bases/Incontri.base`;
- `z.bases/Atlante Mappe.base`;
- `z.bases/README.md`;
- `#task` sulle checklist delle bacheche in `z.bacheche`.
- [[Risorse/Task DM]] come vista Tasks dei task operativi, con fallback Dataview.
- `.obsidian/plugins/obsidian-tasks-plugin/data.json` con global filter `#task`.

Le viste Bases sono volutamente semplici: leggono frontmatter, permettono correzioni rapide e non duplicano logiche complesse. Ogni base importante ha piu viste tabellari per separare lavoro attivo, pressione, archivio e controllo dei dati.

## Cosa Imparare Da Altri Vault

Fonti controllate:

- Obsidian Help: Bases, syntax, formule e viste;
- Obsidian Community plugin: Tasks, Maps per Bases, QuickAdd, Commander, Leaflet;
- `solorpgstudio/ttrpg-starter-obsidian-vault`;
- `pjjelly17/Community-TTRPG-Obsidian-Vault`;
- `buttonpushertv/buttonpusherTTRPG`;
- lista TTRPG Share della community.

Pattern utili:

| Pattern esterno | Applicazione qui |
| --- | --- |
| Starter vault recenti usano Bases per categorie semplici con frontmatter coerente. | Buono per Missioni, PNG, Luoghi, Incontri, Risorse e Compendium. |
| Vault complessi restano su Dataview per dashboard, import, controlli e aggregazioni. | Mantenere Dataview/DataviewJS come motore principale. |
| Vault con workflow seri separano contenuto canonico da strumenti di lavoro. | Tasks deve gestire lavoro del DM, non diventare modello per missioni o lore. |
| Import mappe esterne spesso genera molto rumore se non e guidato. | Continuare con import Azgaar controllato via script, non aggiungere plugin import generici. |
| Leaflet e comune nei vecchi vault TTRPG, ma ora e meno convincente per release base. | Restare su TTRPG Tools: Maps, Hex Cartographer e futuro Maps per Bases. |

## Bases

Usare Bases per:

- tabelle modificabili di Missioni, PNG, Luoghi, Incontri e mappe;
- viste tabellari alternative sullo stesso dataset, per esempio aperte/archivio, pressione/segreti, per mondo/per sessione;
- viste cards leggere per PNG, risorse o compendium;
- correzione rapida di `stato`, `pressione`, `prossima_mossa`, `luogo`, `fazioni`;
- viste mappa future solo quando `lat`, `lon`, `coordinate`, `tile` o campi equivalenti saranno stabili.

Non usare Bases per:

- dashboard con card HTML e calcoli complessi;
- controlli di qualita con molte condizioni;
- viste che devono leggere task interni, paragrafi o contenuto non in frontmatter;
- logiche gia gestite bene da DataviewJS.

## Tasks

Tasks e supportato per una vista globale del lavoro del DM.

Configurazione attiva:

- global filter: `#task`;
- usare Tasks solo su `z.bacheche`, preparazione, post-sessione e manutenzione;
- lasciare senza `#task` checklist narrative, checklist di pubblicazione e checklist guida;
- usare scadenze solo quando servono davvero, per esempio preparazione entro la prossima sessione.

Query candidata:

```tasks
not done
tag includes #task
path includes z.bacheche
sort by path
sort by description
```

Query post-sessione:

```tasks
not done
tag includes #task
path includes z.bacheche/Post Sessione.md
```

Non trasformare missioni e clock in task. Una missione ha stato, posta, pressione, prossima mossa, conseguenze e collegamenti; una checkbox non basta.

## Priorita Prossime

1. Aprire le `.base` in Obsidian e verificare resa visuale, filtri e ordinamento.
2. Valutare se collegare le basi piu usate anche dalle dashboard, senza sostituire Dataview.
3. Verificare in Obsidian che [[Risorse/Task DM]] mostri solo checklist operative e non checklist di documentazione.
4. Valutare Maps per Bases solo dopo aver deciso campi coordinate per luoghi, rotte e mercati.
5. Non aggiungere QuickAdd o Commander finche non emerge un attrito concreto nei test manuali.
