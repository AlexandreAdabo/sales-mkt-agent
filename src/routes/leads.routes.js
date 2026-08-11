import { Router } from 'express';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeLead(lead) {
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
    discoveredAt: lead.discovered_at,
    contactedAt: lead.contacted_at,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  };
}

export function createLeadsRouter({ leadRepository }) {
  const router = Router();

  router.get('/leads', (_request, response) => {
    response.json(leadRepository.listAll().map(serializeLead));
  });

  router.get('/leads/:id', (request, response) => {
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return response.status(400).json({ error: 'ID do lead deve ser um inteiro positivo.' });
    }

    const lead = leadRepository.findById(id);
    if (!lead) return response.status(404).json({ error: `Lead ${id} não encontrado.` });
    return response.json(serializeLead(lead));
  });

  return router;
}
