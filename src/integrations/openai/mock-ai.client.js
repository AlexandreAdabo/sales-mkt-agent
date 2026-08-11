const contentTemplates = [
  {
    front: 'DoGym',
    title: '5 sinais de que sua academia de luta precisa centralizar a gestão',
    platform: 'Instagram',
    format: 'carrossel',
    topic: 'gestão integrada de academias de artes marciais',
    objective: 'Gerar identificação com problemas operacionais comuns',
    audience: 'Proprietários e gestores de academias de artes marciais',
    hook: 'Sua academia cresce, mas a gestão continua espalhada em planilhas e mensagens?',
    summary: 'Apresenta sinais de desorganização em matrículas, mensalidades, turmas e presença.',
    mainPoints: ['Cadastros dispersos', 'Mensalidades sem acompanhamento', 'Turmas desorganizadas', 'Visão centralizada'],
    cta: 'Qual parte da gestão mais consome seu tempo hoje?',
    relevanceReason: 'Relaciona dores reais de gestão à proposta do DoGym.'
  },
  {
    front: 'Quanto Deu AI',
    title: 'Como evitar a surpresa no caixa antes de terminar a compra',
    platform: 'Instagram',
    format: 'Reel',
    topic: 'controle de gastos durante a compra no mercado',
    objective: 'Educar sobre acompanhamento do valor do carrinho',
    audience: 'Pessoas que querem controlar melhor os gastos no mercado',
    hook: 'O total da compra só precisa ser surpresa se você deixar para calcular no caixa.',
    summary: 'Mostra como acompanhar os itens durante a compra ajuda a respeitar o orçamento.',
    mainPoints: ['Definir limite', 'Registrar itens', 'Acompanhar subtotal', 'Decidir antes do caixa'],
    cta: 'Envie para quem sempre se assusta com o total do mercado.',
    relevanceReason: 'Comunica diretamente o problema que o Quanto Deu AI pretende resolver.'
  },
  {
    front: 'Profissional/Freelance',
    title: 'Como transformo um problema de negócio em uma solução de software',
    platform: 'LinkedIn',
    format: 'post textual',
    topic: 'processo profissional de descoberta e desenvolvimento',
    objective: 'Demonstrar método e atrair projetos',
    audience: 'Empresas e profissionais procurando desenvolvimento freelance',
    hook: 'Código é parte da entrega; entender o problema vem primeiro.',
    summary: 'Explica o processo de diagnóstico, definição de escopo, implementação e validação.',
    mainPoints: ['Entender o objetivo', 'Reduzir incertezas', 'Entregar incrementalmente', 'Validar resultado'],
    cta: 'Tem um processo que poderia funcionar melhor com software? Vamos conversar.',
    relevanceReason: 'Posiciona capacidade técnica e comercial para conquistar projetos.'
  },
  {
    front: 'DoGym',
    title: 'Graduação de alunos sem perder histórico no caminho',
    platform: 'LinkedIn',
    format: 'carrossel',
    topic: 'acompanhamento de graduação em artes marciais',
    objective: 'Mostrar valor de um histórico organizado dos alunos',
    audience: 'Professores e gestores de academias de artes marciais',
    hook: 'Você consegue consultar agora todo o histórico de graduação de cada aluno?',
    summary: 'Mostra como organizar evolução, presença e marcos do aluno em um único fluxo.',
    mainPoints: ['Histórico individual', 'Critérios claros', 'Acompanhamento de presença', 'Comunicação com o aluno'],
    cta: 'Salve para revisar seu processo de graduação.',
    relevanceReason: 'Explora uma necessidade específica do público do DoGym.'
  },
  {
    front: 'Quanto Deu AI',
    title: '3 decisões que ajudam a manter a compra dentro do orçamento',
    platform: 'Instagram',
    format: 'carrossel',
    topic: 'planejamento de compras no mercado',
    objective: 'Ensinar hábitos práticos de controle de gastos',
    audience: 'Consumidores que fazem compras com orçamento definido',
    hook: 'Controlar a compra não começa quando a fatura chega.',
    summary: 'Apresenta decisões simples para planejar, acompanhar e ajustar a compra.',
    mainPoints: ['Definir teto', 'Priorizar itens', 'Acompanhar subtotal', 'Reavaliar impulsos'],
    cta: 'Qual dessas decisões você já usa no mercado?',
    relevanceReason: 'Atrai o público do Quanto Deu AI com conteúdo útil e aplicável.'
  },
  {
    front: 'Profissional/Freelance',
    title: 'Bastidores de uma integração: das regras de negócio ao monitoramento',
    platform: 'LinkedIn',
    format: 'artigo curto',
    topic: 'engenharia de integrações confiáveis',
    objective: 'Demonstrar experiência técnica aplicada',
    audience: 'Empresas que precisam integrar sistemas ou automatizar processos',
    hook: 'Uma integração não termina quando duas APIs conseguem conversar.',
    summary: 'Explica decisões sobre regras, falhas, observabilidade e manutenção de integrações.',
    mainPoints: ['Contrato de dados', 'Tratamento de falhas', 'Logs úteis', 'Evolução segura'],
    cta: 'Sua operação ainda depende de copiar dados entre sistemas?',
    relevanceReason: 'Demonstra profundidade técnica para atrair projetos freelance.'
  }
];

export function createMockAIClient() {
  async function generateStructured({ schemaName, input }) {
    if (schemaName === 'lead_analysis') return mockLeadAnalysis(input.candidate, input.icp);
    if (schemaName === 'lead_enrichment') return mockLeadEnrichment(input.candidate);
    if (schemaName === 'content_ideas') return mockContentIdeas(input.previousIdeas);
    throw new Error(`Schema mock não suportado: ${schemaName}`);
  }

  async function converse() {
    return { answer: 'O chat conversacional requer AI_PROVIDER=openai.' };
  }

  return { generateStructured, converse };
}

function mockLeadEnrichment(candidate) {
  return {
    companyName: candidate.companyName ?? null,
    phone: candidate.phone ?? null,
    whatsapp: candidate.whatsapp ?? null,
    city: candidate.city ?? null,
    state: candidate.state ?? null,
    segment: candidate.segment ?? null,
    description: candidate.description ?? null,
    companySize: candidate.companySize ?? null,
    cnpj: candidate.cnpj ?? null,
    signals: candidate.signals ?? []
  };
}

function mockLeadAnalysis(candidate, icp) {
  const regionMatches = icp.regions.some((region) => region.startsWith(candidate.city));
  const segmentMatches = icp.segments.includes(candidate.segment);
  const sizeMatches = candidate.employeeCount >= icp.companySize.minEmployees
    && candidate.employeeCount <= icp.companySize.maxEmployees;
  const positiveMatches = candidate.signals.filter((signal) => icp.positiveSignals.includes(signal)).length;
  const negativeMatches = (candidate.negativeSignals ?? []).filter((signal) => icp.negativeSignals.includes(signal)).length;
  const score = Math.max(0, Math.min(100, 30 + (regionMatches ? 15 : 0) + (segmentMatches ? 20 : 0)
    + (sizeMatches ? 20 : 0) + Math.min(positiveMatches * 5, 15) - (negativeMatches * 25)));

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
    scoreReason: `Score mock baseado em região, segmento, porte, ${positiveMatches} sinal(is) positivo(s) e ${negativeMatches} negativo(s).`,
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
