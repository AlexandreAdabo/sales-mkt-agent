import assert from 'node:assert/strict';
import test from 'node:test';
import { createTavilySearchClient } from '../src/integrations/search/tavily-search.client.js';

test('Tavily normaliza, filtra e deduplica resultados sem rede', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        results: [
          { title: 'Empresa ABC', url: 'https://www.empresa.com.br/sobre', content: 'Industria', score: 0.9 },
          { title: 'Empresa repetida', url: 'https://empresa.com.br/contato', content: 'Contato', score: 0.8 },
          { title: 'LinkedIn', url: 'https://br.linkedin.com/company/empresa', content: 'Perfil', score: 0.7 }
        ],
        usage: { credits: 1 }
      })
    };
  };
  const client = createTavilySearchClient({ apiKey: 'chave-teste', fetchImpl });
  const candidates = await client.searchCompanies({ regions: ['Maua - SP'], segments: ['industria'], search: { queriesPerRun: 1, resultsPerQuery: 5 } });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.headers.Authorization, 'Bearer chave-teste');
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].domain, 'empresa.com.br');
  assert.equal(candidates[0].source, 'tavily');
});

test('Tavily informa erro HTTP sem expor a chave', async () => {
  const client = createTavilySearchClient({ apiKey: 'segredo', fetchImpl: async () => ({ ok: false, status: 429, text: async () => 'limite excedido' }) });
  await assert.rejects(
    client.searchCompanies({ regions: ['Maua'], segments: ['industria'], search: { queriesPerRun: 1 } }),
    /HTTP 429: limite excedido/
  );
});
