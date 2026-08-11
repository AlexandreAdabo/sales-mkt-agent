import assert from 'node:assert/strict';
import test from 'node:test';
import { createLeadReportService } from '../src/services/lead-report.service.js';
import { validateLeadScore } from '../src/validators/lead-score.validator.js';

test('validator aceita score inteiro entre 0 e 100', () => {
  assert.equal(validateLeadScore({ score: '91' }).score, 91);
  assert.equal(validateLeadScore({ score: 0 }).score, 0);
  assert.equal(validateLeadScore({ score: 100 }).score, 100);
});

test('validator rejeita retorno ou score inválido da IA', () => {
  assert.throws(() => validateLeadScore(null), /scoring inválida/);
  assert.throws(() => validateLeadScore({ score: 101 }), /Score inválido/);
  assert.throws(() => validateLeadScore({ score: 70.5 }), /Score inválido/);
  assert.throws(() => validateLeadScore({ score: 'texto' }), /Score inválido/);
});

test('formatador gera relatório de leads pronto para o Discord', () => {
  const service = createLeadReportService();
  const report = service.format([{
    companyName: 'Empresa Teste',
    city: 'Mauá',
    state: 'SP',
    segment: 'indústria',
    website: 'https://empresa.example',
    score: 91,
    automationOpportunities: ['Automatizar pedidos'],
    softwareOpportunities: ['Integrar ERP'],
    scoreReason: 'Alta aderência ao ICP',
    approachSuggestion: 'Contato consultivo'
  }]);

  assert.match(report, /🎯 \*\*Leads/);
  assert.match(report, /Empresa Teste/);
  assert.match(report, /Score ICP: 91\/100/);
  assert.match(report, /Automatizar pedidos; Integrar ERP/);
});
