import OpenAI from 'openai';

export function createOpenAIClient({ apiKey, model }) {
  const client = new OpenAI({ apiKey });

  async function generateStructured({ schemaName, schema, prompt }) {
    const response = await client.responses.create({
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
    });

    if (!response.output_text) {
      throw new Error(`A OpenAI não retornou conteúdo estruturado para ${schemaName}`);
    }

    try {
      return JSON.parse(response.output_text);
    } catch (error) {
      throw new Error(`JSON inválido retornado pela OpenAI para ${schemaName}`, { cause: error });
    }
  }

  return { generateStructured };
}
