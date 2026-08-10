import cron from 'node-cron';
import { logger } from '../utils/logger.js';

export function createContentIdeasJob({ contentAgent, discordClient }) {
  let running = false;

  async function run() {
    if (running) {
      logger.warn('Job de ideias de conteúdo já está em execução');
      return [];
    }

    running = true;
    logger.info('Iniciando job de ideias de conteúdo');
    try {
      return await contentAgent.run();
    } catch (error) {
      logger.error('Falha no job de ideias de conteúdo', error);
      await discordClient.sendLog(`Falha no job de ideias de conteúdo: ${error.message}`).catch(() => undefined);
      throw error;
    } finally {
      running = false;
    }
  }

  function schedule(timezone) {
    return cron.schedule('0 7 * * 1,3,5', () => run().catch(() => undefined), { timezone });
  }

  return { run, schedule };
}
