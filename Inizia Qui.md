---
cssclasses:
  - dashboard
categoria: risorsa
tipo: onboarding
stato: pronto
---
# Inizia Qui

Apri, scegli, gioca. Questa e la home dell'app: mostra lo stato reale del vault e la prossima azione sensata.

## Stato App

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderHome(dv);
```

## Cosa Vuoi Fare?

```meta-bind-button
label: Prepara
style: primary
actions:
  - type: open
    link: "[[1. DM Dashboard]]"
```

```meta-bind-button
label: Crea Campagna
style: primary
actions:
  - type: open
    link: "[[Campagna da Ambientazione]]"
```

```meta-bind-button
label: Gioca
style: primary
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

```meta-bind-button
label: Vista Giocatori
style: primary
actions:
  - type: open
    link: "[[Vista Giocatori]]"
```

```meta-bind-button
label: Costruisci Mondo
style: primary
actions:
  - type: open
    link: "[[Atlante del Mondo]]"
```

```meta-bind-button
label: Aiuto
style: default
actions:
  - type: open
    link: "[[Risorse/FAQ]]"
```

```meta-bind-button
label: Risorse
style: default
actions:
  - type: open
    link: "[[Risorse/Risorse]]"
```

```meta-bind-button
label: Setup Guidato
style: default
actions:
  - type: open
    link: "[[Risorse/Setup Guidato]]"
```

## Primo Avvio

1. Se Obsidian chiede se fidarsi degli strumenti inclusi nel vault, conferma solo se hai scaricato il vault da una fonte affidabile.
2. Vai in **Impostazioni > Aspetto > Snippet CSS** e attiva `gdr-vault`; se non compare, ricarica gli snippet.
3. Apri [[Risorse/Setup Guidato]] per vedere se pulsanti, tabelle, creature, tiri e calendario sono pronti.
4. Apri [[Risorse/Consegna Nuovo DM]] se stai ricevendo il vault gia pronto.
5. Apri [[Risorse/Primo Avvio Strumenti]] solo se qualcosa non funziona.
6. Apri [[1. DM Dashboard]] per creare campagne, sessioni, missioni, clock e incontri.
7. Apri una sessione e usa il toggle `attiva` per indicare quale e al tavolo.
8. Apri [[Durante il Gioco]] quando sei al tavolo.
9. Apri [[Risorse/Post Sessione Guidato]] dopo la partita.
10. Apri [[Worldbuilder Dashboard]] quando vuoi creare mondi, luoghi, PNG, fazioni, creature e oggetti.
11. Apri [[Motore Mondo Vivo]] quando una scelta, una guerra, una religione, una fazione o un evento storico deve propagarsi nel mondo e pesare sulle prossime sessioni.
12. Apri [[Geopolitical Dashboard]] quando il conflitto riguarda stati, confini, risorse strategiche, trattati o legittimita politica.
11. Apri [[Risorse/Risorse]] quando cerchi guide, mappe, immagini, audio, video, tabelle o aiuto.

## Se Vedi Questo, Sei Pronto

- I pulsanti qui sopra aprono altre pagine.
- Le tabelle nelle dashboard mostrano righe o messaggi leggibili.
- Le pagine `Prova -` compaiono solo nelle aree di test e non nelle viste operative.
- [[Risorse/Controllo Vault]] non segnala problemi importanti.

## Vuoi Vedere Un Esempio?

Apri [[Demo - La Reliquia Spezzata]]. E una mini-campagna gia collegata a mondo, sessioni, PNG, luoghi, fazione, missione, tracciati, incontro, oggetto e dispensa.

## Cosa Ignorare All'Inizio

- Cartelle `z.*`: sono il motore interno del vault. Ignorale.
- `SRD`: riferimento regolamentare, non contenuto canonico della tua campagna.
- Note `Prova -`: esempi e controlli, non materiale da giocare.
