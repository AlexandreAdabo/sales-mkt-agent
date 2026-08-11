import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentIdeasJsonSchema, validateContentIdeas } from '../schemas/content.schema.js';
import { leadAnalysisJsonSchema, validateLeadAnalysis } from '../schemas/lead.schema.js';
import { leadEnrichmentJsonSchema, validateLeadEnrichment } from '../schemas/lead-enrichment.schema.js';
import { validateLeadScore } from '../validators/lead-score.validator.js';

async function loadPrompt(fileName) {
  return readFile(path.resolve('prompts', fileName), 'utf8');
}

export function createAIService(aiClient) {
  async function extractLeadData({ candidate, websiteContent }) {
    const prompt = await loadPrompt('lead-enrichment.prompt.md');
    const input = { candidate, websiteContent };
    const value = await aiClient.generateStructured({
      schemaName: 'lead_enrichment',
      schema: leadEnrichmentJsonSchema,
      input,
      prompt: `${prompt}\n\nDADOS:\n${JSON.stringify(input)}`
    });
    return validateLeadEnrichment(value);
  }

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
    return validateLeadScore(validateLeadAnalysis(value));
  }

  async function generateContentIdeas(icp, previousIdeas) {
    const template = await loadPrompt('content-ideas.prompt.md');
    const input = {
      icp,
      previousIdeas: previousIdeas.map(({ front, title, platform, format, topic }) => ({ front, title, platform, format, topic }))
    };
    const value = await aiClient.generateStructured({
      schemaName: 'content_ideas',
      schema: contentIdeasJsonSchema,
      input,
      prompt: `${template}\n\nCONTEXTO:\n${JSON.stringify(input)}`
    });
    return validateContentIdeas(value);
  }

  return { extractLeadData, analyzeLead, generateContentIdeas };
}
