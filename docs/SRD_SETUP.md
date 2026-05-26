# SRD — rigenerazione e peso del repository

La cartella `SRD/` contiene il System Reference Document 5.2.1 in italiano. E materiale regolamentare separato dal canone del mondo: **non modificarlo a mano** nelle note singole.

## Rigenerare lo SRD

Dal root del vault:

```bash
npm run import:srd
```

Lo script `z.automazioni/import_srd.js` scarica o aggiorna il corpus da fonte esterna e riscrive i file in `SRD/`. Usalo dopo un aggiornamento del repository SRD upstream o se la cartella e stata rimossa localmente.

## Clone leggero (stato attuale)

- Lo SRD e **versionato nel repository** perche release, smoke test e riferimenti wikilink nel vault lo assumono presente.
- Un clone senza `SRD/` **non e ancora supportato** come percorso ufficiale: `npm run check` e `npm run release:clean` possono fallire.
- In futuro si potra valutare un submodule Git o un download opzionale in fase di setup; fino ad allora, per sviluppo locale, tieni `SRD/` nel working tree.

## Release consegnabile

`npm run release:clean` include lo SRD nella copia pulita destinata agli utenti finali. Per dettagli operativi vedi anche [[Dev/Sviluppo Vault]] e [[Dev/RELEASE]].
