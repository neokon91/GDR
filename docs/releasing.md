# Pubblicare una release

Come confezionare e distribuire il vault. Gli artefatti sono **versionati** e
riproducibili; gli zip vivono in `dist/` (gitignorato) e si **allegano** a una
release — non si committano.

## Cosa esce

`npm run dist` (→ `Dev/Tools/release.py`) fa una build pulita e produce in `dist/`:

| Artefatto | Cos'è |
|---|---|
| `GDR-vault-v<ver>.zip` | Il **vault Obsidian pronto** (plugin inclusi). Si scompatta in una cartella `GDR-vault/` → «Apri cartella come vault». |
| `GDR-site-v<ver>.zip` | Il **sito dei giocatori** statico (spoiler-free). Demo del differenziatore; pubblicabile su Pages/Netlify. |

Lo stato locale (workspace, cache, `.DS_Store`) è escluso, così lo zip è pulito.

## Passi

1. **Versione**: aggiorna `version` in `package.json` (SemVer). È la single source che
   `release.py` legge per i nomi-file e il tag.
2. **Changelog**: sposta le voci da *Non rilasciato* a `## [<ver>] — AAAA-MM-GG` in
   [`CHANGELOG.md`](../CHANGELOG.md).
3. **Verifica**: `npm run check && npm test` (devono essere verdi).
4. **Pacchetto**: `npm run dist`. Stampa anche il comando `gh` pronto.
5. **Pubblica** (GitHub):
   ```
   gh release create v<ver> dist/GDR-vault-v<ver>.zip dist/GDR-site-v<ver>.zip \
     --title "GDR v<ver>" --notes-file CHANGELOG.md
   ```
   In alternativa, pagina **itch.io** (vetrina + *name-your-price*): carica gli stessi zip.

## Note

- **Licenze dei plugin**: il vault distribuito include i plugin community (turnkey).
  Sono per lo più MIT (redistribuzione lecita con nota di copyright), ma **verifica**
  ogni plugin prima di una release pubblica; in alternativa distribuisci un vault
  *senza* `.obsidian/plugins/` e affidati a BRAT/community-install al primo avvio.
- **SRD**: il contenuto SRD 5.2.1 è CC-BY-4.0 (attribuzione in `Dev/Source/SRD/LICENSE_SRD`);
  il codice/tooling è MIT. Vedi [README §Licenza](../README.md#licenza).
- **Feedback**: il template issue *🎲 Feedback beta* (`.github/ISSUE_TEMPLATE/`) è già
  pronto per raccogliere segnalazioni dai primi DM.
