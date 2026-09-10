import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

function templatesDir(categoryFolder) {
  return path.resolve('templates', categoryFolder);
}

function manifestPath(categoryFolder) {
  return path.join(templatesDir(categoryFolder), 'manifest.json');
}

export async function loadManifest(categoryFolder) {
  const content = await readFile(manifestPath(categoryFolder), 'utf8');
  const manifest = JSON.parse(content);

  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error(`templates/${categoryFolder}/manifest.json deve conter uma lista não vazia de templates`);
  }

  const ids = new Set();
  for (const entry of manifest) {
    if (!Number.isInteger(entry.id) || entry.id < 1) {
      throw new Error(`Cada template do manifest de "${categoryFolder}" deve ter um "id" inteiro positivo`);
    }
    if (ids.has(entry.id)) {
      throw new Error(`Id de template duplicado no manifest de "${categoryFolder}": ${entry.id}`);
    }
    ids.add(entry.id);

    if (!entry.displayName || typeof entry.displayName !== 'string') {
      throw new Error(`Template id ${entry.id} de "${categoryFolder}" deve ter "displayName" como string`);
    }
    if (!entry.filename || typeof entry.filename !== 'string') {
      throw new Error(`Template id ${entry.id} de "${categoryFolder}" deve ter "filename" como string`);
    }

    const filePath = path.join(templatesDir(categoryFolder), entry.filename);
    if (!existsSync(filePath)) {
      throw new Error(`Arquivo de template não encontrado: ${filePath} (referenciado pelo id ${entry.id} em "${categoryFolder}")`);
    }
  }

  return manifest;
}

export function resolveTemplatePath(categoryFolder, filename) {
  return path.join(templatesDir(categoryFolder), filename);
}
