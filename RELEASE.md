# Release

Questa checklist serve a preparare una copia pubblicabile del vault.

## Prima Della Release

1. Apri [[Inizia Qui]] e verifica che i pulsanti portino alle pagine giuste.
2. Apri [[1. DM Dashboard]], [[Durante il Gioco]], [[Atlante del Mondo]], [[Campagna da Ambientazione]] e [[Vista Giocatori]].
3. Apri [[Risorse/Controllo Vault]] e risolvi problemi operativi importanti.
4. Controlla che la demo [[Demo - La Reliquia Spezzata]] sia navigabile.
5. Esegui:

```bash
npm run check
```

6. Aggiorna [[VERSION]].
7. Aggiorna [[CHANGELOG]].
8. Crea la release pulita:

```bash
npm run release:clean
```

9. Crea tag o GitHub Release solo dopo controlli puliti.

## Cosa Non Rimuovere

- `.obsidian/plugins`: contiene plugin e configurazioni necessarie al comportamento custom del vault.
- `.obsidian/snippets/gdr-vault.css`: definisce dashboard, callout e vista tavolo.
- `z.modelli`: template usati dai pulsanti.
- `z.automazioni`: script Templater e controlli tecnici.
- `SRD`: riferimento regolamentare separato dal contenuto canonico.

## Cosa Controllare A Mano

- Le dashboard non mostrano errori Dataview.
- I pulsanti Meta Bind aprono o creano note.
- La vista `Durante il Gioco` mostra una sessione attiva se esiste una sessione con `attiva`, `in corso`, `pronto` o `preparazione`.
- [[Mondi/Stato del Mondo]] mostra conseguenze, PNG cambiati, luoghi in crisi, fazioni in movimento e missioni influenzate senza errori Dataview.
- [[Mondi/Timeline/Timeline]] mostra eventi canonici e lore da sessione.
- Le note demo non sono confuse con le note `Prova -`: la demo e contenuto dimostrativo, le prove sono collaudi tecnici.
- Il README resta leggibile per utenti non tecnici.
- [docs/INSTALLAZIONE.md](docs/INSTALLAZIONE.md) e [docs/STRUMENTI.md](docs/STRUMENTI.md) sono aggiornati.

## Dopo La Release

- Aggiorna il changelog con eventuali fix.
- Tieni le modifiche tecniche documentate in [[Risorse/Sviluppo Vault]].
- Se cambi template importanti, aggiorna almeno una nota demo o una nota `Prova -`.
- Pubblica lo ZIP generato da `dist/vault-gdr-clean.zip`.
