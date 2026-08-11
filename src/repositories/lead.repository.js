import { normalizeDomain } from '../utils/domain.js';

function normalizeText(value) {
  return value?.trim().toLocaleLowerCase('pt-BR') || null;
}

function normalizeCnpj(value) {
  const digits = value?.replace(/\D/g, '');
  return digits || null;
}

export function createLeadRepository(database) {
  const listIdentityStatement = database.prepare(
    'SELECT cnpj, website, company_name, city FROM leads'
  );

  const insertStatement = database.prepare(`
    INSERT INTO leads (
      company_name, cnpj, website, phone, whatsapp, city, state, segment,
      description, company_size, score, score_reason, opportunity,
      approach_suggestion, source, source_url, research_data, status, discovered_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?)
  `);

  function listIdentities() {
    return listIdentityStatement.all().map((lead) => ({
      cnpj: normalizeCnpj(lead.cnpj),
      domain: normalizeDomain(lead.website),
      name: normalizeText(lead.company_name),
      city: normalizeText(lead.city)
    }));
  }

  function isDuplicate(candidate, identities = listIdentities()) {
    const cnpj = normalizeCnpj(candidate.cnpj);
    const domain = normalizeDomain(candidate.website);
    const name = normalizeText(candidate.companyName);
    const city = normalizeText(candidate.city);

    return identities.some((existing) => {
      if (cnpj && existing.cnpj === cnpj) return true;
      if (domain && existing.domain === domain) return true;
      return Boolean(name && city && existing.name === name && existing.city === city);
    });
  }

  function saveMany(leads) {
    const now = new Date().toISOString();
    const saved = [];
    database.exec('BEGIN;');

    try {
      for (const lead of leads) {
        const result = insertStatement.run(
          lead.companyName,
          lead.cnpj,
          lead.website,
          lead.phone,
          lead.whatsapp,
          lead.city,
          lead.state,
          lead.segment,
          lead.description,
          lead.companySize,
          lead.score,
          lead.scoreReason,
          JSON.stringify({
            possiblePains: lead.possiblePains,
            automation: lead.automationOpportunities,
            software: lead.softwareOpportunities
          }),
          lead.approachSuggestion,
          lead.source ?? null,
          lead.sourceUrl ?? lead.website ?? null,
          lead.researchData ? JSON.stringify(lead.researchData) : null,
          lead.discoveredAt ?? now,
          now,
          now
        );
        saved.push({ ...lead, id: Number(result.lastInsertRowid), status: 'NEW' });
      }
      database.exec('COMMIT;');
      return saved;
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  }

  function findById(id) {
    return database.prepare('SELECT * FROM leads WHERE id = ?').get(id) ?? null;
  }

  function search({ query = null, status = null, minScore = null, limit = 10 } = {}) {
    const normalizedQuery = query?.trim() || null;
    return database.prepare(`
      SELECT * FROM leads
      WHERE (? IS NULL OR company_name LIKE '%' || ? || '%' COLLATE NOCASE)
        AND (? IS NULL OR status = ?)
        AND (? IS NULL OR score >= ?)
      ORDER BY score DESC, discovered_at DESC
      LIMIT ?
    `).all(
      normalizedQuery, normalizedQuery,
      status, status,
      minScore, minScore,
      Math.min(Math.max(limit, 1), 20)
    );
  }

  function listRecent(limit = 10) {
    return database.prepare(`
      SELECT * FROM leads
      ORDER BY discovered_at DESC
      LIMIT ?
    `).all(Math.min(Math.max(limit, 1), 20));
  }

  function listAll() {
    return database.prepare(`
      SELECT * FROM leads
      ORDER BY score DESC, discovered_at DESC
    `).all();
  }

  return { listIdentities, isDuplicate, saveMany, findById, search, listRecent, listAll };
}
