const migrations = [
  `
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      cnpj TEXT,
      website TEXT,
      phone TEXT,
      whatsapp TEXT,
      city TEXT,
      state TEXT,
      segment TEXT,
      description TEXT,
      company_size TEXT,
      score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
      score_reason TEXT NOT NULL,
      opportunity TEXT,
      approach_suggestion TEXT,
      source TEXT,
      source_url TEXT,
      research_data TEXT,
      status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'INTERESTED', 'DISCARDED', 'CLIENT')),
      discovered_at TEXT NOT NULL,
      contacted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON leads(cnpj);
    CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(website);
    CREATE INDEX IF NOT EXISTS idx_leads_name_city ON leads(company_name, city);

    CREATE TABLE IF NOT EXISTS job_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
      started_at TEXT NOT NULL,
      finished_at TEXT,
      candidates_found INTEGER,
      candidates_enriched INTEGER,
      leads_created INTEGER,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS content_ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      format TEXT NOT NULL,
      topic TEXT NOT NULL,
      objective TEXT NOT NULL,
      audience TEXT NOT NULL,
      hook TEXT NOT NULL,
      summary TEXT NOT NULL,
      main_points TEXT NOT NULL,
      cta TEXT NOT NULL,
      relevance_reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUGGESTED' CHECK (status IN ('SUGGESTED', 'APPROVED', 'DISCARDED', 'CREATED', 'PUBLISHED')),
      generated_at TEXT NOT NULL,
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_content_status ON content_ideas(status);
    CREATE INDEX IF NOT EXISTS idx_content_generated_at ON content_ideas(generated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_content_title ON content_ideas(title);

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_conversation_context
      ON conversation_messages(guild_id, channel_id, user_id, id DESC);
  `
];

export function runMigrations(database) {
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('BEGIN;');

  try {
    for (const migration of migrations) database.exec(migration);
    const leadColumns = new Set(database.prepare('PRAGMA table_info(leads)').all().map((column) => column.name));
    if (!leadColumns.has('source')) database.exec('ALTER TABLE leads ADD COLUMN source TEXT');
    if (!leadColumns.has('source_url')) database.exec('ALTER TABLE leads ADD COLUMN source_url TEXT');
    if (!leadColumns.has('research_data')) database.exec('ALTER TABLE leads ADD COLUMN research_data TEXT');
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}
