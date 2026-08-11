import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/database/database.js';
import { createLeadRepository } from '../src/repositories/lead.repository.js';

test('GET /leads e GET /leads/:id retornam leads persistidos', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sales-mkt-api-'));
  const database = createDatabase(path.join(directory, 'test.sqlite'));
  const leadRepository = createLeadRepository(database);
  const [lead] = leadRepository.saveMany([{
    companyName: 'Empresa API',
    cnpj: null,
    website: 'https://empresa-api.example',
    phone: null,
    whatsapp: null,
    city: 'São Paulo',
    state: 'SP',
    segment: 'Serviços',
    description: 'Lead para teste da API',
    companySize: '20 colaboradores',
    score: 90,
    scoreReason: 'Boa aderência',
    possiblePains: ['Hipótese: retrabalho'],
    automationOpportunities: ['Automação'],
    softwareOpportunities: ['Integração'],
    approachSuggestion: 'Contato consultivo'
  }]);
  const server = createApp({ leadRepository }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    const listResponse = await fetch(`http://127.0.0.1:${port}/leads`);
    const list = await listResponse.json();
    const detailResponse = await fetch(`http://127.0.0.1:${port}/leads/${lead.id}`);
    const detail = await detailResponse.json();
    const missingResponse = await fetch(`http://127.0.0.1:${port}/leads/999`);
    const invalidResponse = await fetch(`http://127.0.0.1:${port}/leads/invalido`);

    assert.equal(listResponse.status, 200);
    assert.equal(list.length, 1);
    assert.equal(list[0].companyName, 'Empresa API');
    assert.deepEqual(list[0].opportunity.automation, ['Automação']);
    assert.equal(detailResponse.status, 200);
    assert.equal(detail.id, lead.id);
    assert.equal(detail.status, 'NEW');
    assert.equal(missingResponse.status, 404);
    assert.equal(invalidResponse.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
