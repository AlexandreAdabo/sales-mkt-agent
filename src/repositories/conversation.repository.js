export function createConversationRepository(database) {
  const insertStatement = database.prepare(`
    INSERT INTO conversation_messages (guild_id, channel_id, user_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  function add({ guildId, channelId, userId, role, content }) {
    insertStatement.run(guildId, channelId, userId, role, content, new Date().toISOString());
    database.prepare(`
      DELETE FROM conversation_messages
      WHERE guild_id = ? AND channel_id = ? AND user_id = ?
        AND id NOT IN (
          SELECT id FROM conversation_messages
          WHERE guild_id = ? AND channel_id = ? AND user_id = ?
          ORDER BY id DESC
          LIMIT 20
        )
    `).run(guildId, channelId, userId, guildId, channelId, userId);
  }

  function listRecent({ guildId, channelId, userId, limit = 20 }) {
    const rows = database.prepare(`
      SELECT role, content
      FROM conversation_messages
      WHERE guild_id = ? AND channel_id = ? AND user_id = ?
      ORDER BY id DESC
      LIMIT ?
    `).all(guildId, channelId, userId, Math.min(Math.max(limit, 1), 20));
    return rows.reverse().map(({ role, content }) => ({ role, content }));
  }

  function clear({ guildId, channelId, userId }) {
    return database.prepare(`
      DELETE FROM conversation_messages
      WHERE guild_id = ? AND channel_id = ? AND user_id = ?
    `).run(guildId, channelId, userId).changes;
  }

  return { add, listRecent, clear };
}
