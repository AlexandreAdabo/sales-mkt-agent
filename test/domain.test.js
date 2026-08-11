import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createDatabase } from '../src/database/database.js';
import { createLeadRepository } from '../src/repositories/lead.repository.js';
import { createLeadService } from '../src/services/lead.service.js';
import { normalizeDomain } from '../src/utils/domain.js';

test('normaliza variações do mesmo domínio', () => {
  const variants = [
    'https://empresa.com.br',
    'https://www.empresa.com.br/',
    'empresa.com.br'
  ];

  assert.deepEqual(variants.map(normalizeDomain), [
    'empresa.com.br',
    'empresa.com.br',
    'empresa.com.br'
  ]);
});

test('normaliza caixa, caminho, porta e ponto final do hostname', () => {
  assert.equal(normalizeDomain(' HTTP://WWW.Empresa.COM.BR:8080/contato '), 'empresa.com.br');
  assert.equal(normalizeDomain('empresa.com.br./'), 'empresa.com.br');
});

test('retorna null para domínio ausente ou inválido', () => {
  assert.equal(normalizeDomain(null), null);
  assert.equal(normalizeDomain(''), null);
  assert.equal(normalizeDomain('não é um domínio'), null);
});

test('deduplicação em lote trata variações do domínio como a mesma empresa', () => {
  const leadRepository = {
    listIdentities: () => [],
    isDuplicate: () => false
  };
  const service = createLeadService({ leadRepository, searchService: {}, aiService: {} });
  const candidates = [
    { companyName: 'Empresa', city: 'São Paulo', website: 'https://empresa.com.br' },
    { companyName: 'Outro nome', city: 'Campinas', website: 'https://www.empresa.com.br/' },
    { companyName: 'Terceiro nome', city: 'Santos', website: 'empresa.com.br' }
  ];

  assert.deepEqual(service.filterDuplicates(candidates), [candidates[0]]);
});

test('inserção no SQLite impede reapresentação por variação de domínio', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sales-mkt-domain-'));
  const database = createDatabase(path.join(directory, 'test.sqlite'));
  const leadRepository = createLeadRepository(database);
  const service = createLeadService({ leadRepository, searchService: {}, aiService: {} });
  const lead = {
    companyName: 'Empresa Original',
    cnpj: null,
    website: 'https://empresa.com.br',
    phone: null,
    whatsapp: null,
    city: 'São Paulo',
    state: 'SP',
    segment: 'Serviços',
    description: 'Empresa de teste',
    companySize: '10 colaboradores',
    score: 80,
    scoreReason: 'Teste de persistência',
    possiblePains: [],
    automationOpportunities: [],
    softwareOpportunities: [],
    approachSuggestion: 'Contato consultivo'
  };

  try {
    const inserted = service.saveLeads([lead]);
    const variants = [
      { ...lead, companyName: 'Empresa com WWW', website: 'https://www.empresa.com.br/' },
      { ...lead, companyName: 'Empresa sem protocolo', website: 'empresa.com.br' }
    ];
    const unique = service.filterDuplicates(variants);
    const reinserted = service.saveLeads(unique);

    assert.equal(inserted.length, 1);
    assert.deepEqual(unique, []);
    assert.deepEqual(reinserted, []);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM leads').get().total, 1);
    assert.equal(leadRepository.findById(inserted[0].id).website, 'https://empresa.com.br');
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
