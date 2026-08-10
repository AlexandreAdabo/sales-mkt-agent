import { loadEnv } from '../src/config/env.js';
import { createOpenAIClient } from '../src/integrations/openai/openai.client.js';

try {
  const env = loadEnv({ requireDiscord: false });
  if (!env.openaiApiKey) throw new Error('OPENAI_API_KEY não configurada');
  const client = createOpenAIClient({ apiKey: env.openaiApiKey, model: env.openaiModel });
  const response = await client.generateStructured({
    schemaName: 'integration_check',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: { status: { type: 'string', enum: ['ok'] } },
      required: ['status']
    },
    prompt: 'Responda com status igual a ok.'
  });
  console.log(`OpenAI conectada com ${env.openaiModel}: ${response.status}`);
} catch (error) {
  console.error('Erro ao testar OpenAI:');
  if (error.status) {
    console.error(`A API respondeu HTTP ${error.status}. Verifique a chave, o projeto e o acesso ao modelo.`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
}
