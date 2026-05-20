---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Release Pulita

Questa pagina serve a preparare una copia consegnabile del vault.

## Regole

- La release pulita deve evitare file di lavoro, cache e cartelle di sviluppo non necessarie.
- La creazione di contenuti resta scelta dell'utente: la release non genera campagne reali automaticamente.

## Cosa Contiene

| Area | Uso |
| --- | --- |
| [[Inizia Qui]] | Pagina introduttiva all'apertura. |
| [[Vista Giocatori]] | Vista condivisibile per i giocatori. |
| [[Atlante del Mondo]] | Worldbuilding avanzato. |
| [[Bibbia del Mondo]] | Coerenza di tono, temi, verita e limiti. |
| [[Motore Mondo Vivo]] | Propagazione, causalita e continuita narrativa. |
| [[Geopolitical Dashboard]] | Territori politici, risorse e relazioni diplomatiche. |
| [[Campagna da Ambientazione]] | Da mondo a campagna. |

## Comando

Prima verifica il repository:

```bash
npm run check
```

Poi genera la copia utente:

```bash
npm run release:clean
```

Il comando crea una cartella `dist/vault-gdr-clean` e, se disponibile il comando `zip`, anche `dist/vault-gdr-clean.zip`.


Per sviluppo e manutenzione si usa il repository Git, non uno ZIP.

## Ultima Verifica Automatica

2026-05-21:

- `npm run check` passato senza warning.
- `npm run release:clean` ha creato `dist/vault-gdr-clean`.
- `npm run release:clean` ha creato `dist/vault-gdr-clean.zip`.
- `dist/` resta artefatto locale ignorato da Git.

Questa sezione e verificata da `npm run check`: se versione, changelog o verifica release non sono allineati, il controllo fallisce.
