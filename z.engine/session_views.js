// Bridge per le viste DataviewJS future: il codice legacy resta leggibile da z.automazioni
// mentre i template generati possono puntare a z.engine come area di rendering.
(async () => eval(await app.vault.adapter.read("z.automazioni/session_context.js")))()
