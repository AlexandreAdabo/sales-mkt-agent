import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export function createOpenAIClient({
  apiKey,
  model,
  pricing = { input: 0.25, cachedInput: 0.025, output: 2 },
  client = new OpenAI({ apiKey }),
  usageLogger = (metadata) => logger.info('[OPENAI_USAGE]', metadata)
}) {
  async function createResponse(request, operation) {
    const response = await client.responses.create(request);
    if (response.usage) usageLogger(buildUsageLog(response, model, operation, pricing));
    return response;
  }

  async function generateStructured({ schemaName, schema, prompt }) {
    const response = await createResponse({
      model,
      input: prompt,
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema
        }
      }
    }, `structured:${schemaName}`);

    if (!response.output_text) {
      throw new Error(`A OpenAI não retornou conteúdo estruturado para ${schemaName}`);
    }

    try {
      return JSON.parse(response.output_text);
    } catch (error) {
      throw new Error(`JSON inválido retornado pela OpenAI para ${schemaName}`, { cause: error });
    }
  }

  async function converse({ instructions, messages, tools, schemaName, schema, executeTool }) {
    let input = messages.map(({ role, content }) => ({ role, content }));

    for (let round = 0; round < 5; round += 1) {
      const response = await createResponse({
        model,
        instructions,
        input,
        tools,
        store: false,
        text: {
          format: {
            type: 'json_schema',
            name: schemaName,
            strict: true,
            schema
          }
        }
      }, `conversation:${schemaName}:round:${round + 1}`);
      const calls = response.output.filter((item) => item.type === 'function_call');

      if (calls.length === 0) {
        if (!response.output_text) throw new Error('A OpenAI não retornou uma resposta conversacional');
        try {
          return JSON.parse(response.output_text);
        } catch (error) {
          throw new Error('JSON inválido retornado pela OpenAI no chat', { cause: error });
        }
      }

      const outputs = [];
      for (const call of calls) {
        let args;
        try {
          args = JSON.parse(call.arguments);
        } catch (error) {
          throw new Error(`Argumentos inválidos para a ferramenta ${call.name}`, { cause: error });
        }
        const result = await executeTool(call.name, args);
        outputs.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result)
        });
      }
      input = [...input, ...response.output, ...outputs];
    }

    throw new Error('A OpenAI excedeu o limite de chamadas de ferramentas no chat');
  }

  return { generateStructured, converse };
}

function buildUsageLog(response, fallbackModel, operation, pricing) {
  const inputTokens = response.usage.input_tokens ?? 0;
  const cachedInputTokens = response.usage.input_tokens_details?.cached_tokens ?? 0;
  const outputTokens = response.usage.output_tokens ?? 0;
  const reasoningTokens = response.usage.output_tokens_details?.reasoning_tokens ?? 0;
  const uncachedInputTokens = Math.max(inputTokens - cachedInputTokens, 0);
  const estimatedCostUsd = (
    uncachedInputTokens * pricing.input
    + cachedInputTokens * pricing.cachedInput
    + outputTokens * pricing.output
  ) / 1_000_000;

  return {
    operation,
    model: response.model ?? fallbackModel,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens: response.usage.total_tokens ?? inputTokens + outputTokens,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(8)),
    pricingUsdPerMillionTokens: pricing
  };
}
