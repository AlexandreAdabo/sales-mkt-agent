const companies = [
  ['MetalNova Componentes', 'metalnova.example', 'Mauá', 'indústria', 120, ['sistemas legados', 'processos repetitivos']],
  ['Rota Sul Logística', 'rotasul.example', 'Santo André', 'logística', 85, ['processos manuais', 'múltiplos sistemas sem integração']],
  ['ABC Distribuição Técnica', 'abcdistribuicao.example', 'São Bernardo do Campo', 'distribuidora', 64, ['uso intenso de planilhas']],
  ['Integra Serviços Empresariais', 'integraservicos.example', 'São Caetano do Sul', 'serviços B2B', 42, ['empresa em crescimento']],
  ['Varejo Horizonte', 'varejohorizonte.example', 'Mauá', 'varejo', 180, ['processos repetitivos']],
  ['Usipart Industrial', 'usipart.example', 'Santo André', 'indústria', 95, ['sistemas legados']],
  ['Movex Operações Logísticas', 'movex.example', 'São Bernardo do Campo', 'logística', 210, ['operação administrativa relevante']],
  ['Central ABC Suprimentos', 'centralabcsuprimentos.example', 'São Caetano do Sul', 'distribuidora', 55, ['uso intenso de planilhas']],
  ['Prisma Gestão B2B', 'prismagestao.example', 'Mauá', 'serviços B2B', 31, ['processos manuais']],
  ['Rede Ponto Certo', 'pontocerto.example', 'Santo André', 'varejo', 145, ['múltiplos sistemas sem integração']],
  ['TecnoFund ABC', 'tecnofund.example', 'São Bernardo do Campo', 'indústria', 72, ['sistemas legados', 'processos manuais']],
  ['Expresso Quatro Cidades', 'expressoquatrocidades.example', 'São Caetano do Sul', 'logística', 110, ['processos repetitivos']],
  ['Distribuidora Via Leste', 'vialeste.example', 'Mauá', 'distribuidora', 48, ['uso intenso de planilhas']],
  ['Núcleo Backoffice', 'nucleobackoffice.example', 'Santo André', 'serviços B2B', 26, ['operação administrativa relevante']],
  ['SulTech Montagens', 'sultech.example', 'Santo André', 'indústria', 160, ['empresa em crescimento']],
  ['Armazém ABC', 'armazemabc.example', 'São Bernardo do Campo', 'logística', 75, ['processos manuais']],
  ['Distribui Mais', 'distribuimais.example', 'São Caetano do Sul', 'distribuidora', 90, ['múltiplos sistemas sem integração']],
  ['OfficeFlow ABC', 'officeflow.example', 'Mauá', 'serviços B2B', 35, ['uso intenso de planilhas']],
  ['Loja Integrada ABC', 'lojaintegrada.example', 'São Bernardo do Campo', 'varejo', 130, ['processos repetitivos']],
  ['Micro Rota', 'microrota.example', 'Mauá', 'logística', 3, [], ['microempresa muito pequena sem operação relevante']],
  ['SemWeb Serviços', null, 'Santo André', 'serviços B2B', 18, [], ['empresa sem presença digital mínima']],
  ['Legado Forte', 'legadoforte.example', 'São Caetano do Sul', 'indústria', 280, ['sistemas legados', 'múltiplos sistemas sem integração']],
  ['Planilha Express', 'planilhaexpress.example', 'São Bernardo do Campo', 'serviços B2B', 12, ['uso intenso de planilhas', 'processos manuais']],
  ['Mega Varejo ABC', 'megavarejo.example', 'Mauá', 'varejo', 450, ['operação administrativa relevante']],
  ['Distribuidora Inativa', 'distribuidorainativa.example', 'Santo André', 'distribuidora', 40, [], ['empresa encerrada']]
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
