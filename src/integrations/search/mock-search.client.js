const companies = [
  ['Odonto Mauá', 'odontomaua.example', 'Mauá', 'clínica odontológica', 28, ['alto volume de agendamentos ou atendimentos', 'processos repetitivos']],
  ['Clínica Sorriso ABC', 'sorrisoabc.example', 'Santo André', 'clínica odontológica', 45, ['processos manuais', 'múltiplos sistemas sem integração']],
  ['Odonto Prime SBC', 'odontoprimesbc.example', 'São Bernardo do Campo', 'clínica odontológica', 36, ['uso intenso de planilhas', 'alto volume de agendamentos ou atendimentos']],
  ['Centro Dental São Caetano', 'centrodentalscs.example', 'São Caetano do Sul', 'clínica odontológica', 62, ['operação administrativa relevante', 'processos repetitivos']],
  ['Oral Vida ABC', 'oralvidaabc.example', 'Mauá', 'clínica odontológica', 22, ['empresa em crescimento', 'alto volume de agendamentos ou atendimentos']],
  ['Contábil Mauá', 'contabilmaua.example', 'Mauá', 'escritório de contabilidade', 34, ['alto volume de documentos e prazos', 'processos repetitivos']],
  ['ABC Gestão Contábil', 'abcgestaocontabil.example', 'Santo André', 'escritório de contabilidade', 52, ['uso intenso de planilhas', 'múltiplos sistemas sem integração']],
  ['Conta Certa SBC', 'contacertasbc.example', 'São Bernardo do Campo', 'escritório de contabilidade', 41, ['processos manuais', 'alto volume de documentos e prazos']],
  ['São Caetano Contabilidade', 'scscontabilidade.example', 'São Caetano do Sul', 'escritório de contabilidade', 75, ['operação administrativa relevante', 'sistemas legados']],
  ['Prisma Contábil ABC', 'prismacontabil.example', 'Santo André', 'escritório de contabilidade', 19, ['empresa em crescimento', 'processos repetitivos']],
  ['Mauá Advocacia Empresarial', 'mauaadv.example', 'Mauá', 'escritório de advocacia', 26, ['alto volume de documentos e prazos', 'processos manuais']],
  ['André & Lima Advogados', 'andrelimaadv.example', 'Santo André', 'escritório de advocacia', 48, ['uso intenso de planilhas', 'alto volume de documentos e prazos']],
  ['Jurídico ABC', 'juridicoabc.example', 'São Bernardo do Campo', 'escritório de advocacia', 33, ['múltiplos sistemas sem integração', 'processos repetitivos']],
  ['São Caetano Legal', 'saocaetanolegal.example', 'São Caetano do Sul', 'escritório de advocacia', 68, ['operação administrativa relevante', 'alto volume de documentos e prazos']],
  ['Lex Mauá', 'lexmaua.example', 'Mauá', 'escritório de advocacia', 17, ['empresa em crescimento', 'processos manuais']],
  ['Consultório Individual', 'consultorioindividual.example', 'Mauá', 'clínica odontológica', 2, [], ['consultório individual']],
  ['Contabilidade Encerrada', 'contabilidadeencerrada.example', 'Santo André', 'escritório de contabilidade', 20, [], ['empresa encerrada']],
  ['Loja Fora do ICP', 'lojaforadoicp.example', 'Mauá', 'varejo', 80, ['processos repetitivos'], ['empresa fora dos segmentos do ICP']]
];

export function createMockSearchClient() {
  async function searchCompanies({ regions, segments }) {
    return companies
      .filter(([, , city, segment]) => regions.some((region) => region.startsWith(city)) && segments.includes(segment))
      .map(([companyName, domain, city, segment, employeeCount, signals, negativeSignals], index) => ({
        externalId: `mock-${index + 1}`,
        companyName,
        website: domain ? `https://${domain}` : null,
        city,
        state: 'SP',
        segment,
        employeeCount,
        signals,
        negativeSignals: negativeSignals ?? [],
        source: 'mock'
      }));
  }

  async function researchCompany(candidate) {
    return {
      ...candidate,
      cnpj: null,
      phone: null,
      whatsapp: null,
      description: `Empresa fictícia de ${candidate.segment} usada exclusivamente para validar o fluxo do MVP.`,
      sources: ['mock://local-dataset']
    };
  }

  return { searchCompanies, researchCompany };
}
