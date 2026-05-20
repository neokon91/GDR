#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REPO_RAW = "https://raw.githubusercontent.com/neokon91/DND-SRD-IT/main";
const VERSION = "5.2.1";
const BASE = path.join("srd", VERSION, "json");
const OUT = "SRD";
const GENERATED_BY = "import_srd";

const SOURCES = [
    {
        key: "backgrounds",
        file: "srd_5_2_1_backgrounds.json",
        dir: "Background",
        tipo: "background",
        title: "Background"
    },
    {
        key: "classes",
        file: "srd_5_2_1_classes.json",
        dir: "Classi",
        tipo: "classe",
        title: "Classi"
    },
    {
        key: "equipment",
        file: "srd_5_2_1_equipment.json",
        dir: "Equipaggiamento",
        tipo: "equipaggiamento",
        title: "Equipaggiamento"
    },
    {
        key: "feats",
        file: "srd_5_2_1_feats.json",
        dir: "Talenti",
        tipo: "talento",
        title: "Talenti"
    },
    {
        key: "languages",
        file: "srd_5_2_1_languages.json",
        dir: "Lingue",
        tipo: "lingua",
        title: "Lingue"
    },
    {
        key: "spells",
        file: "srd_5_2_1_spells.json",
        dir: "Incantesimi",
        tipo: "incantesimo",
        title: "Incantesimi"
    },
    {
        key: "monsters",
        file: "srd_5_2_1_monsters.json",
        dir: "Mostri",
        tipo: "mostro",
        title: "Mostri"
    },
    {
        key: "magic_items",
        file: "srd_5_2_1_magic_items.json",
        dir: "Oggetti Magici",
        tipo: "oggetto magico",
        title: "Oggetti Magici"
    },
    {
        key: "rules",
        file: "srd_5_2_1_rules.json",
        dir: "Regole",
        tipo: "regola",
        title: "Regole"
    },
    {
        key: "rules_glossary",
        file: "srd_5_2_1_rules_glossary.json",
        dir: "Glossario",
        tipo: "glossario",
        title: "Glossario"
    },
    {
        key: "species",
        file: "srd_5_2_1_species.json",
        dir: "Specie",
        tipo: "specie",
        title: "Specie"
    }
];

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function writeGeneratedFile(file, content) {
    if (fs.existsSync(file)) {
        const existing = fs.readFileSync(file, "utf8");
        if (!existing.includes(`generato_da: ${GENERATED_BY}`) && !existing.includes(`generato_da: "${GENERATED_BY}"`)) {
            console.warn(`Salto nota modificata manualmente: ${file}`);
            return false;
        }
    }

    fs.writeFileSync(file, content, "utf8");
    return true;
}

function slugify(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\\/:*?"<>|#^[\]]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function yamlScalar(value) {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(String(value));
}

function yamlList(values) {
    const list = Array.isArray(values) ? values.filter(v => v !== null && v !== undefined && v !== "") : [];
    return list.length ? `[${list.map(yamlScalar).join(", ")}]` : "[]";
}

function yamlKey(key) {
    return /^[A-Za-z0-9_-]+$/.test(String(key)) ? key : JSON.stringify(String(key));
}

function yamlBlock(value, indent = 0) {
    const pad = " ".repeat(indent);
    if (value === null || value === undefined || value === "") return "";
    if (typeof value !== "object") return yamlScalar(value);

    if (Array.isArray(value)) {
        const list = value.filter(v => v !== null && v !== undefined && v !== "");
        if (!list.length) return "[]";
        if (list.every(v => typeof v !== "object")) return yamlList(list);
        return "\n" + list.map(item => {
            if (typeof item !== "object" || item === null) return `${pad}- ${yamlScalar(item)}`;
            const entries = Object.entries(item).filter(([, v]) => v !== null && v !== undefined && v !== "");
            if (!entries.length) return `${pad}- {}`;
            return entries.map(([k, v], index) => {
                const prefix = index === 0 ? `${pad}- ${yamlKey(k)}:` : `${pad}  ${yamlKey(k)}:`;
                if (typeof v === "object" && v !== null) return `${prefix}${yamlBlock(v, indent + 4)}`;
                return `${prefix} ${yamlScalar(v)}`;
            }).join("\n");
        }).join("\n");
    }

    const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (!entries.length) return "{}";
    return "\n" + entries.map(([k, v]) => {
        const prefix = `${pad}${yamlKey(k)}:`;
        if (typeof v === "object" && v !== null) return `${prefix}${yamlBlock(v, indent + 2)}`;
        return `${prefix} ${yamlScalar(v)}`;
    }).join("\n");
}

function frontmatter(fields) {
    const lines = ["---"];
    for (const [key, value] of Object.entries(fields)) {
        const indent = value && typeof value === "object" && !Array.isArray(value) ? 2 : 0;
        lines.push(`${key}: ${yamlBlock(value, indent)}`);
    }
    lines.push("---", "");
    return lines.join("\n");
}

function paragraph(value) {
    return String(value ?? "").trim().replace(/\n{3,}/g, "\n\n");
}

function tableFromRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escapeCell = value => String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
    return [
        `| ${headers.join(" | ")} |`,
        `| ${headers.map(() => "---").join(" | ")} |`,
        ...rows.map(row => `| ${headers.map(h => escapeCell(row[h])).join(" | ")} |`)
    ].join("\n");
}

function sectionsToMarkdown(sections = []) {
    return sections.map(section => {
        const title = section.titolo ? `## ${section.titolo}\n\n` : "";
        if (Array.isArray(section.righe)) {
            return `${title}${tableFromRows(section.righe)}`;
        }
        if (Array.isArray(section.blocchi)) {
            return `${title}${section.blocchi.map(block => `### ${block.nome}\n\n${paragraph(block.descrizione)}`).join("\n\n")}`;
        }
        if (section.descrizione) {
            return `${title}${paragraph(section.descrizione)}`;
        }
        return title.trim();
    }).filter(Boolean).join("\n\n");
}

function namedBlocks(title, blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return "";
    return `## ${title}\n\n${blocks.map(block => `### ${block.nome}\n\n${paragraph(block.descrizione)}`).join("\n\n")}`;
}

function statTable(monster) {
    const c = monster.caratteristiche ?? {};
    const rows = [
        ["Forza", c.forza],
        ["Destrezza", c.destrezza],
        ["Costituzione", c.costituzione],
        ["Intelligenza", c.intelligenza],
        ["Saggezza", c.saggezza],
        ["Carisma", c.carisma]
    ].map(([name, stat]) => ({
        Caratteristica: name,
        Punteggio: stat?.punteggio ?? "",
        Modificatore: stat?.modificatore ?? "",
        "Tiro Salvezza": stat?.tiro_salvezza ?? ""
    }));
    return tableFromRows(rows);
}

function speedText(speed = {}) {
    if (typeof speed === "string") return speed;
    return Object.entries(speed).map(([k, v]) => `${k}: ${v}`).join(", ");
}

function objectText(value) {
    if (!value) return "";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
        return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(", ");
    }
    return String(value);
}

function statArray(monster) {
    const c = monster.caratteristiche ?? {};
    return [
        c.forza?.punteggio,
        c.destrezza?.punteggio,
        c.costituzione?.punteggio,
        c.intelligenza?.punteggio,
        c.saggezza?.punteggio,
        c.carisma?.punteggio
    ].map(value => value ?? 10);
}

function saveObject(monster) {
    const c = monster.caratteristiche ?? {};
    return Object.fromEntries([
        ["str", c.forza],
        ["dex", c.destrezza],
        ["con", c.costituzione],
        ["int", c.intelligenza],
        ["wis", c.saggezza],
        ["cha", c.carisma]
    ].filter(([, stat]) => stat?.tiro_salvezza !== undefined && stat.tiro_salvezza !== stat.modificatore)
        .map(([key, stat]) => [key, stat.tiro_salvezza]));
}

function statblockBlocks(blocks) {
    return Array.isArray(blocks)
        ? blocks.map(block => ({
            name: block.nome,
            desc: paragraph(block.descrizione)
        })).filter(block => block.name || block.desc)
        : [];
}

function renderBackground(item) {
    const fields = baseFields(item, "background", {
        capitolo: item.capitolo,
        pagine_sorgente: item.pagine_sorgente,
        punteggi_caratteristica: item.punteggi_caratteristica ?? [],
        talento_origine: item.talento_origine,
        competenze: item.competenze ?? {},
        equipaggiamento_alternativo: item.equipaggiamento_alternativo
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Background\n> Caratteristiche: ${(item.punteggi_caratteristica ?? []).join(", ")}\n> Talento: ${item.talento_origine ?? ""}\n> Equipaggiamento alternativo: ${item.equipaggiamento_alternativo ?? ""}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderClass(item) {
    const fields = baseFields(item, "classe", {
        capitolo: item.capitolo,
        pagine_sorgente: item.pagine_sorgente,
        caratteristica_primaria: item.caratteristica_primaria ?? [],
        dado_vita: item.dado_vita,
        tiri_salvezza: item.tiri_salvezza ?? []
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        paragraph(item.descrizione),
        item.competenze ? `## Competenze\n\n${Object.entries(item.competenze).map(([k, v]) => `- **${k}**: ${v}`).join("\n")}` : "",
        item.equipaggiamento_iniziale ? `## Equipaggiamento Iniziale\n\n${paragraph(item.equipaggiamento_iniziale)}` : "",
        sectionsToMarkdown(item.sezioni),
        Array.isArray(item.progressione) ? `## Progressione\n\n${tableFromRows(item.progressione)}` : "",
        item.sottoclasse_srd?.nome ? `## Sottoclasse SRD\n\n${item.sottoclasse_srd.nome}` : "",
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderEquipment(item) {
    const fields = baseFields(item, "equipaggiamento", {
        capitolo: item.capitolo,
        pagine_sorgente: item.pagine_sorgente,
        tipo_oggetto: item.tipo,
        categoria_oggetto: item.categoria,
        costo: item.costo,
        peso: item.peso,
        danni: item.danni,
        proprieta: item.proprieta ?? [],
        padronanza: item.padronanza,
        classe_armatura: item.classe_armatura,
        forza: item.forza,
        furtivita: item.furtivita,
        velocita: item.velocita,
        punti_ferita: item.punti_ferita,
        soglia_danno: item.soglia_danno,
        valore_in_mo: item.valore_in_mo
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Equipaggiamento\n> Tipo: ${item.tipo ?? ""}\n> Categoria: ${item.categoria ?? ""}\n> Costo: ${item.costo ?? ""}\n> Peso: ${item.peso ?? ""}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderFeat(item) {
    const fields = baseFields(item, "talento", {
        capitolo: item.capitolo,
        pagine_sorgente: item.pagine_sorgente,
        categoria_talento: item.categoria,
        prerequisito: item.prerequisito,
        ripetibile: item.ripetibile,
        beneficio: item.beneficio
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Talento\n> Categoria: ${item.categoria ?? ""}\n> Prerequisito: ${item.prerequisito ?? ""}\n> Ripetibile: ${item.ripetibile ? "si" : "no"}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderLanguage(item) {
    const fields = baseFields(item, "lingua", {
        capitolo: item.capitolo,
        pagine_sorgente: item.pagine_sorgente,
        categoria_lingua: item.categoria,
        tiro_casuale: item.tiro_casuale
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Lingua\n> Categoria: ${item.categoria ?? ""}\n> Tiro casuale: ${item.tiro_casuale ?? ""}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderSpell(item) {
    const fields = baseFields(item, "incantesimo", {
        livello: item.livello,
        scuola: item.scuola,
        classi: item.classi ?? [],
        tempo_lancio: item.tempo_lancio,
        gittata: item.gittata,
        componenti: item.componenti,
        durata: item.durata,
        pagine_sorgente: item.pagine_sorgente
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Incantesimo\n> Livello: ${item.livello}\n> Scuola: ${item.scuola}\n> Tempo di lancio: ${item.tempo_lancio}\n> Gittata: ${item.gittata}\n> Componenti: ${item.componenti}\n> Durata: ${item.durata}`,
        paragraph(item.descrizione),
        namedBlocks("Slot Di Livello Superiore", item.scaling),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderSpecies(item) {
    const fields = baseFields(item, "specie", {
        capitolo: item.capitolo,
        pagine_sorgente: item.pagine_sorgente,
        tipo_creatura: item.tipo_creatura,
        taglia: item.taglia,
        velocita: item.velocita,
        tratti_sintesi: item.tratti_sintesi
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Specie\n> Tipo creatura: ${item.tipo_creatura ?? ""}\n> Taglia: ${item.taglia ?? ""}\n> Velocita: ${item.velocita ?? ""}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderMonster(item) {
    const cr = item.grado_sfida ?? {};
    const hp = item.punti_ferita ?? {};
    const init = item.iniziativa ?? {};
    const fields = baseFields(item, "mostro", {
        name: item.nome,
        type: item.tipo,
        size: String(item.dimensione ?? "").toLowerCase(),
        alignment: item.allineamento,
        ac: item.classe_armatura,
        stats: statArray(item),
        saves: saveObject(item),
        skillsaves: item.abilita ?? {},
        damage_vulnerabilities: "",
        damage_resistances: "",
        damage_immunities: "",
        condition_immunities: "",
        senses: objectText(item.sensi),
        languages: Array.isArray(item.lingue) ? item.lingue.join(", ") : item.lingue,
        gear: item.equipaggiamento ?? [],
        traits: statblockBlocks(item.tratti),
        actions: statblockBlocks(item.azioni),
        bonus_actions: statblockBlocks(item.azioni_bonus),
        reactions: statblockBlocks(item.reazioni),
        legendary_actions: statblockBlocks(item.azioni_leggendarie?.azioni),
        lair_actions: statblockBlocks(item.azioni_tana),
        tipo_creatura: item.tipo,
        dimensione: item.dimensione,
        allineamento: item.allineamento,
        classe_armatura: item.classe_armatura,
        iniziativa: init.bonus ?? init.valore ?? "",
        hp: hp.media,
        hit_dice: hp.formula,
        speed: speedText(item.velocita),
        cr: cr.valore,
        xp: cr.punti_esperienza,
        bonus_competenza: item.bonus_competenza,
        statblock: true
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `\`\`\`statblock\nmonster: ${item.nome}\n\`\`\``,
        `> [!infobox|wiki]- Mostro SRD\n> Tipo: ${item.dimensione} ${item.tipo}, ${item.allineamento}\n> CA: ${item.classe_armatura}\n> PF: ${hp.media ?? ""} (${hp.formula ?? ""})\n> Velocita: ${speedText(item.velocita)}\n> GS: ${cr.raw ?? cr.valore ?? ""}`,
        "## Caratteristiche",
        statTable(item),
        item.abilita ? `## Abilita\n\n${objectText(item.abilita)}` : "",
        item.sensi ? `## Sensi\n\n${objectText(item.sensi)}` : "",
        Array.isArray(item.lingue) && item.lingue.length ? `## Lingue\n\n${item.lingue.join(", ")}` : "",
        namedBlocks("Tratti", item.tratti),
        namedBlocks("Azioni", item.azioni),
        item.azioni_leggendarie ? renderLegendary(item.azioni_leggendarie) : "",
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderLegendary(legendary) {
    return [
        "## Azioni Leggendarie",
        paragraph(legendary.descrizione_utilizzi),
        namedBlocks("Opzioni", legendary.azioni)
    ].filter(Boolean).join("\n\n");
}

function renderMagicItem(item) {
    const fields = baseFields(item, "oggetto magico", {
        tipo_oggetto: item.tipo,
        tipo_base: item.tipo_base,
        rarita: item.rarita,
        richiede_sintonia: item.richiede_sintonia
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        `> [!infobox|wiki]- Oggetto Magico\n> Tipo: ${item.tipo}\n> Rarita: ${item.rarita}\n> Sintonia: ${item.richiede_sintonia ? "si" : "no"}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderRule(item) {
    const fields = baseFields(item, "regola", {
        capitolo: item.capitolo,
        categoria_regola: item.categoria,
        pagine_sorgente: item.pagine_sorgente
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function renderGlossary(item) {
    const fields = baseFields(item, "glossario", {
        lettera: item.lettera,
        descrittore: item.descrittore,
        pagine_sorgente: item.pagine_sorgente
    });

    return frontmatter(fields) + [
        `# ${item.nome}`,
        paragraph(item.descrizione),
        sectionsToMarkdown(item.sezioni),
        attribution()
    ].filter(Boolean).join("\n\n");
}

function baseFields(item, tipo, extra = {}) {
    return {
        id: `srd-${item.id}`,
        srd_id: item.id,
        nome: item.nome,
        categoria: "srd",
        tipo,
        stato: "pronto",
        canonico: false,
        fonte: `SRD ${VERSION}`,
        licenza: "CC-BY-4.0",
        repository: "neokon91/DND-SRD-IT",
        generato_da: GENERATED_BY,
        ...extra
    };
}

function attribution() {
    return "> [!info] Licenza\n> Questa nota include materiale tratto dal System Reference Document 5.2.1 di Wizards of the Coast LLC, disponibile su https://www.dndbeyond.com/srd e concesso in licenza CC-BY-4.0.";
}

function rendererFor(key) {
    return {
        backgrounds: renderBackground,
        classes: renderClass,
        equipment: renderEquipment,
        feats: renderFeat,
        languages: renderLanguage,
        spells: renderSpell,
        monsters: renderMonster,
        magic_items: renderMagicItem,
        rules: renderRule,
        rules_glossary: renderGlossary,
        species: renderSpecies
    }[key];
}

async function fetchJson(source) {
    const url = `${REPO_RAW}/${BASE}/${source.file}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Impossibile scaricare ${url}: ${response.status}`);
    }
    return await response.json();
}

function writeIndex(source, count) {
    const file = path.join(OUT, source.dir, `${source.dir}.md`);
    const content = [
        "---",
        "cssclasses: [indice]",
        "categoria: srd",
        `tipo: indice ${source.tipo}`,
        `fonte: "SRD ${VERSION}"`,
        "licenza: CC-BY-4.0",
        `generato_da: ${GENERATED_BY}`,
        "---",
        "",
        `# ${source.title}`,
        "",
        `Totale note generate: ${count}.`,
        "",
        "```dataview",
        "TABLE tipo, categoria_oggetto, categoria_talento, categoria_lingua, livello, scuola, cr, rarita, descrittore",
        `FROM "SRD/${source.dir}"`,
        `WHERE file.name != "${source.dir}"`,
        "SORT nome ASC",
        "```"
    ].join("\n");
    writeGeneratedFile(file, content);
}

function writeRootIndex(counts) {
    const rows = SOURCES.map(source => `| [[SRD/${source.dir}/${source.dir}|${source.title}]] | ${counts[source.key] ?? 0} |`).join("\n");
    const content = [
        "---",
        "cssclasses: [indice]",
        "categoria: srd",
        "tipo: indice",
        `fonte: "SRD ${VERSION}"`,
        "licenza: CC-BY-4.0",
        `generato_da: ${GENERATED_BY}`,
        "---",
        "",
        "# SRD",
        "",
        "Archivio separato di note generate dalla fork [neokon91/DND-SRD-IT](https://github.com/neokon91/DND-SRD-IT) del System Reference Document 5.2.1 in italiano.",
        "",
        "| Sezione | Note |",
        "| --- | ---: |",
        rows,
        "",
        "## Attribuzione",
        "",
        "Quest'opera include materiale tratto dal System Reference Document 5.2.1 (\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile all'indirizzo https://www.dndbeyond.com/srd. Il SRD 5.2.1 e concesso in licenza ai sensi della licenza di attribuzione 4.0 Internazionale di Creative Commons, disponibile all'indirizzo https://creativecommons.org/licenses/by/4.0/legalcode.",
        "",
        "Vedi anche [[SRD/Licenza SRD]].",
        "",
        "## Note",
        "",
        "- Le note SRD non sono contenuto canonico del mondo.",
        "- Usa link verso queste note come riferimento regolamentare.",
        "- Se modifichi una nota generata, rimuovi o cambia `generato_da` prima di rigenerare."
    ].join("\n");
    writeGeneratedFile(path.join(OUT, "SRD.md"), content);
}

function writeLicenseNote() {
    const content = [
        "---",
        "cssclasses: [indice]",
        "categoria: srd",
        "tipo: licenza",
        `fonte: "SRD ${VERSION}"`,
        "licenza: CC-BY-4.0",
        `generato_da: ${GENERATED_BY}`,
        "---",
        "",
        "# Licenza SRD",
        "",
        "Il System Reference Document 5.2.1 (\"SRD 5.2.1\") e fornito gratuitamente da Wizards of the Coast LLC (\"Wizards\") in base ai termini della licenza di attribuzione 4.0 Internazionale di Creative Commons (\"CC-BY-4.0\").",
        "",
        "Quest'opera include materiale tratto dal System Reference Document 5.2.1 (\"SRD 5.2.1\") di Wizards of the Coast LLC, disponibile all'indirizzo https://www.dndbeyond.com/srd. Il SRD 5.2.1 e concesso in licenza ai sensi della licenza di attribuzione 4.0 Internazionale di Creative Commons, disponibile all'indirizzo https://creativecommons.org/licenses/by/4.0/legalcode.",
        "",
        "Non includere altre attribuzioni a Wizards o alla sua societa madre o alle sue affiliate diverse da quella sopra indicata. Puoi pero includere una dichiarazione sulla tua opera che indichi che essa e \"compatibile con la quinta edizione\" o \"compatibile con 5E\".",
        "",
        "La repo sorgente e [neokon91/DND-SRD-IT](https://github.com/neokon91/DND-SRD-IT)."
    ].join("\n");
    writeGeneratedFile(path.join(OUT, "Licenza SRD.md"), content);
}

async function main() {
    ensureDir(OUT);
    const counts = {};

    for (const source of SOURCES) {
        const data = await fetchJson(source);
        const dir = path.join(OUT, source.dir);
        ensureDir(dir);
        const render = rendererFor(source.key);

        for (const item of data) {
            const filename = `${slugify(item.nome || item.id)}.md`;
            writeGeneratedFile(path.join(dir, filename), render(item));
        }

        counts[source.key] = data.length;
        writeIndex(source, data.length);
        console.log(`${source.title}: ${data.length}`);
    }

    writeRootIndex(counts);
    writeLicenseNote();
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
