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

  scheduledTasks = [
    container.dailyLeadsJob.schedule(env.timezone),
    container.contentIdeasJob.schedule(env.timezone)
  ];
  logger.info(`Cron de leads registrado: diariamente às 05:00 (${env.timezone})`);
  logger.info(`Cron de conteúdo registrado: seg/qua/sex às 05:15 (${env.timezone})`);

  const app = createApp({ leadRepository: container.leadRepository });
  await new Promise((resolve, reject) => {
    server = app.listen(env.port, '0.0.0.0', resolve);
    server.once('error', reject);
  });
  logger.info(`HTTP online em http://localhost:${env.port}`);
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
