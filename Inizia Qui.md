---
cssclasses:
  - dashboard
categoria: risorsa
tipo: onboarding
stato: pronto
---

# Inizia Qui

Questa e la pagina introduttiva del vault. Da qui scegli cosa fare: preparare, giocare, costruire il mondo, creare una campagna dall'ambientazione o aprire la vista giocatori.

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

```meta-bind-button
label: Roadmap
style: default
actions:
  - type: open
    link: "[[Risorse/Roadmap 0.7.0]]"
```

## Prossima Azione

```dataviewjs
const active = dv.pages('"Mondi/Sessioni"').where(p => p.attiva === true && p.stato !== "archiviata" && !String(p.file.name).startsWith("Prova -")).array();
const prep = dv.pages('"Mondi/Sessioni"').where(p => p.stato === "preparazione" && !String(p.file.name).startsWith("Prova -")).array();
const openLore = dv.pages('"Inbox"').where(p => p.file.name !== "Inbox" && !["smistata", "archiviata", "ignorata"].includes(p.stato)).array();

if (active.length) {
  dv.paragraph(`Sessione attiva trovata: ${active[0].file.link}. Apri [[Durante il Gioco]].`);
} else if (prep.length) {
  dv.paragraph(`Hai una sessione da preparare: ${prep[0].file.link}. Apri [[Risorse/Preparazione Sessione]].`);
} else if (openLore.length) {
  dv.paragraph(`Ci sono appunti da smistare. Apri [[Inbox/Inbox]] o [[Risorse/Post Sessione Guidato]].`);
} else {
  dv.paragraph("Scegli un percorso qui sopra. Il vault non crea contenuti da solo: sei tu a decidere cosa aprire o generare.");
}
```

## Primo Avvio

1. Se Obsidian chiede se fidarsi degli strumenti inclusi nel vault, conferma solo se hai scaricato il vault da una fonte affidabile.
2. Apri [[Risorse/Setup Guidato]] per vedere se pulsanti, tabelle, creature, tiri e calendario sono pronti.
3. Apri [[Risorse/Consegna Nuovo DM]] se stai ricevendo il vault gia pronto.
4. Apri [[Risorse/Primo Avvio Strumenti]] solo se qualcosa non funziona.
5. Apri [[1. DM Dashboard]] per creare campagne, sessioni, missioni e incontri.
6. Apri una sessione e usa il toggle `attiva` per indicare quale e al tavolo.
7. Apri [[Durante il Gioco]] quando sei al tavolo.
8. Apri [[Risorse/Post Sessione Guidato]] dopo la partita.
9. Apri [[Worldbuilder Dashboard]] quando vuoi creare mondi, luoghi, PNG, fazioni, creature e oggetti.
10. Apri [[Risorse/Risorse]] quando cerchi guide, mappe, immagini, audio, video, tabelle o aiuto.

## Se Vedi Questo, Sei Pronto

- I pulsanti qui sopra aprono altre pagine.
- Le tabelle nelle dashboard mostrano righe o messaggi leggibili.
- Le pagine `Prova -` compaiono solo nelle aree di test e non nelle viste operative.
- [[Risorse/Controllo Vault]] non segnala problemi importanti.

## Dove Scrivere

- Idee vaghe o appunti rapidi: [[Inbox/Inbox]].
- Preparazione e gestione del tavolo: [[1. DM Dashboard]].
- Trasformare ambientazione in campagna: [[Campagna da Ambientazione]].
- Vista condivisibile con i giocatori: [[Vista Giocatori]].
- Appunti durante la sessione: [[Durante il Gioco]].
- Eventi live, PNG improvvisati, luoghi improvvisati e conseguenze: sezione Inbox Live in [[Durante il Gioco]] o [[Inbox/Inbox]].
- Consolidamento dopo sessione: [[Risorse/Post Sessione Guidato]].
- Materiali della sessione attiva: [[Risorse/Materiali Al Tavolo]].
- Mondo, luoghi, PNG e fazioni: [[Worldbuilder Dashboard]].
- Ambientazioni grandi, culture, lingue e storia: [[Atlante del Mondo]].
- Stato dinamico del mondo: [[Mondi/Stato del Mondo]].
- Profili per nuove campagne: [[Risorse/Profili Campagna]].
- Guide, mappe, media, tabelle e aiuto: [[Risorse/Risorse]].
- Controllo iniziale del vault: [[Risorse/Setup Guidato]].
- Regole e riferimento D&D: [[SRD/SRD]].
- Domande frequenti: [[Risorse/FAQ]].

## Vuoi Vedere Un Esempio?

Apri [[Demo - La Reliquia Spezzata]]. E una mini-campagna gia collegata a mondo, sessioni, PNG, luoghi, fazione, missione, incontro, oggetto e dispensa.

## Cosa Ignorare All'Inizio

- Cartelle `z.*`: sono il motore interno del vault. Ignorale.
- `SRD`: riferimento regolamentare, non contenuto canonico della tua campagna.
- Note `Prova -`: esempi e controlli, non materiale da giocare.
