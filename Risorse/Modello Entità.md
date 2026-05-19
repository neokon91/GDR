# Modello Entità

Questa nota serve a decidere quali categorie usare nel vault GDR e quali template vale la pena creare o migliorare in futuro.

L'obiettivo non è avere una scheda per tutto. L'obiettivo è sapere dove mettere le cose, quando una nota merita un template e quali campi bastano per ritrovarla in gioco.

## Regola Generale

Usa una nota strutturata solo quando serve almeno una di queste cose:

- ritrovarla durante la sessione;
- collegarla a mondo, luogo, PNG, fazione o missione;
- seguirne lo stato;
- riutilizzarla in più sessioni o campagne;
- trasformarla in contenuto canonico.

Se è solo un'idea vaga, parte da [[Inbox/Inbox]] o da [[z.modelli/Nota Rapida]].

## Regola Sulle Cartelle

Le cartelle vanno create quando servono davvero: per una categoria stabile, per una automazione, per una dashboard o per rendere più facile trovare le note al tavolo.

Non bisogna evitare una cartella utile. Bisogna evitare cartelle doppie, speculative o create prima che esista un uso chiaro.

## Campi Comuni Minimi

Quasi tutte le entità dovrebbero avere:

- `nome`
- `categoria`
- `tipo`
- `stato`
- `mondo`, quando appartiene a un'ambientazione precisa
- `canonico`, quando serve distinguere idea e verità del mondo

Campi utili solo quando servono:

- `luogo` o `luoghi`
- `personaggi`
- `fazioni`
- `creature`
- `oggetti`
- `ricompense`
- `sessioni`

## Essenziale Ora

Queste categorie sono già centrali per preparare e giocare.

### Mondi

**A cosa servono:** contenere le verità dell'ambientazione e collegare luoghi, fazioni, religioni e campagne.

**Tipi possibili**

- mondo principale;
- mondo secondario;
- piano o dimensione;
- ambientazione one-shot.

**Quando usarli**

Usa una nota mondo quando ci sono più luoghi, fazioni o campagne che condividono le stesse regole narrative.

**Campi minimi**

- `categoria: mondo`
- `stato`
- `tono`
- `tema`
- `tecnologia`
- `magia`
- `continenti`
- `fazioni`
- `religioni`
- `campagne`
- `canonico`

**Template esistenti da collegare**

- [[z.modelli/Mondo]]

**Template futuri da valutare**

- Piano o dimensione.
- Linea temporale del mondo.

**Priorità**

Essenziale ora: usare [[z.modelli/Mondo]].

Utile dopo: distinguere piano/dimensione solo se diventa frequente.

Da non implementare ancora: template separati per cosmologia completa.

### Personaggi

**A cosa servono:** gestire PG, PNG, divinità e figure importanti.

**Tipi possibili**

- PG;
- PNG, con ruolo al tavolo come alleato, nemico, contatto, patrono o rivale;
- divinità.

Alleati e nemici non sono categorie a parte: si gestiscono sempre come PNG. Il loro ruolo al tavolo va scritto in `ruolo`, nelle relazioni o nelle note della missione/sessione.

**Quando usarli**

Crea una nota personaggio quando il personaggio può tornare, ha relazioni, sa qualcosa o influenza una missione.

**Campi minimi**

- `categoria: personaggio`
- `tipo`
- `ruolo` o `classe`
- `stato`
- `mondo`
- `luogo`
- `fazioni`
- `relazioni`

**Template esistenti da collegare**

- [[z.modelli/Personaggio Router]]
- [[z.modelli/personaggio/PNG]]
- [[z.modelli/personaggio/PG]]
- [[z.modelli/personaggio/Divinità]] vuoto, da valutare

**Template futuri da valutare**

- Antagonista.
- Divinità.

**Priorità**
Essenziale ora: PG e PNG.
Utile dopo: Antagonista, ma solo come variante guidata del PNG, non come categoria autonoma.

### Luoghi
**A cosa servono:** descrivere dove succedono le cose e collegare incontri, PNG, fazioni, segreti e risorse.

**Tipi possibili**
- insediamento: amleto, villaggio, città, capitale, porto, fortezza;
- luogo di interesse: tempio, dungeon, rovina, torre, santuario, accampamento;
- regione naturale: foresta, montagna, palude, deserto, lago, caverna;
- regione politica: regno, ducato, contea, baronia, impero, repubblica, oligarchia.

**Quando usarli**
Crea un luogo quando i personaggi possono andarci, tornarci o parlarne come punto importante della storia.

**Campi minimi**
- `categoria: luogo`
- `tipo`
- `tipologia`
- `bioma`, se utile
- `stato`
- `mondo`
- `luogo_padre`
- `pericolo`
- `fazioni`
- `religioni`
- `risorse`
- `problemi`

**Template esistenti da collegare**
- [[z.modelli/Luogo Router]]
- [[z.modelli/luogo/Insediamento]]
- [[z.modelli/luogo/Interesse]]
- [[z.modelli/luogo/Regione Naturale]]
- [[z.modelli/luogo/Dungeon]]
- [[z.modelli/luogo/Rovina]]
- [[z.modelli/luogo/Tempio]]
- [[z.modelli/geografia/Continente]] vuoto, da valutare
- [[z.modelli/geografia/Regione]] vuoto, da valutare
- [[z.modelli/geografia/Isola]] vuoto, da valutare
- [[z.modelli/politica/Regno]] vuoto, da valutare
- [[z.modelli/politica/Ducato]] vuoto, da valutare
- [[z.modelli/politica/Contea]] vuoto, da valutare
- [[z.modelli/politica/Baronia]] vuoto, da valutare
- [[z.modelli/politica/Impero]] vuoto, da valutare
- [[z.modelli/politica/Repubblica]] vuoto, da valutare
- [[z.modelli/politica/Oligarchia]] vuoto, da valutare

**Template futuri da valutare**

- Regione politica, se regni e territori diventano centrali.
- Continente o isola, se il mondo richiede mappe grandi.
- Quartiere, solo se le città diventano molto dense.

**Priorità**

Essenziale ora: insediamento, luogo di interesse, regione naturale, dungeon, rovina, tempio.

Utile dopo: regione politica.

Da non implementare ancora: template separati per ogni bioma o ogni edificio comune.

### Fazioni

**A cosa servono:** seguire gruppi con obiettivi, potere, leader, agenti e oppositori.

**Tipi possibili**

- gilda;
- confraternita;
- casata;
- ordine militare;
- compagnia mercantile;
- banda criminale;
- movimento ribelle;
- governo;
- culto, quando è più politico che religioso.

**Quando usarli**

Crea una fazione quando il gruppo prende decisioni, muove risorse o reagisce alle azioni dei PG.

**Campi minimi**

- `categoria: fazione`
- `tipo`
- `stato`
- `canonico`
- `mondo`
- `leader`
- `luoghi`
- `personaggi`, per membri, alleati, emissari e nemici gestiti come PNG

Nota: se una fazione è alleata o nemica di un'altra fazione, per ora basta scriverlo nel testo. Non serve trasformare il rapporto tra fazioni in un sistema rigido.

**Template esistenti da collegare**

- [[z.modelli/Fazione Router]]
- [[z.modelli/fazione/Culto]]
- [[z.modelli/fazione/Gilda]] vuoto, da valutare
- [[z.modelli/fazione/Confraternita]] vuoto, da valutare

**Template futuri da valutare**

- Gilda.
- Confraternita o ordine.
- Casata nobile.

**Priorità**

Essenziale ora: fazione generica.

Utile dopo: Gilda e Confraternita.

Da non implementare ancora: template separati per ogni tipo di organizzazione minore.

### Religioni

**A cosa servono:** gestire culti, divinità, dottrine, templi, rituali e segreti.

**Tipi possibili**

- religione;
- culto;
- divinità;
- entità;
- setta;
- ordine religioso.

**Quando usarli**

Crea una religione quando fede, templi, dogmi o entità divine hanno peso nella storia.

**Campi minimi**

- `categoria: religione`
- `tipo`
- `sottotipo`
- `stato`
- `canonico`
- `mondo`
- `divinita`
- `templi`
- `fazioni`

**Template esistenti da collegare**

- [[z.modelli/fazione/Culto]]
- [[z.modelli/luogo/Tempio]]
- [[z.modelli/personaggio/Divinità]] vuoto, da valutare

**Template futuri da valutare**

- Divinità, se deve avere domini, simboli, dogmi e interventi.
- Religione ampia, se il culto singolo diventa troppo stretto.

**Priorità**

Essenziale ora: culto/religione generica e tempio.

Utile dopo: Divinità.

Da non implementare ancora: pantheon completo automatico.

### Creature

**A cosa servono:** preparare mostri, presenze, fauna e minacce con statblock o note di comportamento.

**Tipi possibili**

- aberrazione;
- bestia;
- celestiale;
- costrutto;
- drago;
- elementale;
- folletto;
- gigante;
- immondo;
- melma;
- mostruosità;
- non morto;
- umanoide;
- vegetale.

**Quando usarli**

Crea una creatura quando può comparire in un incontro, lasciare tracce o essere parte dell'ecologia di un luogo.

**Campi minimi**

- `categoria: creatura`
- `tipo`
- `stato`
- `mondo`
- `size`
- `alignment`
- `ac`
- `hp`
- `speed`
- `cr`
- `habitat`
- `luoghi`

**Template esistenti da collegare**

- [[z.modelli/Creatura]]

**Template futuri da valutare**

- Variante creatura.
- Gruppo di creature o branco.

**Priorità**

Essenziale ora: creatura singola.

Utile dopo: variante o branco.

Da non implementare ancora: bestiario avanzato con ecologia obbligatoria per ogni creatura.

### Oggetti

**A cosa servono:** tracciare tesori, oggetti importanti, reliquie e oggetti magici.

**Tipi possibili**

- oggetto comune;
- oggetto magico;
- reliquia;
- indizio fisico;
- chiave;
- tesoro;
- artefatto.

**Quando usarli**

Crea una nota oggetto quando conta chi lo possiede, dove si trova, cosa fa o quale segreto porta.

**Campi minimi**

- `categoria: oggetto`
- `tipo`
- `rarita`
- `stato`
- `canonico`
- `mondo`
- `proprietario`
- `luogo`

**Template esistenti da collegare**

- [[z.modelli/Oggetto]]
- [[z.modelli/Oggetto Magico]]

**Template futuri da valutare**

- Reliquia.
- Indizio fisico.
- Artefatto maggiore.

**Priorità**

Essenziale ora: oggetto e oggetto magico.

Utile dopo: Reliquia.

Da non implementare ancora: template separati per armi, armature, pozioni e pergamene.

### Missioni

**A cosa servono:** seguire obiettivi, incarichi, trame aperte, ostacoli, indizi e ricompense.

**Tipi possibili**

- incarico;
- ricerca;
- mistero;
- salvataggio;
- caccia;
- viaggio;
- fronte;
- trama personale;
- missione di fazione.

**Quando usarli**

Crea una missione quando i PG possono scegliere se seguirla, ignorarla, completarla o fallirla.

**Campi minimi**

- `categoria: missione`
- `tipo`
- `stato`
- `mondo`
- `committente`
- `luoghi`
- `personaggi`
- `fazioni`
- `ricompense`

**Template esistenti da collegare**

- [[z.modelli/dm/Missione]]

**Template futuri da valutare**

- Mistero o indagine.
- Fronte o minaccia in avanzamento.

**Priorità**

Essenziale ora: missione generica.

Utile dopo: Mistero.

Da non implementare ancora: strutture complesse da campagna investigativa se non servono al tavolo.

### Incontri

**A cosa servono:** preparare scene di conflitto, pressione, esplorazione o combattimento.

**Tipi possibili**

- combattimento;
- negoziazione;
- esplorazione;
- ostacolo;
- inseguimento;
- trappola;
- pericolo ambientale;
- scena sociale.

**Quando usarli**

Crea un incontro quando serve una scena pronta con luogo, posta in gioco, pericolo e possibili esiti.

**Campi minimi**

- `categoria: incontro`
- `tipo`
- `stato`
- `luogo`
- `pericolo`
- `creature`
- `personaggi`
- `ricompense`

**Template esistenti da collegare**

- [[z.modelli/dm/Incontro]]
- [[z.modelli/dm/Trappola]] vuoto, da valutare
- [[z.modelli/dm/Pericolo Ambientale]] vuoto, da valutare

**Template futuri da valutare**

- Trappola.
- Pericolo ambientale.
- Scena sociale.

**Priorità**

Essenziale ora: incontro generico.

Utile dopo: Trappola e Pericolo Ambientale.

Da non implementare ancora: template separati per ogni tipo di combattimento.

### Sessioni

**A cosa servono:** preparare la prossima giocata e conservare cosa è successo.

**Tipi possibili**

- sessione di campagna;
- sessione zero;
- sessione finale;
- interludio;
- downtime;
- one-shot giocata.

**Quando usarli**

Crea una sessione per ogni giocata preparata o giocata davvero.

**Campi minimi**

- `categoria: sessione`
- `tipo`
- `data`
- `data_mondo`
- `stato`
- `campagne`
- `luoghi`
- `personaggi`
- `creature`
- `incontri`
- `dispense`
- `fazioni`
- `oggetti`
- `scene`
- `ricompense`

**Template esistenti da collegare**

- [[z.modelli/dm/Sessione]]

**Template futuri da valutare**

- Sessione zero.
- Downtime.

**Priorità**

Essenziale ora: sessione generica.

Utile dopo: Sessione zero.

Da non implementare ancora: template separati per ogni struttura di sessione.

### Dispense

**A cosa servono:** preparare testi, lettere, mappe narrative, profezie, indizi e materiali da consegnare ai giocatori.

**Tipi possibili**

- lettera;
- diario;
- mappa;
- profezia;
- contratto;
- manifesto;
- indizio;
- voce di taverna;
- documento ufficiale.

**Quando usarle**

Crea una dispensa quando qualcosa deve essere letto, mostrato o consegnato ai giocatori.

**Campi minimi**

- `categoria: dispensa`
- `tipo`
- `stato`
- `mondo`
- `luogo`
- `personaggi`
- `sessioni`

**Template esistenti da collegare**

- [[z.modelli/Dispensa]]

**Template futuri da valutare**

- Lettera.
- Diario o frammento.
- Documento ufficiale.

**Priorità**

Essenziale ora: dispensa generica.

Utile dopo: Lettera.

Da non implementare ancora: template separati per ogni forma di testo breve.

## Utile Dopo

Queste categorie possono aiutare, ma solo quando il vault inizia ad avere molte note.

### Risorse Riutilizzabili

**A cosa servono:** tenere materiali non legati a un solo mondo o a una sola campagna.

**Tipi possibili**

- mappa;
- immagine;
- audio;
- video;
- tabella;
- dispensa generica;
- avventura riutilizzabile;
- one-shot riutilizzabile;
- scena pronta;
- incontro riutilizzabile.

**Quando usarle**

Metti una risorsa in [[Risorse/Risorse]] quando può servire in più campagne o mondi.

**Campi minimi**

- `categoria`
- `tipo`
- `stato`
- `uso`
- `collegamenti`

**Template esistenti da collegare**

- [[Risorse/Mappe/Mappe]]
- [[Risorse/Immagini/Immagini]]
- [[Risorse/Audio/Audio]]
- [[Risorse/Video/Video]]
- [[Risorse/Tabelle/Tabelle]]
- [[Risorse/Dispense/Dispense]]
- [[z.modelli/Dispensa]]
- [[z.modelli/dm/Avventura]] vuoto, da valutare
- [[z.modelli/dm/One-Shot]] vuoto, da valutare

**Template futuri da valutare**

- Tabella casuale.
- Mappa.
- Avventura riutilizzabile.
- One-shot riutilizzabile.

**Priorità**

Essenziale ora: usare le pagine indice in Risorse.

Utile dopo: Tabella casuale.

Da non implementare ancora: una scheda per ogni file multimediale.

### Avventure E One-Shot

**A cosa servono:** raggruppare missioni, sessioni, luoghi e incontri in una struttura giocabile.

**Tipi possibili**

- avventura breve;
- arco di campagna;
- one-shot;
- dungeon adventure;
- sandbox locale.

**Quando usarle**

Usale quando una storia è più grande di una missione ma più piccola di una campagna.

**Campi minimi**

- `categoria`
- `tipo`
- `stato`
- `mondo`
- `campagne`
- `luoghi`
- `missioni`
- `incontri`
- `ricompense`

**Template esistenti da collegare**

- [[z.modelli/dm/Avventura]] vuoto, da valutare
- [[z.modelli/dm/One-Shot]] vuoto, da valutare
- [[z.modelli/dm/Campagna]]

**Template futuri da valutare**

- Avventura.
- One-shot.

**Priorità**

Essenziale ora: usare missioni e sessioni.

Utile dopo: Avventura.

Da non implementare ancora: struttura completa da modulo pubblicabile.

## Da Non Implementare Ancora

Queste idee rischiano di appesantire il vault prima che servano davvero.

- Template separati per ogni professione di PNG.
- Template separati per alleato o nemico: restano PNG.
- Template separati per ogni tipo di edificio.
- Schede obbligatorie per ogni mappa, immagine, audio o video.
- Pantheon completo automatico.
- Cosmologia avanzata.
- Economia dettagliata per ogni città.
- Calendari complessi per ogni cultura.
- Template per ogni sottotipo di oggetto.
- Bestiario con ecologia obbligatoria per ogni creatura.
- Dashboard nuove per ogni categoria.

## Prossimi 3 Template Prioritari

1. **Antagonista**: utile come PNG guidato per nemici importanti, non come categoria separata. Campi minimi: `mondo`, `luogo`, `fazioni`, `obiettivo`, `risorse`, `pressione`, `segreto`, `stato`.
2. **Trappola**: il template esiste ma è vuoto. Serve al tavolo perché una trappola ha innesco, indizi, tiro, effetto, disinnesco e conseguenze.
3. **Tabella Casuale**: utile come risorsa riutilizzabile per incontri, voci, tesori, nomi e complicazioni, senza legarla a un solo mondo.

## Nota Di Progettazione

Prima di creare un nuovo template, chiedere:

- Questa cosa torna spesso al tavolo?
- Ha campi diversi da un template già esistente?
- Deve comparire in una dashboard o basta un link?
- Aiuta il DM a preparare più in fretta?
- Evita confusione o crea un'altra scelta da spiegare?

Se la risposta non è chiara, meglio usare un template generico e rimandare.
