const fs = require("fs");

function validateSyntaxControls({
    errors,
    rel,
    repoPath,
    requiredSnippets,
    root,
    walk
}) {
    for (const file of walk(root, file => file.endsWith(".base"))) {
        const source = fs.readFileSync(file, "utf8");
        if (/[^\n]properties:/.test(source)) {
            errors.push(`${rel(file)}: properties incollato alla riga precedente`);
        }
    }

    for (const file of walk(root, file => /^(z\.automazioni|z\.engine)\//.test(rel(file)) && file.endsWith(".js"))) {
        try {
            const source = fs.readFileSync(file, "utf8").replace(/^#!.*\n/, "");
            new Function(source);
        } catch (error) {
            errors.push(`${rel(file)}: JavaScript non parsabile (${error.message})`);
        }
    }

    for (const snippet of requiredSnippets) {
        const snippetPath = repoPath(snippet);
        if (!fs.existsSync(snippetPath)) {
            errors.push(`Snippet CSS obbligatorio mancante: ${snippet}`);
            continue;
        }

        const css = fs.readFileSync(snippetPath, "utf8");
        const openBraces = (css.match(/{/g) ?? []).length;
        const closeBraces = (css.match(/}/g) ?? []).length;

        if (openBraces !== closeBraces) {
            errors.push(`${snippet}: parentesi graffe CSS non bilanciate (${openBraces} aperte, ${closeBraces} chiuse)`);
        }
    }
}

module.exports = {
    validateSyntaxControls
};
