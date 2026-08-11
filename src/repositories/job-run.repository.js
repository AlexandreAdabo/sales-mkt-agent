export function createJobRunRepository(database) {
  const startStatement = database.prepare(`
    INSERT INTO job_runs (job_name, status, started_at)
    VALUES (?, 'RUNNING', ?)
  `);
  const finishStatement = database.prepare(`
    UPDATE job_runs SET status = ?, finished_at = ?, candidates_found = ?,
      candidates_enriched = ?, leads_created = ?, error = ? WHERE id = ?
  `);

  function start(jobName) {
    return Number(startStatement.run(jobName, new Date().toISOString()).lastInsertRowid);
  }

  function finish(id, status, stats = {}, error = null) {
    finishStatement.run(
      status,
      new Date().toISOString(),
      stats.candidatesFound ?? null,
      stats.candidatesEnriched ?? null,
      stats.leadsCreated ?? null,
      error?.message?.slice(0, 1000) ?? null,
      id
    );
  }

  return { start, finish };
}
