const path = require("path");

const WIKI_LINK_PATTERN = /!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]*)?\]\]/g;

function validateMarkdownLinks({
    errors,
    isGeneratedTemplatePath,
    linkableByBasename,
    linkableByPath,
    markdownFiles,
    markdownText,
    rel,
    warnings
}) {
    for (const file of markdownFiles) {
        const fileRel = rel(file);
        const text = markdownText(file);
        const taskLines = text.split(/\r?\n/).filter(line => /^\s*[-*]\s+\[[ xX]\]/.test(line));
        const numberedCalloutTitle = text.match(/^> \[![^\]]+\] \d+\./m);

        if (numberedCalloutTitle) {
            errors.push(`${fileRel}: titolo callout numerato come lista; usare "Passo 1 -" o "Blocco 1 -" per evitare warning Tasks`);
        }

        for (const line of taskLines) {
            if (line.includes("#task") && line.includes("🔁") && fileRel !== "z.bacheche/Manutenzione Vault.md") {
                errors.push(`${fileRel}: task ricorrente fuori dalla bacheca manutenzione`);
            }
        }

        let match;

        while ((match = WIKI_LINK_PATTERN.exec(text))) {
            const target = match[1].trim();
            if (!target || /^[a-z]+:\/\//i.test(target)) continue;

            const normalized = target.replace(/\\/g, "/").replace(/\.(md|canvas|base)$/, "");
            if (isGeneratedTemplatePath(normalized)) continue;
            const basename = path.basename(normalized);

            if (linkableByPath.has(normalized)) continue;

            const matches = linkableByBasename.get(basename) ?? [];

            if (!matches.length) {
                errors.push(`${fileRel}: wikilink rotto ${match[0]}`);
            } else if (matches.length > 1) {
                warnings.push(`${fileRel}: wikilink ambiguo ${match[0]} -> ${matches.join(", ")}`);
            }
        }
    }
}

module.exports = {
    validateMarkdownLinks
};
