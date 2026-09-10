import { readFile } from 'node:fs/promises';
import PizZip from 'pizzip';
import { DOCUMENT_CATEGORIES } from '../config/document-categories.js';
import { loadManifest, resolveTemplatePath } from '../config/document-templates.js';

const FIELD_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function createDocumentTemplateService() {
  async function listAllTemplates() {
    const flattened = [];
    let globalIndex = 1;

    for (const category of DOCUMENT_CATEGORIES) {
      const manifest = await loadManifest(category.folder);
      for (const entry of manifest) {
        flattened.push({
          globalIndex: globalIndex++,
          categoryKey: category.key,
          categoryFolder: category.folder,
          categoryDisplayName: category.displayName,
          templateId: entry.id,
          displayName: entry.displayName
        });
      }
    }

    return flattened;
  }

  async function resolveByGlobalIndex(globalIndex) {
    const all = await listAllTemplates();
    return all.find((entry) => entry.globalIndex === globalIndex) ?? null;
  }

  async function getTemplate(categoryFolder, templateId) {
    const manifest = await loadManifest(categoryFolder);
    const entry = manifest.find((item) => item.id === templateId);
    if (!entry) return null;
    return { ...entry, path: resolveTemplatePath(categoryFolder, entry.filename) };
  }

  async function extractFields(categoryFolder, templateId) {
    const template = await getTemplate(categoryFolder, templateId);
    if (!template) return null;

    const buffer = await readFile(template.path);
    const zip = new PizZip(buffer);
    const documentXml = zip.file('word/document.xml')?.asText() ?? '';

    const fields = [];
    const seen = new Set();
    for (const match of documentXml.matchAll(FIELD_PATTERN)) {
      const field = match[1].trim();
      if (!seen.has(field.toLowerCase())) {
        seen.add(field.toLowerCase());
        fields.push(field);
      }
    }

    return fields;
  }

  return { listAllTemplates, resolveByGlobalIndex, getTemplate, extractFields };
}
