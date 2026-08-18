const nullableString = { type: ['string', 'null'] };

export const leadAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    companyName: { type: 'string' },
    cnpj: nullableString,
    website: nullableString,
    phone: nullableString,
    whatsapp: nullableString,
    email: nullableString,
    city: nullableString,
    state: nullableString,
    segment: nullableString,
    description: nullableString,
    companySize: nullableString,
    possiblePains: { type: 'array', items: { type: 'string' } },
    automationOpportunities: { type: 'array', items: { type: 'string' } },
    softwareOpportunities: { type: 'array', items: { type: 'string' } },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    scoreReason: { type: 'string' },
    approachSuggestion: { type: 'string' }
  },
  required: [
    'companyName', 'cnpj', 'website', 'phone', 'whatsapp', 'email', 'city', 'state',
    'segment', 'description', 'companySize', 'possiblePains',
    'automationOpportunities', 'softwareOpportunities', 'score',
    'scoreReason', 'approachSuggestion'
  ]
};

export function validateLeadAnalysis(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('A análise do lead não é um objeto');
  }

  const requiredStrings = ['companyName', 'scoreReason', 'approachSuggestion'];
  for (const field of requiredStrings) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      throw new Error(`Campo inválido na análise do lead: ${field}`);
    }
  }

  if (!Number.isInteger(value.score) || value.score < 0 || value.score > 100) {
    throw new Error('O score do lead deve ser um inteiro entre 0 e 100');
  }

  for (const field of ['possiblePains', 'automationOpportunities', 'softwareOpportunities']) {
    if (!Array.isArray(value[field]) || value[field].some((item) => typeof item !== 'string')) {
      throw new Error(`Campo inválido na análise do lead: ${field}`);
    }
  }

  return value;
}
