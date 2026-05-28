const fs = require("fs");
const path = require("path");

const TEMPLATE_PATTERN = /templateFile:\s*["']([^"']+)["']/g;
const INLINE_BUTTON_PATTERN = /`BUTTON\[([^\]\n]+)\]`/g;
const INLINE_LIST_INPUT_PATTERN = /`INPUT\[list:[^\]\n]+\]`/g;
const COMPLEX_INLINE_INPUT_PATTERN = /`INPUT\[[^\]\n]*(?:optionQuery|useLinks|allowOther|suggester|Suggester)\([^\]\n]*\]`/g;
const TEMPLATER_USER_PATTERN = /tp\.user\.([A-Za-z0-9_]+)/g;

function validateMetaBindControls({
    errors,
    existsRel,
    isGeneratedTemplatePath,
    markdownFiles,
    markdownText,
    metaBindConfig,
    modelMarkdownFiles,
    rel,
    repoPath,
    requiredButtons,
    requiredInputTemplates,
    targetPath,
    walk,
    warnings
}) {
    function validateTemplate(templateRef, context) {
        const template = targetPath(templateRef);
        if (template.startsWith("z.modelli/") && !isGeneratedTemplatePath(template)) {
            errors.push(`${context} non generabile da TemplateFactory ${template}`);
            return;
        }
        if (isGeneratedTemplatePath(template)) return;
        if (!existsRel(template)) {
            errors.push(`${context} mancante ${template}`);
        }
    }

    for (const file of markdownFiles) {
        const fileRel = rel(file);
        const text = markdownText(file);
        let match;

        while ((match = TEMPLATE_PATTERN.exec(text))) {
            validateTemplate(match[1], `${fileRel}: template Meta Bind`);
        }
    }

    if (metaBindConfig) {
        const buttonTemplates = Array.isArray(metaBindConfig.buttonTemplates) ? metaBindConfig.buttonTemplates : [];
        const inputTemplates = Array.isArray(metaBindConfig.inputFieldTemplates) ? metaBindConfig.inputFieldTemplates : [];
        const buttonIds = new Set();
        const inputTemplateNames = new Set(inputTemplates.map(template => template?.name).filter(Boolean));

        if (!requiredInputTemplates.length) {
            errors.push("Meta Bind: nessun input richiesto marcato required_for_release in metabind_inputs.yaml");
        }
        if (!requiredButtons.length) {
            errors.push("Meta Bind: nessun pulsante richiesto marcato required_for_release in metabind_buttons.yaml");
        }

        for (const name of requiredInputTemplates) {
            if (!inputTemplateNames.has(name)) {
                errors.push(`Meta Bind: input template operativo mancante (${name})`);
            }
        }

        for (const button of buttonTemplates) {
            if (!button?.id) {
                errors.push("Meta Bind: button template senza id");
                continue;
            }

            if (buttonIds.has(button.id)) {
                errors.push(`Meta Bind: button template duplicato ${button.id}`);
            }
            buttonIds.add(button.id);

            for (const action of button.actions ?? []) {
                if ((action.type === "templaterCreateNote" || action.type === "runTemplaterFile") && action.templateFile) {
                    validateTemplate(action.templateFile, `Meta Bind: button template ${button.id} usa template`);
                }

                if (action.type === "updateMetadata") {
                    warnings.push(`Meta Bind: button template ${button.id} modifica frontmatter; usare INPUT inline/blocco`);
                }
            }
        }

        for (const id of requiredButtons) {
            if (!buttonIds.has(id)) {
                errors.push(`Meta Bind: button operativo mancante (${id})`);
            }
        }

        for (const file of markdownFiles) {
            const fileRel = rel(file);
            const text = markdownText(file);
            let match;

            while ((match = INLINE_BUTTON_PATTERN.exec(text))) {
                if (match[1].includes("...")) continue;
                if (!buttonIds.has(match[1])) {
                    errors.push(`${fileRel}: BUTTON senza template Meta Bind (${match[1]})`);
                }
            }

            while ((match = COMPLEX_INLINE_INPUT_PATTERN.exec(text))) {
                errors.push(`${fileRel}: INPUT Meta Bind con funzioni in inline code; usare blocco meta-bind`);
            }

            while ((match = INLINE_LIST_INPUT_PATTERN.exec(text))) {
                errors.push(`${fileRel}: INPUT Meta Bind list in inline code; usare riga o blocco meta-bind`);
            }
        }
    }

    for (const file of modelMarkdownFiles) {
        const fileRel = rel(file);
        const text = markdownText(file);
        if (/```meta-bind-button[\s\S]*?type:\s*updateMetadata[\s\S]*?```/.test(text)) {
            warnings.push(`${fileRel}: meta-bind-button modifica frontmatter; usare INPUT inline/blocco`);
        }
    }

    const automationDir = repoPath("z.automazioni/templater");
    const automationNames = fs.existsSync(automationDir)
        ? new Set(walk(automationDir, file => file.endsWith(".js")).map(file => path.basename(file, ".js")))
        : new Set();

    for (const file of modelMarkdownFiles) {
        const fileRel = rel(file);
        const text = markdownText(file);
        let match;

        while ((match = TEMPLATER_USER_PATTERN.exec(text))) {
            const helper = match[1];
            if (!automationNames.has(helper)) {
                errors.push(`${fileRel}: helper Templater senza wrapper in z.automazioni/templater (${helper}.js)`);
            }
        }
    }

    for (const file of markdownFiles.filter(file => /(^|\/)[^/]*Router\.md$/.test(rel(file)))) {
        const fileRel = rel(file);
        const text = markdownText(file);
        if (/^<%\*/m.test(text)) {
            errors.push(`${fileRel}: router con blocco Templater multilinea; usare tp.user.template_router`);
        }
        if (!text.trimStart().startsWith("<% await tp.user.")) {
            errors.push(`${fileRel}: router senza singola entry Templater iniziale`);
        }
    }
}

module.exports = {
    validateMetaBindControls
};
