// crea_personaggio.js — rules-engine PG 5.5e (SEPARATO da create_entity.js).
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
    return String(nome ?? "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_");
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

function listaYaml(items) {
    if (!items || items.length === 0) return " []";
    return `\n${items.map(x => `  - ${x}`).join("\n")}`;
}

// Frontmatter con ID stabili. Competenze come FLAG 0/1 (ts_<stat>, prof_<skill>):
// così la scheda PG calcola TS/bonus con Meta Bind (mod + flag * competenza).
function frontmatter(pg) {
    const car = pg.caratteristiche;
    const righeCar = pg.ordine_caratteristiche.map(s => `${s}: ${car[s]}`).join("\n");
    const righeTs = pg.ordine_caratteristiche.map(s => `ts_${s}: ${pg.ts_competenti.includes(s) ? 1 : 0}`).join("\n");
    const righeAb = pg.abilita_ids.map(id => `prof_${id}: ${pg.competenze_abilita.includes(id) ? 1 : 0}`).join("\n");
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
ca: ${pg.ca}
pf: ${pg.pf}
pf_max: ${pg.pf}
${righeCar}
${righeTs}
${righeAb}
talenti:${listaYaml(pg.talenti)}
stato: bozza
---
`;
}

async function crea_personaggio(tp) {
    const opt = await caricaOpzioni();

    const nome = await tp.system.prompt("Nome del personaggio");
    await tp.file.move(`Mondi/Personaggi/${nomeFile(nome)}`);

    const classeId = await scegliDaMappa(tp, "Classe", opt.classi);
    const specieId = await scegliDaMappa(tp, "Specie", opt.specie);
    const backgroundId = await scegliDaMappa(tp, "Background", opt.background);

    const classe = opt.classi[classeId] || {};
    const specie = opt.specie[specieId] || {};
    const background = opt.background[backgroundId] || {};

    let caratteristiche = await generaCaratteristiche(tp, opt);
    caratteristiche = await applicaAumentoBackground(tp, caratteristiche, background, opt);

    const abilitaBackground = background.competenze_abilita || [];
    const abilitaClasse = await scegliAbilitaClasse(tp, classe, abilitaBackground, opt.abilita || {});
    const competenzeAbilita = Array.from(new Set([...abilitaBackground, ...abilitaClasse]));

    const pf = Math.max(1, (classe.dado_vita || 8) + mod(caratteristiche.costituzione));
    const ca = 10 + mod(caratteristiche.destrezza);
    const talentoOrigine = background.talento_origine
        ? String(background.talento_origine).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
        : "";

    return frontmatter({
        nome,
        classe: classeId,
        specie: specieId,
        background: backgroundId,
        taglia: specie.taglia || "",
        velocita: specie.velocita || 9,
        ca,
        pf,
        caratteristiche,
        ordine_caratteristiche: opt.caratteristiche,
        abilita_ids: Object.keys(opt.abilita || {}),
        ts_competenti: classe.tiri_salvezza || [],
        competenze_abilita: competenzeAbilita,
        talenti: talentoOrigine ? [talentoOrigine] : [],
    });
}

module.exports = crea_personaggio;
