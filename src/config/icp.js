import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadIcp() {
  const content = await readFile(path.resolve('config', 'icp.json'), 'utf8');
  const icp = JSON.parse(content);

  if (!Array.isArray(icp.regions) || !Array.isArray(icp.segments) || !Array.isArray(icp.services)) {
    throw new Error('config/icp.json deve conter regions, segments e services como listas');
  }
  if (!Number.isInteger(icp.minimumScore) || icp.minimumScore < 0 || icp.minimumScore > 100) {
    throw new Error('config/icp.json deve conter minimumScore entre 0 e 100');
  }
  if (!Number.isInteger(icp.dailyLeadLimit) || icp.dailyLeadLimit < 1) {
    throw new Error('config/icp.json deve conter dailyLeadLimit como inteiro positivo');
  }

  return icp;
}
