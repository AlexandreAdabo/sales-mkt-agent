import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import PizZip from 'pizzip';
import { createDocumentTemplateService } from '../src/services/document-template.service.js';

async function buildFixtureDocx(dir, filename, documentXmlBody) {
  const zip = new PizZip();
  zip.file(
    'word/document.xml',
    `<?xml version="1.0"?><w:document><w:body>${documentXmlBody}</w:body></w:document>`
  );
  const buffer = zip.generate({ type: 'nodebuffer' });
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);
  return filePath;
}

test('extractFields lê placeholders únicos e na ordem de aparição', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'document-template-test-'));
  const categoryDir = path.join(dir, 'templates', 'fixture-category');
  await mkdir(categoryDir, { recursive: true });

  await buildFixtureDocx(categoryDir, 'fixture.docx', '<w:t>{{Nome}} {{Cliente}} {{Nome}} {{Servico}}</w:t>');

  const manifest = [{ id: 1, displayName: 'Fixture', filename: 'fixture.docx' }];
  await writeFile(path.join(categoryDir, 'manifest.json'), JSON.stringify(manifest));

  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    const service = createDocumentTemplateService();
    const fields = await service.extractFields('fixture-category', 1);
    assert.deepEqual(fields, ['Nome', 'Cliente', 'Servico']);
  } finally {
    process.chdir(originalCwd);
    await rm(dir, { recursive: true, force: true });
  }
});
