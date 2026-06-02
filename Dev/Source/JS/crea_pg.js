// crea_pg.js — rules-engine PG 5.5e (wizard hand-authored, override del
// generico create_entity.js per il template "pg"; esposto come tp.user.crea_pg).
// Legge le opzioni in z.automazioni/data/personaggio.json (generate da
// build_personaggio.py da SRD + pg_rules.yaml), guida la creazione (classe/
// specie/background + caratteristiche), APPLICA le regole iniziali (PF, TS,
// competenze abilità, ASI del background) e salva un frontmatter strutturato con
// ID STABILI (non label). I derivati presentazionali (modificatori) li calcola
// il template via Meta Bind. Script Templater autonomo: niente require.

async function caricaOpzioni() {
    const raw = await app.vault.adapter.read("z.automazioni/data/personaggio.json");
    return JSON.parse(raw);
}

function mod(valore) {
    const n = Number.parseInt(valore, 10);
    return Math.floor(((Number.isFinite(n) ? n : 10) - 10) / 2);
}

function normNum(valore, fallback = 10) {
    const n = Number.parseInt(valore, 10);
    return Number.isFinite(n) ? n : fallback;
}

function nomeFile(nome) {
    // Default se il nome è vuoto o resta vuoto dopo la pulizia (solo spazi o soli
    // caratteri proibiti): altrimenti tp.file.move produrrebbe una nota orfana ".md".
    return String(nome ?? "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Nuovo_PG";
}

function sigla(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1);
}

// suggester su una mappa { id: { label } } -> ritorna l'id scelto.
async function scegliDaMappa(tp, titolo, mappa) {
    const ids = Object.keys(mappa || {});
    return tp.system.suggester(ids.map(id => (mappa[id] && mappa[id].label) || id), ids, false, titolo);
}

async function assegnaArray(tp, caratteristiche, valori) {
    const disponibili = [...valori];
    const stats = {};
    for (const stat of caratteristiche) {
        const scelta = await tp.system.suggester(
            disponibili.map(String), disponibili, false, `Assegna un valore a ${sigla(stat)}`
        );
        stats[stat] = scelta;
        disponibili.splice(disponibili.indexOf(scelta), 1);
    }
    return stats;
}

async function pointBuy(tp, caratteristiche, config) {
    const punti = config.punti ?? 27;
    const minimo = config.minimo ?? 8;
    const massimo = config.massimo ?? 15;
    const costi = config.costi ?? {};
    const stats = {};
    let spesi = 0;
    for (const stat of caratteristiche) {
        const opzioni = [];
        for (let v = minimo; v <= massimo; v += 1) {
            const costo = Number(costi[v] ?? costi[String(v)] ?? 0);
            if (spesi + costo <= punti) opzioni.push({ v, costo });
        }
        const scelta = await tp.system.suggester(
            opzioni.map(o => `${o.v} — costo ${o.costo} — restano ${punti - spesi - o.costo}`),
            opzioni, false, `Acquisto punti: ${sigla(stat)} (${punti - spesi} rimasti)`
        );
        stats[stat] = scelta.v;
        spesi += scelta.costo;
    }
    return stats;
}

async function inserimentoManuale(tp, caratteristiche) {
    const stats = {};
    for (const stat of caratteristiche) {
        stats[stat] = normNum(await tp.system.prompt(sigla(stat)), 10);
    }
    return stats;
}

async function generaCaratteristiche(tp, opt) {
    const metodi = (opt.generazione_caratteristiche && opt.generazione_caratteristiche.metodi) || {};
    const metodo = await scegliDaMappa(tp, "Metodo per le caratteristiche", metodi);
    if (metodo === "array_standard") {
        return assegnaArray(tp, opt.caratteristiche, (metodi.array_standard && metodi.array_standard.valori) || [15, 14, 13, 12, 10, 8]);
    }
    if (metodo === "point_buy") {
        return pointBuy(tp, opt.caratteristiche, metodi.point_buy || {});
    }
    return inserimentoManuale(tp, opt.caratteristiche);
}

// ASI del background (2024): +2/+1 oppure +1/+1/+1 fra i punteggi del background.
async function applicaAumentoBackground(tp, stats, bg, opt) {
    const opzioni = (bg && bg.punteggi_caratteristica) || [];
    if (opzioni.length === 0) return stats;
    const schemi = (opt.aumento_background && opt.aumento_background.schemi) || ["+2/+1", "+1/+1/+1"];
    const schema = await tp.system.suggester(schemi, schemi, false, "Aumento caratteristiche del background");
    const bonus = schema === "+1/+1/+1" ? [1, 1, 1] : [2, 1];
    const disponibili = [...opzioni];
    for (const valore of bonus) {
        const stat = await tp.system.suggester(
            disponibili.map(sigla), disponibili, false, `Assegna +${valore}`
        );
        stats[stat] = (stats[stat] ?? 10) + valore;
        disponibili.splice(disponibili.indexOf(stat), 1);
    }
    return stats;
}

// Scelte-abilità di classe: 'scelte' fra 'opzioni', escludendo quelle già
// competenti dal background.
async function scegliAbilitaClasse(tp, classe, giaCompetenti, abilita) {
    const config = (classe && classe.abilita) || { scelte: 0, opzioni: [] };
    const scelte = [];
    const disponibili = (config.opzioni || []).filter(id => !giaCompetenti.includes(id));
    const etichetta = id => (abilita[id] && abilita[id].label) || id;
    for (let i = 0; i < (config.scelte || 0) && disponibili.length > 0; i += 1) {
        const id = await tp.system.suggester(
            disponibili.map(etichetta), disponibili, false, `Competenza in abilità (${i + 1}/${config.scelte})`
        );
        if (!id) break;
        scelte.push(id);
        disponibili.splice(disponibili.indexOf(id), 1);
    }
    return scelte;
}

// Scelta multipla da un pool di stringhe (trucchetti, lingue...): n scelte
// distinte. Il mock di test seleziona sempre la prima disponibile.
async function scegliMulti(tp, titolo, pool, n) {
    const scelte = [];
    const disponibili = [...(pool || [])];
    for (let i = 0; i < (n || 0) && disponibili.length > 0; i += 1) {
        const v = await tp.system.suggester(disponibili, disponibili, false, `${titolo} (${i + 1}/${n})`);
        if (v == null) break;
        scelte.push(v);
        disponibili.splice(disponibili.indexOf(v), 1);
    }
    return scelte;
}

// Armatura indossata: filtra per le categorie consentite dalla classe (sempre
// 'nessuna' disponibile). Ritorna {id, ca_base, dex_max, categoria}.
async function scegliArmatura(tp, classe, opt) {
    const tabella = opt.armature || {};
    const consentite = new Set(classe.competenze_armature_cat || []);
    const ids = Object.keys(tabella).filter(id =>
        tabella[id].categoria === "nessuna" || consentite.has(tabella[id].categoria));
    if (ids.length === 0) return { id: "nessuna", ca_base: 10, dex_max: null };
    const id = await tp.system.suggester(ids.map(i => tabella[i].label || i), ids, false, "Armatura indossata");
    return { id, ...(tabella[id] || { ca_base: 10, dex_max: null }) };
}

// CA = ca_base + min(mod DES, dex_max) + scudo. dex_max null = nessun limite.
function calcolaCA(armatura, modDes, scudo) {
    const cap = armatura.dex_max == null ? modDes : Math.min(modDes, armatura.dex_max);
    return (armatura.ca_base || 10) + cap + (scudo ? 2 : 0);
}

// --- Ponte HOMEBREW→motore (note del vault fuse nelle opzioni SRD a runtime) ---
// NB: helper gemelli anche in sali_pg.js (script autonomi, niente require).
// Note del vault per categoria → [{f, fm}]. Vuoto fuori da Obsidian (test: niente
// getMarkdownFiles) → l'homebrew non c'è e il motore resta quello SRD.
function noteVault(cat) {
    if (!app.vault || !app.vault.getMarkdownFiles) return [];
    return app.vault.getMarkdownFiles()
        .map(f => ({ f, fm: (app.metadataCache.getFileCache(f) || {}).frontmatter || {} }))
        .filter(e => e.fm.categoria === cat && e.fm.stato !== "archiviata");
}
function normTxt(s) {
    return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}
// "Forza, Destrezza" → ["forza","destrezza"] via mappa label→id (tollerante: salta i non riconosciuti).
function toIds(testo, labelToId) {
    const raw = Array.isArray(testo) ? testo.join(",") : String(testo || "");
    return raw.split(/[,;]/).map(x => labelToId[normTxt(x)]).filter(Boolean);
}

// Incantesimi homebrew per la classe → {livello:[nomi]}, da fondere col pool SRD.
// Una nota conta se le sue `classi` citano la classe (id o label) o sono vuote (=
// a tutti). `livello` mancante → 1.
function incantesimiHomebrew(classeId, classeLabel) {
    const want = [String(classeId || ""), String(classeLabel || "")].map(s => s.toLowerCase()).filter(Boolean);
    const pool = {};
    for (const { f, fm } of noteVault("incantesimo")) {
        const classi = (Array.isArray(fm.classi) ? fm.classi.join(",") : String(fm.classi || "")).toLowerCase();
        if (classi && !want.some(w => w && classi.includes(w))) continue;
        const n = Number.parseInt(fm.livello, 10);
        const L = String(Number.isFinite(n) && n >= 0 ? n : 1);
        (pool[L] = pool[L] || []).push(f.basename);
    }
    return pool;
}

// Fonde due pool {livello:[nomi]} senza duplicati (SRD + homebrew).
function fondiPool(a, b) {
    const out = {};
    for (const src of [a || {}, b || {}])
        for (const [L, nomi] of Object.entries(src))
            out[L] = Array.from(new Set([...(out[L] || []), ...nomi]));
    return out;
}

// Background homebrew → opzioni nella forma del motore, mappando le label umane del
// frontmatter agli id (caratteristiche/abilità). Campi vuoti → liste vuote (bg
// selezionabile ma "neutro" finché non lo compili nella scheda).
function backgroundHomebrew(opt) {
    const statMap = {}; for (const id of opt.caratteristiche || []) statMap[normTxt(id)] = id;
    const skillMap = {}; for (const [id, s] of Object.entries(opt.abilita || {})) { skillMap[normTxt(s.label)] = id; skillMap[normTxt(id)] = id; }
    const out = {};
    for (const { f, fm } of noteVault("background")) {
        out[f.basename] = {
            label: f.basename,
            punteggi_caratteristica: toIds(fm.car_background, statMap),
            competenze_abilita: toIds(fm.abilita_background, skillMap),
            talento_origine: String(fm.talento_origine || ""),
            strumenti: String(fm.strumento || ""),
        };
    }
    return out;
}

// Specie homebrew → opzioni nella forma del motore (taglia/velocità/scurovisione/
// tratti). Scurovisione dedotta dal testo dei tratti, come per l'SRD.
function specieHomebrew() {
    const out = {};
    for (const { f, fm } of noteVault("specie")) {
        const tratti = String(fm.tratti || "");
        const v = String(fm.velocita == null ? "" : fm.velocita).match(/\d+/);
        out[f.basename] = {
            label: f.basename,
            taglia: String(fm.taglia || ""),
            velocita: v ? Number(v[0]) : 9,
            scurovisione: normTxt(tratti).includes("scurovision"),
            tratti,
        };
    }
    return out;
}

// Categorie d'armatura indossabili dal testo (come build_personaggio._armor_categories).
function armorCats(prose) {
    const n = normTxt(prose);
    return [["leggera", "legger"], ["media", "medi"], ["pesante", "pesant"], ["scudo", "scud"]]
        .filter(([, k]) => n.includes(k)).map(([c]) => c);
}
// "A: ...; oppure B: ..." → {A, B}; senza B → {A: tutto}.
function parseEquip(prose) {
    const t = String(prose || "").replace(/\s+/g, " ").trim();
    if (!t) return {};
    const m = t.match(/^\s*A\s*:\s*(.*?)\s*(?:;?\s*oppure\s*|;\s*)B\s*:\s*(.*)$/i);
    return m ? { A: m[1].trim(), B: m[2].trim() } : { A: t };
}

// Classe homebrew → opzione nella forma del motore. I caster (tipo_incantatore
// pieno/mezzo) ricevono gli slot dalle tabelle SRD (opt.slot_incantatore) e il pool
// dagli incantesimi homebrew della classe. Il level-up (sali_pg) deriva competenza/
// ASI standard e gli slot dalla stessa tabella (la classe homebrew non ha una
// progressione SRD). NB: copia gemella in sali_pg.js.
function classeHomebrew(opt) {
    const statMap = {}; for (const id of opt.caratteristiche || []) statMap[normTxt(id)] = id;
    const out = {};
    for (const { f, fm } of noteVault("classe")) {
        const tipoInc = normTxt(fm.tipo_incantatore);
        const caster = tipoInc === "pieno" || tipoInc === "mezzo";
        const tab = (opt.slot_incantatore || {})[tipoInc] || [];
        const dado = String(fm.dado_vita == null ? "" : fm.dado_vita).match(/\d+/);
        out[f.basename] = {
            label: f.basename,
            dado_vita: dado ? Number(dado[0]) : 8,
            tiri_salvezza: toIds(fm.ts_competenze, statMap),
            caratteristica_primaria: toIds(fm.car_primaria, statMap),
            abilita: { scelte: Number.parseInt(fm.abilita_numero, 10) || 2, opzioni: Object.keys(opt.abilita || {}) },
            competenze_armi: String(fm.competenze_armi || ""),
            competenze_armature: String(fm.competenze_armature || ""),
            competenze_armature_cat: armorCats(fm.competenze_armature),
            competenze_strumenti: String(fm.strumento || ""),
            equipaggiamento: parseEquip(fm.equipaggiamento),
            privilegi_l1: [],
            incantatore: caster,
            trucchetti_noti: caster ? (tipoInc === "pieno" ? 3 : 2) : 0,
            incantesimi_preparati: caster ? (tipoInc === "pieno" ? 4 : 2) : 0,
            slot_l1: caster ? (tab[0] || {}) : {},
            incantesimi_pool: caster ? incantesimiHomebrew(f.basename, f.basename) : {},
            tipo_incantatore: tipoInc || "nessuno",
            padronanza_armi: 0,
        };
    }
    return out;
}

// Incantesimi a PG di 1º livello: trucchetti (trucchetti_noti) + incantesimi di
// 1º (incantesimi_preparati) dai pool della classe FUSI con l'homebrew del vault.
// Niente per i non-incantatori.
async function scegliIncantesimi(tp, classe, classeId) {
    if (!classe.incantatore) return { trucchetti: [], preparati: [], slot: classe.slot_l1 || {} };
    const pool = fondiPool(classe.incantesimi_pool || {}, incantesimiHomebrew(classeId, classe.label));
    const trucchetti = await scegliMulti(tp, "Trucchetto", pool["0"] || [], classe.trucchetti_noti || 0);
    const preparati = await scegliMulti(tp, "Incantesimo di 1º livello", pool["1"] || [], classe.incantesimi_preparati || 0);
    return { trucchetti, preparati, slot: classe.slot_l1 || {} };
}

function listaYaml(items) {
    if (!items || items.length === 0) return " []";
    return `\n${items.map(x => `  - ${x}`).join("\n")}`;
}

// Variante quotata per liste di testo libero (lingue, incantesimi, inventario).
function listaYamlQ(items) {
    if (!items || items.length === 0) return " []";
    return `\n${items.map(x => `  - ${JSON.stringify(String(x))}`).join("\n")}`;
}

// Frontmatter con ID stabili. Competenze come FLAG 0/1 (ts_<stat>, prof_<skill>):
// così la scheda PG calcola TS/bonus con Meta Bind (mod + flag * competenza).
function frontmatter(pg) {
    const car = pg.caratteristiche;
    const righeCar = pg.ordine_caratteristiche.map(s => `${s}: ${car[s]}`).join("\n");
    const righeTs = pg.ordine_caratteristiche.map(s => `ts_${s}: ${pg.ts_competenti.includes(s) ? 1 : 0}`).join("\n");
    const righeAb = pg.abilita_ids.map(id => `prof_${id}: ${pg.competenze_abilita.includes(id) ? 1 : 0}`).join("\n");
    const slotRighe = Object.entries(pg.slot || {}).map(([n, q]) => `slot_${n}: ${q}`).join("\n");
    return `---
nome: ${JSON.stringify(String(pg.nome ?? ""))}
categoria: personaggio
tipo: pg
classe: ${pg.classe}
specie: ${pg.specie}
background: ${pg.background}
livello: 1
competenza: 2
taglia: ${pg.taglia}
velocita: ${pg.velocita}
scurovisione: ${pg.scurovisione ? "true" : "false"}
ca: ${pg.ca}
pf: ${pg.pf}
pf_max: ${pg.pf}
armatura: ${pg.armatura}
scudo: ${pg.scudo ? "true" : "false"}
${righeCar}
${righeTs}
${righeAb}
tratti_specie: ${JSON.stringify(String(pg.tratti_specie ?? ""))}
competenze_armi: ${JSON.stringify(String(pg.competenze_armi ?? ""))}
competenze_armature: ${JSON.stringify(String(pg.competenze_armature ?? ""))}
competenze_strumenti: ${JSON.stringify(String(pg.competenze_strumenti ?? ""))}
lingue:${listaYamlQ(pg.lingue)}
privilegi_classe:${listaYamlQ(pg.privilegi_classe)}
inventario:${listaYamlQ(pg.inventario)}
incantatore: ${pg.incantatore ? "true" : "false"}
trucchetti:${listaYamlQ(pg.trucchetti)}
incantesimi:${listaYamlQ(pg.incantesimi)}
${slotRighe ? slotRighe + "\n" : ""}talenti:${listaYaml(pg.talenti)}
padronanze_armi:${listaYamlQ(pg.padronanze_armi)}
stato: bozza
---
`;
}

async function crea_pg(tp) {
    const opt = await caricaOpzioni();

    const nome = await tp.system.prompt("Nome del personaggio");
    await tp.file.move(`Mondi/Personaggi/${nomeFile(nome)}`);

    // Opzioni SRD fuse con l'homebrew del vault (ponte homebrew→motore): classe,
    // specie e background homebrew diventano selezionabili accanto a quelli SRD.
    const classiOpt = { ...opt.classi, ...classeHomebrew(opt) };
    const specieOpt = { ...opt.specie, ...specieHomebrew() };
    const backgroundOpt = { ...opt.background, ...backgroundHomebrew(opt) };

    const classeId = await scegliDaMappa(tp, "Classe", classiOpt);
    const specieId = await scegliDaMappa(tp, "Specie", specieOpt);
    const backgroundId = await scegliDaMappa(tp, "Background", backgroundOpt);

    const classe = classiOpt[classeId] || {};
    const specie = specieOpt[specieId] || {};
    const background = backgroundOpt[backgroundId] || {};

    let caratteristiche = await generaCaratteristiche(tp, opt);
    caratteristiche = await applicaAumentoBackground(tp, caratteristiche, background, opt);

    const abilitaBackground = background.competenze_abilita || [];
    const abilitaClasse = await scegliAbilitaClasse(tp, classe, abilitaBackground, opt.abilita || {});
    const competenzeAbilita = Array.from(new Set([...abilitaBackground, ...abilitaClasse]));

    // Equipaggiamento iniziale (scelta SRD A/B) -> inventario.
    const equip = classe.equipaggiamento || {};
    const equipKeys = Object.keys(equip);
    let inventario = [];
    if (equipKeys.length) {
        const scelto = equipKeys.length > 1
            ? await tp.system.suggester(equipKeys.map(k => `${k}: ${equip[k]}`), equipKeys, false, "Equipaggiamento iniziale")
            : equipKeys[0];
        inventario = String(equip[scelto] || "").split(",").map(s => s.trim()).filter(Boolean);
    }

    // Armatura + scudo -> CA (SRD: ca_base + min(modDES, dex_max) + scudo).
    const armatura = await scegliArmatura(tp, classe, opt);
    let scudo = false;
    if ((classe.competenze_armature_cat || []).includes("scudo")) {
        scudo = !!(await tp.system.suggester(["Sì", "No"], [true, false], false, "Imbraccia uno scudo?"));
    }
    const ca = calcolaCA(armatura, mod(caratteristiche.destrezza), scudo);

    // Lingue (2024): Comune + N a scelta dal background d'origine.
    const lingueCfg = opt.lingue || {};
    const comune = lingueCfg.comune || "Comune";
    const standard = (lingueCfg.standard || []).filter(l => l !== comune);
    const lingue = [comune, ...await scegliMulti(tp, "Lingua", standard, lingueCfg.numero_a_scelta || 0)];

    // Incantesimi di 1º livello (solo incantatori; pool SRD + homebrew del vault).
    const magia = await scegliIncantesimi(tp, classe, classeId);

    const pf = Math.max(1, (classe.dado_vita || 8) + mod(caratteristiche.costituzione));
    const talentoOrigine = background.talento_origine
        ? String(background.talento_origine).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
        : "";
    const strumenti = [classe.competenze_strumenti, background.strumenti]
        .map(s => String(s || "").trim().replace(/\.$/, "")).filter(Boolean).join("; ");

    // Padronanza delle armi (2024): le classi che la ottengono scelgono N armi di
    // cui conoscono la padronanza (mappa arma->padronanza dal SRD). Offre tutte le
    // armi con padronanza; l'utente sceglie fra quelle con cui è competente.
    const armiPad = opt.armi_padronanza || {};
    const padronanzePool = Object.keys(armiPad).map(a => `${a} — ${armiPad[a]}`);
    const padronanze_armi = await scegliMulti(tp, "Padronanza d'arma", padronanzePool, classe.padronanza_armi || 0);

    return frontmatter({
        nome,
        classe: classeId,
        specie: specieId,
        background: backgroundId,
        taglia: specie.taglia || "",
        velocita: specie.velocita || 9,
        scurovisione: !!specie.scurovisione,
        tratti_specie: specie.tratti || "",
        ca,
        pf,
        armatura: armatura.id || "nessuna",
        scudo,
        caratteristiche,
        ordine_caratteristiche: opt.caratteristiche,
        abilita_ids: Object.keys(opt.abilita || {}),
        ts_competenti: classe.tiri_salvezza || [],
        competenze_abilita: competenzeAbilita,
        competenze_armi: classe.competenze_armi || "",
        competenze_armature: classe.competenze_armature || "",
        competenze_strumenti: strumenti,
        lingue,
        privilegi_classe: classe.privilegi_l1 || [],
        inventario,
        incantatore: !!classe.incantatore,
        trucchetti: magia.trucchetti,
        incantesimi: magia.preparati,
        slot: magia.slot,
        talenti: talentoOrigine ? [talentoOrigine] : [],
        padronanze_armi,
    });
}

module.exports = crea_pg;
// Esposto per il test-guardia del nome vuoto (test_crea_pg_nome_vuoto).
module.exports.nomeFile = nomeFile;
// Esposti per i test del ponte homebrew→motore.
module.exports.incantesimiHomebrew = incantesimiHomebrew;
module.exports.fondiPool = fondiPool;
module.exports.backgroundHomebrew = backgroundHomebrew;
module.exports.specieHomebrew = specieHomebrew;
module.exports.classeHomebrew = classeHomebrew;
