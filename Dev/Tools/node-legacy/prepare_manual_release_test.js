#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { createManualAcceptanceConfig } = require("./manual_acceptance_config");
const { loadReleaseBoundary } = require("./release_boundary_utils");
const { releasePluginProfile } = require("./release_plugin_profile");

const ROOT = process.cwd();
const CONTRACT_CHECK = process.argv.includes("--contract-check");
const OUT = path.resolve(ROOT, optionValue("--out", "dist/vault-gdr-manual-test"));
const REPORT_MD = path.resolve(ROOT, optionValue("--report", "dist/manual-release-test.md"));
const REPORT_JSON = path.resolve(ROOT, optionValue("--json", "dist/manual-release-test.json"));
const {
    CYCLE_SMOKE,
    FIRST_RUN_PAGES,
    PLUGIN_RUNTIME_PROBES,
    UX_SURFACE_CHECKS,
    WORKFLOW_SMOKE,
    validateManualAcceptanceContract
} = createManualAcceptanceConfig(ROOT);

function optionValue(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index === -1) return fallback;
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) {
        console.error(`${name} richiede un valore`);
        process.exit(1);
    }
    return value;
}

function usage() {
    console.error([
        "Uso: npm run prepare:manual-release-test",
        "",
        "Prepara una release locale per test manuale in Obsidian senza avviare Obsidian.",
        "Lo script valida il contratto, crea una cartella release in dist/ e scrive una checklist",
        "da usare per aprire manualmente il vault e riportare feedback.",
        "",
        "Opzioni:",
        "  --contract-check   valida solo manual_acceptance.yaml e non crea la release",
        "  --out <path>       cartella release manuale, default dist/vault-gdr-manual-test",
        "  --report <path>    report Markdown, default dist/manual-release-test.md",
        "  --json <path>      manifest JSON, default dist/manual-release-test.json"
    ].join("\n"));
}

function repoPath(...parts) {
    return path.join(ROOT, ...parts);
}

function rel(filePath) {
    return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function existsRel(root, relPath) {
    return fs.existsSync(path.join(root, relPath));
}

function readJsonRel(root, relPath, fallback = {}) {
    try {
        return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
    } catch {
        return fallback;
    }
}

function mdList(values) {
    return (values ?? []).map(value => `- ${value}`).join("\n");
}

function matchingRule(page, rules) {
    return (rules ?? []).find(rule => String(rule.page ?? "") === page) ?? {};
}

function validatePreparedRelease() {
    const errors = [];
    if (!fs.existsSync(OUT)) {
        errors.push(`release manuale mancante: ${rel(OUT)}`);
        return errors;
    }

    for (const page of FIRST_RUN_PAGES) {
        if (!existsRel(OUT, page)) errors.push(`pagina first-run mancante nella release manuale: ${page}`);
    }

    const workspace = readJsonRel(OUT, ".obsidian/workspace.json", {});
    const firstLeaf = workspace.main?.children?.[0]?.children?.[0]?.state;
    if (firstLeaf?.state?.file !== "Inizia Qui.md" || firstLeaf?.state?.mode !== "preview") {
        errors.push("apertura simulata non allineata: workspace.json non punta a Inizia Qui.md in preview");
    }

    const homepage = readJsonRel(OUT, ".obsidian/plugins/homepage/data.json", {}).homepages?.["Main Homepage"];
    if (homepage?.value !== "Inizia Qui" || homepage?.openOnStartup !== true) {
        errors.push("apertura simulata non allineata: homepage non apre Inizia Qui");
    }

    const releasePlugins = new Set(readJsonRel(OUT, ".obsidian/community-plugins.json", []));
    const expectedPlugins = releasePluginProfile(ROOT, loadReleaseBoundary(ROOT)).enabledPlugins;
    for (const plugin of expectedPlugins) {
        if (!releasePlugins.has(plugin)) errors.push(`plugin release non abilitato nel test manuale: ${plugin}`);
    }

    return errors;
}

function buildRelease() {
    execFileSync("node", [
        "Dev/Tools/node-legacy/release_clean.js",
        "--quiet",
        "--out",
        OUT
    ], { cwd: ROOT, stdio: "inherit" });
}

function manualChecklist() {
    return FIRST_RUN_PAGES.map(page => {
        const textRule = matchingRule(page, UX_SURFACE_CHECKS.required_visible_text_by_page);
        const buttonRule = matchingRule(page, UX_SURFACE_CHECKS.required_clickable_buttons_by_page);
        return {
            page,
            expectedVisibleAll: (textRule.all ?? []).map(String),
            expectedVisibleAny: (textRule.any ?? []).map(String),
            expectedButtonsAll: (buttonRule.all ?? []).map(String),
            expectedButtonsAny: (buttonRule.any ?? []).map(String)
        };
    });
}

function writeReport(manifest) {
    fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });
    fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });

    const checklistMarkdown = manifest.manualChecklist.map(item => [
        `### ${item.page}`,
        item.expectedVisibleAll.length ? "Testo richiesto:\n" + mdList(item.expectedVisibleAll) : "",
        item.expectedVisibleAny.length ? "Almeno uno tra:\n" + mdList(item.expectedVisibleAny) : "",
        item.expectedButtonsAll.length ? "Pulsanti richiesti:\n" + mdList(item.expectedButtonsAll) : "",
        item.expectedButtonsAny.length ? "Almeno un pulsante tra:\n" + mdList(item.expectedButtonsAny) : ""
    ].filter(Boolean).join("\n\n")).join("\n\n");

    const markdown = `# Test Manuale Release Obsidian

Obsidian non e stato avviato da questo script. Questa e una preparazione statica per aprire manualmente la release e riportare feedback.

## Apertura

1. Apri Obsidian.
2. Usa "Apri cartella come vault".
3. Scegli questa cartella:

\`\`\`text
${manifest.vaultPath}
\`\`\`

Atteso all'apertura: \`Inizia Qui.md\` in modalita lettura, con homepage configurata su \`Inizia Qui\`.

## Feedback Da Rimandare A Codex

- pagina o azione provata;
- cosa ti aspettavi;
- cosa hai visto;
- eventuale testo di errore visibile, notice o comportamento bloccante;
- screenshot solo se serve a spiegare layout o pulsanti non visibili.

## Percorsi

- Release: \`${manifest.vaultPath}\`
- Zip: \`${manifest.zipPath || "non creato"}\`
- Plugin attesi: \`${manifest.expectedPluginCount}\`

## Workflow Manuali Da Provare

- Primo avvio: verifica che \`Inizia Qui.md\` proponga il percorso nuovo mondo e prima sessione.
- Worldbuilding: prova \`${WORKFLOW_SMOKE.button_label}\` da \`${WORKFLOW_SMOKE.setup_page}\`.
- Sessione: prova \`${CYCLE_SMOKE.session_button_label}\` e poi \`${CYCLE_SMOKE.post_session_button_label}\`.
- Se un plugin chiede fiducia o abilitazione, abilitalo solo per questa cartella release.

## Checklist Pagine

${checklistMarkdown}
`;

    fs.writeFileSync(REPORT_MD, markdown, "utf8");
    fs.writeFileSync(REPORT_JSON, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function main() {
    if (process.argv.includes("--help")) {
        usage();
        process.exit(0);
    }

    const contractErrors = validateManualAcceptanceContract();
    if (contractErrors.length) {
        console.error("Contratto test manuale Obsidian non valido:");
        for (const error of contractErrors) console.error(`- ${error}`);
        process.exit(1);
    }

    if (CONTRACT_CHECK) {
        console.log(`Manual acceptance contract OK: ${FIRST_RUN_PAGES.length} pagine first-run, ${UX_SURFACE_CHECKS.required_visible_text_by_page.length} gate UX, ${PLUGIN_RUNTIME_PROBES.length} probe plugin dichiarativi.`);
        return;
    }

    buildRelease();
    const errors = validatePreparedRelease();
    if (errors.length) {
        console.error("Preparazione test manuale Obsidian non valida:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    const zipPath = fs.existsSync(`${OUT}.zip`) ? `${OUT}.zip` : "";
    const manifest = {
        generatedAt: new Date().toISOString(),
        mode: "manual-release-open",
        launchesObsidian: false,
        vaultPath: OUT,
        zipPath,
        reportPath: REPORT_MD,
        firstRunPages: FIRST_RUN_PAGES,
        expectedPluginCount: releasePluginProfile(ROOT, loadReleaseBoundary(ROOT)).enabledPlugins.length,
        workflowSmoke: {
            setupPage: WORKFLOW_SMOKE.setup_page,
            buttonId: WORKFLOW_SMOKE.button_id,
            buttonLabel: WORKFLOW_SMOKE.button_label,
            expectedWorldPath: WORKFLOW_SMOKE.expected_world_path
        },
        cycleSmoke: {
            setupPage: CYCLE_SMOKE.setup_page,
            tablePage: CYCLE_SMOKE.table_page,
            postSessionPage: CYCLE_SMOKE.post_session_page,
            sessionButtonLabel: CYCLE_SMOKE.session_button_label,
            postSessionButtonLabel: CYCLE_SMOKE.post_session_button_label,
            expectedSessionPath: CYCLE_SMOKE.expected_session_path
        },
        manualChecklist: manualChecklist()
    };
    writeReport(manifest);

    console.log("Test manuale Obsidian preparato senza avviare Obsidian.");
    console.log(`Release da aprire manualmente: ${rel(OUT)}`);
    console.log(`Checklist feedback: ${rel(REPORT_MD)}`);
}

main();
