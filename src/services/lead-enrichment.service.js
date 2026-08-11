import { logger } from '../utils/logger.js';

function buildWebsiteUrls(website) {
  const origin = new URL(website).origin;
  return [origin];
}

export function createLeadEnrichmentService({ extractClient, brasilApiClient, aiService }) {
  async function enrichLead(candidate) {
    if (!candidate.website || !extractClient) return candidate;
    let extracted;

    try {
      extracted = await extractClient.extractUrls(buildWebsiteUrls(candidate.website));
    } catch (error) {
      logger.warn(`Falha ao extrair site de ${candidate.companyName}`, error);
      return candidate;
    }

    const pages = (extracted.results ?? []).filter((page) => page.raw_content).map((page) => ({
      url: page.url,
      content: page.raw_content
    }));
    if (pages.length === 0) return candidate;

    let structured = {};
    try {
      structured = await aiService.extractLeadData({ candidate, websiteContent: pages });
    } catch (error) {
      logger.warn(`Falha ao estruturar enriquecimento de ${candidate.companyName}`, error);
    }

    let registry = null;
    if (structured.cnpj) {
      try {
        registry = await brasilApiClient.getCompanyByCnpj(structured.cnpj);
      } catch (error) {
        logger.warn(`Falha ao consultar CNPJ de ${candidate.companyName}`, error);
      }
    }

    const sources = pages.map((page) => ({ type: 'website', url: page.url }));
    return {
      ...candidate,
      companyName: structured.companyName ?? candidate.companyName,
      phone: structured.phone ?? null,
      whatsapp: structured.whatsapp ?? null,
      city: registry?.municipio ?? structured.city ?? candidate.city,
      state: registry?.uf ?? structured.state ?? candidate.state,
      segment: registry?.cnae_fiscal_descricao ?? structured.segment ?? candidate.segment,
      description: structured.description ?? candidate.description,
      companySize: structured.companySize ?? null,
      cnpj: structured.cnpj ?? null,
      signals: structured.signals ?? candidate.signals ?? [],
      researchData: { sources, phonesFound: structured.phone ? [structured.phone] : [], emailsFound: [] }
    };
  }

  return { enrichLead };
}
