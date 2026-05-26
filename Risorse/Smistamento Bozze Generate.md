---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Smistamento Bozze Generate

Questa pagina trasforma gli output del Generatore di Contenuti Fantasy in decisioni operative. Le note generate restano bozze finche non hanno almeno un aggancio a mondo, luogo, campagna o sessione.

<!-- workflow:quick_actions:start smistamento_bozze -->
> [!regia] Azioni rapide
> Trasformare bozze generate in note utili, canoniche o archiviate.
>
> Plugin coinvolti: `Meta Bind`, `Dataview`, `Templater`, `Fantasy Content Generator`.
>
> **Generatore fantasy** - vuoi creare una nuova bozza da valutare
> `BUTTON[generatore-fantasy-fantasy-content-generator-open-generator-2]`
>
> **Controllo vault** - vuoi verificare se restano bozze o problemi
> `BUTTON[controllo-vault-risorse-controllo-vault-2]`
>
> **Inbox** - devi tornare alla coda completa degli appunti
> `BUTTON[inbox-inbox-inbox-2]`
>
> **Smista bozza** - la bozza ha un aggancio a mondo, luogo, campagna o sessione
> `BUTTON[smista-bozza-generata]`
>
> **Canonizza bozza** - la bozza e stata confermata in gioco o nel canone
> `BUTTON[canonizza-bozza-generata]`
<!-- workflow:quick_actions:end smistamento_bozze -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "smistamento_bozze");
```

## Coda Di Lavoro

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, campagne, sessioni, stato, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza"
SORT creato ASC, file.ctime ASC
```

## Prossima Bozza Da Decidere

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, campagne, sessioni, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza"
SORT (mondo OR luogo OR campagne OR sessioni) DESC, creato ASC, file.ctime ASC
LIMIT 5
```

> [!regia] Regola pratica
> Una bozza vale tempo solo se diventa aggancio, scena, indizio, mappa, incontro o conseguenza. Se non sai dove collegarla, archiviala o lasciala come spunto non canonico.

## Pronte Da Collegare

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, campagne, sessioni
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza" AND (mondo OR luogo OR campagne OR sessioni)
SORT categoria ASC, tipo ASC, file.name ASC
```

## Senza Aggancio

```dataview
TABLE categoria, tipo, generatore, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza" AND !mondo AND !luogo AND !campagne AND !sessioni
SORT creato ASC, file.ctime ASC
```

## Decisione

| Se la bozza e... | Azione |
| --- | --- |
| utile subito | collega `mondo`, `luogo`, `campagne` o `sessioni`, poi usa `Smista Bozza` |
| interessante ma non canonica | lascia `canonico: false`, collega a mondo o campagna e tienila come spunto |
| diventata vera al tavolo | collega un aggancio e usa `Canonizza Bozza` |
| solo rumore | imposta `stato: archiviata` |
| doppione | collega la nota migliore e archivia questa |

Le azioni automatiche rifiutano una bozza senza aggancio. Il flusso corretto e: generatore -> `Inbox/Generati` -> aggancio -> smistamento -> eventuale canonizzazione.

## Destinazione Consigliata

```dataviewjs
const rows = dv.pages('"Inbox/Generati"')
  .where(p => p.plugin === "fantasy-content-generator" && p.stato === "bozza")
  .map(p => {
    const category = String(p.categoria ?? "");
    const type = String(p.tipo ?? "");
    let target = "Inbox/Generati";

    if (category === "luogo") target = "Mondi/Luoghi";
    if (category === "fazione") target = "Mondi/Fazioni";
    if (category === "personaggio" || type === "png") target = "Mondi/Personaggi";
    if (category === "oggetto") target = "Mondi/Oggetti";
    if (category === "religione") target = "Mondi/Religioni";
    if (category === "generazione" || category === "spunto") target = "Inbox";

    return [p.file.link, category, type, p.generatore ?? "", target];
  });

if (!rows.length) {
  dv.paragraph("Nessuna bozza generata da smistare.");
} else {
  dv.table(["Bozza", "Categoria", "Tipo", "Generatore", "Destinazione"], rows);
}
```

## Dopo Lo Smistamento

- collega la nota canonica alla sessione, missione, luogo o fazione che la usera;
- aggiorna [[Risorse/Controllo Vault]] per verificare che non resti tra le bozze generate;
- se nasce una scena giocabile, collega anche mappa, incontro, dispensa o tabella;
- se produce conseguenze, aggiorna tracciati, missioni o [[Hub/Cosa Succede Fuori Scena]].

## Smistate Dal Generatore

```dataview
TABLE categoria, tipo, stato, canonico, stato_canonico, smistato_il, canonizzato_il, origine_bozza
FROM "Mondi" OR "Inbox"
WHERE plugin = "fantasy-content-generator" AND file.folder != "Inbox/Generati"
SORT smistato_il DESC, file.mtime DESC
LIMIT 20
```
