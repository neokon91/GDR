# Pubblicare una release

Come confezionare e distribuire il vault. Gli artefatti sono **versionati** e
riproducibili; gli zip vivono in `dist/` (gitignorato) e si **allegano** a una
release — non si committano.

## Cosa esce

`npm run dist` (→ `Dev/Tools/release.py`) fa una build pulita e produce in `dist/`:

| Artefatto | Cos'è |
|---|---|
| `GDR-vault-v<ver>.zip` | Il **vault Obsidian pronto** (plugin inclusi). Si scompatta in una cartella `GDR-vault/` → «Apri cartella come vault». |

Lo stato locale (workspace, cache, `.DS_Store`) è escluso, così lo zip è pulito. *(Il **sito
dei giocatori** non è più un artefatto di release: lo genera il DM in-app dal bottone «Genera
sito» — [[Occhi del giocatore]] — sul suo mondo; vedi README.)*

I **plugin sono bundlati in modo riproducibile e pinnato**: `release.py` invoca
`Dev/Tools/fetch_plugins.py`, che scarica i plugin con `repo`+`version` in
`plugins.yaml` dalle loro **GitHub release** (asset `main.js`/`manifest.json`/
`styles.css`) dentro `dist/GDR-vault/.obsidian/plugins/<id>/` **prima** dello zip.
Non dipende più dai plugin installati a mano sul PC del maintainer → lo zip esce
uguale da un **clone pulito**. Un **gate** (`assert_critical_present`) fa **fallire**
`npm run dist` se manca un plugin `critico`: mai uno zip turnkey rotto in silenzio.

## Passi

1. **Versione**: aggiorna `version` in `package.json` (SemVer). È la single source che
   `release.py` legge per i nomi-file e il tag.
2. **Changelog**: sposta le voci da *Non rilasciato* a `## [<ver>] — AAAA-MM-GG` in
   [`CHANGELOG.md`](../CHANGELOG.md).
3. **Verifica**: `npm run check && npm test` (devono essere verdi).
4. **Pacchetto**: `npm run dist`. Stampa anche il comando `gh` pronto.
5. **Pubblica** (GitHub):
   ```
   gh release create v<ver> dist/GDR-vault-v<ver>.zip \
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
Fa build+zip e poi `butler push` del vault sul canale `…:vault` (il vault Obsidian pronto), versionato con la
`version` di package.json. itch tiene lo storico dei build per canale.

> **Turnkey vs lite**: il vault include i plugin, scaricati e **pinnati** da
> `fetch_plugins.py` (vedi *Cosa esce* e Note). Per una release pubblica turnkey va
> bene (licenze verificate); la variante *lite* (senza `.obsidian/plugins/`) è opzionale
> se vuoi azzerare ogni dubbio sulle licenze altrui — togli i campi `version` da
> `plugins.yaml` così nessun plugin viene bundlato (si installano via BRAT/community al
> primo avvio), e documentalo nel LEGGIMI. NB: i plugin `critico` devono restare pinnati
> (il gate lo impone), quindi la *lite* pura richiede prima di renderli non critici.

## Note

- **Plugin bundlati (pin)**: un plugin si bundla dichiarando in `plugins.yaml` sia
  `repo` sia `version` (il **tag** della GitHub release, che Obsidian impone == versione
  del manifest, **senza** prefisso `v`). `fetch_plugins.py` scarica gli asset di quella
  release e **verifica** che il manifest scaricato dichiari `id`/`version` attesi (pin
  integro). È **idempotente**: salta un plugin già presente alla versione pinnata. Per
  **aggiornare** un plugin, cambia il suo `version` e rilancia `npm run dist` (o
  `python3 Dev/Tools/fetch_plugins.py --force`). Un plugin **senza** `version` non è
  bundlato (si installa via BRAT/community). `npm run check` fallisce se un plugin
  `critico` non è pinnato.
- **Licenze dei plugin** (verificato 2026-06-04): tutti i plugin bundlati sono
  **redistribuibili** — MIT, GPL-3.0, AGPL-3.0. Inclusi **non modificati** come *mera
  aggregazione* (non relicenzia il codice MIT del progetto). L'attribuzione è
  **auto-generata** da `plugins.yaml` (campi `author/repo/license`) nel file
  `THIRD-PARTY-LICENSES.md`, incluso nel vault → nello zip. *Mantieni i plugin non
  modificati*; se ne aggiungi uno, metti i suoi `author/repo/license` (un test lo impone).
  In alternativa, per azzerare ogni dubbio, una release *senza* `.obsidian/plugins/`
  (lite) con i plugin installati al primo avvio.
- **SRD**: il contenuto SRD 5.2.1 è CC-BY-4.0 (attribuzione in `Dev/Source/SRD/LICENSE_SRD`);
  il codice/tooling è MIT. Vedi [README §Licenza](../README.md#licenza).
- **Feedback**: il template issue *🎲 Feedback beta* (`.github/ISSUE_TEMPLATE/`) è già
  pronto per raccogliere segnalazioni dai primi DM.
