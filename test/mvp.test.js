import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { createContainer } from '../src/bootstrap.js';
import { validateContentIdeas } from '../src/schemas/content.schema.js';

function testEnv(databasePath) {
  return {
    databasePath,
    aiProvider: 'mock',
    openaiApiKey: null,
    openaiModel: 'gpt-5-mini',
    searchProvider: 'mock',
    discordEnabled: false
  };
}

test('GET /health retorna o contrato esperado', async () => {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'sales-mkt-agent');
    assert.ok(Date.parse(body.timestamp));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('jobs mock persistem resultados e não reapresentam leads', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sales-mkt-agent-'));
  const container = createContainer(testEnv(path.join(directory, 'test.sqlite')));

  try {
    const leads = await container.dailyLeadsJob.run();
    const ideas = await container.contentIdeasJob.run();
    const moreIdeas = await container.contentIdeasJob.run();
    const secondBatch = await container.dailyLeadsJob.run();
    const remainingLeads = await container.dailyLeadsJob.run();
    const repeatedLeads = await container.dailyLeadsJob.run();
    assert.equal(leads.length, 10);
    assert.equal(ideas.length, 3);
    assert.equal(moreIdeas.length, 3);
    assert.deepEqual(ideas.map((idea) => idea.front).sort(), ['DoGym', 'Profissional/Freelance', 'Quanto Deu AI']);
    assert.deepEqual(moreIdeas.map((idea) => idea.front).sort(), ['DoGym', 'Profissional/Freelance', 'Quanto Deu AI']);
    assert.throws(
      () => validateContentIdeas({ ideas: [ideas[0], ideas[0], ideas[0]] }),
      /exatamente uma ideia para cada frente/
    );
    assert.notDeepEqual(moreIdeas.map((idea) => idea.title), ideas.map((idea) => idea.title));
    assert.equal(secondBatch.length, 10);
    assert.equal(remainingLeads.length, 2);
    assert.equal(repeatedLeads.length, 0);
    assert.ok([...leads, ...secondBatch, ...remainingLeads].every((lead) => lead.score >= 70));
  } finally {
    container.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
