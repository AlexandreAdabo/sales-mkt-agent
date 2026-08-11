import { createContentAgent } from './agents/content.agent.js';
import { createOutboundAgent } from './agents/outbound.agent.js';
import { createRouterAgent } from './agents/router.agent.js';
import { createDatabase } from './database/database.js';
import { createDiscordClient } from './integrations/discord/discord.client.js';
import { createBrasilApiClient } from './integrations/company/brasil-api.client.js';
import { createMockAIClient } from './integrations/openai/mock-ai.client.js';
import { createOpenAIClient } from './integrations/openai/openai.client.js';
import { createMockSearchClient } from './integrations/search/mock-search.client.js';
import { createTavilySearchClient } from './integrations/search/tavily-search.client.js';
import { createTavilyExtractClient } from './integrations/search/tavily-extract.client.js';
import { createContentIdeasJob } from './jobs/content-ideas.job.js';
import { createDailyLeadsJob } from './jobs/daily-leads.job.js';
import { createContentRepository } from './repositories/content.repository.js';
import { createConversationRepository } from './repositories/conversation.repository.js';
import { createLeadRepository } from './repositories/lead.repository.js';
import { createJobRunRepository } from './repositories/job-run.repository.js';
import { createAIService } from './services/ai.service.js';
import { createContentService } from './services/content.service.js';
import { createConversationService } from './services/conversation.service.js';
import { createLeadService } from './services/lead.service.js';
import { createLeadEnrichmentService } from './services/lead-enrichment.service.js';
import { createLeadReportService } from './services/lead-report.service.js';
import { createSearchService } from './services/search.service.js';

export function createContainer(env) {
  const database = createDatabase(env.databasePath);
  const leadRepository = createLeadRepository(database);
  const contentRepository = createContentRepository(database);
  const conversationRepository = createConversationRepository(database);
  const jobRunRepository = createJobRunRepository(database);
  const searchClient = env.searchProvider === 'tavily'
    ? createTavilySearchClient({ apiKey: env.tavilyApiKey })
    : createMockSearchClient();
  const aiClient = env.aiProvider === 'openai'
    ? createOpenAIClient({ apiKey: env.openaiApiKey, model: env.openaiModel })
    : createMockAIClient();
  const discordClient = createDiscordClient(env);
  const searchService = createSearchService(searchClient);
  const aiService = createAIService(aiClient);
  const extractClient = env.searchProvider === 'tavily'
    ? createTavilyExtractClient({ apiKey: env.tavilyApiKey })
    : null;
  const leadEnrichmentService = createLeadEnrichmentService({
    extractClient,
    brasilApiClient: createBrasilApiClient(),
    aiService
  });
  const leadService = createLeadService({ leadRepository, searchService, aiService });
  const leadReportService = createLeadReportService({ timezone: env.timezone });
  const contentService = createContentService({ contentRepository, aiService });
  const outboundAgent = createOutboundAgent({ leadService, leadEnrichmentService, leadReportService, discordClient, dryRun: env.dryRun });
  const contentAgent = createContentAgent({ contentService, discordClient });
  const conversationService = createConversationService({
    aiClient,
    conversationRepository,
    leadRepository,
    contentRepository
  });
  const routerAgent = createRouterAgent({ conversationService });
  const dailyLeadsJob = createDailyLeadsJob({
    outboundAgent,
    discordClient,
    jobRunRepository,
    lockPath: `${env.databasePath}.daily-leads.lock`,
    timezone: env.timezone
  });
  const contentIdeasJob = createContentIdeasJob({ contentAgent, discordClient });

  discordClient.setMessageHandler(routerAgent.handle);

  return {
    database,
    leadRepository,
    discordClient,
    dailyLeadsJob,
    contentIdeasJob,
    close() {
      discordClient.destroy();
      database.close();
    }
  };
}
