(function () {
  const ENDPOINT = 'https://skillaz-workflow-ai.skillaz-sales-bot.workers.dev/assistant';
  const timeout = 45000;

  async function ask(task, payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({task,...payload}),
        signal:controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'AI сейчас недоступен');
      return result;
    } finally { clearTimeout(timer); }
  }

  const context = query => {
    const catalog = window.SkillazProductionCatalog;
    if (!catalog) return {};
    const references = window.SkillazReferenceData?.context(query) || {};
    return {
      elements:catalog.relevantElements(query, 28),
      businessRoles:catalog.relevantRoles(query, 24),
      organizationStructures:references.structures || [],
      positions:references.positions || [],
      employeeGroups:references.groups || [],
      territories:references.regions || [],
      catalogStats:{...catalog.stats,referenceData:window.SkillazReferenceData?.stats || {}}
    };
  };

  window.SkillazLiveAI = { endpoint:ENDPOINT, ask, context };
})();
