# z.automazioni

Script usati da Templater, dashboard e manutenzione del vault.

## Script CLI

| File | Uso |
| --- | --- |
| `check_vault.js` | Smoke test locale della struttura del vault. |
| `import_srd.js` | Rigenera il riferimento SRD in `SRD/`. |

## Helper Condivisi

| File | Uso |
| --- | --- |
| `helpers.js` | Funzioni comuni per template Templater. |
| `session_context.js` | Funzioni condivise per dashboard e DataviewJS. |

## Script Di Creazione

Gli altri file `.js` corrispondono ai template in `z.modelli/`. Il nome dello script deve restare coerente con le chiamate `tp.user.*` nei template.

Esempio: `z.modelli/dm/Sessione.md` usa `tp.user.sessione`, quindi lo script deve restare `sessione.js`.

## Controllo

Dal root della repo:

```bash
npm run check
```
