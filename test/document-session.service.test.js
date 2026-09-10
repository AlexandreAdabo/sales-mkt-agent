import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDocumentSessionService } from '../src/services/document-session.service.js';

test('parseFieldLines separa campo e valor pelo primeiro hífen', () => {
  const service = createDocumentSessionService();
  const { parsed, malformedLines } = service.parseFieldLines('Nome - João da Silva\nCliente - Empresa - Filial X\nlinha sem separador');

  assert.deepEqual(parsed, [
    { field: 'Nome', value: 'João da Silva' },
    { field: 'Cliente', value: 'Empresa - Filial X' }
  ]);
  assert.deepEqual(malformedLines, ['linha sem separador']);
});

test('matchFieldsToSession é case-insensitive e reporta campos desconhecidos', () => {
  const service = createDocumentSessionService();
  const session = { fields: ['Nome', 'Cliente'] };
  const { matched, unknownFields } = service.matchFieldsToSession(session, [
    { field: 'nome', value: 'João' },
    { field: 'Telefone', value: '11999999999' }
  ]);

  assert.deepEqual(matched, { Nome: 'João' });
  assert.deepEqual(unknownFields, ['Telefone']);
});

test('validateComplete detecta campos faltantes', () => {
  const service = createDocumentSessionService();
  const session = service.startSession('channel-1', 'user-1', {
    categoryFolder: 'os',
    templateId: 1,
    templateName: 'Padrão',
    fields: ['Nome', 'Cliente']
  });

  assert.deepEqual(service.validateComplete(session), { missing: ['Nome', 'Cliente'], complete: false });

  service.applyValues(session, { Nome: 'João' });
  assert.deepEqual(service.validateComplete(session), { missing: ['Cliente'], complete: false });

  service.applyValues(session, { Cliente: 'Empresa X' });
  assert.deepEqual(service.validateComplete(session), { missing: [], complete: true });
});

test('startSession/getSession/clearSession mantêm sessões isoladas por canal e usuário, preservando a categoria', () => {
  const service = createDocumentSessionService();
  service.startSession('channel-1', 'user-1', { categoryFolder: 'os', templateId: 1, templateName: 'A', fields: ['Nome'] });
  service.startSession('channel-1', 'user-2', {
    categoryFolder: 'proposta-comercial',
    templateId: 2,
    templateName: 'B',
    fields: ['Cliente']
  });

  assert.equal(service.getSession('channel-1', 'user-1').categoryFolder, 'os');
  assert.equal(service.getSession('channel-1', 'user-2').categoryFolder, 'proposta-comercial');

  service.clearSession('channel-1', 'user-1');
  assert.equal(service.getSession('channel-1', 'user-1'), null);
  assert.equal(service.getSession('channel-1', 'user-2').templateId, 2);
});
