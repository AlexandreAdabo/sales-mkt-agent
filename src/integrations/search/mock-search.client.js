const companies = [
  ['MetalNova Componentes', 'metalnova.example', 'Mauá', 'indústria', 120],
  ['Rota Sul Logística', 'rotasul.example', 'Santo André', 'logística', 85],
  ['ABC Distribuição Técnica', 'abcdistribuicao.example', 'São Bernardo do Campo', 'distribuidora', 64],
  ['Integra Serviços Empresariais', 'integraservicos.example', 'São Caetano do Sul', 'serviços B2B', 42],
  ['Varejo Horizonte', 'varejohorizonte.example', 'Mauá', 'varejo', 180],
  ['Usipart Industrial', 'usipart.example', 'Santo André', 'indústria', 95],
  ['Movex Operações Logísticas', 'movex.example', 'São Bernardo do Campo', 'logística', 210],
  ['Central ABC Suprimentos', 'centralabcsuprimentos.example', 'São Caetano do Sul', 'distribuidora', 55],
  ['Prisma Gestão B2B', 'prismagestao.example', 'Mauá', 'serviços B2B', 31],
  ['Rede Ponto Certo', 'pontocerto.example', 'Santo André', 'varejo', 145],
  ['TecnoFund ABC', 'tecnofund.example', 'São Bernardo do Campo', 'indústria', 72],
  ['Expresso Quatro Cidades', 'expressoquatrocidades.example', 'São Caetano do Sul', 'logística', 110],
  ['Distribuidora Via Leste', 'vialeste.example', 'Mauá', 'distribuidora', 48],
  ['Núcleo Backoffice', 'nucleobackoffice.example', 'Santo André', 'serviços B2B', 26]
];

export function createMockSearchClient() {
  async function searchCompanies({ regions, segments }) {
    return companies
      .filter(([, , city, segment]) => (
        regions.some((region) => region.startsWith(city)) && segments.includes(segment)
      ))
      .map(([companyName, domain, city, segment, employeeCount], index) => ({
        externalId: `mock-${index + 1}`,
        companyName,
        website: `https://${domain}`,
        city,
        state: 'SP',
        segment,
        employeeCount,
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
      signals: ['processos repetitivos', 'uso intenso de planilhas'],
      sources: ['mock://local-dataset']
    };
  }

  return { searchCompanies, researchCompany };
}
