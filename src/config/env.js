import 'dotenv/config';
import path from 'node:path';

const booleanValue = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

export function loadEnv({ requireDiscord = true, requireAI = true } = {}) {
  const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '127.0.0.1',
    timezone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo',
    databasePath: path.resolve(process.env.DATABASE_PATH ?? './data/sales-mkt-agent.sqlite'),
    aiProvider: process.env.AI_PROVIDER ?? 'mock',
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
    openaiPricing: Object.freeze({
      input: Number(process.env.OPENAI_INPUT_USD_PER_1M_TOKENS ?? 0.25),
      cachedInput: Number(process.env.OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS ?? 0.025),
      output: Number(process.env.OPENAI_OUTPUT_USD_PER_1M_TOKENS ?? 2)
    }),
    searchProvider: process.env.SEARCH_PROVIDER ?? 'mock',
    tavilyApiKey: process.env.TAVILY_API_KEY || null,
    dryRun: booleanValue(process.env.DRY_RUN, false),
    internalLeadsCronEnabled: booleanValue(
      process.env.INTERNAL_LEADS_CRON_ENABLED,
      booleanValue(process.env.INTERNAL_CRON_ENABLED, true)
    ),
    internalContentCronEnabled: booleanValue(process.env.INTERNAL_CONTENT_CRON_ENABLED, true),
    discordEnabled: booleanValue(process.env.DISCORD_ENABLED, true),
    discordToken: process.env.DISCORD_TOKEN || null,
    discordGuildId: process.env.DISCORD_GUILD_ID || null,
    discordDashboardChannelId: process.env.DISCORD_DASHBOARD_CHANNEL_ID || null,
    discordLeadsChannelId: process.env.DISCORD_LEADS_CHANNEL_ID || null,
    discordContentChannelId: process.env.DISCORD_CONTENT_CHANNEL_ID || null,
    discordAgentChannelId: process.env.DISCORD_AGENT_CHANNEL_ID || null,
    discordLogsChannelId: process.env.DISCORD_LOGS_CHANNEL_ID || null
  };

  validateEnv(env, { requireDiscord, requireAI });
  return Object.freeze(env);
}

function validateEnv(env, { requireDiscord, requireAI }) {
  const errors = [];

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    errors.push('PORT deve ser um número inteiro entre 1 e 65535');
  }

  if (!['127.0.0.1', '0.0.0.0'].includes(env.host)) {
    errors.push('HOST deve ser "127.0.0.1" ou "0.0.0.0"');
  }

  if (!['mock', 'openai'].includes(env.aiProvider)) {
    errors.push('AI_PROVIDER deve ser "mock" ou "openai"');
  }

  if (requireAI && env.aiProvider === 'openai') {
    if (!env.openaiApiKey) errors.push('OPENAI_API_KEY é obrigatória quando AI_PROVIDER=openai');
    if (!env.openaiModel) errors.push('OPENAI_MODEL é obrigatória quando AI_PROVIDER=openai');
    if (env.openaiApiKey && /[<>]/.test(env.openaiApiKey)) {
      errors.push('OPENAI_API_KEY contém um delimitador < ou >; informe somente o valor da chave');
    }

    for (const [name, value] of Object.entries(env.openaiPricing)) {
      if (!Number.isFinite(value) || value < 0) {
        errors.push(`Preço OpenAI inválido para ${name}; informe um número maior ou igual a zero`);
      }
    }
  }

  if (!['mock', 'tavily'].includes(env.searchProvider)) {
    errors.push(`SEARCH_PROVIDER não suportado: ${env.searchProvider}`);
  }

  if (env.searchProvider === 'tavily') {
    if (!env.tavilyApiKey) errors.push('TAVILY_API_KEY e obrigatoria quando SEARCH_PROVIDER=tavily');
    if (env.tavilyApiKey && /[<>]/.test(env.tavilyApiKey)) errors.push('TAVILY_API_KEY deve conter somente o valor da chave');
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
      if (value && !/^\d{17,20}$/.test(value) && name !== 'DISCORD_TOKEN') {
        errors.push(`${name} deve conter um ID numérico válido do Discord`);
      }
    }

    if (env.discordDashboardChannelId && !/^\d{17,20}$/.test(env.discordDashboardChannelId)) {
      errors.push('DISCORD_DASHBOARD_CHANNEL_ID deve conter um ID numérico válido do Discord');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuração inválida:\n- ${errors.join('\n- ')}`);
  }
}
