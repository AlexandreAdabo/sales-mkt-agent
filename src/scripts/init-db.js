import { createDatabase } from '../database/database.js';
import { loadEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';

try {
  const env = loadEnv({ requireDiscord: false });
  const database = createDatabase(env.databasePath);
  database.close();
  logger.info(`SQLite inicializado em ${env.databasePath}`);
} catch (error) {
  logger.error('Falha ao inicializar o SQLite', error);
  process.exitCode = 1;
}
