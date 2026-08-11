import { loadEnv } from '../config/env.js';
import { createTavilySearchClient } from '../integrations/search/tavily-search.client.js';

const env = loadEnv({ requireDiscord: false, requireAI: false });
if (env.searchProvider !== 'tavily') throw new Error('Defina SEARCH_PROVIDER=tavily para executar este diagnostico');

const client = createTavilySearchClient({ apiKey: env.tavilyApiKey });
const results = await client.searchCompanies({ regions: ['Maua - SP'], segments: ['logistica'], search: { queriesPerRun: 1, resultsPerQuery: 5 } });
console.log(JSON.stringify(results, null, 2));
