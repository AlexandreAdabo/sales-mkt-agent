import { createContainer } from '../bootstrap.js';
import { loadEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';

let container;

try {
  const env = loadEnv();
  container = createContainer(env);
  await container.discordClient.connect();
  await container.dailyLeadsJob.run();
} catch (error) {
  logger.error('Execução manual do job de leads falhou', error);
  process.exitCode = 1;
} finally {
  container?.close();
}
