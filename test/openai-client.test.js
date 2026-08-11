import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpenAIClient } from '../src/integrations/openai/openai.client.js';

test('cliente OpenAI executa ferramentas e retorna resposta estruturada sem armazenamento remoto', async () => {
  const requests = [];
  const responses = [
    {
      output_text: '',
      output: [{ type: 'function_call', name: 'get_lead', call_id: 'call-1', arguments: '{"id":7}' }]
    },
    {
      output_text: '{"answer":"Lead encontrado"}',
      output: [{ type: 'message' }]
    }
  ];
  const sdkClient = {
    responses: {
      async create(request) {
        requests.push(request);
        return responses.shift();
      }
    }
  };
  const executed = [];
  const client = createOpenAIClient({ apiKey: 'test', model: 'test-model', client: sdkClient });
  const value = await client.converse({
    instructions: 'teste',
    messages: [{ role: 'user', content: 'Mostre o lead 7' }],
    tools: [{ type: 'function', name: 'get_lead', parameters: {} }],
    schemaName: 'conversation_response',
    schema: { type: 'object' },
    async executeTool(name, args) {
      executed.push({ name, args });
      return { id: 7 };
    }
  });

  assert.deepEqual(value, { answer: 'Lead encontrado' });
  assert.deepEqual(executed, [{ name: 'get_lead', args: { id: 7 } }]);
  assert.equal(requests.length, 2);
  assert.ok(requests.every((request) => request.store === false));
  assert.deepEqual(requests[1].input.at(-1), {
    type: 'function_call_output',
    call_id: 'call-1',
    output: '{"id":7}'
  });
});
