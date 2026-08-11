import { assertSearchClient } from '../integrations/search/search.client.js';

export function createSearchService(searchClient) {
  const client = assertSearchClient(searchClient);

  async function findCandidates(icp) {
    return client.searchCompanies({ regions: icp.regions, segments: icp.segments, search: icp.search });
  }

  async function researchCompany(candidate) {
    return client.researchCompany(candidate);
  }

  return { findCandidates, researchCompany };
}
