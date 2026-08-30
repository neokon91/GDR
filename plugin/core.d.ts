// GENERATO da Dev/Tools/gen_plugin_types.py — NON editare a mano.
// Sorgente: il modello fuso (core.yaml + entities/*.yaml), _panels.mjs e
// model_cfg._PLUGIN_ACTIONS. Rigenera con `npm run gen:types` (in plugin/).
// Un test pytest (test_plugin_types) fallisce se questo file è disallineato.

/** Le categorie del modello (folders/categories delle entità). */
export type Categoria =
  | 'albero_evolutivo'
  | 'background'
  | 'bastione'
  | 'bioma'
  | 'calamita'
  | 'classe'
  | 'condizione'
  | 'cosmologia'
  | 'creatura'
  | 'culto'
  | 'cultura'
  | 'divinita'
  | 'dominio'
  | 'ecosistema'
  | 'editto'
  | 'entita_primordiale'
  | 'epoca'
  | 'esercito'
  | 'evento'
  | 'fazione'
  | 'incantesimo'
  | 'incontro'
  | 'indizio'
  | 'insidia'
  | 'legge_fondamentale'
  | 'lingua'
  | 'luogo'
  | 'missione'
  | 'mito'
  | 'mondo'
  | 'nota'
  | 'oggetto'
  | 'personaggio'
  | 'piano'
  | 'profezia'
  | 'regno'
  | 'regola'
  | 'risorsa'
  | 'rotta'
  | 'scena'
  | 'sessione'
  | 'sistema_magico'
  | 'sottoclasse'
  | 'specie'
  | 'tabella'
  | 'talento';

/** Gli stati del ciclo di vita di una nota (core.yaml: states). */
export type Stato =
  | 'bozza'
  | 'pronto'
  | 'in gioco'
  | 'giocata'
  | 'archiviata';

/** I pannelli ```gdr resi dal plugin (_panels.mjs: PANELS). */
export type PanelName =
  | 'renderAlbero'
  | 'renderAttacchi'
  | 'renderAxesCompare'
  | 'renderCausalita'
  | 'renderClock'
  | 'renderCoerenza'
  | 'renderCondizioni'
  | 'renderConnessioni'
  | 'renderDiagnostica'
  | 'renderDintorni'
  | 'renderEncounter'
  | 'renderEntityPanel'
  | 'renderFiloAvventura'
  | 'renderIncantesimi'
  | 'renderMaestrie'
  | 'renderMap'
  | 'renderMemoria'
  | 'renderPressioni'
  | 'renderProfilo'
  | 'renderProgressione'
  | 'renderProiezione'
  | 'renderRisorsePG'
  | 'renderSessionPanel'
  | 'renderSpecieTratti'
  | 'renderStatoMondo'
  | 'renderTabella'
  | 'renderTappe'
  | 'renderTemaNatale'
  | 'renderTensioni'
  | 'renderTimeline'
  | 'renderTimelineCorsie'
  | 'renderTipoProfilo'
  | 'renderVerificaGS'
  | 'renderViaggio'
  | 'renderWorldMap';

/** Gli id dei template di creazione (entities/*.yaml). */
export type TemplateId =
  | 'albero_evolutivo'
  | 'background'
  | 'bastione'
  | 'bioma'
  | 'calamita'
  | 'classe'
  | 'condizione'
  | 'cosmologia'
  | 'creatura'
  | 'culto'
  | 'cultura'
  | 'divinita'
  | 'dominio'
  | 'ecosistema'
  | 'editto'
  | 'entita_primordiale'
  | 'epoca'
  | 'esercito'
  | 'evento'
  | 'fazione'
  | 'incantesimo'
  | 'incontro'
  | 'indizio'
  | 'insidia'
  | 'legge_fondamentale'
  | 'lingua'
  | 'luogo'
  | 'missione'
  | 'mito'
  | 'mondo'
  | 'nota_rapida'
  | 'oggetto'
  | 'oggetto_magico'
  | 'pg'
  | 'piano'
  | 'png'
  | 'profezia'
  | 'regno'
  | 'regola'
  | 'risorsa'
  | 'rotta'
  | 'scena'
  | 'sessione'
  | 'sistema_magico'
  | 'sottoclasse'
  | 'specie'
  | 'tabella'
  | 'talento';

/** Le azioni del dispatcher esposte come comandi gdr:<azione> (model_cfg._PLUGIN_ACTIONS). */
export type AzioneId =
  | 'applica_profilo'
  | 'archivia'
  | 'avanza_fronte'
  | 'collega'
  | 'genera'
  | 'genera_sito'
  | 'giro_del_mondo'
  | 'importa_azgaar'
  | 'importa_mappa'
  | 'inserisci_componente'
  | 'marca_canonico'
  | 'riposo_breve'
  | 'riposo_lungo'
  | 'sali_di_livello'
  | 'scaffold_statblock'
  | 'scatena_conseguenza'
  | 'sincronizza_pin'
  | 'tira_tabella'
  | 'turno_bastione'
  | 'usa_risorsa'
  | 'world_board';

/** Un template di creazione (voce di core.json:templates). */
export interface Template {
  id: TemplateId;
  title: string;
  category: Categoria;
  target: string;
  jinja?: string;
}

/** Metadati di una categoria (core.json:categories[cat]); campi noti + resto libero. */
export interface CategoriaMeta {
  subtypes?: { nome: string; descrizione?: string }[];
  subtype_profiles?: boolean;
  famiglie?: { nome: string }[];
  [k: string]: unknown;
}

/** Un plugin essenziale per la Diagnostica (core.json:plugins). */
export interface PluginInfo {
  id: string;
  name: string;
  rompe: string;
}

/**
 * La forma di `z.automazioni/data/core.json` che il plugin legge (loadCore()).
 * I campi che main.ts usa sono tipizzati con precisione; il resto è `unknown`
 * (dato per views.js/meta_actions.js, non toccato dal plugin) — vedi engine_payload.
 */
export interface CoreData {
  folders: Partial<Record<Categoria, string>>;
  categories: Record<Categoria, CategoriaMeta>;
  states: Stato[];
  templates: Template[];
  canvas_colors: Record<string, string>;
  plugins: PluginInfo[];
  fields: Record<string, unknown>;
  relazioni: Record<string, unknown>;
  archetipi: Record<string, unknown>;
  creation: Record<string, unknown>;
  assi_tematici: Record<string, unknown>;
  generatori: Record<string, unknown>;
  widget_options: Record<string, unknown>;
  xp: Record<string, unknown>;
  astrologia: Record<string, unknown>;
  condizioni: unknown;
  maestrie: unknown;
  gs_baseline: unknown;
  [k: string]: unknown;
}
