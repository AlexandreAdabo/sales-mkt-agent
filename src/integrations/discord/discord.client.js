import { Client, Events, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { logger } from '../../utils/logger.js';

const MESSAGE_LIMIT = 1900;

export function splitMessage(content) {
  if (content.length <= MESSAGE_LIMIT) return [content];
  const chunks = [];
  let current = '';

  for (const line of content.split('\n')) {
    if (line.length > MESSAGE_LIMIT) {
      if (current) chunks.push(current);
      for (let index = 0; index < line.length; index += MESSAGE_LIMIT) {
        chunks.push(line.slice(index, index + MESSAGE_LIMIT));
      }
      current = '';
    } else if (`${current}\n${line}`.length > MESSAGE_LIMIT) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function valueOrNotFound(value) {
  return value || 'não encontrado';
}

export function createDiscordClient(env) {
  if (!env.discordEnabled) return createDisabledDiscordClient();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
  });
  let messageHandler = null;

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.channelId !== env.discordAgentChannelId || !messageHandler) return;

    try {
      const response = await messageHandler({
        content: message.content,
        userId: message.author.id,
        channelId: message.channelId,
        guildId: message.guildId
      });
      await sendMessage(env.discordAgentChannelId, response);
    } catch (error) {
      logger.error('Erro ao processar mensagem do canal #agente', error);
      await sendMessage(env.discordAgentChannelId, 'Não consegui processar sua mensagem agora. Tente novamente em instantes.').catch(() => undefined);
      await sendLog('Falha ao processar uma mensagem no canal #agente. Consulte os logs da aplicação.').catch((logError) => {
        logger.error('Não foi possível enviar o erro ao canal #logs', logError);
      });
    }
  });

  async function connect() {
    await client.login(env.discordToken);
    await new Promise((resolve) => {
      if (client.isReady()) return resolve();
      client.once(Events.ClientReady, resolve);
    });

    const guild = await client.guilds.fetch(env.discordGuildId);
    const channels = [
      ['dashboard', env.discordDashboardChannelId],
      ['leads', env.discordLeadsChannelId],
      ['conteúdo', env.discordContentChannelId],
      ['agente', env.discordAgentChannelId],
      ['logs', env.discordLogsChannelId]
    ].filter(([, channelId]) => channelId);

    for (const [name, channelId] of channels) {
      const channel = await guild.channels.fetch(channelId);
      if (!channel?.isTextBased() || typeof channel.send !== 'function') {
        throw new Error(`Canal #${name} inválido ou sem suporte a texto`);
      }
      const permissions = guild.members.me.permissionsIn(channel);
      if (!permissions.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
        throw new Error(`O bot não possui permissão para visualizar e enviar mensagens em #${name}`);
      }
    }
    logger.info(`Discord conectado como ${client.user.tag}`);
  }

  async function getTextChannel(channelId) {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
      throw new Error(`Canal Discord inválido ou sem suporte a texto: ${channelId}`);
    }
    return channel;
  }

  async function sendMessage(channelId, content) {
    const channel = await getTextChannel(channelId);
    for (const chunk of splitMessage(content)) await channel.send(chunk);
  }

  async function sendLeadReport(content) {
    await sendMessage(env.discordLeadsChannelId, content);
  }

  async function sendContentIdeas(ideas) {
    await sendMessage(
      env.discordContentChannelId,
      `**Ideias de conteúdo — ${new Date().toLocaleDateString('pt-BR')}**\n${ideas.length} ideia(s) nova(s).`
    );

    for (const idea of ideas) {
      await sendMessage(env.discordContentChannelId, formatIdea(idea));
    }
  }

  async function sendLog(content) {
    await sendMessage(env.discordLogsChannelId, content);
  }

  function setMessageHandler(handler) {
    messageHandler = handler;
  }

  function destroy() {
    client.destroy();
  }

  return { connect, destroy, sendMessage, sendLeadReport, sendContentIdeas, sendLog, setMessageHandler };
}

function createDisabledDiscordClient() {
  const skip = async () => undefined;
  return {
    connect: skip,
    destroy: () => undefined,
    sendMessage: skip,
    sendLeadReport: async () => logger.info('Discord desabilitado; relatório não enviado'),
    sendContentIdeas: async (ideas) => logger.info('Discord desabilitado; ideias não enviadas', { ideas: ideas.length }),
    sendLog: skip,
    setMessageHandler: () => undefined
  };
}

function formatIdea(idea) {
  return [
    `**#${idea.id} — ${idea.title}**`,
    `${idea.summary}`
  ].join('\n');
}
