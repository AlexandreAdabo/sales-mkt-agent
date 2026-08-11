import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpenAIClient } from '../src/integrations/openai/openai.client.js';

test('cliente OpenAI executa ferramentas e retorna resposta estruturada sem armazenamento remoto', async () => {
  const requests = [];
  const responses = [
    {
      output_text: '',
      output: [{ type: 'function_call', name: 'get_lead', call_id: 'call-1', arguments: '{"id":7}' }],
      model: 'test-model-1',
      usage: {
        input_tokens: 1000,
        input_tokens_details: { cached_tokens: 200 },
        output_tokens: 100,
        output_tokens_details: { reasoning_tokens: 25 },
        total_tokens: 1100
      }
    },
    {
      output_text: '{"answer":"Lead encontrado"}',
      output: [{ type: 'message' }],
      model: 'test-model-1',
      usage: {
        input_tokens: 2000,
        input_tokens_details: { cached_tokens: 1000 },
        output_tokens: 200,
        output_tokens_details: { reasoning_tokens: 50 },
        total_tokens: 2200
      }
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
  const usageLogs = [];
  const client = createOpenAIClient({
    apiKey: 'test',
    model: 'test-model',
    pricing: { input: 0.25, cachedInput: 0.025, output: 2 },
    client: sdkClient,
    usageLogger: (metadata) => usageLogs.push(metadata)
  });
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
  assert.deepEqual(usageLogs, [
    {
      operation: 'conversation:conversation_response:round:1',
      model: 'test-model-1',
      inputTokens: 1000,
      cachedInputTokens: 200,
      outputTokens: 100,
      reasoningTokens: 25,
      totalTokens: 1100,
      estimatedCostUsd: 0.000405,
      pricingUsdPerMillionTokens: { input: 0.25, cachedInput: 0.025, output: 2 }
    },
    {
      operation: 'conversation:conversation_response:round:2',
      model: 'test-model-1',
      inputTokens: 2000,
      cachedInputTokens: 1000,
      outputTokens: 200,
      reasoningTokens: 50,
      totalTokens: 2200,
      estimatedCostUsd: 0.000675,
      pricingUsdPerMillionTokens: { input: 0.25, cachedInput: 0.025, output: 2 }
    }
  ]);
});
