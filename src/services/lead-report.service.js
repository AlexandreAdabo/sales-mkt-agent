export function createLeadReportService({ timezone = 'America/Sao_Paulo' } = {}) {
  function contactLines(lead) {
    const lines = [];
    if (lead.whatsapp) lines.push(`WhatsApp: ${lead.whatsapp}`);
    if (lead.phone) lines.push(`Telefone: ${lead.phone}`);
    if (lead.email) lines.push(`E-mail: ${lead.email}`);
    if (lead.website) lines.push(`Site: ${lead.website}`);
    return lines.length > 0 ? lines : ['Nenhum meio direto — abordar via site/formulário'];
  }

  function format(leads) {
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }).format(new Date());
    const entries = leads.map((lead, index) => [
      `**${index + 1}. ${lead.companyName}**`,
      ...contactLines(lead),
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
