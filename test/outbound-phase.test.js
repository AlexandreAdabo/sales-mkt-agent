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
    whatsapp: '11999999999',
    website: 'https://empresa.example',
    approachSuggestion: 'Contato consultivo via WhatsApp'
  }]);

  assert.match(report, /🎯 \*\*Leads/);
  assert.match(report, /Empresa Teste/);
  assert.match(report, /WhatsApp: 11999999999/);
  assert.match(report, /Contato consultivo via WhatsApp/);
});

test('formatador orienta abordagem via site quando não há contato direto', () => {
  const service = createLeadReportService();
  const report = service.format([{
    companyName: 'Empresa Sem Contato',
    website: null,
    approachSuggestion: 'Abordar via formulário do site'
  }]);

  assert.match(report, /Nenhum meio direto — abordar via site\/formulário/);
});
