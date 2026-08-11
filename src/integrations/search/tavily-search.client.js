import { normalizeDomain } from '../../utils/domain.js';
import { logger } from '../../utils/logger.js';

const TAVILY_URL = 'https://api.tavily.com/search';
const blockedDomains = ['facebook.com', 'instagram.com', 'linkedin.com', 'wikipedia.org', 'youtube.com'];

function buildQueries({ regions, segments }) {
  return regions.flatMap((region) => segments.map((segment) => `empresas de ${segment} em ${region}`));
}

function selectQueries(queries, limit) {
  const shuffled = [...queries];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[selected]] = [shuffled[selected], shuffled[index]];
  }
  return shuffled.slice(0, limit);
}

function normalizeResult(result) {
  const domain = normalizeDomain(result.url);
  return {
    externalId: result.url ?? null,
    companyName: result.title?.trim() || null,
    website: result.url ?? null,
    city: null,
    state: null,
    segment: null,
    employeeCount: null,
    signals: [],
    negativeSignals: [],
    description: result.content ?? null,
    source: 'tavily',
    sourceUrl: result.url ?? null,
    sourceScore: result.score ?? null,
    domain
  };
}

function isValidCandidate(candidate) {
  if (!candidate.companyName || !candidate.website || !candidate.domain) return false;
  return !blockedDomains.some((domain) => candidate.domain === domain || candidate.domain.endsWith(`.${domain}`));
}

export function createTavilySearchClient({ apiKey, fetchImpl = fetch, timeoutMs = 15000 }) {
  async function search(query, maxResults) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(TAVILY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query, search_depth: 'basic', max_results: maxResults, include_answer: false, include_raw_content: false, include_usage: true }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Tavily retornou HTTP ${response.status}: ${body.slice(0, 500)}`);
    }

    const result = await response.json();
    logger.info('[SEARCH]', { query, results: result.results?.length ?? 0, credits: result.usage?.credits ?? result.usage ?? null });
    return result.results ?? [];
  }

  async function searchCompanies({ regions, segments, search: options = {} }) {
    const queries = selectQueries(buildQueries({ regions, segments }), options.queriesPerRun ?? 6);
    const responses = [];
    for (const query of queries) responses.push(...await search(query, options.resultsPerQuery ?? 8));

    const seen = new Set();
    return responses.map(normalizeResult).filter(isValidCandidate).filter((candidate) => {
      if (seen.has(candidate.domain)) return false;
      seen.add(candidate.domain);
      return true;
    });
  }

  async function researchCompany(candidate) {
    return { ...candidate, cnpj: null, phone: null, whatsapp: null, sources: candidate.sourceUrl ? [candidate.sourceUrl] : [] };
  }

  return { searchCompanies, researchCompany };
}
