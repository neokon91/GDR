# Scheda meccanica del PG

Il template **PG** combina il flusso narrativo del vault (mondo, connessioni, Party Control) con un tab **Scheda** per statistiche, abilità, punti ferita e addestramenti D&D 5.5.

## Cosa trovi nel tab Scheda

- **Identità meccanica**: classe, livello, specie, background, allineamento (lettura Dataview + campi testo).
- **Punti ferita**: slider Meta Bind su `punti_ferita.attuali` / `punti_ferita.massimi`.
- **Sotto-tab**: Statistiche, Abilità, Talenti, Tratti, Addestramento (armature e armi).

I valori sono nel frontmatter strutturato (`caratteristiche`, `abilita`, `punti_ferita`, `addestramento`, …) e modificabili al tavolo con Meta Bind.

## Creare un PG

1. Usa il template **PG** da Templater (`<% await tp.user.pg(tp) %>`).
2. Rispondi ai prompt narrativi (mondo, luogo, fazioni, relazioni) come prima.
3. Se scegli **sì** alla scheda meccanica:
   - metodo caratteristiche (array standard, acquisto punti, manuale);
   - aumenti del background;
   - competenze di classe;
   - scelte tratti di specie (dove previsto).
4. La nota viene salvata in `Mondi/Personaggi/` con frontmatter completo.

## Import dati SRD (sviluppo / aggiornamento vault)

I dati per classi, specie e background non sono hardcoded nello script: provengono da YAML in TemplateFactory.

```bash
npm run import:srd-data
```

Genera:

- `z.automazioni/data/srd/core.json`
- `z.automazioni/data/srd/opzioni_personaggio.json`

Esegui questo comando dopo aver modificato `Dev/TemplateFactory/modules/srd_character_build.yaml` o quando cloni il repository senza i JSON generati.

## Regenerare il template materializzato

In sviluppo:

```bash
npm run render:templates
npm run generate:templates   # oppure release:clean per z.modelli in release
```

Il file utente è `z.modelli/personaggio/PG.md` (materializzato da TemplateFactory).
