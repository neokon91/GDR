---
cssclasses:
  - indice
categoria: risorsa
tipo: supporto
stato: pronto
---

# Se Qualcosa Non Funziona

Usa questa pagina quando dashboard, pulsanti, tabelle o statblock non si comportano come previsto.

## Prima Verifica

1. Controlla che i plugin obbligatori in [[Risorse/Installazione Plugin]] siano installati e abilitati.
2. Riavvia Obsidian dopo aver installato o aggiornato plugin.
3. Apri [[1. DM Dashboard]] e poi [[Risorse/Controllo Vault]].
4. Se una vista mostra codice invece del risultato, il plugin collegato probabilmente manca o non e attivo.

## Problemi Comuni

| Sintomo | Probabile causa | Cosa fare |
| --- | --- | --- |
| Le tabelle non compaiono | Dataview disattivato | Abilita Dataview e riapri la nota |
| I pulsanti non funzionano | Meta Bind o Templater disattivati | Abilita entrambi e riprova |
| Le note create sono vuote o sbagliate | Templater non configurato | Controlla che `z.automazioni` sia disponibile come cartella script |
| I mostri non appaiono come schede | Fantasy Statblocks disattivato | Abilita il plugin e riapri la nota creatura |
| I tiri `dice:` restano testo | Dice Roller disattivato | Abilita Dice Roller |
| Le date non compaiono nel calendario | Calendarium disattivato o `fc-date` vuoto | Abilita Calendarium e compila `fc-date` |
| Le bacheche non si aprono | Kanban disattivato | Abilita Kanban |

## Controlli Di Qualita

Prima di usare una copia come release, apri [[Risorse/Controllo Vault]] e verifica:

- nessuno stato fuori standard;
- nessuna nota senza `categoria` o `stato`;
- nessun materiale `pronto` incompleto;
- nessuna data narrativa da calendarizzare, se usi Calendarium;
- nessun link placeholder lasciato in note operative.

Se stai solo usando il vault al tavolo, puoi fermarti qui. Se invece stai preparando una release o mantenendo il vault, esegui anche il controllo tecnico:

```bash
node z.automazioni/check_vault.js
```

Se fallisce, correggi prima gli errori segnalati: di solito riguardano JSON di configurazione, plugin obbligatori, wikilink, template Meta Bind o percorsi Obsidian obsoleti.

## Se Il Vault Resta Rotto

- Apri [[Risorse/Plugin Attivi]] per capire quale plugin serve a quale funzione.
- Apri [[Risorse/Sviluppo Vault]] solo se devi fare controlli tecnici o manutenzione.
- Se hai modificato manualmente file in `SRD`, controlla [[SRD/Licenza SRD]] e rigenera solo quando sai che le modifiche non verranno perse.
