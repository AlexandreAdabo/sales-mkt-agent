const nullableString = { type: ['string', 'null'] };

export const leadEnrichmentJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    companyName: nullableString,
    phone: nullableString,
    whatsapp: nullableString,
    city: nullableString,
    state: nullableString,
    segment: nullableString,
    description: nullableString,
    companySize: nullableString,
    cnpj: nullableString,
    signals: { type: 'array', items: { type: 'string' } }
  },
  required: ['companyName', 'phone', 'whatsapp', 'city', 'state', 'segment', 'description', 'companySize', 'cnpj', 'signals']
};

export function validateLeadEnrichment(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Enriquecimento do lead invalido');
  if (!Array.isArray(value.signals) || value.signals.some((signal) => typeof signal !== 'string')) throw new Error('Sinais do enriquecimento invalidos');
  return value;
}
