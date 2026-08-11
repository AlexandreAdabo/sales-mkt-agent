import assert from 'node:assert/strict';
import test from 'node:test';
import { splitMessage } from '../src/integrations/discord/discord.client.js';

test('mensagens do Discord ficam abaixo do limite de 2000 caracteres', () => {
  const content = `${'a'.repeat(1890)}\n${'b'.repeat(1890)}\n${'c'.repeat(2500)}`;
  const chunks = splitMessage(content);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 1900));
  assert.ok(chunks.every((chunk) => chunk.length <= 2000));
});

test('splitter preserva mensagens com múltiplas linhas', () => {
  const content = Array.from({ length: 100 }, (_, index) => `Linha ${index}: ${'x'.repeat(80)}`).join('\n');
  const chunks = splitMessage(content);

  assert.equal(chunks.join('\n'), content);
});

test('splitter preserva linhas maiores que o limite', () => {
  const content = 'x'.repeat(5000);
  const chunks = splitMessage(content);

  assert.equal(chunks.join(''), content);
  assert.ok(chunks.every((chunk) => chunk.length <= 1900));
});
