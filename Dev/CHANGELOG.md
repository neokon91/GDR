# Changelog

## 1.0.1 - 2026-05-29

Release di riordino repository.

- Release finale pulita come percorso consegnabile standard tramite `npm run release:final`.
- `dist/vault-gdr-clean.zip` resta l'artefatto ZIP verificato dai gate release.
- La repo sorgente parte da YAML/Jinja e tooling proprio; JSON Obsidian, template materializzati, Bases, fileClass, bacheche, SRD e pagine operative restano output generati.
- I bundle plugin e temi Obsidian non sono sorgente tracciato; la ZIP puo includere plugin installati localmente dal manutentore, che l'utente accetta all'apertura.
- `entity_model.yaml` governa categorie e campi insieme a `fields_core.yaml` e `validation_contract.yaml`.
- TemplateFactory ora copre template, hub, risorse, root page, metadati, wrapper Templater e superfici cockpit generate.
- Calendarium e selezionabile come plugin dichiarato, con configurazione e fallback verificati.
- Fantasy Content Generator resta confinato a bozze: smistamento -> canonizzazione passa da workflow, controlli e viste dedicate.
- Smoke statico, fixture runtime e accettazione manuale sostituiscono contenuti dimostrativi mantenuti nota per nota.
- Documentazione mantenuta al minimo: README utente, Dev essenziale, release, smoke, sviluppo tecnico, changelog e TemplateFactory.
