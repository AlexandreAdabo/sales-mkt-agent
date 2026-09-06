import { buildWhatsappLink } from '../utils/whatsapp.js';

export function createLeadReportService({ timezone = 'America/Sao_Paulo' } = {}) {
  function contactLine(lead) {
    if (lead.whatsapp) return buildWhatsappLink(lead.whatsapp, lead.approachSuggestion || '');
    if (lead.email) return `mailto:${lead.email}`;
    if (lead.phone) return `Telefone: ${lead.phone}`;
    if (lead.website) return `Site: ${lead.website}`;
    return 'Nenhum meio direto — abordar via site/formulário';
  }

  function format(leads) {
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }).format(new Date());
    const entries = leads.map((lead) => [lead.companyName, contactLine(lead)].join('\n'));

    return [`🎯 **Leads — ${date}**`, '', entries.join('\n\n')].join('\n');
  }

  return { format };
}
