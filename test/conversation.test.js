import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createDatabase } from '../src/database/database.js';
import { CONTENT_IDEAS_CRON } from '../src/jobs/content-ideas.job.js';
import { DAILY_LEADS_CRON } from '../src/jobs/daily-leads.job.js';
import { createContentRepository } from '../src/repositories/content.repository.js';
import { createConversationRepository } from '../src/repositories/conversation.repository.js';
import { createLeadRepository } from '../src/repositories/lead.repository.js';
import { createConversationService } from '../src/services/conversation.service.js';

function fixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sales-mkt-chat-'));
  const database = createDatabase(path.join(directory, 'test.sqlite'));
  const leadRepository = createLeadRepository(database);
  const contentRepository = createContentRepository(database);
  const conversationRepository = createConversationRepository(database);

  const [lead] = leadRepository.saveMany([{
    companyName: 'Empresa Alfa',
    cnpj: null,
    website: 'https://alfa.example',
    phone: null,
    whatsapp: null,
    city: 'Campinas',
    state: 'SP',
    segment: 'Indústria',
    description: 'Empresa de teste',
    companySize: '50 colaboradores',
    score: 85,
    scoreReason: 'Boa aderência',
    possiblePains: ['Hipótese: retrabalho'],
    automationOpportunities: ['Automação de pedidos'],
    softwareOpportunities: ['Integração de sistemas'],
    approachSuggestion: 'Conversa consultiva'
  }]);
  const [idea] = contentRepository.saveMany([{
    title: 'Automação prática',
    platform: 'LinkedIn',
    format: 'carrossel',
    topic: 'automação',
    objective: 'Educar',
    audience: 'Gestores',
    hook: 'Onde está o retrabalho?',
    summary: 'Resumo de teste',
    mainPoints: ['Mapear', 'Priorizar'],
    cta: 'Comente',
    relevanceReason: 'Tema relevante'
  }]);

  return {
    database,
    directory,
    lead,
    idea,
    leadRepository,
    contentRepository,
    conversationRepository,
    close() {
      database.close();
      rmSync(directory, { recursive: true, force: true });
    }
  };
}

const context = { guildId: 'guild', channelId: 'channel', userId: 'user' };

test('histórico mantém 20 mensagens por usuário e pode ser limpo', () => {
  const data = fixture();
  try {
    for (let index = 0; index < 25; index += 1) {
      data.conversationRepository.add({ ...context, role: 'user', content: `mensagem ${index}` });
    }
    data.conversationRepository.add({ ...context, userId: 'outro', role: 'user', content: 'isolada' });

    const history = data.conversationRepository.listRecent(context);
    assert.equal(history.length, 20);
    assert.equal(history[0].content, 'mensagem 5');
    assert.equal(data.conversationRepository.listRecent({ ...context, userId: 'outro' }).length, 1);
    assert.equal(data.conversationRepository.clear(context), 20);
    assert.deepEqual(data.conversationRepository.listRecent(context), []);
  } finally {
    data.close();
  }
});

test('ferramentas consultam leads e conteúdos e rejeitam operações inválidas', async () => {
  const data = fixture();
  const aiClient = { converse: async () => ({ answer: 'ok' }) };
  const service = createConversationService({ aiClient, ...data });
  try {
    const lead = await service.executeTool('get_lead', { id: data.lead.id });
    const leads = await service.executeTool('search_leads', { query: 'Alfa', status: 'NEW', minScore: 80, limit: 10 });
    const idea = await service.executeTool('get_content', { id: data.idea.id });
    const ideas = await service.executeTool('search_content', { query: 'automação', status: 'SUGGESTED', platform: 'LinkedIn', limit: 10 });
    const recent = await service.executeTool('list_recent_records', { type: 'leads', limit: 5 });

    assert.equal(lead.companyName, 'Empresa Alfa');
    assert.equal(leads.length, 1);
    assert.equal(idea.title, 'Automação prática');
    assert.equal(ideas.length, 1);
    assert.equal(recent[0].companyName, 'Empresa Alfa');
    await assert.rejects(() => service.executeTool('delete_lead', { id: 1 }), /não permitida/);
    await assert.rejects(() => service.executeTool('search_leads', { query: null, status: 'INVALID', minScore: null, limit: 10 }), /status/);
    await assert.rejects(() => service.executeTool('get_lead', { id: 1, mutate: true }), /Argumentos/);
  } finally {
    data.close();
  }
});

test('chat usa memória isolada, preserva consultas por ID e limpa a conversa', async () => {
  const data = fixture();
  const calls = [];
  const aiClient = {
    async converse(options) {
      calls.push(options);
      return { answer: 'Resposta da IA' };
    }
  };
  const service = createConversationService({ aiClient, ...data });
  try {
    const leadCount = data.database.prepare('SELECT COUNT(*) AS count FROM leads').get().count;
    const contentCount = data.database.prepare('SELECT COUNT(*) AS count FROM content_ideas').get().count;
    assert.match(await service.reply({ ...context, content: `me mostre o lead ${data.lead.id}` }), /Empresa Alfa/);
    assert.equal(calls.length, 0);
    assert.equal(await service.reply({ ...context, content: 'Quais são os melhores leads?' }), 'Resposta da IA');
    await service.reply({ ...context, userId: 'outro', content: 'Mostre conteúdos recentes' });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].messages.length, 3);
    assert.equal(calls[1].messages.length, 1);
    assert.match(await service.reply({ ...context, content: 'limpar conversa' }), /Conversa limpa/);
    assert.deepEqual(data.conversationRepository.listRecent(context), []);
    assert.equal(data.database.prepare('SELECT COUNT(*) AS count FROM leads').get().count, leadCount);
    assert.equal(data.database.prepare('SELECT COUNT(*) AS count FROM content_ideas').get().count, contentCount);
    assert.equal(data.leadRepository.findById(data.lead.id).status, 'NEW');
    assert.equal(data.contentRepository.findById(data.idea.id).status, 'SUGGESTED');
  } finally {
    data.close();
  }
});

test('falha da IA não cria uma resposta falsa no histórico', async () => {
  const data = fixture();
  const aiClient = { converse: async () => { throw new Error('falha externa'); } };
  const service = createConversationService({ aiClient, ...data });
  try {
    await assert.rejects(() => service.reply({ ...context, content: 'Olá' }), /falha externa/);
    assert.deepEqual(data.conversationRepository.listRecent(context), [{ role: 'user', content: 'Olá' }]);
  } finally {
    data.close();
  }
});

test('agendamentos usam os horários definidos', () => {
  assert.equal(DAILY_LEADS_CRON, '0 5 * * *');
  assert.equal(CONTENT_IDEAS_CRON, '15 5 * * 1,3,5');
});
