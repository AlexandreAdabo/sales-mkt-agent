import { createContentAgent } from './agents/content.agent.js';
import { createOutboundAgent } from './agents/outbound.agent.js';
import { createRouterAgent } from './agents/router.agent.js';
import { createDatabase } from './database/database.js';
import { createDiscordClient } from './integrations/discord/discord.client.js';
import { createMockAIClient } from './integrations/openai/mock-ai.client.js';
import { createOpenAIClient } from './integrations/openai/openai.client.js';
import { createMockSearchClient } from './integrations/search/mock-search.client.js';
import { createContentIdeasJob } from './jobs/content-ideas.job.js';
import { createDailyLeadsJob } from './jobs/daily-leads.job.js';
import { createContentRepository } from './repositories/content.repository.js';
import { createConversationRepository } from './repositories/conversation.repository.js';
import { createLeadRepository } from './repositories/lead.repository.js';
import { createAIService } from './services/ai.service.js';
import { createContentService } from './services/content.service.js';
import { createConversationService } from './services/conversation.service.js';
import { createLeadService } from './services/lead.service.js';
import { createSearchService } from './services/search.service.js';

export function createContainer(env) {
  const database = createDatabase(env.databasePath);
  const leadRepository = createLeadRepository(database);
  const contentRepository = createContentRepository(database);
  const conversationRepository = createConversationRepository(database);
  const searchClient = createMockSearchClient();
  const aiClient = env.aiProvider === 'openai'
    ? createOpenAIClient({ apiKey: env.openaiApiKey, model: env.openaiModel })
    : createMockAIClient();
  const discordClient = createDiscordClient(env);
  const searchService = createSearchService(searchClient);
  const aiService = createAIService(aiClient);
  const leadService = createLeadService({ leadRepository, searchService, aiService });
  const contentService = createContentService({ contentRepository, aiService });
  const outboundAgent = createOutboundAgent({ leadService, discordClient });
  const contentAgent = createContentAgent({ contentService, discordClient });
  const conversationService = createConversationService({
    aiClient,
    conversationRepository,
    leadRepository,
    contentRepository
  });
  const routerAgent = createRouterAgent({ conversationService });
  const dailyLeadsJob = createDailyLeadsJob({ outboundAgent, discordClient });
  const contentIdeasJob = createContentIdeasJob({ contentAgent, discordClient });

  discordClient.setMessageHandler(routerAgent.handle);

  return {
    database,
    discordClient,
    dailyLeadsJob,
    contentIdeasJob,
    close() {
      discordClient.destroy();
      database.close();
    }
  };
}
