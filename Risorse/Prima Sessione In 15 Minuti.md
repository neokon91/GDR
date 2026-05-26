---
cssclasses:
  - indice
categoria: risorsa
tipo: guida rapida
stato: pronto
---

# Prima Sessione In 15 Minuti

Questa guida serve per giocare subito senza capire tutta la struttura del vault. Segui i passi in ordine: prepari una sessione minima, la rendi attiva, giochi, poi trasformi quello che succede in conseguenze.

````tabs
tab: Parti

> [!regia] Avvio Rapido
> `BUTTON[setup-guidato-risorse-setup-guidato-2]`
>
> `BUTTON[inizia-qui-inizia-qui]`
>
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> `BUTTON[durante-il-gioco-durante-il-gioco]`

tab: Sessione

> [!scena] Minimo Giocabile
> Obiettivo, apertura, PNG, luogo, missione, clock e 1-3 segreti bastano per iniziare.
>
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderActiveSessionBanner(dv);
> ```

tab: Dopo

> [!timer] Chiusura
> `BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`
>
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderPostSessionCommandCenter(dv);
> ```

tab: Checklist

> [!todo] Fine Giro
> - [ ] Una sola sessione ha `attiva: true`. #task
> - [ ] La sessione giocata ha un breve resoconto. #task
> - [ ] I fatti veri sono segnati come canonici o collegati. #task
> - [ ] Missioni e clock hanno stato aggiornato. #task
> - [ ] Almeno una conseguenza ha `entita_impattate` o `propaga_a`. #task
> - [ ] La prossima sessione ha una prima scena. #task
````

## Fallback Markdown

| Passo | Dove |
| --- | --- |
| Preparare | [[Risorse/Preparazione Sessione]] |
| Giocare | [[Hub/Durante il Gioco]] |
| Chiudere | [[Risorse/Post Sessione Guidato]] |

## 1. Controlla Che Il Vault Sia Pronto

`BUTTON[setup-guidato-risorse-setup-guidato-2]`

`BUTTON[inizia-qui-inizia-qui]`

`BUTTON[creazione-guidata-entita-risorse-creazione-guidata-entita]`

Se i pulsanti funzionano e le tabelle mostrano testo leggibile, puoi proseguire.




- una campagna con sessioni, PNG, luoghi, missione e clock gia collegati;
- una sessione attiva visibile in [[Hub/Durante il Gioco]];
- un clock che mostra pressione;
- una conseguenza che passa da appunto a canone;
- una prossima mossa fuori scena.

## 3. Crea O Scegli Una Campagna

`BUTTON[dm-dashboard-1-dm-dashboard]`


- una campagna;
- una sessione;
- un luogo;
- un PNG;
- una missione o una domanda centrale;
- un clock se c'e una minaccia che avanza.

## 4. Prepara Solo Il Necessario

`BUTTON[preparazione-sessione-risorse-preparazione-sessione]`

Compila solo questi elementi:

| Elemento | Cosa scrivere |
| --- | --- |
| Obiettivo | Cosa devono decidere o scoprire i personaggi. |
| Apertura | Prima scena da giocare. |
| PNG | Chi vuole qualcosa subito. |
| Luogo | Dove la scena puo cambiare. |
| Missione | Cosa e in gioco. |
| Clock | Cosa peggiora se nessuno interviene. |
| Segreti | 1-3 informazioni rivelabili. |

## 5. Rendi Attiva La Sessione

Apri la nota della sessione e imposta:

- `stato`: `preparazione` o `pronto`;
- `attiva`: acceso.

Tieni una sola sessione attiva alla volta.

## 6. Gioca Dal Tavolo Operativo

`BUTTON[durante-il-gioco-durante-il-gioco]`

Durante la sessione usa questa pagina per:

- vedere sessione, PNG, missioni, incontri e clock;
- creare note rapide;
- catturare eventi o lore;
- creare PNG, luoghi, missioni o clock improvvisati;
- segnare segreti rivelati e conseguenze.

Non sistemare tutto mentre giochi. Cattura prima, ordina dopo.

## 7. Chiudi La Sessione

`BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`

Dopo la partita decidi:

- cosa e diventato canonico;
- quali missioni cambiano stato;
- quali clock avanzano;
- quali PNG o fazioni reagiscono;
- quali conseguenze vanno propagate;
- quale sara la prossima apertura.

## 8. Guarda Cosa Si Muove Fuori Scena

`BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

Scegli almeno una riga da trasformare in gioco:

- una fazione fa una prossima mossa;
- un clock avanza;
- una missione ignorata peggiora;
- un segreto diventa rivelabile;
- una conseguenza cambia un luogo, PNG o relazione.

## Checklist Finale

- [ ] Una sola sessione ha `attiva: true`.
- [ ] La sessione giocata ha un breve resoconto.
- [ ] I fatti veri sono segnati come canonici o collegati.
- [ ] Missioni e clock hanno stato aggiornato.
- [ ] Almeno una conseguenza ha `entita_impattate` o `propaga_a`.
- [ ] La prossima sessione ha una prima scena.
- [ ] [[Hub/Cosa Succede Fuori Scena]] mostra almeno una pressione utilizzabile.
