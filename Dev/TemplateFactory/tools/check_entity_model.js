#!/usr/bin/env node

const fs = require("fs");
const { execFileSync } = require("child_process");
const { repoPath } = require("./node_utils");

const ROOT = process.cwd();
const SOURCE = "Dev/TemplateFactory/modules/entity_model.yaml";
const FIELDS_CORE = "Dev/TemplateFactory/modules/fields_core.yaml";
const VALIDATION_CONTRACT = "Dev/TemplateFactory/modules/validation_contract.yaml";
const FRONTMATTER_PROFILES = "Dev/TemplateFactory/modules/frontmatter_profiles.yaml";
const REPLACED_NOTE = "Risorse/Modello Entità.md";
const errors = [];

function fail(message) {
    errors.push(message);
}

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function asArray(value) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function requireString(value, path) {
    const text = String(value ?? "").trim();
    if (!text) fail(`${SOURCE}: ${path} deve essere stringa non vuota`);
    return text;
}

function requireList(value, path) {
    const items = asArray(value);
    if (!items.length) fail(`${SOURCE}: ${path} deve essere lista non vuota`);
    return items;
}

function fieldCatalog(fieldsCore, frontmatterProfiles) {
    const fields = new Set();
    for (const group of Object.values(fieldsCore.fields ?? {})) {
        for (const field of group ?? []) {
            if (field?.name) fields.add(String(field.name));
        }
    }
    for (const field of frontmatterProfiles.field_catalog?.domain_fields ?? []) fields.add(String(field));
    for (const value of Object.values(frontmatterProfiles.field_catalog?.plugin_fields ?? {})) {
        for (const field of value ?? []) fields.add(String(field));
    }
    for (const profile of Object.values(frontmatterProfiles.profiles ?? {})) {
        for (const field of profile.required_fields ?? []) fields.add(String(field));
        for (const field of profile.sample_values ?? []) fields.add(String(field));
        for (const field of profile.fields ?? []) {
            if (field?.key) fields.add(String(field.key));
            if (field?.value) fields.add(String(field.value));
        }
    }
    return fields;
}

function categoryValues(fieldsCore) {
    for (const group of Object.values(fieldsCore.fields ?? {})) {
        for (const field of group ?? []) {
            if (field?.name === "categoria") return new Set(asArray(field.values));
        }
    }
    return new Set();
}

function validateFields(fields, knownFields, path) {
    for (const field of fields) {
        if (!knownFields.has(field)) fail(`${SOURCE}: ${path} usa campo non catalogato (${field})`);
    }
}

function validateRemovedMarkdownNote() {
    if (fs.existsSync(repoPath(ROOT, REPLACED_NOTE))) {
        fail(`${REPLACED_NOTE}: la nota lunga deve essere rimossa; usare ${SOURCE}`);
    }
}

function main() {
    const model = loadYaml(SOURCE);
    const fieldsCore = loadYaml(FIELDS_CORE);
    const validation = loadYaml(VALIDATION_CONTRACT);
    const frontmatterProfiles = loadYaml(FRONTMATTER_PROFILES);
    const categories = model.categories ?? {};
    const knownCategories = categoryValues(fieldsCore);
    const knownFields = fieldCatalog(fieldsCore, frontmatterProfiles);
    const validationRequired = validation.required_fields_by_category ?? {};
    const typeExempt = new Set(asArray(validation.category_validation?.type_exempt_categories));
    const requiredExempt = new Set(asArray(validation.category_validation?.required_field_exempt_categories));
    const allowedTypes = validation.allowed_types_by_category ?? {};

    if (model.id !== "entity_model") fail(`${SOURCE}: id non valido`);
    requireString(model.purpose, "purpose");
    requireString(model.version, "version");
    requireList(model.policy?.structured_note_when, "policy.structured_note_when");
    requireList(model.policy?.folder_when, "policy.folder_when");
    requireList(model.common_fields?.required, "common_fields.required");
    validateFields(asArray(model.common_fields?.required), knownFields, "common_fields.required");
    validateRemovedMarkdownNote();

    if (!categories || typeof categories !== "object" || Array.isArray(categories)) {
        fail(`${SOURCE}: categories deve essere mappa non vuota`);
    }

    for (const category of Object.keys(validationRequired)) {
        if (!categories[category]) fail(`${SOURCE}: categories non copre required_fields_by_category.${category}`);
    }
    for (const category of knownCategories) {
        if (!categories[category]) fail(`${SOURCE}: categories non copre categoria fields_core (${category})`);
    }

    for (const [id, category] of Object.entries(categories)) {
        if (!knownCategories.has(id)) fail(`${SOURCE}: categoria non dichiarata in fields_core (${id})`);
        requireString(category.label, `categories.${id}.label`);
        requireString(category.folder, `categories.${id}.folder`);
        requireString(category.priority, `categories.${id}.priority`);
        if (!["essential", "useful", "defer"].includes(String(category.priority))) {
            fail(`${SOURCE}: categories.${id}.priority non valida (${category.priority})`);
        }
        requireString(category.purpose, `categories.${id}.purpose`);
        requireList(category.create_when, `categories.${id}.create_when`);
        const requiredFields = requireList(category.required_fields, `categories.${id}.required_fields`);
        if (!requiredFields.includes("categoria")) fail(`${SOURCE}: categories.${id}.required_fields deve includere categoria`);
        validateFields(requiredFields, knownFields, `categories.${id}.required_fields`);
        validateFields(asArray(category.useful_fields), knownFields, `categories.${id}.useful_fields`);

        if (!requiredExempt.has(id)) {
            for (const field of validationRequired[id] ?? []) {
                if (!requiredFields.includes(String(field))) {
                    fail(`${SOURCE}: categories.${id}.required_fields non include campo richiesto da validation_contract (${field})`);
                }
            }
        }

        const listedTypes = asArray(category.types);
        if (!typeExempt.has(id)) {
            if (!listedTypes.length) fail(`${SOURCE}: categories.${id}.types deve essere lista non vuota`);
            const allowed = new Set(asArray(allowedTypes[id]));
            if (!allowed.size) fail(`${VALIDATION_CONTRACT}: allowed_types_by_category.${id} mancante`);
            for (const type of listedTypes) {
                if (!allowed.has(type)) fail(`${SOURCE}: categories.${id}.types contiene tipo non ammesso (${type})`);
            }
        }
    }

    if (errors.length) {
        console.error("Entity model non valido:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log(`Entity model OK: ${Object.keys(categories).length} categorie verificate contro fields_core e validation_contract.`);
}

main();
