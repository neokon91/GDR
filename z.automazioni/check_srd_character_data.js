#!/usr/bin/env node

const path = require("path");
const { readJson, repoPath, rel } = require("./node_utils");

const ROOT = process.cwd();
const DATA_DIR = repoPath(ROOT, "z.automazioni/data/srd");
const EXPECTED_GENERATOR = "import_srd_character_data";

function fail(errors) {
    for (const error of errors) console.error(error);
    process.exit(1);
}

function keys(object) {
    return Object.keys(object ?? {});
}

function requireObject(errors, object, label) {
    if (!object || typeof object !== "object" || Array.isArray(object)) {
        errors.push(`${label}: oggetto mancante o non valido`);
        return false;
    }
    return true;
}

function requireNonEmptyObject(errors, object, label) {
    if (!requireObject(errors, object, label)) return false;
    if (!keys(object).length) {
        errors.push(`${label}: oggetto vuoto`);
        return false;
    }
    return true;
}

function assertRefs(errors, refs, valid, label) {
    for (const ref of refs ?? []) {
        if (!valid.has(ref)) errors.push(`${label}: riferimento non valido (${ref})`);
    }
}

function main() {
    const errors = [];
    const corePath = repoPath(DATA_DIR, "core.json");
    const optionsPath = repoPath(DATA_DIR, "opzioni_personaggio.json");
    const core = readJson(corePath, null, () => errors.push(`JSON non valido: ${rel(ROOT, corePath)}`));
    const opzioni = readJson(optionsPath, null, () => errors.push(`JSON non valido: ${rel(ROOT, optionsPath)}`));

    if (!core || !opzioni) fail(errors);
    if (core.generated_by !== EXPECTED_GENERATOR) errors.push("core.json: generated_by non allineato");
    if (opzioni.generated_by !== EXPECTED_GENERATOR) errors.push("opzioni_personaggio.json: generated_by non allineato");

    if (!Array.isArray(core.statistiche) || core.statistiche.length !== 6) {
        errors.push("core.statistiche: servono esattamente 6 caratteristiche");
    }
    const stats = new Set(core.statistiche ?? []);
    if (stats.size !== (core.statistiche ?? []).length) errors.push("core.statistiche: valori duplicati");

    if (requireNonEmptyObject(errors, core.abilita, "core.abilita")) {
        for (const [slug, skill] of Object.entries(core.abilita)) {
            if (!skill.label) errors.push(`core.abilita.${slug}: label mancante`);
            if (!stats.has(skill.stat)) errors.push(`core.abilita.${slug}: stat non valida (${skill.stat})`);
        }
    }
    const skills = new Set(keys(core.abilita));
    const armorCategories = new Set(keys(core.categorie_armature));
    const weaponCategories = new Set(keys(core.categorie_armi));

    if (!armorCategories.size) errors.push("core.categorie_armature: nessuna categoria");
    if (!weaponCategories.size) errors.push("core.categorie_armi: nessuna categoria");

    const methods = core.generazione_caratteristiche?.metodi ?? {};
    const standardArray = methods.array_standard?.valori ?? [];
    if (!Array.isArray(standardArray) || standardArray.length !== stats.size) {
        errors.push("generazione_caratteristiche.array_standard: valori non allineati alle statistiche");
    }
    const pointBuy = methods.point_buy;
    if (!pointBuy || pointBuy.punti !== 27 || pointBuy.minimo !== 8 || pointBuy.massimo !== 15) {
        errors.push("generazione_caratteristiche.point_buy: contratto 27 punti 8-15 non rispettato");
    } else {
        for (let score = pointBuy.minimo; score <= pointBuy.massimo; score += 1) {
            if (!Number.isInteger(pointBuy.costi?.[score])) {
                errors.push(`generazione_caratteristiche.point_buy: costo mancante per ${score}`);
            }
        }
    }

    if (requireNonEmptyObject(errors, opzioni.classi, "opzioni.classi")) {
        for (const [slug, cls] of Object.entries(opzioni.classi)) {
            if (!cls.label) errors.push(`opzioni.classi.${slug}: label mancante`);
            if (![6, 8, 10, 12].includes(cls.dadi_vita)) errors.push(`opzioni.classi.${slug}: dadi_vita non valido`);
            if (!Array.isArray(cls.save_prof) || cls.save_prof.length !== 2) {
                errors.push(`opzioni.classi.${slug}: save_prof deve avere 2 caratteristiche`);
            }
            assertRefs(errors, cls.save_prof, stats, `opzioni.classi.${slug}.save_prof`);

            const skillChoice = cls.abilita ?? {};
            if (!Number.isInteger(skillChoice.scelte) || skillChoice.scelte < 0) {
                errors.push(`opzioni.classi.${slug}.abilita: scelte non valido`);
            }
            if (skillChoice.opzioni !== "qualsiasi") {
                if (!Array.isArray(skillChoice.opzioni) || skillChoice.opzioni.length < skillChoice.scelte) {
                    errors.push(`opzioni.classi.${slug}.abilita: opzioni insufficienti`);
                }
                assertRefs(errors, skillChoice.opzioni, skills, `opzioni.classi.${slug}.abilita.opzioni`);
            }

            assertRefs(errors, cls.addestramento_armature, armorCategories, `opzioni.classi.${slug}.addestramento_armature`);
            assertRefs(errors, cls.addestramento_armi, weaponCategories, `opzioni.classi.${slug}.addestramento_armi`);
        }
    }

    if (requireNonEmptyObject(errors, opzioni.specie, "opzioni.specie")) {
        for (const [slug, species] of Object.entries(opzioni.specie)) {
            if (!species.label) errors.push(`opzioni.specie.${slug}: label mancante`);
            if (!requireNonEmptyObject(errors, species.tratti, `opzioni.specie.${slug}.tratti`)) continue;
            for (const [traitSlug, trait] of Object.entries(species.tratti)) {
                if (!trait.label) errors.push(`opzioni.specie.${slug}.tratti.${traitSlug}: label mancante`);
                if (!trait.descrizione) errors.push(`opzioni.specie.${slug}.tratti.${traitSlug}: descrizione mancante`);
                if (trait.tipo === "scelta" && !keys(trait.opzioni).length) {
                    errors.push(`opzioni.specie.${slug}.tratti.${traitSlug}: scelta senza opzioni`);
                }
            }
        }
    }

    if (requireNonEmptyObject(errors, opzioni.background, "opzioni.background")) {
        for (const [slug, background] of Object.entries(opzioni.background)) {
            if (!background.label) errors.push(`opzioni.background.${slug}: label mancante`);
            assertRefs(errors, background.competenze_abilita, skills, `opzioni.background.${slug}.competenze_abilita`);
            assertRefs(errors, background.aumento_caratteristiche?.opzioni, stats, `opzioni.background.${slug}.aumento_caratteristiche.opzioni`);
            if (!Array.isArray(background.competenze_abilita) || background.competenze_abilita.length < 2) {
                errors.push(`opzioni.background.${slug}: competenze_abilita insufficienti`);
            }
        }
    }

    if (errors.length) fail(errors);

    console.log(
        `SRD character data OK: ${keys(opzioni.classi).length} classi, ` +
        `${keys(opzioni.specie).length} specie, ${keys(opzioni.background).length} background, ` +
        `${skills.size} abilita.`
    );
}

main();
