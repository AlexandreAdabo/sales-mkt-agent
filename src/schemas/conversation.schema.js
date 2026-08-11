const nullableString = { type: ['string', 'null'] };
const nullableInteger = { type: ['integer', 'null'] };

export const conversationResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' }
  },
  required: ['answer']
};

export const conversationTools = [
  {
    type: 'function',
    name: 'get_lead',
    description: 'Consulta um lead pelo ID.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { id: { type: 'integer', minimum: 1 } },
      required: ['id']
    }
  },
  {
    type: 'function',
    name: 'search_leads',
    description: 'Pesquisa leads por nome, status e score mínimo. Todos os filtros são opcionais.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: nullableString,
        status: { type: ['string', 'null'], enum: ['NEW', 'CONTACTED', 'INTERESTED', 'DISCARDED', 'CLIENT', null] },
        minScore: nullableInteger,
        limit: { type: 'integer', minimum: 1, maximum: 20 }
      },
      required: ['query', 'status', 'minScore', 'limit']
    }
  },
  {
    type: 'function',
    name: 'get_content',
    description: 'Consulta uma ideia de conteúdo pelo ID.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { id: { type: 'integer', minimum: 1 } },
      required: ['id']
    }
  },
  {
    type: 'function',
    name: 'search_content',
    description: 'Pesquisa ideias por título, tema, status e plataforma. Todos os filtros são opcionais.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: nullableString,
        status: { type: ['string', 'null'], enum: ['SUGGESTED', 'APPROVED', 'DISCARDED', 'CREATED', 'PUBLISHED', null] },
        platform: nullableString,
        limit: { type: 'integer', minimum: 1, maximum: 20 }
      },
      required: ['query', 'status', 'platform', 'limit']
    }
  },
  {
    type: 'function',
    name: 'list_recent_records',
    description: 'Lista os leads ou as ideias de conteúdo mais recentes.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['leads', 'content'] },
        limit: { type: 'integer', minimum: 1, maximum: 20 }
      },
      required: ['type', 'limit']
    }
  }
];

export function validateConversationResponse(value) {
  if (!value || typeof value.answer !== 'string' || value.answer.trim() === '') {
    throw new Error('Resposta conversacional inválida retornada pela OpenAI');
  }
  return value.answer.trim();
}
