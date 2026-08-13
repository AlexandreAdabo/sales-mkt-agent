import { normalizeDomain } from '../utils/domain.js';

function identity(candidate) {
  const cnpj = candidate.cnpj?.replace(/\D/g, '') || '';
  const domain = normalizeDomain(candidate.website);

  const nameCity = `${candidate.companyName}|${candidate.city}`.toLocaleLowerCase('pt-BR');
  return { cnpj, domain, nameCity };
}

function normalized(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function createLeadService({ leadRepository, searchService, aiService }) {
  async function findCandidates(icp) {
    return searchService.findCandidates(icp);
  }

  function filterDuplicates(candidates) {
    const existing = leadRepository.listIdentities();
    const seen = [];

    return candidates.filter((candidate) => {
      if (leadRepository.isDuplicate(candidate, existing)) return false;
      const current = identity(candidate);
      const duplicatedInBatch = seen.some((item) => (
        (current.cnpj && item.cnpj === current.cnpj)
        || (current.domain && item.domain === current.domain)
        || item.nameCity === current.nameCity
      ));
      if (!duplicatedInBatch) seen.push(current);
      return !duplicatedInBatch;
    });
  }

  async function researchCompany(candidate) {
    return searchService.researchCompany(candidate);
  }

  function matchesIcp(candidate, icp) {
    if (candidate.segment) {
      const segment = normalized(candidate.segment);
      const matchesSegment = [...icp.segments, ...icp.segmentKeywords]
        .some((term) => segment.includes(normalized(term)));
      if (!matchesSegment) return false;
    }
    if (candidate.employeeCount != null && (
      candidate.employeeCount < icp.companySize.minEmployees
      || candidate.employeeCount > icp.companySize.maxEmployees
    )) return false;
    if (candidate.city && !icp.regions.some((region) => region.startsWith(candidate.city))) return false;
    return !(candidate.negativeSignals ?? []).some((signal) => icp.negativeSignals.includes(signal));
  }

  async function scoreLead(researchedCompany, icp) {
    const analysis = await aiService.analyzeLead(researchedCompany, icp);
    return {
      ...analysis,
      source: researchedCompany.source ?? null,
      sourceUrl: researchedCompany.sourceUrl ?? researchedCompany.website ?? null,
      researchData: researchedCompany.researchData ?? null
    };
  }

  function selectTopLeads(leads, limit = 10) {
    return [...leads].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function saveLeads(leads) {
    return leadRepository.saveMany(leads);
  }

  return { findCandidates, filterDuplicates, researchCompany, matchesIcp, scoreLead, selectTopLeads, saveLeads };
}
