const SESSION_TTL_MS = 15 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export function createDocumentSessionService() {
  const sessions = new Map();

  function sessionKey(channelId, userId) {
    return `${channelId}:${userId}`;
  }

  function startSession(channelId, userId, { categoryFolder, templateId, templateName, fields }) {
    const key = sessionKey(channelId, userId);
    const session = { categoryFolder, templateId, templateName, fields, values: {}, createdAt: Date.now() };
    sessions.set(key, session);
    return session;
  }

  function getSession(channelId, userId) {
    return sessions.get(sessionKey(channelId, userId)) ?? null;
  }

  function clearSession(channelId, userId) {
    sessions.delete(sessionKey(channelId, userId));
  }

  function parseFieldLines(text) {
    const parsed = [];
    const malformedLines = [];

    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;

      const separatorIndex = line.indexOf('-');
      if (separatorIndex === -1) {
        malformedLines.push(line);
        continue;
      }

      const field = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!field || !value) {
        malformedLines.push(line);
        continue;
      }

      parsed.push({ field, value });
    }

    return { parsed, malformedLines };
  }

  function matchFieldsToSession(session, parsedLines) {
    const lowerToField = new Map(session.fields.map((field) => [field.toLowerCase(), field]));
    const matched = {};
    const unknownFields = [];

    for (const { field, value } of parsedLines) {
      const canonicalField = lowerToField.get(field.toLowerCase());
      if (!canonicalField) {
        unknownFields.push(field);
        continue;
      }
      matched[canonicalField] = value;
    }

    return { matched, unknownFields };
  }

  function applyValues(session, values) {
    Object.assign(session.values, values);
  }

  function validateComplete(session) {
    const missing = session.fields.filter((field) => !session.values[field]);
    return { missing, complete: missing.length === 0 };
  }

  function sweepExpiredSessions() {
    const now = Date.now();
    for (const [key, session] of sessions) {
      if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(key);
    }
  }

  const sweepTimer = setInterval(sweepExpiredSessions, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();

  return {
    startSession,
    getSession,
    clearSession,
    parseFieldLines,
    matchFieldsToSession,
    applyValues,
    validateComplete
  };
}
