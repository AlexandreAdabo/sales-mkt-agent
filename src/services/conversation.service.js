import {
  conversationResponseJsonSchema,
  conversationTools,
  validateConversationResponse
} from '../schemas/conversation.schema.js';

const LEAD_STATUSES = new Set(['NEW', 'CONTACTED', 'INTERESTED', 'DISCARDED', 'CLIENT']);
const CONTENT_STATUSES = new Set(['SUGGESTED', 'APPROVED', 'DISCARDED', 'CREATED', 'PUBLISHED']);

const instructions = `
Você é o assistente comercial do Sales MKT Agent no Discord.
Responda sempre em português do Brasil, de forma objetiva.
Consulte leads e ideias de conteúdo exclusivamente pelas ferramentas disponíveis.
Nunca invente dados ausentes e deixe claro quando não encontrar registros.
Você não pode alterar status, criar registros, executar jobs ou prometer que realizou ações.
Use o histórico apenas para manter o contexto da conversa atual.
`.trim();

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeLead(lead) {
  if (!lead) return null;
  return {
    id: lead.id,
    companyName: lead.company_name,
    cnpj: lead.cnpj,
    website: lead.website,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    city: lead.city,
    state: lead.state,
    segment: lead.segment,
    description: lead.description,
    companySize: lead.company_size,
    score: lead.score,
    scoreReason: lead.score_reason,
    opportunity: parseJson(lead.opportunity, {}),
    approachSuggestion: lead.approach_suggestion,
    status: lead.status,
    discoveredAt: lead.discovered_at
  };
}

function serializeContent(idea) {
  if (!idea) return null;
  return {
    id: idea.id,
    front: idea.front,
    title: idea.title,
    platform: idea.platform,
    format: idea.format,
    topic: idea.topic,
    objective: idea.objective,
    audience: idea.audience,
    hook: idea.hook,
    summary: idea.summary,
    mainPoints: parseJson(idea.main_points, []),
    cta: idea.cta,
    relevanceReason: idea.relevance_reason,
    status: idea.status,
    generatedAt: idea.generated_at
  };
}

function formatLead(lead, id) {
  if (!lead) return `Lead ${id} não encontrado.`;
  const opportunities = [
    ...(lead.opportunity.possiblePains ?? []),
    ...(lead.opportunity.automation ?? []),
    ...(lead.opportunity.software ?? [])
  ];
  return [
    `**Lead #${lead.id} — ${lead.companyName}**`,
    `Score: ${lead.score}/100 | Status: ${lead.status}`,
    `Site: ${lead.website ?? 'não encontrado'}`,
    `Cidade: ${lead.city ?? 'não encontrada'}/${lead.state ?? '-'}`,
    `Oportunidades: ${opportunities.join('; ') || 'não identificadas'}`,
    `Abordagem: ${lead.approachSuggestion ?? 'não encontrada'}`
  ].join('\n');
}

function formatContent(idea, id) {
  if (!idea) return `Ideia ${id} não encontrada.`;
  return [
    `**Ideia #${idea.id} — ${idea.title}**`,
    `Frente: ${idea.front ?? 'não informada'}`,
    `${idea.platform} | ${idea.format} | Status: ${idea.status}`,
    `Gancho: ${idea.hook}`,
    `Resumo: ${idea.summary}`,
    `CTA: ${idea.cta}`
  ].join('\n');
}

function integer(value, name, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Argumento inválido: ${name}`);
  }
  return value;
}

function nullableString(value, name) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new Error(`Argumento inválido: ${name}`);
  return value.trim() || null;
}

function assertKeys(args, expected) {
  if (Object.keys(args).some((key) => !expected.includes(key))) {
    throw new Error('Argumentos da ferramenta inválidos');
  }
}

export function createConversationService({ aiClient, conversationRepository, leadRepository, contentRepository }) {
  async function executeTool(name, args) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Argumentos da ferramenta inválidos');

    if (name === 'get_lead') {
      assertKeys(args, ['id']);
      return serializeLead(leadRepository.findById(integer(args.id, 'id')));
    }
    if (name === 'get_content') {
      assertKeys(args, ['id']);
      return serializeContent(contentRepository.findById(integer(args.id, 'id')));
    }
    if (name === 'search_leads') {
      assertKeys(args, ['query', 'status', 'minScore', 'limit']);
      const status = nullableString(args.status, 'status');
      if (status && !LEAD_STATUSES.has(status)) throw new Error('Argumento inválido: status');
      const minScore = args.minScore === null ? null : integer(args.minScore, 'minScore', { min: 0, max: 100 });
      const limit = integer(args.limit, 'limit', { min: 1, max: 20 });
      return leadRepository.search({ query: nullableString(args.query, 'query'), status, minScore, limit }).map(serializeLead);
    }
    if (name === 'search_content') {
      assertKeys(args, ['query', 'status', 'platform', 'limit']);
      const status = nullableString(args.status, 'status');
      if (status && !CONTENT_STATUSES.has(status)) throw new Error('Argumento inválido: status');
      const limit = integer(args.limit, 'limit', { min: 1, max: 20 });
      return contentRepository.search({
        query: nullableString(args.query, 'query'),
        status,
        platform: nullableString(args.platform, 'platform'),
        limit
      }).map(serializeContent);
    }
    if (name === 'list_recent_records') {
      assertKeys(args, ['type', 'limit']);
      const limit = integer(args.limit, 'limit', { min: 1, max: 20 });
      if (args.type === 'leads') return leadRepository.listRecent(limit).map(serializeLead);
      if (args.type === 'content') return contentRepository.listRecent(limit).map(serializeContent);
      throw new Error('Argumento inválido: type');
    }
    throw new Error(`Ferramenta não permitida: ${name}`);
  }

  async function reply(context) {
    const content = context.content?.trim();
    if (!content) throw new Error('Mensagem não informada');

    if (/^limpar conversa[.!]?$/i.test(content)) {
      conversationRepository.clear(context);
      return 'Conversa limpa. A próxima mensagem começará sem o contexto anterior.';
    }

    conversationRepository.add({ ...context, role: 'user', content });

    const leadMatch = content.match(/^(?:me\s+mostre\s+)?(?:o\s+)?(?:lead|empresa)\s+#?(\d+)\s*[.!?]?$/i);
    if (leadMatch) {
      const id = Number(leadMatch[1]);
      const answer = formatLead(await executeTool('get_lead', { id }), id);
      conversationRepository.add({ ...context, role: 'assistant', content: answer });
      return answer;
    }

    const ideaMatch = content.match(/^(?:me\s+mostre\s+)?(?:a\s+)?(?:ideia|conte[uú]do)\s+#?(\d+)\s*[.!?]?$/i);
    if (ideaMatch) {
      const id = Number(ideaMatch[1]);
      const answer = formatContent(await executeTool('get_content', { id }), id);
      conversationRepository.add({ ...context, role: 'assistant', content: answer });
      return answer;
    }

    const messages = conversationRepository.listRecent(context);
    const value = await aiClient.converse({
      instructions,
      messages,
      tools: conversationTools,
      schemaName: 'conversation_response',
      schema: conversationResponseJsonSchema,
      executeTool
    });
    const answer = validateConversationResponse(value);
    conversationRepository.add({ ...context, role: 'assistant', content: answer });
    return answer;
  }

  return { reply, executeTool };
}
