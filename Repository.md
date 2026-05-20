---
cssclasses:
  - indice
categoria: risorsa
tipo: repository
stato: pronto
---

# Repository

Questa nota e tecnica. Serve solo a chi cura il vault, non al DM che lo usa per preparare o giocare. Per l'uso normale parti da [[Inizia Qui]].

## Aree Principali

| Percorso | Contiene | Regola pratica |
| --- | --- | --- |
| `Inizia Qui.md` | onboarding non tecnico | Deve restare la porta d'ingresso. |
| `1. DM Dashboard.md` | preparazione e vista DM | Non spostare senza aggiornare link, Homepage e documentazione. |
| `Durante il Gioco.md` | schermata al tavolo | Deve restare rapida, non enciclopedica. |
| `Atlante del Mondo.md` | worldbuilding tassonomico | Porta principale per ambientazioni grandi. |
| `Campagna da Ambientazione.md` | da mondo a campagna | Collega regioni e conflitti al gioco. |
| `Vista Giocatori.md` | materiale condivisibile | Non deve mostrare segreti o prossime mosse DM. |
| `Worldbuilder Dashboard.md` | costruzione mondo avanzata | Deve mostrare relazioni, buchi e pressioni, non solo archivi. |
| `Campagne/` | campagne e demo | Contenuto giocabile legato a party e sessioni. |
| `Giocatori/` | indice area giocatori | Area pubblica o condivisibile. |
| `Inbox/` | appunti grezzi e live | Qui entra cio che non e ancora canonico. |
| `Mondi/` | ambientazioni canoniche | Qui stanno luoghi, PNG, fazioni, missioni, incontri e timeline. |
| `Risorse/` | guide, strumenti, mappe, media, tabelle | Materiale riutilizzabile e documentazione del vault. |
| `Risorse/Roadmap/` | roadmap storiche | Archivio manutenzione, non percorso primario del DM. |
| `SRD/` | riferimento regolamentare generato | Non trattare come contenuto canonico del mondo. |
| `z.modelli/` | template Templater | Percorsi richiamati da pulsanti Meta Bind. |
| `z.automazioni/` | script Templater e CLI | Cambiare nomi rompe template e controlli. |
| `z.bacheche/` | board Kanban | Workflow operativo, non archivio permanente. |
| `.obsidian/` | configurazione Obsidian e plugin | Parte del prodotto: non e solo preferenza locale. |

## Cosa Toccare Prima

1. Note operative e dashboard se vuoi migliorare l'esperienza del DM.
2. Template in `z.modelli/` se vuoi cambiare come nascono le note.
3. Script in `z.automazioni/` se vuoi cambiare automazioni o controlli.
4. Plugin/config in `.obsidian/` solo quando sai quale comportamento dipende da quella impostazione.

## Cosa Non Spostare Alla Leggera

- `z.modelli`: Templater e Meta Bind usano percorsi espliciti come `templateFile`.
- `z.automazioni`: i template chiamano helper con `tp.user.nome_script`.
- `.obsidian/plugins`: il vault include plugin e configurazioni necessarie.
- `SRD`: puo essere rigenerato da `z.automazioni/import_srd.js`.
- Note dashboard root: sono linkate da onboarding, plugin Homepage e documentazione.

## Comandi

```bash
npm run check
npm run import:srd
npm run release:clean
```

Se `npm` non e disponibile, usa direttamente:

```bash
node z.automazioni/check_vault.js
node z.automazioni/import_srd.js
node z.automazioni/release_clean.js
```

## Documenti Prodotto

- [docs/STRATEGIA_PRODOTTO.md](docs/STRATEGIA_PRODOTTO.md)
- [docs/INSTALLAZIONE.md](docs/INSTALLAZIONE.md)
- [docs/STRUMENTI.md](docs/STRUMENTI.md)
- [docs/COMPLETAMENTO_PLUGIN.md](docs/COMPLETAMENTO_PLUGIN.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

## Regola Di Chiusura

Ogni modifica strutturale deve passare:

```bash
npm run check
```

Poi apri manualmente in Obsidian:

- [[Inizia Qui]]
- [[1. DM Dashboard]]
- [[Durante il Gioco]]
- [[Atlante del Mondo]]
- [[Campagna da Ambientazione]]
- [[Vista Giocatori]]
- [[Worldbuilder Dashboard]]
