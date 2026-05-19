async function dm(tp) {
    const helpers = tp.user.helpers;

    async function chooseContent() {
        const selected = await helpers.chooseRequired(
            tp,
            [
                { label: "Sessione", id: "sessione" },
                { label: "Missione", id: "missione" },
                { label: "Incontro", id: "incontro" },
                { label: "Trappola", id: "trappola" },
                { label: "Pericolo ambientale", id: "pericolo ambientale" },
                { label: "Avventura", id: "avventura" },
                { label: "One-Shot", id: "one-shot" },
                { label: "Campagna", id: "campagna" }
            ],
            "Cosa vuoi creare per il tavolo?"
        );

        return selected.id;
    }

    function getContentTemplate(contentType) {
        if (contentType === "sessione") return "z.modelli/dm/Sessione";
        if (contentType === "missione") return "z.modelli/dm/Missione";
        if (contentType === "incontro") return "z.modelli/dm/Incontro";
        if (contentType === "trappola") return "z.modelli/dm/Trappola";
        if (contentType === "pericolo ambientale") return "z.modelli/dm/Pericolo Ambientale";
        if (contentType === "avventura") return "z.modelli/dm/Avventura";
        if (contentType === "one-shot") return "z.modelli/dm/One-Shot";
        if (contentType === "campagna") return "z.modelli/dm/Campagna";

        return "z.modelli/dm/Incontro";
    }

    return {
        chooseContent,
        getContentTemplate
    };
}

module.exports = dm;
