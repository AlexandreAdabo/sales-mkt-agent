function normalize(value) {
  return value.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
}

export function createContentRepository(database) {
  const insertStatement = database.prepare(`
    INSERT INTO content_ideas (
      front, title, platform, format, topic, objective, audience, hook, summary,
      main_points, cta, relevance_reason, status, generated_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUGGESTED', ?, ?, ?)
  `);

  function listRecent(limit = 100) {
    return database.prepare(`
      SELECT * FROM content_ideas
      ORDER BY generated_at DESC
      LIMIT ?
    `).all(limit);
  }

  function isDuplicate(idea, previousIdeas = listRecent()) {
    const title = normalize(idea.title);
    const topic = normalize(idea.topic);
    const format = normalize(idea.format);

    return previousIdeas.some((previous) => (
      normalize(previous.title) === title
      || (previous.front === idea.front && normalize(previous.topic) === topic && normalize(previous.format) === format)
    ));
  }

  function saveMany(ideas) {
    const now = new Date().toISOString();
    const saved = [];
    database.exec('BEGIN;');

    try {
      for (const idea of ideas) {
        const result = insertStatement.run(
          idea.front,
          idea.title,
          idea.platform,
          idea.format,
          idea.topic,
          idea.objective,
          idea.audience,
          idea.hook,
          idea.summary,
          JSON.stringify(idea.mainPoints),
          idea.cta,
          idea.relevanceReason,
          idea.generatedAt ?? now,
          now,
          now
        );
        saved.push({ ...idea, id: Number(result.lastInsertRowid), status: 'SUGGESTED' });
      }
      database.exec('COMMIT;');
      return saved;
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  }

  function findById(id) {
    return database.prepare('SELECT * FROM content_ideas WHERE id = ?').get(id) ?? null;
  }

  function search({ query = null, status = null, platform = null, limit = 10 } = {}) {
    const normalizedQuery = query?.trim() || null;
    return database.prepare(`
      SELECT * FROM content_ideas
      WHERE (? IS NULL OR title LIKE '%' || ? || '%' COLLATE NOCASE
        OR topic LIKE '%' || ? || '%' COLLATE NOCASE
        OR front LIKE '%' || ? || '%' COLLATE NOCASE)
        AND (? IS NULL OR status = ?)
        AND (? IS NULL OR platform LIKE ? COLLATE NOCASE)
      ORDER BY generated_at DESC
      LIMIT ?
    `).all(
      normalizedQuery, normalizedQuery, normalizedQuery, normalizedQuery,
      status, status,
      platform, platform,
      Math.min(Math.max(limit, 1), 20)
    );
  }

  return { listRecent, isDuplicate, saveMany, findById, search };
}
