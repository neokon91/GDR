#!/usr/bin/env node

const { execFileSync } = require("child_process");
const { repoPath } = require("./node_utils");

const ROOT = process.cwd();
const CONTRACT = "Dev/TemplateFactory/modules/validation_contract.yaml";
const FIELDS_CORE = "Dev/TemplateFactory/modules/fields_core.yaml";
const FRONTMATTER_PROFILES = "Dev/TemplateFactory/modules/frontmatter_profiles.yaml";
const RUNTIME_PROFILES = "Dev/TemplateFactory/modules/runtime_profiles.yaml";

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

function addField(knownFields, value) {
    const field = String(value ?? "").trim();
    if (field) knownFields.add(field);
}

function knownFrontmatterFields(fieldsCore, frontmatterProfiles) {
    const knownFields = new Set();
    for (const group of Object.values(fieldsCore.fields ?? {})) {
        for (const field of group ?? []) addField(knownFields, field?.name);
    }

    for (const value of Object.values(frontmatterProfiles.field_catalog ?? {})) {
        if (Array.isArray(value)) {
            for (const field of value) addField(knownFields, field);
            continue;
        }
        if (value && typeof value === "object") {
            for (const fields of Object.values(value)) {
                for (const field of fields ?? []) addField(knownFields, field);
            }
        }
    }

    for (const profile of Object.values(frontmatterProfiles.profiles ?? {})) {
        for (const field of profile.required_fields ?? []) addField(knownFields, field);
        for (const field of profile.sample_values ?? []) addField(knownFields, field);
        for (const field of profile.fields ?? []) {
            addField(knownFields, field?.key);
            addField(knownFields, field?.value);
        }
    }
    return knownFields;
}

function requireNonEmptyArray(errors, value, path) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${CONTRACT}: ${path} deve essere lista non vuota`);
        return [];
    }
    const normalized = value.map(String).filter(Boolean);
    const scalarOnly = value.every(item => item === null || !["object", "function"].includes(typeof item));
    if (scalarOnly && new Set(normalized).size !== normalized.length) {
        errors.push(`${CONTRACT}: ${path} contiene valori duplicati`);
    }
    return normalized;
}

function requireNonEmptyMap(errors, value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) {
        errors.push(`${CONTRACT}: ${path} deve essere mappa non vuota`);
        return {};
    }
    return value;
}

function requireNumberAtLeast(errors, value, path, minimum) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum) {
        errors.push(`${CONTRACT}: ${path} deve essere numero >= ${minimum}`);
    }
    return number;
}

function requireNonEmptyString(errors, value, path) {
    const text = String(value ?? "").trim();
    if (!text) errors.push(`${CONTRACT}: ${path} deve essere stringa non vuota`);
    return text;
}

function requireKnownField(errors, knownFields, field, path) {
    if (!knownFields.has(field)) {
        errors.push(`${CONTRACT}: ${path} usa campo non dichiarato in fields_core/frontmatter_profiles (${field})`);
    }
}

function requireKnownFieldArray(errors, knownFields, value, path) {
    const fields = requireNonEmptyArray(errors, value, path);
    for (const field of fields) requireKnownField(errors, knownFields, field, path);
    return fields;
}

function requireKnownFieldGroups(errors, knownFields, value, path) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${CONTRACT}: ${path} deve essere lista non vuota`);
        return [];
    }
    return value.map((group, index) => requireKnownFieldArray(errors, knownFields, group, `${path}.${index}`));
}

function validateCategoryList(errors, categories, allowedCategories, path) {
    for (const category of categories) {
        if (!allowedCategories.has(category)) {
            errors.push(`${CONTRACT}: ${path} contiene categoria non dichiarata in fields_core.yaml (${category})`);
        }
    }
}

function setEquals(left, right) {
    if (left.size !== right.size) return false;
    for (const value of left) {
        if (!right.has(value)) return false;
    }
    return true;
}

const errors = [];
const contract = loadYamlModule(CONTRACT);
const fieldsCore = loadYamlModule(FIELDS_CORE);
const frontmatterProfiles = loadYamlModule(FRONTMATTER_PROFILES);
const runtimeProfiles = loadYamlModule(RUNTIME_PROFILES);
const allowedCategories = valuesForCoreField(fieldsCore, "categoria");
const allowedStates = valuesForCoreField(fieldsCore, "stato");
const knownFields = knownFrontmatterFields(fieldsCore, frontmatterProfiles);

for (const key of ["live_entity_categories", "codex_categories"]) {
    validateCategoryList(errors, requireNonEmptyArray(errors, contract[key], key), allowedCategories, key);
}

const categoryValidation = requireNonEmptyMap(errors, contract.category_validation, "category_validation");
const typeExemptCategories = new Set(requireNonEmptyArray(errors, categoryValidation.type_exempt_categories, "category_validation.type_exempt_categories"));
const requiredFieldExemptCategories = new Set(requireNonEmptyArray(errors, categoryValidation.required_field_exempt_categories, "category_validation.required_field_exempt_categories"));
validateCategoryList(errors, [...typeExemptCategories], allowedCategories, "category_validation.type_exempt_categories");
validateCategoryList(errors, [...requiredFieldExemptCategories], allowedCategories, "category_validation.required_field_exempt_categories");

const allowedTypesByCategory = requireNonEmptyMap(errors, contract.allowed_types_by_category, "allowed_types_by_category");
for (const [category, types] of Object.entries(allowedTypesByCategory)) {
    if (!allowedCategories.has(category)) {
        errors.push(`${CONTRACT}: allowed_types_by_category contiene categoria non dichiarata in fields_core.yaml (${category})`);
    }
    requireNonEmptyArray(errors, types, `allowed_types_by_category.${category}`);
    if (typeExemptCategories.has(category)) {
        errors.push(`${CONTRACT}: ${category} risulta sia in allowed_types_by_category sia in category_validation.type_exempt_categories`);
    }
}
for (const category of allowedCategories) {
    if (!Object.prototype.hasOwnProperty.call(allowedTypesByCategory, category) && !typeExemptCategories.has(category)) {
        errors.push(`${CONTRACT}: allowed_types_by_category non copre categoria ${category} e non la dichiara esente`);
    }
}

const runtimeLocationTypes = new Set((runtimeProfiles.profiles?.luogo?.type_options ?? [])
    .map(option => String(option?.id ?? ""))
    .filter(Boolean));
if (runtimeLocationTypes.size) {
    const contractLocationTypes = new Set((allowedTypesByCategory.luogo ?? []).map(String));
    if (!setEquals(runtimeLocationTypes, contractLocationTypes)) {
        errors.push(`${CONTRACT}: allowed_types_by_category.luogo deve corrispondere a runtime_profiles.luogo.type_options`);
    }
}

const requiredFieldsByCategory = requireNonEmptyMap(errors, contract.required_fields_by_category, "required_fields_by_category");
for (const [category, fields] of Object.entries(requiredFieldsByCategory)) {
    if (!allowedCategories.has(category)) {
        errors.push(`${CONTRACT}: required_fields_by_category contiene categoria non dichiarata in fields_core.yaml (${category})`);
    }
    requireKnownFieldArray(errors, knownFields, fields, `required_fields_by_category.${category}`);
    if (requiredFieldExemptCategories.has(category)) {
        errors.push(`${CONTRACT}: ${category} risulta sia in required_fields_by_category sia in category_validation.required_field_exempt_categories`);
    }
}
for (const category of allowedCategories) {
    if (!Object.prototype.hasOwnProperty.call(requiredFieldsByCategory, category) && !requiredFieldExemptCategories.has(category)) {
        errors.push(`${CONTRACT}: required_fields_by_category non copre categoria ${category} e non la dichiara esente`);
    }
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
    requireKnownFieldArray(errors, knownFields, requirement?.any_of_fields, `state_ready_requirements.pronto.${categoryOrType}.any_of_fields`);
}

requireKnownFieldArray(errors, knownFields, contract.private_frontmatter_fields, "private_frontmatter_fields");
requireNonEmptyArray(errors, contract.private_text_terms, "private_text_terms");

const liveEntityPolicy = requireNonEmptyMap(errors, contract.live_entity_policy, "live_entity_policy");
requireKnownFieldArray(errors, knownFields, liveEntityPolicy.require_any_of_fields, "live_entity_policy.require_any_of_fields");
requireKnownFieldArray(errors, knownFields, liveEntityPolicy.sheet_require_any_of_fields, "live_entity_policy.sheet_require_any_of_fields");

const codexArticlePolicy = requireNonEmptyMap(errors, contract.codex_article_policy, "codex_article_policy");
requireKnownFieldArray(errors, knownFields, codexArticlePolicy.identity_any_of_fields, "codex_article_policy.identity_any_of_fields");
requireKnownFieldArray(errors, knownFields, codexArticlePolicy.table_use_any_of_fields, "codex_article_policy.table_use_any_of_fields");
requireKnownFieldArray(errors, knownFields, codexArticlePolicy.dm_layer_any_of_fields, "codex_article_policy.dm_layer_any_of_fields");
requireKnownFieldArray(errors, knownFields, codexArticlePolicy.operational_link_fields, "codex_article_policy.operational_link_fields");

const sessionPlayabilityPolicy = requireNonEmptyMap(errors, contract.session_playability_policy, "session_playability_policy");
for (const state of requireNonEmptyArray(errors, sessionPlayabilityPolicy.active_states, "session_playability_policy.active_states")) {
    if (!allowedStates.has(state)) {
        errors.push(`${CONTRACT}: session_playability_policy.active_states usa stato non dichiarato in fields_core.yaml (${state})`);
    }
}
requireKnownFieldArray(errors, knownFields, sessionPlayabilityPolicy.playable_any_of_fields, "session_playability_policy.playable_any_of_fields");
requireNumberAtLeast(errors, sessionPlayabilityPolicy.min_world_anchors, "session_playability_policy.min_world_anchors", 1);
const worldAnchorGroups = requireKnownFieldGroups(errors, knownFields, sessionPlayabilityPolicy.world_anchor_groups, "session_playability_policy.world_anchor_groups");
if (worldAnchorGroups.length && Number(sessionPlayabilityPolicy.min_world_anchors) > worldAnchorGroups.length) {
    errors.push(`${CONTRACT}: session_playability_policy.min_world_anchors supera i gruppi world_anchor_groups`);
}
const encounterMaterialField = requireNonEmptyString(errors, sessionPlayabilityPolicy.encounter_material_field, "session_playability_policy.encounter_material_field");
if (encounterMaterialField) requireKnownField(errors, knownFields, encounterMaterialField, "session_playability_policy.encounter_material_field");

const mapReviewPolicy = requireNonEmptyMap(errors, contract.map_review_policy, "map_review_policy");
const playableMapUses = new Set(requireNonEmptyArray(errors, mapReviewPolicy.playable_uses, "map_review_policy.playable_uses"));
requireNonEmptyArray(errors, mapReviewPolicy.structured_uses, "map_review_policy.structured_uses");
requireKnownFieldArray(errors, knownFields, mapReviewPolicy.table_use_any_of_fields, "map_review_policy.table_use_any_of_fields");
requireKnownFieldArray(errors, knownFields, mapReviewPolicy.visibility_any_of_fields, "map_review_policy.visibility_any_of_fields");
requireKnownFieldArray(errors, knownFields, mapReviewPolicy.dm_private_any_of_fields, "map_review_policy.dm_private_any_of_fields");
requireKnownFieldArray(errors, knownFields, mapReviewPolicy.ready_playable_link_any_of_fields, "map_review_policy.ready_playable_link_any_of_fields");
requireKnownFieldArray(errors, knownFields, mapReviewPolicy.ready_structural_link_any_of_fields, "map_review_policy.ready_structural_link_any_of_fields");
const zoomUse = requireNonEmptyString(errors, mapReviewPolicy.zoom_use, "map_review_policy.zoom_use");
if (zoomUse && !playableMapUses.has(zoomUse)) {
    errors.push(`${CONTRACT}: map_review_policy.zoom_use deve essere incluso in map_review_policy.playable_uses`);
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
    if (rule.require_value) requireKnownField(errors, knownFields, String(rule.require_value), `playability_rules.${id}.require_value`);
    if (rule.require_any_of) requireKnownFieldArray(errors, knownFields, rule.require_any_of, `playability_rules.${id}.require_any_of`);
    if (rule.tipo_in) requireNonEmptyArray(errors, rule.tipo_in, `playability_rules.${id}.tipo_in`);
    if (rule.path_prefixes) requireNonEmptyArray(errors, rule.path_prefixes, `playability_rules.${id}.path_prefixes`);
    if (rule.when_value_present) requireKnownField(errors, knownFields, String(rule.when_value_present), `playability_rules.${id}.when_value_present`);
    if (rule.when_any_of_present) requireKnownFieldArray(errors, knownFields, rule.when_any_of_present, `playability_rules.${id}.when_any_of_present`);
    if (rule.any_field_equals) requireNonEmptyArray(errors, rule.any_field_equals, `playability_rules.${id}.any_field_equals`);
    for (const condition of rule.any_field_equals ?? []) {
        requireKnownField(errors, knownFields, String(condition?.field ?? ""), `playability_rules.${id}.any_field_equals.field`);
    }
    if (rule.number_field_gt) requireKnownField(errors, knownFields, String(rule.number_field_gt.field ?? ""), `playability_rules.${id}.number_field_gt.field`);
    if (rule.number_field_gte) requireKnownField(errors, knownFields, String(rule.number_field_gte.field ?? ""), `playability_rules.${id}.number_field_gte.field`);

    if (rule.categoria && !allowedCategories.has(String(rule.categoria))) {
        errors.push(`${CONTRACT}: playability_rules.${id} usa categoria non dichiarata in fields_core.yaml (${rule.categoria})`);
    }
}

if (errors.length) {
    console.error("Validation contract non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Validation contract OK: ${Object.keys(allowedTypesByCategory).length} categorie tipo, ${Object.keys(requiredFieldsByCategory).length} categorie required, ${Object.keys(readyStates).length} policy pronto, ${playabilityRules.length} regole giocabilita, policy live/sessione/mappe validate.`);
