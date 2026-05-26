#!/usr/bin/env node

const { execFileSync } = require("child_process");
const { repoPath } = require("./node_utils");

const ROOT = process.cwd();
const CONTRACT = "Dev/TemplateFactory/modules/validation_contract.yaml";
const FIELDS_CORE = "Dev/TemplateFactory/modules/fields_core.yaml";

function loadYamlModule(relPath) {
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

function valuesForCoreField(fieldsCore, fieldName) {
    for (const group of Object.values(fieldsCore.fields ?? {})) {
        for (const field of group ?? []) {
            if (field?.name === fieldName) return new Set((field.values ?? []).map(String));
        }
    }
    return new Set();
}

function requireNonEmptyArray(errors, value, path) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${CONTRACT}: ${path} deve essere lista non vuota`);
        return [];
    }
    return value.map(String).filter(Boolean);
}

function requireNonEmptyMap(errors, value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) {
        errors.push(`${CONTRACT}: ${path} deve essere mappa non vuota`);
        return {};
    }
    return value;
}

const errors = [];
const contract = loadYamlModule(CONTRACT);
const fieldsCore = loadYamlModule(FIELDS_CORE);
const allowedCategories = valuesForCoreField(fieldsCore, "categoria");

for (const key of ["live_entity_categories", "codex_categories"]) {
    for (const category of requireNonEmptyArray(errors, contract[key], key)) {
        if (!allowedCategories.has(category)) {
            errors.push(`${CONTRACT}: ${key} contiene categoria non dichiarata in fields_core.yaml (${category})`);
        }
    }
}

const allowedTypesByCategory = requireNonEmptyMap(errors, contract.allowed_types_by_category, "allowed_types_by_category");
for (const [category, types] of Object.entries(allowedTypesByCategory)) {
    if (!allowedCategories.has(category)) {
        errors.push(`${CONTRACT}: allowed_types_by_category contiene categoria non dichiarata in fields_core.yaml (${category})`);
    }
    requireNonEmptyArray(errors, types, `allowed_types_by_category.${category}`);
}

const requiredFieldsByCategory = requireNonEmptyMap(errors, contract.required_fields_by_category, "required_fields_by_category");
for (const [category, fields] of Object.entries(requiredFieldsByCategory)) {
    if (!allowedCategories.has(category)) {
        errors.push(`${CONTRACT}: required_fields_by_category contiene categoria non dichiarata in fields_core.yaml (${category})`);
    }
    requireNonEmptyArray(errors, fields, `required_fields_by_category.${category}`);
}

const readyRequirements = requireNonEmptyMap(errors, contract.state_ready_requirements, "state_ready_requirements");
const readyStates = requireNonEmptyMap(errors, readyRequirements.pronto, "state_ready_requirements.pronto");
const allowedReadyKeys = new Set([
    ...allowedCategories,
    ...Object.keys(allowedTypesByCategory),
    ...Object.values(allowedTypesByCategory).flat().map(String)
]);
for (const [categoryOrType, requirement] of Object.entries(readyStates)) {
    if (!allowedReadyKeys.has(categoryOrType)) {
        errors.push(`${CONTRACT}: state_ready_requirements.pronto contiene chiave non riconducibile a categoria o tipo (${categoryOrType})`);
    }
    requireNonEmptyArray(errors, requirement?.any_of_fields, `state_ready_requirements.pronto.${categoryOrType}.any_of_fields`);
}

requireNonEmptyArray(errors, contract.playability_rules, "playability_rules");
const playabilityRules = Array.isArray(contract.playability_rules) ? contract.playability_rules : [];
const ruleIds = new Set();
for (const rule of playabilityRules) {
    const id = String(rule?.id ?? "");
    if (!id) {
        errors.push(`${CONTRACT}: playability_rules contiene regola senza id`);
        continue;
    }
    if (ruleIds.has(id)) errors.push(`${CONTRACT}: playability_rules id duplicato (${id})`);
    ruleIds.add(id);

    if (!rule.warning) errors.push(`${CONTRACT}: playability_rules.${id} senza warning`);
    if (!rule.require_value && !rule.require_any_of) {
        errors.push(`${CONTRACT}: playability_rules.${id} senza require_value o require_any_of`);
    }
    if (rule.require_any_of) requireNonEmptyArray(errors, rule.require_any_of, `playability_rules.${id}.require_any_of`);
    if (rule.tipo_in) requireNonEmptyArray(errors, rule.tipo_in, `playability_rules.${id}.tipo_in`);
    if (rule.path_prefixes) requireNonEmptyArray(errors, rule.path_prefixes, `playability_rules.${id}.path_prefixes`);
    if (rule.when_any_of_present) requireNonEmptyArray(errors, rule.when_any_of_present, `playability_rules.${id}.when_any_of_present`);
    if (rule.any_field_equals) requireNonEmptyArray(errors, rule.any_field_equals, `playability_rules.${id}.any_field_equals`);

    if (rule.categoria && !allowedCategories.has(String(rule.categoria))) {
        errors.push(`${CONTRACT}: playability_rules.${id} usa categoria non dichiarata in fields_core.yaml (${rule.categoria})`);
    }
}

if (errors.length) {
    console.error("Validation contract non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Validation contract OK: ${Object.keys(allowedTypesByCategory).length} categorie tipo, ${Object.keys(requiredFieldsByCategory).length} categorie required, ${Object.keys(readyStates).length} policy pronto, ${playabilityRules.length} regole giocabilita.`);
