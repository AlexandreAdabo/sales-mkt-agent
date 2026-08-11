import cron from 'node-cron';
import { open, unlink } from 'node:fs/promises';
import { logger } from '../utils/logger.js';

export const DAILY_LEADS_CRON = '0 5 * * *';

export function createDailyLeadsJob({ outboundAgent, discordClient, jobRunRepository, lockPath, timezone = 'America/Sao_Paulo' }) {
  let running = false;

  async function run() {
    if (running) {
      logger.warn('Job diário de leads já está em execução');
      return [];
    }

    running = true;
    let lock;
    let runId;
    let completed = false;
    logger.info('Iniciando job diário de leads');
    try {
      try {
        lock = await open(lockPath, 'wx');
      } catch (error) {
        if (error.code === 'EEXIST') throw new Error('Daily leads job ja esta em execucao');
        throw error;
      }
      runId = jobRunRepository.start('DAILY_LEADS');
      const leads = await outboundAgent.run();
      jobRunRepository.finish(runId, 'SUCCESS', outboundAgent.getLastRunStats());
      completed = true;
      return leads;
    } catch (error) {
      logger.error('Falha no job diário de leads', error);
      const stats = outboundAgent.getLastRunStats();
      if (runId) {
        jobRunRepository.finish(runId, 'FAILED', stats, error);
        completed = true;
      }
      const time = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).format(new Date());
      const stage = runId ? stats.stage : 'LOCK_ACQUISITION';
      await discordClient.sendLog([
        '**DAILY LEADS FAILED**',
        `Horário: ${time}`,
        `Etapa: ${stage}`,
        '',
        `Erro: ${error.message}`
      ].join('\n')).catch(() => undefined);
      throw error;
    } finally {
      if (runId && !completed) jobRunRepository.finish(runId, 'FAILED', outboundAgent.getLastRunStats());
      await lock?.close();
      if (lock) await unlink(lockPath).catch(() => undefined);
      running = false;
    }
  }

  function schedule(timezone) {
    return cron.schedule(DAILY_LEADS_CRON, () => run().catch(() => undefined), { timezone });
  }

  return { run, schedule };
}
