import { loadIcp } from '../config/icp.js';
import { logger } from '../utils/logger.js';

export function createContentAgent({ contentService, discordClient }) {
  const loadContext = () => loadIcp();
  const loadPreviousIdeas = () => contentService.loadPreviousIdeas(1000);
  const generateIdeas = (icp, previous) => contentService.generateIdeas(icp, previous);
  const filterDuplicates = (ideas, previous) => contentService.filterDuplicates(ideas, previous);
  const saveIdeas = (ideas) => contentService.saveIdeas(ideas);
  const sendToDiscord = (ideas) => discordClient.sendContentIdeas(ideas);

  async function run() {
    const [icp, previousIdeas] = await Promise.all([loadContext(), loadPreviousIdeas()]);
    const generated = await generateIdeas(icp, previousIdeas);
    const uniqueIdeas = filterDuplicates(generated, previousIdeas);
    const saved = saveIdeas(uniqueIdeas);
    logger.info(`${saved.length} ideias de conteúdo persistidas`);
    await sendToDiscord(saved);
    logger.info('Relatório de conteúdo processado');
    return saved;
  }

  return { run, loadContext, loadPreviousIdeas, generateIdeas, filterDuplicates, saveIdeas, sendToDiscord };
}
