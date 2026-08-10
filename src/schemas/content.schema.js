const ideaProperties = {
  title: { type: 'string' },
  platform: { type: 'string' },
  format: { type: 'string' },
  topic: { type: 'string' },
  objective: { type: 'string' },
  audience: { type: 'string' },
  hook: { type: 'string' },
  summary: { type: 'string' },
  mainPoints: { type: 'array', items: { type: 'string' } },
  cta: { type: 'string' },
  relevanceReason: { type: 'string' }
};

export const contentIdeasJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ideas: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: ideaProperties,
        required: Object.keys(ideaProperties)
      }
    }
  },
  required: ['ideas']
};

export function validateContentIdeas(value) {
  if (!value || !Array.isArray(value.ideas) || value.ideas.length !== 3) {
    throw new Error('A IA deve retornar exatamente 3 ideias de conteúdo');
  }

  for (const idea of value.ideas) {
    for (const field of Object.keys(ideaProperties).filter((key) => key !== 'mainPoints')) {
      if (typeof idea[field] !== 'string' || idea[field].trim() === '') {
        throw new Error(`Campo inválido na ideia de conteúdo: ${field}`);
      }
    }
    if (!Array.isArray(idea.mainPoints) || idea.mainPoints.some((item) => typeof item !== 'string')) {
      throw new Error('Campo inválido na ideia de conteúdo: mainPoints');
    }
  }

  return value.ideas;
}
