#!/usr/bin/env node

const { readTextRel } = require("./node_utils");

const ROOT = process.cwd();
const errors = [];
const TECHNICAL_JARGON = ["Plugin coinvolti", "Meta Bind", "Dataview", "Templater", "workflow", "runtime", "plugin", "entry point"];

function userVisibleText(text) {
    let inFence = false;
    let fence = "";
    const withoutFrontmatter = text.replace(/^---[\s\S]*?---\s*/, "");
    const withoutCode = withoutFrontmatter.split(/\r?\n/).filter(line => {
        const match = line.match(/^(`{3,})/);
        if (match && (!inFence || match[1].length >= fence.length)) {
            inFence = !inFence;
            fence = inFence ? match[1] : "";
            return false;
        }
        return !inFence;
    }).join("\n");

    return withoutCode
        .replace(/<!-- workflow:quick_actions:start [^>]+ -->[\s\S]*?<!-- workflow:quick_actions:end [^>]+ -->/g, "")
        .replace(/<!--[\s\S]*?-->/g, "");
}

function assertNoTechnicalJargon(label, relPath) {
    const visible = userVisibleText(readTextRel(ROOT, relPath));
    for (const jargon of TECHNICAL_JARGON) {
        if (visible.includes(jargon)) {
            errors.push(`Smoke statico: ${label} espone gergo tecnico (${jargon})`);
        }
    }
}

const playerView = readTextRel(ROOT, "Hub/Vista Giocatori.md");
for (const marker of ["renderPlayerPortalStatus", "renderPlayerRecap", "renderPublicSafety"]) {
    if (!playerView.includes(marker)) {
        errors.push(`Smoke statico: Vista Giocatori non contiene ${marker}`);
    }
}

const startHere = readTextRel(ROOT, "Inizia Qui.md");
for (const marker of ["Crea Il Mondo", "Trasforma In Gioco", "Aggiorna Il Mondo"]) {
    if (!startHere.includes(marker)) {
        errors.push(`Smoke statico: Inizia Qui non contiene ${marker}`);
    }
}
if (!startHere.includes("renderOnboardingReadiness")) {
    errors.push("Smoke statico: Inizia Qui non contiene renderOnboardingReadiness");
}
assertNoTechnicalJargon("Inizia Qui", "Inizia Qui.md");

const worldbuilder = readTextRel(ROOT, "Hub/Worldbuilder Dashboard.md");
for (const marker of ["renderWorldbuilderNow", "renderWorldbuilderReadiness", "renderWorldbuilderQueues", "renderWorldbuilderSurfaceLinks"]) {
    if (!worldbuilder.includes(marker)) {
        errors.push(`Smoke statico: Worldbuilder Dashboard non contiene ${marker}`);
    }
}

const dmDashboard = readTextRel(ROOT, "Hub/1. DM Dashboard.md");
for (const marker of ["renderDmDashboardNow", "renderDmDashboardReadiness", "renderDmDashboardQueues", "renderDmDashboardSurfaceLinks"]) {
    if (!dmDashboard.includes(marker)) {
        errors.push(`Smoke statico: DM Dashboard non contiene ${marker}`);
    }
}

const vaultControl = readTextRel(ROOT, "Risorse/Controllo Vault.md");
for (const marker of ["renderVaultControlNow", "renderVaultControlReadiness", "renderVaultControlQueues", "renderVaultControlCoherence", "renderVaultControlSurfaceLinks"]) {
    if (!vaultControl.includes(marker)) {
        errors.push(`Smoke statico: Controllo Vault non contiene ${marker}`);
    }
}

const atlas = readTextRel(ROOT, "Hub/Atlante del Mondo.md");
for (const marker of ["renderAtlasNow", "renderAtlasReadiness", "renderAtlasQueues", "renderAtlasSurfaceLinks"]) {
    if (!atlas.includes(marker)) {
        errors.push(`Smoke statico: Atlante del Mondo non contiene ${marker}`);
    }
}

const maps = readTextRel(ROOT, "Risorse/Mappe/Mappe.md");
for (const marker of ["renderMapsNow", "renderMapsReadiness", "renderMapsUseQueues", "renderMapsIntegratedLayers", "renderMapsSurfaceLinks"]) {
    if (!maps.includes(marker)) {
        errors.push(`Smoke statico: Mappe non contiene ${marker}`);
    }
}
if (maps.includes("dv.pages(") || maps.includes("````tabs")) {
    errors.push("Smoke statico: Mappe contiene ancora query o tabs inline");
}

const mapImport = readTextRel(ROOT, "Risorse/Importare Mappe.md");
for (const marker of ["renderMapImportNow", "renderMapImportReadiness", "renderMapImportSources", "renderMapImportQueues", "renderMapImportSurfaceLinks"]) {
    if (!mapImport.includes(marker)) {
        errors.push(`Smoke statico: Importare Mappe non contiene ${marker}`);
    }
}
if (mapImport.includes("dv.pages(") || mapImport.includes("````tabs")) {
    errors.push("Smoke statico: Importare Mappe contiene ancora query o tabs inline");
}

const mediaScene = readTextRel(ROOT, "Risorse/Media Scene.md");
for (const marker of ["renderMediaSceneNow", "renderMediaSceneReadiness", "renderMediaSceneSessionCues", "renderMediaSceneCueQueues", "renderMediaSceneSurfaceLinks"]) {
    if (!mediaScene.includes(marker)) {
        errors.push(`Smoke statico: Media Scene non contiene ${marker}`);
    }
}
if (mediaScene.includes("dv.pages(") || mediaScene.includes("````tabs") || /^```dataview\s*$/m.test(mediaScene)) {
    errors.push("Smoke statico: Media Scene contiene ancora query o tabs inline");
}

const worldbuildingControl = readTextRel(ROOT, "Hub/Controllo Worldbuilding.md");
for (const marker of ["renderWorldbuildingControlNow", "renderWorldbuildingControlReadiness", "renderWorldbuildingControlQueues", "renderWorldbuildingControlSurfaceLinks"]) {
    if (!worldbuildingControl.includes(marker)) {
        errors.push(`Smoke statico: Controllo Worldbuilding non contiene ${marker}`);
    }
}

const canonControl = readTextRel(ROOT, "Hub/Controllo Canone.md");
for (const marker of ["renderCanonControlNow", "renderCanonControlReadiness", "renderCanonControlQueues", "renderCanonControlSurfaceLinks"]) {
    if (!canonControl.includes(marker)) {
        errors.push(`Smoke statico: Controllo Canone non contiene ${marker}`);
    }
}

for (const [label, relPath] of [
    ["DM Dashboard", "Hub/1. DM Dashboard.md"],
    ["Worldbuilder Dashboard", "Hub/Worldbuilder Dashboard.md"],
    ["Campagna da Ambientazione", "Hub/Campagna da Ambientazione.md"],
    ["Preparazione Sessione", "Risorse/Preparazione Sessione.md"],
    ["Materiali Al Tavolo", "Risorse/Materiali Al Tavolo.md"],
    ["Quality Report", "Risorse/Quality Report.md"],
    ["Smistamento Bozze Generate", "Risorse/Smistamento Bozze Generate.md"],
    ["Durante il Gioco", "Hub/Durante il Gioco.md"],
    ["Cosa Succede Fuori Scena", "Hub/Cosa Succede Fuori Scena.md"],
    ["Post Sessione Guidato", "Risorse/Post Sessione Guidato.md"],
    ["Atlante del Mondo", "Hub/Atlante del Mondo.md"],
    ["Controllo Worldbuilding", "Hub/Controllo Worldbuilding.md"],
    ["Economia E Rotte", "Hub/Economia E Rotte.md"],
    ["Geopolitical Dashboard", "Hub/Geopolitical Dashboard.md"],
    ["Lore Hub", "Hub/Lore Hub.md"],
    ["Motore Mondo Vivo", "Hub/Motore Mondo Vivo.md"],
    ["Controllo Canone", "Hub/Controllo Canone.md"],
    ["Compendium Del Mondo", "Hub/Compendium Del Mondo.md"],
    ["Bibbia del Mondo", "Hub/Bibbia del Mondo.md"],
    ["Mappe", "Risorse/Mappe/Mappe.md"],
    ["Iniziativa e Combattimenti", "Risorse/Iniziativa e Combattimenti.md"]
]) {
    assertNoTechnicalJargon(label, relPath);
}

const liveHub = readTextRel(ROOT, "Hub/Durante il Gioco.md");
for (const marker of ["renderLiveTableNow", "renderLiveTableReadiness", "renderLiveTableQueues", "renderLiveTableMaterials", "renderLiveTableSurfaceLinks", "renderM11ContinuityChain", "BUTTON[registra-scelta-mondo]"]) {
    if (!liveHub.includes(marker)) {
        errors.push(`Smoke statico: Durante il Gioco non contiene ${marker}`);
    }
}

const preparation = readTextRel(ROOT, "Risorse/Preparazione Sessione.md");
for (const marker of ["renderPreparationNow", "renderPreparationReadiness", "renderPreparationAnchorQueues", "renderPreparationMaterialQueues", "renderPreparationSurfaceLinks", "BUTTON[nuova-sessione-z-modelli-dm-sessione-md]"]) {
    if (!preparation.includes(marker)) {
        errors.push(`Smoke statico: Preparazione Sessione non contiene ${marker}`);
    }
}

const tableMaterials = readTextRel(ROOT, "Risorse/Materiali Al Tavolo.md");
for (const marker of ["renderTableMaterialsNow", "renderTableMaterialsReadiness", "renderTableMaterialsSessionQueues", "renderTableMaterialsAssetQueues", "renderTableMaterialsDndPipeline", "renderTableMaterialsSurfaceLinks"]) {
    if (!tableMaterials.includes(marker)) {
        errors.push(`Smoke statico: Materiali Al Tavolo non contiene ${marker}`);
    }
}

const qualityReport = readTextRel(ROOT, "Risorse/Quality Report.md");
for (const marker of ["renderQualityReportNow", "renderQualityReportCoverage", "renderQualityReportOperationalGaps", "renderQualityReportPublicSafety", "renderQualityReportShowcase", "renderQualityReportSurfaceLinks"]) {
    if (!qualityReport.includes(marker)) {
        errors.push(`Smoke statico: Quality Report non contiene ${marker}`);
    }
}

const generatedDrafts = readTextRel(ROOT, "Risorse/Smistamento Bozze Generate.md");
for (const marker of ["renderGeneratedDraftsNow", "renderGeneratedDraftsReadiness", "renderGeneratedDraftsQueues", "renderGeneratedDraftsDestinations", "renderGeneratedDraftsResolved", "renderGeneratedDraftsSurfaceLinks"]) {
    if (!generatedDrafts.includes(marker)) {
        errors.push(`Smoke statico: Smistamento Bozze Generate non contiene ${marker}`);
    }
}

const worldBible = readTextRel(ROOT, "Hub/Bibbia del Mondo.md");
for (const marker of ["renderWorldBibleNow", "renderWorldBibleReadiness", "renderWorldBibleIdentity", "renderWorldBibleArticles", "renderWorldBibleGaps", "renderWorldBibleSurfaceLinks"]) {
    if (!worldBible.includes(marker)) {
        errors.push(`Smoke statico: Bibbia del Mondo non contiene ${marker}`);
    }
}

const compendium = readTextRel(ROOT, "Hub/Compendium Del Mondo.md");
for (const marker of ["renderCompendiumNow", "renderCompendiumReadiness", "renderCompendiumTypeMix", "renderCompendiumOperationalQueues", "renderCompendiumHistoryQueues", "renderCompendiumSurfaceLinks"]) {
    if (!compendium.includes(marker)) {
        errors.push(`Smoke statico: Compendium Del Mondo non contiene ${marker}`);
    }
}

const livingWorld = readTextRel(ROOT, "Hub/Motore Mondo Vivo.md");
for (const marker of ["renderLivingWorldNow", "renderLivingWorldReadiness", "renderLivingWorldQueues", "renderLivingWorldPressureQueues", "renderLivingWorldSurfaceLinks"]) {
    if (!livingWorld.includes(marker)) {
        errors.push(`Smoke statico: Motore Mondo Vivo non contiene ${marker}`);
    }
}

const economy = readTextRel(ROOT, "Hub/Economia E Rotte.md");
for (const marker of ["renderEconomyNow", "renderEconomyReadiness", "renderEconomyQueues", "renderEconomyDependencyQueues", "renderEconomySurfaceLinks"]) {
    if (!economy.includes(marker)) {
        errors.push(`Smoke statico: Economia E Rotte non contiene ${marker}`);
    }
}

const campaignBuilder = readTextRel(ROOT, "Hub/Campagna da Ambientazione.md");
for (const marker of ["renderCampaignBuilderNow", "renderCampaignBuilderReadiness", "renderCampaignBuilderOpportunityQueues", "renderCampaignBuilderCampaignQueues", "renderCampaignBuilderSurfaceLinks"]) {
    if (!campaignBuilder.includes(marker)) {
        errors.push(`Smoke statico: Campagna da Ambientazione non contiene ${marker}`);
    }
}

const geopolitical = readTextRel(ROOT, "Hub/Geopolitical Dashboard.md");
for (const marker of ["renderGeopoliticalNow", "renderGeopoliticalReadiness", "renderGeopoliticalQueues", "renderGeopoliticalPressureQueues", "renderGeopoliticalSurfaceLinks"]) {
    if (!geopolitical.includes(marker)) {
        errors.push(`Smoke statico: Geopolitical Dashboard non contiene ${marker}`);
    }
}

const lore = readTextRel(ROOT, "Hub/Lore Hub.md");
for (const marker of ["renderLoreNow", "renderLoreReadiness", "renderLoreSignalQueues", "renderLoreWorldQueues", "renderLoreSurfaceLinks"]) {
    if (!lore.includes(marker)) {
        errors.push(`Smoke statico: Lore Hub non contiene ${marker}`);
    }
}

const loreReview = readTextRel(ROOT, "Hub/Revisione Lore.md");
for (const marker of ["renderLoreReviewNow", "renderLoreReviewReadiness", "renderLoreReviewCompletionQueues", "renderLoreReviewTableQueues", "renderLoreReviewSurfaceLinks"]) {
    if (!loreReview.includes(marker)) {
        errors.push(`Smoke statico: Revisione Lore non contiene ${marker}`);
    }
}

const offscreen = readTextRel(ROOT, "Hub/Cosa Succede Fuori Scena.md");
for (const marker of ["renderOffscreenNow", "renderOffscreenReadiness", "renderOffscreenReactionQueues", "renderOffscreenTableBridge", "renderOffscreenSurfaceLinks"]) {
    if (!offscreen.includes(marker)) {
        errors.push(`Smoke statico: Cosa Succede Fuori Scena non contiene ${marker}`);
    }
}

const postSession = readTextRel(ROOT, "Risorse/Post Sessione Guidato.md");
for (const marker of ["renderPostSessionNow", "renderPostSessionReadiness", "renderPostSessionClosureQueues", "renderPostSessionPropagationQueues", "renderPostSessionSurfaceLinks", "BUTTON[registra-scelta-mondo]"]) {
    if (!postSession.includes(marker)) {
        errors.push(`Smoke statico: Post Sessione Guidato non contiene ${marker}`);
    }
}

if (errors.length) {
    console.error("Errori smoke statico:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Smoke statico OK: onboarding, vista giocatori, live e post-sessione verificati senza demo sorgente.");
