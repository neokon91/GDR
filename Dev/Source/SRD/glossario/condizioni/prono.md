---
id: dnd.condizione.prono
nome: Prono
attivita:
  # Gli attacchi CONTRO (vant. se entro 1,5 m, altrimenti svant.) sono
  # posizionali: dichiarati in prosa finché non c'è la mappa.
  - tipo: passivo
    effetti:
      - {bersaglio: tiri_colpire, operazione: svantaggio}
---
## Movimento limitato
La creatura può solo strisciare o spendere metà della velocità per rialzarsi.
Se la Velocità è 0, non può rialzarsi.

## Influenza sugli attacchi
La creatura ha Svantaggio ai tiri per colpire.
Gli attacchi contro di lei hanno vantaggio entro 1,5 metri, altrimenti svantaggio.
