# Contribuire

Grazie per voler contribuire a Vault GDR.

## Obiettivo Del Prodotto

Il vault deve restare usabile da DM non tecnici. Ogni contributo dovrebbe migliorare una di queste aree:

- onboarding;
- preparazione sessione;
- gioco al tavolo;
- post-sessione;
- worldbuilding;
- vista giocatori;
- release e installazione.

## Regole Di Base

- Non esporre concetti tecnici nel percorso utente principale.
- Preferisci parole come "strumenti", "pulsanti", "dashboard", "vista" invece di plugin, frontmatter o script.
- Non spostare `z.modelli`, `z.automazioni` o dashboard root senza aggiornare tutti i link.
- Ogni nuova dashboard deve avere un uso chiaro.
- Ogni nuova automazione deve essere verificata con `npm run check`.

## Prima Di Aprire Una PR

```bash
npm run check
```

Se tocchi script:

```bash
node -c z.automazioni/nome_script.js
```

Se tocchi release:

```bash
npm run release:clean
npm run check
```

## Tipi Di Contributo Utili

- Screenshot e documentazione.
- Template di campagna o ambientazione.
- Migliorie alla vista giocatori.
- Traduzioni e revisione testi.
- Nuovi controlli di coerenza.
- Bugfix su dashboard o pulsanti.

## Cosa Evitare

- Refactor estetici non necessari.
- Nuovi plugin senza motivazione forte.
- Contenuti protetti da copyright.
