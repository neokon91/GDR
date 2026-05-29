#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const {
    hasAny,
    hasValue,
    parseFrontmatter,
    readJson: readJsonFile,
    existsRel: existsRelFromUtils,
    readTextRel,
    repoPath: repoPathFromUtils,
    rel: relativePath,
    walk: walkFiles
} = require("./node_utils");
const { validatePluginControls } = require("./checks/plugin_controls");
const { validateRequiredFiles } = require("./checks/required_files");
const { validateSyntaxControls } = require("./checks/syntax_controls");
const { validateMarkdownLinks } = require("./checks/markdown_links");
const { validateMetaBindControls } = require("./checks/metabind_controls");
const { validateObsidianConfig } = require("./checks/obsidian_config");
const { validateDndHardening } = require("./checks/dnd_hardening");
const { validatePlayerSafety } = require("./checks/player_safety");
const { validateSourceContentPolicy } = require("./checks/source_content_policy");
const { loadReleaseBoundary, materializedUserFileMap, materializedUserFiles, renderMaterializedUserFile } = require("./release_boundary_utils");
const {
    hasPluginNativeSheet,
    validatePluginNativeExperience
} = require("./checks/plugin_native_sheets");

const ROOT = process.cwd();
const RELEASE_BOUNDARY = loadReleaseBoundary(ROOT);
const GENERATED_VAULT_ROOTS = new Set(RELEASE_BOUNDARY.generated_release_roots ?? []);
function loadYamlModule(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPathFromUtils(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

const FIELDS_CORE = loadYamlModule("Dev/Source/YAML/canonical/fields_core.yaml");
const VALIDATION_CONTRACT = loadYamlModule("Dev/Source/YAML/canonical/validation_contract.yaml");
const REPO_QUALITY_CONTRACT = loadYamlModule("Dev/Source/YAML/quality/repo_quality_contract.yaml");
const REGION_PLAYABILITY_CONTRACT = loadYamlModule("Dev/Source/YAML/canonical/region_playability_contract.yaml");
const REGION_TO_SESSION_CONTRACT = loadYamlModule("Dev/Source/YAML/canonical/region_to_session_contract.yaml");

function coreFieldValues(fieldName) {
    for (const group of Object.values(FIELDS_CORE.fields ?? {})) {
        for (const field of group ?? []) {
            if (field?.name === fieldName) {
                return (field.values ?? [])
                    .map(value => String(value))
                    .filter(Boolean);
            }
        }
    }
    return [];
}

function requiredCoreFieldValues(fieldName) {
    const values = coreFieldValues(fieldName);
    if (!values.length) {
        throw new Error(`Dev/Source/YAML/canonical/fields_core.yaml: campo ${fieldName} senza values dichiarati`);
    }
    return new Set(values);
}

function requiredFieldsByCategory() {
    const contract = VALIDATION_CONTRACT.required_fields_by_category ?? {};
    const entries = Object.entries(contract);
    if (!entries.length) {
        throw new Error("Dev/Source/YAML/canonical/validation_contract.yaml: required_fields_by_category vuoto o mancante");
    }
    return Object.fromEntries(entries.map(([category, fields]) => {
        const requiredFields = (fields ?? [])
            .map(field => String(field))
            .filter(Boolean);
        if (!requiredFields.length) {
            throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: categoria ${category} senza campi richiesti`);
        }
        return [category, requiredFields];
    }));
}

function contractValue(pathText) {
    return String(pathText).split(".").reduce((value, key) => value?.[key], VALIDATION_CONTRACT);
}

function requiredContractArray(pathText) {
    const values = contractValue(pathText) ?? [];
    const normalized = Array.isArray(values)
        ? values.map(value => String(value)).filter(Boolean)
        : [];
    if (!normalized.length) {
        throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return normalized;
}

function repoQualityValue(pathText) {
    return String(pathText).split(".").reduce((value, key) => value?.[key], REPO_QUALITY_CONTRACT);
}

function requiredRepoQualityArray(pathText) {
    const values = repoQualityValue(pathText) ?? [];
    const normalized = Array.isArray(values)
        ? values.map(value => String(value)).filter(Boolean)
        : [];
    if (!normalized.length) {
        throw new Error(`Dev/Source/YAML/quality/repo_quality_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return normalized;
}

function regionContractValue(pathText) {
    return String(pathText).split(".").reduce((value, key) => value?.[key], REGION_PLAYABILITY_CONTRACT);
}

function requiredRegionContractArray(pathText) {
    const values = regionContractValue(pathText) ?? [];
    const normalized = Array.isArray(values)
        ? values.map(value => String(value)).filter(Boolean)
        : [];
    if (!normalized.length) {
        throw new Error(`Dev/Source/YAML/canonical/region_playability_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return normalized;
}

function requiredRegionContractString(pathText, fallback = null) {
    const rawValue = regionContractValue(pathText);
    const value = String(rawValue ?? fallback ?? "").trim();
    if (!value) {
        throw new Error(`Dev/Source/YAML/canonical/region_playability_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return value;
}

function requiredRegionContractNumber(pathText, minimum) {
    const value = Number(regionContractValue(pathText));
    if (!Number.isFinite(value) || value < minimum) {
        throw new Error(`Dev/Source/YAML/canonical/region_playability_contract.yaml: ${pathText} deve essere numero >= ${minimum}`);
    }
    return value;
}

function requiredRegionPlayabilityPolicy() {
    if (REGION_PLAYABILITY_CONTRACT.id !== "region_playability_contract") {
        throw new Error("Dev/Source/YAML/canonical/region_playability_contract.yaml: id non valido");
    }

    const requirementIds = [
        "luoghi",
        "fazioni",
        "conflitti",
        "missioni",
        "pressioni",
        "uscita_verso_sessione",
        "superficie_player_safe"
    ];
    const minimums = Object.fromEntries(requirementIds.map(id => {
        const basePath = `region_playability.minimum_viable_region.${id}`;
        if (regionContractValue(`${basePath}.required`) !== true) {
            throw new Error(`Dev/Source/YAML/canonical/region_playability_contract.yaml: ${basePath}.required deve essere true`);
        }
        return [id, {
            minCount: requiredRegionContractNumber(`${basePath}.min_count`, 1),
            acceptedFields: (regionContractValue(`${basePath}.accepted_fields`) ?? [])
                .map(field => String(field))
                .filter(Boolean),
            reason: String(regionContractValue(`${basePath}.reason`) ?? "")
        }];
    }));

    const candidate = regionContractValue("validation_model.region_candidates") ?? {};
    const typeFields = (Array.isArray(candidate.type_fields) ? candidate.type_fields : ["tipo"])
        .map(field => String(field))
        .filter(Boolean);
    const typeValues = (Array.isArray(candidate.type_values) ? candidate.type_values : ["regione"])
        .map(value => normalizedText(value))
        .filter(Boolean);
    const validatedStates = (Array.isArray(candidate.validated_states) ? candidate.validated_states : ["pronto"])
        .map(value => String(value))
        .filter(Boolean);

    if (!typeFields.length || !typeValues.length || !validatedStates.length) {
        throw new Error("Dev/Source/YAML/canonical/region_playability_contract.yaml: validation_model.region_candidates incompleto");
    }

    return {
        minimums,
        sourceFolders: requiredRegionContractArray("validation_model.source_folders"),
        linkageFields: requiredRegionContractArray("validation_model.linkage_fields"),
        passWhenAllMinimumsAreMet: regionContractValue("validation_model.pass_when_all_minimums_are_met") === true,
        candidate: {
            pathPrefix: String(candidate.path_prefix ?? "Mondi/Luoghi/"),
            categoria: requiredRegionContractString("validation_model.region_candidates.categoria", "luogo"),
            typeFields,
            typeValues: new Set(typeValues),
            validatedStates: new Set(validatedStates)
        }
    };
}

function regionToSessionContractValue(pathText) {
    return String(pathText).split(".").reduce((value, key) => value?.[key], REGION_TO_SESSION_CONTRACT);
}

function requiredRegionToSessionContractArray(pathText) {
    const values = regionToSessionContractValue(pathText) ?? [];
    const normalized = Array.isArray(values)
        ? values.map(value => String(value)).filter(Boolean)
        : [];
    if (!normalized.length) {
        throw new Error(`Dev/Source/YAML/canonical/region_to_session_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return normalized;
}

function requiredRegionToSessionContractNumber(pathText, minimum) {
    const value = Number(regionToSessionContractValue(pathText));
    if (!Number.isFinite(value) || value < minimum) {
        throw new Error(`Dev/Source/YAML/canonical/region_to_session_contract.yaml: ${pathText} deve essere numero >= ${minimum}`);
    }
    return value;
}

function optionalRegionToSessionContractArray(pathText) {
    const values = regionToSessionContractValue(pathText) ?? [];
    return Array.isArray(values)
        ? values.map(value => String(value)).filter(Boolean)
        : [];
}

function requiredRegionToSessionPolicy() {
    if (REGION_TO_SESSION_CONTRACT.id !== "region_to_session_contract") {
        throw new Error("Dev/Source/YAML/canonical/region_to_session_contract.yaml: id non valido");
    }

    const requiredPlayabilityContract = String(regionToSessionContractValue("region_to_session.requires_region_playability_contract") ?? "");
    if (requiredPlayabilityContract !== "Dev/Source/YAML/canonical/region_playability_contract.yaml") {
        throw new Error("Dev/Source/YAML/canonical/region_to_session_contract.yaml: requires_region_playability_contract non allineato");
    }

    const requirementIds = [
        "regione_giocabile",
        "missione_selezionabile",
        "apertura_sessione",
        "luogo_iniziale",
        "fazione_attiva",
        "pressione_attiva",
        "scelta_pg",
        "materiale_player_safe"
    ];
    const minimums = Object.fromEntries(requirementIds.map(id => {
        const basePath = `region_to_session.minimum_session_exit.${id}`;
        if (regionToSessionContractValue(`${basePath}.required`) !== true) {
            throw new Error(`Dev/Source/YAML/canonical/region_to_session_contract.yaml: ${basePath}.required deve essere true`);
        }
        return [id, {
            minCount: requiredRegionToSessionContractNumber(`${basePath}.min_count`, 1),
            acceptedFields: optionalRegionToSessionContractArray(`${basePath}.accepted_fields`),
            sourceFolders: optionalRegionToSessionContractArray(`${basePath}.source_folders`),
            activeStates: new Set(optionalRegionToSessionContractArray(`${basePath}.active_states`)),
            reason: String(regionToSessionContractValue(`${basePath}.reason`) ?? "")
        }];
    }));

    const triggers = regionToSessionContractValue("validation_model.trigger_entities") ?? [];
    if (!Array.isArray(triggers) || !triggers.length) {
        throw new Error("Dev/Source/YAML/canonical/region_to_session_contract.yaml: validation_model.trigger_entities vuoto o mancante");
    }

    return {
        minimums,
        triggers: triggers.map((trigger, index) => {
            const id = String(trigger?.id ?? "").trim();
            const pathPrefix = String(trigger?.path_prefix ?? "").trim();
            const categoria = String(trigger?.categoria ?? "").trim();
            const activeStates = (trigger?.active_states ?? [])
                .map(value => String(value))
                .filter(Boolean);
            if (!id || !pathPrefix || !categoria || !activeStates.length) {
                throw new Error(`Dev/Source/YAML/canonical/region_to_session_contract.yaml: trigger_entities[${index}] incompleto`);
            }
            return { id, pathPrefix, categoria, activeStates: new Set(activeStates) };
        }),
        regionLinkFields: requiredRegionToSessionContractArray("validation_model.region_link_fields"),
        regionScopeLinkageFields: requiredRegionToSessionContractArray("validation_model.region_scope_linkage_fields"),
        sourceFolders: requiredRegionToSessionContractArray("validation_model.source_folders"),
        passWhenAllMinimumsAreMet: regionToSessionContractValue("validation_model.pass_when_all_minimums_are_met") === true
    };
}

function requiredContractListOfLists(pathText) {
    const groups = contractValue(pathText) ?? [];
    if (!Array.isArray(groups) || !groups.length) {
        throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return groups.map((group, index) => {
        const normalized = Array.isArray(group)
            ? group.map(value => String(value)).filter(Boolean)
            : [];
        if (!normalized.length) {
            throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${pathText}.${index} vuoto`);
        }
        return normalized;
    });
}

function requiredContractSet(pathText) {
    return new Set(requiredContractArray(pathText));
}

function requiredContractString(pathText) {
    const value = String(contractValue(pathText) ?? "").trim();
    if (!value) {
        throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${pathText} vuoto o mancante`);
    }
    return value;
}

function requiredContractNumber(pathText, minimum) {
    const value = Number(contractValue(pathText));
    if (!Number.isFinite(value) || value < minimum) {
        throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${pathText} deve essere numero >= ${minimum}`);
    }
    return value;
}

function requiredValidationList(key) {
    return requiredContractSet(key);
}

function requiredValidationSetMap(key) {
    const contract = VALIDATION_CONTRACT[key] ?? {};
    const entries = Object.entries(contract);
    if (!entries.length) {
        throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${key} vuoto o mancante`);
    }
    return Object.fromEntries(entries.map(([category, values]) => {
        const normalized = (values ?? [])
            .map(value => String(value))
            .filter(Boolean);
        if (!normalized.length) {
            throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: ${key}.${category} vuoto`);
        }
        return [category, new Set(normalized)];
    }));
}

function requiredStateReadyRequirements() {
    const ready = VALIDATION_CONTRACT.state_ready_requirements?.pronto ?? {};
    const entries = Object.entries(ready);
    if (!entries.length) {
        throw new Error("Dev/Source/YAML/canonical/validation_contract.yaml: state_ready_requirements.pronto vuoto o mancante");
    }
    return Object.fromEntries(entries.map(([categoryOrType, requirement]) => {
        const anyOfFields = (requirement?.any_of_fields ?? [])
            .map(field => String(field))
            .filter(Boolean);
        if (!anyOfFields.length) {
            throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: state_ready_requirements.pronto.${categoryOrType}.any_of_fields vuoto`);
        }
        return [categoryOrType, anyOfFields];
    }));
}

function requiredPlayabilityRules() {
    const rules = VALIDATION_CONTRACT.playability_rules ?? [];
    if (!Array.isArray(rules) || !rules.length) {
        throw new Error("Dev/Source/YAML/canonical/validation_contract.yaml: playability_rules vuoto o mancante");
    }
    for (const rule of rules) {
        if (!rule?.id || !rule?.warning) {
            throw new Error("Dev/Source/YAML/canonical/validation_contract.yaml: ogni playability_rules deve dichiarare id e warning");
        }
        if (!rule.require_value && !rule.require_any_of) {
            throw new Error(`Dev/Source/YAML/canonical/validation_contract.yaml: playability_rules.${rule.id} senza requisito verificabile`);
        }
    }
    return rules;
}

function requiredMetaBindInputTemplates() {
    const inputs = loadYamlModule("Dev/Source/YAML/json/metabind_inputs.yaml").inputs ?? {};
    return Object.values(inputs)
        .filter(input => input?.required_for_release === true)
        .map(input => String(input.name ?? ""))
        .filter(Boolean);
}

function requiredMetaBindButtons() {
    const buttons = loadYamlModule("Dev/Source/YAML/json/metabind_buttons.yaml").buttons ?? {};
    return Object.values(buttons)
        .filter(button => button?.required_for_release === true)
        .map(button => String(button.id ?? ""))
        .filter(Boolean);
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);
const REQUIRED_PLUGINS = requiredRepoQualityArray("required_surfaces.plugins");
const REQUIRED_SNIPPETS = requiredRepoQualityArray("required_surfaces.snippets");
const REQUIRED_FILES = requiredRepoQualityArray("required_surfaces.files");
const REQUIRED_BASE_FILES = requiredRepoQualityArray("required_surfaces.base_files");
const REQUIRED_LAYER_FILES = requiredRepoQualityArray("required_surfaces.layer_files");
const REQUIRED_DEV_ARCHITECTURE_MARKERS = requiredRepoQualityArray("documentation_markers.dev_readme_architecture");
const REQUIRED_WORKFLOW_CONTRACT_MARKERS = requiredRepoQualityArray("documentation_markers.workflow_contract");
const PUBLIC_PRIVATE_FIELDS = requiredContractArray("private_frontmatter_fields");
const PRIVATE_TEXT_TERMS = requiredContractArray("private_text_terms");
const REQUIRED_META_BIND_INPUT_TEMPLATES = requiredMetaBindInputTemplates();
const REQUIRED_META_BIND_BUTTONS = requiredMetaBindButtons();
const REQUIRED_METADATA_MENU_PRESETS = requiredRepoQualityArray("required_surfaces.metadata_menu_presets");
const TAG_RULES_FILE = "Dev/Source/YAML/canonical/tag_rules.yaml";
const ALLOWED_CATEGORIES = requiredCoreFieldValues("categoria");
const ALLOWED_STATES = requiredCoreFieldValues("stato");
const LIVE_ENTITY_CATEGORIES = requiredValidationList("live_entity_categories");
const CODEX_CATEGORIES = requiredValidationList("codex_categories");
const LIVE_ENTITY_POLICY = {
    requireAnyOfFields: requiredContractArray("live_entity_policy.require_any_of_fields"),
    sheetRequireAnyOfFields: requiredContractArray("live_entity_policy.sheet_require_any_of_fields")
};
const CODEX_ARTICLE_POLICY = {
    identityAnyOfFields: requiredContractArray("codex_article_policy.identity_any_of_fields"),
    tableUseAnyOfFields: requiredContractArray("codex_article_policy.table_use_any_of_fields"),
    dmLayerAnyOfFields: requiredContractArray("codex_article_policy.dm_layer_any_of_fields"),
    operationalLinkFields: requiredContractArray("codex_article_policy.operational_link_fields")
};
const SESSION_PLAYABILITY_POLICY = {
    activeStates: requiredContractSet("session_playability_policy.active_states"),
    playableAnyOfFields: requiredContractArray("session_playability_policy.playable_any_of_fields"),
    minWorldAnchors: requiredContractNumber("session_playability_policy.min_world_anchors", 1),
    worldAnchorGroups: requiredContractListOfLists("session_playability_policy.world_anchor_groups"),
    encounterMaterialField: requiredContractString("session_playability_policy.encounter_material_field")
};
const MAP_REVIEW_POLICY = {
    playableUses: requiredContractSet("map_review_policy.playable_uses"),
    structuredUses: requiredContractSet("map_review_policy.structured_uses"),
    tableUseAnyOfFields: requiredContractArray("map_review_policy.table_use_any_of_fields"),
    visibilityAnyOfFields: requiredContractArray("map_review_policy.visibility_any_of_fields"),
    dmPrivateAnyOfFields: requiredContractArray("map_review_policy.dm_private_any_of_fields"),
    readyPlayableLinkAnyOfFields: requiredContractArray("map_review_policy.ready_playable_link_any_of_fields"),
    readyStructuralLinkAnyOfFields: requiredContractArray("map_review_policy.ready_structural_link_any_of_fields"),
    zoomUse: requiredContractString("map_review_policy.zoom_use")
};
const ALLOWED_TYPES_BY_CATEGORY = requiredValidationSetMap("allowed_types_by_category");
const REQUIRED_FIELDS_BY_CATEGORY = requiredFieldsByCategory();
const READY_REQUIREMENTS_BY_CATEGORY_OR_TYPE = requiredStateReadyRequirements();
const PLAYABILITY_RULES = requiredPlayabilityRules();
const REGION_PLAYABILITY_POLICY = requiredRegionPlayabilityPolicy();
const REGION_TO_SESSION_POLICY = requiredRegionToSessionPolicy();

const errors = [];
const warnings = [];

function rel(file) {
    return relativePath(ROOT, file);
}

function walk(dir, predicate = () => true) {
    return walkFiles(dir, { ignoredDirs: IGNORED_DIRS, predicate });
}

const repoPath = (...parts) => repoPathFromUtils(ROOT, ...parts);
const existsRel = file => existsRelFromUtils(ROOT, file);
const readRel = (file, fallback = "") => readTextRel(ROOT, file, fallback);

function readJson(file) {
    return readJsonFile(file, null, error => {
        errors.push(`${rel(file)}: JSON non valido (${error.message})`);
    });
}

const readOptionalJson = file => fs.existsSync(file) ? readJson(file) : null;
const readOptionalJsonRel = file => readOptionalJson(repoPath(file));

function arrayValue(value) {
    if (Array.isArray(value)) return value;
    if (hasValue(value)) return [value];
    return [];
}

function sameScalar(left, right) {
    if (typeof right === "boolean") return left === right;
    return String(left ?? "") === String(right ?? "");
}

function pathMatchesRule(fileRel, rule) {
    if (rule.path_prefix && !fileRel.startsWith(String(rule.path_prefix))) return false;
    if (rule.path_prefixes) {
        const prefixes = arrayValue(rule.path_prefixes).map(String);
        if (!prefixes.some(prefix => fileRel.startsWith(prefix))) return false;
    }
    return true;
}

function frontmatterMatchesRule(fm, rule) {
    if (rule.categoria && String(fm.categoria ?? "") !== String(rule.categoria)) return false;
    if (rule.tipo && String(fm.tipo ?? "") !== String(rule.tipo)) return false;
    if (rule.tipo_in && !arrayValue(rule.tipo_in).map(String).includes(String(fm.tipo ?? ""))) return false;
    if (rule.stato && String(fm.stato ?? "") !== String(rule.stato)) return false;
    if (rule.stato_not && String(fm.stato ?? "") === String(rule.stato_not)) return false;

    if (rule.number_field_gt) {
        const field = String(rule.number_field_gt.field ?? "");
        if (!(Number(fm[field] ?? 0) > Number(rule.number_field_gt.value))) return false;
    }
    if (rule.number_field_gte) {
        const field = String(rule.number_field_gte.field ?? "");
        if (!(Number(fm[field] ?? 0) >= Number(rule.number_field_gte.value))) return false;
    }
    if (rule.when_value_present && !hasValue(fm[String(rule.when_value_present)])) return false;
    if (rule.when_any_of_present && !hasAny(fm, arrayValue(rule.when_any_of_present).map(String))) return false;
    if (rule.any_field_equals) {
        const matchesAny = arrayValue(rule.any_field_equals).some(condition => sameScalar(fm[String(condition?.field ?? "")], condition?.value));
        if (!matchesAny) return false;
    }
    if (rule.progress_near_completion) {
        if (!(Number(fm.progress_max ?? 0) > 0 && Number(fm.progress_value ?? 0) >= Number(fm.progress_max) - 1)) return false;
    }

    return true;
}

function missingPlayabilityRequirement(fm, rule) {
    if (rule.require_value && !hasValue(fm[String(rule.require_value)])) return true;
    if (rule.require_any_of && !hasAny(fm, arrayValue(rule.require_any_of).map(String))) return true;
    return false;
}

function validatePlayabilityRules(fileRel, fm) {
    const messages = [];
    for (const rule of PLAYABILITY_RULES) {
        if (!pathMatchesRule(fileRel, rule)) continue;
        if (!frontmatterMatchesRule(fm, rule)) continue;
        if (missingPlayabilityRequirement(fm, rule)) messages.push(`${fileRel}: ${rule.warning}`);
    }
    return messages;
}

function noteStem(fileRel) {
    return String(fileRel ?? "").replace(/\\/g, "/").replace(/\.md$/, "");
}

function referenceTokens(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return [];

    const wikilink = raw.match(/^\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]$/);
    const target = (wikilink ? wikilink[1] : raw)
        .replace(/\\/g, "/")
        .replace(/\.md$/, "")
        .trim();
    if (!target) return [];

    return [
        target,
        path.basename(target)
    ].map(token => normalizedText(token)).filter(Boolean);
}

function fieldReferenceTokens(value) {
    return arrayValue(value).flatMap(referenceTokens);
}

function noteReferenceTokens(fileRel, fm) {
    const stem = noteStem(fileRel);
    const tokens = [
        stem,
        path.basename(stem),
        fm.nome,
        fm.id
    ].flatMap(referenceTokens);
    return new Set(tokens);
}

function fieldReferencesNote(value, noteTokens) {
    return fieldReferenceTokens(value).some(token => noteTokens.has(token));
}

function entryReferencesRegion(fm, regionTokens) {
    return REGION_PLAYABILITY_POLICY.linkageFields
        .some(field => fieldReferencesNote(fm[field], regionTokens));
}

function fieldMatchesRegionType(value) {
    return arrayValue(value).some(item => {
        const normalized = normalizedText(item);
        if (REGION_PLAYABILITY_POLICY.candidate.typeValues.has(normalized)) return true;
        return normalized.split(/\s+/).some(part => REGION_PLAYABILITY_POLICY.candidate.typeValues.has(part));
    });
}

function isRegionTypeCandidate(fileRel, fm) {
    const candidate = REGION_PLAYABILITY_POLICY.candidate;
    if (!fileRel.startsWith(candidate.pathPrefix)) return false;
    if (String(fm.categoria ?? "") !== candidate.categoria) return false;
    return candidate.typeFields.some(field => fieldMatchesRegionType(fm[field]));
}

function isRegionPlayabilityCandidate(fileRel, fm) {
    return isRegionTypeCandidate(fileRel, fm)
        && REGION_PLAYABILITY_POLICY.candidate.validatedStates.has(String(fm.stato ?? ""));
}

function entryInRegionContractScope(fileRel) {
    return REGION_PLAYABILITY_POLICY.sourceFolders
        .some(folder => fileRel.startsWith(`${folder.replace(/\/$/, "")}/`));
}

function relatedRegionEntries(realEntries, regionFileRel, regionFm) {
    const regionTokens = noteReferenceTokens(regionFileRel, regionFm);
    return realEntries.filter(([fileRel, fm]) => {
        if (fileRel === regionFileRel) return false;
        if (!entryInRegionContractScope(fileRel)) return false;
        if (String(fm.stato ?? "") === "archiviata" || String(fm.stato ?? "") === "ignorata") return false;
        return entryReferencesRegion(fm, regionTokens);
    });
}

function countRelatedEntries(entries, predicate) {
    return entries.filter(([fileRel, fm]) => fileRel && predicate(fileRel, fm)).length;
}

function hasAcceptedRegionField(fm, fields) {
    return fields.some(field => hasValue(fm[field]));
}

function regionPlayabilityCounts(regionFileRel, regionFm, realEntries) {
    const related = relatedRegionEntries(realEntries, regionFileRel, regionFm);
    const scopedWithRegion = [[regionFileRel, regionFm], ...related];
    const minimums = REGION_PLAYABILITY_POLICY.minimums;

    return {
        luoghi: countRelatedEntries(related, (fileRel, fm) => fileRel.startsWith("Mondi/Luoghi/") && fm.categoria === "luogo"),
        fazioni: countRelatedEntries(related, (fileRel, fm) => fileRel.startsWith("Mondi/Fazioni/") && fm.categoria === "fazione"),
        conflitti: countRelatedEntries(related, (fileRel, fm) => fileRel.startsWith("Mondi/Conflitti/") && fm.categoria === "conflitto"),
        missioni: countRelatedEntries(related, (fileRel, fm) => fileRel.startsWith("Mondi/Missioni/") && fm.categoria === "missione"),
        pressioni: countRelatedEntries(scopedWithRegion, (fileRel, fm) => {
            return fileRel.startsWith("Mondi/Tracciati/")
                || hasAcceptedRegionField(fm, minimums.pressioni.acceptedFields);
        }),
        uscita_verso_sessione: countRelatedEntries(scopedWithRegion, (fileRel, fm) => {
            return fileRel.startsWith("Mondi/Sessioni/")
                || hasAcceptedRegionField(fm, minimums.uscita_verso_sessione.acceptedFields);
        }),
        superficie_player_safe: countRelatedEntries(scopedWithRegion, (fileRel, fm) => {
            return hasAcceptedRegionField(fm, minimums.superficie_player_safe.acceptedFields);
        })
    };
}

function regionPlayabilityMissing(counts) {
    return Object.entries(REGION_PLAYABILITY_POLICY.minimums)
        .filter(([id, requirement]) => (counts[id] ?? 0) < requirement.minCount)
        .map(([id, requirement]) => `${id} ${counts[id] ?? 0}/${requirement.minCount}`);
}

function validateRegionPlayabilityGate(realEntries) {
    const messages = [];
    if (!REGION_PLAYABILITY_POLICY.passWhenAllMinimumsAreMet) return messages;

    for (const [fileRel, fm] of realEntries) {
        if (!isRegionPlayabilityCandidate(fileRel, fm)) continue;

        const counts = regionPlayabilityCounts(fileRel, fm, realEntries);
        const missing = regionPlayabilityMissing(counts);
        if (!missing.length) continue;

        messages.push(`${fileRel}: Region Playability Gate non superato (${missing.join(", ")})`);
    }
    return messages;
}

function isRegionToSessionTrigger(fileRel, fm) {
    return REGION_TO_SESSION_POLICY.triggers.some(trigger => {
        return fileRel.startsWith(trigger.pathPrefix)
            && String(fm.categoria ?? "") === trigger.categoria
            && trigger.activeStates.has(String(fm.stato ?? ""));
    });
}

function triggerHasRegionLink(fm) {
    return hasAny(fm, REGION_TO_SESSION_POLICY.regionLinkFields);
}

function referencedRegionEntries(realEntries, triggerFm) {
    return realEntries.filter(([fileRel, fm]) => {
        if (!isRegionTypeCandidate(fileRel, fm)) return false;
        const regionTokens = noteReferenceTokens(fileRel, fm);
        return REGION_TO_SESSION_POLICY.regionLinkFields
            .some(field => fieldReferencesNote(triggerFm[field], regionTokens));
    });
}

function entryInRegionToSessionScope(fileRel) {
    return REGION_TO_SESSION_POLICY.sourceFolders
        .some(folder => fileRel.startsWith(`${folder.replace(/\/$/, "")}/`));
}

function relatedRegionToSessionEntries(realEntries, regionFileRel, regionFm) {
    const regionTokens = noteReferenceTokens(regionFileRel, regionFm);
    return realEntries.filter(([fileRel, fm]) => {
        if (fileRel === regionFileRel) return false;
        if (!entryInRegionToSessionScope(fileRel)) return false;
        if (String(fm.stato ?? "") === "archiviata" || String(fm.stato ?? "") === "ignorata") return false;
        return REGION_TO_SESSION_POLICY.regionScopeLinkageFields
            .some(field => fieldReferencesNote(fm[field], regionTokens));
    });
}

function uniqueEntries(entries) {
    const seen = new Set();
    return entries.filter(([fileRel]) => {
        if (!fileRel || seen.has(fileRel)) return false;
        seen.add(fileRel);
        return true;
    });
}

function countEntriesWithFields(entries, fields) {
    return entries.filter(([, fm]) => hasAcceptedRegionField(fm, fields)).length;
}

function countRelatedByFolder(entries, folders, predicate = () => true) {
    return entries.filter(([fileRel, fm]) => {
        return folders.some(folder => fileRel.startsWith(`${folder.replace(/\/$/, "")}/`))
            && predicate(fileRel, fm);
    }).length;
}

function regionIsPlayable(regionFileRel, regionFm, realEntries) {
    return isRegionPlayabilityCandidate(regionFileRel, regionFm)
        && regionPlayabilityMissing(regionPlayabilityCounts(regionFileRel, regionFm, realEntries)).length === 0;
}

function regionToSessionCounts(triggerFileRel, triggerFm, regionFileRel, regionFm, realEntries) {
    const related = relatedRegionToSessionEntries(realEntries, regionFileRel, regionFm);
    const scoped = uniqueEntries([[triggerFileRel, triggerFm], [regionFileRel, regionFm], ...related]);
    const minimums = REGION_TO_SESSION_POLICY.minimums;

    return {
        regione_giocabile: regionIsPlayable(regionFileRel, regionFm, realEntries) ? 1 : 0,
        missione_selezionabile: Math.max(
            countRelatedByFolder(related, minimums.missione_selezionabile.sourceFolders, (fileRel, fm) => fileRel && fm.categoria === "missione"),
            countEntriesWithFields(scoped, minimums.missione_selezionabile.acceptedFields)
        ),
        apertura_sessione: countEntriesWithFields(scoped, minimums.apertura_sessione.acceptedFields),
        luogo_iniziale: Math.max(
            countRelatedByFolder(related, ["Mondi/Luoghi"], (fileRel, fm) => fileRel !== regionFileRel && fm.categoria === "luogo"),
            countEntriesWithFields(scoped, minimums.luogo_iniziale.acceptedFields)
        ),
        fazione_attiva: Math.max(
            countRelatedByFolder(related, minimums.fazione_attiva.sourceFolders, (fileRel, fm) => {
                return fileRel && fm.categoria === "fazione" && minimums.fazione_attiva.activeStates.has(String(fm.stato ?? ""));
            }),
            countEntriesWithFields(scoped, minimums.fazione_attiva.acceptedFields)
        ),
        pressione_attiva: countEntriesWithFields(scoped, minimums.pressione_attiva.acceptedFields),
        scelta_pg: countEntriesWithFields(scoped, minimums.scelta_pg.acceptedFields),
        materiale_player_safe: countEntriesWithFields(scoped, minimums.materiale_player_safe.acceptedFields)
    };
}

function regionToSessionMissing(counts) {
    return Object.entries(REGION_TO_SESSION_POLICY.minimums)
        .filter(([id, requirement]) => (counts[id] ?? 0) < requirement.minCount)
        .map(([id, requirement]) => `${id} ${counts[id] ?? 0}/${requirement.minCount}`);
}

function validateRegionToSessionGate(realEntries) {
    const messages = [];
    if (!REGION_TO_SESSION_POLICY.passWhenAllMinimumsAreMet) return messages;

    for (const [fileRel, fm] of realEntries) {
        if (!isRegionToSessionTrigger(fileRel, fm) || !triggerHasRegionLink(fm)) continue;

        const regions = referencedRegionEntries(realEntries, fm);
        if (!regions.length) {
            messages.push(`${fileRel}: Region to Session Gate non superato (regione_giocabile 0/1)`);
            continue;
        }

        for (const [regionFileRel, regionFm] of regions) {
            const counts = regionToSessionCounts(fileRel, fm, regionFileRel, regionFm, realEntries);
            const missing = regionToSessionMissing(counts);
            if (!missing.length) continue;

            messages.push(`${fileRel}: Region to Session Gate non superato verso ${regionFileRel} (${missing.join(", ")})`);
        }
    }
    return messages;
}

function loadAllowedTags() {
    const text = readRel(TAG_RULES_FILE);
    const allowed = new Set();
    for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s+-\s+([a-z0-9][a-z0-9/-]*)\s*$/);
        if (match) allowed.add(match[1]);
    }
    return allowed;
}

function isGranularWikilink(value) {
    return /^\[\[[^\]|]+(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]$/.test(String(value ?? "").trim());
}

function isSectionWikilink(value) {
    const text = String(value ?? "").trim();
    return /^\[\[[^\]|]+#[^^\]|]+(?:\|[^\]]+)?\]\]$/.test(text);
}

function isBlockWikilink(value) {
    const text = String(value ?? "").trim();
    return /^\[\[[^\]|]+#\^[A-Za-z0-9_-]+(?:\|[^\]]+)?\]\]$/.test(text);
}

function requireYamlArray(fileRel, fm, field) {
    if (hasValue(fm[field]) && !Array.isArray(fm[field])) {
        warnings.push(`${fileRel}: ${field} deve essere una lista YAML`);
    }
}

function flatText(value) {
    if (Array.isArray(value)) return value.map(flatText).join(" ");
    if (value && typeof value === "object") return Object.values(value).map(flatText).join(" ");
    return String(value ?? "");
}

function normalizedText(value) {
    return flatText(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function escapedRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesNormalizedTerm(text, term) {
    const normalizedTerm = normalizedText(term);
    if (!normalizedTerm) return false;
    if (/\s/.test(normalizedTerm)) return text.includes(normalizedTerm);
    return new RegExp(`\\b${escapedRegExp(normalizedTerm)}\\b`).test(text);
}

function hasPrivatePublicText(value) {
    const text = normalizedText(value);
    return PRIVATE_TEXT_TERMS.some(term => includesNormalizedTerm(text, term));
}

function hasOperationalLinks(frontmatter) {
    return hasAny(frontmatter, CODEX_ARTICLE_POLICY.operationalLinkFields);
}

function hasCodexIdentity(frontmatter) {
    return hasAny(frontmatter, CODEX_ARTICLE_POLICY.identityAnyOfFields);
}

function hasCodexTableUse(frontmatter) {
    return hasAny(frontmatter, CODEX_ARTICLE_POLICY.tableUseAnyOfFields);
}

function hasCodexDmLayer(frontmatter) {
    if (frontmatter.pubblico === true) return true;
    return hasAny(frontmatter, CODEX_ARTICLE_POLICY.dmLayerAnyOfFields);
}

function sessionWorldAnchorCount(frontmatter) {
    return SESSION_PLAYABILITY_POLICY.worldAnchorGroups
        .filter(fields => hasAny(frontmatter, fields))
        .length;
}

function daysSince(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return null;
    return Math.floor((Date.now() - timestamp) / 86400000);
}

function isFolderIndex(fileRel) {
    const parsed = path.parse(fileRel);
    return parsed.name === path.basename(parsed.dir);
}

function isSrdNote(fileRel) {
    return fileRel.startsWith("SRD/");
}

function isIndexLikeNote(fileRel) {
    return isFolderIndex(fileRel) || [
        "Mondi/Mondo.md",
        "Mondi/Calendario.md",
        "Mondi/Stato del Mondo.md",
        "Dev/Sviluppo Vault.md",
        "Risorse/Smistamento Bozze Generate.md",
        "Risorse/Guida DM.md",
        "Risorse/Controllo Vault.md",
        "Hub/1. DM Dashboard.md",
        "Hub/Atlante del Mondo.md",
        "Hub/Bibbia del Mondo.md",
        "Hub/Campagna da Ambientazione.md",
        "Hub/Compendium Del Mondo.md",
        "Hub/Controllo Canone.md",
        "Hub/Controllo Worldbuilding.md",
        "Hub/Cosa Succede Fuori Scena.md",
        "Hub/Durante il Gioco.md",
        "Hub/Economia E Rotte.md",
        "Hub/Geopolitical Dashboard.md",
        "Hub/Lore Hub.md",
        "Hub/Motore Mondo Vivo.md",
        "Hub/Revisione Lore.md",
        "Hub/Vista Giocatori.md",
        "Hub/Worldbuilder Dashboard.md"
    ].includes(fileRel);
}

function isOperationalNote(fileRel) {
    return !isSrdNote(fileRel) && (/^(Campagne|Inbox|Mondi|Risorse|z\.modelli)\//.test(fileRel) || !fileRel.includes("/"));
}

function isLiveEntityNote(fileRel) {
    return /^(Mondi\/(Luoghi|Personaggi|Fazioni|Missioni|Timeline|Oggetti|Tracciati|Relazioni|Rotte|Risorse|Mercati|Culture|Religioni|Societa)|Risorse\/Mappe)\//.test(fileRel)
        && !isIndexLikeNote(fileRel)
        && !fileRel.startsWith("z.modelli/");
}

function isReleaseContentNote(fileRel) {
    return /^(Mondi|Campagne)\//.test(fileRel)
        && !isIndexLikeNote(fileRel)
        && !fileRel.startsWith("Mondi/SRD/");
}

function isGeneratedFantasyDraft(fileRel, frontmatter) {
    return fileRel.startsWith("Inbox/Generati/") && frontmatter.plugin === "fantasy-content-generator";
}

function targetPath(target) {
    const normalized = String(target ?? "").replace(/\\/g, "/").trim();
    if (!normalized) return "";
    return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

const generatedTemplatePaths = new Set();
const generatedMetadataPaths = new Set();

function addGeneratedTemplatePath(templatePath) {
    const normalized = String(templatePath ?? "").replace(/\\/g, "/");
    if (!normalized) return;
    generatedTemplatePaths.add(normalized);
    generatedTemplatePaths.add(normalized.replace(/\.md$/, ""));
}

const templateFactoryManifest = readOptionalJsonRel("z.modelli/.templatefactory-manifest.json");
for (const entry of templateFactoryManifest?.files ?? []) {
    addGeneratedTemplatePath(entry?.path);
}

try {
    const stdout = execFileSync("python3", ["-c", [
        "import json, sys",
        "from pathlib import Path",
        "root = Path.cwd()",
        "sys.path.insert(0, str(root / 'Dev' / 'Tools' / 'python'))",
        "from render_template_factory import materialized_targets",
        "from template_factory_utils import load_modules, resolved_blueprints, ROOT",
        "modules = load_modules()",
        "blueprints = resolved_blueprints(modules)",
        "paths = []",
        "for name, blueprint in sorted(blueprints.items()):",
        "    for target in materialized_targets(name, blueprint):",
        "        paths.append(str(target.relative_to(ROOT)))",
        "print(json.dumps(paths, ensure_ascii=False))"
    ].join("\n")], {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
        maxBuffer: 1024 * 1024
    });
    for (const templatePath of JSON.parse(stdout)) {
        addGeneratedTemplatePath(templatePath);
    }
} catch (error) {
    errors.push(`TemplateFactory: impossibile leggere i target generati (${error.message})`);
}

try {
    const stdout = execFileSync("python3", ["Dev/Tools/python/render_metadata_surfaces.py", "--list-targets"], {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
        maxBuffer: 1024 * 1024
    });
    for (const metadataPath of stdout.split(/\r?\n/).filter(Boolean)) {
        generatedMetadataPaths.add(metadataPath.replace(/\\/g, "/"));
    }
} catch (error) {
    errors.push(`Metadata surfaces: impossibile leggere i target generati (${error.message})`);
}

function isGeneratedTemplatePath(fileRel) {
    const normalized = String(fileRel ?? "").replace(/\\/g, "/");
    return generatedTemplatePaths.has(normalized) || generatedTemplatePaths.has(targetPath(normalized));
}

const markdownFiles = walk(ROOT, file => file.endsWith(".md"));
const linkableFiles = walk(ROOT, file => /\.(md|canvas|base)$/.test(file));
const virtualUserFiles = materializedUserFiles(ROOT);
const virtualUserFileMap = materializedUserFileMap(ROOT);
const virtualUserPaths = new Set();
const markdownByPath = new Set();
const markdownByBasename = new Map();
const linkableByPath = new Set();
const linkableByBasename = new Map();
const markdownTextByPath = new Map();
const markdownMeta = new Map();

for (const file of linkableFiles) {
    const fileRel = rel(file);
    const stem = fileRel.replace(/\.(md|canvas|base)$/, "");
    const basename = path.basename(stem);

    linkableByPath.add(stem);
    if (!linkableByBasename.has(basename)) linkableByBasename.set(basename, []);
    linkableByBasename.get(basename).push(fileRel);
}

for (const virtualFile of virtualUserFiles) {
    const fileRel = String(virtualFile.path ?? "").replace(/\\/g, "/");
    if (!fileRel) continue;
    const stem = fileRel.replace(/\.md$/, "");
    const basename = path.basename(stem);
    let currentDir = path.dirname(fileRel).replace(/\\/g, "/");

    virtualUserPaths.add(fileRel);
    virtualUserPaths.add(stem);
    while (currentDir && currentDir !== ".") {
        virtualUserPaths.add(currentDir);
        currentDir = path.dirname(currentDir).replace(/\\/g, "/");
    }
    linkableByPath.add(stem);
    markdownByPath.add(stem);
    if (!linkableByBasename.has(basename)) linkableByBasename.set(basename, []);
    linkableByBasename.get(basename).push(fileRel);
    if (!markdownByBasename.has(basename)) markdownByBasename.set(basename, []);
    markdownByBasename.get(basename).push(fileRel);
}

for (const file of markdownFiles) {
    const fileRel = rel(file);
    const stem = fileRel.replace(/\.md$/, "");
    const basename = path.basename(stem);
    const text = fs.readFileSync(file, "utf8");

    markdownByPath.add(stem);
    if (!markdownByBasename.has(basename)) markdownByBasename.set(basename, []);
    markdownByBasename.get(basename).push(fileRel);
    markdownTextByPath.set(fileRel, text);
    markdownMeta.set(fileRel, parseFrontmatter(text));
}

function markdownText(file) {
    const fileRel = rel(file);
    return markdownTextByPath.get(fileRel) ?? fs.readFileSync(file, "utf8");
}

const modelMarkdownFiles = markdownFiles.filter(file => rel(file).startsWith("z.modelli/"));

for (const file of walk(ROOT, file => file.endsWith(".json"))) {
    readJson(file);
}

const communityPlugins = readJson(repoPath(".obsidian/community-plugins.json")) ?? [];
const tasksConfig = readOptionalJsonRel(".obsidian/plugins/obsidian-tasks-plugin/data.json") ?? {};
const calendariumData = readOptionalJsonRel(".obsidian/plugins/calendarium/data.json") ?? {};
const calendariumCalendars = Array.isArray(calendariumData.calendars)
    ? calendariumData.calendars
    : Object.values(calendariumData.calendars ?? {});
const calendariumNames = new Set(calendariumCalendars
    .flatMap(calendar => [calendar?.name, calendar?.id])
    .filter(Boolean)
    .map(value => String(value).toLowerCase()));

validateRequiredFiles({
    errors,
    existsRel,
    generatedFiles: generatedMetadataPaths,
    generatedVaultRoots: GENERATED_VAULT_ROOTS,
    requiredBaseFiles: REQUIRED_BASE_FILES,
    requiredFiles: REQUIRED_FILES,
    requiredLayerFiles: REQUIRED_LAYER_FILES
});

const pluginMatrixPath = repoPath("Dev/plugin_matrix.json");
const pluginMatrix = readJson(pluginMatrixPath) ?? [];
const pluginBindings = loadYamlModule("Dev/Source/YAML/canonical/plugin_bindings.yaml");
validatePluginControls({
    communityPlugins,
    errors,
    existsRel,
    generatedFiles: generatedMetadataPaths,
    hasValue,
    isGeneratedTemplatePath,
    isVirtualUserPath: target => virtualUserPaths.has(String(target ?? "").replace(/\\/g, "/").replace(/\/$/, "")),
    pluginBindings,
    pluginMatrix,
    repoPath,
    requiredPlugins: REQUIRED_PLUGINS,
    targetPath,
    tasksConfig
});

validateSyntaxControls({
    errors,
    rel,
    repoPath,
    requiredSnippets: REQUIRED_SNIPPETS,
    root: ROOT,
    walk
});

validateMarkdownLinks({
    errors,
    generatedVaultRoots: GENERATED_VAULT_ROOTS,
    isGeneratedTemplatePath,
    linkableByBasename,
    linkableByPath,
    markdownFiles,
    markdownText,
    rel,
    warnings
});

const metaBindConfigPath = repoPath(".obsidian/plugins/obsidian-meta-bind-plugin/data.json");
const metaBindConfig = readJson(metaBindConfigPath);
validateMetaBindControls({
    errors,
    existsRel,
    isGeneratedTemplatePath,
    markdownFiles,
    markdownText,
    metaBindConfig,
    modelMarkdownFiles,
    rel,
    repoPath,
    requiredButtons: REQUIRED_META_BIND_BUTTONS,
    requiredInputTemplates: REQUIRED_META_BIND_INPUT_TEMPLATES,
    targetPath,
    walk,
    warnings
});

const metadataMenuConfig = readJson(repoPath(".obsidian/plugins/metadata-menu/data.json"));
const iconConfig = readJson(repoPath(".obsidian/plugins/obsidian-icon-folder/data.json"));
const appConfig = readJson(repoPath(".obsidian/app.json"));
const workspace = readOptionalJsonRel(".obsidian/workspace.json");
validateObsidianConfig({
    appConfig,
    errors,
    existsRel,
    iconConfig,
    isGeneratedTemplatePath,
    isVirtualUserPath: target => virtualUserPaths.has(String(target ?? "").replace(/\\/g, "/").replace(/\/$/, "")),
    markdownFiles,
    markdownText,
    metadataMenuConfig,
    rel,
    requiredMetadataMenuPresets: REQUIRED_METADATA_MENU_PRESETS,
    workspace
});

const realEntries = [...markdownMeta.entries()]
    .filter(([fileRel]) => !isFolderIndex(fileRel));
const allowedTags = loadAllowedTags();

const generatedDrafts = realEntries
    .filter(([fileRel, fm]) => isGeneratedFantasyDraft(fileRel, fm) && fm.stato === "bozza");

validatePluginNativeExperience({
    errors,
    markdownMeta,
    readRel,
    warnings
});

if (generatedDrafts.length > 12) {
    warnings.push(`Inbox/Generati: ${generatedDrafts.length} bozze generate da smistare`);
}

const { metaActionsText } = validateSourceContentPolicy({
    errors,
    readRel
});

const devReadmeText = readRel("Dev/README.md");
for (const marker of REQUIRED_DEV_ARCHITECTURE_MARKERS) {
    if (!devReadmeText.includes(marker)) {
        errors.push(`Dev/README.md: contratto architetturale mancante (${marker})`);
    }
}

const workflowsText = readRel("Dev/Source/YAML/json/workflows.yaml");
for (const marker of REQUIRED_WORKFLOW_CONTRACT_MARKERS) {
    if (!workflowsText.includes(marker)) {
        errors.push(`workflows.yaml: contratto continuita dichiarativa mancante (${marker})`);
    }
}

if (!metaActionsText.includes('action === "registra_scelta_mondo"') || !metaActionsText.includes("trackStep")) {
    errors.push("meta_actions.js: azione continuita registra_scelta_mondo mancante o senza avanzamento tracciati");
}

const activeSessions = realEntries
    .filter(([fileRel, fm]) => fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && fm.attiva === true);

if (activeSessions.length > 1) {
    errors.push(`Sessioni multiple attive: ${activeSessions.map(([fileRel]) => fileRel).join(", ")}`);
}

warnings.push(...validateRegionPlayabilityGate(realEntries));
warnings.push(...validateRegionToSessionGate(realEntries));

const startHereText = readRel("Inizia Qui.md");
const quickSessionIndex = startHereText.indexOf("Prima Sessione");
const worldbuildingIndex = Math.max(
    startHereText.indexOf("Crea Il Mondo"),
    startHereText.indexOf("Crea mondo"),
    startHereText.indexOf("Crea Mondo")
);
const prepIndex = startHereText.indexOf("Prepara");
const playIndex = startHereText.indexOf("Gioca");
if (quickSessionIndex === -1 || worldbuildingIndex === -1 || prepIndex === -1 || playIndex === -1) {
    errors.push("Inizia Qui.md: il flusso deve esporre Prima Sessione, Crea mondo, Prepara e Gioca");
} else if (Math.min(quickSessionIndex, worldbuildingIndex) > playIndex) {
    errors.push("Inizia Qui.md: il flusso deve proporre prima sessione o mondo prima di Gioca");
}

const setupText = readRel("Risorse/Setup Guidato.md");
for (const marker of ["Crea o apri un mondo", "Prepara una sessione", "Durante il Gioco", "Hub/Cosa Succede Fuori Scena"]) {
    if (!setupText.includes(marker)) {
        errors.push(`Risorse/Setup Guidato.md: percorso primo utilizzo incompleto (${marker})`);
    }
}
const dmGuideText = readRel("Risorse/Guida DM.md");
for (const marker of ["Cosa Fare Ora", "renderDmGuideNow", "renderDmGuideLoop", "renderDmGuideRules", "renderDmGuideSurfaceLinks"]) {
    if (!dmGuideText.includes(marker)) {
        errors.push(`Risorse/Guida DM.md: bussola DM incompleta (${marker})`);
    }
}
if (/dv\.pages\(/.test(dmGuideText) || dmGuideText.includes("````tabs") || /^```dataview\s*$/m.test(dmGuideText)) {
    errors.push("Risorse/Guida DM.md: non deve contenere query Dataview inline dopo la migrazione cockpit");
}
if (dmGuideText.split(/\r?\n/).length > 140) {
    errors.push("Risorse/Guida DM.md: superficie troppo lunga per una bussola DM compatta");
}

const pluginIntegrationText = readRel("Dev/Source/YAML/json/plugin_matrix.yaml");
for (const marker of ["Riesame Valore Quotidiano", "Mappe", "Canvas / Excalidraw", "Calendarium", "Fantasy Content Generator", "Media", "Tasks / Kanban", "Crea -> Prepara -> Gioca -> Aggiorna"]) {
    if (!pluginIntegrationText.includes(marker)) {
        errors.push(`plugin_matrix.yaml: riesame valore quotidiano plugin incompleto (${marker})`);
    }
}
if (!readRel("Risorse/Mappe/Mappe.md").includes("Prossima Azione Mappa")) {
    errors.push("Risorse/Mappe/Mappe.md: manca azione operativa quotidiana per mappe");
}
const taskDmText = readRel("Risorse/Task DM.md");
for (const marker of ["Post-Sessione Adesso", "Preparazione Adesso", "z.bacheche/Preparazione Sessioni", "z.bacheche/Post Sessione"]) {
    if (!taskDmText.includes(marker)) {
        errors.push(`Risorse/Task DM.md: vista Tasks/Kanban quotidiana incompleta (${marker})`);
    }
}
const calendarText = existsRel("Mondi/Calendario.md")
    ? readRel("Mondi/Calendario.md")
    : renderMaterializedUserFile(virtualUserFileMap.get("Mondi/Calendario.md") ?? {});
if (!calendarText.includes("Prossima Scadenza Narrativa")) {
    errors.push("Mondi/Calendario.md: manca vista operativa Calendarium/scadenze");
}
const mediaSceneText = readRel("Risorse/Media Scene.md");
if (!mediaSceneText.includes("Media Per La Sessione Attiva")) {
    errors.push("Risorse/Media Scene.md: manca vista operativa media per sessione attiva");
}
for (const marker of ["renderMediaSceneNow", "renderMediaSceneSessionCues", "renderMediaSceneCueQueues"]) {
    if (!mediaSceneText.includes(marker)) {
        errors.push(`Risorse/Media Scene.md: manca runtime media scene (${marker})`);
    }
}
if (/dv\.pages\(/.test(mediaSceneText) || /^```dataview\s*$/m.test(mediaSceneText)) {
    errors.push("Risorse/Media Scene.md: non deve contenere query Dataview inline dopo la migrazione cockpit");
}
const generatedDraftsText = readRel("Risorse/Smistamento Bozze Generate.md");
if (!generatedDraftsText.includes("Prossima Bozza Da Decidere")) {
    errors.push("Risorse/Smistamento Bozze Generate.md: manca vista operativa per prossima bozza generata");
}

const sessionViewsLines = readRel("z.engine/session_views.js").split(/\r?\n/).length;
if (sessionViewsLines > 1600) {
    errors.push(`z.engine/session_views.js: ${sessionViewsLines} righe, tagliare per famiglie runtime prima di aggiungere nuove viste`);
}

const datedForCalendarium = realEntries.filter(([, fm]) => hasValue(fm["fc-date"]) && fm["fc-ignore"] !== true);
if (communityPlugins.includes("calendarium") && !calendariumCalendars.length && datedForCalendarium.length) {
    warnings.push(`Calendarium installato ma senza calendari salvati; ${datedForCalendarium.length} note hanno fc-date`);
}
if (calendariumCalendars.length) {
    for (const [fileRel, fm] of datedForCalendarium) {
        if (hasValue(fm["fc-calendar"]) && !calendariumNames.has(String(fm["fc-calendar"]).toLowerCase())) {
            warnings.push(`${fileRel}: fc-calendar non configurato in Calendarium (${fm["fc-calendar"]})`);
        }
    }

    for (const [fileRel, fm] of realEntries) {
        if (!["mondo", "campagna"].includes(fm.categoria)) continue;
        if (hasValue(fm.calendario) && !calendariumNames.has(String(fm.calendario).toLowerCase())) {
            warnings.push(`${fileRel}: calendario preferito non configurato in Calendarium (${fm.calendario})`);
        }
    }
}

for (const [fileRel, fm] of realEntries) {
    const text = readRel(fileRel);

    for (const tag of arrayValue(fm.tags)) {
        const normalizedTag = String(tag).replace(/^#/, "").trim();
        if (normalizedTag && !allowedTags.has(normalizedTag)) {
            warnings.push(`${fileRel}: tag non previsto o non coerente (${normalizedTag})`);
        }
    }

    for (const field of ["fonti", "riferimenti_srd", "riferimenti_regola", "sezioni_collegate", "blocchi_collegati", "tabelle_collegate", "tags"]) {
        requireYamlArray(fileRel, fm, field);
    }

    for (const field of ["fonti", "riferimenti_srd", "riferimenti_regola"]) {
        for (const target of arrayValue(fm[field])) {
            if (!isGranularWikilink(target)) {
                warnings.push(`${fileRel}: ${field} deve usare wikilink a nota, sezione o blocco (${target})`);
            }
        }
    }

    for (const field of ["sezioni_collegate"]) {
        for (const target of arrayValue(fm[field])) {
            if (!isSectionWikilink(target)) {
                warnings.push(`${fileRel}: ${field} deve usare wikilink a sezione Nota#Sezione (${target})`);
            }
        }
    }

    for (const field of ["blocchi_collegati", "tabelle_collegate"]) {
        for (const target of arrayValue(fm[field])) {
            if (!isBlockWikilink(target)) {
                warnings.push(`${fileRel}: ${field} deve usare wikilink a block id Nota#^blocco (${target})`);
            }
        }
    }

    if (isReleaseContentNote(fileRel) && !hasPluginNativeSheet(text)) {
        warnings.push(`${fileRel}: nota di release senza scheda plugin-native completa (tabs, callout, controlli dinamici, fallback)`);
    }

    if (isOperationalNote(fileRel) && hasValue(fm.categoria) && !ALLOWED_CATEGORIES.has(String(fm.categoria))) {
        warnings.push(`${fileRel}: categoria non prevista (${fm.categoria})`);
    }

    const allowedTypes = ALLOWED_TYPES_BY_CATEGORY[fm.categoria];
    if (isOperationalNote(fileRel) && allowedTypes && hasValue(fm.tipo) && !allowedTypes.has(String(fm.tipo))) {
        warnings.push(`${fileRel}: tipo non previsto per categoria ${fm.categoria} (${fm.tipo})`);
    }

    if (isOperationalNote(fileRel) && hasValue(fm.stato) && !ALLOWED_STATES.has(String(fm.stato))) {
        warnings.push(`${fileRel}: stato non previsto (${fm.stato})`);
    }

    const requiredFields = isIndexLikeNote(fileRel) ? [] : REQUIRED_FIELDS_BY_CATEGORY[fm.categoria] ?? [];
    for (const field of requiredFields) {
        if (!Object.prototype.hasOwnProperty.call(fm, field) || !hasValue(fm[field])) {
            warnings.push(`${fileRel}: campo frontmatter mancante o vuoto (${field})`);
        }
    }

    if (fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && !Object.prototype.hasOwnProperty.call(fm, "attiva")) {
        warnings.push(`${fileRel}: sessione senza campo esplicito attiva`);
    }

    if (fileRel.startsWith("Mondi/") && fm.categoria === "mondo" && fm.fileClass !== "mondo") {
        warnings.push(`${fileRel}: mondo senza fileClass mondo`);
    }

    if (fm.stato === "pronto") {
        const fields = READY_REQUIREMENTS_BY_CATEGORY_OR_TYPE[fm.tipo] ?? READY_REQUIREMENTS_BY_CATEGORY_OR_TYPE[fm.categoria] ?? null;

        if (fields && !hasAny(fm, fields)) {
            warnings.push(`${fileRel}: nota pronta senza collegamenti minimi (${fields.join(", ")})`);
        }
    }

    warnings.push(...validatePlayabilityRules(fileRel, fm));

    if (fileRel.startsWith("Inbox/") && fm.categoria === "lore capture" && hasAny(fm, ["impatto", "conseguenze"]) && !hasAny(fm, ["entita_impattate", "propaga_a", "collegamenti"])) {
        warnings.push(`${fileRel}: lore con impatto senza propagazione o collegamenti`);
    }

    if (hasAny(fm, ["conseguenze", "impatto", "conseguenza_potenziale", "aggiornamenti_richiesti"]) && !hasAny(fm, ["entita_impattate", "propaga_a", "applicata_a"])) {
        warnings.push(`${fileRel}: continuita con impatto ma senza bersagli`);
    }

    if (String(fm.propagazione_stato ?? "") === "applicata" && !hasAny(fm, ["applicata_a", "propaga_a", "entita_impattate"])) {
        warnings.push(`${fileRel}: propagazione_stato applicata senza bersagli applicati`);
    }

    if (String(fm.propagazione_stato ?? "") === "da verificare" && !hasAny(fm, ["aggiornamenti_richiesti", "prossima_mossa", "impatto"])) {
        warnings.push(`${fileRel}: propagazione da verificare senza aggiornamento richiesto`);
    }

    if (String(fm.propagazione_stato ?? "") === "applicata" && !hasAny(fm, ["ultima_propagazione", "applicata_il"])) {
        warnings.push(`${fileRel}: propagazione applicata senza data di applicazione o ultima_propagazione`);
    }

    if (fileRel.startsWith("Mondi/Luoghi/") && fm.stato === "pronto" && !hasAny(fm, ["pericolo", "stabilita", "pressione"])) {
        warnings.push(`${fileRel}: luogo pronto senza pericolo, stabilita o pressione`);
    }

    if (isLiveEntityNote(fileRel) && LIVE_ENTITY_CATEGORIES.has(String(fm.categoria ?? "")) && fm.stato !== "archiviata") {
        if (!hasAny(fm, LIVE_ENTITY_POLICY.requireAnyOfFields)) {
            warnings.push(`${fileRel}: entita viva senza campi operativi minimi (${LIVE_ENTITY_POLICY.requireAnyOfFields.join(", ")})`);
        }
        if (text.includes("## Scheda Viva") && !hasAny(fm, LIVE_ENTITY_POLICY.sheetRequireAnyOfFields)) {
            warnings.push(`${fileRel}: Scheda Viva presente ma campi vivi vuoti`);
        }
    }

    if (fm.pubblico === true && !hasValue(fm.player_safe) && isLiveEntityNote(fileRel)) {
        warnings.push(`${fileRel}: pubblico true ma player_safe vuoto`);
    }

    if (fm.pubblico === true && isLiveEntityNote(fileRel) && hasAny(fm, PUBLIC_PRIVATE_FIELDS)) {
        errors.push(`${fileRel}: pubblico true con campi DM evidenti`);
    }

    if (isLiveEntityNote(fileRel) && CODEX_CATEGORIES.has(String(fm.categoria ?? "")) && fm.stato !== "archiviata") {
        const missingCodex = [];
        if (!hasCodexIdentity(fm)) missingCodex.push("identita");
        if (!hasCodexTableUse(fm)) missingCodex.push("al tavolo");
        if (!hasValue(fm.player_safe)) missingCodex.push("player_safe");
        if (!hasCodexDmLayer(fm)) missingCodex.push("DM");
        if (!hasOperationalLinks(fm)) missingCodex.push("connessioni vive");

        if (missingCodex.length) {
            warnings.push(`${fileRel}: articolo Codex incompleto (${missingCodex.join(", ")})`);
        }
    }

    if (fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && SESSION_PLAYABILITY_POLICY.activeStates.has(String(fm.stato ?? ""))) {
        if (!hasAny(fm, SESSION_PLAYABILITY_POLICY.playableAnyOfFields)) {
            warnings.push(`${fileRel}: sessione non verificabile come giocabile (gancio, scelta, pressione, materiale o output mancanti)`);
        }

        const anchorCount = sessionWorldAnchorCount(fm);
        if (anchorCount < SESSION_PLAYABILITY_POLICY.minWorldAnchors) {
            warnings.push(`${fileRel}: sessione senza almeno ${SESSION_PLAYABILITY_POLICY.minWorldAnchors} ancore mondo (${anchorCount}/${SESSION_PLAYABILITY_POLICY.minWorldAnchors} tra mondo, luoghi, poteri/PNG, missioni, clock, mappe/scena)`);
        }

        if (hasValue(fm.incontri) && !hasValue(fm[SESSION_PLAYABILITY_POLICY.encounterMaterialField])) {
            warnings.push(`${fileRel}: sessione con incontro ma senza ${SESSION_PLAYABILITY_POLICY.encounterMaterialField}`);
        }
    }

    validatePlayerSafety({
        fileRel,
        frontmatter: fm,
        text,
        publicPrivateFields: PUBLIC_PRIVATE_FIELDS,
        warnings,
        errors,
        hasAny,
        hasValue,
        hasPrivatePublicText,
        normalizedText
    });

    validateDndHardening({ fileRel, frontmatter: fm, warnings, hasAny, hasValue });

    if (isGeneratedFantasyDraft(fileRel, fm)) {
        if (fm.canonico === true) {
            errors.push(`${fileRel}: bozza generata marcata canonica prima dello smistamento`);
        }
        if (fm.stato !== "bozza" && fm.stato !== "archiviata") {
            warnings.push(`${fileRel}: bozza generata non spostata dopo lo smistamento (${fm.stato})`);
        }
        if (!hasAny(fm, ["mondo", "luogo", "campagne", "sessioni"])) {
            warnings.push(`${fileRel}: bozza generata senza aggancio a mondo, luogo, campagna o sessione`);
        }

        const age = daysSince(fm.creato);
        if (fm.stato === "bozza" && age !== null && age >= 14) {
            warnings.push(`${fileRel}: bozza generata ferma da ${age} giorni`);
        }
    }

    if (fm.plugin === "fantasy-content-generator" && !fileRel.startsWith("Inbox/Generati/")) {
        if (!hasAny(fm, ["smistato_il", "canonizzato_il"])) {
            warnings.push(`${fileRel}: contenuto generato fuori coda senza data di smistamento`);
        }
        if (fm.canonico === true && fm.stato_canonico !== "canonico") {
            warnings.push(`${fileRel}: contenuto generato canonico senza stato_canonico: canonico`);
        }
    }

    if (fileRel.startsWith("Risorse/Mappe/") && fileRel !== "Risorse/Mappe/Mappe.md" && fm.stato !== "archiviata") {
        const mapUse = String(fm.uso ?? "");

        if (!hasAny(fm, MAP_REVIEW_POLICY.tableUseAnyOfFields)) {
            warnings.push(`${fileRel}: mappa senza uso al tavolo o gancio operativo`);
        }

        if (!hasAny(fm, MAP_REVIEW_POLICY.visibilityAnyOfFields)) {
            warnings.push(`${fileRel}: mappa senza cosa mostrare o luoghi collegati`);
        }

        if (fm.pubblico !== true && !hasAny(fm, MAP_REVIEW_POLICY.dmPrivateAnyOfFields)) {
            warnings.push(`${fileRel}: mappa DM senza cosa nascondere, prossima_mossa o versione giocatori`);
        }

        if (MAP_REVIEW_POLICY.playableUses.has(mapUse) && fm.stato === "pronto") {
            if (!hasValue(fm.mondo)) {
                warnings.push(`${fileRel}: mappa pronta senza mondo`);
            }
            if (!hasAny(fm, MAP_REVIEW_POLICY.readyPlayableLinkAnyOfFields)) {
                warnings.push(`${fileRel}: mappa pronta senza luogo, luoghi, incontri o missioni`);
            }
        }

        if (MAP_REVIEW_POLICY.structuredUses.has(mapUse) && fm.stato === "pronto" && !hasAny(fm, MAP_REVIEW_POLICY.readyStructuralLinkAnyOfFields)) {
            warnings.push(`${fileRel}: mappa strutturale pronta senza collegamenti canonici`);
        }

        if (mapUse === MAP_REVIEW_POLICY.zoomUse) {
            const zoomMatch = text.match(/```zoommap([\s\S]*?)```/);
            if (!zoomMatch) {
                warnings.push(`${fileRel}: mappa zoom senza blocco zoommap`);
            } else {
                const imageMatch = zoomMatch[1].match(/^\s*image:\s*(.+?)\s*$/m);
                if (!imageMatch) {
                    warnings.push(`${fileRel}: blocco zoommap senza image`);
                } else if (!existsRel(imageMatch[1].trim())) {
                    warnings.push(`${fileRel}: immagine zoommap mancante (${imageMatch[1].trim()})`);
                }
            }
        }

        if (fileRel.endsWith(".hexcartographer.md")) {
            if (fm.type !== "hexcartographer") {
                warnings.push(`${fileRel}: file Hex Cartographer senza type: hexcartographer`);
            }
            if (!/```json[\s\S]*?```/.test(text)) {
                warnings.push(`${fileRel}: file Hex Cartographer senza blocco JSON`);
            }
        }

        if (fm.pubblico === true) {
            if (hasAny(fm, PUBLIC_PRIVATE_FIELDS)) {
                errors.push(`${fileRel}: mappa pubblica con campi da GM`);
            }
            if (/\[!segreto\]/i.test(text)) {
                warnings.push(`${fileRel}: mappa pubblica con callout segreto`);
            }
        }
    }
}

if (warnings.length) {
    console.error("Avvisi bloccanti:");
    for (const warning of warnings) console.error(`- ${warning}`);
}

if (errors.length) {
    console.error("Errori:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

if (warnings.length) {
    process.exit(1);
}

console.log(`Vault OK: ${markdownFiles.length} note, ${communityPlugins.length} plugin community abilitati.`);
