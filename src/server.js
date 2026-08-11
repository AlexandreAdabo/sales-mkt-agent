import { createApp } from './app.js';
import { createContainer } from './bootstrap.js';
import { loadEnv } from './config/env.js';
import { logger } from './utils/logger.js';

let container;
let server;
let scheduledTasks = [];

async function start() {
  const env = loadEnv();
  container = createContainer(env);
  await container.discordClient.connect();

  if (env.internalLeadsCronEnabled) {
    scheduledTasks.push(container.dailyLeadsJob.schedule(env.timezone));
    logger.info(`Cron de leads registrado: diariamente às 05:00 (${env.timezone})`);
  } else {
    logger.info('Cron interno de leads desabilitado; agendamento deve ser executado externamente');
  }

  if (env.internalContentCronEnabled) {
    scheduledTasks.push(container.contentIdeasJob.schedule(env.timezone));
    logger.info(`Cron de conteúdo registrado: seg/qua/sex às 05:15 (${env.timezone})`);
  } else {
    logger.info('Cron interno de conteúdo desabilitado');
  }

  const app = createApp({ leadRepository: container.leadRepository });
  await new Promise((resolve, reject) => {
    server = app.listen(env.port, env.host, resolve);
    server.once('error', reject);
  });
  logger.info(`HTTP online em http://${env.host}:${env.port}`);
}

async function shutdown(signal) {
  logger.info(`Encerrando aplicação (${signal})`);
  for (const task of scheduledTasks) task.stop();
  if (server) await new Promise((resolve) => server.close(resolve));
  container?.close();
}

process.once('SIGINT', () => shutdown('SIGINT').finally(() => process.exit(0)));
process.once('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit(0)));

start().catch((error) => {
  logger.error('Falha ao iniciar a aplicação', error);
  container?.close();
  process.exitCode = 1;
});
