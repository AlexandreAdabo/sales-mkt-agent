import 'dotenv/config';
import path from 'node:path';

const booleanValue = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

export function loadEnv({ requireDiscord = true } = {}) {
  const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    timezone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo',
    databasePath: path.resolve(process.env.DATABASE_PATH ?? './data/sales-mkt-agent.sqlite'),
    aiProvider: process.env.AI_PROVIDER ?? 'mock',
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
    searchProvider: process.env.SEARCH_PROVIDER ?? 'mock',
    discordEnabled: booleanValue(process.env.DISCORD_ENABLED, true),
    discordToken: process.env.DISCORD_TOKEN || null,
    discordGuildId: process.env.DISCORD_GUILD_ID || null,
    discordLeadsChannelId: process.env.DISCORD_LEADS_CHANNEL_ID || null,
    discordContentChannelId: process.env.DISCORD_CONTENT_CHANNEL_ID || null,
    discordAgentChannelId: process.env.DISCORD_AGENT_CHANNEL_ID || null,
    discordLogsChannelId: process.env.DISCORD_LOGS_CHANNEL_ID || null
  };

  validateEnv(env, { requireDiscord });
  return Object.freeze(env);
}

function validateEnv(env, { requireDiscord }) {
  const errors = [];

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    errors.push('PORT deve ser um número inteiro entre 1 e 65535');
  }

  if (!['mock', 'openai'].includes(env.aiProvider)) {
    errors.push('AI_PROVIDER deve ser "mock" ou "openai"');
  }

  if (env.aiProvider === 'openai') {
    if (!env.openaiApiKey) errors.push('OPENAI_API_KEY é obrigatória quando AI_PROVIDER=openai');
    if (!env.openaiModel) errors.push('OPENAI_MODEL é obrigatória quando AI_PROVIDER=openai');
  }

  if (env.searchProvider !== 'mock') {
    errors.push(`SEARCH_PROVIDER não suportado: ${env.searchProvider}`);
  }

  if (requireDiscord && env.discordEnabled) {
    const discordVariables = {
      DISCORD_TOKEN: env.discordToken,
      DISCORD_GUILD_ID: env.discordGuildId,
      DISCORD_LEADS_CHANNEL_ID: env.discordLeadsChannelId,
      DISCORD_CONTENT_CHANNEL_ID: env.discordContentChannelId,
      DISCORD_AGENT_CHANNEL_ID: env.discordAgentChannelId,
      DISCORD_LOGS_CHANNEL_ID: env.discordLogsChannelId
    };

    for (const [name, value] of Object.entries(discordVariables)) {
      if (!value) errors.push(`${name} é obrigatória quando DISCORD_ENABLED=true`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuração inválida:\n- ${errors.join('\n- ')}`);
  }
}
