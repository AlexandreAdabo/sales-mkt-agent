import cron from 'node-cron';
import { logger } from '../utils/logger.js';

export function createDailyLeadsJob({ outboundAgent, discordClient }) {
  let running = false;

  async function run() {
    if (running) {
      logger.warn('Job diário de leads já está em execução');
      return [];
    }

    running = true;
    logger.info('Iniciando job diário de leads');
    try {
      return await outboundAgent.run();
    } catch (error) {
      logger.error('Falha no job diário de leads', error);
      await discordClient.sendLog(`Falha no job diário de leads: ${error.message}`).catch(() => undefined);
      throw error;
    } finally {
      running = false;
    }
  }

  function schedule(timezone) {
    return cron.schedule('0 6 * * *', () => run().catch(() => undefined), { timezone });
  }

  return { run, schedule };
}
