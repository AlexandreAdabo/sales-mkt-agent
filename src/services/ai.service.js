import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentIdeasJsonSchema, validateContentIdeas } from '../schemas/content.schema.js';
import { leadAnalysisJsonSchema, validateLeadAnalysis } from '../schemas/lead.schema.js';

async function loadPrompt(fileName) {
  return readFile(path.resolve('prompts', fileName), 'utf8');
}

export function createAIService(aiClient) {
  async function analyzeLead(candidate, icp) {
    const [researchPrompt, scorePrompt] = await Promise.all([
      loadPrompt('lead-research.prompt.md'),
      loadPrompt('lead-score.prompt.md')
    ]);
    const input = { candidate, icp };
    const value = await aiClient.generateStructured({
      schemaName: 'lead_analysis',
      schema: leadAnalysisJsonSchema,
      input,
      prompt: `${researchPrompt}\n\n${scorePrompt}\n\nDADOS:\n${JSON.stringify(input)}`
    });
    return validateLeadAnalysis(value);
  }

  async function generateContentIdeas(icp, previousIdeas) {
    const template = await loadPrompt('content-ideas.prompt.md');
    const input = {
      icp,
      previousIdeas: previousIdeas.map(({ title, platform, format, topic }) => ({ title, platform, format, topic }))
    };
    const value = await aiClient.generateStructured({
      schemaName: 'content_ideas',
      schema: contentIdeasJsonSchema,
      input,
      prompt: `${template}\n\nCONTEXTO:\n${JSON.stringify(input)}`
    });
    return validateContentIdeas(value);
  }

  return { analyzeLead, generateContentIdeas };
}

export async function chat(message) {
  if (!message?.trim()) {
    throw new Error('Mensagem não informada.');
  }

  return createResponse({
    instructions: `
Você é o assistente do projeto Sales MKT Agent.

Seu objetivo é auxiliar um desenvolvedor na prospecção comercial,
análise de empresas, automação de processos e geração de conteúdo.

Responda sempre em português do Brasil.

Seja objetivo, técnico e comercial quando necessário.
    `.trim(),

    input: message
  });
}
