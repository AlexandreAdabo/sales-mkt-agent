import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createContainer } from '../src/bootstrap.js';
import { createDailyLeadsJob } from '../src/jobs/daily-leads.job.js';

test('dry-run registra a execucao sem persistir leads', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sales-mkt-dry-run-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const container = createContainer({
    databasePath,
    aiProvider: 'mock',
    searchProvider: 'mock',
    discordEnabled: false,
    dryRun: true
  });

  try {
    const preview = await container.dailyLeadsJob.run();
    const run = container.database.prepare('SELECT * FROM job_runs ORDER BY id DESC LIMIT 1').get();
    assert.equal(preview.length, 10);
    assert.equal(container.leadRepository.listAll().length, 0);
    assert.equal(run.status, 'SUCCESS');
    assert.equal(run.leads_created, 0);
  } finally {
    container.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('falha grave registra etapa e envia alerta detalhado ao Discord', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sales-mkt-job-error-'));
  const messages = [];
  const finishes = [];
  const job = createDailyLeadsJob({
    outboundAgent: {
      run: async () => { throw new Error('429 Too Many Requests'); },
      getLastRunStats: () => ({ stage: 'TAVILY_SEARCH', candidatesFound: 0 })
    },
    discordClient: { sendLog: async (message) => messages.push(message) },
    jobRunRepository: {
      start: () => 1,
      finish: (...args) => finishes.push(args)
    },
    lockPath: path.join(directory, 'daily-leads.lock'),
    timezone: 'America/Sao_Paulo'
  });

  try {
    await assert.rejects(job.run(), /429 Too Many Requests/);
    assert.match(messages[0], /DAILY LEADS FAILED/);
    assert.match(messages[0], /Etapa: TAVILY_SEARCH/);
    assert.match(messages[0], /Erro: 429 Too Many Requests/);
    assert.equal(finishes[0][1], 'FAILED');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
