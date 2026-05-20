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

- La demo resta nel vault come esempio e test.
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
| [[Demo - La Reliquia Spezzata]] | Esempio e test del vault. |

## Comando

```bash
npm run release:clean
```

Il comando crea una cartella `dist/vault-gdr-clean` e, se disponibile il comando `zip`, anche `dist/vault-gdr-clean.zip`.

Lo ZIP contiene solo percorso utente, demo, SRD, plugin abilitati e runtime necessario ai pulsanti. Esclude documentazione manutentore, roadmap interne, script CLI di sviluppo e plugin non abilitati.

Per sviluppo e manutenzione si usa il repository Git, non uno ZIP.

## Documentazione Release

- [Installazione](../docs/INSTALLAZIONE.md)
- [Strategia Prodotto](../docs/STRATEGIA_PRODOTTO.md)
- [Matrice Strumenti](../docs/STRUMENTI.md)
