function createNoteCore({
    normalizeText,
    promptOptional
}) {
    function getFrontmatter(file) {
        if (!file) {
            return {};
        }

        return app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    }

    function getLinkTargetName(link) {
        if (typeof link === "object" && link !== null) {
            const objectTarget = link.path ?? link.link ?? link.display ?? "";
            return String(objectTarget).replace(/\.md$/, "").split("/").pop();
        }

        const raw = String(link ?? "").trim();
        const match = raw.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
        const target = match ? match[1] : raw;
        return target.split("/").pop();
    }

    function frontmatterHasLink(value, link) {
        if (!value || !link) {
            return false;
        }

        const expected = normalizeText(getLinkTargetName(link));
        const values = Array.isArray(value) ? value : [value];

        return values.some(entry => normalizeText(getLinkTargetName(entry)).includes(expected));
    }

    function getFileFromLink(link) {
        const targetName = getLinkTargetName(link);

        if (!targetName) {
            return null;
        }

        return app.vault.getMarkdownFiles().find(file => file.basename === targetName) ?? null;
    }

    function getWorldFromLink(link) {
        const file = getFileFromLink(link);
        return getFrontmatter(file)?.mondo ?? "";
    }

    function getCalendarFromLink(link) {
        const file = getFileFromLink(link);
        const frontmatter = getFrontmatter(file);
        return String(frontmatter?.calendario ?? frontmatter?.["fc-calendar"] ?? "").trim();
    }

    function getPreferredCalendar({ world = "", campaigns = [], fallback = "" } = {}) {
        const campaignCalendar = normalizeFieldArray(campaigns)
            .map(getCalendarFromLink)
            .find(Boolean);

        return campaignCalendar || getCalendarFromLink(world) || String(fallback ?? "").trim();
    }

    async function promptCalendar(tp, context = {}, message = "Calendario Calendarium") {
        const preferred = getPreferredCalendar(context);
        return await promptOptional(tp, message, preferred);
    }

    function fileLink(file) {
        return file ? `[[${file.basename}]]` : "";
    }

    function normalizeFieldArray(value) {
        if (!value) return [];
        return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
    }

    function linkEquals(a, b) {
        return normalizeText(getLinkTargetName(a)) === normalizeText(getLinkTargetName(b));
    }

    function appendUniqueLink(value, link) {
        if (!link) return normalizeFieldArray(value);
        const entries = normalizeFieldArray(value);
        return entries.some(entry => linkEquals(entry, link)) ? entries : [...entries, link];
    }

    // Scrive frontmatter usando l'API Obsidian quando disponibile; il fallback serve per test o ambienti ridotti.
    async function processFrontmatter(file, updater) {
        if (!file) return;

        if (app.fileManager?.processFrontMatter) {
            await app.fileManager.processFrontMatter(file, updater);
            return;
        }

        const text = await app.vault.read(file);
        const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
        const fm = getFrontmatter(file);
        updater(fm);

        const yaml = Object.entries(fm)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.length
                        ? `${key}:\n${value.map(entry => `  - ${entry}`).join("\n")}`
                        : `${key}: []`;
                }

                return `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`;
            })
            .join("\n");

        const body = match ? text.slice(match[0].length) : text;
        await app.vault.modify(file, `---\n${yaml}\n---\n${body}`);
    }

    function getFileByPathOrBasename(pathOrName) {
        const raw = String(pathOrName ?? "").replace(/\.md$/, "");
        const withExt = `${raw}.md`;
        return app.vault.getAbstractFileByPath(withExt)
            ?? app.vault.getMarkdownFiles().find(file => file.basename === raw.split("/").pop())
            ?? null;
    }

    return {
        appendUniqueLink,
        fileLink,
        frontmatterHasLink,
        getCalendarFromLink,
        getFileByPathOrBasename,
        getFileFromLink,
        getFrontmatter,
        getLinkTargetName,
        getPreferredCalendar,
        getWorldFromLink,
        normalizeFieldArray,
        processFrontmatter,
        promptCalendar
    };
}

module.exports = {
    createNoteCore
};
