const contentTemplates = [
  {
    title: '5 sinais de que suas planilhas viraram um sistema sem governança',
    platform: 'LinkedIn',
    format: 'carrossel',
    topic: 'automação de processos com planilhas',
    objective: 'Educar e gerar identificação com um problema operacional comum',
    audience: 'Gestores de operações e administrativos de PMEs',
    hook: 'Sua equipe usa planilhas — ou já é refém delas?',
    summary: 'Mostra quando uma planilha útil passa a gerar retrabalho, erros e dependência de pessoas.',
    mainPoints: ['Dados duplicados', 'Aprovações manuais', 'Falta de histórico', 'Caminho gradual de automação'],
    cta: 'Comente qual processo ainda depende de planilhas na sua empresa.',
    relevanceReason: 'Conecta uma dor frequente do ICP a uma solução acessível e gradual.'
  },
  {
    title: 'Integração não é projeto de luxo: o custo invisível de redigitar dados',
    platform: 'LinkedIn',
    format: 'post textual',
    topic: 'integração de sistemas',
    objective: 'Demonstrar o valor comercial de APIs e integrações',
    audience: 'Diretores e gestores de empresas B2B',
    hook: 'Quantas vezes o mesmo pedido é digitado nos seus sistemas?',
    summary: 'Traduz o retrabalho entre sistemas em custo, atraso e risco de erro.',
    mainPoints: ['Mapear redigitações', 'Calcular custo', 'Priorizar integrações', 'Medir resultado'],
    cta: 'Mapeie hoje um dado que sua equipe digita mais de uma vez.',
    relevanceReason: 'Torna uma oportunidade técnica compreensível para decisores não técnicos.'
  },
  {
    title: 'Como modernizar um sistema legado sem parar a operação',
    platform: 'Instagram',
    format: 'Reel',
    topic: 'modernização de sistemas legados',
    objective: 'Reduzir o medo associado à modernização',
    audience: 'Empresas que dependem de sistemas antigos',
    hook: 'Seu sistema antigo não precisa ser trocado de uma vez.',
    summary: 'Apresenta a modernização incremental por módulos, integrações e redução controlada de risco.',
    mainPoints: ['Diagnóstico', 'Fronteiras do sistema', 'Migração incremental', 'Indicadores de risco'],
    cta: 'Salve este roteiro para a próxima conversa sobre legado.',
    relevanceReason: 'Ataca uma objeção recorrente de empresas que não podem interromper a operação.'
  },
  {
    title: 'O pedido que levou 2 dias e passou a levar 20 minutos',
    platform: 'LinkedIn',
    format: 'estudo de caso',
    topic: 'automação de fluxo de pedidos',
    objective: 'Mostrar resultado de negócio por meio de storytelling',
    audience: 'Gestores comerciais e de operações',
    hook: 'O gargalo não estava nas pessoas, mas nas passagens entre sistemas.',
    summary: 'Caso hipotético e identificado como tal sobre integração de pedido, estoque e faturamento.',
    mainPoints: ['Cenário anterior', 'Gargalo', 'Automação aplicada', 'Métricas comparáveis'],
    cta: 'Qual etapa mais atrasa seus pedidos hoje?',
    relevanceReason: 'Resultados operacionais concretos facilitam a compreensão do serviço.'
  },
  {
    title: 'API em linguagem de negócio: o que ela resolve na prática',
    platform: 'Instagram',
    format: 'carrossel',
    topic: 'APIs para negócios',
    objective: 'Explicar um conceito técnico sem jargão',
    audience: 'Gestores não técnicos',
    hook: 'API é a ponte que evita trabalho duplicado entre sistemas.',
    summary: 'Explica APIs com exemplos de ERP, CRM, e-commerce e sistemas internos.',
    mainPoints: ['Definição simples', 'Exemplos', 'Quando usar', 'Cuidados de segurança'],
    cta: 'Envie para alguém que sempre pergunta o que é uma API.',
    relevanceReason: 'Educa compradores que sentem o problema, mas ainda não conhecem a solução.'
  },
  {
    title: '3 processos administrativos onde IA ajuda sem substituir seu ERP',
    platform: 'LinkedIn',
    format: 'post textual',
    topic: 'IA aplicada a processos empresariais',
    objective: 'Posicionar IA de forma prática e responsável',
    audience: 'Gestores administrativos e de tecnologia',
    hook: 'Você não precisa trocar o ERP para começar a usar IA.',
    summary: 'Apresenta triagem documental, classificação de solicitações e apoio à consulta de informações.',
    mainPoints: ['Triagem', 'Classificação', 'Consulta assistida', 'Validação humana'],
    cta: 'Qual desses processos consumiria menos tempo com apoio de IA?',
    relevanceReason: 'Conecta inovação a sistemas existentes e reduz barreiras de adoção.'
  }
];

export function createMockAIClient() {
  async function generateStructured({ schemaName, input }) {
    if (schemaName === 'lead_analysis') return mockLeadAnalysis(input.candidate, input.icp);
    if (schemaName === 'content_ideas') return mockContentIdeas(input.previousIdeas);
    throw new Error(`Schema mock não suportado: ${schemaName}`);
  }

  async function converse() {
    return { answer: 'O chat conversacional requer AI_PROVIDER=openai.' };
  }

  return { generateStructured, converse };
}

function mockLeadAnalysis(candidate, icp) {
  const regionMatches = icp.regions.some((region) => region.startsWith(candidate.city));
  const segmentMatches = icp.segments.includes(candidate.segment);
  const sizeMatches = candidate.employeeCount >= icp.companySize.minEmployees
    && candidate.employeeCount <= icp.companySize.maxEmployees;
  const score = Math.min(100, 45 + (regionMatches ? 15 : 0) + (segmentMatches ? 20 : 0)
    + (sizeMatches ? 15 : 0) + Math.min(candidate.signals.length * 2, 5));

  return {
    companyName: candidate.companyName,
    cnpj: candidate.cnpj ?? null,
    website: candidate.website ?? null,
    phone: candidate.phone ?? null,
    whatsapp: candidate.whatsapp ?? null,
    city: candidate.city ?? null,
    state: candidate.state ?? null,
    segment: candidate.segment ?? null,
    description: candidate.description ?? null,
    companySize: candidate.employeeCount ? `aproximadamente ${candidate.employeeCount} colaboradores (dado mock)` : null,
    possiblePains: candidate.signals.map((signal) => `Hipótese: ${signal}`),
    automationOpportunities: ['Automatizar tarefas repetitivas após diagnóstico do processo'],
    softwareOpportunities: ['Integrar sistemas internos após validação técnica'],
    score,
    scoreReason: 'Score mock baseado somente em região, segmento, faixa de colaboradores e sinais do conjunto de teste.',
    approachSuggestion: 'Validar o cenário operacional em uma conversa breve antes de propor qualquer solução.'
  };
}

function mockContentIdeas(previousIdeas) {
  const usedTitles = new Set(previousIdeas.map((idea) => idea.title.toLocaleLowerCase('pt-BR')));
  const selected = [];
  let position = previousIdeas.length;

  while (selected.length < 3) {
    const template = contentTemplates[position % contentTemplates.length];
    const edition = Math.floor(position / contentTemplates.length) + 1;
    const suffix = edition === 1 ? '' : ` — edição ${edition}`;
    const idea = {
      ...template,
      title: `${template.title}${suffix}`,
      topic: `${template.topic}${suffix}`
    };
    if (!usedTitles.has(idea.title.toLocaleLowerCase('pt-BR'))) selected.push(idea);
    position += 1;
  }

  return { ideas: selected };
}
