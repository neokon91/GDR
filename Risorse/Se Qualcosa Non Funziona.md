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

1. Controlla gli strumenti necessari in [[Risorse/Primo Avvio Strumenti]].
2. Riavvia Obsidian dopo averli abilitati o aggiornati.
3. Apri [[1. DM Dashboard]] e poi [[Risorse/Controllo Vault]].
4. Se una vista mostra codice invece del risultato, uno strumento interno probabilmente manca o non e attivo.

## Problemi Comuni

| Sintomo | Probabile causa | Cosa fare |
| --- | --- | --- |
| Le tabelle non compaiono | Dataview disattivato | Abilita Dataview e riapri la nota |
| I pulsanti non funzionano | Meta Bind o Templater disattivati | Abilita entrambi e riprova |
| Le note create sono vuote o sbagliate | Creazione guidata non attiva | Controlla gli strumenti necessari in [[Risorse/Primo Avvio Strumenti]] |
| I mostri non appaiono come schede | Schede creatura non attive | Controlla gli strumenti necessari e riapri la nota creatura |
| I tiri `dice:` restano testo | Tiri rapidi non attivi | Controlla gli strumenti necessari |
| Le date non compaiono nel calendario | Calendario non attivo o data mancante | Controlla gli strumenti necessari e compila la data del mondo |
| Le bacheche non si aprono | Bacheche non attive | Controlla gli strumenti necessari |

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

Se fallisce, correggi prima gli errori segnalati.

## Se Il Vault Resta Rotto

- Apri [[Risorse/Strumenti Attivi]] per capire quale strumento serve a quale funzione.
- Apri [[Risorse/Sviluppo Vault]] solo se devi fare controlli tecnici o manutenzione.
- Se hai modificato manualmente file in `SRD`, controlla [[SRD/Licenza SRD]] e rigenera solo quando sai che le modifiche non verranno perse.
