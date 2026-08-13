import assert from 'node:assert/strict';
import test from 'node:test';
import { loadIcp } from '../src/config/icp.js';
import { createMockSearchClient } from '../src/integrations/search/mock-search.client.js';
import { createSearchService } from '../src/services/search.service.js';

test('SearchService usa o mock para buscar e pesquisar candidatos do ICP', async () => {
  const icp = await loadIcp();
  const service = createSearchService(createMockSearchClient());

  const candidates = await service.findCandidates(icp);
  const researched = await service.researchCompany(candidates[0]);

  assert.equal(candidates.length, 17);
  assert.ok(candidates.every((candidate) => candidate.source === 'mock'));
  assert.ok(candidates.filter((candidate) => candidate.website).every((candidate) => candidate.website.endsWith('.example')));
  assert.equal(researched.externalId, candidates[0].externalId);
  assert.deepEqual(researched.sources, ['mock://local-dataset']);
  assert.ok(researched.signals.length > 0);
});

test('SearchService mock respeita regiões e segmentos informados', async () => {
  const service = createSearchService(createMockSearchClient());

  const candidates = await service.findCandidates({
    regions: ['Mauá - SP'],
    segments: ['clínica odontológica']
  });

  assert.equal(candidates.length, 3);
  assert.equal(candidates[0].companyName, 'Odonto Mauá');
  assert.equal(candidates[0].city, 'Mauá');
  assert.equal(candidates[0].segment, 'clínica odontológica');
});
