export function createLeadReportService({ timezone = 'America/Sao_Paulo' } = {}) {
  function format(leads) {
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }).format(new Date());
    const entries = leads.map((lead, index) => [
      `**${index + 1}. ${lead.companyName}**`,
      `📍 ${lead.city || '-'} / ${lead.state || '-'}`,
      `🏢 ${lead.segment || '-'}`,
      `🌐 ${lead.website || 'não encontrado'}`,
      `⭐ Score ICP: ${lead.score}/100`,
      '',
      '**Oportunidades**',
      [...lead.automationOpportunities, ...lead.softwareOpportunities].join('; ') || '-',
      '',
      '**Motivo**',
      lead.scoreReason || '-',
      '',
      '**Abordagem sugerida**',
      lead.approachSuggestion || '-',
      '',
      '──────────────'
    ].join('\n'));

    return [`🎯 **Leads — ${date}**`, '', ...entries].join('\n');
  }

  return { format };
}
