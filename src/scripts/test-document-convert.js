import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDocumentRenderService } from '../services/document-render.service.js';
import { createDocumentTemplateService } from '../services/document-template.service.js';

async function main() {
  const [categoryFolder, templateIdArg, valuesPathArg] = process.argv.slice(2);
  if (!categoryFolder || !templateIdArg || !valuesPathArg) {
    console.error('Uso: node src/scripts/test-document-convert.js <categoryFolder> <templateId> <caminho-para-values.json>');
    process.exitCode = 1;
    return;
  }

  const templateId = Number(templateIdArg);
  const values = JSON.parse(await readFile(valuesPathArg, 'utf8'));

  const templateService = createDocumentTemplateService();
  const renderService = createDocumentRenderService();

  const template = await templateService.getTemplate(categoryFolder, templateId);
  if (!template) {
    console.error(`Template ${templateId} não encontrado no manifest de "${categoryFolder}".`);
    process.exitCode = 1;
    return;
  }

  const pdfBuffer = await renderService.generatePdf(template.path, values);
  await mkdir('tmp', { recursive: true });
  const outputPath = path.resolve('tmp', 'test-document-output.pdf');
  await writeFile(outputPath, pdfBuffer);
  console.log(`PDF gerado em ${outputPath}`);
}

main().catch((error) => {
  console.error('Falha no smoke-test de conversão de documento:', error);
  process.exitCode = 1;
});
