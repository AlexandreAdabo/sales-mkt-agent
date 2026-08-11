export function createLeadReportService({ timezone = 'America/Sao_Paulo' } = {}) {
  function format(leads) {
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }).format(new Date());
    const entries = leads.map((lead, index) => [
      `**${index + 1}. ${lead.companyName}**`,
      `Telefone: ${lead.phone || '-'}`,
      `WhatsApp: ${lead.whatsapp || '-'}`,
      `CNPJ: ${lead.cnpj || '-'}`,
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
      `Fontes: ${lead.researchData?.sources?.map((source) => source.url).join('; ') || lead.sourceUrl || '-'}`,
      '',
      '──────────────'
    ].join('\n'));

    return [`🎯 **Leads — ${date}**`, '', ...entries].join('\n');
  }

  return { format };
}
