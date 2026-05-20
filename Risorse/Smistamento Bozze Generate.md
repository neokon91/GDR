---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Smistamento Bozze Generate

Questa pagina trasforma gli output del Generatore di Contenuti Fantasy in decisioni operative. Le note generate restano bozze finche non hanno almeno un aggancio a mondo, luogo, campagna o sessione.

```meta-bind-button
label: Generatore Fantasy
style: primary
actions:
  - type: command
    command: fantasy-content-generator:open-generator
```

```meta-bind-button
label: Controllo Vault
style: default
actions:
  - type: open
    link: "[[Risorse/Controllo Vault]]"
```

```meta-bind-button
label: Inbox
style: default
actions:
  - type: open
    link: "[[Inbox/Inbox]]"
```

## Coda Di Lavoro

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, stato, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza" AND !startswith(file.name, "Prova -")
SORT creato ASC, file.ctime ASC
```

## Pronte Da Collegare

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, campagne, sessioni
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza" AND !startswith(file.name, "Prova -") AND (mondo OR luogo OR campagne OR sessioni)
SORT categoria ASC, tipo ASC, file.name ASC
```

## Senza Aggancio

```dataview
TABLE categoria, tipo, generatore, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza" AND !startswith(file.name, "Prova -") AND !mondo AND !luogo AND !campagne AND !sessioni
SORT creato ASC, file.ctime ASC
```

## Decisione

| Se la bozza e... | Azione |
| --- | --- |
| utile subito | collega `mondo`, `luogo` o `sessioni`, poi porta `stato` a `pronto` |
| interessante ma non canonica | lascia `canonico: false`, collega a mondo o campagna e tienila come spunto |
| diventata vera al tavolo | spostala o ricreala nella cartella canonica corretta e imposta `canonico: true` |
| solo rumore | imposta `stato: archiviata` |
| doppione | collega la nota migliore e archivia questa |

## Destinazione Consigliata

```dataviewjs
const rows = dv.pages('"Inbox/Generati"')
  .where(p => p.plugin === "fantasy-content-generator" && p.stato === "bozza" && !String(p.file.name).startsWith("Prova -"))
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
- se produce conseguenze, aggiorna tracciati, missioni o [[Cosa Succede Fuori Scena]].
