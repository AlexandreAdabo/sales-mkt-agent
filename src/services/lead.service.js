function identity(candidate) {
  const cnpj = candidate.cnpj?.replace(/\D/g, '') || '';
  let domain = '';

  try {
    domain = new URL(candidate.website).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    domain = candidate.website?.toLowerCase() || '';
  }

  const nameCity = `${candidate.companyName}|${candidate.city}`.toLocaleLowerCase('pt-BR');
  return { cnpj, domain, nameCity };
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

  async function scoreLead(researchedCompany, icp) {
    return aiService.analyzeLead(researchedCompany, icp);
  }

  function selectTopLeads(leads, limit = 10) {
    return [...leads].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function saveLeads(leads) {
    return leadRepository.saveMany(leads);
  }

  return { findCandidates, filterDuplicates, researchCompany, scoreLead, selectTopLeads, saveLeads };
}
