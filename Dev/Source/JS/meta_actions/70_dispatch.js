async function meta_actions(tp, action = "") {
  const file = app.workspace.getActiveFile?.() ?? tp.config?.target_file;
  if (!file) {
    new Notice("Nessuna nota attiva.");
    return "";
  }

  if (action === "marca_canonico") {
    await updateFrontmatter(file, fm => {
      fm.canonico = true;
      if (fm.stato === "bozza") fm.stato = "pronto";
    });
    new Notice("Nota marcata canonica.");
    return "";
  }

  if (action === "archivia") {
    await updateFrontmatter(file, fm => {
      fm.stato = "archiviata";
      fm.archiviata_il = tp.date.now("YYYY-MM-DD");
    });
    new Notice("Nota archiviata.");
    return "";
  }

  if (action === "collega") {
    return await collega(tp, file);
  }

  if (action === "applica_profilo") {
    return await applica_profilo(tp, file);
  }

  if (action === "scatena_conseguenza") {
    return await scatena_conseguenza(tp, file);
  }

  if (action === "avanza_fronte") {
    return await avanza_fronte(file);
  }

  if (action === "giro_del_mondo") {
    // Giro del mondo (motore A): avanza TUTTI i Fronti di un passo; non usa la nota attiva.
    return await giro_del_mondo(tp);
  }

  if (action === "aggiorna_encounter") {
    return await aggiorna_encounter(tp, file);
  }

  if (action === "scaffold_statblock") {
    return await scaffold_statblock(file);
  }

  if (action === "riposo_lungo") {
    return await riposo_lungo(file);
  }

  if (action === "riposo_breve") {
    return await riposo_breve(file);
  }

  if (action === "usa_risorsa") {
    return await usa_risorsa(tp, file);
  }

  if (action === "sali_di_livello") {
    // Motore di level-up PG dedicato (script Templater autonomo).
    if (tp.user && tp.user.sali_pg) return await tp.user.sali_pg(tp);
    new Notice("sali_pg non disponibile."); return "";
  }

  if (action === "genera") {
    // Generatore homebrew di nomi/spunti (script Templater autonomo).
    if (tp.user && tp.user.genera) return await tp.user.genera(tp);
    new Notice("genera non disponibile."); return "";
  }

  if (action === "turno_bastione") {
    return await turno_bastione(tp, file);
  }

  if (action === "world_board") {
    // Genera il World Board (Obsidian Canvas) di un mondo dell'utente (script autonomo).
    if (tp.user && tp.user.world_board) return await tp.user.world_board(tp);
    new Notice("world_board non disponibile."); return "";
  }

  if (action === "inizia_incontro") {
    // Schiera il gruppo: auto-inietta il Party di Initiative Tracker dai PG (non serve file attivo).
    return await inizia_incontro(tp);
  }

  new Notice(`Azione non gestita: ${action}`);
  return "";
}

// Esposto per il test-guardia anti-drift: matchesCond deve dare risultati
// identici alla copia in views.js (le due non devono divergere).
meta_actions.matchesCond = matchesCond;
meta_actions.reciprocalField = reciprocalField;  // esposto per i test
meta_actions.inverseRelation = inverseRelation;  // esposto per i test
meta_actions.appendTurnoLog = appendTurnoLog;    // esposto per i test
meta_actions.rollInline = rollInline;            // esposto per i test
meta_actions.resolveTurno = resolveTurno;        // esposto per i test
meta_actions.playerFromPg = playerFromPg;        // esposto per i test
meta_actions.inizia_incontro = inizia_incontro;  // esposto per i test
meta_actions.avanza_fronte = avanza_fronte;      // esposto per i test
meta_actions.scaffold_statblock = scaffold_statblock;  // esposto per i test
meta_actions.propagaShock = propagaShock;        // esposto per i test (cascata, nucleo puro)
meta_actions.avanzamentoDaPressione = avanzamentoDaPressione;  // esposto per i test
