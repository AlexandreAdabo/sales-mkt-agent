import assert from 'node:assert/strict';
import test from 'node:test';
import { createLeadEnrichmentService } from '../src/services/lead-enrichment.service.js';

test('enriquecimento comeca pela homepage e preserva evidencias', async () => {
  const calls = [];
  const service = createLeadEnrichmentService({
    extractClient: {
      extractUrls: async (urls) => {
        calls.push(urls);
        return { results: [{ url: urls[0], raw_content: 'Empresa ABC em Maua. WhatsApp 11999999999.' }] };
      }
    },
    aiService: {
      extractLeadData: async () => ({
        companyName: 'Empresa ABC', phone: null, whatsapp: '11999999999', city: 'Maua', state: 'SP',
        segment: 'logistica', description: 'Operacao logistica', companySize: null, cnpj: null, signals: ['operacao B2B']
      })
    },
    brasilApiClient: { getCompanyByCnpj: async () => null }
  });

  const enriched = await service.enrichLead({ companyName: 'ABC', website: 'https://empresa.com.br/pagina', signals: [] });

  assert.deepEqual(calls[0], ['https://empresa.com.br']);
  assert.equal(enriched.whatsapp, '11999999999');
  assert.equal(enriched.phone, null);
  assert.deepEqual(enriched.researchData.sources, [{ type: 'website', url: 'https://empresa.com.br' }]);
});

test('falha no Extract mantem o candidato original', async () => {
  const candidate = { companyName: 'Empresa', website: 'https://empresa.com.br' };
  const service = createLeadEnrichmentService({
    extractClient: { extractUrls: async () => { throw new Error('indisponivel'); } },
    aiService: {},
    brasilApiClient: {}
  });

  assert.equal(await service.enrichLead(candidate), candidate);
});
