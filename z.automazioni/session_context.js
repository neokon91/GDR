(() => {
  const ACTIVE_STATES = ["pronto", "preparazione"];
  const PLAY_STATES = ["in corso", ...ACTIVE_STATES];
  const LINK_FIELDS = [
    "campagne",
    "luoghi",
    "personaggi",
    "missioni",
    "creature",
    "incontri",
    "dispense",
    "mappe",
    "audio",
    "immagini",
    "video",
    "fazioni",
    "oggetti"
  ];

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));

  const linkKey = link => link?.path ?? String(link ?? "");
  const isReal = page => Boolean(page) && !String(page.file?.name ?? "").startsWith("Prova -");
  const pageFromLink = (dv, link) => dv.page(link?.path ?? link);
  const pagesFromLinks = (dv, links) => dv.array(links ?? []).map(link => pageFromLink(dv, link)).where(Boolean);
  const internalLink = file => `<a class="internal-link" data-href="${escapeHtml(file.path)}" href="${escapeHtml(file.path)}">${escapeHtml(file.name)}</a>`;

  function activeSession(dv) {
    const explicit = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.attiva === true)
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();

    if (explicit) {
      return explicit;
    }

    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && ACTIVE_STATES.includes(p.stato))
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();
  }

  function sessionCandidates(dv) {
    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && (p.attiva === true || PLAY_STATES.includes(p.stato)))
      .sort(p => (p.attiva === true ? "1" : "0") + "-" + (p.data ?? "0000-00-00"), "desc");
  }

  function currentCampaign(session) {
    return session?.campagna ?? session?.campagne?.[0] ?? "";
  }

  function linkedPages(dv, source, field) {
    return pagesFromLinks(dv, source?.[field] ?? []);
  }

  function linkedPageSet(dv, source, field) {
    return new Set(dv.array(source?.[field] ?? []).map(linkKey).array());
  }

  function sessionContext(dv) {
    const active = activeSession(dv);
    const linked = {};
    const linkedSets = {};

    for (const field of LINK_FIELDS) {
      linked[field] = linkedPages(dv, active, field);
      linkedSets[field] = linkedPageSet(dv, active, field);
    }

    return {
      active,
      campaign: currentCampaign(active),
      world: active?.mondo ?? "",
      linked,
      linkedSets
    };
  }

  function fallbackPages(dv, source, fallbackQuery, predicate = () => true, sortField = "file.name", direction = "asc", limit = 12) {
    const linked = dv.array(source ?? []).map(link => pageFromLink(dv, link)).where(Boolean);
    if (linked.length) {
      return linked;
    }

    return dv.pages(fallbackQuery)
      .where(p => isReal(p) && predicate(p))
      .sort(p => p?.[sortField] ?? "", direction)
      .limit(limit);
  }

  return {
    ACTIVE_STATES,
    PLAY_STATES,
    escapeHtml,
    internalLink,
    linkKey,
    isReal,
    pageFromLink,
    pagesFromLinks,
    activeSession,
    sessionCandidates,
    currentCampaign,
    linkedPages,
    linkedPageSet,
    sessionContext,
    fallbackPages
  };
})()
