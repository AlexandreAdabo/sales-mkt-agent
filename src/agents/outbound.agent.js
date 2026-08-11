import { loadIcp } from '../config/icp.js';
import { logger } from '../utils/logger.js';

export function createOutboundAgent({ leadService, leadReportService, discordClient }) {
  const findCandidates = (icp) => leadService.findCandidates(icp);
  const filterDuplicates = (candidates) => leadService.filterDuplicates(candidates);
  const researchCompany = (candidate) => leadService.researchCompany(candidate);
  const scoreLead = (company, icp) => leadService.scoreLead(company, icp);
  const selectTopLeads = (leads, limit) => leadService.selectTopLeads(leads, limit);
  const saveLeads = (leads) => leadService.saveLeads(leads);
  const sendToDiscord = (leads) => discordClient.sendLeadReport(leadReportService.format(leads));

  async function run() {
    const icp = await loadIcp();
    const candidates = await findCandidates(icp);
    logger.info(`${candidates.length} candidatos encontrados`);
    const newCandidates = filterDuplicates(candidates);
    logger.info(`${newCandidates.length} candidatos após deduplicação`);
    const analyzed = [];

    for (const candidate of newCandidates) {
      try {
        const researched = await researchCompany(candidate);
        analyzed.push(await scoreLead(researched, icp));
      } catch (error) {
        logger.error(`Falha ao analisar candidato ${candidate.companyName}`, error);
      }
    }

    const selected = selectTopLeads(
      analyzed.filter((lead) => lead.score >= icp.minimumScore),
      icp.dailyLeadLimit
    );
    const saved = saveLeads(selected);
    logger.info(`${saved.length} leads selecionados e persistidos`);
    if (saved.length > 0) await sendToDiscord(saved);
    logger.info('Relatório de leads processado');
    return saved;
  }

  return { run, findCandidates, filterDuplicates, researchCompany, scoreLead, selectTopLeads, saveLeads, sendToDiscord };
}
