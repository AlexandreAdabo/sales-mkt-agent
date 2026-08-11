import OpenAI from 'openai';

export function createOpenAIClient({ apiKey, model, client = new OpenAI({ apiKey }) }) {

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

  async function converse({ instructions, messages, tools, schemaName, schema, executeTool }) {
    let input = messages.map(({ role, content }) => ({ role, content }));

    for (let round = 0; round < 5; round += 1) {
      const response = await client.responses.create({
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
      });
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
