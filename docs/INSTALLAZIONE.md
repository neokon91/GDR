# Installazione

## Per Utenti Non Tecnici

1. Scarica lo ZIP della release.
2. Estrai la cartella.
3. Apri Obsidian.
4. Scegli "Apri cartella come vault".
5. Se Obsidian chiede conferma per gli strumenti inclusi, abilitali solo se hai scaricato il vault dalla release ufficiale.
6. Apri `Inizia Qui`.
7. Apri `Setup Guidato` e verifica che tutto sia pronto.

## Se Qualcosa Non Funziona

- Apri `Risorse/Primo Avvio Strumenti`.
- Poi apri `Risorse/Se Qualcosa Non Funziona`.
- Se stai usando il repository GitHub invece dello ZIP release, assicurati di avere anche `.obsidian/plugins`.

## Comandi Utili Per Chi Mantiene Il Vault

```bash
npm run check
npm run release:clean
```

`npm run release:clean` genera una copia consegnabile per utenti in `dist/vault-gdr-clean` e, se disponibile, `dist/vault-gdr-clean.zip`.
