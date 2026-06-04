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
   In alternativa, o in parallelo, **itch.io** (vetrina + *name-your-price*) — sotto.

## itch.io (via butler)

itch è il canale di **scoperta** per i Game Master (GitHub resta la sorgente + le issue).
Il caricamento è automatizzato con **butler**, la CLI ufficiale di itch.

**Una-tantum**
1. **Installa butler** — https://itch.io/docs/butler/ (scaricalo, mettilo nel PATH).
2. **`butler login`** — apre il browser, autentica col tuo account itch (la sessione resta
   locale; nessuna credenziale nel repo).
3. **Crea il progetto** su itch.io: tipo **«Downloadable»**, prezzo **free / name-your-price**.
   Annota lo slug «utente/gioco» (es. `tuonome/gdr`).
4. **Imposta il target**: `config.itch` in `package.json` (`"itch": "tuonome/gdr"`) **oppure**
   l'env `ITCH_TARGET=tuonome/gdr`.
5. **Pagina**: incolla titolo, tagline, descrizione e tag da [`docs/itch-page.md`](itch-page.md).

**Ogni release**
```
npm run publish:itch
```
Fa build+zip e poi `butler push` dei due artefatti su due canali:
`…:vault` (il vault Obsidian pronto) e `…:site` (il sito dei giocatori), versionati con la
`version` di package.json. itch tiene lo storico dei build per canale.

> **Turnkey vs lite**: il vault include i plugin (vedi Note). Per una release pubblica
> turnkey va bene (licenze verificate); la variante *lite* (senza `.obsidian/plugins/`) è
> opzionale se vuoi azzerare ogni dubbio sulle licenze altrui.

## Note

- **Licenze dei plugin** (verificato 2026-06-04): tutti e 18 i plugin bundlati sono
  **redistribuibili** — 12 MIT, 3 GPL-3.0, 3 AGPL-3.0. Inclusi **non modificati** come
  *mera aggregazione* (non relicenzia il codice MIT del progetto). L'attribuzione è
  **auto-generata** da `plugins.yaml` (campi `author/repo/license`) nel file
  `THIRD-PARTY-LICENSES.md`, incluso nel vault → nello zip. *Mantieni i plugin non
  modificati*; se ne aggiungi uno, metti i suoi `author/repo/license` (un test lo impone).
  In alternativa, per azzerare ogni dubbio, una release *senza* `.obsidian/plugins/`
  (lite) con i plugin installati al primo avvio.
- **SRD**: il contenuto SRD 5.2.1 è CC-BY-4.0 (attribuzione in `Dev/Source/SRD/LICENSE_SRD`);
  il codice/tooling è MIT. Vedi [README §Licenza](../README.md#licenza).
- **Feedback**: il template issue *🎲 Feedback beta* (`.github/ISSUE_TEMPLATE/`) è già
  pronto per raccogliere segnalazioni dai primi DM.
