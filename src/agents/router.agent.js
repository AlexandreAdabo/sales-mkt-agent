function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function createRouterAgent({ leadRepository, contentRepository }) {
  async function handle(message) {
    const leadMatch = message.match(/(?:lead|empresa)\s+#?(\d+)/i);
    if (leadMatch) return showLead(Number(leadMatch[1]));

    const ideaMatch = message.match(/(?:ideia|conte[uú]do)\s+#?(\d+)/i);
    if (ideaMatch) return showIdea(Number(ideaMatch[1]));

    return [
      'O agente conversacional está no modo inicial.',
      'Comandos disponíveis:',
      '- `me mostre o lead 15`',
      '- `me mostre a ideia 8`',
      'Pesquisa aprofundada, geração de abordagem e atualização de status entram na próxima etapa.'
    ].join('\n');
  }

  function showLead(id) {
    const lead = leadRepository.findById(id);
    if (!lead) return `Lead ${id} não encontrado.`;
    const opportunity = parseJson(lead.opportunity, {});
    return [
      `**Lead #${lead.id} — ${lead.company_name}**`,
      `Score: ${lead.score}/100 | Status: ${lead.status}`,
      `Site: ${lead.website ?? 'não encontrado'}`,
      `Cidade: ${lead.city ?? 'não encontrada'}/${lead.state ?? '-'}`,
      `Oportunidades: ${[...(opportunity.automation ?? []), ...(opportunity.software ?? [])].join('; ') || 'não identificadas'}`,
      `Abordagem: ${lead.approach_suggestion ?? 'não encontrada'}`
    ].join('\n');
  }

  function showIdea(id) {
    const idea = contentRepository.findById(id);
    if (!idea) return `Ideia ${id} não encontrada.`;
    return [
      `**Ideia #${idea.id} — ${idea.title}**`,
      `${idea.platform} | ${idea.format} | Status: ${idea.status}`,
      `Gancho: ${idea.hook}`,
      `Resumo: ${idea.summary}`,
      `CTA: ${idea.cta}`
    ].join('\n');
  }

  return { handle };
}
