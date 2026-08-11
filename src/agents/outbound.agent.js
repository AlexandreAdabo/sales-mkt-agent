import { loadIcp } from '../config/icp.js';
import { logger } from '../utils/logger.js';

export function createOutboundAgent({ leadService, leadEnrichmentService, leadReportService, discordClient, dryRun = false }) {
  const findCandidates = (icp) => leadService.findCandidates(icp);
  const filterDuplicates = (candidates) => leadService.filterDuplicates(candidates);
  const researchCompany = (candidate) => leadService.researchCompany(candidate);
  const scoreLead = (company, icp) => leadService.scoreLead(company, icp);
  const selectTopLeads = (leads, limit) => leadService.selectTopLeads(leads, limit);
  const saveLeads = (leads) => leadService.saveLeads(leads);
  const sendToDiscord = (leads) => discordClient.sendLeadReport(leadReportService.format(leads));

  async function run() {
    lastRunStats = { candidatesFound: 0, candidatesEnriched: 0, leadsCreated: 0, stage: 'TAVILY_SEARCH' };
    const icp = await loadIcp();
    const candidates = await findCandidates(icp);
    lastRunStats.candidatesFound = candidates.length;
    logger.info(`${candidates.length} candidatos encontrados`);
    const newCandidates = filterDuplicates(candidates);
    logger.info(`${newCandidates.length} candidatos após deduplicação`);
    const candidateLimit = newCandidates[0]?.source === 'tavily'
      ? Math.min(icp.search?.maxCandidatesForAI ?? newCandidates.length, icp.search?.maxCandidatesForEnrichment ?? newCandidates.length)
      : newCandidates.length;
    const candidatesForAI = newCandidates.slice(0, candidateLimit);
    lastRunStats.candidatesEnriched = candidatesForAI.length;
    logger.info(`${candidatesForAI.length} candidatos selecionados para analise por IA`);
    const analyzed = [];

    for (const candidate of candidatesForAI) {
      try {
        lastRunStats.stage = 'TAVILY_EXTRACT';
        const enriched = await leadEnrichmentService.enrichLead(candidate);
        lastRunStats.stage = 'OPENAI_ANALYSIS';
        const researched = await researchCompany(enriched);
        analyzed.push(await scoreLead(researched, icp));
      } catch (error) {
        logger.error(`Falha ao analisar candidato ${candidate.companyName}`, error);
      }
    }

    const selected = selectTopLeads(
      analyzed.filter((lead) => lead.score >= icp.minimumScore),
      icp.dailyLeadLimit
    );
    lastRunStats.stage = 'SQLITE_PERSIST';
    const saved = dryRun ? selected : saveLeads(selected);
    logger.info(`${saved.length} leads selecionados e persistidos`);
    if (!dryRun && saved.length > 0) {
      lastRunStats.stage = 'DISCORD_REPORT';
      await sendToDiscord(saved);
    }
    if (dryRun) logger.info('Dry-run ativo; leads nao persistidos e relatorio nao enviado');
    logger.info('Relatório de leads processado');
    lastRunStats = { ...lastRunStats, leadsCreated: dryRun ? 0 : saved.length, stage: 'COMPLETED' };
    return saved;
  }

  let lastRunStats = { candidatesFound: 0, candidatesEnriched: 0, leadsCreated: 0, stage: 'PENDING' };
  return { run, getLastRunStats: () => lastRunStats, findCandidates, filterDuplicates, researchCompany, scoreLead, selectTopLeads, saveLeads, sendToDiscord };
}
