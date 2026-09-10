import 'dotenv/config';

import {
  Client,
  Events,
  GatewayIntentBits
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Discord conectado como ${readyClient.user.tag}`);

  const channel = await readyClient.channels.fetch(
    process.env.DISCORD_LOGS_CHANNEL_ID
  );

  await channel.send(
    '🚀 Sales MKT Agent conectado com sucesso à VPS!'
  );
});


client.on(Events.MessageCreate, async (message) => {

  if (message.author.bot) return;

  if (message.channel.id !== process.env.DISCORD_AGENT_CHANNEL_ID) {
    return;
  }

  console.log(
    `[Discord] ${message.author.username}: ${message.content}`
  );

  if (message.content.toLowerCase() === 'ping') {
    await message.reply('pong 🏓');
  }

});
client.login(process.env.DISCORD_TOKEN);
