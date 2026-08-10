import { loadEnv } from '../src/config/env.js';
import { createDiscordClient } from '../src/integrations/discord/discord.client.js';

let client;

try {
  const env = loadEnv({ requireAI: false });
  client = createDiscordClient(env);
  await client.connect();
  console.log('Discord conectado e canais validados sem enviar mensagens.');
} catch (error) {
  console.error('Erro ao testar Discord:');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client?.destroy();
}
